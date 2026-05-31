import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import api from "../api/axios.js";
import { imageUrl } from "../api/assets.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

const Cart = () => {
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const [message, setMessage] = useState("");

  const placeOrder = async () => {
    if (!isLoggedIn) {
      setMessage("Please login before placing an order.");
      return;
    }

    try {
      await api.post("/orders", {
        items: items.map((item) => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          fullName: "Demo Customer",
          phone: "9999999999",
          address: "College project demo address",
          city: "Demo City",
          pincode: "000000"
        },
        totalAmount: total + 80
      });
      clearCart();
      setMessage("Order placed successfully and saved to database.");
    } catch {
      setMessage("Could not place order. Check backend and MongoDB connection.");
    }
  };

  return (
    <section className="page-section">
      <div className="section-heading left">
        <span className="eyebrow">Checkout</span>
        <h1>Your cart</h1>
      </div>
      {message && <p className="notice">{message}</p>}
      {items.length === 0 ? (
        <div className="empty-state">
          <h2>Your cart is empty</h2>
          <p>Explore handmade products and support local artisans.</p>
          <Link to="/shop" className="primary-button">Go to shop</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {items.map((item) => (
              <article className="cart-row" key={item._id}>
                <img src={imageUrl(item.image)} alt={item.name} />
                <div>
                  <h3>{item.name}</h3>
                  <span>Rs. {item.price}</span>
                </div>
                <div className="quantity-control">
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1)}><Minus size={15} /></button>
                  <strong>{item.quantity}</strong>
                  <button onClick={() => updateQuantity(item._id, item.quantity + 1)}><Plus size={15} /></button>
                </div>
                <button className="icon-danger" onClick={() => removeFromCart(item._id)}>
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
          </div>
          <aside className="order-summary">
            <h2>Order summary</h2>
            <div><span>Subtotal</span><strong>Rs. {total}</strong></div>
            <div><span>Delivery</span><strong>Rs. 80</strong></div>
            <div className="grand-total"><span>Total</span><strong>Rs. {total + 80}</strong></div>
            <button className="primary-button full" onClick={placeOrder}>Place order</button>
          </aside>
        </div>
      )}
    </section>
  );
};

export default Cart;
