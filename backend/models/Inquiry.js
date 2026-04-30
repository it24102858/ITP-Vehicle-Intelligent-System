const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    vehicle_id: { type: String, required: true },
    buyer_id: { type: String, required: true },
    buyer_name: { type: String, required: true },
    buyer_phone: { type: String, required: true },
    seller_id: { type: String, required: true },
    seller_name: { type: String },
    seller_phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: "open" },
  },
  { timestamps: true },
);


module.exports = mongoose.model("Inquiry", inquirySchema);
