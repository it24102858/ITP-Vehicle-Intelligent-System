const mongoose = require('mongoose');

const serviceApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    price: Number,
    originalPrice: Number,
    discount: Number,
    finalPrice: Number,
    type: String,
    applyDate: Date,
    appointmentDate: Date,
    fee: Number,
    status: { type: String, default: 'Pending' }
  },
  { timestamps: true }
  
);

module.exports = mongoose.model('ServiceApplication', serviceApplicationSchema);
