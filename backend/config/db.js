import mongoose from "mongoose";

/**
 * connectDB - Helper function to establish a connection with MongoDB using Mongoose.
 * 
 * Why do we need this?
 * Mongoose is an Object Data Modeling (ODM) library that allows Node.js to talk to MongoDB
 * using clean JavaScript classes (Schemas and Models) instead of raw database commands.
 */
export const connectDB = async () => {
  try {
    // We get our connection string from environment variables or use local default
    const connString = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/x_clone_db";
    
    const conn = await mongoose.connect(connString);
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`⚠️ Server will continue running so API stays responsive while checking MONGO_URI network access.`);
  }
};
