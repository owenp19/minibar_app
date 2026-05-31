require("dotenv").config();
const mysql = require("mysql2/promise");

async function update() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "minibar_app",
    multipleStatements: true
  });

  try {
    // Update existing data in minibar_loss_record_items
    const [r1] = await conn.query(
      "UPDATE minibar_loss_record_items SET loss_type = 'perdida' WHERE loss_type = 'robo'"
    );
    console.log(`Updated ${r1.affectedRows} rows in minibar_loss_record_items`);

    // Update existing data in minibar_movements
    const [r2] = await conn.query(
      "UPDATE minibar_movements SET movement_type = 'perdida' WHERE movement_type = 'robo'"
    );
    console.log(`Updated ${r2.affectedRows} rows in minibar_movements`);

    // Change ENUM for minibar_loss_record_items.loss_type
    await conn.query(
      "ALTER TABLE minibar_loss_record_items MODIFY COLUMN loss_type ENUM('perdida','dano') NOT NULL"
    );
    console.log("OK: loss_type ENUM updated to ('perdida','dano')");

    // Change ENUM for minibar_movements.movement_type
    await conn.query(
      "ALTER TABLE minibar_movements MODIFY COLUMN movement_type ENUM('consumption','restock','adjustment','void','perdida','dano') NOT NULL"
    );
    console.log("OK: movement_type ENUM updated to include 'perdida'");

    console.log("\nMigration completed successfully.");
  } catch (e) {
    console.error("Error:", e.message);
  }

  await conn.end();
}

update().catch(console.error);
