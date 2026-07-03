import { createContext, useContext, useState, useEffect } from "react";
import api, { BASE_URL } from "../api/axios";
import { useData } from "./DataContext";

const AuthContext = createContext(null);
const HEARTBEAT_MS = 20000;

const sendOfflineBeacon = (token) => {
  if (!token) return Promise.resolve();
  return fetch(`${BASE_URL}/users/me/offline`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    keepalive: true,
  }).catch(() => {});
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const { clearCache } = useData();

  const persistUser = (nextUser) => {
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    clearCache();
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          const { data } = await api.get("/auth/me");
          persistUser(data.user);
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  useEffect(() => {
    if (!token) return;

    api.post("/users/me/heartbeat").catch((err) => {
      console.error("Initial heartbeat failed:", err);
    });

    const heartbeat = window.setInterval(() => {
      api.post("/users/me/heartbeat").catch((err) => {
        console.error("Heartbeat failed:", err);
      });
    }, HEARTBEAT_MS);

    const handleUnload = () => {
      sendOfflineBeacon(token);
    };

    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [token]);

  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === "auth_logout_at") {
        clearSession();
      }
    };

    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    const activeToken = token || localStorage.getItem("token");

    if (activeToken) {
      try {
        await api.post("/users/me/offline");
      } catch (err) {
        console.error("Logout offline update failed:", err);
        await sendOfflineBeacon(activeToken);
      }
    }

    localStorage.setItem("auth_logout_at", String(Date.now()));
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateUser: persistUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
