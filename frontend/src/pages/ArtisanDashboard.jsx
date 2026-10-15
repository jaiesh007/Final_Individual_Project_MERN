import { BarChart3, IndianRupee, PackagePlus, ShoppingBag, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useProducts } from "../hooks/useProducts.js";

const emptyForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
  material: "",
  origin: "",
  description: ""
};

const ArtisanDashboard = () => {
  const { user, isLoggedIn } = useAuth();
  const params = useMemo(() => (user?.id ? { artisan: user.id } : {}), [user]);
  const { products, setProducts, loading, error } = useProducts(params);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const chooseImage = (event) => {
    const file = event.target.files?.[0] || null;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
    setMessage("");
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) {
      setMessage("Login as an artisan before adding products.");
      return;
    }
    if (!selectedImage) {
      setMessage("Please choose a product image first.");
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "price") value = String(Number(value));
      if (key === "stock") value = String(Number(value || 1));
      payload.append(key, value);
    });
    payload.append("image", selectedImage);

    try {
      setSaving(true);
      const { data } = await api.post("/products", payload);
      setProducts((current) => [data, ...current]);
      setForm(emptyForm);
      setSelectedImage(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview("");
      event.target.reset();
      setMessage("Product saved! Its image is now hosted on Cloudinary.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save product. Check your login, database, and Cloudinary settings.");
    } finally {
      setSaving(false);
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
        <a className="primary-button" href="#add-product"><PackagePlus size={18} /> Add product</a>
      </div>
      {loading && <p className="notice">Loading dashboard from database...</p>}
      {error && <p className="notice">{error}</p>}
      {message && <p className="notice" role="status">{message}</p>}

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
            {!loading && products.length === 0 && <p className="notice">No products yet. Add your first craft.</p>}
          </div>
        </section>

        <section className="dashboard-panel" id="add-product">
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
            <input name="price" value={form.price} onChange={update} placeholder="Price (₹)" type="number" min="0" step="0.01" required />
            <input name="stock" value={form.stock} onChange={update} placeholder="Stock quantity" type="number" min="0" step="1" />
            <input name="material" value={form.material} onChange={update} placeholder="Material" />
            <input name="origin" value={form.origin} onChange={update} placeholder="Origin" />
            <label className="image-upload-label" htmlFor="product-image">Product image (JPG, PNG, WEBP or GIF; max 5 MB)</label>
            <input id="product-image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseImage} required />
            {imagePreview && (
              <div className="image-upload-preview">
                <img src={imagePreview} alt="Selected product preview" style={{ width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 12 }} />
                <span>{selectedImage?.name}</span>
              </div>
            )}
            <textarea name="description" value={form.description} onChange={update} placeholder="Short description" rows="4" required />
            <button className="primary-button full" type="submit" disabled={saving}>
              <UploadCloud size={17} /> {saving ? "Uploading image..." : "Upload image & save product"}
            </button>
          </form>
        </section>
      </div>
    </section>
  );
};

export default ArtisanDashboard;
