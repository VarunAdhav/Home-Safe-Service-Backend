import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["available", "booked", "completed"], default: "available" },
}, { timestamps: true });

export default mongoose.model("Service", serviceSchema);
