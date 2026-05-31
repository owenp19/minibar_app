require("dotenv").config();
require("./src/config/db").initDbPool();
const { createApp } = require("./src/app");
const { query, getDbPool } = require("./src/config/db");

const app = createApp();
const port = Number(process.env.PORT || 3000);

// Check expiring products on startup
async function checkExpirations() {
  try {
    const items = await query(
      `SELECT rmi.id, rmi.expiration_date, rmi.product_id, rmi.room_id,
              mp.name AS product_name,
              r.room_number, r.floor_id,
              f.name AS floor_name
       FROM room_minibar_inventory rmi
       JOIN minibar_products mp ON mp.id = rmi.product_id
       JOIN rooms r ON r.id = rmi.room_id
       JOIN floors f ON f.id = r.floor_id
       WHERE rmi.expiration_date IS NOT NULL
         AND rmi.quantity > 0`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let created = 0;

    for (const item of items) {
      if (!item.expiration_date) continue;
      const expDate = new Date(item.expiration_date);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 7 && diffDays >= 0) {
        const existing = await query(
          `SELECT id FROM notifications
           WHERE product_name = ? AND room_id = ? AND expiration_date = ? AND is_read = 0`,
          [item.product_name, item.room_id, item.expiration_date]
        );

        if (existing.length === 0) {
          await query(
            `INSERT INTO notifications (product_name, room_id, floor_id, room_number, floor_name, expiration_date, days_remaining)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [item.product_name, item.room_id, item.floor_id, item.room_number, item.floor_name, item.expiration_date, diffDays]
          );
          created++;
        }
      }
    }
    console.log(`[Scheduler] Revisión de vencimientos: ${created} notificaciones nuevas`);
  } catch (err) {
    console.error("[Scheduler] Error checking expirations:", err.message);
  }
}

// Run on startup and every 6 hours
setTimeout(checkExpirations, 5000);
setInterval(checkExpirations, 6 * 60 * 60 * 1000);

app.listen(port, "0.0.0.0", () => {
  console.log(`Minibar backend running at http://localhost:${port}`);
});
