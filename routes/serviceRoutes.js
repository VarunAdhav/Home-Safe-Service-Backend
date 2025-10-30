import express from "express";
import Service from "../models/Service.js";
import Booking from "../models/Booking.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-bookings", protect, requireRole(["customer", "admin"]), async (req, res) => {
  const bookings = await Booking.find({ customer: req.user._id })
    .populate("service provider", "title name email")
    .sort({ updatedAt: -1 });
  res.json(bookings);
});

router.get("/my-services", protect, requireRole(["provider", "admin"]), async (req, res) => {
  const mine = await Service.find({ provider: req.user._id }).sort({ updatedAt: -1 });
  res.json(mine);
});

router.get("/", protect, async (req, res) => {
  const services = await Service.find().populate("provider", "name email");
  res.json(services);
});


router.post("/add", protect, requireRole(["provider", "admin"]), async (req, res) => {
  const { title, description } = req.body;
  const service = await Service.create({ title, description, provider: req.user._id });
  res.json(service);
});

router.delete("/:id", protect, requireRole(["provider", "admin"]), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    if (String(service.provider) !== String(req.user._id))
      return res.status(403).json({ message: "Not authorized" });

    await service.deleteOne();
    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    console.error("Error deleting service:", err);
    res.status(500).json({ message: "Failed to delete service" });
  }
});


router.post("/:id/book", protect, requireRole(["customer", "admin"]), async (req, res) => {
  const { selectedDay, selectedDate, selectedTime } = req.body;
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ message: "Service not found" });


  const availableDays = service.availableDays.map((d) => d.toLowerCase());
  if (!availableDays.includes(selectedDay.toLowerCase()))
    return res.status(400).json({ message: "Provider not available on this day" });

  const [sH] = service.availableTimes.start.split(":").map(Number);
  const [eH] = service.availableTimes.end.split(":").map(Number);
  const [bH] = selectedTime.split(":").map(Number);
  if (bH < sH || bH >= eH)
    return res.status(400).json({ message: "Invalid booking time" });

  const existing = await Booking.findOne({
    service: service._id,
    provider: service.provider,
    selectedDate,
    selectedTime,
  });
  if (existing)
    return res.status(400).json({ message: "Slot already booked" });

  const booking = await Booking.create({
    service: service._id,
    provider: service.provider,
    customer: req.user._id,
    selectedDate,
    selectedDay,
    selectedTime,
  });

  res.json({ message: "Service booked successfully", booking });
});

router.post("/:id/cancel", protect, requireRole(["customer", "admin"]), async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (String(booking.customer) !== String(req.user._id))
    return res.status(403).json({ message: "Not authorized to cancel this booking" });

  await booking.deleteOne();
  res.json({ message: "Booking cancelled successfully" });
});


router.post("/:id/availability", protect, requireRole(["provider", "admin"]), async (req, res) => {
  const { availableDays, availableTimes } = req.body;
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ message: "Service not found" });
  if (String(service.provider) !== String(req.user._id))
    return res.status(403).json({ message: "Not authorized" });

  service.availableDays = availableDays;
  service.availableTimes = availableTimes;
  await service.save();
  res.json({ message: "Availability updated", service });
});

router.put("/:id/edit", protect, requireRole(["provider", "admin"]), async (req, res) => {
  const { title, description, availableDays, availableTimes } = req.body;
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ message: "Service not found" });
  if (String(service.provider) !== String(req.user._id))
    return res.status(403).json({ message: "Not authorized" });

  if (title !== undefined) service.title = title;
  if (description !== undefined) service.description = description;
  if (availableDays !== undefined) service.availableDays = availableDays;
  if (availableTimes !== undefined) service.availableTimes = availableTimes;

  await service.save();
  res.json({ message: "Service updated", service });
});

export default router;
