import { useCallback, useEffect, useState } from "react";
import { BarChart3, Boxes, Check, CircleDollarSign, ClipboardList, Package, RefreshCw, ShieldCheck, Store, Users, X } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
const initialPage = { items: [], page: 1, total: 0, totalPages: 1 };

const Pager = ({ data, onPage }) => (
  <div className="admin-pager">
    <span>Showing {data.items.length} of {data.total}</span>
    <div>
      <button type="button" disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>Previous</button>
      <span>Page {data.page} / {data.totalPages}</span>
      <button type="button" disabled={data.page >= data.totalPages} onClick={() => onPage(data.page + 1)}>Next</button>
    </div>
  </div>
);

const MetricChart = ({ data, metric, formatter, label }) => {
  const max = Math.max(1, ...data.map((item) => Number(item[metric]) || 0));
  return (
    <div className="admin-chart" role="img" aria-label={label}>
      {data.map((item) => (
        <div className="admin-chart-column" key={item.label} title={`${item.label}: ${formatter(item[metric])}`}>
          <strong>{formatter(item[metric])}</strong>
          <div className="admin-chart-track"><span style={{ height: `${Math.max(4, (item[metric] / max) * 100)}%` }} /></div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const { user, isLoggedIn } = useAuth();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [data, setData] = useState(initialPage);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadOverview = useCallback(async () => {
    try {
      const response = await api.get("/admin/overview");
      setOverview(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load analytics.");
    }
  }, []);

  const loadList = useCallback(async () => {
    if (tab === "overview") return;
    setLoading(true);
    setError("");
    try {
      let endpoint = "/admin/products";
      const params = { page, limit: 8 };
      if (tab === "sellers") {
        endpoint = "/admin/users";
        params.role = "artisan";
        if (statusFilter !== "all") params.status = statusFilter;
      }
      if (tab === "orders") endpoint = "/admin/orders";
      if (tab === "categories") {
        endpoint = "/admin/category-requests";
        if (statusFilter !== "all") params.status = statusFilter;
      }
      if (search.trim()) params.search = search.trim();
      const response = await api.get(endpoint, { params });
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load this section.");
    } finally {
      setLoading(false);
    }
  }, [tab, page, search, statusFilter]);

  useEffect(() => { if (isLoggedIn && user?.role === "admin") loadOverview(); }, [isLoggedIn, user, loadOverview]);
  useEffect(() => { loadList(); }, [loadList]);

  const changeTab = (next) => {
    setTab(next);
    setPage(1);
    setSearch("");
    setStatusFilter(next === "sellers" || next === "categories" ? "pending" : "all");
    setNotice("");
  };

  const reviewArtisan = async (id, status) => {
    try {
      await api.patch(`/admin/artisans/${id}/approval`, { status });
      setNotice(`Artisan application ${status}.`);
      await Promise.all([loadOverview(), loadList()]);
    } catch (err) { setError(err.response?.data?.message || "Could not update artisan approval."); }
  };

  const reviewCategory = async (id, status) => {
    try {
      await api.patch(`/admin/category-requests/${id}`, { status });
      setNotice(`Category request ${status}.`);
      await Promise.all([loadOverview(), loadList()]);
    } catch (err) { setError(err.response?.data?.message || "Could not update category request."); }
  };

  if (!isLoggedIn) return <section className="page-section"><div className="empty-state"><h2>Admin sign-in required</h2><p>Sign in with your administrator account to access marketplace management.</p><Link to="/login" className="primary-button">Login</Link></div></section>;
  if (user?.role !== "admin") return <section className="page-section"><div className="empty-state"><h2>Administrator access only</h2><p>This workspace is restricted to approved marketplace administrators.</p><Link to="/shop" className="primary-button">Return to shop</Link></div></section>;

  const totals = overview?.totals || {};
  const tabs = [
    ["overview", "Overview", BarChart3], ["products", "Products", Package],
    ["sellers", "Sellers", Store], ["orders", "Purchases", ClipboardList],
    ["categories", "Category requests", Boxes]
  ];

  return (
    <section className="page-section admin-page">
      <div className="dashboard-header admin-heading">
        <div><span className="eyebrow">Marketplace control room</span><h1>Welcome back, {user.name}.</h1><p>Review sellers, moderate categories, and track marketplace performance.</p></div>
        <button type="button" className="secondary-button" onClick={() => { loadOverview(); loadList(); }}><RefreshCw size={17} /> Refresh data</button>
      </div>
      <nav className="admin-tabs" aria-label="Admin sections">
        {tabs.map(([id, label, Icon]) => <button type="button" key={id} className={tab === id ? "active" : ""} onClick={() => changeTab(id)}><Icon size={17} />{label}{id === "sellers" && totals.pendingArtisans > 0 && <span className="admin-tab-count">{totals.pendingArtisans}</span>}</button>)}
      </nav>
      {notice && <p className="admin-notice success" role="status">{notice}</p>}
      {error && <p className="admin-notice error" role="alert">{error}</p>}

      {tab === "overview" && (
        <>
          <div className="admin-metrics">
            <article><Users /><span>Total accounts</span><strong>{totals.users ?? "—"}</strong></article>
            <article><Store /><span>Approved artisans</span><strong>{totals.artisans ?? "—"}</strong></article>
            <article><Package /><span>Products listed</span><strong>{totals.products ?? "—"}</strong></article>
            <article><ClipboardList /><span>Orders placed</span><strong>{totals.orders ?? "—"}</strong></article>
            <article><CircleDollarSign /><span>Recorded sales</span><strong>{money(totals.revenue)}</strong></article>
            <article><ShieldCheck /><span>Pending approvals</span><strong>{totals.pendingArtisans ?? "—"}</strong></article>
          </div>
          <div className="admin-overview-grid">
            <section className="dashboard-panel admin-panel"><div className="panel-heading"><div className="panel-icon"><BarChart3 size={20} /></div><div><h2>Sales trend</h2><p>Completed and active orders, last six months</p></div></div>{overview ? <MetricChart data={overview.salesByMonth || []} metric="revenue" formatter={money} label="Revenue by month bar chart" /> : <p>Loading chart…</p>}</section>
            <section className="dashboard-panel admin-panel"><div className="panel-heading"><div className="panel-icon"><ClipboardList size={20} /></div><div><h2>Purchase volume</h2><p>Number of orders per month</p></div></div>{overview ? <MetricChart data={overview.salesByMonth || []} metric="orders" formatter={(value) => String(value || 0)} label="Orders per month bar chart" /> : <p>Loading chart…</p>}</section>
            <section className="dashboard-panel admin-panel"><div className="panel-heading"><div className="panel-icon"><Boxes size={20} /></div><div><h2>Product categories</h2><p>Current inventory by category</p></div></div><div className="admin-rank-list">{(overview?.categoryBreakdown || []).map((item) => <div key={item._id}><span>{item._id || "Uncategorized"}</span><strong>{item.products}</strong></div>)}{overview && !overview.categoryBreakdown?.length && <p>No products have been listed yet.</p>}</div></section>
            <section className="dashboard-panel admin-panel"><div className="panel-heading"><div className="panel-icon"><Store size={20} /></div><div><h2>Top sellers</h2><p>Ranked by recorded sales value</p></div></div><div className="admin-rank-list">{(overview?.topSellers || []).map((item) => <div key={item._id || item.name}><span>{item.name} <small>· {item.units} items</small></span><strong>{money(item.revenue)}</strong></div>)}{overview && !overview.topSellers?.length && <p>Seller rankings appear when orders are placed.</p>}</div></section>
            <section className="dashboard-panel admin-panel"><div className="panel-heading"><div className="panel-icon"><Package size={20} /></div><div><h2>Popular products</h2><p>By units ordered</p></div></div><div className="admin-rank-list">{(overview?.topProducts || []).map((item) => <div key={item._id}><span>{item._id || "Product"} <small>· {money(item.revenue)}</small></span><strong>{item.units} sold</strong></div>)}{overview && !overview.topProducts?.length && <p>Product rankings appear when orders are placed.</p>}</div></section>
          </div>
        </>
      )}

      {tab !== "overview" && (
        <section className="dashboard-panel admin-list-panel">
          <div className="admin-list-heading"><div><h2>{tabs.find(([id]) => id === tab)?.[1]}</h2><p>Search and review records in manageable pages.</p></div><div className="admin-list-filters">
            {(tab === "sellers" || tab === "categories") && <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} aria-label="Filter by status"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All statuses</option></select>}
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={tab === "products" ? "Search products" : tab === "sellers" ? "Search sellers" : tab === "orders" ? "Search not available" : "Search category requests"} aria-label="Search records" disabled={tab === "orders"} />
          </div></div>
          {loading ? <p className="notice">Loading records…</p> : (
            <div className="admin-table-wrap">
              {tab === "products" && <table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Seller</th></tr></thead><tbody>{data.items.map((item) => <tr key={item._id}><td><div className="admin-product-cell">{item.image && <img src={item.image} alt="" />}<span>{item.name}</span></div></td><td>{item.category}</td><td>{money(item.price)}</td><td>{item.stock}</td><td>{item.artisan?.name || "Unknown"}</td></tr>)}</tbody></table>}
              {tab === "sellers" && <table className="admin-table"><thead><tr><th>Seller</th><th>Craft / location</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data.items.map((item) => <tr key={item._id}><td><strong>{item.name}</strong><small>{item.email}</small></td><td>{item.craftType || "Not specified"}<small>{item.location || ""}</small></td><td><span className={`status-pill status-${item.artisanStatus || "approved"}`}>{item.artisanStatus || "approved"}</span></td><td><div className="admin-row-actions">{item.artisanStatus !== "approved" && <button type="button" onClick={() => reviewArtisan(item._id, "approved")}><Check size={15} /> Approve</button>}{item.artisanStatus !== "rejected" && <button type="button" className="danger" onClick={() => reviewArtisan(item._id, "rejected")}><X size={15} /> Reject</button>}</div></td></tr>)}</tbody></table>}
              {tab === "orders" && <table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th></tr></thead><tbody>{data.items.map((item) => <tr key={item._id}><td>#{String(item._id).slice(-7).toUpperCase()}</td><td>{item.user?.name || "Unknown"}<small>{item.user?.email || ""}</small></td><td>{new Date(item.createdAt).toLocaleDateString("en-IN")}</td><td><span className="status-pill">{item.status}</span></td><td>{money(item.totalAmount)}</td></tr>)}</tbody></table>}
              {tab === "categories" && <table className="admin-table"><thead><tr><th>Proposed category</th><th>Requested by</th><th>Description</th><th>Status</th><th>Review</th></tr></thead><tbody>{data.items.map((item) => <tr key={item._id}><td><strong>{item.name}</strong><small>{new Date(item.createdAt).toLocaleDateString("en-IN")}</small></td><td>{item.requestedBy?.name || "Unknown"}<small>{item.requestedBy?.email || ""}</small></td><td>{item.description || "—"}</td><td><span className={`status-pill status-${item.status}`}>{item.status}</span></td><td><div className="admin-row-actions">{item.status !== "approved" && <button type="button" onClick={() => reviewCategory(item._id, "approved")}><Check size={15} /> Approve</button>}{item.status !== "rejected" && <button type="button" className="danger" onClick={() => reviewCategory(item._id, "rejected")}><X size={15} /> Reject</button>}</div></td></tr>)}</tbody></table>}
              {data.items.length === 0 && <div className="empty-products"><h3>No records found</h3><p>Try another filter or check back later.</p></div>}
            </div>
          )}
          <Pager data={data} onPage={setPage} />
        </section>
      )}
    </section>
  );
};

export default AdminDashboard;
