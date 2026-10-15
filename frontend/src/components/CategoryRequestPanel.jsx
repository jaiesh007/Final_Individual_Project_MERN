import { useEffect, useState } from "react";
import { BadgeCheck, Clock3, Send } from "lucide-react";
import api from "../api/axios.js";

const CategoryRequestPanel = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { const { data } = await api.get("/categories/mine"); setRequests(data); }
    catch { setMessage("Could not load category request history."); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { data } = await api.post("/categories/requests", { name, description });
      setRequests((current) => [data, ...current]);
      setName("");
      setDescription("");
      setMessage("Request sent. The category will be available after admin approval.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not submit the request.");
    } finally { setBusy(false); }
  };

  return (
    <section className="dashboard-panel category-request-panel">
      <div className="panel-heading"><div className="panel-icon"><BadgeCheck size={20} /></div><div><h2>Request a new category</h2><p>Suggest a craft category not listed in the shop. Admin approval is required.</p></div></div>
      <form className="category-request-form" onSubmit={submit}>
        <label>Category name<input value={name} onChange={(e) => setName(e.target.value)} minLength={3} maxLength={60} placeholder="e.g. Stone carving" required /></label>
        <label>Why should we add it?<textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} placeholder="Describe the craft and products that fit this category." /></label>
        <button className="primary-button" type="submit" disabled={busy}><Send size={16} /> {busy ? "Sending…" : "Submit for review"}</button>
      </form>
      {message && <p className="notice" role="status">{message}</p>}
      <div className="category-request-history"><h3>Your requests</h3>{requests.length ? requests.map((request) => <article key={request._id}><div><strong>{request.name}</strong><small>{new Date(request.createdAt).toLocaleDateString("en-IN")}{request.reviewNote ? ` · ${request.reviewNote}` : ""}</small></div><span className={`status-pill status-${request.status}`}>{request.status === "pending" && <Clock3 size={13} />}{request.status}</span></article>) : <p>No category requests yet.</p>}</div>
    </section>
  );
};

export default CategoryRequestPanel;
