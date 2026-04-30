const Inquiry = require("../models/Inquiry");
const Notification = require("../models/Notification");
//create inquiry
const createInquiry = async (req, res) => {
  const {
    vehicle_id,
    buyer_id,
    buyer_name,
    buyer_phone,
    seller_id,
    seller_name,
    seller_phone,
    subject,
    message,
  } = req.body;

  const requiredFields = [
    { value: vehicle_id, name: "vehicle_id" },
    { value: buyer_id, name: "buyer_id" },
    { value: buyer_name, name: "buyer_name" },
    { value: buyer_phone, name: "buyer_phone" },
    { value: seller_id, name: "seller_id" },
    { value: subject, name: "subject" },
    { value: message, name: "message" },
  ];

  const missingField = requiredFields.find(
    (field) => !field.value || !String(field.value).trim(),
  );
  if (missingField) {
    return res.status(400).json({ error: `${missingField.name} is required.` });
  }

  const vehicleIdTrimmed = String(vehicle_id).trim();
  const legacyVehiclePattern = /^[A-Za-z]{2,3}\d{4}$/;
  const mongoObjectIdPattern = /^[a-fA-F0-9]{24}$/;
  if (
    !legacyVehiclePattern.test(vehicleIdTrimmed) &&
    !mongoObjectIdPattern.test(vehicleIdTrimmed)
  ) {
    return res
      .status(400)
      .json({
        error:
          "vehicle_id must be a Mongo ObjectId or 2/3 letters followed by 4 digits (e.g. AB1234).",
      });
  }

  const phonePattern = /^\d{10}$/;
  if (!phonePattern.test(String(buyer_phone).trim())) {
    return res
      .status(400)
      .json({ error: "buyer_phone must contain exactly 10 digits." });
  }

  if (seller_phone && !phonePattern.test(String(seller_phone).trim())) {
    return res
      .status(400)
      .json({
        error: "seller_phone must contain exactly 10 digits when provided.",
      });
  }

  try {
    const inquiry = new Inquiry({
      vehicle_id: vehicleIdTrimmed,
      buyer_id: String(buyer_id).trim(),
      buyer_name: String(buyer_name).trim(),
      buyer_phone: String(buyer_phone).trim(),
      seller_id: String(seller_id).trim(),
      seller_name: seller_name ? String(seller_name).trim() : undefined,
      seller_phone: seller_phone ? String(seller_phone).trim() : undefined,
      subject: String(subject).trim(),
      message: String(message).trim(),
    });

    const saved = await inquiry.save();

    // Create notification for seller about new inquiry
    const notification = new Notification({
      user_id: String(seller_id).trim(),
      inquiry_id: saved._id.toString(),
      message_preview: `New inquiry from ${String(buyer_name).trim()}: ${String(subject).trim()}`,
      buyer_name: String(buyer_name).trim(),
      seller_name: seller_name ? String(seller_name).trim() : undefined,
    });
    await notification.save();

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
//get all inquiries
const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//update inquiry
const updateInquiry = async (req, res) => {
  const { subject, buyer_name, buyer_phone, status } = req.body;

  const requiredFields = [
    { value: subject, name: "subject" },
    { value: buyer_name, name: "buyer_name" },
    { value: buyer_phone, name: "buyer_phone" },
  ];

  const missingField = requiredFields.find(
    (field) => !field.value || !String(field.value).trim(),
  );
  if (missingField) {
    return res.status(400).json({ error: `${missingField.name} is required.` });
  }

  const phonePattern = /^\d{10}$/;
  if (!phonePattern.test(String(buyer_phone).trim())) {
    return res
      .status(400)
      .json({ error: "buyer_phone must contain exactly 10 digits." });
  }

  try {
    const updateData = {
      subject: String(subject).trim(),
      buyer_name: String(buyer_name).trim(),
      buyer_phone: String(buyer_phone).trim(),
    };

    // Allow status to be updated if provided
    if (status && (status === "open" || status === "pending")) {
      updateData.status = status;
    }

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );

    if (!updatedInquiry) {
      return res.status(404).json({ error: "Inquiry not found." });
    }

    res.json(updatedInquiry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//delete inquiry
const deleteInquiry = async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//update inquiry status
const updateInquiryStatus = async (req, res) => {
  const { status } = req.body;

  if (!status || (status !== "open" && status !== "pending")) {
    return res
      .status(400)
      .json({ error: "Status must be either 'open' or 'pending'." });
  }

  try {
    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!updatedInquiry) {
      return res.status(404).json({ error: "Inquiry not found." });
    }

    res.json(updatedInquiry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createInquiry,
  getAllInquiries,
  updateInquiry,
  updateInquiryStatus,
  deleteInquiry,
};
