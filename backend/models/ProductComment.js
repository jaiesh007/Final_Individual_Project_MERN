const mongoose = require("mongoose");

const productCommentSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true, maxlength: 1000 }
}, { timestamps: true });

module.exports = mongoose.model("ProductComment", productCommentSchema);
