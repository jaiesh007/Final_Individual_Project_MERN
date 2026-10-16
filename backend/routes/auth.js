const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");


const router = express.Router();
const authAttempts = new Map();
const authRateLimit = (req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket?.remoteAddress || "unknown";
  const current = authAttempts.get(key);
  if (!current || now - current.startedAt >= 15 * 60 * 1000) {
    authAttempts.set(key, { startedAt: now, count: 1 });
    if (authAttempts.size > 5000) for (const [ip, attempt] of authAttempts) if (now - attempt.startedAt >= 15 * 60 * 1000) authAttempts.delete(ip);
    return next();
  }
  if (current.count >= 10) return res.status(429).json({ message: "Too many authentication attempts. Please wait 15 minutes and try again." });
  current.count += 1;
  return next();
};

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  artisanStatus: user.artisanStatus || (user.role === "artisan" ? "approved" : "not-applicable"),
  artisanReviewNote: user.artisanReviewNote,
  location: user.location,
  phone: user.phone,
  address: user.address || "",
  city: user.city || "",
  pincode: user.pincode || "",
  craftType: user.craftType
});

router.post("/register", authRateLimit, async (req, res) => {
  try {
    const { name, email, password, phone, location, craftType, story } = req.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (typeof name !== "string" || !name.trim() ||
        !normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
        typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Enter a name, valid email, and password with at least 8 characters"
      });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    // Public registration can create customer or artisan accounts only.
    const role = req.body.role === "artisan" ? "artisan" : "customer";
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      artisanStatus: role === "artisan" ? "pending" : "not-applicable",
      phone,
      location,
      craftType: role === "artisan" ? craftType : undefined,
      story: role === "artisan" ? story : undefined
    });

    if (role === "artisan") {
      return res.status(201).json({
        user: publicUser(user),
        approvalRequired: true,
        message: "Your artisan application was submitted. You can log in after an administrator approves it."
      });
    }

    return res.status(201).json({ token: createToken(user._id), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Email already registered" });
    if (error.name === "ValidationError") return res.status(400).json({ message: "Please check the registration details" });
    console.error("Registration failed:", error.message);
    return res.status(500).json({ message: "Unable to register at this time" });
  }
});

router.post("/login", authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.role === "artisan" && user.artisanStatus && user.artisanStatus !== "approved") {
      const statusMessage = user.artisanStatus === "rejected"
        ? "Your artisan application was not approved. Contact support if you need help."
        : "Your artisan application is awaiting admin approval. You can log in after it is approved.";
      return res.status(403).json({ message: statusMessage, artisanStatus: user.artisanStatus });
    }

    return res.json({ token: createToken(user._id), user: publicUser(user) });
  } catch (error) {
    console.error("Login failed:", error.message);
    return res.status(500).json({ message: "Unable to log in at this time" });
  }
});

router.get("/me", protect, (req, res) => {
  res.json(publicUser(req.user));
});

router.put("/me", protect, async (req, res) => {
  try {
    const fields = ["name", "email", "phone", "location", "address", "city", "pincode"];
    const updates = {};
    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        if (typeof req.body[field] !== "string") {
          return res.status(400).json({ message: "Profile fields must be text" });
        }
        const value = req.body[field].trim();
        const maxLength = field === "address" ? 300 : field === "name" ? 100 : field === "email" ? 254 : 100;
        if (value.length > maxLength) return res.status(400).json({ message: "One or more profile fields are too long" });
        updates[field] = value;
      }
    }
    if (Object.prototype.hasOwnProperty.call(updates, "name") && !updates.name) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (Object.prototype.hasOwnProperty.call(updates, "email")) {
      updates.email = updates.email.toLowerCase();
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(updates.email)) {
        return res.status(400).json({ message: "Enter a valid email address" });
      }
      const existing = await User.findOne({ email: updates.email, _id: { $ne: req.user._id } });
      if (existing) return res.status(409).json({ message: "That email is already registered" });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    return res.json(publicUser(user));
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That email is already registered" });
    if (error.name === "ValidationError") return res.status(400).json({ message: "Please check your profile details" });
    console.error("Profile update failed:", error.message);
    return res.status(500).json({ message: "Unable to update profile at this time" });
  }
});

module.exports = router;
