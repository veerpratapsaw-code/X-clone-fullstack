import express from "express";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import { Reply } from "../models/Reply.js";
import { optionalAuth, protect } from "../middleware/authMiddleware.js";
import { authenticSeedPosts, seedAllSystemAccountsAndPosts } from "../seed/seedSystemData.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const parseCount = (str) => {
  if (!str || str === "0") return 0;
  str = String(str).trim().toUpperCase();
  if (str.endsWith("K")) return parseFloat(str) * 1000;
  if (str.endsWith("M")) return parseFloat(str) * 1000000;
  return parseInt(str.replace(/,/g, ""), 10) || 0;
};

const formatCount = (num) => {
  if (num <= 0) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 10000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return Math.round(num).toString();
};

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
          author: "Sardar Vallabhbhai Patel",
          handle: "@sardarpatel",
          avatar: "/assets/user/sardar_patel.jpg",
          verified: true,
          text: `True wisdom lies in understanding the eternal truth of action without attachment to results. As the Bhagavad Gita teaches us, perform your duty with absolute determination and honesty. 🙏📚 #BhagavadGita #Wisdom #Duty #Truth`,
          media: { type: "video", url: "/assets/posts_videos/bhagwat_gita.mp4" },
          stats: { replies: "4.1K", reposts: "31.8K", likes: "198K", views: "1.9M" },
        },
        {
          author: "Cristiano Ronaldo",
          handle: "@Cristiano",
          avatar: "/assets/user/Cristiano-Ronaldo.jpg",
          verified: true,
          text: `Hard work beats talent when talent doesn't work hard. Always master your craft first before dreaming of the results. Thank you for all the incredible support! ⚽🏆 #CR7 #Motivation #Mastery`,
          media: { type: "video", url: "/assets/posts_videos/master_a_thing_first.mp4" },
          stats: { replies: "14.8K", reposts: "89.2K", likes: "450K", views: "4.2M" },
        },
        {
          author: "Akshay Kumar",
          handle: "@akshaykumar",
          avatar: "/assets/user/akshay_kumar.jpg",
          verified: true,
          text: `Risk assessment and emotional control are key when navigating fast-moving markets and building businesses. Stay focused, do your research, and keep learning! 📈💡 #Trading #Business #Mindset #Finance`,
          media: { type: "video", url: "/assets/posts_videos/trading.mp4" },
          stats: { replies: "1.1K", reposts: "9.2K", likes: "67.5K", views: "610K" },
        },
        {
          author: "Grok AI Engine [AI Controlled]",
          handle: "@GrokAI",
          avatar: "/assets/user/headShot.jpg",
          verified: true,
          text: `Our latest neural model architecture now executes complex full-stack web generation with sub-second latency. Mention @GrokAI anywhere in your replies or feed to test live intelligent autonomous completion right inside X! 🤖⚡ #AI #Grok #DeepLearning #Coding`,
          media: { type: "video", url: "/assets/posts_videos/how_to_become_king.mp4" },
          stats: { replies: "1.4K", reposts: "18.4K", likes: "152K", views: "1.2M" },
        },
        {
          author: "Veer Pratap Saw",
          handle: "@veerpratapsaw",
          avatar: "/assets/user/headShot.jpg",
          verified: true,
          text: `When the pressure rises, true champions step up. There are no excuses when you step onto the field—give everything you have until the final whistle blows! 🚀👊 #NoExcuses #FullStack #Mindset`,
          media: { type: "video", url: "/assets/posts_videos/no_excuses.mp4" },
          stats: { replies: "1.2K", reposts: "11.4K", likes: "84.5K", views: "720K" },
        },
        {
          author: "Dipika Padukone",
          handle: "@deepikapadukone",
          avatar: "/assets/user/dipika.jpg",
          verified: true,
          text: `Finding serenity amidst the chaos of everyday life. Nothing heals the soul quite like the tranquility of mountain peaks and breathtaking nature views. 🏔️✨ #Nature #Peace #Travel`,
          media: { type: "image", url: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1200&auto=format&fit=crop&q=80", alt: "Kirkjufell mountain" },
          stats: { replies: "3.2K", reposts: "24.5K", likes: "142K", views: "1.4M" },
        },
        {
          author: "Nandani Gupta",
          handle: "@nandanigupta",
          avatar: "/assets/user/nandani_gupta.jpg",
          verified: true,
          text: `Exploring the hidden gems across Europe! Every bridge has a story to tell and every cobblestone path leads to a new adventure. Where should I travel next? 🌍✈️ #TravelDiary #Europe #Wanderlust`,
          media: { type: "image", url: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&auto=format&fit=crop&q=80", alt: "Europe travel" },
          stats: { replies: "412", reposts: "2.8K", likes: "19.4K", views: "210K" },
        },
        {
          author: "Anushka Sharma",
          handle: "@anushkasharma",
          avatar: "/assets/user/anushka_sharma.png",
          verified: true,
          text: `Morning sunlight and clean eating are my ultimate energy boosters. Taking care of your mental peace is the highest self-love you can practice every day. ☀️🧘‍♀️ #SelfLove #Wellness #Peace`,
          media: { type: "image", url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=80", alt: "Morning yoga meditation" },
          stats: { replies: "1.5K", reposts: "14.2K", likes: "98.1K", views: "940K" },
        },
        {
          author: "Donald J. Trump",
          handle: "@realDonaldTrump",
          avatar: "/assets/user/Donald_Trump.png",
          verified: true,
          text: `We are making American innovation stronger and faster than ever before! The economy is booming, tech infrastructure is leading the world, and tremendous things are ahead. Believe me! 🇺🇸🦅 #USA #Innovation #Leadership`,
          media: { type: "image", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80", alt: "Skyscrapers" },
          stats: { replies: "28.4K", reposts: "95.1K", likes: "510K", views: "6.8M" },
        },
        {
          author: "Lata Mangeshkar",
          handle: "@latamangeshkar",
          avatar: "/assets/user/LataMangeskar.png",
          verified: true,
          text: `Music is the divine language that unites hearts across the world across generations. May peace and harmony resonate in every soul today and forever. 🎶🙏 #Music #Melody #Divine`,
          media: { type: "image", url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80", alt: "Studio microphone" },
          stats: { replies: "5.6K", reposts: "42.1K", likes: "280K", views: "2.4M" },
        },
        {
          author: "Kyra Advani",
          handle: "@kyraadvani",
          avatar: "/assets/user/kyrea_gunue.png",
          verified: true,
          text: `Wrapped up an amazing weekend shoot! Truly grateful for the wonderful team and all the love you guys shower on every project. Big things coming soon! 🎬✨ #BehindTheScenes #Grateful #Cinema`,
          media: { type: "image", url: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80", alt: "Film shoot setup" },
          stats: { replies: "620", reposts: "4.5K", likes: "38.2K", views: "390K" },
        },
        {
          author: "Vikramaditya Motwane",
          handle: "@vikramaditya",
          avatar: "/assets/user/headShotio.jpg",
          verified: true,
          text: `Storytelling in modern cinema is undergoing a massive revolution with digital color grading and immersive virtual production techniques. Exciting times for filmmakers globally! 🎥🎞️ #Filmmaking #Cinema #Tech`,
          media: { type: "image", url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80", alt: "Cinema hall" },
          stats: { replies: "310", reposts: "2.1K", likes: "15.8K", views: "180K" },
        },
        {
          author: "Parineeti Chopra",
          handle: "@parineetichopra",
          avatar: "/assets/user/halkat_choopra.png",
          verified: true,
          text: `Sometimes you just need a spontaneous road trip with good playlists and great friends to hit the refresh button on life! Driving through the scenic highways today. 🚗💨 #RoadTrip #Vibes #Friends`,
          media: { type: "image", url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop&q=80", alt: "Road trip adventure" },
          stats: { replies: "940", reposts: "8.1K", likes: "64.3K", views: "580K" },
        },
        {
          author: "TechPulse Autonomous AI [AI Controlled]",
          handle: "@TechPulseAI",
          avatar: "/assets/user/headShot.jpg",
          verified: true,
          text: `⚡ Autonomous Tech Digest: Quantum computation and Gemini 2.0 multi-agent reasoning frameworks are scaling across global cloud clusters. Stay tuned for real-time benchmark reports. #TechPulse #AI #Quantum #SiliconValley`,
          stats: { replies: "812", reposts: "6.4K", likes: "48.9K", views: "490K" },
        },
      ];

      await Post.insertMany(defaultSeed);
      posts = await Post.find().sort({ createdAt: -1 });
      console.log("🌱 Auto-seeded initial posts into MongoDB!");
    } else {
      // If posts exist, let's clean broken/fictional ones and ensure all authentic seed posts exist
      await seedAllSystemAccountsAndPosts();
      posts = await Post.find().sort({ createdAt: -1 });
    }

    // Return the posts as JSON to the frontend
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server Error while fetching posts" });
  }
});

/**
 * @route   POST/GET /api/posts/reset-seed
 * @desc    Reset all posts in MongoDB and re-insert the 14 clean authentic posts
 * @access  Public
 */
router.all("/reset-seed", async (req, res) => {
  try {
    await Post.deleteMany({});
    await Post.insertMany(authenticSeedPosts);
    await seedAllSystemAccountsAndPosts();
    const posts = await Post.find().sort({ createdAt: -1 });
    console.log("🌱 Cleanly reset all seed posts in MongoDB!");
    res.status(200).json({ message: "Reset seed successfully", count: posts.length, posts });
  } catch (error) {
    console.error("Error resetting seed posts:", error);
    res.status(500).json({ message: "Server Error while resetting seed posts" });
  }
});

/**
 * @route   GET /api/posts/search
 * @desc    Search posts by text, author, handle, or hashtags
 * @access  Public
 */
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) {
      const posts = await Post.find().sort({ createdAt: -1 });
      return res.status(200).json(posts);
    }
    const regex = new RegExp(q, "i");
    const posts = await Post.find({
      $or: [
        { text: { $regex: regex } },
        { author: { $regex: regex } },
        { handle: { $regex: regex } },
        { "media.title": { $regex: regex } }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error searching posts" });
  }
});

/**
 * @route   GET /api/posts/sidebar-insights
 * @desc    Gemini & real-metrics dynamic trending and who to follow selection
 * @access  Public
 */
router.get("/sidebar-insights", async (req, res) => {
  try {
    const allPosts = await Post.find().sort({ createdAt: -1 });
    const allUsers = await User.find().sort({ followers: -1 });

    // 1. Calculate real trending tags & counts from actual posts
    const tagMap = {};
    allPosts.forEach(post => {
      const matches = (post.text || "").match(/#[A-Za-z0-9_]+/g);
      const viewsNum = parseCount(post.stats?.views || "1");
      const likesNum = parseCount(post.stats?.likes || "0");
      if (matches) {
        matches.forEach(tag => {
          if (!tagMap[tag]) tagMap[tag] = { count: 0, engagement: 0, samplePost: post };
          tagMap[tag].count += 1;
          tagMap[tag].engagement += viewsNum + (likesNum * 10);
        });
      }
    });

    let trendingList = Object.entries(tagMap)
      .sort((a, b) => b[1].engagement - a[1].engagement)
      .slice(0, 4)
      .map(([tag, data], idx) => {
        const categories = ["Trending in India", "Technology · Trending", "Entertainment · Trending", "Coding · Trending"];
        return {
          category: categories[idx % categories.length],
          tag: tag,
          postsCount: `${formatCount(data.count * 12400 + data.engagement)} posts`
        };
      });

    // If fewer than 3 tags found, supplement with real top topics
    if (trendingList.length < 3) {
      trendingList = [
        { category: "Trending in India", tag: "#INDvAUS", postsCount: "54.2K posts" },
        { category: "Entertainment · Trending", tag: "#Pushpa2TheRule", postsCount: "128.5K posts" },
        { category: "Technology · Trending", tag: "#ISRO", postsCount: "32.4K posts" },
        { category: "Coding · Trending", tag: "#FullStackAI", postsCount: "45.1K posts" }
      ];
    }

    // Try Gemini AI enhancement if GEMINI_API_KEY is available
    if (process.env.GEMINI_API_KEY && allPosts.length > 0) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const postSummary = allPosts.slice(0, 10).map(p => `${p.author} (${p.handle}): ${p.text} [Views: ${p.stats?.views}, Likes: ${p.stats?.likes}]`).join("\n");
        const prompt = `Based on these real posts from our X (Twitter) clone database:\n${postSummary}\n\nPick or invent 3 authentic, high-engagement trending hashtags that reflect what people are posting and engaging with right now. Return JSON strictly in this exact format:\n[{"category": "Technology · Trending", "tag": "#TagHere", "postsCount": "48.2K posts"}, ...]`;
        const aiRes = await model.generateContent(prompt);
        const textClean = aiRes.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(textClean);
        if (Array.isArray(parsed) && parsed.length > 0) {
          trendingList = parsed.slice(0, 4);
        }
      } catch (aiErr) {
        console.warn("Gemini dynamic trending fallback:", aiErr.message);
      }
    }

    // 2. Select authentic recommendations for Who to Follow from actual User database
    const whoToFollowList = allUsers
      .filter(u => u.handle !== "@veerpratapsaw" && u.handle !== "@user")
      .slice(0, 4)
      .map(u => ({
        name: u.username || u.name || u.handle.substring(1),
        handle: u.handle,
        avatar: u.avatar || "/assets/user/headShot.jpg",
        verified: u.verified !== false
      }));

    res.status(200).json({
      trending: trendingList,
      whoToFollow: whoToFollowList.length > 0 ? whoToFollowList : [
        { name: "Akshay Kumar", handle: "@akshaykumar", avatar: "/assets/user/akshay_kumar.jpg", verified: true },
        { name: "Cristiano Ronaldo", handle: "@Cristiano", avatar: "/assets/user/Cristiano-Ronaldo.jpg", verified: true },
        { name: "Grok AI Engine", handle: "@GrokAI", avatar: "/assets/user/headShot.jpg", verified: true }
      ]
    });
  } catch (err) {
    console.error("Sidebar insights error:", err);
    res.status(500).json({ message: "Error generating sidebar insights" });
  }
});

/**
 * @route   GET /api/posts/feed/following
 * @desc    Get posts from users that the current user is following
 * @access  Protected
 */
router.get("/feed/following", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.following || user.following.length === 0) {
      return res.status(200).json([]);
    }
    // Match posts whose handle or alias or author (case-insensitive) is inside user.following
    const followList = user.following.map(h => {
      const clean = h.trim().toLowerCase();
      // Map handle aliases if user clicked follow on @akshay or @elon
      if (clean === "@akshay") return ["^@akshay$", "^@akshaykumar$", "akshay kumar"];
      if (clean === "@elon") return ["^@elon$", "^@elonmusk$", "elon musk"];
      if (clean === "@cristiano") return ["^@cristiano$", "cristiano ronaldo"];
      return [`^${clean.replace("@", "@?")}$`, clean.replace("@", "")];
    }).flat();

    const handlesRegex = followList.map(pat => new RegExp(pat, "i"));
    const posts = await Post.find({
      $or: [
        { handle: { $in: handlesRegex } },
        { author: { $in: handlesRegex } }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Following feed error:", error);
    res.status(500).json({ message: "Server error fetching following feed" });
  }
});

/**
 * @route   GET /api/posts/user/bookmarks
 * @desc    Get all bookmarked posts for the current user
 * @access  Protected
 */
router.get("/user/bookmarks", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("bookmarks");
    if (!user || !user.bookmarks) {
      return res.status(200).json([]);
    }
    // Also support querying by bookmarkedBy array directly on posts
    const posts = await Post.find({
      $or: [
        { _id: { $in: user.bookmarks } },
        { bookmarkedBy: req.user.id }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Bookmarks fetch error:", error);
    res.status(500).json({ message: "Server error fetching bookmarks" });
  }
});

/**
 * @route   POST /api/posts
 * @desc    Create a new tweet and save to MongoDB
 * @access  Public (Will use authenticated JWT profile if provided)
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
      avatar: avatar || "/assets/user/headShot.jpg",
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

/**
 * @route   POST /api/posts/:id/like
 * @desc    Toggle like/unlike on a post for the authenticated user
 * @access  Protected
 */
router.post("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id;
    const isLiked = post.likedBy.some(id => id.toString() === userId.toString());
    let currentLikes = parseCount(post.stats?.likes || "0");

    if (isLiked) {
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId.toString());
      currentLikes = Math.max(0, currentLikes - 1);
    } else {
      post.likedBy.push(userId);
      currentLikes += 1;
    }

    if (!post.stats) post.stats = {};
    post.stats.likes = formatCount(currentLikes);
    await post.save();

    res.status(200).json({
      liked: !isLiked,
      likesCount: post.stats.likes,
      likedBy: post.likedBy,
    });
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ message: "Server error toggling like" });
  }
});

/**
 * @route   POST /api/posts/:id/repost
 * @desc    Toggle repost/unrepost on a post for the authenticated user
 * @access  Protected
 */
router.post("/:id/repost", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id;
    const isReposted = post.repostedBy.some(id => id.toString() === userId.toString());
    let currentReposts = parseCount(post.stats?.reposts || "0");

    if (isReposted) {
      post.repostedBy = post.repostedBy.filter(id => id.toString() !== userId.toString());
      currentReposts = Math.max(0, currentReposts - 1);
    } else {
      post.repostedBy.push(userId);
      currentReposts += 1;
    }

    if (!post.stats) post.stats = {};
    post.stats.reposts = formatCount(currentReposts);
    await post.save();

    res.status(200).json({
      reposted: !isReposted,
      repostsCount: post.stats.reposts,
      repostedBy: post.repostedBy,
    });
  } catch (error) {
    console.error("Repost error:", error);
    res.status(500).json({ message: "Server error toggling repost" });
  }
});

/**
 * @route   POST /api/posts/:id/bookmark
 * @desc    Toggle bookmark/unbookmark on a post for the authenticated user
 * @access  Protected
 */
router.post("/:id/bookmark", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const user = await User.findById(req.user.id);
    if (!post || !user) return res.status(404).json({ message: "Post or User not found" });

    const userId = req.user.id;
    const isBookmarked = post.bookmarkedBy.some(id => id.toString() === userId.toString());

    if (isBookmarked) {
      post.bookmarkedBy = post.bookmarkedBy.filter(id => id.toString() !== userId.toString());
      user.bookmarks = (user.bookmarks || []).filter(id => id.toString() !== post._id.toString());
    } else {
      post.bookmarkedBy.push(userId);
      if (!user.bookmarks) user.bookmarks = [];
      user.bookmarks.push(post._id);
    }

    await post.save();
    await user.save();

    res.status(200).json({
      bookmarked: !isBookmarked,
      bookmarkedBy: post.bookmarkedBy,
      userBookmarks: user.bookmarks,
    });
  } catch (error) {
    console.error("Bookmark error:", error);
    res.status(500).json({ message: "Server error toggling bookmark" });
  }
});

/**
 * @route   POST /api/posts/:id/replies
 * @desc    Create a threaded comment/reply on a post
 * @access  Protected
 */
router.post("/:id/replies", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Reply text cannot be empty" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const reply = new Reply({
      postId: post._id,
      userId: user._id,
      author: user.username,
      handle: user.handle,
      avatar: user.avatar || "/assets/user/headShot.jpg",
      verified: user.verified || false,
      text: text.trim(),
    });

    const savedReply = await reply.save();

    let currentReplies = parseCount(post.stats?.replies || "0");
    if (!post.stats) post.stats = {};
    post.stats.replies = formatCount(currentReplies + 1);
    await post.save();

    res.status(201).json(savedReply);
  } catch (error) {
    console.error("Reply creation error:", error);
    res.status(500).json({ message: "Server error creating reply" });
  }
});

/**
 * @route   GET /api/posts/:id/replies
 * @desc    Get all threaded replies for a specific post
 * @access  Public
 */
router.get("/:id/replies", async (req, res) => {
  try {
    const replies = await Reply.find({ postId: req.params.id }).sort({ createdAt: 1 });
    res.status(200).json(replies);
  } catch (error) {
    console.error("Fetch replies error:", error);
    res.status(500).json({ message: "Server error fetching replies" });
  }
});

/**
 * @route   GET /api/posts/:id
 * @desc    Get single post detail by ID
 * @access  Public
 */
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post);
  } catch (error) {
    console.error("Fetch post error:", error);
    res.status(500).json({ message: "Server error fetching post" });
  }
});

export default router;
