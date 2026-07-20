import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";

// Explicitly load backend/.env or root .env
dotenv.config({ path: path.join(process.cwd(), "backend", ".env") });
dotenv.config();

/**
 * Helper function to upload a file buffer from Multer directly to Cloudinary via stream.
 * @param {Buffer} fileBuffer - The memory buffer of the uploaded file
 * @param {string} resourceType - 'auto', 'image', or 'video'
 * @returns {Promise<object>} The Cloudinary response containing secure_url and resource_type
 */
export const uploadToCloudinary = (fileBuffer, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    // Ensure configuration is fresh when upload is invoked
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "your_cloudinary_cloud_name") {
      return reject(new Error("Cloudinary API credentials are not set in .env"));
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    console.log(`☁️ Starting direct Cloudinary stream upload (cloud_name: ${process.env.CLOUDINARY_CLOUD_NAME})...`);
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "x_clone_media",
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          console.error(`❌ Cloudinary API Error: ${error.message || JSON.stringify(error)}`);
          return reject(error);
        }
        resolve(result);
      }
    );

    // Write buffer to stream and end it
    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
