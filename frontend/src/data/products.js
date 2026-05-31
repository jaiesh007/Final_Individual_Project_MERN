export const products = [
  {
    _id: "p1",
    name: "Blue Pottery Serving Bowl",
    category: "Pottery",
    price: 899,
    stock: 12,
    material: "Ceramic clay",
    origin: "Jaipur, Rajasthan",
    featured: true,
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80",
    artisan: { name: "Aarav Handmade Studio", location: "Jaipur" },
    description: "A hand-painted serving bowl inspired by traditional Jaipur blue pottery patterns."
  },
  {
    _id: "p2",
    name: "Kutch Embroidered Tote",
    category: "Textiles",
    price: 1299,
    stock: 8,
    material: "Cotton and mirror work",
    origin: "Kutch, Gujarat",
    featured: true,
    image: "https://images.unsplash.com/photo-1523359346063-d879354c0ea5?auto=format&fit=crop&w=900&q=80",
    artisan: { name: "Kala Threads Collective", location: "Kutch" },
    description: "A bright cotton tote with mirror embroidery made by rural women artisans."
  },
  {
    _id: "p3",
    name: "Bamboo Desk Organizer",
    category: "Bamboo",
    price: 699,
    stock: 20,
    material: "Bamboo",
    origin: "Assam",
    featured: false,
    image: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=900&q=80",
    artisan: { name: "Green Cane Works", location: "Assam" },
    description: "A lightweight desk organizer crafted from treated bamboo."
  },
  {
    _id: "p4",
    name: "Brass Diya Set",
    category: "Metal Craft",
    price: 549,
    stock: 18,
    material: "Brass",
    origin: "Moradabad, Uttar Pradesh",
    featured: true,
    image: "https://images.unsplash.com/photo-1608755728617-aefab37d2edd?auto=format&fit=crop&w=900&q=80",
    artisan: { name: "Noor Metal Arts", location: "Moradabad" },
    description: "A polished brass diya pair suitable for decor, gifting, and festive rituals."
  }
];

export const categories = ["All", "Pottery", "Textiles", "Bamboo", "Metal Craft"];
