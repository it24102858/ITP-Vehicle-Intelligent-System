const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true,
    },
    orderDetails: {
      type: String,
      required: [true, 'Order details are required'],
      trim: true,
    },
    deliveryDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    agentId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('Delivery', DeliverySchema);
