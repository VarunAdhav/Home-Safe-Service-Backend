import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import tracingRoutes from "./routes/tracingRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.get("/", (req, res) => res.send("Safe Home Services API running"));

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/tracing", tracingRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/user", userRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
