require("dotenv").config();
const mysql = require("mysql2/promise");

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "minibar_app"
  });

  try {
    await conn.query(
      "ALTER TABLE minibar_movements MODIFY COLUMN movement_type ENUM('consumption','restock','adjustment','void') NOT NULL"
    );
    console.log("OK: void added to movement_type ENUM");
  } catch (e) {
    console.log("Note:", e.message);
  }

  await conn.end();
}

migrate().catch(console.error);
