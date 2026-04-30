const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    inquiry_id: { type: String, required: true },
    sender_id: { type: String, required: true },
    sender_name: { type: String, default: "User" },
    buyer_id: { type: String, required: true },
    seller_id: { type: String, required: true },
    reply_to: { type: String, default: null },
    message_body: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true },
);


module.exports = mongoose.model("Message", messageSchema);
