import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("mib:token") || null);

  useEffect(() => {
    if (!token) return setUser(null);
    (async () => {
      try {
        const { data } = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(data.user || data);
      } catch {
        setUser(null);
        setToken(null);
        localStorage.removeItem("mib:token");
      }
    })();
  }, [token]);

  const login = (userData, newToken) => {
    setUser(userData);
    setToken(newToken);
    localStorage.setItem("mib:token", newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("mib:token");
    localStorage.removeItem("mib:user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
