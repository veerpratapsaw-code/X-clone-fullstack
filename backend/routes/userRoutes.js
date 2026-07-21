import express from "express";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/users/:handle/follow
 * @desc    Toggle follow / unfollow for a user handle
 * @access  Protected
 */
router.post("/:handle/follow", protect, async (req, res) => {
  try {
    let targetHandle = req.params.handle.trim();
    if (!targetHandle.startsWith("@")) targetHandle = "@" + targetHandle;

    const currentUser = await User.findById(req.user.id);
    let targetUser = await User.findOne({ handle: { $regex: new RegExp(`^${targetHandle}$`, "i") } });
    if (!targetUser && targetHandle.toLowerCase() === "@akshay") {
      targetUser = await User.findOne({ handle: { $regex: /^@akshaykumar$/i } });
      if (targetUser) targetHandle = "@akshaykumar";
    }
    if (!targetUser && targetHandle.toLowerCase() === "@elon") {
      targetUser = await User.findOne({ handle: { $regex: /^@elonmusk$/i } });
      if (targetUser) targetHandle = "@elonmusk";
    }

    if (!currentUser) return res.status(404).json({ message: "Current user not found" });

    let isFollowing = (currentUser.following || []).some(h => h.toLowerCase() === targetHandle.toLowerCase());

    if (isFollowing) {
      currentUser.following = (currentUser.following || []).filter(h => h.toLowerCase() !== targetHandle.toLowerCase());
      if (targetUser) {
        targetUser.followers = (targetUser.followers || []).filter(h => h.toLowerCase() !== currentUser.handle.toLowerCase());
        await targetUser.save();
      }
    } else {
      if (!currentUser.following) currentUser.following = [];
      const handleToStore = targetUser ? targetUser.handle : targetHandle;
      if (!currentUser.following.some(h => h.toLowerCase() === handleToStore.toLowerCase())) {
        currentUser.following.push(handleToStore);
      }
      if (targetUser) {
        if (!targetUser.followers) targetUser.followers = [];
        if (!targetUser.followers.some(h => h.toLowerCase() === currentUser.handle.toLowerCase())) {
          targetUser.followers.push(currentUser.handle);
        }
        await targetUser.save();
      }
    }

    await currentUser.save();

    res.status(200).json({
      following: !isFollowing,
      userFollowingList: currentUser.following,
      targetFollowersCount: targetUser?.followers?.length || (isFollowing ? 0 : 1),
      currentUser
    });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ message: "Server error toggling follow" });
  }
});

/**
 * @route   GET /api/users/profile/:handle
 * @desc    Get user details, stats, and tweets for Profile View
 * @access  Public
 */
router.get("/profile/:handle", async (req, res) => {
  try {
    let handle = req.params.handle.trim();
    if (!handle.startsWith("@")) handle = "@" + handle;

    let user = await User.findOne({ handle: { $regex: new RegExp(`^${handle}$`, "i") } });
    const posts = await Post.find({ handle: { $regex: new RegExp(`^${handle}$`, "i") } }).sort({ createdAt: -1 });

    if (!user && posts.length > 0) {
      // Create a clean virtual profile object if posts exist for this handle
      const samplePost = posts[0];
      user = {
        username: samplePost.author,
        handle: samplePost.handle,
        avatar: samplePost.avatar || "/assets/user/headShot.jpg",
        banner: samplePost.banner || "",
        bio: "Hey there! I am using X.",
        verified: samplePost.verified || false,
        followers: [],
        following: [],
        createdAt: samplePost.createdAt || new Date()
      };
    } else if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user,
      posts,
      postsCount: posts.length,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
});

export default router;
