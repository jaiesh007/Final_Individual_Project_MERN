const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const CategoryRequest = require("../models/CategoryRequest");
const { protect, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const uploadToCloudinary = require("../utils/cloudinary");

const router = express.Router();
const editableFields = ["name", "description", "category", "price", "stock", "material", "origin", "featured"];
const builtInCategories = ["Pottery", "Textiles", "Bamboo", "Metal Craft", "Wood Craft", "Jewellery", "Home Decor", "Other"];
const safeProductInput = (body) => {
  const data = {};
  for (const field of editableFields) if (Object.prototype.hasOwnProperty.call(body || {}, field)) data[field] = body[field];
  return data;
};
const parsePrice = (value) => {
  if (typeof value !== "string" && typeof value !== "number") return NaN;
  const normalized = String(value).trim().replace(/[₹,\s]/g, "");
  if (!normalized || !/^\d+(?:\.\d{1,2})?$/.test(normalized)) return NaN;
  const price = Number(normalized);
  return Number.isFinite(price) && price <= Number.MAX_SAFE_INTEGER ? price : NaN;
};
const parseStock = (value) => {
  if (value === "" || value == null) return 1;
  const normalized = String(value).trim();
  if (!/^\d+$/.test(normalized)) return NaN;
  const stock = Number(normalized);
  return Number.isSafeInteger(stock) ? stock : NaN;
};
const regexSpecials = ".*+?^$(){}|[]";
const safeRegex = (value) => String(value).slice(0, 100).split("").map((character) => regexSpecials.includes(character) || character === String.fromCharCode(92) ? String.fromCharCode(92) + character : character).join("");
const categoryIsAllowed = async (value) => {
  if (typeof value !== "string" || !value.trim()) return false;
  if (builtInCategories.some((name) => name.toLowerCase() === value.trim().toLowerCase())) return true;
  return Boolean(await CategoryRequest.exists({ name: value.trim(), status: "approved" }));
};

router.get("/", async (req, res) => {
  try {
    const { search, category, featured, artisan, page, limit, sortBy } = req.query;
    const filter = {};
    if (category && category !== "All") filter.category = String(category).slice(0, 100);
    if (featured === "true" || featured === "false") filter.featured = featured === "true";
    if (artisan) {
      if (!mongoose.isValidObjectId(artisan)) return res.status(400).json({ message: "Invalid artisan ID" });
      filter.artisan = artisan;
    }
    if (search) {
      const term = safeRegex(search);
      filter.$or = [
        { name: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { material: { $regex: term, $options: "i" } }
      ];
    }
    const sortMap = {
      "price-low": { price: 1, _id: 1 },
      "price-high": { price: -1, _id: -1 },
      name: { name: 1, _id: 1 },
      featured: { featured: -1, createdAt: -1, _id: -1 }
    };
    const sort = sortMap[sortBy] || { createdAt: -1, _id: -1 };
    const paginationRequested = page !== undefined || limit !== undefined;
    const parsedPage = Math.max(1, Math.min(1000000, Number.parseInt(page, 10) || 1));
    const parsedLimit = Math.max(1, Math.min(48, Number.parseInt(limit, 10) || 12));

    if (paginationRequested) {
      const [items, total] = await Promise.all([
        Product.find(filter).populate("artisan", "name location craftType story").sort(sort)
          .skip((parsedPage - 1) * parsedLimit).limit(parsedLimit).lean(),
        Product.countDocuments(filter)
      ]);
      return res.json({ items, page: parsedPage, limit: parsedLimit, total, totalPages: Math.max(1, Math.ceil(total / parsedLimit)) });
    }
    const products = await Product.find(filter).populate("artisan", "name location craftType story").sort(sort).limit(200);
    res.json(products);
  } catch (error) {
    console.error("Fetching products failed:", error.message);
    res.status(500).json({ message: "Unable to fetch products" });
  }
});

router.get("/mine/summary", protect, requireRole("artisan"), async (req, res) => {
  try {
    const [summary] = await Product.aggregate([
      { $match: { artisan: new mongoose.Types.ObjectId(String(req.user._id)) } },
      { $group: {
        _id: null,
        productCount: { $sum: 1 },
        inventoryValue: { $sum: { $multiply: ["$price", "$stock"] } },
        availableListings: { $sum: { $cond: [{ $gt: ["$stock", 0] }, 1, 0] } }
      } }
    ]);
    res.json(summary || { productCount: 0, inventoryValue: 0, availableListings: 0 });
  } catch (error) {
    res.status(500).json({ message: "Unable to load inventory summary" });
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
    for (const field of ["name", "description", "category", "material", "origin"]) if (typeof input[field] === "string") input[field] = input[field].trim();
    input.price = parsePrice(input.price);
    input.stock = parseStock(input.stock);
    const missing = ["name", "description", "category"].filter((field) => !input[field]);
    if (missing.length) return res.status(400).json({ message: "Please fill in the required product fields: " + missing.join(", ") });
    if (!(await categoryIsAllowed(input.category))) return res.status(400).json({ message: "This category is not approved yet. Submit a category request to the admin first." });
    if (!Number.isFinite(input.price) || input.price < 0) return res.status(400).json({ message: "Enter a valid non-negative price with up to 2 decimal places." });
    if (!Number.isSafeInteger(input.stock) || input.stock < 0) return res.status(400).json({ message: "Stock must be a whole number of zero or more." });

    input.image = await uploadToCloudinary(req.file);
    const product = await Product.create({ ...input, artisan: req.user._id });
    res.status(201).json(product);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") return res.status(400).json({ message: "Please provide valid product details" });
    if (error.code === "CLOUDINARY_NOT_CONFIGURED") return res.status(503).json({ message: "Image uploads are not configured yet. Add the Cloudinary environment variables to Render." });
    if (error.code === "CLOUDINARY_UPLOAD_FAILED") return res.status(502).json({ message: "Cloudinary could not upload this image. Check the image and Cloudinary settings, then try again." });
    console.error("Creating product failed:", error.message);
    res.status(502).json({ message: "Product creation failed. Check the backend logs and try again." });
  }
});

router.put("/:id", protect, requireRole("artisan", "admin"), upload.single("image"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (String(product.artisan) !== String(req.user._id) && req.user.role !== "admin") return res.status(403).json({ message: "You can update only your own product" });
    const input = safeProductInput(req.body);
    if (Object.prototype.hasOwnProperty.call(input, "category") && !(await categoryIsAllowed(input.category))) {
      return res.status(400).json({ message: "This category is not approved yet. Submit a category request to the admin first." });
    }
    if (Object.prototype.hasOwnProperty.call(input, "price")) {
      input.price = parsePrice(input.price);
      if (!Number.isFinite(input.price) || input.price < 0) return res.status(400).json({ message: "Enter a valid non-negative price with up to 2 decimal places." });
    }
    if (Object.prototype.hasOwnProperty.call(input, "stock")) {
      input.stock = parseStock(input.stock);
      if (!Number.isSafeInteger(input.stock) || input.stock < 0) return res.status(400).json({ message: "Stock must be a whole number of zero or more." });
    }
    if (req.file) input.image = await uploadToCloudinary(req.file);
    for (const [key, value] of Object.entries(input)) product[key] = value;
    await product.save();
    res.json(product);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") return res.status(400).json({ message: "Please provide valid product details" });
    if (error.code === "CLOUDINARY_NOT_CONFIGURED") return res.status(503).json({ message: "Image uploads are not configured yet. Add the Cloudinary environment variables to Render." });
    if (error.code === "CLOUDINARY_UPLOAD_FAILED") return res.status(502).json({ message: "Cloudinary could not upload this image. Check the image and Cloudinary settings, then try again." });
    console.error("Updating product failed:", error.message);
    res.status(502).json({ message: "Image upload or product update failed. Check Cloudinary settings and try again." });
  }
});

router.delete("/:id", protect, requireRole("artisan", "admin"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (String(product.artisan) !== String(req.user._id) && req.user.role !== "admin") return res.status(403).json({ message: "You can delete only your own product" });
    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Deleting product failed:", error.message);
    res.status(500).json({ message: "Unable to delete product" });
  }
});

module.exports = router;
