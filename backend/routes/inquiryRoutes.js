const express = require("express");
const router = express.Router();
const inquiryController = require("../controllers/inquiryController");
const messageController = require("../controllers/messageController");

// Message routes (must come first - more specific)
router.post("/messages", messageController.sendMessage);
router.get("/messages/:inquiryId", messageController.getMessagesForInquiry);
router.patch("/messages/:id", messageController.editMessage);
router.delete("/messages/:id", messageController.deleteMessage);

// Inquiry routes (less specific)
router.post("/", inquiryController.createInquiry);
router.get("/", inquiryController.getAllInquiries);
router.patch("/:id/status", inquiryController.updateInquiryStatus);
router.patch("/:id", inquiryController.updateInquiry);
router.delete("/:id", inquiryController.deleteInquiry);

module.exports = router;
