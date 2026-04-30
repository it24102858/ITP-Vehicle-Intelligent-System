const Message = require("../models/Message");
const Notification = require("../models/Notification");
const Inquiry = require("../models/Inquiry");

const sendMessage = async (req, res) => {
  const {
    inquiry_id,
    sender_id,
    sender_name,
    buyer_id,
    seller_id,
    message_body,
    reply_to,
  } = req.body;

  const requiredFields = [
    { value: inquiry_id, name: "inquiry_id" },
    { value: sender_id, name: "sender_id" },
    { value: buyer_id, name: "buyer_id" },
    { value: seller_id, name: "seller_id" },
    { value: message_body, name: "message_body" },
  ];

  const missingField = requiredFields.find(
    (field) => !field.value || !String(field.value).trim(),
  );
  if (missingField) {
    return res.status(400).json({ error: `${missingField.name} is required.` });
  }

  try {
    // Validate that sender is either the buyer or seller in this inquiry
    const senderIdTrimmed = String(sender_id).trim();
    const buyerIdTrimmed = String(buyer_id).trim();
    const sellerIdTrimmed = String(seller_id).trim();

    if (
      senderIdTrimmed !== buyerIdTrimmed &&
      senderIdTrimmed !== sellerIdTrimmed
    ) {
      return res
        .status(403)
        .json({
          error:
            "You are not part of this inquiry. Only the buyer or seller can send messages.",
        });
    }

    const msg = new Message({
      inquiry_id: String(inquiry_id).trim(),
      sender_id: senderIdTrimmed,
      sender_name: sender_name ? String(sender_name).trim() : "User",
      buyer_id: buyerIdTrimmed,
      seller_id: sellerIdTrimmed,
      reply_to: reply_to ? String(reply_to).trim() : null,
      message_body: String(message_body).trim(),
    });
    const saved = await msg.save();

    // Fetch inquiry to get accurate buyer and seller names
    const inquiry = await Inquiry.findById(String(inquiry_id).trim());

    // Create notification for the other party
    const recipientId =
      senderIdTrimmed === buyerIdTrimmed ? sellerIdTrimmed : buyerIdTrimmed;

    // Determine sender name based on who is sending
    let notificationSenderName = "User";

    if (senderIdTrimmed === buyerIdTrimmed && inquiry?.buyer_name) {
      // Buyer is sending
      notificationSenderName = inquiry.buyer_name;
    } else if (senderIdTrimmed === sellerIdTrimmed && inquiry?.seller_name) {
      // Seller is sending
      notificationSenderName = inquiry.seller_name;
    }

    const notification = new Notification({
      user_id: recipientId,
      inquiry_id: String(inquiry_id).trim(),
      message_id: saved._id,
      message_preview: String(message_body).trim().substring(0, 100),
      sender_id: senderIdTrimmed,
      sender_name: notificationSenderName,
      buyer_name: inquiry?.buyer_name,
      seller_name: inquiry?.seller_name,
    });
    await notification.save();

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getMessagesForInquiry = async (req, res) => {
  try {
    const messages = await Message.find({
      inquiry_id: req.params.inquiryId,
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const editMessage = async (req, res) => {
  const { message_body } = req.body;
  const { id } = req.params;

  if (!message_body || !String(message_body).trim()) {
    return res.status(400).json({ error: "message_body is required." });
  }

  try {
    const updatedMessage = await Message.findByIdAndUpdate(
      id,
      {
        message_body: String(message_body).trim(),
        isEdited: true,
        editedAt: new Date(),
      },
      { new: true },
    );

    if (!updatedMessage) {
      return res.status(404).json({ error: "Message not found." });
    }

    res.json(updatedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteMessage = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedMessage = await Message.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({ error: "Message not found." });
    }

    // Delete the notification for this specific message
    await Notification.deleteOne({ message_id: deletedMessage._id });

    res.json({
      message: "Message and related notification deleted successfully.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  sendMessage,
  getMessagesForInquiry,
  editMessage,
  deleteMessage,
};
