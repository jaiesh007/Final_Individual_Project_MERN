import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "artisan@example.com", password: "password123" });
  const [message, setMessage] = useState("");

  const update = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const user = await login(form);
      navigate(user.role === "artisan" ? "/dashboard" : "/shop");
    } catch {
      setMessage("Login failed. Check backend, MongoDB, email, and password.");
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">Welcome back</span>
        <h1>Login</h1>
        {message && <p className="notice">{message}</p>}
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={update} placeholder="customer@example.com" />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={update} placeholder="password123" />
        </label>
        <button type="submit" className="primary-button full">
          <LogIn size={18} />
          Login
        </button>
        <p>New user? <Link to="/register">Create account</Link></p>
      </form>
    </section>
  );
};

export default Login;
