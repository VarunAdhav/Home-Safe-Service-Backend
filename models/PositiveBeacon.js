import mongoose from "mongoose";

const positiveBeaconSchema = new mongoose.Schema({
  beaconIds: [{ type: String }],      // set of beacon ids uploaded by positive user
  reportedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },          // TTL (e.g., 14 days)
});

positiveBeaconSchema.index({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PositiveBeacon", positiveBeaconSchema);
