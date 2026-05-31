import { createContext, useContext, useMemo, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

const storedUser = () => {
  try {
    return JSON.parse(localStorage.getItem("artisanUser"));
  } catch {
    return null;
  }
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
    saveSession(data);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("artisanToken");
    localStorage.removeItem("artisanUser");
    setUser(null);
  };

  const value = useMemo(() => {
    return {
      user,
      token: localStorage.getItem("artisanToken"),
      isLoggedIn: Boolean(user),
      login,
      register,
      logout
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
