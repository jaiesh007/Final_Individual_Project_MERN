import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock3, Package, Truck } from "lucide-react";
import api from "../api/axios.js";
import { imageUrl } from "../api/assets.js";
import { useAuth } from "../context/AuthContext.jsx";

const steps = ["Pending", "Confirmed", "Shipped", "Delivered"];
const Orders = () => {
  const { isLoggedIn, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (!isLoggedIn || user?.role !== "customer") { setLoading(false); return () => { active = false; }; }
    api.get("/orders/my-orders").then(({ data }) => { if (active) setOrders(data); })
      .catch((err) => { if (active) setError(err.response?.data?.message || "Unable to load your orders."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isLoggedIn, user?.id, user?.role]);

  if (!isLoggedIn) return <section className="page-section"><div className="empty-state"><h1>Track your orders</h1><p>Log in to view your purchases and delivery updates.</p><Link className="primary-button" to="/login">Log in</Link></div></section>;
  if (user?.role !== "customer") return <section className="page-section"><div className="empty-state"><h1>Customer order history</h1><p>Order history is available from a customer account.</p><Link className="primary-button" to="/shop">Browse shop</Link></div></section>;

  return <section className="page-section order-history-page">
    <div className="section-heading left"><span className="eyebrow">Your purchases</span><h1>Order tracking</h1><p>Follow each order from confirmation to delivery.</p></div>
    {error && <p className="notice" role="alert">{error}</p>}
    {loading && <p>Loading your orders…</p>}
    {!loading && !orders.length && <div className="empty-state"><Package size={28}/><h2>No orders yet</h2><p>Your purchases and their delivery progress will appear here.</p><Link className="primary-button" to="/shop">Explore handmade products</Link></div>}
    <div className="order-history-list">{orders.map((order) => {
      const current = steps.indexOf(order.status);
      const cancelled = order.status === "Cancelled";
      return <article className="order-tracking-card" key={order._id}>
        <header className="order-tracking-header"><div><span className="eyebrow">ORDER #{String(order._id).slice(-8).toUpperCase()}</span><h2>{new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</h2></div><div className="order-tracking-total"><strong>₹{Number(order.totalAmount).toLocaleString("en-IN")}</strong><span>{order.paymentMethod} · {order.paymentStatus || "Pending payment"}</span></div></header>
        <div className="order-tracking-items">{order.items.map((item, index) => <div key={item._id || index} className="order-tracking-item"><img src={imageUrl(item.product?.image)} alt={item.name || item.product?.name || "Product"} /><div><strong>{item.name || item.product?.name || "Marketplace product"}</strong><span>Quantity: {item.quantity} · ₹{Number(item.price).toLocaleString("en-IN")}</span></div></div>)}</div>
        <div className="order-progress">{steps.map((step, index) => <div key={step} className={(!cancelled && current >= index) ? "order-progress-step complete" : "order-progress-step"}><span>{current > index ? <CheckCircle2 size={17}/> : index === 2 ? <Truck size={17}/> : <Clock3 size={17}/>}</span><small>{step}</small></div>)}</div>
        {cancelled && <p className="order-cancelled">This order has been cancelled. Contact support if you need help.</p>}
        <div className="order-tracking-footer"><span>Delivering to {order.shippingAddress?.city || "your address"}</span><Link to="/notifications">View updates</Link></div>
      </article>;
    })}</div>
  </section>;
};
export default Orders;
