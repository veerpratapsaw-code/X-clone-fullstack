import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToCloudinary } from "../config/cloudinary.js";

const router = express.Router();

// Use memory storage so we can stream directly to Cloudinary or save locally
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max limit for images/videos
});

/**
 * @route   POST /api/upload
 * @desc    Upload an image or video file to Cloudinary CDN (or fallback to local /uploads folder)
 * @access  Public
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const isVideo = req.file.mimetype.startsWith("video/");
    const resourceType = isVideo ? "video" : "image";

    try {
      // 1. Try uploading directly to Cloudinary CDN
      const cloudResult = await uploadToCloudinary(req.file.buffer, resourceType);
      console.log(`☁️ Successfully uploaded to Cloudinary CDN: ${cloudResult.secure_url}`);
      return res.status(200).json({
        url: cloudResult.secure_url,
        type: resourceType,
        storage: "cloudinary",
      });
    } catch (cloudError) {
      console.warn(`⚠️ Cloudinary not configured or failed (${cloudError.message}). Falling back to local disk storage...`);

      // 2. Fallback: Save file to backend/uploads directory locally
      const uploadsDir = path.join(process.cwd(), "backend", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(req.file.originalname) || (isVideo ? ".mp4" : ".jpg");
      const filename = `media-${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      await fs.promises.writeFile(filePath, req.file.buffer);

      const localUrl = `http://localhost:5000/uploads/${filename}`;
      console.log(`📁 Saved media locally to: ${localUrl}`);

      return res.status(200).json({
        url: localUrl,
        type: resourceType,
        storage: "local",
      });
    }
  } catch (error) {
    console.error("Upload route error:", error);
    res.status(500).json({ message: "Server error during media upload" });
  }
});

export default router;
