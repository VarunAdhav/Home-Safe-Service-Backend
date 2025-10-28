import express from "express";
import Service from "../models/Service.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// List all available services
router.get("/", protect, async (req, res) => {
  const services = await Service.find({ status: "available" }).populate("provider", "name");
  res.json(services);
});

// Provider adds a service
router.post("/add", protect, requireRole(["provider", "admin"]), async (req, res) => {
  const { title, description } = req.body;
  const service = await Service.create({ title, description, provider: req.user._id });
  res.json(service);
});

// Customer books a service
router.post("/:id/book", protect, requireRole(["customer", "admin"]), async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ message: "Service not found" });
  if (service.status !== "available") return res.status(400).json({ message: "Service not available" });
  service.customer = req.user._id;
  service.status = "booked";
  await service.save();
  res.json({ message: "Service booked successfully", service });
});

// Cancel booking (by customer who booked)
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

export default router;
