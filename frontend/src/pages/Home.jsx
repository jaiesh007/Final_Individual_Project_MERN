import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, HeartHandshake, ShieldCheck } from "lucide-react";
import ProductCard from "../components/ProductCard.jsx";
import StatsCards from "../components/StatsCards.jsx";
import { useProducts } from "../hooks/useProducts.js";

const Home = () => {
  const { products: featured, error } = useProducts({ featured: true });

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Handmade. Local. Fair.</span>
          <h1>Artisan Handicraft Marketplace</h1>
          <p>
            A digital marketplace where craft makers can sell handmade products directly to
            customers and grow their small creative businesses.
          </p>
          <div className="hero-actions">
            <Link to="/shop" className="primary-button">
              Explore products <ArrowRight size={18} />
            </Link>
            <Link to="/register" className="secondary-button">Become an artisan</Link>
          </div>
        </div>
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?auto=format&fit=crop&w=1200&q=80"
            alt="Artisan handmade craft table"
          />
        </div>
      </section>

      <StatsCards />

      <section className="section-block">
        <div className="section-heading">
          <span className="eyebrow">Featured crafts</span>
          <h2>Popular handmade products</h2>
        </div>
        {error && <p className="notice">{error}</p>}
        <div className="product-grid">
          {featured.map((product) => <ProductCard product={product} key={product._id} />)}
        </div>
      </section>

      <section className="trust-band">
        <div>
          <HeartHandshake />
          <h3>Fair artisan income</h3>
          <p>Direct selling helps makers receive better value for their craft.</p>
        </div>
        <div>
          <BadgeCheck />
          <h3>Authentic handmade</h3>
          <p>Each listing includes material, origin, and artisan information.</p>
        </div>
        <div>
          <ShieldCheck />
          <h3>Simple order flow</h3>
          <p>Customers can browse, add to cart, and place orders with ease.</p>
        </div>
      </section>
    </>
  );
};

export default Home;
