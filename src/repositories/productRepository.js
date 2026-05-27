const db = require("../config/db");

async function getActiveProducts() {
  return await db.query(
    "SELECT id, name, price FROM products WHERE active = 1 ORDER BY name"
  );
}

module.exports = {
  getActiveProducts
};
