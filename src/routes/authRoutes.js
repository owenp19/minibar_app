const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getDbPool } = require("../config/db");

const router = express.Router();

// Multer config for profile photos
const uploadsDir = path.join(__dirname, "..", "..", "public", "uploads", "avatars");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = "avatar_" + req.session.user.id + "_" + Date.now() + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error("Solo imágenes JPG, PNG, GIF o WebP"));
  }
});

function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "No autenticado" });
  }
  next();
}

router.post("/register", async (req, res, next) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).send("Todos los campos son obligatorios.");
    }

    if (password.length < 6) {
      return res.status(400).send("La contraseña debe tener al menos 6 caracteres.");
    }

    if (password !== confirmPassword) {
      return res.status(400).send("Las contraseñas no coinciden.");
    }

    const pool = getDbPool();

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing && existing.length > 0) {
      return res.status(409).send("El correo ya está registrado.");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'operator', 1)",
      [fullName, email, passwordHash]
    );

    req.session.user = {
      id: result.insertId,
      email,
      fullName,
      role: "operator"
    };

    return res.redirect("/app");
  } catch (err) {
    return next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password, remember } = req.body;

    if (!email || !password) {
      return res.status(400).send("Correo y contraseña son obligatorios.");
    }

    const pool = getDbPool();
    const [rows] = await pool.query(
      "SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).send("Credenciales inválidas.");
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).send("Usuario inactivo. Contacta al administrador.");
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).send("Credenciales inválidas.");
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    };

    if (remember) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7;
    }

    return res.redirect("/app");
  } catch (err) {
    return next(err);
  }
});

router.get("/me", requireLogin, async (req, res, next) => {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      "SELECT id, full_name, email, phone, avatar_url, role FROM users WHERE id = ? LIMIT 1",
      [req.session.user.id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    const user = rows[0];
    res.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone || "",
      avatarUrl: user.avatar_url || "",
      role: user.role
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/profile — get current user profile with photo
router.get("/profile", requireLogin, async (req, res, next) => {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      "SELECT id, full_name, email, phone, avatar_url, role FROM users WHERE id = ? LIMIT 1",
      [req.session.user.id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    const user = rows[0];
    res.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone || "",
      avatarUrl: user.avatar_url || "",
      role: user.role
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/profile — update profile (name, email, phone) with optional photo
router.put("/profile", requireLogin, upload.single("avatar"), async (req, res, next) => {
  try {
    const pool = getDbPool();
    const { fullName, email, phone } = req.body;

    const updates = [];
    const params = [];

    if (fullName && fullName.trim()) {
      updates.push("full_name = ?");
      params.push(fullName.trim());
      req.session.user.fullName = fullName.trim();
    }

    if (email && email.trim()) {
      // Check uniqueness
      const [existing] = await pool.query(
        "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
        [email.trim(), req.session.user.id]
      );
      if (existing && existing.length > 0) {
        return res.status(409).json({ message: "El correo ya está en uso por otro usuario." });
      }
      updates.push("email = ?");
      params.push(email.trim());
      req.session.user.email = email.trim();
    }

    if (phone !== undefined) {
      updates.push("phone = ?");
      params.push(phone || null);
    }

    // Handle avatar upload
    if (req.file) {
      const avatarUrl = "/uploads/avatars/" + req.file.filename;

      // Delete old avatar if exists
      const [oldRows] = await pool.query("SELECT avatar_url FROM users WHERE id = ?", [req.session.user.id]);
      if (oldRows && oldRows.length > 0 && oldRows[0].avatar_url) {
        const oldPath = path.join(__dirname, "..", "..", "public", oldRows[0].avatar_url);
        try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
      }

      updates.push("avatar_url = ?");
      params.push(avatarUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No hay datos para actualizar." });
    }

    params.push(req.session.user.id);
    await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    res.json({ message: "Perfil actualizado correctamente." });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

module.exports = router;
