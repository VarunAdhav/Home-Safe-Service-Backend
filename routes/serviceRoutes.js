import express from "express";
import Service from "../models/Service.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-bookings", protect, requireRole(["customer", "admin"]), async (req, res) => {
  const bookings = await Service.find({ customer: req.user._id })
    .populate("provider", "name email")
    .select("title description provider status bookedSlot availableDays availableTimes updatedAt")
    .sort({ updatedAt: -1 });
  res.json(bookings);
});

router.get("/my-customers", protect, requireRole(["provider", "admin"]), async (req, res) => {
  const services = await Service.find({ provider: req.user._id, status: "booked" })
    .populate("customer", "name email")
    .sort({ updatedAt: -1 });

  res.json(services);
});

router.get("/", protect, async (req, res) => {
  const services = await Service.find({ status: "available" }).populate("provider", "name");
  res.json(services);
});

router.post("/add", protect, requireRole(["provider", "admin"]), async (req, res) => {
  const { title, description } = req.body;
  const service = await Service.create({ title, description, provider: req.user._id });
  res.json(service);
});

router.post("/:id/book", protect, requireRole(["customer", "admin"]), async (req, res) => {
  const { selectedDay, selectedDate, selectedTime } = req.body;

  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ message: "Service not found" });
  if (service.status !== "available")
    return res.status(400).json({ message: "Service not available" });

  if (!service.availableDays.map(d => d.toLowerCase()).includes(selectedDay.toLowerCase()))
    return res.status(400).json({ message: "Provider not available on this day" });

  const [sH] = service.availableTimes.start.split(":").map(Number);
  const [eH] = service.availableTimes.end.split(":").map(Number);
  const [bH] = selectedTime.split(":").map(Number);
  if (bH < sH || bH >= eH)
    return res.status(400).json({ message: "Invalid booking time" });

  // ✅ Store full booking info
  service.customer = req.user._id;
  service.bookedSlot = {
    day: selectedDay,
    date: selectedDate,
    time: selectedTime,
  };
  service.status = "booked";
  await service.save();

  res.json({ message: "Booked successfully", service });
});

router.post("/:id/cancel", protect, requireRole(["customer", "admin"]), async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ message: "Service not found" });
  if (!service.customer || service.customer.toString() != req.user._id.toString())
    return res.status(403).json({ message: "Not authorized to cancel" });
  service.customer = null;
  service.status = "available";
  await service.save();
  res.json({ message: "Booking cancelled", service });
});

router.post("/:id/availability", protect, requireRole(["provider", "admin"]), async (req, res) => {
  const { availableDays, availableTimes } = req.body;
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ message: "Service not found" });
  if (service.provider.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Not authorized" });
  service.availableDays = availableDays;
  service.availableTimes = availableTimes;
  await service.save();
  res.json({ message: "Availability updated", service });
});


router.post("/:id/cancel", protect, requireRole(["customer", "admin"]), async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ message: "Service not found" });
  if (service.customer?.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Only booker can cancel" });
  service.customer = null;
  service.bookedSlot = null;
  service.status = "available";
  await service.save();
  res.json({ message: "Booking cancelled", service });
});

router.post("/:id/status", protect, requireRole(["provider", "admin"]), async (req, res) => {
  const { status } = req.body;
  const allowed = ["available", "booked", "completed", "cancelled"];
  if (!allowed.includes(status))
    return res.status(400).json({ message: "Invalid status" });

  const service = await Service.findById(req.params.id).populate("customer", "name email");
  if (!service) return res.status(404).json({ message: "Service not found" });
  if (service.provider.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Not authorized" });

  // update main status
  service.status = status;

  // optional cleanup
  if (status === "cancelled" || status === "available") {
    service.customer = null;
    service.bookedSlot = null;
  }

  // push new history log
  service.statusHistory.push({ status });

  await service.save();

  res.json({
    message: `Status updated to ${status}`,
    service,
  });
});

export default router;
