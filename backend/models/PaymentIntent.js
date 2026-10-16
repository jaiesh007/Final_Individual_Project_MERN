const mongoose = require("mongoose");

const paymentIntentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  razorpayOrderId: { type: String, required: true, unique: true },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }, quantity: { type: Number, required: true, min: 1 } }],
  shippingAddress: { fullName: String, phone: String, address: String, city: String, pincode: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  razorpayPaymentId: String
}, { timestamps: true });

module.exports = mongoose.model("PaymentIntent", paymentIntentSchema);
