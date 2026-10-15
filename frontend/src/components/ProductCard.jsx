import { Link } from "react-router-dom";
import { Heart, MapPin, Plus } from "lucide-react";
import { imageUrl } from "../api/assets.js";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const saved = isWishlisted(product._id);

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link to={`/products/${product._id}`} className="product-image-link">
        <img src={imageUrl(product.image)} alt={product.name} />
      </Link>
        <button className={`wishlist-heart ${saved ? "is-saved" : ""}`} onClick={() => toggleWishlist(product)} aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`} aria-pressed={saved}>
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="product-card-body">
        <div className="product-topline">
          <span>{product.category}</span>
          <strong>Rs. {product.price}</strong>
        </div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="artisan-line">
          <MapPin size={15} />
          {product.artisan?.location || product.origin}
        </div>
        <button className="primary-button full" onClick={() => addToCart(product)}>
          <Plus size={17} />
          Add to cart
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
