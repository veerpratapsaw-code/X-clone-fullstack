import mongoose from "mongoose";
import { seedAllSystemAccountsAndPosts } from "../seed/seedSystemData.js";

/**
 * connectDB - Helper function to establish a connection with MongoDB using Mongoose.
 */
export const connectDB = async () => {
  try {
    const connString = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/x_clone_db";
    
    const conn = await mongoose.connect(connString);
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    
    // Automatically seed and sync all authentic accounts & posts cleanly on connection
    await seedAllSystemAccountsAndPosts();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`⚠️ Server will continue running so API stays responsive while checking MONGO_URI network access.`);
  }
};
