import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { Heart, HandHeart, LogOut, ShoppingBag, Store, LayoutDashboard, MessageCircle, Bell, Package, } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

const Navbar = () => {
  const { count } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let active = true;
    if (isLoggedIn) api.get("/notifications").then(({ data }) => { if (active) setUnread(data.unread || 0); }).catch(() => {});
    else setUnread(0);
    return () => { active = false; };
  }, [isLoggedIn, user?.id, location.pathname]);
  const isAdmin = user?.role === "admin";
  const isArtisan = user?.role === "artisan" && user?.artisanStatus === "approved";
  const isCustomer = user?.role === "customer";

  return (
    <header className="navbar">
      <Link to="/" className="brand"><span className="brand-mark"><HandHeart size={22} /></span><span>Artisan Bazaar</span></Link>
      <nav aria-label="Main navigation" className="navbar-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/shop">Shop</NavLink>
        {isCustomer && <><NavLink to="/orders"><Package size={15} /> Orders</NavLink><NavLink to="/messages"><MessageCircle size={15} /> Messages</NavLink></>}
        {isAdmin && <NavLink to="/admin"><LayoutDashboard size={15} /> Admin</NavLink>}
        {isArtisan && <NavLink to="/dashboard"><Store size={15} /> Seller studio</NavLink>}
      </nav>
      <div className="nav-actions">
        {isLoggedIn ? <button className="ghost-button" onClick={logout}><LogOut size={17} />{user.name} · Logout</button> : <Link to="/login" className="ghost-button">Login</Link>}
        {isLoggedIn && <Link to="/notifications" className="notification-nav-button" aria-label={`Notifications, ${unread} unread`}><Bell size={18}/>{unread > 0 && <span>{unread > 99 ? "99+" : unread}</span>}</Link>}
        {!isAdmin && <Link to="/wishlist" className="wishlist-nav-button" aria-label={`Wishlist, ${wishlistCount} saved items`}><Heart size={18} /><span>{wishlistCount}</span></Link>}
        {!isAdmin && <Link to="/cart" className="cart-button" aria-label="Cart"><ShoppingBag size={18} /><span>{count}</span></Link>}
        {!isLoggedIn && <Link to="/register" className="primary-button small"><Store size={17} />Join</Link>}
        {isLoggedIn && user?.role === "artisan" && <Link to="/messages" className="wishlist-nav-button" aria-label="Seller messages"><MessageCircle size={18} /></Link>}
      </div>
    </header>
  );
};

export default Navbar;
