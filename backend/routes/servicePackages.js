const express = require('express');
const ServicePackage = require('../models/ServicePackage');
const { protect, serviceRoleOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
const SERVICE_ONLY_ROLES = ['service_provider', 'delivery_management', 'insurance'];
const isServiceUser = (role) => SERVICE_ONLY_ROLES.includes(role);

router.get('/normal', async (req, res) => {
  try {
    const query = { type: 'normal' };
    if (isServiceUser(req.user.role)) query.createdBy = req.user._id;
    const data = await ServicePackage.find(query).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/normal', serviceRoleOnly, async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;
    if (!name || price === undefined || price === '' || !duration) {
      return res.status(400).json({ msg: 'Name, duration and price are required' });
    }

    const created = await ServicePackage.create({
      name,
      description: description?.trim() || '',
      price: Number(price),
      duration,
      type: 'normal',
      createdBy: req.user._id,
      createdByRole: req.user.role
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put('/normal/:id', serviceRoleOnly, async (req, res) => {
  try {
    const query = { _id: req.params.id, type: 'normal' };
    if (isServiceUser(req.user.role)) query.createdBy = req.user._id;

    const updated = await ServicePackage.findOneAndUpdate(
      query,
      {
        name: req.body.name,
        description: req.body.description || '',
        price: Number(req.body.price),
        duration: req.body.duration
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ msg: 'Package not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete('/normal/:id', serviceRoleOnly, async (req, res) => {
  try {
    const query = { _id: req.params.id, type: 'normal' };
    if (isServiceUser(req.user.role)) query.createdBy = req.user._id;
    const deleted = await ServicePackage.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ msg: 'Package not found' });
    res.json({ msg: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get('/promotion', async (req, res) => {
  try {
    const query = { type: 'promotion' };
    if (isServiceUser(req.user.role)) query.createdBy = req.user._id;
    const data = await ServicePackage.find(query).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/promotion', serviceRoleOnly, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      duration,
      discount,
      promotionTopic,
      promotionStartDate,
      promotionEndDate
    } = req.body;
    if (
      !name ||
      price === undefined ||
      price === '' ||
      !duration ||
      discount === undefined ||
      !promotionTopic ||
      !String(promotionTopic).trim() ||
      !promotionStartDate ||
      !promotionEndDate
    ) {
      return res.status(400).json({
        msg: 'Name, duration, price, discount, promotion topic, start date and end date are required'
      });
    }

    //Start and End date validation with API

    const startDate = new Date(promotionStartDate);
    const endDate = new Date(promotionEndDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ msg: 'Invalid promotion date period' });
    }
    if (endDate < startDate) {
      return res.status(400).json({ msg: 'Promotion end date must be after start date' });
    }

    const created = await ServicePackage.create({
      name,
      description: description?.trim() || '',
      price: Number(price),
      duration,
      type: 'promotion',
      discount: Number(discount),
      promotionTopic: promotionTopic.trim(),
      promotionStartDate: startDate,
      promotionEndDate: endDate,
      createdBy: req.user._id,
      createdByRole: req.user.role
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put('/promotion/:id', serviceRoleOnly, async (req, res) => {
  try {
    const { promotionStartDate, promotionEndDate, promotionTopic } = req.body;
    if (!promotionStartDate || !promotionEndDate || !promotionTopic || !String(promotionTopic).trim()) {
      return res.status(400).json({ msg: 'Promotion topic, start date and end date are required' });
    }

    // Same date Validation

    const startDate = new Date(promotionStartDate);
    const endDate = new Date(promotionEndDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ msg: 'Invalid promotion date period' });
    }
    if (endDate < startDate) {
      return res.status(400).json({ msg: 'Promotion end date must be after start date' });
    }

    const query = { _id: req.params.id, type: 'promotion' };
    if (isServiceUser(req.user.role)) query.createdBy = req.user._id;

    const updated = await ServicePackage.findOneAndUpdate(
      query,
        {
          name: req.body.name,
          description: req.body.description || '',
          price: Number(req.body.price),
          duration: req.body.duration,
        discount: Number(req.body.discount),
        promotionTopic: req.body.promotionTopic,
        promotionStartDate: startDate,
        promotionEndDate: endDate
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ msg: 'Promotion not found' });

    updated.finalPrice = updated.price - (updated.price * updated.discount) / 100;
    await updated.save();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete('/promotion/:id', serviceRoleOnly, async (req, res) => {
  try {
    const query = { _id: req.params.id, type: 'promotion' };
    if (isServiceUser(req.user.role)) query.createdBy = req.user._id;
    const deleted = await ServicePackage.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ msg: 'Promotion not found' });
    res.json({ msg: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
