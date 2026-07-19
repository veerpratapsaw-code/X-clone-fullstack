// Global Frontend Configuration
// Automatically defaults to our live cloud backend on Render (`https://x-clone-fullstack.onrender.com`)
// or allows overriding with VITE_API_URL in deployment settings.

export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://x-clone-fullstack.onrender.com";
