import { useState } from "react";
import { Link } from "react-router-dom";
import { Save, MapPin, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const Profile = () => {
  const { user, isLoggedIn, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: user?.location || "",
    address: user?.address || "",
    city: user?.city || "",
    pincode: user?.pincode || ""
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await updateProfile(form);
      setMessage("Your profile details have been saved.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save your profile. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!isLoggedIn) return <section className="page-section"><div className="empty-state"><h1>Your profile</h1><p>Log in to edit your details and saved delivery address.</p><Link className="primary-button" to="/login">Log in</Link></div></section>;
  if (user?.role !== "customer") return <section className="page-section"><div className="empty-state"><h1>Account details</h1><p>This profile editor is currently available for customer accounts.</p><Link className="primary-button" to="/shop">Browse shop</Link></div></section>;

  return <section className="page-section profile-page">
    <div className="section-heading left"><span className="eyebrow"><UserRound size={15}/> Customer account</span><h1>My profile</h1><p>Update your contact information and save a delivery address for faster checkout.</p></div>
    <form className="dashboard-panel profile-card" onSubmit={save}>
      {message && <p className="notice" role="status">{message}</p>}
      <div className="form-grid">
        <label>Full name<input name="name" value={form.name} onChange={update} autoComplete="name" maxLength={100} required/></label>
        <label>Email address<input type="email" name="email" value={form.email} onChange={update} autoComplete="email" maxLength={254} required/></label>
        <label>Phone number<input type="tel" name="phone" value={form.phone} onChange={update} autoComplete="tel" pattern="[0-9+() -]{0,20}" maxLength={20}/></label>
        <label>City / region<input name="location" value={form.location} onChange={update} placeholder="Optional profile location" maxLength={100}/></label>
      </div>
      <h2>Saved delivery address</h2>
      <label>Street address<textarea name="address" value={form.address} onChange={update} autoComplete="street-address" rows={3} maxLength={300}/></label>
      <div className="form-grid">
        <label>City<input name="city" value={form.city} onChange={update} autoComplete="address-level2" maxLength={100}/></label>
        <label>PIN code<input name="pincode" value={form.pincode} onChange={update} autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{0,10}" maxLength={10}/></label>
      </div>
      <p className="location-privacy-note"><MapPin size={15}/> You can also use your browser's location permission at checkout to fill an address automatically.</p>
      <div className="profile-actions"><button type="submit" className="primary-button" disabled={busy}><Save size={17}/>{busy ? "Saving…" : "Save profile"}</button><Link to="/orders" className="secondary-button">View my orders</Link></div>
    </form>
  </section>;
};

export default Profile;
