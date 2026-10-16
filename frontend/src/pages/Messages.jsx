import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, MessageCircle, Send } from "lucide-react";
import api from "../api/axios.js";
import { imageUrl } from "../api/assets.js";
import { useAuth } from "../context/AuthContext.jsx";

const Messages = () => {
  const { user, isLoggedIn } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedConversation = searchParams.get("conversation");
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const loadConversations = async () => {
    try {
      const { data } = await api.get("/interactions/conversations");
      setConversations(data);
      const selected = data.find((item) => item._id === requestedConversation) || data[0];
      if (selected) {
        const response = await api.get(`/interactions/conversations/${selected._id}`);
        setActive(response.data);
        if (requestedConversation !== selected._id) setSearchParams({ conversation: selected._id }, { replace: true });
      } else setActive(null);
    } catch {
      setNotice("Could not load messages. Please check your connection and try again.");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isLoggedIn && ["customer", "artisan"].includes(user?.role)) loadConversations(); else setLoading(false); }, [isLoggedIn, user?.id, user?.role, requestedConversation]);

  const openConversation = async (id) => {
    try {
      const { data } = await api.get(`/interactions/conversations/${id}`);
      setActive(data);
      setSearchParams({ conversation: id });
      setNotice("");
    } catch { setNotice("Unable to open this conversation."); }
  };

  const send = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !active || busy) return;
    setBusy(true);
    try {
      await api.post(`/interactions/conversations/${active._id}/messages`, { body });
      setDraft("");
      const { data } = await api.get(`/interactions/conversations/${active._id}`);
      setActive(data);
      setConversations((current) => current.map((item) => item._id === active._id ? { ...item, lastMessage: { body, senderName: user.name, createdAt: new Date().toISOString() } } : item));
      setNotice("");
    } catch (error) { setNotice(error.response?.data?.message || "Message could not be sent."); }
    finally { setBusy(false); }
  };

  if (!isLoggedIn) return <section className="page-section"><h1>Messages</h1><p>Log in to chat with artisans about their products.</p><Link className="primary-button" to="/login">Log in</Link></section>;
  if (!["customer", "artisan"].includes(user?.role)) return <section className="page-section"><h1>Messages</h1><p>Messaging is available to customers and sellers.</p></section>;

  return <section className="messages-page">
    <div className="messages-heading"><span className="eyebrow">DIRECT CONNECTION</span><h1>Messages</h1><p>Ask questions, confirm details, and connect about handmade products.</p></div>
    {notice && <p className="notice" role="status">{notice}</p>}
    <div className="messages-layout">
      <aside className="conversation-list"><h2>Your conversations</h2>{loading && <p>Loading chats…</p>}{!loading && !conversations.length && <p className="muted-empty">No conversations yet. Open a product page and choose “Chat with seller”.</p>}
        {conversations.map((conversation) => {
          const other = user.role === "customer" ? conversation.artisan?.name : conversation.customer?.name;
          return <button type="button" className={active?._id === conversation._id ? "conversation-choice active" : "conversation-choice"} key={conversation._id} onClick={() => openConversation(conversation._id)}>
            <img src={imageUrl(conversation.product?.image)} alt="" /><span><strong>{conversation.product?.name || "Product chat"}</strong><small>{other || "Marketplace member"}</small><small className="conversation-preview">{conversation.lastMessage?.body || "Start the conversation"}</small></span>
          </button>;
        })}
      </aside>
      <section className="message-thread">
        {active ? <>
          <header className="message-thread-header"><img src={imageUrl(active.product?.image)} alt="" /><div><strong>{active.product?.name || "Product conversation"}</strong><span>{user.role === "customer" ? `Seller: ${active.artisan?.name || "Artisan"}` : `Customer: ${active.customer?.name || "Customer"}`}</span></div>{active.product?._id && <Link to={`/products/${active.product._id}`} aria-label="View product"><ArrowUpRight size={18} /></Link>}</header>
          <div className="message-bubbles">{(active.messages || []).map((message) => <div key={message._id} className={String(message.sender?._id || message.sender) === String(user.id) ? "message-bubble mine" : "message-bubble"}><span>{message.senderName}</span><p>{message.body}</p><time>{new Date(message.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</time></div>)}
            {!active.messages?.length && <div className="thread-empty"><MessageCircle size={24} /><p>Say hello and ask about this handmade piece.</p></div>}
          </div>
          <form className="message-compose" onSubmit={send}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} maxLength={2000} placeholder="Write a message…" aria-label="Write a message" required /><button className="primary-button" disabled={busy || !draft.trim()}><Send size={17} /> {busy ? "Sending…" : "Send"}</button></form>
        </> : <div className="thread-empty"><MessageCircle size={32} /><h2>Select a conversation</h2><p>Your customer and seller conversations will appear here.</p></div>}
      </section>
    </div>
  </section>;
};

export default Messages;
