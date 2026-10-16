import { createContext, useContext, useMemo, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);
const storedUser = () => {
  try { return JSON.parse(localStorage.getItem("artisanUser")); }
  catch { return null; }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(storedUser);

  const saveSession = ({ token, user: nextUser }) => {
    localStorage.setItem("artisanToken", token);
    localStorage.setItem("artisanUser", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = async (form) => {
    const { data } = await api.post("/auth/login", form);
    saveSession(data);
    return data.user;
  };

  const register = async (form) => {
    const { data } = await api.post("/auth/register", form);
    if (data.token) saveSession(data);
    return { ...data.user, approvalRequired: Boolean(data.approvalRequired), message: data.message };
  };

  const updateProfile = async (profile) => {
    const { data } = await api.put("/auth/me", profile);
    localStorage.setItem("artisanUser", JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("artisanToken");
    localStorage.removeItem("artisanUser");
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    token: localStorage.getItem("artisanToken"),
    isLoggedIn: Boolean(user),
    login,
    register,
    updateProfile,
    logout
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
