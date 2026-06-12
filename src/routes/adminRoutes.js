const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { query, getDbPool } = require("../config/db");
const { logAudit, getClientIp, getDeviceInfo } = require("../auditLogger");

const router = express.Router();

// Multer config for product images
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "..", "public", "uploads", "products");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = "prod_" + Date.now() + ext;
    cb(null, name);
  }
});

const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error("Formato no permitido. Usa JPG, PNG o WebP."));
  }
});

// ============ PRODUCT MANAGEMENT ============

// GET /api/admin/products — all minibar products
router.get("/products", async (req, res) => {
  try {
    const rows = await query(
      `SELECT mp.id, mp.name, mp.price, mp.default_quantity, mp.display_order, mp.image_url, mp.is_active, mp.created_at,
              mc.id AS category_id, mc.name AS category_name
       FROM minibar_products mp
       JOIN minibar_categories mc ON mc.id = mp.category_id
       ORDER BY mc.display_order ASC, mp.display_order ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching admin products:", err);
    res.status(500).json({ error: "Error al cargar productos" });
  }
});

// POST /api/admin/products — create product
router.post("/products", async (req, res) => {
  try {
    const { name, price, categoryId, defaultQuantity, displayOrder } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "El nombre es obligatorio" });
    if (!price || price < 0) return res.status(400).json({ error: "Precio inválido" });
    if (!categoryId) return res.status(400).json({ error: "Categoría es obligatoria" });

    const result = await query(
      "INSERT INTO minibar_products (category_id, name, price, default_quantity, display_order) VALUES (?, ?, ?, ?, ?)",
      [categoryId, name.trim(), price, defaultQuantity || 1, displayOrder || 0]
    );

    // Add to all existing rooms
    const [rooms] = await getDbPool().query("SELECT id FROM rooms");
    for (const room of rooms) {
      await query(
        "INSERT INTO room_minibar_inventory (room_id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity",
        [room.id, result.insertId, defaultQuantity || 1]
      );
    }

    logAudit({
      userId: req.session?.user?.id,
      userName: req.session?.user?.fullName,
      userRole: req.session?.user?.role,
      moduleName: "Productos",
      actionType: "product_created",
      actionDescription: "Creó el producto " + name.trim(),
      newData: { name: name.trim(), price, categoryId, defaultQuantity: defaultQuantity || 1 },
      ipAddress: getClientIp(req),
      deviceInfo: getDeviceInfo(req)
    });

    res.json({ success: true, id: result.insertId, message: "Producto creado y agregado a todas las habitaciones." });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Error al crear producto" });
  }
});

// PUT /api/admin/products/:id — update product
router.put("/products/:id", async (req, res) => {
  try {
    const { name, price, categoryId, defaultQuantity, displayOrder, isActive } = req.body;
    const productId = req.params.id;

    const [oldRows] = await query("SELECT name, price, category_id, default_quantity, is_active FROM minibar_products WHERE id = ?", [productId]);
    const oldProduct = oldRows && oldRows[0] ? oldRows[0] : null;

    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push("name = ?"); params.push(name.trim()); }
    if (price !== undefined) { sets.push("price = ?"); params.push(price); }
    if (categoryId !== undefined) { sets.push("category_id = ?"); params.push(categoryId); }
    if (defaultQuantity !== undefined) { sets.push("default_quantity = ?"); params.push(defaultQuantity); }
    if (displayOrder !== undefined) { sets.push("display_order = ?"); params.push(displayOrder); }
    if (isActive !== undefined) { sets.push("is_active = ?"); params.push(isActive ? 1 : 0); }

    if (sets.length === 0) return res.status(400).json({ error: "No hay campos para actualizar" });

    params.push(productId);
    await query(`UPDATE minibar_products SET ${sets.join(", ")} WHERE id = ?`, params);

    const actionType = price !== undefined && (oldProduct && Number(oldProduct.price) !== Number(price)) ? "price_updated" : "product_updated";
    const actionDesc = actionType === "price_updated"
      ? "Actualizó el precio de " + (name || oldProduct?.name) + ": " + oldProduct?.price + " → " + price
      : "Editó el producto " + (name || oldProduct?.name);

    logAudit({
      userId: req.session?.user?.id,
      userName: req.session?.user?.fullName,
      userRole: req.session?.user?.role,
      moduleName: "Productos",
      actionType,
      actionDescription: actionDesc,
      productId: Number(productId),
      previousData: oldProduct ? { name: oldProduct.name, price: oldProduct.price, categoryId: oldProduct.category_id } : null,
      newData: { name: name?.trim(), price, categoryId },
      ipAddress: getClientIp(req),
      deviceInfo: getDeviceInfo(req)
    });

    res.json({ success: true, message: "Producto actualizado correctamente." });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

// DELETE /api/admin/products/:id — soft-delete (set inactive)
router.delete("/products/:id", async (req, res) => {
  try {
    const [oldRows] = await query("SELECT name FROM minibar_products WHERE id = ?", [req.params.id]);
    await query("UPDATE minibar_products SET is_active = 0 WHERE id = ?", [req.params.id]);

    logAudit({
      userId: req.session?.user?.id,
      userName: req.session?.user?.fullName,
      userRole: req.session?.user?.role,
      moduleName: "Productos",
      actionType: "product_disabled",
      actionDescription: "Desactivó el producto " + (oldRows[0]?.name || "#" + req.params.id),
      productId: Number(req.params.id),
      previousData: oldRows[0] || null,
      ipAddress: getClientIp(req),
      deviceInfo: getDeviceInfo(req)
    });

    res.json({ success: true, message: "Producto desactivado correctamente." });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Error al desactivar producto" });
  }
});

// POST /api/admin/products/:id/image — upload product image
router.post("/products/:id/image", productUpload.single("image"), async (req, res) => {
  try {
    const productId = req.params.id;
    if (!req.file) return res.status(400).json({ error: "No se envió ninguna imagen." });

    const imageUrl = "/uploads/products/" + req.file.filename;

    // Delete old image if exists
    const rows = await query("SELECT image_url FROM minibar_products WHERE id = ?", [productId]);
    const oldRow = rows[0];
    if (oldRow && oldRow.image_url) {
      const oldPath = path.join(__dirname, "..", "..", "public", oldRow.image_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await query("UPDATE minibar_products SET image_url = ? WHERE id = ?", [imageUrl, productId]);

    logAudit({
      userId: req.session?.user?.id,
      userName: req.session?.user?.fullName,
      userRole: req.session?.user?.role,
      moduleName: "Productos",
      actionType: "product_image_updated",
      actionDescription: "Actualizó la imagen del producto #" + productId,
      productId: Number(productId),
      ipAddress: getClientIp(req),
      deviceInfo: getDeviceInfo(req)
    });

    res.json({ success: true, imageUrl, message: "Imagen actualizada correctamente." });
  } catch (err) {
    console.error("Error uploading product image:", err);
    res.status(500).json({ error: "Error al subir la imagen." });
  }
});

// DELETE /api/admin/products/:id/image — remove product image
router.delete("/products/:id/image", async (req, res) => {
  try {
    const productId = req.params.id;
    const rows = await query("SELECT image_url FROM minibar_products WHERE id = ?", [productId]);
    const oldRow = rows[0];
    if (oldRow && oldRow.image_url) {
      const oldPath = path.join(__dirname, "..", "..", "public", oldRow.image_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    await query("UPDATE minibar_products SET image_url = NULL WHERE id = ?", [productId]);
    res.json({ success: true, message: "Imagen eliminada." });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar la imagen." });
  }
});

// ============ CATEGORY MANAGEMENT ============

// GET /api/admin/categories
router.get("/categories", async (req, res) => {
  try {
    const rows = await query("SELECT id, name, display_order FROM minibar_categories ORDER BY display_order ASC");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Error al cargar categorías" });
  }
});

// POST /api/admin/categories
router.post("/categories", async (req, res) => {
  try {
    const { name, displayOrder } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "El nombre es obligatorio" });
    const result = await query(
      "INSERT INTO minibar_categories (name, display_order) VALUES (?, ?)",
      [name.trim(), displayOrder || 0]
    );
    res.json({ success: true, id: result.insertId, message: "Categoría creada correctamente." });
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ error: "Error al crear categoría" });
  }
});

// PUT /api/admin/categories/:id
router.put("/categories/:id", async (req, res) => {
  try {
    const { name, displayOrder } = req.body;
    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push("name = ?"); params.push(name.trim()); }
    if (displayOrder !== undefined) { sets.push("display_order = ?"); params.push(displayOrder); }
    if (sets.length === 0) return res.status(400).json({ error: "No hay campos para actualizar" });
    params.push(req.params.id);
    await query(`UPDATE minibar_categories SET ${sets.join(", ")} WHERE id = ?`, params);
    res.json({ success: true, message: "Categoría actualizada correctamente." });
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ error: "Error al actualizar categoría" });
  }
});

// DELETE /api/admin/categories/:id
router.delete("/categories/:id", async (req, res) => {
  try {
    await query("DELETE FROM minibar_categories WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Categoría eliminada correctamente." });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ error: "No se puede eliminar la categoría. Verifica que no tenga productos asociados." });
  }
});

// ============ FLOOR MANAGEMENT ============

// GET /api/admin/floors
router.get("/floors", async (req, res) => {
  try {
    const rows = await query(
      "SELECT f.id, f.name, f.floor_number, COUNT(r.id) AS room_count FROM floors f LEFT JOIN rooms r ON r.floor_id = f.id GROUP BY f.id ORDER BY f.floor_number ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching floors:", err);
    res.status(500).json({ error: "Error al cargar pisos" });
  }
});

// POST /api/admin/floors
router.post("/floors", async (req, res) => {
  try {
    const { name, floorNumber } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "El nombre es obligatorio" });
    if (!floorNumber) return res.status(400).json({ error: "El número de piso es obligatorio" });
    const result = await query(
      "INSERT INTO floors (name, floor_number) VALUES (?, ?)",
      [name.trim(), floorNumber]
    );
    res.json({ success: true, id: result.insertId, message: "Piso creado correctamente." });
  } catch (err) {
    console.error("Error creating floor:", err);
    res.status(500).json({ error: "Error al crear piso" });
  }
});

// PUT /api/admin/floors/:id
router.put("/floors/:id", async (req, res) => {
  try {
    const { name, floorNumber } = req.body;
    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push("name = ?"); params.push(name.trim()); }
    if (floorNumber !== undefined) { sets.push("floor_number = ?"); params.push(floorNumber); }
    if (sets.length === 0) return res.status(400).json({ error: "No hay campos para actualizar" });
    params.push(req.params.id);
    await query(`UPDATE floors SET ${sets.join(", ")} WHERE id = ?`, params);
    res.json({ success: true, message: "Piso actualizado correctamente." });
  } catch (err) {
    console.error("Error updating floor:", err);
    res.status(500).json({ error: "Error al actualizar piso" });
  }
});

// DELETE /api/admin/floors/:id
router.delete("/floors/:id", async (req, res) => {
  try {
    await query("DELETE FROM floors WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Piso eliminado correctamente." });
  } catch (err) {
    console.error("Error deleting floor:", err);
    res.status(500).json({ error: "No se puede eliminar el piso. Verifica que no tenga habitaciones asociadas." });
  }
});

// ============ ROOM MANAGEMENT ============

// GET /api/admin/rooms
router.get("/rooms", async (req, res) => {
  try {
    const rows = await query(
      "SELECT r.id, r.room_number, r.floor_id, f.name AS floor_name FROM rooms r JOIN floors f ON f.id = r.floor_id ORDER BY f.floor_number ASC, CAST(r.room_number AS UNSIGNED) ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ error: "Error al cargar habitaciones" });
  }
});

// POST /api/admin/rooms
router.post("/rooms", async (req, res) => {
  try {
    const { roomNumber, floorId } = req.body;
    if (!roomNumber || !roomNumber.trim()) return res.status(400).json({ error: "El número de habitación es obligatorio" });
    if (!floorId) return res.status(400).json({ error: "El piso es obligatorio" });

    const result = await query(
      "INSERT INTO rooms (room_number, floor_id) VALUES (?, ?)",
      [roomNumber.trim(), floorId]
    );

    // Add all active minibar products to this room's inventory
    const products = await query("SELECT id, default_quantity FROM minibar_products WHERE is_active = 1");
    for (const prod of products) {
      await query(
        "INSERT INTO room_minibar_inventory (room_id, product_id, quantity) VALUES (?, ?, ?)",
        [result.insertId, prod.id, prod.default_quantity]
      );
    }

    res.json({ success: true, id: result.insertId, message: "Habitación creada con inventario inicial." });
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ error: "Error al crear habitación" });
  }
});

// PUT /api/admin/rooms/:id
router.put("/rooms/:id", async (req, res) => {
  try {
    const { roomNumber, floorId } = req.body;
    const sets = [];
    const params = [];
    if (roomNumber !== undefined) { sets.push("room_number = ?"); params.push(roomNumber.trim()); }
    if (floorId !== undefined) { sets.push("floor_id = ?"); params.push(floorId); }
    if (sets.length === 0) return res.status(400).json({ error: "No hay campos para actualizar" });
    params.push(req.params.id);
    await query(`UPDATE rooms SET ${sets.join(", ")} WHERE id = ?`, params);
    res.json({ success: true, message: "Habitación actualizada correctamente." });
  } catch (err) {
    console.error("Error updating room:", err);
    res.status(500).json({ error: "Error al actualizar habitación" });
  }
});

// DELETE /api/admin/rooms/:id
router.delete("/rooms/:id", async (req, res) => {
  try {
    await query("DELETE FROM rooms WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Habitación eliminada correctamente." });
  } catch (err) {
    console.error("Error deleting room:", err);
    res.status(500).json({ error: "No se puede eliminar la habitación. Verifica que no tenga movimientos asociados." });
  }
});

// ============ USER MANAGEMENT ============

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const rows = await query(
      "SELECT id, full_name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Error al cargar usuarios" });
  }
});

// POST /api/admin/users — create user
router.post("/users", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    if (!fullName || !fullName.trim()) return res.status(400).json({ error: "El nombre es obligatorio" });
    if (!email || !email.trim()) return res.status(400).json({ error: "El email es obligatorio" });
    if (!password || password.length < 6) return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });

    const [existing] = await getDbPool().query("SELECT id FROM users WHERE email = ?", [email.trim()]);
    if (existing && existing.length > 0) return res.status(409).json({ error: "El email ya está registrado" });

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      "INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)",
      [fullName.trim(), email.trim(), hash, role || "operator"]
    );
    res.json({ success: true, id: result.insertId, message: "Usuario creado correctamente." });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

// PUT /api/admin/users/:id
router.put("/users/:id", async (req, res) => {
  try {
    const { fullName, email, role, isActive, password } = req.body;
    const userId = req.params.id;
    const sets = [];
    const params = [];

    if (fullName !== undefined) { sets.push("full_name = ?"); params.push(fullName.trim()); }
    if (email !== undefined) { sets.push("email = ?"); params.push(email.trim()); }
    if (role !== undefined) { sets.push("role = ?"); params.push(role); }
    if (isActive !== undefined) { sets.push("is_active = ?"); params.push(isActive ? 1 : 0); }
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      sets.push("password_hash = ?");
      params.push(hash);
    }

    if (sets.length === 0) return res.status(400).json({ error: "No hay campos para actualizar" });
    params.push(userId);
    await query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, params);
    res.json({ success: true, message: "Usuario actualizado correctamente." });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    await query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Usuario eliminado correctamente." });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

// ============ MOVEMENT VOID ============

// POST /api/admin/movements/:id/void — void a movement and reverse inventory
router.post("/movements/:id/void", async (req, res) => {
  try {
    const movementId = req.params.id;
    const userName = req.session?.user?.fullName || "Admin";

    const pool = getDbPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [movRows] = await conn.query("SELECT * FROM minibar_movements WHERE id = ?", [movementId]);
      if (!movRows || movRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: "Movimiento no encontrado" });
      }

      const movement = movRows[0];

      if (movement.movement_type === "void") {
        await conn.rollback();
        return res.status(400).json({ error: "Este movimiento ya fue anulado" });
      }

      // Reverse: restore quantity_before
      const restoreQty = movement.quantity_before;

      await conn.query(
        "UPDATE room_minibar_inventory SET quantity = ? WHERE room_id = ? AND product_id = ?",
        [restoreQty, movement.room_id, movement.product_id]
      );

      // Record void movement
      const [prodRows] = await conn.query("SELECT name FROM minibar_products WHERE id = ?", [movement.product_id]);
      const productName = prodRows[0]?.name || "Producto";

      await conn.query(
        `INSERT INTO minibar_movements (room_id, product_id, movement_type, quantity_before, quantity_moved, quantity_after, user_id, user_name, notes)
         VALUES (?, ?, 'void', ?, ?, ?, ?, ?, ?)`,
        [movement.room_id, movement.product_id, movement.quantity_before, -movement.quantity_moved, restoreQty,
         req.session?.user?.id || null, userName,
         "Anulación del movimiento #" + movementId + " (" + productName + ")"]
      );

      await conn.commit();

      logAudit({
        userId: req.session?.user?.id,
        userName: req.session?.user?.fullName,
        userRole: req.session?.user?.role,
        moduleName: "Minibares",
        actionType: "record_voided",
        actionDescription: "Anuló movimiento #" + movementId + " (" + productName + ")",
        roomId: movement.room_id,
        floorId: movement.floor_id || null,
        productId: movement.product_id,
        quantityBefore: movement.quantity_before,
        quantityAfter: restoreQty,
        previousData: { movement },
        newData: { restoredQty: restoreQty },
        ipAddress: getClientIp(req),
        deviceInfo: getDeviceInfo(req)
      });

      res.json({ success: true, message: "Movimiento anulado correctamente. Inventario restaurado." });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Error voiding movement:", err);
    res.status(500).json({ error: "Error al anular movimiento" });
  }
});

// ============ DASHBOARD ============

// GET /api/admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const today = new Date();
    const todayStart = today.toISOString().split("T")[0] + " 00:00:00";
    const todayEnd = today.toISOString().split("T")[0] + " 23:59:59";

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split("T")[0] + " 00:00:00";

    // Today's consumption
    const [[todayConsumption]] = await getDbPool().query(
      `SELECT COUNT(*) AS movements, COALESCE(SUM(quantity_moved), 0) AS products,
              COALESCE(SUM(quantity_moved * mp.price), 0) AS total
       FROM minibar_movements mm
       JOIN minibar_products mp ON mp.id = mm.product_id
       WHERE mm.movement_type = 'consumption' AND mm.created_at >= ? AND mm.created_at <= ?`,
      [todayStart, todayEnd]
    );

    // Week consumption
    const [[weekConsumption]] = await getDbPool().query(
      `SELECT COUNT(*) AS movements, COALESCE(SUM(quantity_moved), 0) AS products,
              COALESCE(SUM(quantity_moved * mp.price), 0) AS total
       FROM minibar_movements mm
       JOIN minibar_products mp ON mp.id = mm.product_id
       WHERE mm.movement_type = 'consumption' AND mm.created_at >= ?`,
      [weekStartStr]
    );

    // Total rooms
    const [[{ total: totalRooms }]] = await getDbPool().query("SELECT COUNT(*) AS total FROM rooms");

    // Rooms with low stock (any product with quantity <= 2)
    const [[{ total: lowStockRooms }]] = await getDbPool().query(
      `SELECT COUNT(DISTINCT rmi.room_id) AS total
       FROM room_minibar_inventory rmi
       JOIN minibar_products mp ON mp.id = rmi.product_id
       WHERE rmi.quantity <= 2 AND mp.is_active = 1`
    );

    // Products that are agotado (quantity = 0)
    const [[{ total: agotadoCount }]] = await getDbPool().query(
      `SELECT COUNT(*) AS total
       FROM room_minibar_inventory rmi
       JOIN minibar_products mp ON mp.id = rmi.product_id
       WHERE rmi.quantity = 0 AND mp.is_active = 1`
    );

    // Recent movements (last 10 across all rooms)
    const recentMovements = await query(
      `SELECT mm.id, mm.movement_type, mm.quantity_moved, mm.user_name, mm.created_at,
              mp.name AS product_name, r.room_number, f.name AS floor_name
       FROM minibar_movements mm
       JOIN minibar_products mp ON mp.id = mm.product_id
       JOIN rooms r ON r.id = mm.room_id
       JOIN floors f ON f.id = r.floor_id
       WHERE mm.movement_type != 'void'
       ORDER BY mm.created_at DESC LIMIT 10`
    );

    // Top consumed products today
    const topProducts = await query(
      `SELECT mp.name, SUM(mm.quantity_moved) AS total_qty,
              SUM(mm.quantity_moved * mp.price) AS total_amount
       FROM minibar_movements mm
       JOIN minibar_products mp ON mp.id = mm.product_id
       WHERE mm.movement_type = 'consumption' AND mm.created_at >= ? AND mm.created_at <= ?
       GROUP BY mp.id, mp.name
       ORDER BY total_qty DESC LIMIT 5`,
      [todayStart, todayEnd]
    );

    // Rooms with agotado products (room detail)
    const roomsWithAgotados = await query(
      `SELECT r.id, r.room_number, f.name AS floor_name,
              COUNT(rmi.product_id) AS agotados
       FROM room_minibar_inventory rmi
       JOIN rooms r ON r.id = rmi.room_id
       JOIN floors f ON f.id = r.floor_id
       JOIN minibar_products mp ON mp.id = rmi.product_id
       WHERE rmi.quantity = 0 AND mp.is_active = 1
       GROUP BY r.id, r.room_number, f.name
       ORDER BY agotados DESC LIMIT 10`
    );

    res.json({
      today: todayConsumption,
      week: weekConsumption,
      totalRooms,
      lowStockRoomCount: lowStockRooms,
      agotadoCount,
      recentMovements,
      topProducts,
      roomsWithAgotados
    });
  } catch (err) {
    console.error("Error fetching dashboard:", err);
    res.status(500).json({ error: "Error al cargar dashboard" });
  }
});

module.exports = router;
