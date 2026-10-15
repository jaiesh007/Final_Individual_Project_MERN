const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const CategoryRequest = require("../models/CategoryRequest");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(protect, requireRole("admin"));

const pageOptions = (query) => ({
  page: Math.max(1, Math.min(1000000, Number.parseInt(query.page, 10) || 1)),
  limit: Math.max(1, Math.min(50, Number.parseInt(query.limit, 10) || 10))
});
const pageResponse = (docs, total, page, limit) => ({
  items: docs, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit))
});

router.get("/overview", async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [users, pendingArtisans, products, orders, sales, monthly, topProducts, topSellers, categoryBreakdown] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "artisan", artisanStatus: "pending" }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $match: { status: { $ne: "Cancelled" } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: start }, status: { $ne: "Cancelled" } } },
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      Order.aggregate([
        { $match: { status: { $ne: "Cancelled" } } }, { $unwind: "$items" },
        { $group: { _id: "$items.name", units: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } } } },
        { $sort: { units: -1 } }, { $limit: 5 }
      ]),
      Order.aggregate([
        { $match: { status: { $ne: "Cancelled" } } }, { $unwind: "$items" },
        { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "product" } },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$product.artisan", units: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } } } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "seller" } },
        { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
        { $project: { name: { $ifNull: ["$seller.name", "Deleted artisan"] }, units: 1, revenue: 1 } },
        { $sort: { revenue: -1 } }, { $limit: 5 }
      ]),
      Product.aggregate([{ $group: { _id: "$category", products: { $sum: 1 } } }, { $sort: { products: -1 } }, { $limit: 8 }])
    ]);
    const monthlyByKey = new Map(monthly.map((item) => [`${item._id.year}-${item._id.month}`, item]));
    const salesByMonth = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const found = monthlyByKey.get(key);
      return { label: date.toLocaleString("en-IN", { month: "short" }), revenue: found?.revenue || 0, orders: found?.orders || 0 };
    });
    res.json({
      totals: { users, artisans: await User.countDocuments({ role: "artisan", artisanStatus: "approved" }), pendingArtisans, products, orders, revenue: sales[0]?.total || 0 },
      salesByMonth, topProducts, topSellers, categoryBreakdown
    });
  } catch (error) {
    console.error("Admin overview failed:", error.message);
    res.status(500).json({ message: "Unable to load admin analytics" });
  }
});

router.get("/products", async (req, res) => {
  try {
    const { page, limit } = pageOptions(req.query);
    const search = String(req.query.search || "").trim().slice(0, 100);
    const filter = search ? { $or: [
      { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      { category: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
    ] } : {};
    const [items, total] = await Promise.all([
      Product.find(filter).populate("artisan", "name email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter)
    ]);
    res.json(pageResponse(items, total, page, limit));
  } catch (error) { res.status(500).json({ message: "Unable to load products" }); }
});

router.get("/users", async (req, res) => {
  try {
    const { page, limit } = pageOptions(req.query);
    const filter = {};
    if (["customer", "artisan", "admin"].includes(req.query.role)) filter.role = req.query.role;
    if (["pending", "approved", "rejected"].includes(req.query.status)) filter.artisanStatus = req.query.status;
    const search = String(req.query.search || "").trim().slice(0, 100);
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [{ name: { $regex: safe, $options: "i" } }, { email: { $regex: safe, $options: "i" } }];
    }
    const [items, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter)
    ]);
    res.json(pageResponse(items, total, page, limit));
  } catch (error) { res.status(500).json({ message: "Unable to load users" }); }
});

router.get("/orders", async (req, res) => {
  try {
    const { page, limit } = pageOptions(req.query);
    const [items, total] = await Promise.all([
      Order.find().populate("user", "name email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments()
    ]);
    res.json(pageResponse(items, total, page, limit));
  } catch (error) { res.status(500).json({ message: "Unable to load orders" }); }
});

router.patch("/artisans/:id/approval", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid artisan ID" });
    const { status, note = "" } = req.body || {};
    if (!["approved", "rejected", "pending"].includes(status)) return res.status(400).json({ message: "Invalid approval status" });
    if (typeof note !== "string" || note.length > 500) return res.status(400).json({ message: "Review note must be 500 characters or less" });
    const artisan = await User.findOne({ _id: req.params.id, role: "artisan" });
    if (!artisan) return res.status(404).json({ message: "Artisan application not found" });
    artisan.artisanStatus = status;
    artisan.artisanReviewNote = note.trim();
    artisan.artisanReviewedAt = new Date();
    await artisan.save();
    res.json({ id: artisan._id, name: artisan.name, email: artisan.email, artisanStatus: artisan.artisanStatus, artisanReviewNote: artisan.artisanReviewNote });
  } catch (error) { res.status(500).json({ message: "Unable to update artisan approval" }); }
});

router.get("/category-requests", async (req, res) => {
  try {
    const { page, limit } = pageOptions(req.query);
    const filter = ["pending", "approved", "rejected"].includes(req.query.status) ? { status: req.query.status } : {};
    const [items, total] = await Promise.all([
      CategoryRequest.find(filter).populate("requestedBy", "name email craftType").populate("reviewedBy", "name").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      CategoryRequest.countDocuments(filter)
    ]);
    res.json(pageResponse(items, total, page, limit));
  } catch (error) { res.status(500).json({ message: "Unable to load category requests" }); }
});

router.patch("/category-requests/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid request ID" });
    const { status, note = "" } = req.body || {};
    if (!["approved", "rejected", "pending"].includes(status)) return res.status(400).json({ message: "Invalid request status" });
    if (typeof note !== "string" || note.length > 500) return res.status(400).json({ message: "Review note must be 500 characters or less" });
    const request = await CategoryRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Category request not found" });
    if (status === "approved") {
      const duplicate = await CategoryRequest.findOne({ _id: { $ne: request._id }, status: "approved", name: { $regex: `^${request.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });
      if (duplicate) return res.status(409).json({ message: "An approved category with this name already exists" });
    }
    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewNote = note.trim();
    request.reviewedAt = new Date();
    await request.save();
    res.json(request);
  } catch (error) { res.status(500).json({ message: "Unable to update category request" }); }
});

module.exports = router;
