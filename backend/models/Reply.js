import mongoose from "mongoose";

/**
 * Reply Schema represents a comment/reply made on a Post.
 */
const replySchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    text: {
      type: String,
      required: true,
      trim: true,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Reply = mongoose.model("Reply", replySchema);
