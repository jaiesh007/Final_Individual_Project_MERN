const express = require("express");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  try {
    const items = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
    const unread = await Notification.countDocuments({ recipient: req.user._id, readAt: null });
    res.json({ items, unread });
  } catch { res.status(500).json({ message: "Unable to load notifications" }); }
});

router.patch("/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, readAt: null }, { $set: { readAt: new Date() } });
    res.json({ message: "All notifications marked as read" });
  } catch { res.status(500).json({ message: "Unable to update notifications" }); }
});

router.patch("/:id/read", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid notification ID" });
    const item = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { $set: { readAt: new Date() } }, { new: true });
    if (!item) return res.status(404).json({ message: "Notification not found" });
    res.json(item);
  } catch { res.status(500).json({ message: "Unable to update notification" }); }
});

module.exports = router;
