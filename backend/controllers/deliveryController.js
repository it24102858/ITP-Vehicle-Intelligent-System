const Delivery = require('../models/Delivery');

// Status progression order — used to enforce workflow
const STATUS_ORDER = ['Pending', 'Assigned', 'Shipped', 'Delivered'];

// ─────────────────────────────────────────────────────────
// @desc    Create a new delivery request
// @route   POST /api/deliveries
// @access  Client

const createDelivery = async (req, res, next) => {
  try {
    const { customerName, contactNumber, address, orderDetails, deliveryDate } = req.body;

    const delivery = await Delivery.create({
      customerName,
      contactNumber,
      address,
      orderDetails,
      deliveryDate: deliveryDate || null,
    });

    res.status(201).json({
      success: true,
      message: 'Delivery request created successfully',
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Get ALL deliveries (admin)
// @route   GET /api/deliveries
// @access  Admin
// ─────────────────────────────────────────────────────────
const getAllDeliveries = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const filter = {};
    if (status && status !== 'All') filter.status = status;
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const deliveries = await Delivery.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Get deliveries by customer name (client — no auth yet)
// @route   GET /api/deliveries/my?name=CustomerName
// @access  Client
// ─────────────────────────────────────────────────────────
const getMyDeliveries = async (req, res, next) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search term to find deliveries',
      });
    }

    // If they accidentally pasted a short ID with '#', strip it so it might match an address or name gracefully
    const searchTerm = name.replace(/^#/, '');

    const deliveries = await Delivery.find({
      $or: [
        { customerName: { $regex: searchTerm, $options: 'i' } },
        { contactNumber: { $regex: searchTerm, $options: 'i' } },
        { address: { $regex: searchTerm, $options: 'i' } },
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Get a single delivery by ID
// @route   GET /api/deliveries/:id
// @access  Both
// ─────────────────────────────────────────────────────────
const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Update delivery status (enforces order)
// @route   PUT /api/deliveries/:id/status
// @access  Admin
// ─────────────────────────────────────────────────────────
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    if (delivery.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot update a cancelled delivery' });
    }

    if (status !== 'Cancelled') {
      const currentIndex = STATUS_ORDER.indexOf(delivery.status);
      const newIndex = STATUS_ORDER.indexOf(status);

      // Must advance by exactly 1 step
      if (newIndex !== currentIndex + 1) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition. Current status is "${delivery.status}". Next allowed: "${STATUS_ORDER[currentIndex + 1] || 'N/A'}"`,
        });
      }
    }

    delivery.status = status;
    await delivery.save();

    res.status(200).json({ success: true, message: 'Status updated', data: delivery });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Assign a delivery agent
// @route   PUT /api/deliveries/:id/agent
// @access  Admin
// ─────────────────────────────────────────────────────────
const assignAgent = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { agentId },
      { new: true, runValidators: true }
    );

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    res.status(200).json({ success: true, message: 'Agent assigned', data: delivery });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Cancel a delivery (client — only if Pending)
// @route   PUT /api/deliveries/:id/cancel
// @access  Client
// ─────────────────────────────────────────────────────────
const cancelDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    if (delivery.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel. Delivery is already "${delivery.status}". Only Pending deliveries can be cancelled.`,
      });
    }

    delivery.status = 'Cancelled';
    await delivery.save();

    res.status(200).json({ success: true, message: 'Delivery cancelled', data: delivery });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Delete a delivery (admin)
// @route   DELETE /api/deliveries/:id
// @access  Admin
// ─────────────────────────────────────────────────────────
const deleteDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findByIdAndDelete(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    res.status(200).json({ success: true, message: 'Delivery deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Get dashboard stats
// @route   GET /api/deliveries/stats
// @access  Admin
// ─────────────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const [total, pending, assigned, shipped, delivered, cancelled] = await Promise.all([
      Delivery.countDocuments(),
      Delivery.countDocuments({ status: 'Pending' }),
      Delivery.countDocuments({ status: 'Assigned' }),
      Delivery.countDocuments({ status: 'Shipped' }),
      Delivery.countDocuments({ status: 'Delivered' }),
      Delivery.countDocuments({ status: 'Cancelled' }),
    ]);

    res.status(200).json({
      success: true,
      data: { total, pending, assigned, shipped, delivered, cancelled },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDelivery,
  getAllDeliveries,
  getMyDeliveries,
  getDeliveryById,
  updateStatus,
  assignAgent,
  cancelDelivery,
  deleteDelivery,
  getStats,
};
