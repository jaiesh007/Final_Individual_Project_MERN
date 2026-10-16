import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShieldCheck, CreditCard, Truck } from "lucide-react";
import { useState } from "react";
import api from "../api/axios.js";
import { imageUrl } from "../api/assets.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

const DELIVERY_FEE = 80;
const initialAddress = { fullName: "", phone: "", address: "", city: "", pincode: "" };

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve(true);
  script.onerror = () => reject(new Error("Unable to load secure checkout. Check your connection."));
  document.body.appendChild(script);
});

const Cart = () => {
  const navigate = useNavigate();
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isLoggedIn, user } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [address, setAddress] = useState(initialAddress);

  const updateAddress = (event) => setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) { navigate("/login"); return; }
    if (user?.role !== "customer") { setMessage("Checkout is available from a customer account."); return; }
    setBusy(true);
    setMessage("");
    const checkoutItems = items.map((item) => ({ product: item._id, quantity: item.quantity }));
    try {
      if (paymentMethod === "cod") {
        await api.post("/orders", { items: checkoutItems, shippingAddress: address });
        clearCart();
        navigate("/orders?placed=1");
        return;
      }
      await loadRazorpay();
      const { data: paymentOrder } = await api.post("/payments/create-order", { items: checkoutItems, shippingAddress: address });
      const options = {
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Artisan Bazaar",
        description: "Handmade marketplace purchase",
        order_id: paymentOrder.orderId,
        prefill: { name: address.fullName, contact: address.phone, email: user.email },
        theme: { color: "#a6532f" },
        handler: async (response) => {
          try {
            await api.post("/payments/verify", response);
            clearCart();
            navigate("/orders?placed=1");
          } catch (error) {
            setMessage(error.response?.data?.message || "Payment was made but order confirmation failed. Save your payment ID and contact support.");
            setBusy(false);
          }
        },
        modal: { ondismiss: () => { setBusy(false); setMessage("Checkout was closed. No order was placed."); } }
      };
      const checkout = new window.Razorpay(options);
      checkout.on("payment.failed", (response) => { setMessage(response.error?.description || "Payment failed. Please try again."); setBusy(false); });
      checkout.open();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Could not start checkout. Check the backend and payment settings.");
      setBusy(false);
    }
  };

  return (
    <section className="page-section checkout-page">
      <div className="section-heading left"><span className="eyebrow">Secure checkout</span><h1>Your cart</h1><p>Review your pieces and tell us where to deliver them.</p></div>
      {message && <p className="notice" role="status">{message}</p>}
      {items.length === 0 ? <div className="empty-state"><h2>Your cart is empty</h2><p>Explore handmade products and support local artisans.</p><Link to="/shop" className="primary-button">Go to shop</Link></div> : <>
        <div className="cart-layout">
          <div className="cart-list">{items.map((item) => <article className="cart-row" key={item._id}><Link to={`/products/${item._id}`}><img src={imageUrl(item.image)} alt={item.name}/></Link><div><h3><Link to={`/products/${item._id}`}>{item.name}</Link></h3><span>₹{Number(item.price).toLocaleString("en-IN")}</span></div><div className="quantity-control"><button type="button" aria-label={`Decrease ${item.name} quantity`} disabled={item.quantity <= 1} onClick={() => updateQuantity(item._id, item.quantity - 1)}><Minus size={15}/></button><strong>{item.quantity}</strong><button type="button" aria-label={`Increase ${item.name} quantity`} disabled={item.quantity >= 100} onClick={() => updateQuantity(item._id, item.quantity + 1)}><Plus size={15}/></button></div><button type="button" className="icon-danger" aria-label={`Remove ${item.name}`} onClick={() => removeFromCart(item._id)}><Trash2 size={18}/></button></article>)}</div>
          <aside className="order-summary"><h2>Order summary</h2><div><span>Subtotal</span><strong>₹{total.toLocaleString("en-IN")}</strong></div><div><span>Delivery</span><strong>₹{DELIVERY_FEE}</strong></div><div className="grand-total"><span>Total</span><strong>₹{(total + DELIVERY_FEE).toLocaleString("en-IN")}</strong></div>
            <form className="checkout-form" onSubmit={placeOrder}>
              <h3>Delivery address</h3>
              <label>Full name<input name="fullName" value={address.fullName} onChange={updateAddress} autoComplete="name" maxLength={100} required/></label>
              <label>Phone number<input name="phone" value={address.phone} onChange={updateAddress} type="tel" autoComplete="tel" pattern="[0-9+() -]{8,20}" maxLength={20} required/></label>
              <label>Street address<textarea name="address" value={address.address} onChange={updateAddress} autoComplete="street-address" maxLength={300} rows={2} required/></label>
              <div className="checkout-address-grid"><label>City<input name="city" value={address.city} onChange={updateAddress} autoComplete="address-level2" maxLength={100} required/></label><label>PIN code<input name="pincode" value={address.pincode} onChange={updateAddress} autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{4,10}" maxLength={10} required/></label></div>
              <h3>Payment method</h3>
              <label className={paymentMethod === "cod" ? "payment-choice selected" : "payment-choice"}><input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")}/><Truck size={19}/><span><strong>Cash on Delivery</strong><small>Pay when your order arrives</small></span></label>
              <label className={paymentMethod === "razorpay" ? "payment-choice selected" : "payment-choice"}><input type="radio" name="paymentMethod" value="razorpay" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")}/><CreditCard size={19}/><span><strong>Pay online</strong><small>Secure card, UPI, or netbanking checkout</small></span></label>
              <p className="checkout-security-note"><ShieldCheck size={16}/> Your final total and available stock are checked by the server.</p>
              <button className="primary-button full" type="submit" disabled={busy}>{busy ? "Processing checkout…" : paymentMethod === "cod" ? "Place order" : "Continue to secure payment"}</button>
            </form>
          </aside>
        </div>
      </>}
    </section>
  );
};
export default Cart;
