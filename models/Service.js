import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["available", "booked", "completed"], default: "available" },
  availableDays: [{ type: String }],  // e.g. ["Monday", "Wednesday", "Friday"]
  availableTimes: {
    start: { type: String },  // e.g. "10:00"
    end: { type: String }     // e.g. "18:00"
  },
  bookedSlot: {
    day: String,
    date: String,
    time: String,
  },
  statusHistory: [
    {
      status: String,
      changedAt: { type: Date, default: Date.now },
    },
  ],

}, { timestamps: true });

export default mongoose.model("Service", serviceSchema);
