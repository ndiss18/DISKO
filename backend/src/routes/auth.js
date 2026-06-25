const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const allowedRoles = new Set(["user", "umkm"]);

function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    businessName: row.business_name,
    businessCategory: row.business_category,
    createdAt: row.created_at,
  };
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, phone, password, role = "user", businessCategory } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedRole = String(role || "user").toLowerCase();

    if (!name || !normalizedEmail || !phone || !password) {
      return res.status(400).json({ message: "Name, email, phone, and password are required" });
    }

    if (!allowedRoles.has(normalizedRole)) {
      return res.status(400).json({ message: "Invalid registration role" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existing = await db.query("select id from users where email = $1", [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `insert into users (name, email, phone, password_hash, role, business_name, business_category)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id, name, email, phone, role, business_name, business_category, created_at`,
      [
        name.trim(),
        normalizedEmail,
        phone.trim(),
        passwordHash,
        normalizedRole,
        normalizedRole === "umkm" ? name.trim() : null,
        normalizedRole === "umkm" ? businessCategory || null : null,
      ]
    );

    const user = toPublicUser(result.rows[0]);
    return res.status(201).json({ token: signToken(user), user });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await db.query(
      `select id, name, email, phone, password_hash, role, business_name, business_category, created_at
       from users
       where email = $1`,
      [normalizedEmail]
    );

    const userRow = result.rows[0];
    if (!userRow) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, userRow.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = toPublicUser(userRow);
    return res.json({ token: signToken(user), user });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(
      `select id, name, email, phone, role, business_name, business_category, created_at
       from users
       where id = $1`,
      [req.user.sub]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: toPublicUser(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
