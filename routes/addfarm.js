const express = require("express");
const mysql = require("mysql2/promise"); // Use promise-based MySQL client
const bodyParser = require("body-parser");
const { fetchDataFromDb } = require("./dbConnection");
const { storeSoilInfo } = require("./utility");

// Initialize Express app
// const app = express();
// app.use(bodyParser.json());
const AddFarm = express.Router();

// Function to insert ranch and ranch settings
async function processAddRanch(req, res) {
  // console.log("req body - ",req.body);
  const { polygonCoordinates, ranchName, numberOfAcres, ranchWeatherStationList } = req.body;
  //console.log("polygonCoordinates", polygonCoordinates);
  if (!polygonCoordinates || !ranchName || !numberOfAcres) {
    return res.status(400).json({ error: "Missing required parameters" });
  }
  try {
    // Round the number of acres
    const acres = Math.round(numberOfAcres);

    // Insert ranch using stored procedure
    const [ranchResult] = await fetchDataFromDb("CALL sp_InsertRanch(?, ?, ?, ?);",
      [req.session.userObjid, ranchName, acres, polygonCoordinates]);

    const newObjid = ranchResult[0]?.[0]?.NewObjid; // Extract NewObjid from result
    if (!newObjid) {
      return res.status(500).json({ error: "Failed to insert ranch" });
    }


    // Insert ranch weather station settings if provided
    if (ranchWeatherStationList) {
      const [settingResult] = await fetchDataFromDb(
        "CALL sp_InsertRanchSetting(?, ?, ?);",
        [newObjid, "station_id", ranchWeatherStationList]
      );

      console.log(
        "New ranch station:",
        ranchWeatherStationList,
        settingResult[0]?.[0]?.NewSetting
      );
    } else {
      console.log("No station set?");
    }

    // Return success response
    return res.status(200).json({ message: "Ranch added successfully", ranchId: newObjid });
  } catch (error) {
    console.error("Error processing Add Ranch:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Define the route for adding ranches
AddFarm.post("/addRanch", processAddRanch);

// Define the /tablePlantingArea route
AddFarm.post("/tablePlantingArea", async (req, res) => {
  const { ranch_id, name, acres, coordinates } = req.body;

  console.log("Request Body:", req.body);

  // Validate required fields
  if (!ranch_id || !name || !acres || !coordinates) {
    console.error("Missing required fields:", { ranch_id, name, acres, coordinates });
    return res.status(400).json({ error: "Missing required fields" });
  }

  
  try {
    
    // Check if the ranch_id exists in the table_ranch
    const ranchQuery = "SELECT objid FROM table_ranch WHERE objid = ?";
    const ranchResult = await fetchDataFromDb(ranchQuery, [ranch_id]);

    if (ranchResult.length === 0) {
      console.error("Ranch ID not found in table_ranch:", ranch_id);
      return res.status(404).json({ error: `Ranch ID ${ranch_id} not found in table_ranch` });
    }

    // Insert data into the table_planting_area table
    const insertQuery =
      "INSERT INTO table_planting_area (ranch_id, name, acres, coordinates) VALUES (?, ?, ?, ?)";
    console.log("Executing Query:", insertQuery, "With Parameters:", [ranch_id, name, acres, coordinates]);

    await fetchDataFromDb(insertQuery, [ranch_id, name, acres, coordinates]);

    // python code with new ranch id

    const pythonMessage = await storeSoilInfo();
    console.log("Message from pyton script - ",pythonMessage);

    // Respond with success
    res.status(200).json({ message: "Data saved successfully to table_planting_area" });
  } catch (error) {
    console.error("Error saving to table_planting_area:", error);
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      // Foreign key violation
      return res.status(400).json({
        error: "Foreign key constraint failed. Invalid ranch_id.",
        details: error.message,
      });
    }
    return res.status(500).json({ error: "Failed to save data", details: error.message });
  } 
});

module.exports = AddFarm;

