import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Package, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { imageUrl } from "../api/assets.js";
import { products } from "../data/products.js";
import { useCart } from "../context/CartContext.jsx";

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch {
        setError("Could not load from database, showing demo product.");
        setProduct(products.find((item) => item._id === id) || products[0]);
      }
    };

    loadProduct();
  }, [id]);

  if (!product) {
    return <section className="details-page"><p className="notice">Loading product...</p></section>;
  }

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
          <div className="detail-meta">
            <span><MapPin size={17} /> {product.origin}</span>
            <span><Package size={17} /> {product.stock} pieces available</span>
          </div>
          <div className="artisan-panel">
            <strong>{product.artisan?.name}</strong>
            <span>{product.material}</span>
          </div>
          <div className="price-row">
            <strong>Rs. {product.price}</strong>
            <button className="primary-button" onClick={() => addToCart(product)}>
              <ShoppingBag size={18} />
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetails;
