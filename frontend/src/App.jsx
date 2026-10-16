import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Cart from "./pages/Cart.jsx";
import ArtisanDashboard from "./pages/ArtisanDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import SellerCategories from "./pages/SellerCategories.jsx";
import SellerReviews from "./pages/SellerReviews.jsx";
import Messages from "./pages/Messages.jsx";
import Orders from "./pages/Orders.jsx";
import Notifications from "./pages/Notifications.jsx";
import SellerOrders from "./pages/SellerOrders.jsx";
import Profile from "./pages/Profile.jsx";

const App = () => (
  <div className="app-shell">
    <Navbar />
    <main>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/dashboard" element={<ArtisanDashboard />} />
        <Route path="/seller/categories" element={<SellerCategories />} />
        <Route path="/seller/reviews" element={<SellerReviews />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/seller/orders" element={<SellerOrders />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

export default App;
