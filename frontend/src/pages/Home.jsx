import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import ProductCard from "../components/ProductCard.jsx";
import StatsCards from "../components/StatsCards.jsx";
import { useProducts } from "../hooks/useProducts.js";
import { useAuth } from "../context/AuthContext.jsx";

const Home = () => {
  const { products: featured, error } = useProducts({ featured: true });
  const { user, isLoggedIn } = useAuth();
  const isAdmin = user?.role === "admin";
  const isArtisan = user?.role === "artisan";

  return (
    <>
      {isLoggedIn && <div className="welcome-strip"><Sparkles size={18} /><span>{isAdmin ? "Admin workspace" : isArtisan ? "Your artisan studio" : "Your marketplace"} · Welcome back, <strong>{user.name}</strong></span><Link to={isAdmin ? "/admin" : isArtisan ? "/dashboard" : "/shop"}>{isAdmin ? "Open admin dashboard" : isArtisan ? "Manage your studio" : "Continue shopping"} <ArrowRight size={15} /></Link></div>}
      <section className={`hero-section ${isLoggedIn ? "hero-section-logged-in" : "hero-section-guest"}`}>
        <div className="hero-copy">
          <span className="eyebrow">{isLoggedIn ? "Made by hand, chosen by you" : "Handmade. Local. Fair."}</span>
          <h1>{isLoggedIn ? isAdmin ? "A clearer view of your craft marketplace." : isArtisan ? "Your next handmade story starts here." : "Find something made with meaning." : "Small-batch crafts. Big-hearted makers."}</h1>
          <p>{isLoggedIn ? isAdmin ? "Review seller applications, approve new categories, and follow sales trends from one calm workspace." : isArtisan ? "Publish your creations, request new categories, and grow your independent craft business." : "Pick up where you left off and discover thoughtfully made pieces from independent artisans." : "Discover original pottery, textiles, jewellery, and home pieces while supporting the people who make them."}</p>
          <div className="hero-actions">
            {isAdmin ? <Link to="/admin" className="primary-button">Open admin dashboard <ArrowRight size={18} /></Link> : <Link to="/shop" className="primary-button">{isLoggedIn ? "Explore the shop" : "Explore the collection"} <ArrowRight size={18} /></Link>}
            {!isLoggedIn && <Link to="/register" className="secondary-button">Become an artisan</Link>}
            {isArtisan && <Link to="/dashboard" className="secondary-button">Open my studio</Link>}
          </div>
        </div>
        <div className="hero-image"><img src="https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?auto=format&fit=crop&w=1200&q=80" alt="Artisan handmade craft table" /></div>
      </section>
      {!isAdmin && <StatsCards />}
      {!isAdmin && <section className="section-block"><div className="section-heading"><span className="eyebrow">Featured crafts</span><h2>{isLoggedIn ? "Picked for your next discovery" : "One-of-a-kind pieces to love"}</h2><p>Explore thoughtful objects made by real people, not mass production.</p></div>{error && <p className="notice">{error}</p>}<div className="product-grid">{featured.map((product) => <ProductCard product={product} key={product._id} />)}</div><div className="home-shop-link"><Link to="/shop" className="secondary-button">Browse every craft <ArrowRight size={16} /></Link></div></section>}
      <section className="trust-band"><div><HeartHandshake /><h3>Fair artisan income</h3><p>Direct selling helps makers receive better value for their craft.</p></div><div><BadgeCheck /><h3>Authentic handmade</h3><p>Each listing includes material, origin, and artisan information.</p></div><div><ShieldCheck /><h3>Reviewed seller access</h3><p>New artisan accounts are reviewed before seller tools become available.</p></div></section>
    </>
  );
};

export default Home;
