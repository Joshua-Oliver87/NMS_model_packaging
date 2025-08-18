const express = require("express");
const router = express.Router();



// Haversine formula to calculate distance
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRadians = (degree) => (degree * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// API endpoint to get nearest weather stations
router.post("/api/nearestStations", async(req, res) => {
  const { lat, lng } = req.body; // Accept latitude and longitude from the request body

  if (!lat || !lng) {
    return res.status(400).json({ error: "Latitude and Longitude are required." });
  }

  // Query all weather stations
  const query = `
    SELECT 
      STATION_NAME, 
      STATION_LATDEG, 
      STATION_LNGDEG, 
      AIR_TEMP, 
      TSAMP 
    FROM view_active_stations
  `;

   try {
      const results = await fetchDataFromDb(query);
      // Calculate distances for each station
    const stationsWithDistances = results.map((station) => ({
      name: station.STATION_NAME,
      lat: parseFloat(station.STATION_LATDEG),
      lng: parseFloat(station.STATION_LNGDEG),
      temperature: station.AIR_TEMP || "N/A",
      timestamp: station.TSAMP || "N/A",
      distance: haversineDistance(
        lat,
        lng,
        parseFloat(station.STATION_LATDEG),
        parseFloat(station.STATION_LNGDEG)
      ),
    }));

    // Sort by distance and return the top 5 nearest stations
    const nearestStations = stationsWithDistances
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    res.json({ nearestStations });
    } catch (err) {
      console.error("Error fetching weather stations:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  

});

module.exports = router;
