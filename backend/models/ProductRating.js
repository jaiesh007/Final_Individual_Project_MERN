const mongoose = require("mongoose");

const productRatingSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
  review: { type: String, trim: true, maxlength: 1000, default: "" }
}, { timestamps: true });

productRatingSchema.index({ product: 1, customer: 1 }, { unique: true });
module.exports = mongoose.model("ProductRating", productRatingSchema);
