import axios from "axios";

const configuredApiRoot = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

if (import.meta.env.PROD && !configuredApiRoot) {
  throw new Error("VITE_API_BASE_URL is required for production builds");
}

export const API_ROOT = configuredApiRoot || "http://localhost:8083";
export const GOOGLE_OAUTH_ENABLED = import.meta.env.VITE_GOOGLE_OAUTH_ENABLED === "true";

const api = axios.create({
  baseURL: `${API_ROOT}/auth`,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && token !== "portfolio-demo-session") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
