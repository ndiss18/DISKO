require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const { authenticateToken, requireRole } = require("./middleware/auth");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "Authenticated", user: req.user });
});

app.get("/api/umkm/protected", authenticateToken, requireRole("umkm", "admin"), (req, res) => {
  res.json({ message: "UMKM access granted", user: req.user });
});

app.get("/api/admin/protected", authenticateToken, requireRole("admin"), (req, res) => {
  res.json({ message: "Admin access granted", user: req.user });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => {
  console.log(`DISKO API running on http://localhost:${port}`);
});
