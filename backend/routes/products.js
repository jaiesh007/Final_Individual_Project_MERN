const express = require("express");
const Product = require("../models/Product");
const { protect, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { search, category, featured, artisan } = req.query;
    const filter = {};

    if (category && category !== "All") filter.category = category;
    if (featured) filter.featured = featured === "true";
    if (artisan) filter.artisan = artisan;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { material: { $regex: search, $options: "i" } }
      ];
    }

    const products = await Product.find(filter).populate("artisan", "name location craftType story");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("artisan", "name location craftType story");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, requireRole("artisan", "admin"), upload.single("image"), async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : req.body.image,
      artisan: req.user._id
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, requireRole("artisan", "admin"), upload.single("image"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (String(product.artisan) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can update only your own product" });
    }

    Object.assign(product, req.body);
    if (req.file) product.image = `/uploads/${req.file.filename}`;
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", protect, requireRole("artisan", "admin"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (String(product.artisan) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can delete only your own product" });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
