import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, address, phoneNumber, companyName } = req.body;

    if (!name || !email || !password || !address || !phoneNumber)
      return res.status(400).json({ message: "All fields are required" });

    if (role === "provider" && !companyName)
      return res.status(400).json({ message: "Company Name is required for providers" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Invalid email format" });

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password))
      return res.status(400).json({
        message: "Password must contain uppercase, lowercase, number, and be 8+ chars long.",
      });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      name,
      email,
      password,
      role,
      address,
      phoneNumber,
      companyName: role === "provider" ? companyName : null,
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "No account found with this email" });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      consentTracing: user.consentTracing,
      token: genToken(user.id),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
