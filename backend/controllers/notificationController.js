const Notification = require("../models/Notification");

const createNotification = async (req, res) => {
  try {
    const notification = new Notification(req.body);
    const saved = await notification.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user_id: req.params.userId,
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { is_read: true },
      { new: true },
    );
    if (!updated)
      return res.status(404).json({ error: "Notification not found." });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationRead,
  deleteNotification,
};
