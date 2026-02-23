// Base URL of your Node + MySQL backend
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Generic fetch wrapper with JWT support
const apiFunction = async (path, options = {}) => {
  const token = localStorage.getItem("authToken");

  // Prepare headers
  const headers = {
    Authorization: token ? `Bearer ${token}` : undefined,
    ...(options.headers || {})
  };

  // Only set Content-Type if not FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  // Handle non-JSON responses
  const contentType = res.headers.get("content-type");
  let data;

  if (contentType && contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = { success: false, message: "Invalid JSON response" };
    }
  } else {
    data = { success: res.ok };
  }

  // Attach HTTP status and ok to response
  return { 
    status: res.status, 
    ok: res.ok,
    ...data 
  };
};

// Add helper methods to api
const api = Object.assign(apiFunction, {
  get: (path, options = {}) => apiFunction(path, { ...options, method: 'GET' }),
  post: (path, options = {}) => apiFunction(path, { ...options, method: 'POST' }),
  put: (path, options = {}) => apiFunction(path, { ...options, method: 'PUT' }),
  delete: (path, options = {}) => apiFunction(path, { ...options, method: 'DELETE' })
});

export { api };