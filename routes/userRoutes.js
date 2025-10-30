import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Get user profile with restriction info
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "name email role healthStatus restrictedUntil exposureDegree"
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
