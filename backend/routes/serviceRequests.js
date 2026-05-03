const express = require('express');
const ServiceRequest = require('../models/ServiceRequest');
const { protect } = require('../middleware/auth');

const router = express.Router();
const ASSIGNABLE_ROLES = ['service_provider', 'delivery_management', 'insurance'];
const SERVICE_ONLY_ROLES = ['service_provider', 'delivery_management', 'insurance'];

const isServiceUser = (role) => SERVICE_ONLY_ROLES.includes(role);

const canServiceUserManageRequest = (requestDoc, user) => {
  if (String(requestDoc.assignedProvider) === String(user._id)) return true;
  if (!requestDoc.assignedProvider && requestDoc.assignedRole === user.role) return true;
  if (!requestDoc.assignedProvider && !requestDoc.assignedRole && user.role === 'service_provider') return true;
  return false;
};

const canAccessRequest = (requestDoc, user) => {
  if (user.role === 'admin') return true;
  if (isServiceUser(user.role)) return canServiceUserManageRequest(requestDoc, user);
  return String(requestDoc.userId) === String(user._id);
};

const getServiceUserQuery = (user) => {
  const or = [
    { assignedProvider: user._id },
    { assignedProvider: { $exists: false }, assignedRole: user.role },
    { assignedProvider: null, assignedRole: user.role }
  ];

  if (user.role === 'service_provider') {
    // Backward compatibility for legacy requests created before assignment fields existed.
    or.push({ assignedProvider: { $exists: false }, assignedRole: { $exists: false } });
  }

  
  return { $or: or };
};

router.post('/', protect, async (req, res) => {
  try {
    const payload = { ...req.body, userId: req.user._id };
    if (payload.assignedRole && !ASSIGNABLE_ROLES.includes(payload.assignedRole)) {
      payload.assignedRole = undefined;
    }

    if (!payload.assignedRole) payload.assignedRole = 'service_provider';
    if (!payload.requestDate) payload.requestDate = new Date().toISOString();
    const request = await ServiceRequest.create(payload);
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    let query;
    if (req.user.role === 'admin') query = {};
    else if (isServiceUser(req.user.role)) query = getServiceUserQuery(req.user);
    else query = { userId: req.user._id };

    const data = await ServiceRequest.find(query).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/package-bookings', protect, async (req, res) => {
  try {
    let query = { requestType: 'package-booking' };
    if (req.user.role === 'admin') {
      query = { requestType: 'package-booking' };
    } else if (isServiceUser(req.user.role)) {
      query = { requestType: 'package-booking', ...getServiceUserQuery(req.user) };
    } else {
      query.userId = req.user._id;
    }

    const data = await ServiceRequest.find(query).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });
    if (!canAccessRequest(request, req.user)) return res.status(403).json({ msg: 'Not authorized' });

    await ServiceRequest.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });
    if (!canAccessRequest(request, req.user)) return res.status(403).json({ msg: 'Not authorized' });

    const updated = await ServiceRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/appointment', protect, async (req, res) => {
  const { date, fee } = req.body;
  if (!isServiceUser(req.user.role) && req.user.role !== 'admin') return res.status(403).json({ msg: 'Service role access required' });
  if (!date || !fee) return res.status(400).json({ msg: 'Date and fee required' });
  if (Number.isNaN(Number(fee))) return res.status(400).json({ msg: 'Invalid fee' });

  const selectedDate = new Date(date);
  if (selectedDate < new Date()) return res.status(400).json({ msg: 'Date must be future' });

  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });
    if (!canAccessRequest(request, req.user)) return res.status(403).json({ msg: 'Not authorized' });

    const updated = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      {
        appointmentDate: date,
        appointmentFee: Number(fee),
        status: 'Waiting Payment',
        assignedProvider: req.user._id,
        assignedRole: req.user.role === 'admin' ? request.assignedRole || 'service_provider' : req.user.role
      },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put('/:id/pay', protect, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });
    if (String(request.userId) !== String(req.user._id)) {
      return res.status(403).json({ msg: 'Only the request owner can complete payment' });
    }

    const updated = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'Paid' },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put('/:id/approve', protect, async (req, res) => {
  try {
    if (!isServiceUser(req.user.role) && req.user.role !== 'admin') return res.status(403).json({ msg: 'Service role access required' });

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });
    if (!canAccessRequest(request, req.user)) return res.status(403).json({ msg: 'Not authorized' });
    if (request.paymentStatus !== 'Paid') return res.status(400).json({ msg: 'User must pay first!' });

    request.status = 'Approved';
    request.note = req.body.note || 'Approved successfully';
    if (!request.assignedProvider && req.user.role !== 'admin') request.assignedProvider = req.user._id;
    if (!request.assignedRole && req.user.role !== 'admin') request.assignedRole = req.user.role;
    await request.save();

    res.json(request);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put('/:id/reject', protect, async (req, res) => {
  try {
    if (!isServiceUser(req.user.role) && req.user.role !== 'admin') return res.status(403).json({ msg: 'Service role access required' });
    const existing = await ServiceRequest.findById(req.params.id);
    if (!existing) return res.status(404).json({ msg: 'Request not found' });
    if (!canAccessRequest(existing, req.user)) return res.status(403).json({ msg: 'Not authorized' });

    const update = { status: 'Rejected' };
    if (!existing.assignedProvider && req.user.role !== 'admin') update.assignedProvider = req.user._id;
    if (!existing.assignedRole && req.user.role !== 'admin') update.assignedRole = req.user.role;
    const request = await ServiceRequest.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(request);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
