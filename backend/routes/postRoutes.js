import express from "express";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/posts
 * @desc    Fetch all posts from MongoDB. Auto-seeds default posts if collection is empty.
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    let posts = await Post.find().sort({ createdAt: -1 }); // Sort by newest first

    // If database is completely empty (first run), let's seed our default sample posts
    if (posts.length === 0) {
      const defaultSeed = [
        {
          author: "Edgar Dobriban",
          handle: "@EdgarDobriban",
          avatar: "/src/assets/user/akshay_kumar.jpg",
          verified: true,
          repostLabel: "Paul Graham reposted",
          text: `AI has helped resolve an important question in statistics. In the area of multiple hypothesis testing, the goal of controlling the false discovery rate (FDR) has been introduced in a seminal paper by Benjamini and Hochberg (1995).`,
          media: {
            type: "article",
            title: "Benjamini–Hochberg Procedure Can Fail to Control FDR for Correlated Two-Sided Gaussian",
            subtitle: "Edgar Dobriban* · July 14, 2026",
            abstract: "We show that the Benjamini-Hochberg procedure can fail to control the False Discovery Rate (FDR) at its nominal level for correlated two-sided Gaussian tests...",
          },
          stats: { replies: "42", reposts: "128", likes: "1.4K", views: "84K" },
        },
        {
          author: "ISRO",
          handle: "@isro",
          avatar: "/src/assets/user/Cristiano-Ronaldo.jpg",
          verified: true,
          text: `Chandrayaan-4 mission design finalized! 🚀 Our next lunar mission aims to demonstrate sample return technology and deep space autonomous docking. Congratulations to the entire scientific community across India. 🇮🇳 #ISRO #SpaceExploration`,
          stats: { replies: "3.2K", reposts: "14.8K", likes: "89.2K", views: "1.2M" },
        },
        {
          author: "Sardar Vallabhbhai Patel",
          handle: "@sardarpatel",
          avatar: "/src/assets/user/sardar Vallabh bhai patel.jpg",
          verified: true,
          text: `Manpower without unity is not a strength unless it is harmonized and united properly, then it becomes a spiritual power. Let us work tirelessly for the strength and unity of our nation! 🇮🇳✨ #Unity #Strength #Leadership`,
          media: { type: "video", url: "/src/assets/posts videos/how to become king.mp4" },
          stats: { replies: "1.8K", reposts: "12.4K", likes: "94.2K", views: "820K" },
        },
        {
          author: "Cristiano Ronaldo",
          handle: "@Cristiano",
          avatar: "/src/assets/user/Cristiano-Ronaldo.jpg",
          verified: true,
          text: `Hard work beats talent when talent doesn't work hard. Always master your craft first before dreaming of the results. Thank you for all the incredible support! ⚽🏆 #CR7 #Motivation #Mastery`,
          media: { type: "video", url: "/src/assets/posts videos/master a thing first.mp4" },
          stats: { replies: "14.8K", reposts: "89.2K", likes: "450K", views: "4.2M" },
        },
      ];

      await Post.insertMany(defaultSeed);
      posts = await Post.find().sort({ createdAt: -1 });
      console.log("🌱 Auto-seeded initial posts into MongoDB!");
    }

    // Return the posts as JSON to the frontend
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server Error while fetching posts" });
  }
});

/**
 * @route   POST /api/posts
 * @desc    Create a new tweet and save to MongoDB
 * @access  Public (Will use authenticated JWT profile if provided)
 */
router.post("/", optionalAuth, async (req, res) => {
  try {
    let { author, handle, avatar, verified, text, media } = req.body;

    if (!text && !media) {
      return res.status(400).json({ message: "Post must contain text or media" });
    }

    // If user sent a valid JWT token, let's use their real MongoDB account profile!
    if (req.user && req.user.id) {
      const authUser = await User.findById(req.user.id);
      if (authUser) {
        author = authUser.username;
        handle = authUser.handle;
        avatar = authUser.avatar;
        verified = authUser.verified;
      }
    }

    const newPost = new Post({
      author: author || "Veer Pratap Saw",
      handle: handle || "@Veerpratapsaw",
      avatar: avatar || "/src/assets/user/headShot.jpg",
      verified: verified ?? true,
      text: text || "",
      media: media || undefined,
      stats: {
        replies: "0",
        reposts: "0",
        likes: "0",
        views: "1",
      },
    });

    const savedPost = await newPost.save();
    console.log("📝 New Post created in MongoDB:", savedPost._id, "by", savedPost.handle);
    res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Server Error while saving post" });
  }
});

// Helper to parse string numbers like "1.4K" or "42" to raw integers
const parseNum = (str) => {
  if (!str || str === "0") return 0;
  str = String(str).trim().toUpperCase();
  if (str.endsWith("K")) return parseFloat(str) * 1000;
  if (str.endsWith("M")) return parseFloat(str) * 1000000;
  return parseInt(str.replace(/,/g, ""), 10) || 0;
};

// Helper to format raw numbers back to "1.4K", "1.2M" or raw string
const formatNum = (num) => {
  if (num <= 0) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 10000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

/**
 * @route   PUT /api/posts/:id/like
 * @desc    Toggle Like status and update counter in MongoDB
 * @access  Public
 */
router.put("/:id/like", async (req, res) => {
  try {
    const { isLiked } = req.body; // boolean indicating new desired state
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    let count = parseNum(post.stats?.likes || "0");
    if (isLiked) {
      count += 1;
    } else {
      count = Math.max(0, count - 1);
    }
    post.stats.likes = formatNum(count);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ message: "Server error while toggling like" });
  }
});

/**
 * @route   PUT /api/posts/:id/repost
 * @desc    Toggle Repost status and update counter in MongoDB
 * @access  Public
 */
router.put("/:id/repost", async (req, res) => {
  try {
    const { isReposted } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    let count = parseNum(post.stats?.reposts || "0");
    if (isReposted) {
      count += 1;
    } else {
      count = Math.max(0, count - 1);
    }
    post.stats.reposts = formatNum(count);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.error("Error toggling repost:", error);
    res.status(500).json({ message: "Server error while toggling repost" });
  }
});

/**
 * @route   POST /api/posts/:id/reply
 * @desc    Increment reply count and store reply info in MongoDB
 * @access  Public
 */
router.post("/:id/reply", async (req, res) => {
  try {
    const { replyText, author, handle, avatar } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    let count = parseNum(post.stats?.replies || "0");
    count += 1;
    post.stats.replies = formatNum(count);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.error("Error posting reply:", error);
    res.status(500).json({ message: "Server error while saving reply" });
  }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post by ID from MongoDB
 * @access  Public
 */
router.delete("/:id", async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ message: "Post not found" });
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server error while deleting post" });
  }
});

export default router;
