const express = require("express");
const CategoryRequest = require("../models/CategoryRequest");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();
const builtIn = ["Pottery", "Textiles", "Bamboo", "Metal Craft", "Wood Craft", "Jewellery", "Home Decor", "Other"];

router.get("/", async (req, res) => {
  try {
    const approved = await CategoryRequest.find({ status: "approved" }).select("name").lean();
    res.json([...new Set([...builtIn, ...approved.map((item) => item.name)])].sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    res.status(500).json({ message: "Unable to load categories" });
  }
});

router.get("/mine", protect, requireRole("artisan"), async (req, res) => {
  try {
    const requests = await CategoryRequest.find({ requestedBy: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Unable to load your category requests" });
  }
});

router.post("/requests", protect, requireRole("artisan"), async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim().replace(/\s+/g, " ") : "";
    const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
    if (name.length < 3 || name.length > 60) {
      return res.status(400).json({ message: "Category name must be between 3 and 60 characters" });
    }
    if (description.length > 500) return res.status(400).json({ message: "Description must be 500 characters or less" });

    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const alreadyApproved = await CategoryRequest.findOne({ name: { $regex: `^${escaped}$`, $options: "i" }, status: "approved" });
    const pending = await CategoryRequest.findOne({ requestedBy: req.user._id, name: { $regex: `^${escaped}$`, $options: "i" }, status: "pending" });
    const defaultsExist = builtIn.some((item) => item.toLowerCase() === name.toLowerCase());
    if (alreadyApproved || defaultsExist) return res.status(409).json({ message: "That category already exists" });
    if (pending) return res.status(409).json({ message: "You already have a pending request for this category" });

    const request = await CategoryRequest.create({ name, description, requestedBy: req.user._id });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: "Unable to submit category request" });
  }
});

module.exports = router;
