const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const connectDB = require("./utils/db");

dotenv.config();

const requiredEnv = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];
const missingEnv = requiredEnv.filter((key) => !process.env[key] || !process.env[key].trim());
if (missingEnv.length) {
  console.error("Missing required environment variables:", missingEnv.join(", "));
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be at least 32 characters long");
  process.exit(1);
}

const allowedOrigins = process.env.CLIENT_URL
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const app = express();
const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

app.disable("x-powered-by");
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  }
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/uploads", express.static(uploadDir));

app.get("/", (req, res) => {
  res.json({ message: "Artisan Handicraft Marketplace API is running" });
});

app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    ok: connected,
    service: "artisan-marketplace-api",
    database: connected ? "connected" : "disconnected"
  });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/contact", require("./routes/contact"));

app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error && error.name === "MulterError") {
    return res.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller" : "Invalid upload" });
  }
  if (error && error.message === "Only image files are allowed") {
    return res.status(400).json({ message: error.message });
  }
  if (error && error.message === "Origin not allowed by CORS") {
    return res.status(403).json({ message: "This origin is not allowed" });
  }
  console.error("Unhandled request error:", error && error.message);
  return res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  });
