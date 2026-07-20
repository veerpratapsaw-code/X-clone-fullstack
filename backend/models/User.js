import mongoose from "mongoose";

/**
 * User Schema defines the structure of every user document stored in MongoDB.
 * 
 * In MongoDB, data is stored in "collections" (like tables in SQL) of JSON-like "documents".
 * Mongoose Schemas enforce types, required fields, and default values.
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a display name"],
      trim: true,
    },
    handle: {
      type: String,
      required: [true, "Please provide a unique handle (e.g. @Cristiano)"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email address"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
    },
    avatar: {
      type: String,
      default: "/assets/user/headShot.jpg",
    },
    bio: {
      type: String,
      default: "Hey there! I am using X.",
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically creates `createdAt` and `updatedAt` timestamps
  }
);

export const User = mongoose.model("User", userSchema);
