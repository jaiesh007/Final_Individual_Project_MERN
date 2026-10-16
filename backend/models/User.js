const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ["customer", "artisan", "admin"], default: "customer" },
    artisanStatus: { type: String, enum: ["not-applicable", "pending", "approved", "rejected"], default: function () { return this.role === "artisan" ? "approved" : "not-applicable"; } },
    artisanReviewNote: { type: String, default: "" },
    artisanReviewedAt: Date,
    phone: String,
    location: String,
    craftType: String,
    story: String
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function matchPassword(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
