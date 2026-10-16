const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const https = require("https");
const Product = require("../models/Product");
const Order = require("../models/Order");
const PaymentIntent = require("../models/PaymentIntent");
const Notification = require("../models/Notification");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();
const DELIVERY_FEE = 80;
const getGateway = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};
const validateCheckout = (items, address) => {
  if (!Array.isArray(items) || !items.length || items.length > 50) return "Add between 1 and 50 products";
  if (!address || ["fullName", "phone", "address", "city", "pincode"].some((key) => typeof address[key] !== "string" || !address[key].trim())) return "Complete all shipping address fields";
  if (items.some((item) => !item || !mongoose.isValidObjectId(item.product) || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || Number(item.quantity) > 100)) return "One or more cart items are invalid";
  return "";
};

router.post("/create-order", protect, requireRole("customer"), async (req, res) => {
  const gateway = getGateway();
  if (!gateway) return res.status(503).json({ message: "Online payments are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend environment to enable them." });
  const items = req.body?.items;
  const shippingAddress = req.body?.shippingAddress;
  const validationError = validateCheckout(items, shippingAddress);
  if (validationError) return res.status(400).json({ message: validationError });
  try {
    const quantities = new Map();
    for (const item of items) quantities.set(String(item.product), (quantities.get(String(item.product)) || 0) + Number(item.quantity));
    if ([...quantities.values()].some((qty) => qty > 100)) return res.status(400).json({ message: "Quantity per product cannot exceed 100" });
    const products = await Product.find({ _id: { $in: [...quantities.keys()] } }).select("price stock name");
    if (products.length !== quantities.size) return res.status(400).json({ message: "One or more products no longer exist" });
    let subtotal = 0;
    for (const product of products) {
      const qty = quantities.get(String(product._id));
      if (product.stock < qty) return res.status(409).json({ message: `Insufficient stock for ${product.name}` });
      subtotal += Number(product.price) * qty;
    }
    const amount = Math.round((subtotal + DELIVERY_FEE) * 100);
    if (!Number.isSafeInteger(amount) || amount <= 0) return res.status(400).json({ message: "Invalid checkout amount" });
    const razorpayOrder = await razorpayRequest("/v1/orders", { amount, currency: "INR", receipt: `market-${Date.now()}`, notes: { userId: String(req.user._id) } });
    const intent = await PaymentIntent.create({
      user: req.user._id, razorpayOrderId: razorpayOrder.id,
      items: [...quantities.entries()].map(([product, quantity]) => ({ product, quantity })),
      shippingAddress: Object.fromEntries(["fullName", "phone", "address", "city", "pincode"].map((key) => [key, shippingAddress[key].trim()])),
      amount: amount / 100
    });
    res.status(201).json({ orderId: razorpayOrder.id, amount, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID, intentId: intent._id });
  } catch (error) {
    console.error("Payment order creation failed:", error.message);
    res.status(500).json({ message: "Unable to start online payment" });
  }
});

router.post("/verify", protect, requireRole("customer"), async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every((value) => typeof value === "string" && value.length > 0)) return res.status(400).json({ message: "Payment verification details are incomplete" });
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "").update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  const actualBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(razorpay_signature);
  if (actualBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(actualBuffer, signatureBuffer)) return res.status(400).json({ message: "Payment signature verification failed" });

  const intent = await PaymentIntent.findOne({ razorpayOrderId: razorpay_order_id, user: req.user._id });
  if (!intent) return res.status(404).json({ message: "Checkout session not found" });
  if (intent.status === "paid" && intent.order) return res.json({ message: "Payment already confirmed", order: intent.order });
  const session = await mongoose.startSession();
  try {
    let createdOrder;
    await session.withTransaction(async () => {
      const products = await Product.find({ _id: { $in: intent.items.map((item) => item.product) } }).session(session);
      const byId = new Map(products.map((product) => [String(product._id), product]));
      const orderItems = [];
      let subtotal = 0;
      for (const item of intent.items) {
        const product = byId.get(String(item.product));
        if (!product || product.stock < item.quantity) { const error = new Error("Stock changed before payment confirmation. Contact support with your payment reference."); error.status = 409; throw error; }
        const update = await Product.updateOne({ _id: product._id, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }, { session });
        if (update.modifiedCount !== 1) { const error = new Error("Stock changed during checkout. Contact support with your payment reference."); error.status = 409; throw error; }
        const price = Number(product.price);
        subtotal += price * item.quantity;
        orderItems.push({ product: product._id, name: product.name, quantity: item.quantity, price });
      }
      const [order] = await Order.create([{
        user: req.user._id, items: orderItems, shippingAddress: intent.shippingAddress,
        paymentMethod: "Razorpay", paymentStatus: "Paid", paymentId: razorpay_payment_id,
        totalAmount: subtotal + DELIVERY_FEE, status: "Confirmed"
      }], { session });
      intent.status = "paid"; intent.razorpayPaymentId = razorpay_payment_id; intent.order = order._id;
      await intent.save({ session });
      createdOrder = order;
    });
    await Notification.create({ recipient: req.user._id, type: "order", title: "Payment confirmed", body: `Your payment was confirmed and order is ${createdOrder._id}.`, link: "/orders" });
    res.status(201).json({ message: "Payment verified and order placed", order: createdOrder });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("Payment verification failed:", error.message);
    res.status(500).json({ message: "Payment was received but the order could not be finalized. Contact support with your payment ID." });
  } finally { await session.endSession(); }
});

module.exports = router;
