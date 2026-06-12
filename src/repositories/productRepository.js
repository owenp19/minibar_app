const db = require("../config/db");

async function getActiveProducts() {
  return await db.query(
    `SELECT mp.id, mp.name, mp.price, mp.image_url, mc.name AS category_name
     FROM minibar_products mp
     JOIN minibar_categories mc ON mc.id = mp.category_id
     WHERE mp.is_active = 1
     ORDER BY mc.display_order ASC, mp.display_order ASC`
  );
}

module.exports = {
  getActiveProducts
};
