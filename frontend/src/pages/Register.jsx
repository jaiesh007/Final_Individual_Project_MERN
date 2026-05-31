import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
    location: "",
    craftType: "",
    story: ""
  });

  const update = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const user = await register(form);
      navigate(user.role === "artisan" ? "/dashboard" : "/shop");
    } catch {
      setMessage("Registration failed. Check backend, MongoDB, or duplicate email.");
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-card wide" onSubmit={submit}>
        <span className="eyebrow">Join marketplace</span>
        <h1>Create account</h1>
        {message && <p className="notice">{message}</p>}
        <div className="form-grid">
          <label>
            Full name
            <input name="name" value={form.name} onChange={update} placeholder="Your name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={update} placeholder="Minimum 6 characters" required />
          </label>
          <label>
            Role
            <select name="role" value={form.role} onChange={update}>
              <option value="customer">Customer</option>
              <option value="artisan">Artisan</option>
            </select>
          </label>
          <label>
            Location
            <input name="location" value={form.location} onChange={update} placeholder="City, state" />
          </label>
          <label>
            Craft type
            <input name="craftType" value={form.craftType} onChange={update} placeholder="Pottery, textiles, bamboo" />
          </label>
        </div>
        <label>
          Artisan story
          <textarea name="story" value={form.story} onChange={update} rows="3" placeholder="Tell buyers about your craft background" />
        </label>
        <button type="submit" className="primary-button full">
          <UserPlus size={18} />
          Register
        </button>
        <p>Already registered? <Link to="/login">Login</Link></p>
      </form>
    </section>
  );
};

export default Register;
