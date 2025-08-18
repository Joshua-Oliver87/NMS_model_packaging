const express = require("express");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { stringify } = require("csv-stringify/sync");
const { fetchDataFromDb, fetchDataFromForecastDb } = require("./dbConnection");
const { fetchDailyWeatherData } = require("./utility");

const WeatherDaily = express.Router();

/*
WeatherDaily.post("/injectForecastPrecip", async (req, res) => {
  const forecastPath = path.join(__dirname, "../input_for_python_model/forecast_weather.csv");
  const precipPath = path.join(__dirname, "../input_for_python_model/daily_precipitation_forecasts.csv");
  const etrPath = path.join(__dirname, "../input_for_python_model/ET_Forecast.csv");

  try {
    const forecastRaw = fs.readFileSync(forecastPath, "utf-8");
    const forecastData = parse(forecastRaw, { columns: true })[0]; // single-row format

    // Read and parse precipitation data
    const precipRaw = fs.readFileSync(precipPath, "utf-8");
    const precipList = parse(precipRaw, { columns: true });

    const precipMap = {};
    for (const row of precipList) {
      precipMap[row.date] = row.PRECIP;
    }

    // Read and parse ETr (evapotranspiration) data
    const etrRaw = fs.readFileSync(etrPath, "utf-8");
    const etrList = parse(etrRaw, { columns: true });

    const etrMap = {};
    for (const row of etrList) {
      const formattedDate = new Date(row.date).toISOString().split("T")[0]; // Normalize to 'YYYY-MM-DD'
      etrMap[formattedDate] = row.avgEtr;
    }

    // Build new forecast row with precip and evapotranspiration
    const newRow = {};
    const newHeaders = [];

    for (const [key, value] of Object.entries(forecastData)) {
      newHeaders.push(key);
      newRow[key] = value;

      const match = key.match(/^(weather_\d+)_date$/);
      if (match) {
        const base = match[1];
        const date = new Date(value).toISOString().split("T")[0];

        // Inject precipitation
        const precipKey = `${base}_precipitation`;
        newHeaders.push(precipKey);
        newRow[precipKey] = precipMap[date] || "";

        // Inject evapotranspiration
        const etrKey = `${base}_evapotranspiration`;
        newHeaders.push(etrKey);
        newRow[etrKey] = etrMap[date] || "";
      }
    }

    const updatedCsv = stringify([newHeaders, Object.values(newRow)]);
    fs.writeFileSync(forecastPath, updatedCsv);

    return res.status(200).json({
      message: "Precipitation and evapotranspiration values injected successfully into forecast_weather.csv",
      totalForecastColumns: Object.keys(forecastData).length,
      precipDatesMatched: Object.keys(newRow).filter(k => k.includes("precipitation")).length,
      etrDatesMatched: Object.keys(newRow).filter(k => k.includes("evapotranspiration")).length,
    });
  } catch (err) {
    console.error("Error injecting data:", err);
    return res.status(500).json({ error: "Failed to inject precipitation and evapotranspiration data." });
  }
});

*/

// Endpoint to fetch daily weather data
WeatherDaily.get(`/dailyWeatherData`, async (req, res) => {
  const { unitId, startDate, endDate } = req.query;

  console.log(unitId, startDate, endDate);
  if (!unitId || !startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "unitId, startDate and endDate are required" });
  }

  try {
    const weatherData = await fetchDailyWeatherData(unitId, startDate, endDate);
    return res.status(200).json(weatherData);
  } catch (err) {
    console.error("Error fetching daily weather data:", err);
    return res.status(500).json({ error: "Error fetching daily weather data" });
  }
});

// POST: Fetch, Format, and Save Weather Data as CSV
WeatherDaily.post("/fetchAndSaveWeatherData", async (req, res) => {
  const { unitId, objId } = req.body;

  if (!unitId || !objId) {
    return res.status(400).json({ error: "unitId and objId are required" });
  }

  if (!/^[0-9]+$/.test(unitId)) {
    return res.status(400).json({ error: "Invalid unitId format" });
  }

  console.log("Processing Weather Data for:", unitId, objId);

  // The new query with aggregates
  const query = `
    
SELECT 
   juldate AS juldate,
   DAYOFYEAR(juldate) AS dayofyear,
   DAYOFMONTH(juldate) AS day_of_month,
   MONTH(juldate) AS month,
   AVG(IF(sum_solar_rad <> 99999, sum_solar_rad, NULL)) AS sum_solar_rad,
   MAX(IF(max_air_temp <> 99999, max_air_temp, NULL)) AS max_air_temp, 
   MIN(IF(min_air_temp <> 99999, min_air_temp, NULL)) AS min_air_temp,
   MAX(IF(max_humidity <> 99999, max_humidity, NULL)) AS max_humidity,
   MIN(IF(min_humidity <> 99999, min_humidity, NULL)) AS min_humidity,
   AVG(IF(avg_wind_sp <> 99999, avg_wind_sp, NULL)) AS avg_wind_speed,
   SUM(IF(sum_precip <> 99999, sum_precip, NULL)) AS sum_precip,
   AVG(IF(etr <> 99999, etr, NULL)) AS etr
    FROM awndaily.station${unitId}daily
   WHERE juldate >= (CURRENT_DATE() - INTERVAL 2 YEAR)
GROUP BY day_of_month, month
ORDER by DAYOFYEAR, day_of_month;
  `;

  try {
    const weatherData = await fetchDataFromDb(query);
    if (!weatherData || weatherData.length === 0) {
      return res
        .status(404)
        .json({ error: "No weather data found for the given unitId." });
    }

    // Define CSV output directory and file paths.
    const outputDir = path.resolve(__dirname, "../input_for_python_model");
    const csvPath = path.join(outputDir, "input_data_for_model.csv");
    const testerPath = path.join(outputDir, "weather.csv");

    // Create the output directory if it does not exist.
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // We want to produce a CSV file with two rows:
    //   1. A header row that concatenates header names for each day's weather entry.
    //   2. A data row that concatenates the values for each day.

    // Create arrays to hold the header names and the data values.
    const headerRow = [];
    const dataRow = [];

    weatherData.forEach((row, index) => {
      const dayIndex = index + 1;
      // Append header names for this day's data.
      headerRow.push(
        `weather_${dayIndex}_date`,
        `weather_${dayIndex}_doy`,
        `weather_${dayIndex}_radiation`,
        `weather_${dayIndex}_tmax`,
        `weather_${dayIndex}_tmin`,
        `weather_${dayIndex}_rhmax`,
        `weather_${dayIndex}_rhmin`,
        `weather_${dayIndex}_wind_speed`,
        `weather_${dayIndex}_precipitation`,
        `weather_${dayIndex}_evapotranspiration`
      );

      // Append the corresponding values in the same order.
      dataRow.push(
        row.juldate,
        row.dayofyear,
        row.sum_solar_rad,
        row.max_air_temp,
        row.min_air_temp,
        row.max_humidity,
        row.min_humidity,
        row.avg_wind_speed,
        row.sum_precip,
        row.etr
      );
    });

    // Combine the header and data rows into a single CSV string.
    const csvContent = headerRow.join(",") + "\n" + dataRow.join(",");

    // Write the CSV content to both files.
    fs.writeFileSync(csvPath, csvContent);
    fs.writeFileSync(testerPath, csvContent);

    console.log(`Weather CSV successfully written at: ${csvPath}`);

    return res.status(200).json({
      message:
        "Weather data CSV successfully created and copied to tester.csv!",
      csvPath,
      testerPath,
      csvContent,
    });
  } catch (error) {
    console.error("Error processing weather data:", error);
    if (
      error.message.includes("relation") &&
      error.message.includes("does not exist")
    ) {
      return res
        .status(404)
        .json({ error: `Table for unitId '${unitId}' not found.` });
    }
    return res.status(500).json({ error: "Error processing weather data" });
  }
});

// Fetch forecast daily summary for a station (unitId)

WeatherDaily.get("/forecastDailySummary", async (req, res) => {
  const { unitId } = req.query;

  console.log("API hit: /forecastDailySummary");
  console.log("Received unitId:", unitId);

  if (!unitId || !/^\d+$/.test(unitId)) {
    console.error("Invalid or missing unitId");
    return res.status(400).json({ error: "Valid numeric unitId is required." });
  }

  const tableName = `forecast${unitId}`;
  const query = `
    SELECT 
      UNIT_ID,
      DATE(TSTAMP) AS date,
      DAYOFYEAR(TSTAMP) AS doy,
      MAX(AIR_TEMP) AS tmax,
      MIN(AIR_TEMP) AS tmin,
      MAX(REL_HUMIDITY) AS rhmax,
      MIN(REL_HUMIDITY) AS rhmin,
      SUM(SOLAR_RAD) AS radiation,
      SUM(WIND_SPEED) AS wind_speed
    FROM ${tableName}
    WHERE TSTAMP BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
    GROUP BY DATE(TSTAMP), UNIT_ID
    ORDER BY DATE(TSTAMP);
  `;

  try {
    const results = await fetchDataFromForecastDb(query);
    console.log(" Query success. Rows returned:", results?.length);

    if (!results || results.length === 0) {
      return res.status(404).json({
        error: "No forecast data found for this unitId.",
      });
    }

    // Prepare precip + ETr maps
    const forecastOutputDir = path.resolve(__dirname, "../input_for_python_model");
    const precipPath = path.join(forecastOutputDir, "daily_precipitation_forecasts.csv");
    const etrPath = path.join(forecastOutputDir, "ET_Forecast.csv");

    const precipRaw = fs.readFileSync(precipPath, "utf-8");
    const precipList = parse(precipRaw, { columns: true });
    const precipMap = {};
    for (const row of precipList) {
      precipMap[row.date] = row.PRECIP;
    }

    const etrRaw = fs.readFileSync(etrPath, "utf-8");
    const etrList = parse(etrRaw, { columns: true });
    const etrMap = {};
    for (const row of etrList) {
      try {
        const parsed = new Date(Date.parse(row.date));
        const iso = parsed.toISOString().split("T")[0]; // Normalize to 'YYYY-MM-DD'
        console.log(`Parsed ET row: ${row.date} → ${iso} → ${row.avgEtr}`);
        etrMap[iso] = row.avgEtr;
      } catch (err) {
        console.warn("Could not parse ETr date:", row.date);
      }
    }
    

    // Build CSV headers and values
    const headerRow = [];
    const dataRow = [];

    results.forEach((row, index) => {
      const i = index + 1;
      const date = new Date(row.date).toISOString().split("T")[0];

      headerRow.push(
        `weather_${i}_date`,
        `weather_${i}_doy`,
        `weather_${i}_radiation`,
        `weather_${i}_tmax`,
        `weather_${i}_tmin`,
        `weather_${i}_rhmax`,
        `weather_${i}_rhmin`,
        `weather_${i}_wind_speed`,
        `weather_${i}_precipitation`,
        `weather_${i}_evapotranspiration`
      );

      dataRow.push(
        date,
        row.doy,
        row.radiation,
        row.tmax,
        row.tmin,
        row.rhmax,
        row.rhmin,
        row.wind_speed,
        precipMap[date] || "",
        etrMap[date] || ""
      );
    });

    const csvContent = headerRow.join(",") + "\n" + dataRow.join(",");
    const csvPath = path.join(forecastOutputDir, "forecast_weather.csv");

    if (!fs.existsSync(forecastOutputDir)) {
      fs.mkdirSync(forecastOutputDir, { recursive: true });
    }

    fs.writeFileSync(csvPath, csvContent);
    console.log(`forecast_weather.csv written with precip + etr at: ${csvPath}`);

    return res.status(200).json({
      message: "Forecast weather data with precipitation and ETr written successfully.",
      csvPath,
      csvContent,
      rowsReturned: results.length,
    });
  } catch (err) {
    console.error("Error in /forecastDailySummary:", err); 
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = WeatherDaily;
