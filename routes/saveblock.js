const express = require("express");
const { fetchDataFromDb, fetchDataFromLorawanDb,executeLorawanQuery } = require("./dbConnection");
const router = express.Router();

router.post("/saveBlock", async (req, res) => {
  const { add: addParam } = req.query;
  const add = parseInt(addParam);

  const {
    current_user_id,
    block_id,
    block_name,
    block_area,
    coordinates,
    ranch_id,
    users,
    weather_station,
  } = req.body;

  if (isNaN(add) || (add !== 0 && add !== 1)) {
    return res.status(400).json({ error: "'add' must be 0 or 1" });
  }

  try {
    let plantingAreaId;

    if (add === 0) {

      if (
        !current_user_id ||
        !block_id ||
        !block_name ||
        !users?.length ||
        !weather_station
      ) {
        return res.status(400).json({ error: "Missing required fields for block update" });
      }

      plantingAreaId = block_id; 
      const roleCheckQuery = `
        SELECT role FROM user_blocks WHERE user_id = ? AND block_id = ? LIMIT 1
      `;
      const [roleResult] = await fetchDataFromLorawanDb(roleCheckQuery, [current_user_id, block_id]);
      if (!roleResult || roleResult.role !== 1) {
        return res.status(403).json({ error: "User is not authorized to perform this action" });
      }

      const updateBlockQuery = `
        UPDATE table_planting_area
        SET name = ?
        WHERE objid = ? AND name != ?
      `;
      await fetchDataFromDb(updateBlockQuery, [block_name, block_id, block_name]);

    } else {
      
      if (
        !block_name ||
        !block_area ||
        !coordinates?.length ||
        !ranch_id ||
        !users?.length ||
        !weather_station
      ) {
        return res.status(400).json({ error: "Missing required fields for block creation" });
      }
      const [ranch] = await fetchDataFromDb(`SELECT objid FROM table_ranch WHERE objid = ?`, [ranch_id]);
      if (!ranch) return res.status(404).json({ error: "Ranch not found" });

      const insertAreaQuery = `
        INSERT INTO table_planting_area (name, acres, coordinates, ranch_id, dateadded, status)
        VALUES (?, ?, ?, ?, NOW(), 1)
      `;
      // const transformedCoords = JSON.stringify(coordinates.map(coord => [coord.lat, coord.lng]));
      const result = await fetchDataFromDb(insertAreaQuery, [
        block_name,
        block_area,
        JSON.stringify(coordinates),
        ranch_id,
      ]);

      plantingAreaId = result.insertId;
    }

    const [existingStation] = await fetchDataFromDb(
      `SELECT value FROM table_planting_area_settings WHERE planting_area_id = ? AND name = 'station_id'`,
      [plantingAreaId]
    );

    if (existingStation) {
      await fetchDataFromDb(
        `UPDATE table_planting_area_settings SET value = ? WHERE planting_area_id = ? AND name = 'station_id' AND value != ?`,
        [weather_station, plantingAreaId, weather_station]
      );
    } else {
      await fetchDataFromDb(
        `INSERT INTO table_planting_area_settings (planting_area_id, name, value) VALUES (?, 'station_id', ?)`,
        [plantingAreaId, weather_station]
      );
    }

    const usernames = users.map(u => u.username);

    const placeholders = usernames.map(() => '?').join(', ');
    const query = `
      SELECT OBJID as user_id, username FROM awn.users
      WHERE username IN (${placeholders})
    `;
    const result = await executeLorawanQuery(query, usernames);

    const foundUsernames = result.map(u => u.username);
    const missing = usernames.filter(u => !foundUsernames.includes(u));

    if (missing.length > 0) {
      return res.status(404).json({
        error: 'User(s) not found',
        missing,
      });
    }

    // 2. Reconstruct full users array with user_id and role
    const userMap = Object.fromEntries(result.map(u => [u.username, u.user_id]));
    const resolvedUsers = users.map(u => ({
      user_id: userMap[u.username],
      role: u.role,
    }));

    const userIds = resolvedUsers.map(u => u.user_id);

    // 3. Update removed users to status = 0
    if (userIds.length > 0) {
      const updateQuery = `
        UPDATE user_blocks
        SET status = 0
        WHERE block_id = ?
        AND user_id NOT IN (${userIds.map(() => '?').join(',')})
      `;
      await executeLorawanQuery(updateQuery, [plantingAreaId, ...userIds]);
    }

    // 4. Upsert current users
    const upsertQuery = `
      INSERT INTO user_blocks (user_id, block_id, role)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE role = VALUES(role), status = 1
    `;
    for (const { user_id, role } of resolvedUsers) {
      await executeLorawanQuery(upsertQuery, [user_id, plantingAreaId, role]);
    }

    res.status(200).json({
      message: add === 1 ? "Block created successfully" : "Block updated successfully",
      block_id: Number(plantingAreaId),
    });

  } catch (error) {
    console.error("Error saving/updating block:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/get-assigned-users/:block_id', async (req, res) => {
  const { block_id } = req.params;
  console.log(` Fetching assigned users for block_id: ${block_id}`);

  try {
    const query = `
      SELECT 
        ub.user_id, 
        ub.role, 
        u.username
      FROM 
        LORAWAN.user_blocks ub
      JOIN 
        awn.users u 
      ON 
        ub.user_id = u.objid
      WHERE 
        ub.block_id = ?
        and 
        ub.status = 1
    `;

    const assignedUsers = await fetchDataFromLorawanDb(query, [block_id]);

    if (!assignedUsers || assignedUsers.length === 0) {
      console.warn(` No assigned users found for block_id: ${block_id}`);
      return res.status(200).json({ assignedUsers: [] });
    }

    console.log(` Found ${assignedUsers.length} assigned users for block_id: ${block_id}`);
    return res.status(200).json({ assignedUsers });

  } catch (err) {
    console.error(` Error fetching assigned users for block_id ${block_id}: ${err.message}`);
    console.error(' Stack trace:', err.stack);

    if (err.message.includes('retrieve connection from pool timeout')) {
      console.error(' Connection pool timeout detected. Check pool size or long-running queries.');
    }

    return res.status(500).json({
      error: 'Internal server error while fetching assigned users.',
      dbError: err.message,
      stack: err.stack
    });
  }
});

module.exports = router;