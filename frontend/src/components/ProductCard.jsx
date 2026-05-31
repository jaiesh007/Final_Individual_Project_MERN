import { Link } from "react-router-dom";
import { MapPin, Plus } from "lucide-react";
import { imageUrl } from "../api/assets.js";
import { useCart } from "../context/CartContext.jsx";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`} className="product-image-link">
        <img src={imageUrl(product.image)} alt={product.name} />
      </Link>
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
