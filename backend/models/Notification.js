const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    inquiry_id: { type: String, required: true },
    message_id: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    message_preview: { type: String },
    sender_id: { type: String },
    sender_name: { type: String },
    buyer_name: { type: String },
    seller_name: { type: String },
    is_read: { type: Boolean, default: false },
  },
  { timestamps: true },
);


module.exports = mongoose.model("Notification", notificationSchema);
