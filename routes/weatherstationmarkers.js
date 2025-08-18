const express = require("express");
const { fetchDataFromDb } = require("./dbConnection");
const { convertUnits } = require("./utility");
const unitMiddleware = require("./middleware/unitMiddleware");
const router = express.Router();

// API endpoint for fetching weather station data
router.get("/activeWeatherStations", unitMiddleware, async (req, res) => {
  try {    
    // Query to fetch metadata from view_active_stations    
    const metadataQuery = `
      SELECT 
        UNIT_ID, 
        STATION_NAME, 
        STATION_LATDEG, 
        STATION_LNGDEG, 
        STATION_ELEVATION, 
        STATE 
      FROM view_active_stations
      WHERE STATION_VISIBILITY = "public"
    `;
    const stations = await fetchDataFromDb(metadataQuery);    
    // Fetch temperature and timestamp for each station
    const stationData = await Promise.all(
      stations.map(async (station) => {
        const tableName = `station${station.UNIT_ID}`;
        const temperatureQuery = `
          SELECT *
          FROM ${tableName} 
          ORDER BY TSTAMP DESC 
          LIMIT 1
        `;
        try {
          // console.log(`Executing query for station ${station.UNIT_ID}:`, temperatureQuery);

          let temperatureResults = await fetchDataFromDb(temperatureQuery);
          // console.log("temperatureResults", temperatureResults);          
          if(temperatureResults && temperatureResults.length > 0){
            const tempData = temperatureResults[0] || {};
            // console.log("before", tempData.AIR_TEMP);
          return {
            ...station,            
            STATION_LATDEG: station.STATION_LATDEG || null,
            STATION_LNGDEG: station.STATION_LNGDEG || null,
            STATION_NAME: station.STATION_NAME || null,
            AIR_TEMP: convertUnits.temperature(tempData.AIR_TEMP, "°F", req.unit).value || null,
            TSAMP: tempData.TSAMP || null,
            SOIL_TEMP_8_IN: convertUnits.temperature(tempData.SOIL_TEMP_8_IN, "°F", req.unit).value || null,
            REL_HUMIDITY: tempData.REL_HUMIDITY || null,
            SOIL_MOIS_8_IN: tempData.SOIL_MOIS_8_IN || null,
            WIND_SPEED: convertUnits.speed(tempData.WIND_SPEED, "mph", req.unit).value || null,
            WIND_SPEED_MAX: tempData.WIND_SPEED_MAX || null,
            SOIL_TEMP_2_IN: convertUnits.temperature(tempData.SOIL_TEMP_2_IN, "°F", req.unit).value || null,
            AIR_PRESSURE: tempData.AIR_PRESSURE || null,
            PRECIP: convertUnits.length(tempData.PRECIP, "in", req.unit).value,
            PRECIP1: tempData.PRECIP || null,
            SOLAR_RAD: tempData.SOLAR_RAD || null,

          };
        }
        } catch (err) {
          console.error(`Error fetching temperature for station ${station.UNIT_ID}:`, err);
          return {
            ...station,
            AIR_TEMP: null,
            TSAMP: null,
          };
        }
      })
    );

    res.json({ stations: stationData });
  } catch (err) {
    console.error("Error fetching station data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// Route to save the selected weather station for a specific block (by planting_area_id)
router.post("/saveSelectedWeatherStation", async (req, res) => {
  const { selectedStation, planting_area_id } = req.body;

  if (!selectedStation || !planting_area_id) {
    return res.status(400).json({ error: "Missing selectedStation or planting_area_id in request body" });
  }

  try {
    const insertQuery = `
      INSERT INTO table_planting_area_settings (planting_area_id, name, value, dateadded)
      VALUES (?, 'selectedstation', ?, NOW())
      ON DUPLICATE KEY UPDATE value = VALUES(value), dateadded = NOW()
    `;

    await fetchDataFromDb(insertQuery, [planting_area_id, selectedStation]);

    res.status(200).json({ message: "Selected weather station saved successfully" });
  } catch (error) {
    console.error("Error saving selected weather station:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
