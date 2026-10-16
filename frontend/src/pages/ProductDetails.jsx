import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, Package, Send, ShoppingBag, UserRound, Star } from "lucide-react";
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
  const [chatBusy, setChatBusy] = useState(false);\n  const [ratingData, setRatingData] = useState({ average: 0, count: 0, reviews: [] });\n  const [ratingValue, setRatingValue] = useState(5);\n  const [reviewDraft, setReviewDraft] = useState("");\n  const [ratingBusy, setRatingBusy] = useState(false);\n  const [ratingMessage, setRatingMessage] = useState("");

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
    const loadRatings = async () => {\n      try { const { data } = await api.get(`/ratings/${id}`); if (active) setRatingData(data); }\n      catch { if (active) setRatingData({ average: 0, count: 0, reviews: [] }); }\n    };\n    const loadComments = async () => {
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

  const submitReview = async (event) => {\n    event.preventDefault();\n    if (!isLoggedIn) { navigate("/login"); return; }\n    if (user?.role !== "customer") { setRatingMessage("Only customer accounts can submit reviews."); return; }\n    setRatingBusy(true); setRatingMessage("");\n    try {\n      await api.post(`/ratings/${id}`, { rating: ratingValue, review: reviewDraft.trim() });\n      const { data } = await api.get(`/ratings/${id}`); setRatingData(data); setReviewDraft(""); setRatingMessage("Your rating was saved.");\n    } catch (error) { setRatingMessage(error.response?.data?.message || "Could not save your rating."); }\n    finally { setRatingBusy(false); }\n  };\n\n  const startChat = async () => {
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

      <section className="product-ratings-section">
        <div className="product-comments-heading"><div><span className="eyebrow">CUSTOMER REVIEWS</span><h2>Ratings and reviews</h2><p>Help shoppers make an informed choice with thoughtful feedback.</p></div><div className="rating-summary"><strong>{ratingData.average.toFixed(1)}</strong><span className="rating-stars" aria-label={`${ratingData.average} out of 5 stars`}>{[1,2,3,4,5].map((star) => <Star key={star} size={17} fill={star <= Math.round(ratingData.average) ? "currentColor" : "none"}/>)}</span><small>{ratingData.count} {ratingData.count === 1 ? "review" : "reviews"}</small></div></div>
        {isLoggedIn && user?.role === "customer" ? <form className="product-comment-form rating-form" onSubmit={submitReview}><label>Your rating</label><div className="rating-picker" role="radiogroup" aria-label="Choose a star rating">{[1,2,3,4,5].map((star) => <button type="button" key={star} className={star <= ratingValue ? "rating-star selected" : "rating-star"} aria-label={`${star} star`} aria-pressed={ratingValue === star} onClick={() => setRatingValue(star)}><Star size={26} fill={star <= ratingValue ? "currentColor" : "none"}/></button>)}</div><label htmlFor="product-review">Written review (optional)</label><textarea id="product-review" value={reviewDraft} onChange={(event) => setReviewDraft(event.target.value)} maxLength={1000} rows={3} placeholder="What did you like? How was the craft or finish?"/><div><small>{reviewDraft.length}/1000</small><button className="primary-button" disabled={ratingBusy}><Star size={16}/> {ratingBusy ? "Saving…" : "Submit review"}</button></div></form> : <p className="comment-login-note"><Link to="/login">Log in as a customer</Link> to rate this product.</p>}
        {ratingMessage && <p className="notice" role="status">{ratingMessage}</p>}
        <div className="product-comment-list">{ratingData.reviews.length ? ratingData.reviews.map((review) => <article className="product-comment" key={review._id}><div className="comment-avatar">{(review.customerName || "C").slice(0,1).toUpperCase()}</div><div><div className="comment-author"><strong>{review.customerName}</strong><time>{new Date(review.createdAt).toLocaleDateString("en-IN")}</time></div><div className="review-stars">{[1,2,3,4,5].map((star) => <Star key={star} size={14} fill={star <= review.rating ? "currentColor" : "none"}/>)}</div>{review.review && <p>{review.review}</p>}</div></article>) : <div className="no-comments"><Star size={22}/><p>No reviews yet. Be the first to rate this product.</p></div>}</div>
      </section>

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
