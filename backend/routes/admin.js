const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');
const Vehicle = require('../models/Vehicle');
const { protect, adminOnly } = require('../middleware/auth');

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

const normalizeFeedbackSource = (feedback) => {
  const role = feedback?.buyerId?.role;
  const source = feedback?.source || (role === 'admin' ? 'admin' : 'buyer');
  return source === 'admin' ? 'admin' : 'buyer';
};

router.use(protect, adminOnly);

router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalVehicles, totalCompanies, buyers, sellers] = await Promise.all([
      User.countDocuments(),
      Vehicle.countDocuments(),
      Company.countDocuments(),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'seller' }),
    ]);

    const companiesByType = await Company.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
    const recentUsers = await User.find({ role: { $in: ['buyer', 'seller'] } }).sort({ createdAt: -1 }).limit(6).select('-password');
    const recentCompanies = await Company.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name');
    const serviceRoleUsers = await User.find({ role: { $in: ['service_provider', 'delivery_management', 'insurance'] } }).select('-password');

    res.json({
      success: true,
      stats: { totalUsers, totalVehicles, totalCompanies, buyers, sellers },
      companiesByType,
      recentUsers,
      recentCompanies,
      serviceRoleUsers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    else query.role = { $in: ['buyer', 'seller'] };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 20;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit);

    const total = await User.countDocuments(query);
    res.json({ success: true, users, total, pages: Math.ceil(total / numericLimit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin can delete users, but not admin accounts.
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete admin' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin can add/update a seller star rating (counts toward marketplace rating).
const setSellerRating = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const seller = await User.findById(req.params.id);
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    // Admin rating must be based on existing buyer feedback.
    const buyerFeedbackCount = (seller.sellerFeedbacks || []).filter(
      (f) => f.buyerId && (f.source !== 'admin')
    ).length;
    if (buyerFeedbackCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot rate seller: no buyer feedback available yet'
      });
    }

    const existingIdx = (seller.sellerFeedbacks || []).findIndex(
      (f) => String(f.buyerId) === String(req.user._id)
    );

    if (existingIdx >= 0) {
      seller.sellerFeedbacks[existingIdx].rating = parsedRating;
      seller.sellerFeedbacks[existingIdx].comment = comment || '';
      seller.sellerFeedbacks[existingIdx].source = 'admin';
      seller.sellerFeedbacks[existingIdx].createdAt = new Date();
    } else {
      seller.sellerFeedbacks.push({
        buyerId: req.user._id,
        source: 'admin',
        rating: parsedRating,
        comment: comment || ''
      });
    }

    recalculateSellerRating(seller);
    await seller.save();

    res.json({
      success: true,
      message: 'Seller rating submitted',
      seller: {
        _id: seller._id,
        sellerRating: seller.sellerRating,
        sellerReviewCount: seller.sellerReviewCount,
        isTopRatedSeller: seller.isTopRatedSeller
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.post('/sellers/:id/rate', setSellerRating);
// Backward-compatible alias
router.post('/users/:id/rate', setSellerRating);

// Explicit admin feedback endpoint (same behavior as /rate, clearer client intent).
router.post('/sellers/:id/admin-feedback', setSellerRating);

router.get('/sellers/:id/feedback', async (req, res) => {
  try {
    const seller = await User.findById(req.params.id)
      .select('name email sellerRating sellerReviewCount isTopRatedSeller sellerFeedbacks')
      .populate('sellerFeedbacks.buyerId', 'name email role');

    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const feedbacks = (seller.sellerFeedbacks || [])
      .filter((f) => f.buyerId)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const normalizedFeedbacks = feedbacks.map((f) => ({
      _id: f._id,
      buyerId: f.buyerId,
      rating: f.rating,
      comment: f.comment,
      createdAt: f.createdAt,
      source: normalizeFeedbackSource(f)
    }));

    res.json({
      success: true,
      seller: {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        sellerRating: seller.sellerRating,
        sellerReviewCount: seller.sellerReviewCount,
        isTopRatedSeller: seller.isTopRatedSeller
      },
      feedbacks: normalizedFeedbacks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Buyer-only feedback for a seller (admin visibility requirement).
router.get('/sellers/:id/buyer-feedback', async (req, res) => {
  try {
    const seller = await User.findById(req.params.id)
      .select('name email sellerFeedbacks')
      .populate('sellerFeedbacks.buyerId', 'name email role');

    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const buyerFeedbacks = (seller.sellerFeedbacks || [])
      .filter((f) => f.buyerId && normalizeFeedbackSource(f) === 'buyer')
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map((f) => ({
        _id: f._id,
        buyerId: f.buyerId,
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt,
        source: 'buyer'
      }));

    res.json({
      success: true,
      seller: { _id: seller._id, name: seller.name, email: seller.email },
      feedbacks: buyerFeedbacks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const setTopRatedBadge = async (req, res) => {
  try {
    const { grant } = req.body;
    const seller = await User.findById(req.params.id);
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    recalculateSellerRating(seller);

    if (grant === true) {
      const eligible = seller.sellerRating >= TOP_RATED_MIN_RATING && seller.sellerReviewCount >= TOP_RATED_MIN_REVIEWS;
      if (!eligible) {
        return res.status(400).json({
          success: false,
          message: `Seller must have at least ${TOP_RATED_MIN_REVIEWS} buyer reviews and rating ${TOP_RATED_MIN_RATING}+`
        });
      }
      seller.isTopRatedSeller = true;
    } else if (grant === false) {
      seller.isTopRatedSeller = false;
    } else {
      return res.status(400).json({ success: false, message: 'grant must be true or false' });
    }

    await seller.save();
    res.json({
      success: true,
      message: seller.isTopRatedSeller ? 'Top Rated badge granted' : 'Top Rated badge removed',
      seller: {
        _id: seller._id,
        sellerRating: seller.sellerRating,
        sellerReviewCount: seller.sellerReviewCount,
        isTopRatedSeller: seller.isTopRatedSeller
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin gives/removes Top Rated badge based on buyer feedback metrics.
router.patch('/sellers/:id/top-rated', setTopRatedBadge);
// Alias for environments/clients that block PATCH.
router.post('/sellers/:id/top-rated', setTopRatedBadge);
// Backward-compatible aliases
router.patch('/users/:id/top-rated', setTopRatedBadge);
router.post('/users/:id/top-rated', setTopRatedBadge);

// Optional maintenance endpoint: rebuild top-rated badges from buyer feedback.
router.post('/sellers/recalculate-ratings', async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller' });

    for (const seller of sellers) {
      recalculateSellerRating(seller);
      await seller.save();
    }

    res.json({ success: true, message: 'Seller ratings recalculated', count: sellers.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/service-users', async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['service_provider', 'delivery_management', 'insurance'] } })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/service-users', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const allowedRoles = ['service_provider', 'delivery_management', 'insurance'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be service_provider, delivery_management, or insurance' });
    }

    const existing = await User.findOne({ role });
    if (existing) {
      return res.status(400).json({ success: false, message: `A ${role.replace('_', ' ')} user already exists: ${existing.email}` });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, phone: phone || '', role, isActive: true });
    res.status(201).json({
      success: true,
      message: `${role.replace('_', ' ')} user created`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/service-users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const serviceRoles = ['service_provider', 'delivery_management', 'insurance'];
    if (!serviceRoles.includes(user.role)) {
      return res.status(400).json({ success: false, message: 'Not a service role user' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Service user deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/companies', async (req, res) => {
  try {
    const { type, search } = req.query;
    const query = {};

    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const companies = await Company.find(query).populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, companies, total: companies.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/companies', async (req, res) => {
  try {
    const { name, type, email } = req.body;
    if (!name || !type || !email) {
      return res.status(400).json({ success: false, message: 'Name, type and email are required' });
    }

    const company = await Company.create({ ...req.body, assignedRole: req.body.type, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Company created', company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('createdBy', 'name email');

    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, message: 'Company updated', company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/companies/:id/toggle', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    company.isActive = !company.isActive;
    await company.save();
    res.json({ success: true, message: `Company ${company.isActive ? 'activated' : 'deactivated'}`, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    res.json({ success: true, message: 'Company deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/vehicles', async (req, res) => {
  try {
    const { search, sellerId, vehicleType } = req.query;
    const query = {};

    if (sellerId) query.seller = sellerId;
    if (vehicleType) query.vehicleType = vehicleType;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    const vehicles = await Vehicle.find(query)
      .populate('seller', 'name email phone sellerRating sellerReviewCount isTopRatedSeller')
      .sort({ createdAt: -1 });

    res.json({ success: true, vehicles, total: vehicles.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin moderation delete: reason is required and seller gets an in-app notification.
router.delete('/vehicles/:id', async (req, res) => {
  try {
    const { reason } = req.body || {};
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ success: false, message: 'Deletion reason is required' });
    }

    const vehicle = await Vehicle.findById(req.params.id).populate('seller', 'name email sellerNotifications');
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const seller = await User.findById(vehicle.seller?._id);
    if (seller) {
      seller.sellerNotifications = seller.sellerNotifications || [];
      seller.sellerNotifications.unshift({
        type: 'vehicle_removed',
        title: 'Vehicle listing removed by admin',
        message: `Your listing "${vehicle.title}" was removed by admin moderation.`,
        vehicleId: vehicle._id,
        vehicleTitle: vehicle.title,
        reason: String(reason).trim(),
        read: false,
        createdAt: new Date()
      });
      await seller.save();
    }

    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Vehicle removed and seller informed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
