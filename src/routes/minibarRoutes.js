const express = require("express");
const router = express.Router();
const { query } = require("../config/db");

// GET /api/minibar/floors
router.get("/floors", async (req, res) => {
  try {
    const rows = await query(
      "SELECT id, name, floor_number FROM floors ORDER BY floor_number ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching floors:", err);
    res.status(500).json({ error: "Error al cargar pisos" });
  }
});

// GET /api/minibar/rooms/:floorId
router.get("/rooms/:floorId", async (req, res) => {
  try {
    const rows = await query(
      "SELECT id, room_number FROM rooms WHERE floor_id = ? ORDER BY CAST(room_number AS UNSIGNED) ASC",
      [req.params.floorId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ error: "Error al cargar habitaciones" });
  }
});

// GET /api/minibar/inventory/:roomId
router.get("/inventory/:roomId", async (req, res) => {
  try {
    const rows = await query(
      `SELECT
        rmi.id AS inventory_id,
        rmi.quantity,
        mp.id AS product_id,
        mp.name AS product_name,
        mp.default_quantity,
        mc.id AS category_id,
        mc.name AS category_name
      FROM room_minibar_inventory rmi
      JOIN minibar_products mp ON mp.id = rmi.product_id
      JOIN minibar_categories mc ON mc.id = mp.category_id
      WHERE rmi.room_id = ?
      ORDER BY mc.display_order ASC, mp.display_order ASC`,
      [req.params.roomId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    res.status(500).json({ error: "Error al cargar inventario" });
  }
});

// PUT /api/minibar/inventory/:roomId
router.put("/inventory/:roomId", async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Formato inválido" });
    }
    for (const item of items) {
      await query(
        `INSERT INTO room_minibar_inventory (room_id, product_id, quantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
        [req.params.roomId, item.product_id, item.quantity]
      );
    }
    res.json({ success: true, message: "Inventario guardado correctamente" });
  } catch (err) {
    console.error("Error saving inventory:", err);
    res.status(500).json({ error: "Error al guardar inventario" });
  }
});

module.exports = router;
