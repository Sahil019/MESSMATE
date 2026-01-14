// Base URL of your Node + MySQL backend
const API_BASE = "http://localhost:3000/api";

// Generic fetch wrapper with JWT support
export const api = async (path, options = {}) => {
  const token = localStorage.getItem("authToken");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : undefined,
      ...(options.headers || {})
    }
  });

  // Graceful JSON parsing to avoid crashes
  let data;
  try {
    data = await res.json();
  } catch {
    data = { success: false, message: "Invalid server response" };
  }

  // Attach HTTP status to response
  return { status: res.status, ...data };
};
