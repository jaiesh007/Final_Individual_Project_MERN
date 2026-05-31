import { BarChart3, IndianRupee, PackagePlus, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useProducts } from "../hooks/useProducts.js";

const ArtisanDashboard = () => {
  const { user, isLoggedIn } = useAuth();
  const params = useMemo(() => (user?.id ? { artisan: user.id } : {}), [user]);
  const { products, setProducts, loading, error } = useProducts(params);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    material: "",
    origin: "",
    image: "",
    description: ""
  });

  const update = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) {
      setMessage("Login as an artisan before adding products.");
      return;
    }

    try {
      const { data } = await api.post("/products", {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock || 1)
      });
      setProducts([data, ...products]);
      setForm({ name: "", category: "", price: "", stock: "", material: "", origin: "", image: "", description: "" });
      setMessage("Product saved to database.");
    } catch {
      setMessage("Could not save product. Login as artisan and check backend/MongoDB.");
    }
  };

  if (!isLoggedIn) {
    return (
      <section className="dashboard-page">
        <div className="empty-state">
          <h2>Login required</h2>
          <p>Use the demo artisan account or register as an artisan to manage products.</p>
          <Link to="/login" className="primary-button">Login</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">Artisan panel</span>
          <h1>Manage handmade products</h1>
        </div>
        <button className="primary-button"><PackagePlus size={18} /> Add product</button>
      </div>
      {loading && <p className="notice">Loading dashboard from database...</p>}
      {error && <p className="notice">{error}</p>}
      {message && <p className="notice">{message}</p>}

      <div className="dashboard-stats">
        <div><ShoppingBag /><span>Products</span><strong>{products.length}</strong></div>
        <div><IndianRupee /><span>Inventory value</span><strong>Rs. {products.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.stock || 0), 0)}</strong></div>
        <div><BarChart3 /><span>Active listings</span><strong>{products.filter((item) => Number(item.stock) > 0).length}</strong></div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <h2>Product inventory</h2>
          <div className="table-list">
            {products.map((product) => (
              <div className="table-row" key={product._id || product.name}>
                <strong>{product.name}</strong>
                <span>{product.stock} in stock</span>
                <span>Rs. {product.price}</span>
                <mark>{Number(product.stock) > 0 ? "Active" : "Out"}</mark>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <h2>Add new craft</h2>
          <form className="stacked-form" onSubmit={saveProduct}>
            <input name="name" value={form.name} onChange={update} placeholder="Product name" required />
            <select name="category" value={form.category} onChange={update} required>
              <option value="" disabled>Category</option>
              <option>Pottery</option>
              <option>Textiles</option>
              <option>Bamboo</option>
              <option>Metal Craft</option>
            </select>
            <input name="price" value={form.price} onChange={update} placeholder="Price" type="number" required />
            <input name="stock" value={form.stock} onChange={update} placeholder="Stock" type="number" />
            <input name="material" value={form.material} onChange={update} placeholder="Material" />
            <input name="origin" value={form.origin} onChange={update} placeholder="Origin" />
            <input name="image" value={form.image} onChange={update} placeholder="Image URL" />
            <textarea name="description" value={form.description} onChange={update} placeholder="Short description" rows="4" required />
            <button className="primary-button full" type="submit">Save product</button>
          </form>
        </section>
      </div>
    </section>
  );
};

export default ArtisanDashboard;
