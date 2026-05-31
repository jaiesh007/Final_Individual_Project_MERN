const express = require("express");
const Contact = require("../models/Contact");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const contact = await Contact.create(req.body);
    res.status(201).json({ message: "Message submitted", contact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", protect, requireRole("admin"), async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
