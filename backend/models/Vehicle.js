const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  title:        { type: String, required: [true, 'Title is required'], trim: true },
  make:         { type: String, required: true },
  model:        { type: String, required: true },
  year:         { type: Number, required: true },
  price:        { type: Number, required: true },
  mileage:      { type: Number, default: 0 },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'electric', 'hybrid'],
    default: 'petrol'
  },
  transmission: {
    type: String,
    enum: ['manual', 'automatic'],
    default: 'manual'
  },
  condition: {
    type: String,
    enum: ['new', 'used', 'certified'],
    default: 'used'
  },
  // NEW: Local or Import
  vehicleType: {
    type: String,
    enum: ['local', 'import'],
    default: 'local'
  },
  description: { type: String, default: '' },
  images:      [{ type: String }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'pending'],
    default: 'available'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);