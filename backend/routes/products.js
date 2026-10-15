const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { protect, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const uploadToCloudinary = require("../utils/cloudinary");

const router = express.Router();
const editableFields = ["name", "description", "category", "price", "stock", "material", "origin", "featured"];

const safeProductInput = (body) => {
  const data = {};
  for (const field of editableFields) {
    if (Object.prototype.hasOwnProperty.call(body || {}, field)) data[field] = body[field];
  }
  return data;
};

router.get("/", async (req, res) => {
  try {
    const { search, category, featured, artisan } = req.query;
    const filter = {};

    if (category && category !== "All") filter.category = String(category).slice(0, 100);
    if (featured === "true" || featured === "false") filter.featured = featured === "true";
    if (artisan) {
      if (!mongoose.isValidObjectId(artisan)) return res.status(400).json({ message: "Invalid artisan ID" });
      filter.artisan = artisan;
    }
    if (search) {
      const term = String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { material: { $regex: term, $options: "i" } }
      ];
    }

    const products = await Product.find(filter)
      .populate("artisan", "name location craftType story")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(products);
  } catch (error) {
    console.error("Fetching products failed:", error.message);
    res.status(500).json({ message: "Unable to fetch products" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
    const product = await Product.findById(req.params.id).populate("artisan", "name location craftType story");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("Fetching product failed:", error.message);
    res.status(500).json({ message: "Unable to fetch product" });
  }
});

router.post("/", protect, requireRole("artisan", "admin"), upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Choose an image file to upload" });
    const input = safeProductInput(req.body);
    input.image = await uploadToCloudinary(req.file);
    const product = await Product.create({ ...input, artisan: req.user._id });
    res.status(201).json(product);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "Please provide valid product details" });
    }
    if (error.code === "CLOUDINARY_NOT_CONFIGURED") {
      return res.status(503).json({ message: "Image uploads are not configured yet. Add the Cloudinary environment variables to Render." });
    }
    console.error("Creating product failed:", error.message);
    res.status(502).json({ message: "Image upload or product creation failed. Check Cloudinary settings and try again." });
  }
});

router.put("/:id", protect, requireRole("artisan", "admin"), upload.single("image"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (String(product.artisan) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can update only your own product" });
    }

    const input = safeProductInput(req.body);
    if (req.file) input.image = await uploadToCloudinary(req.file);
    for (const [key, value] of Object.entries(input)) product[key] = value;
    await product.save();
    res.json(product);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "Please provide valid product details" });
    }
    if (error.code === "CLOUDINARY_NOT_CONFIGURED") {
      return res.status(503).json({ message: "Image uploads are not configured yet. Add the Cloudinary environment variables to Render." });
    }
    console.error("Updating product failed:", error.message);
    res.status(502).json({ message: "Image upload or product update failed. Check Cloudinary settings and try again." });
  }
});

router.delete("/:id", protect, requireRole("artisan", "admin"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (String(product.artisan) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can delete only your own product" });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Deleting product failed:", error.message);
    res.status(500).json({ message: "Unable to delete product" });
  }
});

module.exports = router;
