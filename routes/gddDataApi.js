const express = require("express");
const { fetchDataFromDb, fetchDataFromForecastDb } = require("./dbConnection"); // Correct path to dbConnection
const unitMiddleware = require("./middleware/unitMiddleware");
const { convertUnits } = require("./utility");
const fs = require("fs");
const path = require("path");
const GddDataRouter = express.Router();

GddDataRouter.get(
  "/get-planting-settings",
  unitMiddleware,
  async (req, res) => {
    const { plantingId } = req.query;

    if (!plantingId) {
      return res.status(400).json({ error: "Missing plantingId" });
    }

    try {
      const query = `SELECT * FROM table_planting_settings WHERE planting_id=${plantingId}`;

      const result = await fetchDataFromDb(query);

      if (result.length === 0) {
        return res.status(404).json({ error: "Planting ID not found" });
      }
      result.map((data) => {
        if (data.name === "gddBaseTemp") {
          data.value = convertUnits.temperature(
            data.value,
            "C",
            req.unit
          ).value;
        }
      });
      res.json(result);
    } catch (error) {
      console.error("Error fetching base temperature:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

GddDataRouter.get("/fetchGDDData", async (req, res) => {
  const { stationId, baseTemp, startDate, endDate } = req.query;

  if (!stationId || !baseTemp || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const query = `
      WITH GDD_Calculation AS (
        SELECT 
          DATE(JULDATE) AS Date, 
          DOY AS Day_Of_Year, 
          ROUND(IF((MAX_AIR_TEMP + MIN_AIR_TEMP)/2 - ${baseTemp} <= 0, 0, (MAX_AIR_TEMP + MIN_AIR_TEMP)/2 - ${baseTemp}), 0) AS Daily_GDD
        FROM awndaily.station${stationId}daily
        WHERE JULDATE BETWEEN '${startDate}' AND '${endDate}'
      )
      SELECT 
        Date, 
        Day_Of_Year, 
        Daily_GDD, 
        SUM(Daily_GDD) OVER (ORDER BY Date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Cumulative_GDD
      FROM GDD_Calculation
      ORDER BY Date;
    `;

    console.log("Executing GDD Query:", query); // Debugging query execution
    const gddData = await fetchDataFromDb(query);

    res.json(gddData);
  } catch (error) {
    console.error("Error fetching GDD data:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Endpoint to fetch forecast GDD data
GddDataRouter.get("/forecastGDDData", async (req, res) => {
  let { unitId, baseTemp } = req.query;
  baseTemp = convertUnits.temperature(parseFloat(baseTemp), "C", req.unit).value;
  if (!unitId || !baseTemp) {
    return res.status(400).json({ error: "unitId and baseTemp are required" });
  }

  const query = `
    WITH GDD_Calculation AS (
      SELECT 
        DATE(TSTAMP) AS date,
        DAYOFYEAR(TSTAMP) AS day_of_year,
        ROUND(
          IF(
            ((MAX(AIR_TEMP) + MIN(AIR_TEMP)) / 2 - ${baseTemp}) <= 0,
            0,
            ((MAX(AIR_TEMP) + MIN(AIR_TEMP)) / 2 - ${baseTemp})
          ),
          0
        ) AS daily_gdd
      FROM forecast${unitId}
      WHERE DATE(TSTAMP) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(TSTAMP)
    )
    SELECT 
      date,
      day_of_year,
      daily_gdd,
      SUM(daily_gdd) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_gdd
    FROM GDD_Calculation
    ORDER BY date;
  `;

  try {
    const result = await fetchDataFromForecastDb(query);

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "No forecast GDD data found." });
    }

    /* const fs = require("fs");
    const path = require("path");
    const outputDir = path.resolve(__dirname, "../input_for_python_model");
    const outputFile = path.join(outputDir, "GDD_Forecast.csv");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const header = "date,day_of_year,daily_gdd,cumulative_gdd";
    const rows = result.map(
      (row) =>
        `${row.date},${row.day_of_year},${row.daily_gdd},${row.cumulative_gdd}`
    );
    const csvContent = [header, ...rows].join("\n");

    fs.writeFileSync(outputFile, csvContent); */

    res.status(200).json({
      message: "Forecast GDD data retrieved successfully",
      data: result,      
    });
  } catch (error) {
    console.error(" Forecast GDD SQL Error:", error); // Added error log
    return res
      .status(500)
      .json({ error: "Failed to fetch forecast GDD data." });
  }
});


module.exports = GddDataRouter;
