require("dotenv").config();
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

async function seed() {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "minibar_app";

  const conn = await mysql.createConnection({ host, port, user, password });

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${database}\``);

  // ============================================================
  // USERS
  // ============================================================

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(30) DEFAULT NULL,
      avatar_url VARCHAR(255) DEFAULT NULL,
      role ENUM('operator','admin') NOT NULL DEFAULT 'operator',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Add columns if they don't exist (for existing databases)
  try {
    await conn.query("ALTER TABLE users ADD COLUMN phone VARCHAR(30) DEFAULT NULL AFTER password_hash");
  } catch (e) { /* column may already exist */ }
  try {
    await conn.query("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL AFTER phone");
  } catch (e) { /* column may already exist */ }

  const hash = await bcrypt.hash("admin123", 12);

  const [[{ count: userCount }]] = await conn.query("SELECT COUNT(*) AS count FROM users");
  if (userCount === 0) {
    await conn.query(
      "INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)",
      ["Owen Pusey", "operador@nattivo.com", hash, "operator", 1]
    );
    console.log("  ✓ Usuario creado");
  } else {
    await conn.query(
      "UPDATE users SET password_hash = ? WHERE email = ?",
      [hash, "operador@nattivo.com"]
    );
    console.log("  ✓ Contraseña restablecida a: admin123");
  }

  // ============================================================
  // PRODUCTS (for consumption module)
  // ============================================================

  await conn.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL,
      price DECIMAL(12,2) NOT NULL DEFAULT 0,
      active TINYINT(1) NOT NULL DEFAULT 1,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [[{ count: productCount }]] = await conn.query("SELECT COUNT(*) AS count FROM products");
  if (productCount === 0) {
    const products = [
      ["Agua sin gas 500ml", 5000],
      ["Agua con gas 500ml", 5500],
      ["Gaseosa Cola 355ml", 7000],
      ["Gaseosa Naranja 355ml", 7000],
      ["Cerveza Rubia 330ml", 9000],
      ["Cerveza Negra 330ml", 9500],
      ["Jugo Natural 350ml", 8000],
      ["Jugo de Naranja 350ml", 8000],
      ["Vino Tinto Copa", 15000],
      ["Vino Blanco Copa", 15000],
      ["Whisky 50ml", 25000],
      ["Ron 50ml", 18000],
      ["Vodka 50ml", 20000],
      ["Chocolate Caliente", 6000],
      ["Café Premium", 5000],
      ["Té Selección", 4500],
      ["Mani Salado 100g", 4000],
      ["Papas Fritas 120g", 4500],
      ["Almendras 100g", 8000],
      ["Barra de Cereal", 3500],
    ];
    for (const [name, price] of products) {
      await conn.query(
        "INSERT INTO products (name, price, active) VALUES (?, ?, 1)",
        [name, price]
      );
    }
    console.log("  ✓ Productos creados");
  } else {
    console.log("  - Productos ya existen");
  }

  // ============================================================
  // FLOORS (unified - merged from old pisos)
  // ============================================================

  await conn.query(`
    CREATE TABLE IF NOT EXISTS floors (
      id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL,
      floor_number INT(10) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY floor_number (floor_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [[{ count: floorCount }]] = await conn.query("SELECT COUNT(*) AS count FROM floors");
  if (floorCount === 0) {
    const floorData = [
      [1, "Piso 1"],
      [2, "Piso 2"],
      [3, "Piso 3"],
      [4, "Piso 4"],
      [5, "Piso 5"],
      [6, "Piso 6"]
    ];
    for (const [num, name] of floorData) {
      await conn.query("INSERT INTO floors (floor_number, name) VALUES (?, ?)", [num, name]);
    }
    console.log("  ✓ Pisos creados");
  } else {
    console.log("  - Pisos ya existen");
  }

  // ============================================================
  // ROOMS (unified - merged from old habitaciones)
  // ============================================================

  await conn.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      room_number VARCHAR(10) NOT NULL,
      floor_id INT(10) UNSIGNED NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (floor_id) REFERENCES floors(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [[{ count: roomCount }]] = await conn.query("SELECT COUNT(*) AS count FROM rooms");
  if (roomCount === 0) {
    // rooms from old habitaciones (floors 1-3)
    for (let floorNum = 1; floorNum <= 3; floorNum++) {
      const [[floor]] = await conn.query("SELECT id FROM floors WHERE floor_number = ? LIMIT 1", [floorNum]);
      if (!floor) continue;
      for (let num = 1; num <= 8; num++) {
        const roomNum = `${floorNum}0${num.toString().padStart(2, "0")}`;
        await conn.query(
          "INSERT INTO rooms (room_number, floor_id) VALUES (?, ?)",
          [roomNum, floor.id]
        );
      }
    }

    // additional minibar rooms (floors 2-6)
    const extraRoomData = {
      2: [205, 207, 209, 213, 215, 216, 217, 218, 219, 220, 221, 222],
      3: [301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322],
      4: [402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422],
      5: [501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522],
      6: [601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621]
    };
    const [floors] = await conn.query("SELECT id, floor_number FROM floors");
    const floorMap = {};
    for (const f of floors) {
      floorMap[f.floor_number] = f.id;
    }
    for (const [floorNum, rooms] of Object.entries(extraRoomData)) {
      const floorId = floorMap[floorNum];
      if (!floorId) continue;
      for (const roomNum of rooms) {
        // avoid duplicates
        const [[existing]] = await conn.query(
          "SELECT id FROM rooms WHERE room_number = ? AND floor_id = ? LIMIT 1",
          [String(roomNum), floorId]
        );
        if (!existing) {
          await conn.query(
            "INSERT INTO rooms (room_number, floor_id) VALUES (?, ?)",
            [String(roomNum), floorId]
          );
        }
      }
    }
    console.log("  ✓ Habitaciones creadas");
  } else {
    console.log("  - Habitaciones ya existen");
  }

  // ============================================================
  // CONSUMPTIONS
  // ============================================================

  await conn.query(`
    CREATE TABLE IF NOT EXISTS consumptions (
      id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      room_id INT(10) UNSIGNED NOT NULL,
      note TEXT DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      consumption_date DATETIME DEFAULT NULL,
      PRIMARY KEY (id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS consumption_items (
      id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      consumption_id INT(10) UNSIGNED NOT NULL,
      product_id INT(10) UNSIGNED NOT NULL,
      quantity INT(10) NOT NULL DEFAULT 1,
      PRIMARY KEY (id),
      FOREIGN KEY (consumption_id) REFERENCES consumptions(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // ============================================================
  // MINIBAR MANAGEMENT TABLES
  // ============================================================

  await conn.query(`
    CREATE TABLE IF NOT EXISTS minibar_categories (
      id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL,
      display_order INT(10) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS minibar_products (
      id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      category_id INT(10) UNSIGNED NOT NULL,
      name VARCHAR(100) NOT NULL,
      default_quantity INT(10) NOT NULL DEFAULT 1,
      display_order INT(10) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (category_id) REFERENCES minibar_categories(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS room_minibar_inventory (
      id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      room_id INT(10) UNSIGNED NOT NULL,
      product_id INT(10) UNSIGNED NOT NULL,
      quantity INT(10) NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY room_product (room_id, product_id),
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (product_id) REFERENCES minibar_products(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Seed minibar categories
  const [[{ count: catCount }]] = await conn.query("SELECT COUNT(*) AS count FROM minibar_categories");
  let canastaId, neveraId;
  if (catCount === 0) {
    const catRes = await conn.query(
      "INSERT INTO minibar_categories (name, display_order) VALUES ('Canasta', 1), ('Nevera', 2)"
    );
    canastaId = catRes[0].insertId;
    neveraId = canastaId + 1;
    console.log("  ✓ Categorías de minibar creadas");
  } else {
    const [[canasta]] = await conn.query("SELECT id FROM minibar_categories WHERE name = 'Canasta' LIMIT 1");
    const [[nevera]] = await conn.query("SELECT id FROM minibar_categories WHERE name = 'Nevera' LIMIT 1");
    canastaId = canasta.id;
    neveraId = nevera.id;
    console.log("  - Categorías de minibar ya existen");
  }

  // Seed minibar products
  const [[{ count: prodCount }]] = await conn.query("SELECT COUNT(*) AS count FROM minibar_products");
  if (prodCount === 0) {
    const canastaProducts = [
      ["Chiclets Trident", 1, 1],
      ["Salchichas Viena", 1, 2],
      ["Aceitunas", 1, 3],
      ["Monterrojo", 1, 4],
      ["Pringles", 1, 5],
      ["Combo Cheddar", 1, 6],
      ["Pistacho", 1, 7],
      ["Barra de proteína Zubu", 1, 8],
      ["Pretzels sal marina", 1, 9],
      ["Albaricoques deshidratados", 1, 10],
      ["Kinops", 2, 11],
      ["Gummis", 1, 12],
      ["Chocolate Mundial", 1, 13]
    ];
    for (const [name, qty, order] of canastaProducts) {
      await conn.query(
        "INSERT INTO minibar_products (category_id, name, default_quantity, display_order) VALUES (?, ?, ?, ?)",
        [canastaId, name, qty, order]
      );
    }

    const neveraProducts = [
      ["Electronit", 2, 1],
      ["Agua Mineral", 2, 2],
      ["Agua con gas", 2, 3],
      ["Soda Júpiter", 1, 4],
      ["Júpiter Toronja", 1, 5],
      ["Júpiter Tónica", 1, 6],
      ["Red Bull", 1, 7],
      ["Coca Cola Clásica", 2, 8],
      ["Coca Cola Cero", 2, 9],
      ["Coronita", 2, 10],
      ["Club Colombia", 4, 11]
    ];
    for (const [name, qty, order] of neveraProducts) {
      await conn.query(
        "INSERT INTO minibar_products (category_id, name, default_quantity, display_order) VALUES (?, ?, ?, ?)",
        [neveraId, name, qty, order]
      );
    }
    console.log("  ✓ Productos de minibar creados");
  } else {
    console.log("  - Productos de minibar ya existen");
  }

  // Seed initial inventory for each room
  const [[{ count: invCount }]] = await conn.query("SELECT COUNT(*) AS count FROM room_minibar_inventory");
  if (invCount === 0) {
    const [allRooms] = await conn.query("SELECT id FROM rooms");
    const [allProducts] = await conn.query("SELECT id, default_quantity FROM minibar_products WHERE is_active = 1");
    for (const room of allRooms) {
      for (const prod of allProducts) {
        await conn.query(
          "INSERT INTO room_minibar_inventory (room_id, product_id, quantity) VALUES (?, ?, ?)",
          [room.id, prod.id, prod.default_quantity]
        );
      }
    }
    console.log("  ✓ Inventario inicial de minibar creado para todas las habitaciones");
  } else {
    console.log("  - Inventario de minibar ya existe");
  }

  await conn.end();
  console.log("\n✅ Seed completado exitosamente");
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
