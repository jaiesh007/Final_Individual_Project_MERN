import { Link, NavLink } from "react-router-dom";
import { HandHeart, LogOut, ShoppingBag, Store } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

const Navbar = () => {
  const { count } = useCart();
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark"><HandHeart size={22} /></span>
        <span>Artisan Bazaar</span>
      </Link>
      <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/shop">Shop</NavLink>
        <NavLink to="/dashboard">Artisan Dashboard</NavLink>
      </nav>
      <div className="nav-actions">
        {isLoggedIn ? (
          <button className="ghost-button" onClick={logout}>
            <LogOut size={17} />
            {user.name}
          </button>
        ) : (
          <Link to="/login" className="ghost-button">Login</Link>
        )}
        <Link to="/cart" className="cart-button" aria-label="Cart">
          <ShoppingBag size={18} />
          <span>{count}</span>
        </Link>
        <Link to="/register" className="primary-button small">
          <Store size={17} />
          Join
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
