import { Link, useNavigate } from "react-router-dom";
import { UserPlus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer", location: "", craftType: "", story: "" });

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    try {
      const user = await register(form);
      if (user.approvalRequired) {
        setSuccess(true);
        setMessage("Your artisan application has been sent to the admin team. For account security, artisan access stays locked until it is approved. You can log in after approval.");
        return;
      }
      navigate("/shop");
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed. Check the backend, MongoDB, or whether this email is already registered.");
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-card wide" onSubmit={submit}>
        <span className="eyebrow">Join the maker community</span>
        <h1>Create your account</h1>
        <p className="auth-intro">Shop one-of-a-kind pieces or apply to sell your own craft.</p>
        {message && <p className={success ? "auth-feedback success" : "auth-feedback"} role="status">{success && <ShieldCheck size={19} />}{message}</p>}
        <div className="form-grid">
          <label>Full name<input name="name" value={form.name} onChange={update} placeholder="Your name" autoComplete="name" required /></label>
          <label>Email<input name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" value={form.password} onChange={update} placeholder="At least 8 characters" minLength={8} autoComplete="new-password" required /></label>
          <label>Account type<select name="role" value={form.role} onChange={update}><option value="customer">Customer</option><option value="artisan">Artisan / seller (admin approval required)</option></select></label>
          <label>Location<input name="location" value={form.location} onChange={update} placeholder="City, state" /></label>
          {form.role === "artisan" && <label>Craft specialty<input name="craftType" value={form.craftType} onChange={update} placeholder="Pottery, weaving, carving…" required /></label>}
        </div>
        {form.role === "artisan" && <label>About your craft<textarea name="story" value={form.story} onChange={update} rows={3} maxLength={1000} placeholder="Tell the admin about your craft, experience, and materials." required /></label>}
        <button type="submit" className="primary-button full"><UserPlus size={18} />{success ? "Submit another application" : "Create account"}</button>
        <p>Already registered? <Link to="/login">Login</Link></p>
      </form>
    </section>
  );
};

export default Register;
