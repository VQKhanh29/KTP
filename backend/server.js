const dotenv = require("dotenv");
// Load .env FIRST before any other imports
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const adminRoutes = require("./routes/admin");

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set in environment variables");
  process.exit(1);
}
const app = express();
// Configure CORS (allow local dev frontends)
app.use(cors({
  origin: [
    'http://localhost:3001', // React dev (frontend)
    'http://localhost:3000', // in-case frontend served on 3000
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Serve uploaded files (fallback avatar storage)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Kết nối MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/users", userRoutes);

// Kiểm tra server
app.get("/", (req, res) => {
  res.send("🚀 Backend connected to MongoDB successfully!");
});

const PORT = process.env.PORT || 3000;
// Bind to 0.0.0.0 to accept connections from localhost IPv4 and IPv6 consistently
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (bound to 0.0.0.0)`);
});

// Simple health check
app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

