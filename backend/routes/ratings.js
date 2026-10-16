const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const ProductRating = require("../models/ProductRating");
const Notification = require("../models/Notification");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/:productId", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product ID" });
    const [summary] = await ProductRating.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(req.params.productId) } },
      { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    const reviews = await ProductRating.find({ product: req.params.productId }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ average: summary ? Math.round(summary.average * 10) / 10 : 0, count: summary?.count || 0, reviews });
  } catch { res.status(500).json({ message: "Unable to load ratings" }); }
});

router.post("/:productId", protect, requireRole("customer"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product ID" });
    const rating = Number(req.body?.rating);
    const review = typeof req.body?.review === "string" ? req.body.review.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: "Choose a rating from 1 to 5 stars" });
    if (review.length > 1000) return res.status(400).json({ message: "Review must be 1000 characters or fewer" });
    const product = await Product.findById(req.params.productId).select("name artisan");
    if (!product) return res.status(404).json({ message: "Product not found" });
    const result = await ProductRating.findOneAndUpdate(
      { product: product._id, customer: req.user._id },
      { $set: { rating, review, customerName: req.user.name } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    await Notification.create({ recipient: product.artisan, type: "comment", title: "New product review", body: `${req.user.name} reviewed ${product.name}.`, link: "/seller/reviews" });
    res.status(201).json(result);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "A review already exists. Please try again." });
    res.status(500).json({ message: "Unable to save your review" });
  }
});

module.exports = router;
