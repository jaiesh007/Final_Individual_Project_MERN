const express = require("express");
const Contact = require("../models/Contact");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (typeof name !== "string" || !name.trim() || name.trim().length > 100 ||
        typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof message !== "string" || !message.trim() || message.trim().length > 5000) {
      return res.status(400).json({ message: "Enter a valid name, email, and message (up to 5000 characters)" });
    }

    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim()
    });
    return res.status(201).json({ message: "Message submitted", contact: { id: contact._id } });
  } catch (error) {
    console.error("Contact submission failed:", error.message);
    return res.status(500).json({ message: "Unable to submit your message" });
  }
});

router.get("/", protect, requireRole("admin"), async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 }).limit(500);
    res.json(messages);
  } catch (error) {
    console.error("Fetching contact messages failed:", error.message);
    res.status(500).json({ message: "Unable to fetch messages" });
  }
});

module.exports = router;
