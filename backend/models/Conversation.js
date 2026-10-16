const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderName: { type: String, required: true },
  body: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const conversationSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  artisan: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  messages: { type: [messageSchema], default: [] },
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

conversationSchema.index({ customer: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
