const express = require("express");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const router = express.Router();
const { query, getDbPool } = require("../config/db");

function formatCOP(value) {
  const n = Number(value) || 0;
  return "$" + Math.round(n).toLocaleString("es-CO") + " COP";
}

function safeText(v) {
  return String(v ?? "").trim();
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos d\u00edas, recepci\u00f3n.";
  if (hour < 18) return "Buenas tardes, recepci\u00f3n.";
  return "Buenas noches, recepci\u00f3n.";
}

function formatDate(d) {
  return d.toLocaleDateString("es-CO");
}

function formatTime(d) {
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

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
        mp.price AS product_price,
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

// POST /api/minibar/consumption
router.post("/consumption", async (req, res) => {
  try {
    const { roomId, items } = req.body;
    if (!roomId) return res.status(400).json({ error: "Selecciona una habitaci\u00f3n" });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Selecciona al menos un producto" });

    const userId = req.session?.user?.id || null;
    const userName = req.session?.user?.fullName || "Operador";

    const pool = getDbPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Get room info
      const [roomRows] = await conn.query(
        "SELECT r.room_number, f.name AS floor_name FROM rooms r JOIN floors f ON f.id = r.floor_id WHERE r.id = ?",
        [roomId]
      );
      if (!roomRows || roomRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: "Habitaci\u00f3n no encontrada" });
      }
      const room = roomRows[0];

      // Validate and process each item
      const consumptionDetails = [];
      for (const item of items) {
        const productId = Number(item.productId);
        const qty = Number(item.quantity);
        if (!productId || !qty || qty <= 0) continue;

        // Get current inventory and product info
        const [invRows] = await conn.query(
          "SELECT quantity FROM room_minibar_inventory WHERE room_id = ? AND product_id = ?",
          [roomId, productId]
        );
        const currentQty = (invRows && invRows.length > 0) ? Number(invRows[0].quantity) : 0;

        const [prodRows] = await conn.query(
          "SELECT name, price FROM minibar_products WHERE id = ?",
          [productId]
        );
        if (!prodRows || prodRows.length === 0) continue;
        const product = prodRows[0];
        const newQty = Math.max(0, currentQty - qty);

        // Update inventory
        await conn.query(
          "UPDATE room_minibar_inventory SET quantity = ? WHERE room_id = ? AND product_id = ?",
          [newQty, roomId, productId]
        );

        // Record movement
        await conn.query(
          `INSERT INTO minibar_movements (room_id, product_id, movement_type, quantity_before, quantity_moved, quantity_after, user_id, user_name)
           VALUES (?, ?, 'consumption', ?, ?, ?, ?, ?)`,
          [roomId, productId, currentQty, qty, newQty, userId, userName]
        );

        consumptionDetails.push({
          name: product.name,
          price: Number(product.price),
          quantity: qty,
          lineTotal: qty * Number(product.price)
        });
      }

      if (consumptionDetails.length === 0) {
        await conn.rollback();
        return res.status(400).json({ error: "No se procesaron productos v\u00e1lidos" });
      }

      await conn.commit();

      // Generate WhatsApp message
      const now = new Date();
      const totalGeneral = consumptionDetails.reduce((sum, d) => sum + d.lineTotal, 0);

      const lines = [];
      lines.push(getGreeting());
      lines.push("");
      lines.push("Se reporta consumo de minibar:");
      lines.push("");
      lines.push("Habitaci\u00f3n: " + room.room_number);
      lines.push("Piso: " + room.floor_name);
      lines.push("Fecha: " + formatDate(now));
      lines.push("Hora: " + formatTime(now));
      lines.push("");
      lines.push("Productos consumidos:");
      for (const d of consumptionDetails) {
        lines.push("- " + d.name + " x" + d.quantity + " \u2014 " + formatCOP(d.lineTotal));
      }
      lines.push("");
      lines.push("Total consumo: " + formatCOP(totalGeneral));
      lines.push("");
      lines.push("Registrado por: " + userName);
      lines.push("");
      lines.push("Muchas gracias.");

      res.json({
        success: true,
        message: "Consumo registrado correctamente",
        whatsappMessage: lines.join("\n"),
        details: consumptionDetails,
        total: totalGeneral,
        room: room.room_number,
        floor: room.floor_name
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Error registering consumption:", err);
    res.status(500).json({ error: "Error al registrar consumo" });
  }
});

// POST /api/minibar/restock
router.post("/restock", async (req, res) => {
  try {
    const { roomId, items } = req.body;
    if (!roomId) return res.status(400).json({ error: "Selecciona una habitaci\u00f3n" });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Selecciona al menos un producto" });

    const userId = req.session?.user?.id || null;
    const userName = req.session?.user?.fullName || "Operador";
    const pool = getDbPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const restockDetails = [];
      for (const item of items) {
        const productId = Number(item.productId);
        const qty = Number(item.quantity);
        if (!productId || !qty || qty <= 0) continue;

        const [invRows] = await conn.query(
          "SELECT quantity FROM room_minibar_inventory WHERE room_id = ? AND product_id = ?",
          [roomId, productId]
        );
        const currentQty = (invRows && invRows.length > 0) ? Number(invRows[0].quantity) : 0;
        const newQty = currentQty + qty;

        await conn.query(
          "UPDATE room_minibar_inventory SET quantity = ? WHERE room_id = ? AND product_id = ?",
          [newQty, roomId, productId]
        );

        await conn.query(
          `INSERT INTO minibar_movements (room_id, product_id, movement_type, quantity_before, quantity_moved, quantity_after, user_id, user_name)
           VALUES (?, ?, 'restock', ?, ?, ?, ?, ?)`,
          [roomId, productId, currentQty, qty, newQty, userId, userName]
        );

        const [prodRows] = await conn.query("SELECT name FROM minibar_products WHERE id = ?", [productId]);
        restockDetails.push({
          name: prodRows[0]?.name || "Producto",
          quantity: qty,
          previousQty: currentQty,
          newQty
        });
      }

      if (restockDetails.length === 0) {
        await conn.rollback();
        return res.status(400).json({ error: "No se procesaron productos v\u00e1lidos" });
      }

      await conn.commit();
      res.json({ success: true, message: "Reposici\u00f3n guardada correctamente", details: restockDetails });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Error restocking:", err);
    res.status(500).json({ error: "Error al reponer productos" });
  }
});

// POST /api/minibar/adjust
router.post("/adjust", async (req, res) => {
  try {
    const { roomId, items } = req.body;
    if (!roomId) return res.status(400).json({ error: "Selecciona una habitaci\u00f3n" });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Selecciona al menos un producto" });

    const userId = req.session?.user?.id || null;
    const userName = req.session?.user?.fullName || "Operador";
    const pool = getDbPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const adjustDetails = [];
      for (const item of items) {
        const productId = Number(item.productId);
        const newQty = Number(item.quantity);
        if (!productId || newQty < 0) continue;

        const [invRows] = await conn.query(
          "SELECT quantity FROM room_minibar_inventory WHERE room_id = ? AND product_id = ?",
          [roomId, productId]
        );
        const currentQty = (invRows && invRows.length > 0) ? Number(invRows[0].quantity) : 0;
        const moved = newQty - currentQty;

        await conn.query(
          "UPDATE room_minibar_inventory SET quantity = ? WHERE room_id = ? AND product_id = ?",
          [newQty, roomId, productId]
        );

        await conn.query(
          `INSERT INTO minibar_movements (room_id, product_id, movement_type, quantity_before, quantity_moved, quantity_after, user_id, user_name)
           VALUES (?, ?, 'adjustment', ?, ?, ?, ?, ?)`,
          [roomId, productId, currentQty, moved, newQty, userId, userName]
        );

        const [prodRows] = await conn.query("SELECT name FROM minibar_products WHERE id = ?", [productId]);
        adjustDetails.push({
          name: prodRows[0]?.name || "Producto",
          previousQty: currentQty,
          newQty,
          diff: moved
        });
      }

      if (adjustDetails.length === 0) {
        await conn.rollback();
        return res.status(400).json({ error: "No se procesaron productos v\u00e1lidos" });
      }

      await conn.commit();
      res.json({ success: true, message: "Ajuste guardado correctamente", details: adjustDetails });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Error adjusting:", err);
    res.status(500).json({ error: "Error al ajustar inventario" });
  }
});

// GET /api/minibar/movements/:roomId
router.get("/movements/:roomId", async (req, res) => {
  try {
    const rows = await query(
      `SELECT
        mm.id,
        mm.movement_type,
        mm.quantity_before,
        mm.quantity_moved,
        mm.quantity_after,
        mm.user_name,
        mm.notes,
        mm.created_at,
        mp.name AS product_name,
        mp.price AS product_price
      FROM minibar_movements mm
      JOIN minibar_products mp ON mp.id = mm.product_id
      WHERE mm.room_id = ?
      ORDER BY mm.created_at DESC
      LIMIT 200`,
      [req.params.roomId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching movements:", err);
    res.status(500).json({ error: "Error al cargar historial" });
  }
});

// GET /api/minibar/reports
router.get("/reports", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "Debes seleccionar fecha inicial y final" });

    const params = [from + " 00:00:00", to + " 23:59:59"];

    // Get all consumptions in date range
    const movements = await query(
      `SELECT
        mm.id,
        mm.room_id,
        mm.product_id,
        mm.quantity_moved,
        mm.user_name,
        mm.created_at,
        mp.name AS product_name,
        mp.price AS product_price,
        mc.name AS category_name,
        r.room_number,
        f.name AS floor_name
      FROM minibar_movements mm
      JOIN minibar_products mp ON mp.id = mm.product_id
      JOIN minibar_categories mc ON mc.id = mp.category_id
      JOIN rooms r ON r.id = mm.room_id
      JOIN floors f ON f.id = r.floor_id
      WHERE mm.movement_type = 'consumption'
        AND mm.created_at >= ?
        AND mm.created_at <= ?
      ORDER BY mm.created_at DESC`,
      params
    );

    if (!movements || movements.length === 0) {
      return res.json({
        items: [],
        summary: {
          totalAmount: 0,
          totalProducts: 0,
          totalMovements: 0,
          topRoom: null,
          bottomRoom: null,
          topFloor: null,
          bottomFloor: null,
          topProduct: null,
          bottomProduct: null,
          top5Rooms: [],
          bottom5Rooms: [],
          top2Floors: [],
          bottom2Floors: [],
          mostConsumedProducts: [],
          leastConsumedProducts: [],
          noConsumptionProducts: [],
          noConsumptionRooms: [],
          categoryBreakdown: [],
          roomBreakdown: [],
          floorBreakdown: [],
          generatedAt: new Date().toISOString()
        },
        observations: []
      });
    }

    const items = movements.map(m => ({
      ...m,
      lineTotal: Number(m.quantity_moved) * Number(m.product_price || 0)
    }));

    // === CALCULATIONS ===
    const totalAmount = items.reduce((s, i) => s + i.lineTotal, 0);
    const totalProducts = items.reduce((s, i) => s + Number(i.quantity_moved), 0);

    // By room
    const roomMap = new Map();
    for (const i of items) {
      const key = i.room_id;
      if (!roomMap.has(key)) {
        roomMap.set(key, { roomNumber: i.room_number, floorName: i.floor_name, total: 0, items: 0, count: 0, roomId: i.room_id });
      }
      const r = roomMap.get(key);
      r.total += i.lineTotal;
      r.items += Number(i.quantity_moved);
      r.count++;
    }
    const roomBreakdown = Array.from(roomMap.values()).sort((a, b) => b.total - a.total);

    // By floor
    const floorMap = new Map();
    for (const i of items) {
      const key = i.floor_name;
      if (!floorMap.has(key)) {
        floorMap.set(key, { floorName: key, total: 0, items: 0, count: 0 });
      }
      const f = floorMap.get(key);
      f.total += i.lineTotal;
      f.items += Number(i.quantity_moved);
      f.count++;
    }
    const floorBreakdown = Array.from(floorMap.values()).sort((a, b) => b.total - a.total);

    // By category
    const catMap = new Map();
    for (const i of items) {
      const key = i.category_name || "Sin categor\u00eda";
      if (!catMap.has(key)) {
        catMap.set(key, { name: key, total: 0, items: 0 });
      }
      const c = catMap.get(key);
      c.total += i.lineTotal;
      c.items += Number(i.quantity_moved);
    }
    const categoryBreakdown = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

    // By product
    const prodMap = new Map();
    for (const i of items) {
      const key = i.product_id;
      if (!prodMap.has(key)) {
        prodMap.set(key, { productId: key, name: i.product_name, total: 0, items: 0, price: Number(i.product_price) });
      }
      const p = prodMap.get(key);
      p.total += i.lineTotal;
      p.items += Number(i.quantity_moved);
    }
    const productBreakdown = Array.from(prodMap.values()).sort((a, b) => b.items - a.items);

    // Products without consumption
    const allProducts = await query("SELECT id, name, price FROM minibar_products WHERE is_active = 1");
    const consumedProductIds = new Set(items.map(i => i.product_id));
    const noConsumptionProducts = allProducts.filter(p => !consumedProductIds.has(p.id));

    // Rooms without consumption
    const consumedRoomIds = new Set(items.map(i => i.room_id));
    const allRooms = await query(
      "SELECT r.id, r.room_number, f.name AS floor_name FROM rooms r JOIN floors f ON f.id = r.floor_id"
    );
    const noConsumptionRooms = allRooms.filter(r => !consumedRoomIds.has(r.id));

    // Rankings
    const top5Rooms = roomBreakdown.slice(0, 5);
    const bottom5Rooms = [...roomBreakdown].sort((a, b) => a.total - b.total).slice(0, 5);
    const top2Floors = floorBreakdown.slice(0, 2);
    const bottom2Floors = [...floorBreakdown].sort((a, b) => a.total - b.total).slice(0, 2);
    const mostConsumedProducts = productBreakdown.slice(0, 5);
    const leastConsumedProducts = [...productBreakdown].sort((a, b) => a.items - b.items).slice(0, 5);

    // Observations
    const observations = [];
    if (roomBreakdown.length > 0) {
      observations.push("La habitaci\u00f3n con mayor consumo fue la habitaci\u00f3n " + roomBreakdown[0].roomNumber + ".");
    }
    if (floorBreakdown.length > 0) {
      observations.push("El piso con mayor consumo fue " + floorBreakdown[0].floorName + ".");
    }
    if (productBreakdown.length > 0) {
      observations.push("El producto m\u00e1s consumido fue " + productBreakdown[0].name + ".");
    }
    if (categoryBreakdown.length > 0) {
      observations.push("La categor\u00eda con mayor consumo fue " + categoryBreakdown[0].name + ".");
    }
    if (noConsumptionRooms.length > 0) {
      observations.push("Se encontraron " + noConsumptionRooms.length + " habitaciones sin consumo durante el periodo seleccionado.");
    }
    observations.push("El total consumido durante el periodo fue de " + formatCOP(totalAmount) + ".");

    // Also count per-floor-room consumption rooms
    const roomsWithConsumption = new Set(items.map(i => i.room_id));
    const totalRoomsWithConsumption = roomsWithConsumption.size;

    res.json({
      items,
      summary: {
        totalAmount,
        totalProducts,
        totalMovements: items.length,
        totalRoomsWithConsumption,
        topRoom: roomBreakdown[0] || null,
        bottomRoom: roomBreakdown.length > 0 ? roomBreakdown[roomBreakdown.length - 1] : null,
        topFloor: floorBreakdown[0] || null,
        bottomFloor: floorBreakdown.length > 0 ? floorBreakdown[floorBreakdown.length - 1] : null,
        topProduct: productBreakdown[0] || null,
        bottomProduct: productBreakdown.length > 0 ? productBreakdown[productBreakdown.length - 1] : null,
        top5Rooms,
        bottom5Rooms,
        top2Floors,
        bottom2Floors,
        mostConsumedProducts,
        leastConsumedProducts,
        noConsumptionProducts,
        noConsumptionRooms,
        categoryBreakdown,
        roomBreakdown,
        floorBreakdown,
        generatedAt: new Date().toISOString()
      },
      observations
    });
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).json({ error: "Error al generar reporte" });
  }
});

// GET /api/minibar/reports/pdf
router.get("/reports/pdf", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: "Debes seleccionar fecha inicial y final" });
    }

    // Use internal query instead
    const pool = getDbPool();
    const params = [from + " 00:00:00", to + " 23:59:59"];

    const movements = await query(
      `SELECT
        mm.id, mm.room_id, mm.product_id, mm.quantity_moved, mm.user_name, mm.created_at,
        mp.name AS product_name, mp.price AS product_price,
        mc.name AS category_name, r.room_number, f.name AS floor_name
      FROM minibar_movements mm
      JOIN minibar_products mp ON mp.id = mm.product_id
      JOIN minibar_categories mc ON mc.id = mp.category_id
      JOIN rooms r ON r.id = mm.room_id
      JOIN floors f ON f.id = r.floor_id
      WHERE mm.movement_type = 'consumption'
        AND mm.created_at >= ?
        AND mm.created_at <= ?
      ORDER BY mm.created_at DESC`,
      params
    );

    if (!movements || movements.length === 0) {
      return res.status(404).send("No hay consumos en el rango seleccionado.");
    }

    // Calculate summary
    const items = movements.map(m => ({
      ...m,
      lineTotal: Number(m.quantity_moved) * Number(m.product_price || 0)
    }));

    const totalAmount = items.reduce((s, i) => s + i.lineTotal, 0);
    const totalProducts = items.reduce((s, i) => s + Number(i.quantity_moved), 0);

    const roomMap = new Map();
    for (const i of items) {
      const key = i.room_id;
      if (!roomMap.has(key)) roomMap.set(key, { roomNumber: i.room_number, floorName: i.floor_name, total: 0, items: 0, count: 0, roomId: i.room_id });
      const r = roomMap.get(key);
      r.total += i.lineTotal;
      r.items += Number(i.quantity_moved);
      r.count++;
    }
    const roomBreakdown = Array.from(roomMap.values()).sort((a, b) => b.total - a.total);

    const catMap = new Map();
    for (const i of items) {
      const key = i.category_name || "Sin categor\u00eda";
      if (!catMap.has(key)) catMap.set(key, { name: key, total: 0, items: 0 });
      const c = catMap.get(key);
      c.total += i.lineTotal;
      c.items += Number(i.quantity_moved);
    }
    const categoryBreakdown = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

    const prodMap = new Map();
    for (const i of items) {
      const key = i.product_id;
      if (!prodMap.has(key)) prodMap.set(key, { productId: key, name: i.product_name, total: 0, items: 0 });
      const p = prodMap.get(key);
      p.total += i.lineTotal;
      p.items += Number(i.quantity_moved);
    }
    const productBreakdown = Array.from(prodMap.values()).sort((a, b) => b.items - a.items);

    const floorMap = new Map();
    for (const i of items) {
      const key = i.floor_name;
      if (!floorMap.has(key)) floorMap.set(key, { floorName: key, total: 0, items: 0 });
      const f = floorMap.get(key);
      f.total += i.lineTotal;
      f.items += Number(i.quantity_moved);
    }
    const floorBreakdown = Array.from(floorMap.values()).sort((a, b) => b.total - a.total);

    const consumedProductIds = new Set(items.map(i => i.product_id));
    const allProducts = await query("SELECT id, name FROM minibar_products WHERE is_active = 1");
    const noConsumptionProducts = allProducts.filter(p => !consumedProductIds.has(p.id));

    const consumedRoomIds = new Set(items.map(i => i.room_id));
    const allRoomsQ = await query("SELECT r.id, r.room_number, f.name AS floor_name FROM rooms r JOIN floors f ON f.id = r.floor_id");
    const noConsumptionRooms = allRoomsQ.filter(r => !consumedRoomIds.has(r.id));

    const top5Rooms = roomBreakdown.slice(0, 5);
    const bottom5Rooms = [...roomBreakdown].sort((a, b) => a.total - b.total).slice(0, 5);
    const top2Floors = floorBreakdown.slice(0, 2);
    const bottom2Floors = [...floorBreakdown].sort((a, b) => a.total - b.total).slice(0, 2);
    const mostConsumedProducts = productBreakdown.slice(0, 5);
    const leastConsumedProducts = [...productBreakdown].sort((a, b) => a.items - b.items).slice(0, 5);

    // Generate PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="informe-consumos-${from}-${to}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const left = doc.page.margins.left;
    const right = pageWidth - doc.page.margins.right;
    const primaryColor = "#4D553D";

    const logoPath = path.join(__dirname, "../../public/images/Logo_Nattivo_v1.png");
    const hasLogo = fs.existsSync(logoPath);

    let y = 40;
    const logoW = 70;
    const logoH = 70;

    // Header with logo
    if (hasLogo) {
      doc.image(logoPath, right - logoW, y - 10, { width: logoW, height: logoH });
    }

    doc.font("Helvetica-Bold").fontSize(20);
    doc.fillColor(primaryColor);
    doc.text("INFORME DE CONSUMOS", left, y, { width: right - left - (hasLogo ? logoW + 12 : 0) });
    y += 22;
    doc.font("Helvetica").fontSize(11);
    doc.fillColor("#666");
    doc.text("Minibar — Nattivo Collection Hotel", left, y);
    y += 28;

    // Separator
    doc.fillColor(primaryColor);
    doc.rect(left, y, right - left, 2).fill();
    y += 18;

    // Info section
    doc.font("Helvetica-Bold").fontSize(11);
    doc.fillColor("#333");
    doc.text("Rango de fechas:", left, y);
    doc.font("Helvetica").fontSize(11);
    doc.fillColor("#555");
    doc.text(from + "  —  " + to, left + 100, y);
    y += 18;

    const userDisplay = req.session?.user?.fullName || "Operador";
    const now = new Date();
    doc.font("Helvetica-Bold").fontSize(11);
    doc.fillColor("#333");
    doc.text("Generado:", left, y);
    doc.font("Helvetica").fontSize(11);
    doc.fillColor("#555");
    doc.text(formatDate(now) + "  " + formatTime(now), left + 54, y);
    doc.text("por " + userDisplay, left + 54, y + 14);
    y += 34;

    doc.font("Helvetica-Bold").fontSize(11);
    doc.fillColor("#333");
    doc.text("Resumen general", left, y);
    y += 18;

    // Summary cards
    const cardW = (right - left - 16) / 3;
    const cardData = [
      { label: "Total consumido", value: formatCOP(totalAmount) },
      { label: "Productos consumidos", value: String(totalProducts) },
      { label: "Habitaciones con consumo", value: String(roomBreakdown.length) }
    ];

    for (let i = 0; i < cardData.length; i++) {
      const cx = left + i * (cardW + 8);
      doc.fillColor("#f5f5f0");
      doc.roundedRect(cx, y, cardW, 48, 6).fill();
      doc.fillColor(primaryColor);
      doc.font("Helvetica-Bold").fontSize(10);
      doc.text(cardData[i].label, cx + 8, y + 6, { width: cardW - 16 });
      doc.font("Helvetica-Bold").fontSize(14);
      doc.fillColor("#333");
      doc.text(cardData[i].value, cx + 8, y + 24, { width: cardW - 16 });
    }
    y += 64;

    // Category breakdown
    doc.font("Helvetica-Bold").fontSize(12);
    doc.fillColor(primaryColor);
    doc.text("Consumo por categor\u00eda", left, y);
    y += 18;

    for (const cat of categoryBreakdown) {
      doc.font("Helvetica").fontSize(10);
      doc.fillColor("#333");
      doc.text(cat.name, left, y);
      doc.text(formatCOP(cat.total), right, y, { align: "right" });
      y += 16;
    }
    y += 10;

    // Top 5 rooms
    doc.font("Helvetica-Bold").fontSize(12);
    doc.fillColor(primaryColor);
    doc.text("Top 5 habitaciones que m\u00e1s consumieron", left, y);
    y += 18;

    doc.font("Helvetica-Bold").fontSize(10);
    doc.fillColor("#555");
    doc.text("#", left, y);
    doc.text("Habitaci\u00f3n", left + 20, y);
    doc.text("Total", right, y, { align: "right" });
    y += 14;

    top5Rooms.forEach((r, idx) => {
      doc.font("Helvetica").fontSize(10);
      doc.fillColor("#333");
      doc.text(String(idx + 1), left, y);
      doc.text("Habitaci\u00f3n " + r.roomNumber, left + 20, y);
      doc.text(formatCOP(r.total), right, y, { align: "right" });
      y += 14;
    });
    y += 8;

    // Bottom 5 rooms
    doc.font("Helvetica-Bold").fontSize(12);
    doc.fillColor(primaryColor);
    doc.text("Top 5 habitaciones que menos consumieron", left, y);
    y += 18;

    doc.font("Helvetica-Bold").fontSize(10);
    doc.fillColor("#555");
    doc.text("#", left, y);
    doc.text("Habitaci\u00f3n", left + 20, y);
    doc.text("Total", right, y, { align: "right" });
    y += 14;

    bottom5Rooms.forEach((r, idx) => {
      doc.font("Helvetica").fontSize(10);
      doc.fillColor("#333");
      doc.text(String(idx + 1), left, y);
      doc.text("Habitaci\u00f3n " + r.roomNumber, left + 20, y);
      doc.text(formatCOP(r.total), right, y, { align: "right" });
      y += 14;
    });
    y += 8;

    // Floor ranking
    doc.font("Helvetica-Bold").fontSize(12);
    doc.fillColor(primaryColor);
    doc.text("Consumo por piso", left, y);
    y += 18;

    doc.font("Helvetica-Bold").fontSize(10);
    doc.fillColor("#555");
    doc.text("Piso", left, y);
    doc.text("Total", right, y, { align: "right" });
    y += 14;

    for (const f of floorBreakdown) {
      doc.font("Helvetica").fontSize(10);
      doc.fillColor("#333");
      doc.text(f.floorName, left, y);
      doc.text(formatCOP(f.total), right, y, { align: "right" });
      y += 14;
    }
    y += 8;

    // Most consumed products
    doc.font("Helvetica-Bold").fontSize(12);
    doc.fillColor(primaryColor);
    doc.text("Productos m\u00e1s consumidos", left, y);
    y += 18;

    doc.font("Helvetica-Bold").fontSize(10);
    doc.fillColor("#555");
    doc.text("#", left, y);
    doc.text("Producto", left + 20, y);
    doc.text("Cant.", right - 100, y, { align: "right" });
    doc.text("Total", right, y, { align: "right" });
    y += 14;

    mostConsumedProducts.forEach((p, idx) => {
      doc.font("Helvetica").fontSize(10);
      doc.fillColor("#333");
      doc.text(String(idx + 1), left, y);
      doc.text(p.name, left + 20, y, { width: right - left - 140 });
      doc.text(String(p.items), right - 100, y, { align: "right" });
      doc.text(formatCOP(p.total), right, y, { align: "right" });
      y += 14;
    });
    y += 8;

    // Products without consumption
    if (noConsumptionProducts.length > 0) {
      doc.font("Helvetica-Bold").fontSize(12);
      doc.fillColor(primaryColor);
      doc.text("Productos sin consumo", left, y);
      y += 18;

      doc.font("Helvetica").fontSize(10);
      doc.fillColor("#333");
      const prodNames = noConsumptionProducts.map(p => p.name).join(", ");
      doc.text(prodNames, left, y, { width: right - left });
      y += 14 + Math.ceil(prodNames.length / 80) * 12;
      y += 8;
    }

    // Rooms without consumption
    if (noConsumptionRooms.length > 0) {
      doc.font("Helvetica-Bold").fontSize(12);
      doc.fillColor(primaryColor);
      doc.text("Habitaciones sin consumo", left, y);
      y += 18;

      doc.font("Helvetica").fontSize(10);
      doc.fillColor("#333");
      const roomNames = noConsumptionRooms.map(r => "Hab. " + r.room_number).join(", ");
      doc.text(roomNames, left, y, { width: right - left });
      y += 14 + Math.ceil(roomNames.length / 80) * 12;
      y += 8;
    }

    // Observations
    if (y > doc.page.height - 120) {
      doc.addPage();
      y = 40;
    }

    doc.fillColor(primaryColor);
    doc.rect(left, y, right - left, 2).fill();
    y += 18;

    doc.font("Helvetica-Bold").fontSize(12);
    doc.fillColor(primaryColor);
    doc.text("Observaciones", left, y);
    y += 22;

    const observations = [];
    if (roomBreakdown.length > 0) observations.push("La habitaci\u00f3n con mayor consumo fue la habitaci\u00f3n " + roomBreakdown[0].roomNumber + ".");
    if (floorBreakdown.length > 0) observations.push("El piso con mayor consumo fue " + floorBreakdown[0].floorName + ".");
    if (productBreakdown.length > 0) observations.push("El producto m\u00e1s consumido fue " + productBreakdown[0].name + ".");
    if (categoryBreakdown.length > 0) observations.push("La categor\u00eda con mayor consumo fue " + categoryBreakdown[0].name + ".");
    if (noConsumptionRooms.length > 0) observations.push("Se encontraron " + noConsumptionRooms.length + " habitaciones sin consumo durante el periodo seleccionado.");
    observations.push("El total consumido durante el periodo fue de " + formatCOP(totalAmount) + ".");

    for (const obs of observations) {
      doc.font("Helvetica").fontSize(10);
      doc.fillColor("#333");
      doc.text("\u2022  " + obs, left, y, { width: right - left });
      y += 18;
    }

    // Footer
    doc.font("Helvetica").fontSize(8);
    doc.fillColor("#999");
    doc.text("Nattivo Collection Hotel — ChargeIt Minibar App", left, doc.page.height - 30, {
      width: right - left,
      align: "center"
    });

    doc.end();
  } catch (err) {
    console.error("Error generating report PDF:", err);
    if (!res.headersSent) {
      res.status(500).send("Error al generar PDF");
    }
  }
});

// GET /api/minibar/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const today = new Date();
    const todayStart = today.toISOString().split("T")[0] + " 00:00:00";
    const todayEnd = today.toISOString().split("T")[0] + " 23:59:59";
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split("T")[0] + " 00:00:00";

    const [[todayConsumption]] = await getDbPool().query(
      `SELECT COUNT(*) AS movements, COALESCE(SUM(quantity_moved), 0) AS products,
              COALESCE(SUM(quantity_moved * mp.price), 0) AS total
       FROM minibar_movements mm
       JOIN minibar_products mp ON mp.id = mm.product_id
       WHERE mm.movement_type = 'consumption' AND mm.created_at >= ? AND mm.created_at <= ?`,
      [todayStart, todayEnd]
    );

    const [[weekConsumption]] = await getDbPool().query(
      `SELECT COUNT(*) AS movements, COALESCE(SUM(quantity_moved), 0) AS products,
              COALESCE(SUM(quantity_moved * mp.price), 0) AS total
       FROM minibar_movements mm
       JOIN minibar_products mp ON mp.id = mm.product_id
       WHERE mm.movement_type = 'consumption' AND mm.created_at >= ?`,
      [weekStartStr]
    );

    const [[{ total: totalRooms }]] = await getDbPool().query("SELECT COUNT(*) AS total FROM rooms");

    const [[{ total: lowStockRooms }]] = await getDbPool().query(
      `SELECT COUNT(DISTINCT rmi.room_id) AS total
       FROM room_minibar_inventory rmi
       JOIN minibar_products mp ON mp.id = rmi.product_id
       WHERE rmi.quantity <= 2 AND mp.is_active = 1`
    );

    const recentMovements = await query(
      `SELECT mm.id, mm.movement_type, mm.quantity_moved, mm.user_name, mm.created_at,
              mp.name AS product_name, r.room_number, f.name AS floor_name
       FROM minibar_movements mm
       JOIN minibar_products mp ON mp.id = mm.product_id
       JOIN rooms r ON r.id = mm.room_id
       JOIN floors f ON f.id = r.floor_id
       WHERE mm.movement_type != 'void'
       ORDER BY mm.created_at DESC LIMIT 5`
    );

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

    res.json({
      today: todayConsumption,
      week: weekConsumption,
      totalRooms,
      lowStockRoomCount: lowStockRooms,
      recentMovements,
      topProducts
    });
  } catch (err) {
    console.error("Error fetching dashboard:", err);
    res.status(500).json({ error: "Error al cargar dashboard" });
  }
});

module.exports = router;
