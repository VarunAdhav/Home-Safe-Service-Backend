import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import PositiveBeacon from "../models/PositiveBeacon.js";

const router = express.Router();

// Upload positive beacon ids (decentralized-style)
// body: { beaconIds: [string], retentionDays?: number }
router.post("/report-positive", protect, async (req, res) => {
  const { beaconIds = [], retentionDays = 14 } = req.body;
  if (!Array.isArray(beaconIds) || beaconIds.length === 0) {
    return res.status(400).json({ message: "beaconIds required" });
  }
  const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
  const rec = await PositiveBeacon.create({ beaconIds, expiresAt });
  res.json({ message: "Report accepted", id: rec._id });
});

// Download current positive beacon ids (for local comparison by clients)
router.get("/positives", async (_req, res) => {
  const records = await PositiveBeacon.find({}, { beaconIds: 1, reportedAt: 1, _id: 0 }).sort({ reportedAt: -1 }).limit(100);
  // flatten list
  const positives = Array.from(new Set(records.flatMap(r => r.beaconIds)));
  res.json({ positives, count: positives.length, updatedAt: new Date() });
});

export default router;
