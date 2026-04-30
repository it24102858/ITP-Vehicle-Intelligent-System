const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  // Core identity
  name: { type: String, required: [true, 'Company name is required'], trim: true, maxlength: 100 },
  type: {
    type: String, required: true,
    enum: ['service_provider', 'delivery_management', 'inspection', 'insurance', 'order_management']
  },
  assignedRole: { type: String, enum: ['service_provider', 'delivery_management', 'inspection', 'insurance', 'order_management'] },

  // Contact
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  website: { type: String, default: '' },

  // Location
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },
  zipCode: { type: String, default: '' },

  // Owner / Representative
  ownerName: { type: String, default: '' },
  ownerPhone: { type: String, default: '' },
  ownerEmail: { type: String, default: '' },

  // Business details
  registrationNumber: { type: String, default: '' },
  licenseNumber: { type: String, default: '' },
  taxId: { type: String, default: '' },
  establishedYear: { type: Number, default: null },
  employeeCount: { type: Number, default: null },

  // Service details
  description: { type: String, default: '' },
  serviceAreas: { type: String, default: '' },
  operatingHours: { type: String, default: '' },
  specializations: { type: String, default: '' },

  // Status
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

companySchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Company', companySchema);
