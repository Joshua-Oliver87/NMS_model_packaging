const express = require("express");
const { fetchDataFromDb } = require("./dbConnection");
const router = express.Router();


// API to fetch the most recently saved figure for the logged-in user
router.get("/getRanchById", async (req, res) => {
  const { user_id, ranchId } = req.query;

  // Validate that user_id and ranchId are available and numeric
  if (!user_id || !ranchId || isNaN(user_id) || isNaN(ranchId)) {
    return res.status(400).json({ error: "Invalid user_id or ranchId" });
  }

  
  try {
    const query = `
      SELECT objid, user_id, coordinates, dateadded
      FROM table_ranch
      WHERE user_id = ? AND objid = ?
      ORDER BY dateadded DESC
      LIMIT 1
    `;

    
    
    const results = await fetchDataFromDb(query, [user_id, ranchId]);

    if (results.length === 0) {
      return res.status(404).json({ error: "No shape data found for the given user_id and ranchId" });
    }

    // Send the most recently added shape data
    const shapeData = {
      objid: results[0].objid,
      user_id: results[0].user_id,
      coordinates: JSON.parse(results[0].coordinates), // Parse coordinates from JSON
      dateadded: results[0].dateadded,
    };

    res.status(200).json({ shapeData });

  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch shape data" });
  }
});

module.exports = router;
