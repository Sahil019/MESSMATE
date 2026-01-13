import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from "react";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const API_BASE = "http://localhost:3000/api";

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthToken = () => localStorage.getItem("authToken");

  /**
   * SAFE refreshUser()
   * - does NOT loop
   * - does NOT run unless a token exists
   * - only updates when data actually changes
   */
  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) return;

      const data = await res.json();
      if (!data?.user) return;

      // only update when changed (prevents infinite re-renders)
      setUser(prev =>
        JSON.stringify(prev) === JSON.stringify(data.user)
          ? prev
          : data.user
      );

      localStorage.setItem("authUser", JSON.stringify(data.user));
    } catch (err) {
      console.error("refreshUser failed:", err);
    }
  }, []);

  /**
   * Load user on first app load
   * (runs ONLY once)
   */
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const signIn = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) return { error: data.error || "Login failed" };

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));

      setUser(data.user);
      return { user: data.user };
    } catch {
      return { error: "Network error. Please try again." };
    }
  };

  const signUp = async (email, password, fullName, role, mobileNumber) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, role, mobileNumber })
      });

      const data = await res.json();
      if (!res.ok) return { error: data.error || "Registration failed" };

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));

      setUser(data.user);
      return { user: data.user };
    } catch {
      return { error: "Network error. Please try again." };
    }
  };

  const signOut = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    getAuthToken,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
