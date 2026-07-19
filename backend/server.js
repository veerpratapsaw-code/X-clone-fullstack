import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { connectDB } from "./config/db.js";
import postRoutes from "./routes/postRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// Load environment variables from .env or backend/.env
dotenv.config({ path: path.join(process.cwd(), "backend", ".env") });
dotenv.config();

// Global diagnostic error logging to prevent silent exits
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION:", err.stack || err);
});
process.on("unhandledRejection", (reason) => {
  console.error("💥 UNHANDLED REJECTION:", reason.stack || reason);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB using our helper function
connectDB();

// Middleware
// 1. CORS allows our frontend running on port 5173 to communicate with our Express server on port 5000
app.use(cors({
  origin: "*", // In production, we restrict this to your actual deployed frontend domain
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// 2. Body parser middleware allows Express to read JSON data sent inside `req.body`
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 3. Serve local uploads statically as fallback when Cloudinary is not configured
app.use("/uploads", express.static(path.join(process.cwd(), "backend", "uploads")));
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/upload", uploadRoutes);

// Health Check endpoint
app.get("/", (req, res) => {
  res.send("🚀 X Clone API is running smoothly with MongoDB!");
});

// Start our Express Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🌟 Express Backend Server Running on PORT: ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
