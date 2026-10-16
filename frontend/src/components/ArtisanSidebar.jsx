import { NavLink } from "react-router-dom";
import { LayoutDashboard, PackagePlus, Tags, MessageCircle, MessageSquareText, Truck } from "lucide-react";

const ArtisanSidebar = () => (
  <aside className="artisan-sidebar">
    <div className="artisan-sidebar-heading"><span className="eyebrow">WORKSPACE</span><strong>Seller studio</strong></div>
    <nav aria-label="Seller workspace">
      <NavLink end to="/dashboard"><LayoutDashboard size={18} /> Overview & inventory</NavLink>
      <NavLink to="/dashboard#add-product"><PackagePlus size={18} /> Add product</NavLink>
      <NavLink to="/seller/categories"><Tags size={18} /> Request category</NavLink>
      <NavLink to="/seller/reviews"><MessageSquareText size={18} /> Product feedback</NavLink>
      <NavLink to="/seller/orders"><Truck size={18} /> Customer orders</NavLink>
      <NavLink to="/messages"><MessageCircle size={18} /> Messages</NavLink>
    </nav>
    <p className="artisan-sidebar-note">Keep your listings fresh and answer customer questions to build trust.</p>
  </aside>
);

export default ArtisanSidebar;
