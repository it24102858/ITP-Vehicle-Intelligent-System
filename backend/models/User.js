const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 50 },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  
  password: { type: String, required: true, minlength: 6, select: false },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin', 'service_provider', 'delivery_management', 'insurance'],
    default: 'buyer'
  },
  phone:    { type: String, default: '' },
  avatar:   { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  // Seller-specific fields
  sellerRating:      { type: Number, default: 0, min: 0, max: 5 },
  sellerReviewCount: { type: Number, default: 0 },
  isTopRatedSeller:  { type: Boolean, default: false },
  sellerFeedbacks:   [{
    buyerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    source:    { type: String, enum: ['buyer', 'admin'], default: 'buyer' },
    rating:    { type: Number, min: 1, max: 5 },
    comment:   { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  sellerNotifications: [{
    type:       { type: String, default: 'admin_notice' },
    title:      { type: String, default: '' },
    message:    { type: String, default: '' },
    vehicleId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    vehicleTitle: { type: String, default: '' },
    reason:     { type: String, default: '' },
    read:       { type: Boolean, default: false },
    createdAt:  { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return await bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
