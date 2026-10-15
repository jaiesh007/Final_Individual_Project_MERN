import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ImagePlus,
  IndianRupee,
  Package,
  PackagePlus,
  ShoppingBag,
  Sparkles,
  UploadCloud,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useProducts } from "../hooks/useProducts.js";
import CategoryRequestPanel from "../components/CategoryRequestPanel.jsx";

const emptyForm = {
  name: "",
  category: "",
  price: "",
  stock: "1",
  material: "",
  origin: "",
  description: ""
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value) || 0);

const normalizePrice = (value) => String(value).trim().replace(/[₹,\s]/g, "");

const ArtisanDashboard = () => {
  const { user, isLoggedIn } = useAuth();
  const params = useMemo(() => (user?.id ? { artisan: user.id } : {}), [user]);
  const { products, setProducts, loading, error } = useProducts(params);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState(emptyForm);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState(["Pottery", "Textiles", "Bamboo", "Metal Craft", "Wood Craft", "Jewellery", "Home Decor", "Other"]);

  useEffect(() => {
    let alive = true;
    api.get("/categories").then(({ data }) => { if (alive && Array.isArray(data)) setCategories(data); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const formRef = useRef(null);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (message.text) setMessage({ type: "", text: "" });
  };

  const chooseImage = (event) => {
    const file = event.target.files?.[0] || null;
    if (imagePreview) URL.revokeObjectURL(imagePreview);

    if (file && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setSelectedImage(null);
      setImagePreview("");
      event.target.value = "";
      setMessage({ type: "error", text: "Choose a JPG, PNG, WEBP, or GIF image." });
      return;
    }
    if (file && file.size > MAX_IMAGE_SIZE) {
      setSelectedImage(null);
      setImagePreview("");
      event.target.value = "";
      setMessage({ type: "error", text: "Image is too large. Choose an image smaller than 5 MB." });
      return;
    }

    setSelectedImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
    setMessage({ type: "", text: "" });
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) {
      setMessage({ type: "error", text: "Please log in as an artisan before adding products." });
      return;
    }
    if (!selectedImage) {
      setMessage({ type: "error", text: "Please choose a product image before publishing." });
      return;
    }

    const cleanPrice = normalizePrice(form.price);
    const priceNumber = Number(cleanPrice);
    if (!cleanPrice || !Number.isFinite(priceNumber) || priceNumber < 0) {
      setMessage({ type: "error", text: "Enter a valid price. You can use commas or ₹, for example 1,25,000." });
      return;
    }
    if (priceNumber > Number.MAX_SAFE_INTEGER) {
      setMessage({ type: "error", text: "This price is too large to store accurately. Please use a value up to ₹9,007,199,254,740,991." });
      return;
    }
    const stockNumber = Number(form.stock);
    if (!Number.isInteger(stockNumber) || stockNumber < 0) {
      setMessage({ type: "error", text: "Stock must be a whole number of zero or more." });
      return;
    }

    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("category", form.category);
    payload.append("price", cleanPrice);
    payload.append("stock", String(stockNumber));
    payload.append("material", form.material.trim());
    payload.append("origin", form.origin.trim());
    payload.append("description", form.description.trim());
    payload.append("image", selectedImage);

    try {
      setSaving(true);
      setMessage({ type: "progress", text: "Uploading your image and saving product…" });
      const { data } = await api.post("/products", payload);
      setProducts((current) => [data, ...current.filter((item) => item._id !== data._id)]);
      setForm(emptyForm);
      setSelectedImage(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview("");
      formRef.current?.reset();
      setMessage({ type: "success", text: "Product published successfully. Your image is hosted on Cloudinary." });
    } catch (requestError) {
      const status = requestError.response?.status;
      const detail = requestError.response?.data?.message;
      setMessage({
        type: "error",
        text: detail || (status === 413
          ? "The image is too large. Choose an image under 5 MB."
          : "Could not publish this product. Please check your connection and try again.")
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <section className="dashboard-page">
        <div className="empty-state">
          <h2>Login required</h2>
          <p>Log in with an artisan account to create and manage your handmade products.</p>
          <Link to="/login" className="primary-button">Login to continue</Link>
        </div>
      </section>
    );
  }

  const inventoryValue = products.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.stock) || 0),
    0
  );

  return (
    <section className="dashboard-page artisan-dashboard">
      <div className="dashboard-header artisan-page-heading">
        <div>
          <span className="eyebrow">Artisan studio</span>
          <h1>Your craft, your storefront.</h1>
          <p>Publish handmade pieces and keep your inventory in one place.</p>
        </div>
        <a className="primary-button" href="#add-product"><PackagePlus size={18} /> Add a product</a>
      </div>

      {message.text && (
        <div className={`product-form-message ${message.type}`} role="status" aria-live="polite">
          {message.type === "success" ? <CheckCircle2 size={20} /> : message.type === "error" ? <AlertCircle size={20} /> : <UploadCloud size={20} />}
          <span>{message.text}</span>
          {message.type === "error" && (
            <button type="button" className="message-dismiss" aria-label="Dismiss message" onClick={() => setMessage({ type: "", text: "" })}>
              <X size={17} />
            </button>
          )}
        </div>
      )}

      {error && <p className="notice">{error}</p>}

      <div className="dashboard-stats artisan-stat-cards">
        <div><ShoppingBag /><span>Products listed</span><strong>{products.length}</strong></div>
        <div><IndianRupee /><span>Inventory value</span><strong>₹{formatMoney(inventoryValue)}</strong></div>
        <div><BarChart3 /><span>Available listings</span><strong>{products.filter((item) => Number(item.stock) > 0).length}</strong></div>
      </div>

      <div className="dashboard-grid artisan-workspace">
        <section className="dashboard-panel inventory-panel">
          <div className="panel-heading">
            <div className="panel-icon"><Package size={20} /></div>
            <div>
              <h2>Product inventory</h2>
              <p>Your latest listings at a glance.</p>
            </div>
          </div>
          {loading ? (
            <p className="inventory-empty">Loading your products…</p>
          ) : products.length ? (
            <div className="artisan-inventory-list">
              {products.map((product) => (
                <article className="artisan-inventory-item" key={product._id || product.name}>
                  <div className="inventory-product-image">
                    {product.image ? <img src={product.image} alt={product.name} /> : <Package size={22} />}
                  </div>
                  <div className="inventory-product-copy">
                    <strong>{product.name}</strong>
                    <span>{product.category || "Handmade"} · {product.stock} in stock</span>
                    <small>₹{formatMoney(product.price)}</small>
                  </div>
                  <span className={`inventory-status ${Number(product.stock) > 0 ? "in-stock" : "out-of-stock"}`}>
                    {Number(product.stock) > 0 ? "Available" : "Sold out"}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <div className="inventory-empty">
              <div className="empty-inventory-icon"><PackagePlus size={26} /></div>
              <h3>Your shelf is waiting</h3>
              <p>Add your first handmade product using the form.</p>
              <a href="#add-product" className="secondary-button">Create first listing</a>
            </div>
          )}
        </section>

        <section className="dashboard-panel add-product-panel" id="add-product">
          <div className="panel-heading add-product-heading">
            <div className="panel-icon"><Sparkles size={20} /></div>
            <div>
              <span className="eyebrow">New listing</span>
              <h2>Add a handmade product</h2>
              <p>Share the story behind your craft.</p>
            </div>
          </div>

          <form ref={formRef} className="stacked-form add-product-form" onSubmit={saveProduct}>
            <div className="form-field">
              <label htmlFor="product-name">Product name <span>*</span></label>
              <input id="product-name" name="name" value={form.name} onChange={update} placeholder="e.g. Hand-painted blue pottery vase" maxLength="120" required />
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="product-category">Category <span>*</span></label>
                <select id="product-category" name="category" value={form.category} onChange={update} required>
                  <option value="" disabled>Select a category</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="product-price">Price (INR) <span>*</span></label>
                <div className="price-input-wrap">
                  <span>₹</span>
                  <input id="product-price" name="price" value={form.price} onChange={update} placeholder="e.g. 1,25,000" inputMode="decimal" autoComplete="off" required aria-describedby="price-help" />
                </div>
                <small id="price-help">Commas are okay for large amounts.</small>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="product-stock">Available quantity</label>
                <input id="product-stock" name="stock" value={form.stock} onChange={update} type="number" min="0" step="1" required />
              </div>
              <div className="form-field">
                <label htmlFor="product-material">Material</label>
                <input id="product-material" name="material" value={form.material} onChange={update} placeholder="e.g. Natural clay" maxLength="100" />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="product-origin">Made in / Origin</label>
              <input id="product-origin" name="origin" value={form.origin} onChange={update} placeholder="e.g. Jaipur, Rajasthan" maxLength="120" />
            </div>

            <div className="form-field">
              <label htmlFor="product-description">Product story <span>*</span></label>
              <textarea id="product-description" name="description" value={form.description} onChange={update} placeholder="Describe the craft, materials, process, and what makes it special…" rows="4" maxLength="2000" required />
              <small className="field-hint">{form.description.length}/2000 characters</small>
            </div>

            <div className="form-field">
              <label>Product photos <span>*</span></label>
              <label className={`image-dropzone ${imagePreview ? "has-image" : ""}`} htmlFor="product-image">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview of selected product" />
                    <span className="image-dropzone-caption"><CheckCircle2 size={17} /> {selectedImage?.name}</span>
                    <span className="image-change-hint">Click to change photo</span>
                  </>
                ) : (
                  <>
                    <span className="upload-icon"><ImagePlus size={25} /></span>
                    <strong>Choose a product photo</strong>
                    <span>JPG, PNG, WEBP or GIF · Maximum 5 MB</span>
                    <span className="upload-browse">Browse files</span>
                  </>
                )}
              </label>
              <input className="visually-hidden-file" id="product-image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseImage} required />
            </div>

            <button className="primary-button full publish-product-button" type="submit" disabled={saving}>
              <UploadCloud size={18} /> {saving ? "Uploading photo and publishing…" : "Publish product"}
            </button>
            <p className="form-security-note">Your photo is uploaded securely and stored with your product listing.</p>
          </form>
        </section>
      </div>
      {user?.role === "artisan" && <CategoryRequestPanel />}
    </section>
  );
};

export default ArtisanDashboard;
