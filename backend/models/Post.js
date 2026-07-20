import mongoose from "mongoose";

/**
 * Post Schema represents each individual tweet stored in MongoDB.
 * Notice how `user` can reference the `User` model, or we can store display fields directly
 * for fast feed rendering.
 */
const postSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: true,
    },
    handle: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "/assets/user/headShot.jpg",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    repostLabel: {
      type: String,
      default: null,
    },
    text: {
      type: String,
      default: "",
    },
    media: {
      type: {
        type: String, // 'image', 'video', or 'article'
        enum: ["image", "video", "article"],
      },
      url: String,
      alt: String,
      title: String,
      subtitle: String,
      abstract: String,
    },
    stats: {
      replies: { type: String, default: "0" },
      reposts: { type: String, default: "0" },
      likes: { type: String, default: "0" },
      views: { type: String, default: "1" },
    },
  },
  {
    timestamps: true,
  }
);

export const Post = mongoose.model("Post", postSchema);
