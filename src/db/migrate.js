require("dotenv").config();
const mysql = require("mysql2/promise");

async function migrate() {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "minibar_app";

  const conn = await mysql.createConnection({ host, port, user, password });
  await conn.query(`USE \`${database}\``);

  console.log("Iniciando migración: pisos/habitaciones → floors/rooms\n");

  // 1. Check if old tables exist
  const [[{ hasPisos }]] = await conn.query(
    "SELECT COUNT(*) > 0 AS hasPisos FROM information_schema.tables WHERE table_schema = ? AND table_name = 'pisos'",
    [database]
  );

  if (!hasPisos) {
    console.log("Las tablas antiguas (pisos/habitaciones) ya no existen. Migración no necesaria.");
    await conn.end();
    return;
  }

  // 2. Migrate pisos → floors
  const [[{ has_floor: floor1Exists }]] = await conn.query(
    "SELECT COUNT(*) > 0 AS has_floor FROM floors WHERE floor_number = 1"
  );
  if (!floor1Exists) {
    const [oldFloors] = await conn.query("SELECT id_piso, nombre FROM pisos ORDER BY id_piso");
    for (const f of oldFloors) {
      const num = f.id_piso;
      // Check if this floor already exists
      const [[existing]] = await conn.query(
        "SELECT id FROM floors WHERE floor_number = ? LIMIT 1",
        [num]
      );
      if (!existing) {
        await conn.query(
          "INSERT INTO floors (name, floor_number) VALUES (?, ?)",
          [f.nombre, num]
        );
        console.log(`  ✓ Piso "${f.nombre}" → floors`);
      }
    }
  } else {
    console.log("  - Piso 1 ya existe en floors");
  }

  // 3. Migrate habitaciones → rooms
  const [oldRooms] = await conn.query(`
    SELECT h.id_habitacion, h.numero, p.id_piso AS floor_number
    FROM habitaciones h
    JOIN pisos p ON p.id_piso = h.id_piso
    ORDER BY h.id_habitacion
  `);

  // Build mapping old_id → new_id
  const roomIdMap = {};
  for (const r of oldRooms) {
    // Find the matching floor
    const [[floor]] = await conn.query(
      "SELECT id FROM floors WHERE floor_number = ? LIMIT 1",
      [r.floor_number]
    );
    if (!floor) {
      console.log(`  ✗ No se encontró floor para floor_number=${r.floor_number}, saltando room ${r.numero}`);
      continue;
    }
    const floorId = floor.id;

    // Check if this room_number + floor_id already exists
    const [[existingRoom]] = await conn.query(
      "SELECT id FROM rooms WHERE room_number = ? AND floor_id = ? LIMIT 1",
      [r.numero, floorId]
    );
    if (existingRoom) {
      roomIdMap[r.id_habitacion] = existingRoom.id;
    } else {
      const [insertResult] = await conn.query(
        "INSERT INTO rooms (room_number, floor_id) VALUES (?, ?)",
        [r.numero, floorId]
      );
      roomIdMap[r.id_habitacion] = insertResult.insertId;
      console.log(`  ✓ Habitación ${r.numero} → rooms (id=${insertResult.insertId})`);
    }
  }

  // 4. Update consumptions.room_id to point to new rooms.id
  const [consumptions] = await conn.query("SELECT id, room_id FROM consumptions WHERE room_id IS NOT NULL");
  for (const c of consumptions) {
    const newId = roomIdMap[c.room_id];
    if (newId) {
      await conn.query("UPDATE consumptions SET room_id = ? WHERE id = ?", [newId, c.id]);
      console.log(`  ✓ Consumo #${c.id}: room_id ${c.room_id} → ${newId}`);
    } else {
      console.log(`  ✗ Consumo #${c.id}: no se encontró mapping para room_id ${c.room_id}`);
    }
  }

  // 5. Drop old tables (disable FK checks temporarily to avoid constraint issues)
  await conn.query("SET FOREIGN_KEY_CHECKS = 0");
  await conn.query("DROP TABLE IF EXISTS habitaciones");
  await conn.query("DROP TABLE IF EXISTS pisos");
  await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("\n  ✓ Tablas antiguas (pisos, habitaciones) eliminadas");

  await conn.end();
  console.log("\n✅ Migración completada exitosamente");
}

migrate().catch((err) => {
  console.error("Error en migración:", err);
  process.exit(1);
});
