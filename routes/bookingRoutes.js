import express from "express";
import Booking from "../models/Booking.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/provider", protect, requireRole(["provider", "admin"]), async (req, res) => {
  try {
    const bookings = await Booking.find({ provider: req.user._id })
      .populate("customer", "name email phoneNumber address") // ✅ contact info
      .populate("service", "title description")
      .sort({ updatedAt: -1 })
      .lean();

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching provider bookings:", err);
    res.status(500).json({ message: "Failed to fetch provider bookings" });
  }
});

router.put("/:id/status", protect, requireRole(["provider", "admin"]), async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (String(booking.provider) !== String(req.user._id))
      return res.status(403).json({ message: "Not authorized" });

    booking.status = status;
    await booking.save();
    res.json({ message: "Booking status updated successfully", booking });
  } catch (err) {
    console.error("Error updating booking status:", err);
    res.status(500).json({ message: "Failed to update booking status" });
  }
});

export default router;
