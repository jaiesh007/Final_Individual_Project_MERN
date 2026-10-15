const mongoose = require("mongoose");

const categoryRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewNote: { type: String, maxlength: 500, default: "" },
  reviewedAt: Date
}, { timestamps: true });

categoryRequestSchema.index({ name: 1, status: 1 });
module.exports = mongoose.model("CategoryRequest", categoryRequestSchema);
