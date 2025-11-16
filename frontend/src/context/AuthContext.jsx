// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);
export function useAuth() {
  return useContext(AuthContext);
}

// พิมพ์ log แบบมีสีสัน + ตัวหนังสือสีขาว
function colorLog(title, color, data = {}) {
  console.log(
    `%c━━━━━━ ${title} ━━━━━━`,
    `color:${color}; font-weight:bold; font-size:14px;`
  );

  Object.entries(data).forEach(([k, v]) => {
    console.log(
      `%c${k}: %c${v}`,
      "color:#ffffff; font-weight:bold; background:#333; padding:2px 4px; border-radius:4px;",
      "color:#ffffff; background:#444; padding:2px 6px; border-radius:4px;"
    );
  });

  console.log(`%c━━━━━━━━━━━━━━━━━━━\n`, `color:${color}`);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  // 1) โหลดจาก localStorage
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const raw = localStorage.getItem("user");
    if (raw) {
      const cached = JSON.parse(raw);
      setUser(cached);

      // AUTH:init (สีม่วง)
      colorLog("AUTH:init 💜", "#9C27B0", {
        User: cached.fullname || cached.email,
        Role: cached.role,
        Token: token, // ← Token เต็ม
      });
    }
  }, [token]);

  // 2) โหลดข้อมูล user จริงจาก backend
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const { data } = await api.get("/users/me");
        const freshUser = data.user || data;

        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));

        // AUTH:refresh (สีเขียว)
        colorLog("AUTH:refresh ", "#4CAF50", {
          User: freshUser.fullname || freshUser.email,
          Role: freshUser.role,
          Token: token,
        });
      } catch (err) {
        console.warn("[AUTH:refresh] Invalid token → clearing.");

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken("");
        setUser(null);
      }
    })();
  }, [token]);

  // login()
  const login = (payload) => {
    const { token: newToken, user: loggedInUser } = payload || {};

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(loggedInUser));

    setToken(newToken);
    setUser(loggedInUser);

    // LOGIN (สีฟ้า)
    colorLog("LOGIN ", "#2196F3", {
      User: loggedInUser.fullname || loggedInUser.email,
      Role: loggedInUser.role,
      Token: newToken,
    });
  };

  // updateUser()
  const updateUser = (u) => {
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));

    // AUTH:updateUser (สีเหลือง)
    colorLog("AUTH:updateUser 💛", "#FFC107", {
      User: u.fullname || u.email,
      Role: u.role,
      Token: token,
    });
  };

  // logout()
  const logout = () => {
    colorLog("LOGOUT ", "#F44336", {
      User: user?.fullname || user?.email || "(no name)",
      Role: user?.role || "(unknown)",
      Token: token || "(no token)",
    });

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
