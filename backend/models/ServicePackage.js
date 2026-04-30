const mongoose = require('mongoose');

const servicePackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: String, required: true, trim: true },
    type: { type: String, enum: ['normal', 'promotion'], required: true },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    promotionTopic: { type: String, trim: true },
    promotionStartDate: { type: Date },
    promotionEndDate: { type: Date },
    finalPrice: { type: Number },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdByRole: {
      type: String,
      enum: ['admin', 'service_provider', 'delivery_management', 'insurance']
    }
  },
  { timestamps: true }
);

servicePackageSchema.pre('validate', function(next) {
  if (this.type === 'promotion') {
    if (this.discount === undefined || this.discount === null || Number(this.discount) <= 0) {
      this.invalidate('discount', 'Discount required for promotion');
    }
    if (!this.promotionTopic || !this.promotionTopic.trim()) {
      this.invalidate('promotionTopic', 'Promotion topic is required');
    }
    if (!this.promotionStartDate) {
      this.invalidate('promotionStartDate', 'Promotion start date is required');
    }
    if (!this.promotionEndDate) {
      this.invalidate('promotionEndDate', 'Promotion end date is required');
    }
    if (this.promotionStartDate && this.promotionEndDate) {
      const start = new Date(this.promotionStartDate);
      const end = new Date(this.promotionEndDate);
      if (end < start) {
        this.invalidate('promotionEndDate', 'Promotion end date must be after start date');
      }
    }
  }
  next();
});

servicePackageSchema.pre('save', function(next) {
  if (this.type === 'promotion') {
    this.finalPrice = this.price - (this.price * this.discount) / 100;
  } else {
    this.finalPrice = this.price;
  }
  next();
  
});

module.exports = mongoose.model('ServicePackage', servicePackageSchema);
