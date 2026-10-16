import { Link } from "react-router-dom";
import { Tags } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import ArtisanSidebar from "../components/ArtisanSidebar.jsx";
import CategoryRequestPanel from "../components/CategoryRequestPanel.jsx";

const SellerCategories = () => {
  const { user, isLoggedIn } = useAuth();
  if (!isLoggedIn || user?.role !== "artisan") return <section className="page-section"><h1>Seller access required</h1><p>Sign in with an approved seller account to request categories.</p><Link className="primary-button" to="/login">Log in</Link></section>;
  return <section className="seller-workspace-page"><ArtisanSidebar /><main className="seller-workspace-content"><div className="seller-page-title"><span className="eyebrow"><Tags size={15} /> CATALOG MANAGEMENT</span><h1>Category requests</h1><p>Request a new category when your craft doesn't fit an existing one. Products can use it after approval.</p></div><CategoryRequestPanel /></main></section>;
};

export default SellerCategories;
