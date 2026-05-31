require("dotenv").config();
const mysql = require("mysql2/promise");

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "minibar_app",
    multipleStatements: true
  });

  try {
    await conn.query(
      "ALTER TABLE minibar_movements MODIFY COLUMN movement_type ENUM('consumption','restock','adjustment','void','perdida','dano') NOT NULL"
    );
    console.log("OK: new loss types added to movement_type ENUM");
  } catch (e) {
    console.log("Note:", e.message);
  }

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS minibar_loss_records (
        id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
        room_id INT(10) UNSIGNED NOT NULL,
        floor_id INT(10) UNSIGNED NOT NULL,
        user_id INT(10) UNSIGNED DEFAULT NULL,
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'pendiente',
        notes TEXT DEFAULT NULL,
        registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        FOREIGN KEY (floor_id) REFERENCES floors(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("OK: minibar_loss_records table created");
  } catch (e) {
    console.log("Note:", e.message);
  }

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS minibar_loss_record_items (
        id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
        minibar_loss_record_id INT(10) UNSIGNED NOT NULL,
        product_id INT(10) UNSIGNED NOT NULL,
        product_name VARCHAR(100) NOT NULL,
        category_name VARCHAR(50) NOT NULL,
        loss_type ENUM('perdida','dano') NOT NULL,
        quantity INT(10) NOT NULL,
        unit_price DECIMAL(12,2) NOT NULL,
        total_price DECIMAL(12,2) NOT NULL,
        notes TEXT DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (minibar_loss_record_id) REFERENCES minibar_loss_records(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES minibar_products(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("OK: minibar_loss_record_items table created");
  } catch (e) {
    console.log("Note:", e.message);
  }

  // Add status column if missing
  try {
    await conn.query("ALTER TABLE minibar_loss_records ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pendiente' AFTER total_amount");
    console.log("OK: status column added to minibar_loss_records");
  } catch (e) {
    console.log("Note:", e.message);
  }

  // Update loss_type ENUM if needed
  try {
    await conn.query(
      "ALTER TABLE minibar_loss_record_items MODIFY COLUMN loss_type ENUM('perdida','dano') NOT NULL"
    );
    console.log("OK: loss_type ENUM updated in minibar_loss_record_items");
  } catch (e) {
    console.log("Note:", e.message);
  }

  // Add expiration_date to room_minibar_inventory
  try {
    await conn.query(
      "ALTER TABLE room_minibar_inventory ADD COLUMN expiration_date DATE DEFAULT NULL AFTER quantity"
    );
    console.log("OK: expiration_date column added to room_minibar_inventory");
  } catch (e) {
    console.log("Note:", e.message);
  }

  // Create notifications table
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
        product_name VARCHAR(100) NOT NULL,
        room_id INT(10) UNSIGNED NOT NULL,
        floor_id INT(10) UNSIGNED NOT NULL,
        room_number VARCHAR(20) NOT NULL,
        floor_name VARCHAR(100) NOT NULL,
        expiration_date DATE NOT NULL,
        days_remaining INT(10) NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_is_read (is_read),
        KEY idx_floor (floor_id),
        KEY idx_room (room_id),
        KEY idx_expiration (expiration_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("OK: notifications table created");
  } catch (e) {
    console.log("Note:", e.message);
  }

  // Create audit_logs table
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id INT(10) UNSIGNED DEFAULT NULL,
        user_name VARCHAR(150) DEFAULT NULL,
        user_role VARCHAR(50) DEFAULT NULL,
        module_name VARCHAR(100) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        action_description TEXT DEFAULT NULL,
        floor_id INT(10) UNSIGNED DEFAULT NULL,
        room_id INT(10) UNSIGNED DEFAULT NULL,
        product_id INT(10) UNSIGNED DEFAULT NULL,
        previous_data JSON DEFAULT NULL,
        new_data JSON DEFAULT NULL,
        quantity_before DECIMAL(12,2) DEFAULT NULL,
        quantity_after DECIMAL(12,2) DEFAULT NULL,
        amount DECIMAL(12,2) DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        device_info VARCHAR(255) DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'success',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_user_id (user_id),
        KEY idx_module_name (module_name),
        KEY idx_action_type (action_type),
        KEY idx_floor_id (floor_id),
        KEY idx_room_id (room_id),
        KEY idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("OK: audit_logs table created");
  } catch (e) {
    console.log("Note:", e.message);
  }

  await conn.end();
}

migrate().catch(console.error);
