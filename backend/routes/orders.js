const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();
const DELIVERY_FEE = 80;
const allowedStatuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

router.post("/", protect, async (req, res) => {
  const items = req.body && req.body.items;
  const shippingAddress = req.body && req.body.shippingAddress;

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return res.status(400).json({ message: "An order must contain between 1 and 50 items" });
  }

  const requiredAddressFields = ["fullName", "phone", "address", "city", "pincode"];
  if (!shippingAddress || requiredAddressFields.some(
    (field) => typeof shippingAddress[field] !== "string" || !shippingAddress[field].trim()
  )) {
    return res.status(400).json({ message: "Complete all shipping address fields" });
  }

  const quantities = new Map();
  for (const item of items) {
    if (!item || !mongoose.isValidObjectId(item.product) ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1 || Number(item.quantity) > 100) {
      return res.status(400).json({ message: "One or more order items are invalid" });
    }
    const id = String(item.product);
    quantities.set(id, (quantities.get(id) || 0) + Number(item.quantity));
  }

  if ([...quantities.values()].some((quantity) => quantity > 100)) {
    return res.status(400).json({ message: "Quantity per product cannot exceed 100" });
  }

  const session = await mongoose.startSession();
  try {
    let createdOrder;
    await session.withTransaction(async () => {
      const productIds = [...quantities.keys()];
      const products = await Product.find({ _id: { $in: productIds } }).session(session);
      if (products.length !== productIds.length) {
        const error = new Error("One or more products no longer exist");
        error.status = 400;
        throw error;
      }

      const byId = new Map(products.map((product) => [String(product._id), product]));
      const orderItems = [];
      let subtotal = 0;

      for (const [id, quantity] of quantities.entries()) {
        const product = byId.get(id);
        if (product.stock < quantity) {
          const error = new Error("Insufficient stock for " + product.name);
          error.status = 409;
          throw error;
        }

        const price = Number(product.price);
        if (!Number.isFinite(price) || price < 0) {
          const error = new Error("A product has an invalid price");
          error.status = 400;
          throw error;
        }

        const update = await Product.updateOne(
          { _id: product._id, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { session }
        );
        if (update.modifiedCount !== 1) {
          const error = new Error("Stock changed while placing the order. Please try again.");
          error.status = 409;
          throw error;
        }

        subtotal += price * quantity;
        orderItems.push({ product: product._id, name: product.name, quantity, price });
      }

      const [order] = await Order.create([{
        user: req.user._id,
        items: orderItems,
        shippingAddress: {
          fullName: shippingAddress.fullName.trim(),
          phone: shippingAddress.phone.trim(),
          address: shippingAddress.address.trim(),
          city: shippingAddress.city.trim(),
          pincode: shippingAddress.pincode.trim()
        },
        paymentMethod: "Cash on Delivery",
        totalAmount: subtotal + DELIVERY_FEE,
        status: "Pending"
      }], { session });
      createdOrder = order;
    });

    return res.status(201).json(createdOrder);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("Order creation failed:", error.message);
    return res.status(500).json({ message: "Unable to place order at this time" });
  } finally {
    await session.endSession();
  }
});

router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name image")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Fetching customer orders failed:", error.message);
    res.status(500).json({ message: "Unable to fetch orders" });
  }
});

router.get("/", protect, requireRole("admin"), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Fetching all orders failed:", error.message);
    res.status(500).json({ message: "Unable to fetch orders" });
  }
});

router.patch("/:id/status", protect, requireRole("admin", "artisan"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }
    const { status } = req.body || {};
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (req.user.role === "artisan") {
      const productIds = order.items.map((item) => item.product);
      const ownedProducts = await Product.find({
        _id: { $in: productIds },
        artisan: req.user._id
      }).select("_id");
      if (ownedProducts.length !== new Set(productIds.map((id) => String(id))).size) {
        return res.status(403).json({ message: "You can update only orders containing exclusively your products" });
      }
      if (status === "Cancelled") {
        return res.status(403).json({ message: "Only administrators can cancel orders" });
      }
    }

    order.status = status;
    await order.save();
    res.json(order);
  } catch (error) {
    console.error("Updating order status failed:", error.message);
    res.status(500).json({ message: "Unable to update order status" });
  }
});

module.exports = router;
