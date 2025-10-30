import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    selectedDate: {
      type: String, // format: "YYYY-MM-DD"
      required: true,
    },
    selectedDay: {
      type: String, // e.g. "Monday"
      required: true,
    },
    selectedTime: {
      type: String, // e.g. "10:30"
      required: true,
    },
    status: {
      type: String,
      enum: ["booked", "in_progress", "completed", "cancelled"],
      default: "booked",
    },
    notes: {
      type: String,
      default: "",
    },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Automatically push a history entry when status changes
bookingSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});

export default mongoose.model("Booking", bookingSchema);
