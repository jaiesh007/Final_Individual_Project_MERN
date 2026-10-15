import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const user = await login(form);
      navigate(user.role === "admin" ? "/admin" : user.role === "artisan" ? "/dashboard" : "/shop");
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed. Check your email, password, and backend connection.");
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">Welcome back</span>
        <h1>Login</h1>
        <p className="auth-intro">Continue discovering and supporting independent makers.</p>
        {message && <p className="auth-feedback" role="alert">{message}</p>}
        <label>Email<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" placeholder="you@example.com" required /></label>
        <label>Password<input name="password" type="password" value={form.password} onChange={update} autoComplete="current-password" placeholder="Your password" required /></label>
        <button type="submit" className="primary-button full"><LogIn size={18} />Login</button>
        <p>New here? <Link to="/register">Create an account</Link></p>
      </form>
    </section>
  );
};

export default Login;
