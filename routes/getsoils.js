const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const os = require("os"); //  Import os module

const { fetchDataFromDb } = require("./dbConnection");


router.post("/fetch_soil_data", async (req, res) => {
  const { wktCoordinates, objId } = req.body;

  if (!wktCoordinates && !objId) {
    return res.status(400).json({ message: "Either wktCoordinates or objId is required." });
  }

  try {
    let soilData = [];

    const scriptPath = path.join(__dirname, "fetch_soil_data.py");

    //  Fetch soil data from Python script if wktCoordinates is provided
    if (wktCoordinates) {
      console.log("🔹 Fetching soil data from Python script...");
      const pythonCommand = os.platform() === "win32" ? "python" : "python3";

      const pythonProcess = spawn(pythonCommand, [scriptPath]);

      let scriptOutput = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        scriptOutput += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
        console.error("Python script error:", data.toString());
      });

      await new Promise((resolve, reject) => {
        pythonProcess.on("close", (code) => {
          if (code !== 0) {
            console.error(`Python script exited with code ${code}`);
            console.error(`Error output: ${errorOutput}`);
            return reject("Failed to fetch soil data from Python script.");
          }

          try {
            soilData = JSON.parse(scriptOutput);
            resolve();
          } catch (error) {
            console.error("Error parsing soil data:", error.message);
            console.error("Script output:", scriptOutput);
            return reject("Error processing soil data from Python.");
          }
        });
      });
    }

    //  Fetch soil data from database if objId is provided
    if (objId && !wktCoordinates) {
      console.log("Fetching stored soil data from database...");
      const query = `SELECT value FROM table_planting_area_settings WHERE planting_area_id = ?`;
      const results = await fetchDataFromDb(query, [objId]);

      if (!results.length) {
        return res.status(404).json({ message: "No soil data found for the given objId." });
      }

      soilData = JSON.parse(results[0].value);
    }

    if (!soilData.length) {
      return res.status(404).json({ message: "No soil data available." });
    }

    //  Define CSV Output Path
    const outputDir = path.resolve(__dirname, "../input_for_python_model");
    const csvPath = path.join(outputDir, `soildata.csv`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    //  Generate CSV Headers & Values
    let numberOfHorizons = soilData.length;
    let csvHeaders = ["number_of_horizons"];
    let csvValues = [numberOfHorizons];

    soilData.forEach((row, index) => {
      let layerNumber = index + 1;
      csvHeaders.push(
        `layer_${layerNumber}_horizon_thickness`,
        `layer_${layerNumber}_percent_clay`,
        `layer_${layerNumber}_percent_silt`,
        `layer_${layerNumber}_percent_sand`,
        `layer_${layerNumber}_fc_water_content`,
        `layer_${layerNumber}_pwp_water_content`,
        `layer_${layerNumber}_organic_matter_percentage`
      );

      csvValues.push(
        row["Thickness (m)"],
        row["Clay (%)"],
        row["Silt (%)"],
        row["Sand (%)"],
        row["Field Capacity Water Content (m/m)"],
        row["Permanent Wilting Point Water Content (m/m)"],
        row["Soil Organic Matter (%)"]
      );
    });

    //  Write CSV File (Overwrite if exists)
    const csvContent = `${csvHeaders.join(",")}\n${csvValues.join(",")}`;
    fs.writeFileSync(csvPath, csvContent);

    console.log(` CSV successfully written at: ${csvPath}`);

    return res.status(200).json({
      message: "Soil data CSV successfully created!",
      csvPath: csvPath,
      csvContent: csvContent,
    });

  } catch (error) {
    console.error("Error processing soil data:", error);
    return res.status(500).json({ message: "Error processing soil data." });
  }
});

module.exports = router;
