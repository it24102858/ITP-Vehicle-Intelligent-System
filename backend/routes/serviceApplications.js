const express = require('express');
const ServiceApplication = require('../models/ServiceApplication');
const ServiceRequest = require('../models/ServiceRequest');
const ServicePackage = require('../models/ServicePackage');
const { protect } = require('../middleware/auth');

const router = express.Router();
const SERVICE_ROLES = ['admin', 'service_provider', 'delivery_management', 'insurance'];

router.post('/', protect, async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.userId = req.user._id;

    if (payload.type === 'promotion') {
      payload.finalPrice = payload.finalPrice ?? payload.price;
      payload.price = payload.finalPrice;
    }

    const app = await ServiceApplication.create(payload);
    let assignedProvider;
    let assignedRole;

    if (payload.packageId) {
      const selectedPackage = await ServicePackage.findById(payload.packageId).select('createdBy createdByRole');
      if (selectedPackage) {
        assignedProvider = selectedPackage.createdBy || undefined;
        assignedRole = selectedPackage.createdByRole || undefined;
      }
    }

    await ServiceRequest.create({
      problem: `Package booking: ${app.name}`,
      vehicle: app.type === 'promotion' ? 'Promotion Package' : 'Normal Package',
      requestDate: new Date().toISOString(),
      status: 'Pending',
      paymentStatus: 'Unpaid',
      requestType: 'package-booking',
      packageType: app.type || 'normal',
      serviceName: app.name,
      applicationId: app._id,
      userId: req.user._id,
      assignedProvider,
      assignedRole: assignedRole || 'service_provider'
    });

    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const query = SERVICE_ROLES.includes(req.user.role) ? {} : { userId: req.user._id };
    const apps = await ServiceApplication.find(query).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const app = await ServiceApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const canManage = SERVICE_ROLES.includes(req.user.role) || String(app.userId) === String(req.user._id);
    if (!canManage) return res.status(403).json({ error: 'Not authorized' });

    await ServiceApplication.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
