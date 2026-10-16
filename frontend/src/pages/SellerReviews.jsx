import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquareText, Package, Star } from "lucide-react";
import api from "../api/axios.js";
import { imageUrl } from "../api/assets.js";
import { useAuth } from "../context/AuthContext.jsx";
import ArtisanSidebar from "../components/ArtisanSidebar.jsx";

const SellerReviews = () => {
  const { user, isLoggedIn } = useAuth();
  const [products, setProducts] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await api.get("/products", { params: { artisan: user?.id, limit: 48, page: 1 } });
        const items = Array.isArray(data) ? data : data.items || [];
        if (!active) return;
        setProducts(items);
        const entries = await Promise.all(items.map(async (product) => {
          try {
            const response = await api.get(`/interactions/products/${product._id}/comments`);
            return [product._id, response.data || []];
          } catch { return [product._id, []]; }
        }));
        if (active) setComments(Object.fromEntries(entries));
      } catch {
        if (active) setError("Could not load your product feedback. Please try again.");
      } finally { if (active) setLoading(false); }
    };
    if (user?.id && user?.role === "artisan") load();
    else setLoading(false);
    return () => { active = false; };
  }, [user?.id, user?.role]);

  if (!isLoggedIn || user?.role !== "artisan") return <section className="page-section"><h1>Seller access required</h1><Link to="/login" className="primary-button">Log in</Link></section>;

  return <section className="seller-workspace-page">
    <ArtisanSidebar />
    <main className="seller-workspace-content">
      <div className="seller-page-title"><span className="eyebrow"><MessageSquareText size={15} /> CUSTOMER VOICE</span><h1>Product feedback</h1><p>Read comments customers leave on your listings and use them to improve your storefront.</p></div>
      {loading && <p className="notice">Loading product feedback…</p>}
      {error && <p className="notice">{error}</p>}
      {!loading && !products.length && <div className="seller-empty"><Package size={28} /><h2>No products yet</h2><p>Publish your first product to start receiving customer feedback.</p><Link className="primary-button" to="/dashboard#add-product">Add a product</Link></div>}
      <div className="seller-feedback-list">{products.map((product) => <article className="seller-feedback-card" key={product._id}>
        <div className="seller-feedback-product"><img src={imageUrl(product.image)} alt={product.name} /><div><span className="eyebrow">{product.category}</span><h2>{product.name}</h2><Link to={`/products/${product._id}`}>View product</Link></div><span className="feedback-count"><MessageSquareText size={15} /> {(comments[product._id] || []).length}</span></div>
        <div className="seller-feedback-comments">{(comments[product._id] || []).length ? comments[product._id].map((comment) => <div className="seller-feedback-comment" key={comment._id}><div><strong>{comment.customerName}</strong><time>{new Date(comment.createdAt).toLocaleDateString("en-IN")}</time></div><p>{comment.body}</p></div>) : <p className="muted-empty"><Star size={15} /> No comments yet. Share your product page with customers to invite feedback.</p>}</div>
      </article>)}</div>
    </main>
  </section>;
};

export default SellerReviews;
