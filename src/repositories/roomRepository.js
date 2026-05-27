const db = require("../config/db");

async function getAllRooms() {
  return await db.query(
    `SELECT
        r.id,
        r.room_number AS roomNumber,
        f.id AS floorId,
        f.name AS floorName
     FROM rooms r
     INNER JOIN floors f ON f.id = r.floor_id
     ORDER BY f.floor_number, CAST(r.room_number AS UNSIGNED)`
  );
}

module.exports = {
  getAllRooms
};
