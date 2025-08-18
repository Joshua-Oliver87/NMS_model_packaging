const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
require("dotenv").config();
const { fetchDataFromDb, fetchDataFromForecastDb } = require("./dbConnection");
const router = express.Router();
const fs = require("fs");

router.get("/", async (req, res) => {
  const pythonCmd = "python3";

  // Absolute path to the Python script
  const scriptPath = path.join(
    __dirname,
    "..",
    "NWS_Hourly_Forecast",
    "nws_hourly_forecast.py"
  );

  console.log(`Spawning Python process: ${pythonCmd} ${scriptPath}`);

  const pyProcess = spawn(pythonCmd, [scriptPath]);

  let stdoutData = "";
  let stderrData = "";

  pyProcess.stdout.on("data", (data) => {
    stdoutData += data.toString();
  });

  pyProcess.stderr.on("data", (data) => {
    stderrData += data.toString();
  });

  pyProcess.on("close", (code) => {
    console.log(` Python script exited with code ${code}`);
    if (code !== 0) {
      console.error(" Non-zero exit code from Python script");
      return res.status(500).json({
        message: "Python script failed",
        code,
        stderr: stderrData,
      });
    }

    console.log("Output:", stdoutData);
    res.status(200).json({
      message: "Forecast script executed successfully.",
      output: stdoutData,
      stderr: stderrData || null,
    });
  });

  pyProcess.on("error", (err) => {
    console.error(" Error starting Python process:", err);
    res.status(500).json({ error: err.message });
  });
});

router.post("/saveEtForecast", async (req, res) => {
  const { unitId, startDate, endDate } = req.body;

  if (!unitId || !startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "unitId, startDate, and endDate are required" });
  }

  if (!/^[0-9]+$/.test(unitId)) {
    return res.status(400).json({ error: "Invalid unitId format" });
  }

  console.log(
    " Generating Daily ETR Forecast CSV for:",
    unitId,
    startDate,
    endDate
  );

  const query = `
      SELECT 
        MIN(juldate) AS date,
        DAYOFYEAR(juldate) AS dayofyear,
        AVG(IF(etr <> 99999, etr, NULL)) AS avg_etr
      FROM awndaily.station${unitId}daily
      WHERE juldate BETWEEN '${startDate}' AND '${endDate}'
      GROUP BY dayofyear
      ORDER BY dayofyear
    `;

  try {
    const result = await fetchDataFromDb(query);

    if (!result || result.length === 0) {
      return res
        .status(404)
        .json({ error: "No ETR data found for the given period." });
    }

    // Define output path
    const outputDir = path.resolve(__dirname, "../input_for_python_model");
    const outputPath = path.join(outputDir, "ET_Forecast.csv");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Build header and CSV rows
    const header = "unitId,date,dayOfYear,avgEtr\n";
    const rows = result
      .map((row) => `${unitId},${row.date},${row.dayofyear},${row.avg_etr}`)
      .join("\n");

    fs.writeFileSync(outputPath, header + rows);

    console.log(` ET Forecast CSV saved at: ${outputPath}`);

    return res.status(200).json({
      message: "Daily ETR Forecast saved successfully",
      csvPath: outputPath,
      data: result,
    });
  } catch (error) {
    console.error(" Error saving daily ET Forecast:", error);
    return res.status(500).json({ error: "Failed to save daily ET Forecast" });
  }
});

module.exports = router;
