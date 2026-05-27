const mysql = require("mysql2/promise");

let pool = null;

function initDbPool() {
  if (pool) return pool;

  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "minibar_app";

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
    queueLimit: 0,
    decimalNumbers: true,
    timezone: "-05:00"
  });

  return pool;
}

function getDbPool() {
  return initDbPool();
}

async function query(sql, params = []) {
  const p = getDbPool();
  const [rows] = await p.query(sql, params);
  return rows;
}

module.exports = {
  initDbPool,
  getDbPool,
  query
};
