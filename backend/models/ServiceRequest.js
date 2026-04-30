const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    problem: String,
    vehicle: String,
    brand: String,
    year: String,
    requestType: {
      type: String,
      enum: ['custom', 'package-booking'],
      default: 'custom'
    },
    packageType: String,
    serviceName: String,
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceApplication'
    },
    assignedRole: {
      type: String,
      enum: ['service_provider', 'delivery_management', 'insurance']
    },
    assignedProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestDate: String,
    appointmentDate: String,
    appointmentFee: Number,
    paymentStatus: { type: String, default: 'Unpaid' },
    status: { type: String, default: 'Pending' },
    note: String
  },
  { timestamps: true }
  
);

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
