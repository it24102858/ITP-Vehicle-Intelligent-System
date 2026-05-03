const express = require('express');
const router = express.Router();
const {
  createDelivery,
  getAllDeliveries,
  getMyDeliveries,
  getDeliveryById,
  updateStatus,
  assignAgent,
  cancelDelivery,
  deleteDelivery,
  getStats,
} = require('../controllers/deliveryController');

// Stats — must be before /:id to avoid being caught as an ID param
router.get('/stats', getStats);

// Client — find own deliveries by name
router.get('/my', getMyDeliveries);

// CRUD

router.route('/')
  .get(getAllDeliveries)
  .post(createDelivery);

router.route('/:id')
  .get(getDeliveryById)
  .delete(deleteDelivery);

// Status & agent actions
router.put('/:id/status', updateStatus);
router.put('/:id/agent', assignAgent);
router.put('/:id/cancel', cancelDelivery);

module.exports = router;
