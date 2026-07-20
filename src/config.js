// Global Frontend Configuration
// Automatically defaults to our live cloud backend on Render (`https://x-clone-fullstack.onrender.com`)
// or allows overriding with VITE_API_URL in deployment settings.

export const API_BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "https://x-clone-fullstack.onrender.com"
);
