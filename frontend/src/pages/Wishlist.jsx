import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

const Wishlist = () => {
  const { items, count, removeFromWishlist } = useWishlist();

  return (
    <section className="page-section wishlist-page">
      <div className="wishlist-heading">
        <div>
          <span className="eyebrow">Your personal collection</span>
          <h1>Saved crafts</h1>
          <p>Keep the handmade pieces you love in one easy-to-find place.</p>
        </div>
        <div className="wishlist-count"><Heart size={18} /> {count} saved {count === 1 ? "piece" : "pieces"}</div>
      </div>

      {items.length ? (
        <div className="wishlist-layout">
          <div className="product-grid">
            {items.map((product) => (
              <div className="wishlist-item" key={product._id}>
                <ProductCard product={product} />
                <button className="wishlist-remove" onClick={() => removeFromWishlist(product._id)}>
                  <Trash2 size={16} /> Remove from saved
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="wishlist-empty">
          <span className="wishlist-empty-icon"><Heart size={28} /></span>
          <h2>Your collection starts here</h2>
          <p>Tap the heart on any craft to save it here for later.</p>
          <Link to="/shop" className="primary-button"><ShoppingBag size={17} /> Explore the marketplace</Link>
        </div>
      )}
    </section>
  );
};

export default Wishlist;
