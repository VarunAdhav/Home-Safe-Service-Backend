import express from "express";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * POST /api/health/report
 * Marks user as covid positive and propagates exposure to connected users
 */
router.post("/report", protect, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (status !== "positive") return res.status(400).json({ message: "Invalid status" });

    // 1️⃣ Mark current user as positive
    const restrictionDays = 10;
    const restrictedUntil = new Date();
    restrictedUntil.setDate(restrictedUntil.getDate() + restrictionDays);

    user.healthStatus = "positive";
    user.restrictedUntil = restrictedUntil;
    user.exposureDegree = 0; // directly positive
    await user.save();

    // 2️⃣ Find all bookings where this user was a customer in the last 10 days
    const recentBookings = await Booking.find({
      customer: user._id,
      status: "completed",
      updatedAt: { $gte: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    });

    // Providers who interacted with this user → first-degree exposure
    const exposedProviderIds = [...new Set(recentBookings.map(b => b.provider.toString()))];

    for (const providerId of exposedProviderIds) {
      const provider = await User.findById(providerId);
      if (!provider) continue;

      provider.healthStatus = "exposed";
      provider.exposureDegree = 1; // first degree
      const providerRestrictedUntil = new Date();
      providerRestrictedUntil.setDate(providerRestrictedUntil.getDate() + 10);
      provider.restrictedUntil = providerRestrictedUntil;
      await provider.save();

      // 3️⃣ Find all customers serviced by this provider in last 2 days → second-degree exposure
      const providerBookings = await Booking.find({
        provider: providerId,
        status: "completed",
        updatedAt: { $gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      });

      const exposedCustomerIds = [
        ...new Set(providerBookings.map(b => b.customer.toString())),
      ].filter(cid => cid !== user._id.toString()); // skip original patient

      for (const customerId of exposedCustomerIds) {
        const customer = await User.findById(customerId);
        if (!customer) continue;

        customer.healthStatus = "exposed";
        customer.exposureDegree = 2; // indirect exposure
        const customerRestrictedUntil = new Date();
        customerRestrictedUntil.setDate(customerRestrictedUntil.getDate() + 2);
        customer.restrictedUntil = customerRestrictedUntil;
        await customer.save();
      }
    }

    res.json({ message: "Health status updated and exposures notified." });
  } catch (err) {
    console.error("Error in /api/health/report:", err);
    res.status(500).json({ message: "Server error while updating health status" });
  }
});

export default router;
