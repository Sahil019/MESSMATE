import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from "react";
import { api } from "@/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
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
      const { status, ...data } = await api("/api/auth/me");

      if (status !== 200) return;

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
      const { status, ...data } = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      if (status === 401) {
        return { error: "Invalid email or password. Please check your credentials." };
      } else if (status !== 200) {
        return { error: data.error || "Login failed. Please try again." };
      }

      // Validate that user data exists in response
      if (!data.user) {
        console.error("Login response missing user data:", data);
        return { error: "Login failed. Invalid response from server." };
      }

      // Validate required user fields
      if (!data.user.id || !data.user.email || !data.user.role) {
        console.error("Login response missing required user fields:", data.user);
        return { error: "Login failed. Incomplete user data from server." };
      }

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));

      setUser(data.user);
      return { user: data.user };
    } catch (err) {
      console.error("Login error:", err);
      return { error: "Network error. Please check your connection and try again." };
    }
  };

  const signUp = async (email, password, fullName, role, mobileNumber) => {
    try {
      const { status, ...data } = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName, role, mobileNumber })
      });

      if (status !== 200) return { error: data.error || "Registration failed" };

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
