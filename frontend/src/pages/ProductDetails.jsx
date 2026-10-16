import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, Package, Send, ShoppingBag, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { imageUrl } from "../api/assets.js";
import { products } from "../data/products.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, isLoggedIn } = useAuth();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        if (active) setProduct(data);
      } catch {
        if (active) {
          setError("This product could not be loaded from the live marketplace.");
          setProduct(products.find((item) => item._id === id) || null);
        }
      }
    };
    const loadComments = async () => {
      try {
        const { data } = await api.get(`/interactions/products/${id}/comments`);
        if (active) setComments(data);
      } catch { if (active) setComments([]); }
    };
    loadProduct();
    loadComments();
    return () => { active = false; };
  }, [id]);

  const postComment = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) { navigate("/login"); return; }
    if (user?.role !== "customer") {
      setCommentMessage("Only customer accounts can post product comments.");
      return;
    }
    if (!commentDraft.trim()) return;
    setCommentBusy(true);
    setCommentMessage("");
    try {
      const { data } = await api.post(`/interactions/products/${id}/comments`, { body: commentDraft.trim() });
      setComments((current) => [data, ...current]);
      setCommentDraft("");
      setCommentMessage("Your comment was posted.");
    } catch (requestError) {
      setCommentMessage(requestError.response?.data?.message || "Could not post your comment. Try again.");
    } finally { setCommentBusy(false); }
  };

  const startChat = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    if (user?.role !== "customer") { setCommentMessage("Chat with a seller is available from a customer account."); return; }
    setChatBusy(true);
    try {
      const { data } = await api.post("/interactions/conversations", { productId: id });
      navigate(`/messages?conversation=${data._id}`);
    } catch (requestError) {
      setCommentMessage(requestError.response?.data?.message || "Could not start a chat. Please try again.");
    } finally { setChatBusy(false); }
  };

  if (!product) return <section className="details-page"><p className="notice">{error || "Loading product…"}</p><Link to="/shop" className="back-link"><ArrowLeft size={17} /> Back to shop</Link></section>;

  return (
    <section className="details-page">
      <Link to="/shop" className="back-link"><ArrowLeft size={17} /> Back to shop</Link>
      {error && <p className="notice">{error}</p>}
      <div className="details-grid">
        <img src={imageUrl(product.image)} alt={product.name} className="details-image" />
        <div className="details-copy">
          <span className="eyebrow">{product.category}</span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="detail-meta"><span><MapPin size={17} /> {product.origin || product.artisan?.location || "Handmade with care"}</span><span><Package size={17} /> {product.stock} pieces available</span></div>
          <div className="artisan-panel"><div className="artisan-avatar"><UserRound size={20} /></div><div><strong>{product.artisan?.name || "Independent artisan"}</strong><span>{product.artisan?.craftType || product.material || "Handcrafted product"}</span>{product.artisan?.story && <p>{product.artisan.story}</p>}</div></div>
          <div className="price-row"><strong>Rs. {product.price}</strong><button className="primary-button" disabled={Number(product.stock) <= 0} onClick={() => addToCart(product)}><ShoppingBag size={18} /> {Number(product.stock) > 0 ? "Add to cart" : "Sold out"}</button></div>
          {product.artisan?._id && <button className="secondary-button chat-seller-button" onClick={startChat} disabled={chatBusy}><MessageCircle size={18} /> {chatBusy ? "Opening chat…" : "Chat with seller"}</button>}
        </div>
      </div>

      <section className="product-comments-section">
        <div className="product-comments-heading"><div><span className="eyebrow">COMMUNITY</span><h2>Customer comments</h2><p>Questions and helpful notes from people exploring this product.</p></div><span className="comment-count">{comments.length} {comments.length === 1 ? "comment" : "comments"}</span></div>
        {isLoggedIn && user?.role === "customer" ? <form className="product-comment-form" onSubmit={postComment}><label htmlFor="product-comment">Add your comment</label><textarea id="product-comment" value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} maxLength={1000} rows={3} placeholder="Share a question or helpful comment about this product…" required /><div><small>{commentDraft.length}/1000</small><button className="primary-button" disabled={commentBusy || !commentDraft.trim()}><Send size={16} /> {commentBusy ? "Posting…" : "Post comment"}</button></div></form> : <p className="comment-login-note"><Link to="/login">Log in as a customer</Link> to leave a comment.</p>}
        {commentMessage && <p className="notice" role="status">{commentMessage}</p>}
        <div className="product-comment-list">{comments.length ? comments.map((comment) => <article className="product-comment" key={comment._id}><div className="comment-avatar">{(comment.customerName || "C").slice(0, 1).toUpperCase()}</div><div><div className="comment-author"><strong>{comment.customerName}</strong><time>{new Date(comment.createdAt).toLocaleDateString("en-IN")}</time></div><p>{comment.body}</p></div></article>) : <div className="no-comments"><MessageCircle size={22} /><p>No comments yet. Be the first to start a helpful conversation about this product.</p></div>}</div>
      </section>
    </section>
  );
};

export default ProductDetails;
