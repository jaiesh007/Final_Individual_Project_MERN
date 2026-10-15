const dotenv = require("dotenv");
const connectDB = require("./utils/db");
const User = require("./models/User");

dotenv.config();

const run = async () => {
  const name = String(process.env.ADMIN_NAME || "").trim();
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password || password.length < 12) {
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD (at least 12 characters) in backend/.env before running this command.");
  }

  await connectDB();
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role === "admin") {
      console.log("An administrator account with this email already exists. No changes made.");
      process.exit(0);
    }
    throw new Error("That email already belongs to a non-admin account. Use a different ADMIN_EMAIL.");
  }

  await User.create({
    name,
    email,
    password,
    role: "admin",
    artisanStatus: "not-applicable"
  });
  console.log("Administrator account created. Log in using ADMIN_EMAIL and ADMIN_PASSWORD.");
  process.exit(0);
};

run().catch((error) => {
  console.error("Admin account setup failed:", error.message);
  process.exit(1);
});
