import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Truck } from "lucide-react";
import api from "../api/axios.js";
import ArtisanSidebar from "../components/ArtisanSidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const statuses = ["Pending", "Confirmed", "Shipped", "Delivered"];
const SellerOrders = () => {
  const { isLoggedIn, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    try { const { data } = await api.get("/orders/seller-orders"); setOrders(data); }
    catch (err) { setError(err.response?.data?.message || "Unable to load seller orders."); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (isLoggedIn && user?.role === "artisan") load(); else setLoading(false); }, [isLoggedIn, user?.id, user?.role]);
  const changeStatus = async (order, status) => {
    try { await api.patch(`/orders/${order._id}/status`, { status }); setNotice("Order status updated and customer notified."); setError(""); await load(); }
    catch (err) { setError(err.response?.data?.message || "You may update only orders containing exclusively your products."); }
  };
  if (!isLoggedIn || user?.role !== "artisan") return <section className="page-section"><h1>Seller access required</h1><Link to="/login" className="primary-button">Log in</Link></section>;
  return <section className="seller-workspace-page"><ArtisanSidebar/><main className="seller-workspace-content"><div className="seller-page-title"><span className="eyebrow"><Truck size={15}/> ORDER MANAGEMENT</span><h1>Customer orders</h1><p>Track sales and update fulfillment status for orders containing only your products.</p></div>
    {notice && <p className="notice" role="status">{notice}</p>}{error && <p className="notice" role="alert">{error}</p>}{loading && <p>Loading orders…</p>}
    {!loading && !orders.length && <div className="seller-empty"><Package size={28}/><h2>No orders yet</h2><p>When customers purchase your products, their orders will appear here.</p></div>}
    <div className="order-history-list">{orders.map((order) => {const ownOnly=(order.items||[]).every((item)=>item.product && String(item.product.artisan)===String(user.id)); return <article className="order-tracking-card" key={order._id}><header className="order-tracking-header"><div><span className="eyebrow">ORDER #{String(order._id).slice(-8).toUpperCase()}</span><h2>{order.user?.name || "Customer"} · {new Date(order.createdAt).toLocaleDateString("en-IN")}</h2></div><div className="order-tracking-total"><strong>₹{Number(order.totalAmount).toLocaleString("en-IN")}</strong><span>{order.paymentMethod} · {order.status}</span></div></header><div className="order-tracking-items">{order.items.map((item,index)=><div className="order-tracking-item" key={item._id||index}><div className="seller-order-product-icon"><Package size={18}/></div><div><strong>{item.name || item.product?.name || "Product"}</strong><span>Qty {item.quantity} · ₹{Number(item.price).toLocaleString("en-IN")}</span></div></div>)}</div><div className="seller-order-actions"><label>Update fulfillment status<select value={order.status} disabled={!ownOnly || order.status==="Cancelled"} onChange={(event)=>changeStatus(order,event.target.value)}>{[...statuses,"Cancelled"].map((status)=><option value={status} key={status}>{status}</option>)}</select></label>{!ownOnly&&<small>This order includes items from another seller; contact admin for a status change.</small>}</div></article>;})}</div>
  </main></section>;
};
export default SellerOrders;
