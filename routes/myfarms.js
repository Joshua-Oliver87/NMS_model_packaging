const express = require("express");
const { fetchDataFromDb, executeQuery } = require("./dbConnection");
const { spawn } = require("child_process");
const { storeSoilInfo } = require("./utility");
const router = express.Router();

// Route to fetch farm names based on logged-in user's objid
router.get("/farms", async (req, res) => {
  const objid = req.query.user_id; // objid of the logged-in user

  if (!objid) {
    return res.status(400).json({ error: "objid is required" });
  }

  
  try {
    
    const query = `
      SELECT tr.name, tr.objid, tr.coordinates, tr.acres
      FROM table_ranch tr
      INNER JOIN users u ON u.objid = tr.user_id
      WHERE u.objid = ? AND tr.status=1
    `;
    const results = await fetchDataFromDb(query, [objid]);

    if (results.length === 0) {
      return res.status(404).json({ error: "No farms found for the given objid" });
    }
    res.status(200).json({
      farms: results.map((row) => ({ name: row.name, objid: row.objid, coordinates: JSON.parse(row.coordinates), acres: row.acres})),
    });
  } catch (err) {
    console.error("Error fetching farm names:", err.message);
    res.status(500).json({ error: "Database query error", details: err.message });
    
  } 
});

// Route to update Farm name
router.post("/update-farm-name", async (req, res) => {
  console.log("🔹 Received GET /api/update-farm-name request");
  console.log("🔹 Request Body:", req.body);

  const { objid, farmName } = req.body;
  if (!objid || !farmName) {
    return res.status(400).json({ error: "objid and farmName are required" });
  }

  try {
    console.log("🛠️ Running update query for:", objid, farmName);
    const query = `UPDATE table_ranch SET name = ? WHERE objid = ?`;
    const params = [farmName, objid];

    const result = await fetchDataFromDb(query, params);
    console.log(" Query Result:", result);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No farms updated. Check input data." });
    }

    res.status(200).json({ message: "Farms status updated successfully" });
  } catch (err) {
    console.error(" Error updating farms:", err.message);
    res.status(500).json({ error: "Database query error", details: err.message });
  }
});

// Route to fetch farm details by objid
router.get("/getFarm/:objid", async (req, res) => {
  const { objid } = req.params;

  if (!objid) {
    return res.status(400).json({ error: "objid is required" });
  }


  try {
    
    const query = `
      SELECT objid, name, acres, coordinates
      FROM table_ranch 
      WHERE objid = ? AND STATUS=1
    `;
    const results = await fetchDataFromDb(query, [objid]);

    if (results.length === 0) {
      return res.status(404).json({ error: "No farm found with the given objid" });
    }

    res.status(200).json({ farm: results[0] });
  } catch (err) {
    console.error("Error fetching farm details:", err.message);
    res.status(500).json({ error: "Database query error", details: err.message });
  } 
});

// Route to delete (deactivate) selected farms
router.delete("/deleteFarms", async (req, res) => {
  console.log(" Received DELETE /api/deleteFarms request");
  console.log(" Request Body:", req.body);

  const { objid, farms } = req.body;
  if (!objid || !farms || farms.length === 0) {
    return res.status(400).json({ error: "objid and farms are required" });
  }
  try {
    const placeholders = farms.map(() => "?").join(", "); // Generate placeholders for IN clause
    const query = `
      UPDATE table_ranch
      SET status = -1
      WHERE objid = ? AND name IN (${placeholders})
    `;
    
    const params = [objid, ...farms];
    const result = await fetchDataFromDb(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No farms updated. Check the input data." });
    }

    res.status(200).json({ message: "Farms status updated successfully" });
  } catch (err) {
    console.error("Error updating farms status:", err.message);
    res.status(500).json({ error: "Database query error", details: err.message });
  }
});

router.delete("/deleteBlocks", async (req, res) => {
  const { objid } = req.body;

  if (!objid) {
    return res.status(400).json({ error: "objid is required" });
  }

  try {
    const query = `
      UPDATE table_planting_area
      SET status = -1
      WHERE objid = ?
    `;

    const params = [objid];
    const result = await fetchDataFromDb(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No blocks updated. Check the input data." });
    }

    res.status(200).json({ message: "Blocks status updated successfully" });
  } catch (err) {
    console.error("Error updating block status:", err.message);
    res.status(500).json({ error: "Database query error", details: err.message });
  }
});

// Route to fetch public active stations
router.get("/activeStations", async (req, res) => {
  
  try {
    
    const query = `
      SELECT * 
      FROM view_active_stations 
      WHERE STATION_VISIBILITY = "public"
    `;
    const results = await fetchDataFromDb(query);
    console.log("results are",results[0]);
    if (results.length === 0) {
      return res.status(404).json({ error: "No public active stations found" });
    }

    res.status(200).json({ stations: results });
  } catch (err) {
    console.error("Error fetching active stations:", err.message);
    res.status(500).json({ error: "Database query error", details: err.message });
  } 
});

// Route to insert a new farm record
router.post("/addfarms", async (req, res) => {
  const { user_id, name, acres, coordinates } = req.body;

  if (!user_id || !name || !acres || !coordinates) {
    return res.status(400).json({
      error: "Missing required fields: user_id, name, acres, coordinates",
    });
  }

 
  try {
    
    const insertQuery = `
      INSERT INTO table_ranch (user_id, name, acres, coordinates)
      VALUES (?, ?, ?, ?)
    `;
    const result = await executeQuery(insertQuery, [user_id, name, acres, coordinates]);
    console.log("addFarms result", result);
    if (result.affectedRows === 1) {      
        return res.status(201).json({
          message: "Farm created successfully",
          ranchId: result.objid,
        });      
    }

    res.status(500).json({ error: "Unexpected database behavior" });
  } catch (err) {
    console.error("Error inserting farm:", err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  } 
});

// Route to insert a new block record
router.post("/addBlock", async (req, res) => {
  const { name, acres, coordinates, ranch_id } = req.body;

  if (!ranch_id || !name || !acres || !coordinates) {
    return res.status(400).json({
      error: "Missing required fields: ranch_id, name, acres, coordinates",
    });
  }
  
  try {
    
    const query = `
      INSERT INTO table_planting_area (name, acres, coordinates, ranch_id)
      VALUES (?, ?, ?, ?)
    `;
    const result = await fetchDataFromDb(query, [name, acres, coordinates, ranch_id]);

    // python code with new ranch id
    console.log("addBlock result", result);
    const pythonMessage = await storeSoilInfo();
    console.log(pythonMessage);

    if (result.affectedRows === 1) {
      return res.status(201).json({ message: "Block created successfully" });
    }

    res.status(500).json({ error: "Unexpected database behavior" });
  } catch (err) {
    console.error("Error inserting block:", err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  } 
});

module.exports = router;


