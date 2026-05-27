const db = require("../config/db");

async function createConsumptionWithItems(roomId, note, items) {
  const room = Number(roomId);
  if (!Number.isFinite(room) || room <= 0) throw new Error("roomId inválido");

  const normalizedItems = Array.isArray(items)
    ? items
        .map((x) => ({
          productId: Number(x.productId),
          quantity: Number(x.quantity),
        }))
        .filter(
          (x) =>
            Number.isFinite(x.productId) &&
            x.productId > 0 &&
            Number.isFinite(x.quantity) &&
            x.quantity > 0
        )
    : [];

  if (normalizedItems.length === 0) throw new Error("items inválidos");

  const pool = db.getDbPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [insertConsumption] = await conn.query(
      `INSERT INTO consumptions (room_id, note, created_at, consumption_date)
       VALUES (?, ?, NOW(), NOW())`,
      [room, note || null]
    );

    const consumptionId = insertConsumption.insertId;

    for (const it of normalizedItems) {
      await conn.query(
        `INSERT INTO consumption_items (consumption_id, product_id, quantity)
         VALUES (?, ?, ?)`,
        [consumptionId, it.productId, it.quantity]
      );
    }

    await conn.commit();
    return consumptionId;
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {}
    throw err;
  } finally {
    conn.release();
  }
}

async function getConsumptionWithItemsById(consumptionId) {
  const id = Number(consumptionId);
  if (!Number.isFinite(id) || id <= 0) return null;

  const rows = await db.query(
    `
      SELECT
        c.id,
        c.created_at AS createdAt,
        c.consumption_date AS consumptionDate,
        c.note AS note,
        r.room_number AS roomNumber
      FROM consumptions c
      JOIN rooms r ON r.id = c.room_id
      WHERE c.id = ?
      LIMIT 1
    `,
    [id]
  );

  if (!rows || rows.length === 0) return null;

  const c = rows[0];

  const itemRows = await db.query(
    `
      SELECT
        p.name AS name,
        p.price AS price,
        ci.quantity AS quantity
      FROM consumption_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.consumption_id = ?
    `,
    [id]
  );

  const items = (itemRows || []).map((x) => ({
    name: x.name,
    price: Number(x.price) || 0,
    quantity: Number(x.quantity) || 0,
  }));

  const total = items.reduce((acc, it) => acc + it.quantity * it.price, 0);

  return {
    id: c.id,
    createdAt: c.createdAt || c.consumptionDate || null,
    roomNumber: String(c.roomNumber ?? "").trim(),
    note: c.note || "",
    items,
    total,
  };
}

async function getConsumptionsByDateRange(from, to) {
  let sql = `
    SELECT
      c.id,
      c.created_at AS createdAt,
      c.consumption_date AS consumptionDate,
      c.note AS note,
      r.room_number AS roomNumber
    FROM consumptions c
    JOIN rooms r ON r.id = c.room_id
  `;
  const params = [];

  if (from && to) {
    sql += ` WHERE c.created_at >= ? AND c.created_at <= ?`;
    params.push(from + " 00:00:00", to + " 23:59:59");
  } else if (from) {
    sql += ` WHERE c.created_at >= ?`;
    params.push(from + " 00:00:00");
  } else if (to) {
    sql += ` WHERE c.created_at <= ?`;
    params.push(to + " 23:59:59");
  }

  sql += ` ORDER BY c.created_at DESC`;

  const rows = await db.query(sql, params);
  if (!rows || rows.length === 0) return [];

  const consumptions = [];
  for (const c of rows) {
    const itemRows = await db.query(
      `
        SELECT
          p.name AS name,
          p.price AS price,
          ci.quantity AS quantity
        FROM consumption_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.consumption_id = ?
      `,
      [c.id]
    );

    const items = (itemRows || []).map((x) => ({
      name: x.name,
      price: Number(x.price) || 0,
      quantity: Number(x.quantity) || 0,
    }));

    const total = items.reduce((acc, it) => acc + it.quantity * it.price, 0);

    consumptions.push({
      id: c.id,
      createdAt: c.createdAt || c.consumptionDate || null,
      roomNumber: String(c.roomNumber ?? "").trim(),
      note: c.note || "",
      items,
      total,
    });
  }

  return consumptions;
}

module.exports = {
  createConsumptionWithItems,
  getConsumptionWithItemsById,
  getConsumptionsByDateRange,
};
