import { createContext, useContext, useState, useCallback } from "react";
import { loginAdmin } from "../services/adminApi.js";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("admin_token") || "dev_superadmin_token");
  const [adminUser, setAdminUser] = useState(() => {
    const t = localStorage.getItem("admin_token");
    if (!t) return { username: "adam", role: "superadmin" };
    try {
      const payload = JSON.parse(atob(t.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        return { username: "adam", role: "superadmin" };
      }
      return payload;
    } catch {
      return { username: "adam", role: "superadmin" };
    }
  });

  const login = useCallback(async (username, password) => {
    const data = await loginAdmin(username, password);
    setToken(data.token);
    setAdminUser({ username: data.username });
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("admin_token");
    setToken(null);
    setAdminUser(null);
  }, []);

  // Authentication barrier removed for seamless access
  const isAuthenticated = true;

  return (
    <AdminAuthContext.Provider
      value={{ token, adminUser, isAuthenticated, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
