import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config(); 

const ALGO = "aes-256-cbc";
const SECRET = process.env.DATA_SECRET;
const IV = Buffer.alloc(16, 0); 

function encrypt(value) {
  if (!value) return value;
  const cipher = crypto.createCipheriv(ALGO, Buffer.from(SECRET, "hex"), IV);
  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decrypt(value) {
  if (!value) return value;
  const decipher = crypto.createDecipheriv(ALGO, Buffer.from(SECRET, "hex"), IV);
  let decrypted = decipher.update(value, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["customer", "provider", "admin"], default: "customer" },
    address: { type: String },
    phoneNumber: { type: String },
    companyName: { type: String },
    healthStatus: { type: String, default: "healthy" },
    exposureDegree: { type: Number, default: 0 },
    restrictedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

// Encrypt sensitive fields before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  if (this.isModified("address")) this.address = encrypt(this.address);
  if (this.isModified("phoneNumber")) this.phoneNumber = encrypt(this.phoneNumber);

  next();
});

// Decrypt fields automatically when reading
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  if (obj.address) obj.address = decrypt(obj.address);
  if (obj.phoneNumber) obj.phoneNumber = decrypt(obj.phoneNumber);
  delete obj.password; // never expose password
  return obj;
};

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
