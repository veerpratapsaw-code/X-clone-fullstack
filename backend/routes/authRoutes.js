import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { protect } from "../middleware/authMiddleware.js";
import { systemAccounts, seedAllSystemAccountsAndPosts } from "../seed/seedSystemData.js";

const router = express.Router();

// Helper function to generate JWT Token
const generateToken = (id, handle) => {
  const secret = process.env.JWT_SECRET || "x_clone_super_secret_jwt_key_2026";
  return jwt.sign({ id, handle }, secret, { expiresIn: "7d" });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a brand new user in MongoDB and return JWT token
 * @access  Public
 */
router.post("/register", async (req, res) => {
  try {
    let { username, handle, email, password, avatar, bio, dob, location, website, interests } = req.body;

    if (!username || !handle || !email || !password) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    // Ensure handle starts with @
    handle = handle.startsWith("@") ? handle : `@${handle}`;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists with this email or handle
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { handle }],
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }
      return res.status(400).json({ message: "This @handle is already taken, choose another" });
    }

    // Securely hash the password using bcrypt (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user document in MongoDB
    const newUser = new User({
      username: username.trim(),
      handle: handle.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      avatar: avatar || "/assets/user/headShot.jpg",
      bio: bio || "Hey there! I am using X.",
      dob: dob || "",
      location: location || "",
      website: website || "",
      interests: Array.isArray(interests) ? interests : [],
      verified: true, // Auto-verify new accounts so they get the blue checkmark
    });

    const savedUser = await newUser.save();

    // Generate JWT token
    const token = generateToken(savedUser._id, savedUser.handle);

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        handle: savedUser.handle,
        email: savedUser.email,
        avatar: savedUser.avatar,
        bio: savedUser.bio,
        dob: savedUser.dob,
        location: savedUser.location,
        website: savedUser.website,
        interests: savedUser.interests,
        verified: savedUser.verified,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user with email/handle & password, return JWT token
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    const { emailOrHandle, password } = req.body;

    if (!emailOrHandle || !password) {
      return res.status(400).json({ message: "Please provide email/handle and password" });
    }

    const trimmedInput = emailOrHandle.trim();
    const isHandle = trimmedInput.startsWith("@") || !trimmedInput.includes("@");
    const formattedHandle = trimmedInput.startsWith("@") ? trimmedInput : `@${trimmedInput}`;

    // Search by email OR handle
    const user = await User.findOne({
      $or: [
        { email: trimmedInput.toLowerCase() },
        { handle: formattedHandle },
        { handle: trimmedInput },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials (user not found)" });
    }

    // Check if entered password matches the stored bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials (incorrect password)" });
    }

    // Generate token
    const token = generateToken(user._id, user.handle);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        handle: user.handle,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        dob: user.dob,
        location: user.location,
        website: user.website,
        interests: user.interests,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update currently logged-in user profile details (username, bio, avatar, location, website, dob, interests)
 * @access  Protected
 */
router.put("/profile", protect, async (req, res) => {
  try {
    const { username, bio, avatar, location, website, dob, interests } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username !== undefined) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (dob !== undefined) user.dob = dob;
    if (interests !== undefined) user.interests = interests;

    const updatedUser = await user.save();

    // Also update all existing posts by this user to reflect their new avatar/username
    if (avatar !== undefined || username !== undefined) {
      await Post.updateMany(
        { handle: { $regex: new RegExp(`^${user.handle}$`, "i") } },
        { $set: { ...(avatar !== undefined && { avatar }), ...(username !== undefined && { author: username }) } }
      );
    }

    res.status(200).json({
      id: updatedUser._id,
      username: updatedUser.username,
      handle: updatedUser.handle,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      dob: updatedUser.dob,
      location: updatedUser.location,
      website: updatedUser.website,
      interests: updatedUser.interests,
      verified: updatedUser.verified,
      followers: updatedUser.followers || [],
      following: updatedUser.following || [],
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged-in user profile
 * @access  Protected (Requires Bearer Token)
 */
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error retrieving user profile" });
  }
});

/**
 * @route   GET /api/auth/system-users
 * @desc    Get all system seed accounts (Human & AI Bots) along with their credentials details and trigger sync
 * @access  Public
 */
router.get("/system-users", async (req, res) => {
  try {
    await seedAllSystemAccountsAndPosts();
    const users = await User.find({
      handle: { $in: systemAccounts.map(a => a.handle) }
    }).select("-password");
    res.status(200).json({
      message: "System accounts verified and synced successfully",
      count: users.length,
      users,
      defaultPassword: "Password123!"
    });
  } catch (error) {
    console.error("System users endpoint error:", error);
    res.status(500).json({ message: "Server error syncing system users" });
  }
});

export default router;
