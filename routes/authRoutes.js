import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    const user = await User.create({ name, email, password, role });
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: genToken(user.id),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
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
