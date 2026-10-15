const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  artisanStatus: user.artisanStatus,
  artisanReviewNote: user.artisanReviewNote,
  location: user.location,
  craftType: user.craftType
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, location, craftType, story } = req.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (typeof name !== "string" || !name.trim() ||
        !normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
        typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        message: "Enter a name, valid email, and password with at least 6 characters"
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

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.role === "artisan" && user.artisanStatus !== "approved") {
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

module.exports = router;
