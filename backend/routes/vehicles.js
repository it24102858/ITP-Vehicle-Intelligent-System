const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { protect, sellerOnly } = require('../middleware/auth');

const TOP_RATED_MIN_RATING = 4.5;
const TOP_RATED_MIN_REVIEWS = 3;

const recalculateSellerRating = (seller) => {
  const buyerFeedbacks = (seller.sellerFeedbacks || []).filter(f => f.buyerId && f.source !== 'admin');
  if (!buyerFeedbacks.length) {
    seller.sellerRating = 0;
    seller.sellerReviewCount = 0;
    seller.isTopRatedSeller = false;
    return;
  }

  const total = buyerFeedbacks.reduce((sum, f) => sum + Number(f.rating || 0), 0);
  seller.sellerRating = Math.round((total / buyerFeedbacks.length) * 10) / 10;
  seller.sellerReviewCount = buyerFeedbacks.length;
  const eligible = seller.sellerRating >= TOP_RATED_MIN_RATING && seller.sellerReviewCount >= TOP_RATED_MIN_REVIEWS;
  if (!eligible) seller.isTopRatedSeller = false;
};

// /seller/my-listings MUST come before /:id
router.get('/seller/my-listings', protect, sellerOnly, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/seller/notifications', protect, sellerOnly, async (req, res) => {
  try {
    const seller = await User.findById(req.user._id).select('sellerNotifications');
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    const notifications = (seller.sellerNotifications || []).slice(0, 20);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/seller/feedbacks', protect, sellerOnly, async (req, res) => {
  try {
    const seller = await User.findById(req.user._id)
      .select('sellerRating sellerReviewCount isTopRatedSeller sellerFeedbacks')
      .populate('sellerFeedbacks.buyerId', 'name email role');

    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    const feedbacks = (seller.sellerFeedbacks || [])
      .filter((f) => f.buyerId)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map((f) => ({
        _id: f._id,
        buyerId: f.buyerId,
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt,
        source: f.source || (f.buyerId?.role === 'admin' ? 'admin' : 'buyer')
      }));

    res.json({
      success: true,
      seller: {
        _id: seller._id,
        sellerRating: seller.sellerRating,
        sellerReviewCount: seller.sellerReviewCount,
        isTopRatedSeller: seller.isTopRatedSeller
      },
      feedbacks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search, make, fuelType, condition, vehicleType, minPrice, maxPrice, sort, sellerRating, topRated } = req.query;
    const query = { status: 'available' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    if (make) query.make = { $regex: make, $options: 'i' };
    if (fuelType) query.fuelType = fuelType;
    if (condition) query.condition = condition;
    if (vehicleType) query.vehicleType = vehicleType;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice, 10);
      if (maxPrice) query.price.$lte = parseInt(maxPrice, 10);
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'year_desc') sortObj = { year: -1 };
    if (sort === 'rating_desc') sortObj = {};

    let vehicles = await Vehicle.find(query)
      .populate('seller', 'name email phone sellerRating sellerReviewCount isTopRatedSeller')
      .sort(sortObj);

    if (sellerRating) {
      const minRating = parseFloat(sellerRating);
      vehicles = vehicles.filter(v => (v.seller?.sellerRating || 0) >= minRating);
    }

    if (topRated === 'true') {
      vehicles = vehicles.filter(v => v.seller?.isTopRatedSeller);
    }

    if (sort === 'rating_desc') {
      vehicles.sort((a, b) => (b.seller?.sellerRating || 0) - (a.seller?.sellerRating || 0));
    }

    res.json({ success: true, vehicles, count: vehicles.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      'seller',
      'name email phone sellerRating sellerReviewCount isTopRatedSeller sellerFeedbacks'
    );
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    await vehicle.populate({
      path: 'seller',
      populate: { path: 'sellerFeedbacks.buyerId', select: 'name email role' }
    });

    const vehicleObj = vehicle.toObject();
    const normalizedFeedbacks = (vehicleObj?.seller?.sellerFeedbacks || []).map((f) => ({
      ...f,
      source: f.source || (f.buyerId?.role === 'admin' ? 'admin' : 'buyer')
    }));
    if (vehicleObj?.seller) vehicleObj.seller.sellerFeedbacks = normalizedFeedbacks;

    res.json({ success: true, vehicle: vehicleObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Buyer feedback drives seller rating and top-rated badge.
router.post('/:id/feedback', protect, async (req, res) => {
  try {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ success: false, message: 'Only buyers can submit feedback' });
    }

    const { rating, comment } = req.body;
    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const vehicle = await Vehicle.findById(req.params.id).populate('seller', 'name role sellerFeedbacks');
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    if (!vehicle.seller || vehicle.seller.role !== 'seller') {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    if (String(vehicle.seller._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself' });
    }

    const seller = await User.findById(vehicle.seller._id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    seller.sellerFeedbacks = seller.sellerFeedbacks.filter(f => String(f.buyerId) !== String(req.user._id));
    seller.sellerFeedbacks.push({ buyerId: req.user._id, source: 'buyer', rating: parsedRating, comment: comment || '' });
    recalculateSellerRating(seller);

    await seller.save();

    res.json({
      success: true,
      message: 'Feedback submitted',
      sellerRating: seller.sellerRating,
      sellerReviewCount: seller.sellerReviewCount,
      isTopRatedSeller: seller.isTopRatedSeller
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Buyer can edit previously submitted feedback for this seller.
router.put('/:id/feedback', protect, async (req, res) => {
  try {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ success: false, message: 'Only buyers can update feedback' });
    }

    const { rating, comment } = req.body;
    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const vehicle = await Vehicle.findById(req.params.id).populate('seller', 'name role');
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    if (!vehicle.seller || vehicle.seller.role !== 'seller') {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const seller = await User.findById(vehicle.seller._id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    const idx = (seller.sellerFeedbacks || []).findIndex(
      (f) =>
        String(f.buyerId) === String(req.user._id) &&
        (f.source !== 'admin')
    );

    if (idx < 0) {
      return res.status(404).json({ success: false, message: 'No feedback found to update' });
    }

    seller.sellerFeedbacks[idx].rating = parsedRating;
    seller.sellerFeedbacks[idx].comment = comment || '';
    seller.sellerFeedbacks[idx].source = 'buyer';
    seller.sellerFeedbacks[idx].createdAt = new Date();

    recalculateSellerRating(seller);
    await seller.save();

    res.json({
      success: true,
      message: 'Feedback updated',
      sellerRating: seller.sellerRating,
      sellerReviewCount: seller.sellerReviewCount,
      isTopRatedSeller: seller.isTopRatedSeller
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Buyer can delete previously submitted feedback for this seller.
router.delete('/:id/feedback', protect, async (req, res) => {
  try {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ success: false, message: 'Only buyers can delete feedback' });
    }

    const vehicle = await Vehicle.findById(req.params.id).populate('seller', 'name role');
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    if (!vehicle.seller || vehicle.seller.role !== 'seller') {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const seller = await User.findById(vehicle.seller._id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    const before = (seller.sellerFeedbacks || []).length;
    seller.sellerFeedbacks = (seller.sellerFeedbacks || []).filter(
      (f) => !(String(f.buyerId) === String(req.user._id) && f.source !== 'admin')
    );

    if (seller.sellerFeedbacks.length === before) {
      return res.status(404).json({ success: false, message: 'No feedback found to delete' });
    }

    recalculateSellerRating(seller);
    await seller.save();

    res.json({
      success: true,
      message: 'Feedback deleted',
      sellerRating: seller.sellerRating,
      sellerReviewCount: seller.sellerReviewCount,
      isTopRatedSeller: seller.isTopRatedSeller
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, sellerOnly, async (req, res) => {
  try {
    const { title, make, model, year, price, mileage, fuelType, transmission, condition, vehicleType, description, images } = req.body;
    if (!title || !make || !model || !year || !price) {
      return res.status(400).json({ success: false, message: 'Title, make, model, year and price are required' });
    }

    const vehicle = await Vehicle.create({
      title,
      make,
      model,
      year: Number(year),
      price: Number(price),
      mileage: Number(mileage) || 0,
      fuelType,
      transmission,
      condition,
      vehicleType: vehicleType || 'local',
      description,
      images: images || [],
      seller: req.user._id
    });

    res.status(201).json({ success: true, message: 'Vehicle listed', vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, sellerOnly, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, seller: req.user._id });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Not found or unauthorized' });

    const updated = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Vehicle updated', vehicle: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, sellerOnly, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, seller: req.user._id });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Not found or unauthorized' });

    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
