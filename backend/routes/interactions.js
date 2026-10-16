const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const ProductComment = require("../models/ProductComment");
const Conversation = require("../models/Conversation");
const Notification = require("../models/Notification");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/products/:id/comments", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
    const comments = await ProductComment.find({ product: req.params.id }).sort({ createdAt: -1 }).limit(100).lean();
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Unable to load product comments" });
  }
});

router.post("/products/:id/comments", protect, requireRole("customer"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!body || body.length > 1000) return res.status(400).json({ message: "Write a comment between 1 and 1000 characters" });
    const product = await Product.findById(req.params.id).select("_id");
    if (!product) return res.status(404).json({ message: "Product not found" });
    const comment = await ProductComment.create({
      product: product._id,
      customer: req.user._id,
      customerName: req.user.name,
      body
    });
    await Notification.create({ recipient: (await Product.findById(product._id).select("artisan")).artisan, type: "comment", title: "New product comment", body: `${req.user.name} commented on one of your products.`, link: "/seller/reviews" });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: "Unable to post comment" });
  }
});

router.post("/conversations", protect, requireRole("customer"), async (req, res) => {
  try {
    const productId = req.body?.productId;
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: "Invalid product ID" });
    const product = await Product.findById(productId).select("_id artisan name");
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (String(product.artisan) === String(req.user._id)) return res.status(400).json({ message: "You cannot chat with yourself" });
    let conversation = await Conversation.findOne({ customer: req.user._id, product: product._id });
    if (!conversation) {
      try {
        conversation = await Conversation.create({ customer: req.user._id, artisan: product.artisan, product: product._id });
      } catch (error) {
        if (error.code !== 11000) throw error;
        conversation = await Conversation.findOne({ customer: req.user._id, product: product._id });
      }
    }
    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: "Unable to start conversation" });
  }
});

router.get("/conversations", protect, async (req, res) => {
  try {
    if (!["customer", "artisan"].includes(req.user.role)) return res.status(403).json({ message: "Chat is available to customers and artisans" });
    const filter = req.user.role === "customer" ? { customer: req.user._id } : { artisan: req.user._id };
    const conversations = await Conversation.find(filter)
      .populate("product", "name image price")
      .populate("customer", "name")
      .populate("artisan", "name")
      .sort({ lastMessageAt: -1 })
      .lean();
    res.json(conversations.map((conversation) => ({
      ...conversation,
      messages: undefined,
      lastMessage: conversation.messages?.[conversation.messages.length - 1] || null
    })));
  } catch (error) {
    res.status(500).json({ message: "Unable to load conversations" });
  }
});

router.get("/conversations/:id", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid conversation ID" });
    const conversation = await Conversation.findById(req.params.id)
      .populate("product", "name image price")
      .populate("customer", "name")
      .populate("artisan", "name");
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    const userId = String(req.user._id);
    if (String(conversation.customer._id) !== userId && String(conversation.artisan._id) !== userId) {
      return res.status(403).json({ message: "You cannot access this conversation" });
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: "Unable to load conversation" });
  }
});

router.post("/conversations/:id/messages", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid conversation ID" });
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!body || body.length > 2000) return res.status(400).json({ message: "Message must be between 1 and 2000 characters" });
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    const userId = String(req.user._id);
    if (String(conversation.customer) !== userId && String(conversation.artisan) !== userId) {
      return res.status(403).json({ message: "You cannot message in this conversation" });
    }
    conversation.messages.push({ sender: req.user._id, senderName: req.user.name, body });
    conversation.lastMessageAt = new Date();
    await conversation.save();
    res.status(201).json(conversation.messages[conversation.messages.length - 1]);
  } catch (error) {
    res.status(500).json({ message: "Unable to send message" });
  }
});

module.exports = router;
