const dotenv = require("dotenv");
const connectDB = require("./utils/db");
const User = require("./models/User");
const Product = require("./models/Product");

dotenv.config();

const products = [
  {
    name: "Blue Pottery Serving Bowl",
    description: "Hand-painted Jaipur blue pottery bowl finished with floral ceramic glaze.",
    category: "Pottery",
    price: 899,
    stock: 12,
    material: "Ceramic clay",
    origin: "Jaipur, Rajasthan",
    featured: true,
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Kutch Embroidered Tote",
    description: "Mirror-work cotton tote handmade by women artisans from Kutch.",
    category: "Textiles",
    price: 1299,
    stock: 8,
    material: "Cotton and mirror work",
    origin: "Kutch, Gujarat",
    featured: true,
    image: "https://images.unsplash.com/photo-1523359346063-d879354c0ea5?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Bamboo Desk Organizer",
    description: "Eco-friendly organizer crafted from treated bamboo for study and office desks.",
    category: "Bamboo",
    price: 699,
    stock: 20,
    material: "Bamboo",
    origin: "Assam",
    featured: false,
    image: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=900&q=80"
  }
];

const run = async () => {
  await connectDB();
  await User.deleteMany();
  await Product.deleteMany();

  const artisan = await User.create({
    name: "Aarav Handmade Studio",
    email: "artisan@example.com",
    password: "password123",
    role: "artisan",
    location: "Jaipur",
    craftType: "Pottery and textiles",
    story: "A small family studio preserving traditional handmade techniques."
  });

  await User.create({
    name: "Demo Customer",
    email: "customer@example.com",
    password: "password123",
    role: "customer",
    location: "Delhi"
  });

  await Product.insertMany(products.map((product) => ({ ...product, artisan: artisan._id })));
  console.log("Seed data inserted");
  process.exit();
};

run();
