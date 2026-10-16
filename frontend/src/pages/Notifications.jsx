import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, MessageCircle, Package, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const iconFor = (type) => type === "message" ? <MessageCircle size={18}/> : type === "order" || type === "status" ? <Package size={18}/> : type === "comment" ? <Star size={18}/> : <Bell size={18}/>;

const Notifications = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { const { data } = await api.get("/notifications"); setItems(data.items || []); setUnread(data.unread || 0); }
    catch (err) { setError(err.response?.data?.message || "Unable to load notifications."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (isLoggedIn) load(); else setLoading(false); }, [isLoggedIn, load]);
  const openItem = async (item) => {
    if (!item.readAt) {
      try { await api.patch(`/notifications/${item._id}/read`); setUnread((value) => Math.max(0, value - 1)); setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, readAt: new Date().toISOString() } : entry)); } catch {}
    }
    navigate(item.link || "/");
  };
  const markAll = async () => {
    try { await api.patch("/notifications/read-all"); setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }))); setUnread(0); }
    catch (err) { setError(err.response?.data?.message || "Unable to mark notifications as read."); }
  };
  if (!isLoggedIn) return <section className="page-section"><div className="empty-state"><h1>Notifications</h1><p>Log in to see order, review, and message updates.</p><Link to="/login" className="primary-button">Log in</Link></div></section>;
  return <section className="page-section notification-page">
    <div className="notification-heading"><div><span className="eyebrow">Stay in the loop</span><h1>Notifications</h1><p>Order updates, new messages, and product feedback in one place.</p></div>{unread > 0 && <button className="secondary-button" onClick={markAll}><CheckCheck size={17}/> Mark all read</button>}</div>
    {error && <p className="notice" role="alert">{error}</p>}
    {loading && <p>Loading notifications…</p>}
    {!loading && !items.length && <div className="empty-state"><Bell size={28}/><h2>You're all caught up</h2><p>New order and marketplace updates will appear here.</p></div>}
    <div className="notification-list">{items.map((item) => <button type="button" key={item._id} onClick={() => openItem(item)} className={item.readAt ? "notification-item read" : "notification-item unread"}><span className="notification-icon">{iconFor(item.type)}</span><span className="notification-copy"><strong>{item.title}</strong><span>{item.body}</span><time>{new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time></span>{!item.readAt && <span className="notification-dot" aria-label="Unread"/>}</button>)}</div>
  </section>;
};
export default Notifications;
