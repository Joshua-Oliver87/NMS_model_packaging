const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const unitMiddleware = require("./middleware/unitMiddleware");
const { json } = require("body-parser");
const { convertUnits } = require("./utility");

const IrrigationPy = express.Router();
// File Paths
const inputDir = path.join(__dirname, "../input_for_python_model/");
const csvFilePath = path.join(inputDir, "input_data_for_model.csv"); // Weather data is the base  
const irrigationCsvFilePath = path.join(inputDir, "irrigation_selections.csv");
const futureIrrigationCsvFilePath = path.join(inputDir, "future_irrigation_dates.csv");



const csvFiles = [
  "cropdata.csv",
  "farm_and_field_data.csv",
  "fertilizer_input_data.csv",
  "irrigation_selections.csv",
  "soildata.csv",
  "water_source_settings.csv",
  "auto_irrigation_params.csv",
  "initial_soil_conditions.csv",
].map(file => path.join(inputDir, file)); // Excluding input_data_for_model.csv (it’s the base)

// Hardcoded Headers & Values
const hardcodedHeaders = [
    "first_doy",
    "number_of_auto_irrigation_entries",
    "fertilization_1_application_method"
  ];
   
   
  const hardcodedValues = [
    "1",
    "2",
    "1",
  ];
  
  

const convertDateToDOY = (dateString) => {
  const date = new Date(dateString);
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

const numberOfCrops = 1;
const tempCsv = path.join(inputDir, "tester.csv");

IrrigationPy.post("/append-csvs", async (req, res) => {

    const useForecast = req.body.useForecast === true;
    const weatherCsv = path.join(inputDir, useForecast ? "forecast_weather.csv" : "weather.csv");
    console.log("Appending CSV data into tester.csv...");
  
    try {
      if (!fs.existsSync(weatherCsv)) {
          console.error(` Missing weather data file: ${weatherCsv}`);
          return res.status(500).json({ message: "Missing weather data file." });
      }

      const weatherData = fs.readFileSync(weatherCsv, "utf8").trim().split("\n");
      if (weatherData.length < 2) {
          console.error(" Weather data file has invalid format.");
          return res.status(500).json({ message: "Invalid weather data format." });
      }
  
      // Step 2: Extract headers and values from weather data
      let mergedHeaders = weatherData[0].split(",").map(h => h.trim());
      let mergedValues = weatherData[1].split(",").map(v => v.trim());
  
      // Step 3: Prepend number_of_crops to the beginning
      mergedHeaders.unshift("number_of_crops");
      mergedValues.unshift(numberOfCrops);
  
      // Step 4: Append all additional CSV files (crop, soil, etc.)
      csvFiles.forEach((file) => {
        if (fs.existsSync(file)) {
          const fileContent = fs.readFileSync(file, "utf8").trim().split("\n");
          if (fileContent.length >= 2) {
            const fileHeaders = fileContent[0].split(",").map(h => h.trim());
            const fileValues = fileContent[1].split(",").map(v => v.trim());
  
            fileHeaders.forEach((header, index) => {
              let value = fileValues[index] || "";
  
              if (!mergedHeaders.includes(header)) {
                mergedHeaders.push(header);
                mergedValues.push(value);
              } else {
                const existingIndex = mergedHeaders.indexOf(header);
                mergedValues[existingIndex] = value;
              }
            });
  
            console.log(` Appended ${path.basename(file)} into tester.csv`);
          } else {
            console.warn(` Skipping empty or invalid CSV: ${path.basename(file)}`);
          }
        } else {
          console.warn(` Missing CSV file: ${path.basename(file)}`);
        }
      });
  
      // Step 5: Append hardcoded headers and values
      hardcodedHeaders.forEach((header, index) => {
        const value = hardcodedValues[index] !== undefined ? hardcodedValues[index] : "";
  
        if (!mergedHeaders.includes(header)) {
          mergedHeaders.push(header);
          mergedValues.push(value);
        } else {
          const existingIndex = mergedHeaders.indexOf(header);
          mergedValues[existingIndex] = value;
        }
      });
  
      // Step 6: Ensure header/value length consistency
      if (mergedValues.length < mergedHeaders.length) {
        while (mergedValues.length < mergedHeaders.length) mergedValues.push("");
      } else if (mergedValues.length > mergedHeaders.length) {
        console.warn(" Extra values beyond headers. Truncating...");
        mergedValues = mergedValues.slice(0, mergedHeaders.length);
      }
  
      // Step 7: Write to tester.csv
      const csvContent = `${mergedHeaders.join(",")}\n${mergedValues.join(",")}`;
      fs.writeFileSync(tempCsv, csvContent);
      console.log(` tester.csv successfully updated with full model input.`);
  
      return res.status(200).json({
        message: "CSV files merged successfully into tester.csv.",
        csvFilePath: tempCsv,
      });
    } catch (error) {
      console.error(" ERROR - Appending CSV files:", error.message);
      return res.status(500).json({ message: "Error appending CSV files.", error: error.message });
    }
  });
  
/*
If the user enters only a past date and no depth, the event is stored in future_irrigation_dates.csv temporarily, until that date passes.
If the user enters a past date and later provides a net irrigation depth, the event moves to irrigation_selections.csv.
Future irrigations are stored correctly in future_irrigation_dates.csv, whether or not the depth is provided.
*/
IrrigationPy.post("/save-irrigation-params", async (req, res) => {
    let { irrigationDOY, irrigationMethod } = req.body;

    if (!irrigationDOY || !irrigationMethod) {
        return res.status(400).json({ message: "Irrigation DOY and method are required." });
    }

    try {
        let futureIrrigationDOYs = [];

        // Read future irrigation selections CSV
        if (fs.existsSync(futureIrrigationCsvFilePath)) {
            const futureData = fs.readFileSync(futureIrrigationCsvFilePath, "utf8").trim().split("\n");
            if (futureData.length > 1) {
                const futureHeaders = futureData[0].split(",");
                const futureValues = futureData[1].split(",");

                futureHeaders.forEach((header, index) => {
                    if (header.includes("_doy")) {
                        futureIrrigationDOYs.push(Number(futureValues[index]));
                    }
                });
            }
        }

        // Store ALL irrigation events in `future_irrigation_dates.csv`
        futureIrrigationDOYs.push(Number(irrigationDOY));

        // Sort DOYs in ascending order
        futureIrrigationDOYs.sort((a, b) => a - b);

        // Format CSV headers correctly (no irrigation depth)
        const futureHeaders = futureIrrigationDOYs.map((_, i) => `irrigation_${i + 1}_doy`);
        const futureValues = futureIrrigationDOYs;

        fs.writeFileSync(futureIrrigationCsvFilePath, `${futureHeaders.join(",")}\n${futureValues.join(",")}`);
        console.log(` Future irrigation updated: ${futureIrrigationCsvFilePath}`);

        //  Save irrigation method to `irrigation_selections.csv` (overwrite each time)
        let irrigationDOYs = [];
        let irrigationDepths = [];

        if (fs.existsSync(irrigationCsvFilePath)) {
            const csvData = fs.readFileSync(irrigationCsvFilePath, "utf8").trim().split("\n");
            if (csvData.length > 1) {
                const headers = csvData[0].split(",");
                const values = csvData[1].split(",");

                headers.forEach((header, index) => {
                    if (header.includes("_doy")) {
                        irrigationDOYs.push(Number(values[index]));
                    } else if (header.includes("_net")) {
                        irrigationDepths.push(Number(values[index]));
                    }
                });
            }
        }

        //  Save updated past irrigation selections with irrigation method
        const pastHeaders = [
            "irrigation_method",
            ...irrigationDOYs.map((_, i) => `irrigation_${i + 1}_doy`),
            ...irrigationDepths.map((_, i) => `irrigation_${i + 1}_net`)
        ];
        const pastValues = [irrigationMethod, ...irrigationDOYs, ...irrigationDepths];

        fs.writeFileSync(irrigationCsvFilePath, `${pastHeaders.join(",")}\n${pastValues.join(",")}`);
        console.log(` Irrigation method updated in ${irrigationCsvFilePath}`);

        return res.status(200).json({
            message: "Irrigation parameters saved successfully.",
            irrigationData: { irrigationDOY, irrigationMethod },
        });

    } catch (error) {
        console.error(" ERROR - Saving irrigation parameters:", error.message);
        return res.status(500).json({ message: "Error saving irrigation parameters.", error: error.message });
    }
});



IrrigationPy.post("/update-irrigation-params", async (req, res) => {
    let { irrigationDOY, irrigationDepth } = req.body;

    if (!irrigationDOY || irrigationDepth === undefined) {
        return res.status(400).json({ message: "Irrigation DOY and depth are required." });
    }

    try {
        //  Read existing data from `irrigation_selections.csv`
        let irrigationMethod = "";
        let irrigationDOYs = [];
        let irrigationDepths = [];

        if (fs.existsSync(irrigationCsvFilePath)) {
            const csvData = fs.readFileSync(irrigationCsvFilePath, "utf8").trim().split("\n");
            if (csvData.length > 1) {
                const headers = csvData[0].split(",");
                const values = csvData[1].split(",");

                // Extract irrigation method
                irrigationMethod = values[0]; // Assuming irrigation_method is the first column

                // Extract existing DOYs and depths
                headers.forEach((header, index) => {
                    if (header.includes("_doy")) {
                        irrigationDOYs.push(Number(values[index]));
                    } else if (header.includes("_net")) {
                        irrigationDepths.push(Number(values[index]));
                    }
                });
            }
        }

        //  Append new irrigation data
        irrigationDOYs.push(irrigationDOY);
        irrigationDepths.push(irrigationDepth);

        //  Prepare updated headers and values
        const pastHeaders = [
            "irrigation_method",
            ...irrigationDOYs.map((_, i) => `irrigation_${i + 1}_doy`),
            ...irrigationDepths.map((_, i) => `irrigation_${i + 1}_net`)
        ];
        const pastValues = [
            irrigationMethod, // Preserve the irrigation method
            ...irrigationDOYs, // Append DOYs
            ...irrigationDepths // Append depths
        ];

        //  Save updated `irrigation_selections.csv`
        fs.writeFileSync(irrigationCsvFilePath, `${pastHeaders.join(",")}\n${pastValues.join(",")}`);
        console.log(` Irrigation selections updated: ${irrigationCsvFilePath}`);

        //  Remove the corresponding DOY from `future_irrigation_selections.csv`
        if (fs.existsSync(futureIrrigationCsvFilePath)) {
            const futureData = fs.readFileSync(futureIrrigationCsvFilePath, "utf8").trim().split("\n");
            if (futureData.length > 1) {
                const futureHeaders = futureData[0].split(",");
                const futureValues = futureData[1].split(",");

                // Find the index of the DOY to remove
                const doyIndex = futureHeaders.findIndex(header => header.includes("_doy") && Number(futureValues[futureHeaders.indexOf(header)]) === irrigationDOY);

                if (doyIndex !== -1) {
                    // Remove the DOY and its corresponding value
                    futureHeaders.splice(doyIndex, 1);
                    futureValues.splice(doyIndex, 1);

                    // Save the updated `future_irrigation_selections.csv`
                    fs.writeFileSync(futureIrrigationCsvFilePath, `${futureHeaders.join(",")}\n${futureValues.join(",")}`);
                    console.log(` Removed DOY ${irrigationDOY} from future irrigations: ${futureIrrigationCsvFilePath}`);
                } else {
                    console.log(` DOY ${irrigationDOY} not found in future irrigations.`);
                }
            }
        }

        return res.status(200).json({ message: "Irrigation parameters updated successfully." });

    } catch (error) {
        console.error(" ERROR - Updating irrigation parameters:", error.message);
        return res.status(500).json({ message: "Error updating irrigation parameters.", error: error.message });
    }
});


// Define API endpoint
IrrigationPy.post("/calculate-irrigation", unitMiddleware, async (req, res) => {
    // console.log("DEBUG - Received Request Body:", JSON.stringify(req.body, null, 2)); // Log request data
    console.log("in the server");
    try {
        // Path to the Python script
        const pythonScriptPath = path.join(
            __dirname,
            "../module/MainTool_Merge_with_ISM_parameters.py"
        );

        // Path to the input CSV file
        const inputCsvPath = path.join(
            __dirname,
            "../input_for_python_model/tester.csv"
        );

        console.log("input:",inputCsvPath);

        // Path to the output JSON file
        const outputJsonPath = path.join(
            __dirname,
            "../module/json_output/simulation_output.json"
        );

        // Check if the required files exist
        if (!fs.existsSync(pythonScriptPath)) {
            console.error("ERROR - Python script not found at:", pythonScriptPath);
            return res.status(500).json({ error: "Python script file not found." });
        }

        if (!fs.existsSync(inputCsvPath)) {
            console.error("ERROR - Input CSV not found at:", inputCsvPath);
            return res.status(500).json({ error: "Input CSV file not found." });
        }

        console.log("Running Python script:", pythonScriptPath);
        console.log("Using input CSV file:", inputCsvPath);

        // Spawn a Python process
        const pythonCommand = process.platform === "win32" ? "python" : "python3";
        const python = spawn(pythonCommand, [pythonScriptPath, inputCsvPath]);
        // Adjust to "python3" if needed

        let errorData = "";

        python.stdout.on("data", (chunk) => {
            console.log("PYTHON OUTPUT:", chunk.toString());
        });

        // Capture stderr (Python script errors)
        python.stderr.on("data", (chunk) => {
            console.error("PYTHON ERROR:", chunk.toString());
            errorData += chunk.toString();
        })

        // Handle process exit
        python.on("close", (code) => {
            console.log(`Python script exited with code ${code}`);

            if (code !== 0 || errorData) {
                console.error("ERROR - Python script execution failed.");
                return res
                    .status(500)
                    .json({
                        error: "Python script execution failed.",
                        details: errorData,
                    });
            }

            // Wait a moment to ensure file is written
            setTimeout(() => {
                // Check if JSON file exists
                if (!fs.existsSync(outputJsonPath)) {
                    console.error(
                        "ERROR - JSON output file not found at:",
                        outputJsonPath
                    );
                    return res.status(500).json({ error: "Output JSON file not found." });
                }

                // Read and return the JSON file
                fs.readFile(outputJsonPath, "utf8", (err, data) => {
                    if (err) {
                        console.error("ERROR - Failed to read JSON file:", err);
                        return res
                            .status(500)
                            .json({ error: "Failed to read output JSON file." });
                    }

                    try {
                        const jsonData = JSON.parse(data);
                        let daysSinceLastIrrigation = null;
                        if (jsonData.budget_data && jsonData.budget_data.length > 0) {
                            daysSinceLastIrrigation = jsonData.budget_data[0]["days_since_last_irrigation"] || "Not Found";
                        }

                        console.log(` Days Since Last Irrigation: ${daysSinceLastIrrigation}`);

                        jsonData.budget_data.map((bdata) => {
                            Object.keys(bdata).map((key) => {
                                let val;
                                switch (key) {
                                    case "PAW Depletion (0-1)":
                                        val = bdata[key];
                                        delete bdata[key];
                                        bdata[`Soil Water Depletion (0-1)`] = val;
                                        break;
                                    case "Nitrogen_Stress_Index (0-1)":
                                        val = bdata[key];
                                        delete bdata[key];
                                        bdata[`Nitrogen Stress Index (0-1)`] = val;
                                        break;
                                    case "Water_Stress_Index (0-1)":
                                        val = bdata[key];
                                        delete bdata[key];
                                        bdata[`Water Stress Index (0-1)`] = val;
                                        break;
                                    case "Irrigation_Recommendation (in)":
                                        val = convertUnits.length(bdata[key], "in", req.unit);
                                        delete bdata[key];
                                        bdata[`Irrigation Recommendation (${val.units})`] =
                                            val.value;
                                        break;
                                    case "N Available (kg/ha)":
                                        val = convertUnits.area(bdata[key], "kg/ha", req.unit);
                                        delete bdata[key];
                                        bdata[`N Available (${val.units})`] = val.value;
                                        break;
                                    case "N Deficit (kg/ha)":
                                        val = convertUnits.area(bdata[key], "kg/ha", req.unit);
                                        delete bdata[key];
                                        bdata[`N Deficit (${val.units})`] = val.value;
                                        break;
                                    case "N Fertilization (kg/ha)":
                                        val = convertUnits.area(bdata[key], "kg/ha", req.unit);
                                        delete bdata[key];
                                        bdata[`N Fertilization (${val.units})`] = val.value;
                                        break;
                                    case "N Uptake (kg/ha)":
                                        val = convertUnits.area(bdata[key], "kg/ha", req.unit);
                                        delete bdata[key];
                                        bdata[`N Uptake (${val.units})`] = val.value;
                                        break;
                                    case "Rain and Irrig (in)":
                                        val = convertUnits.length(bdata[key], "in", req.unit);
                                        delete bdata[key];
                                        bdata[`Rain and Irrigation (${val.units})`] = val.value;
                                        break;
                                    case "Today_Crop_N_Demand (kg/ha)":
                                        val = convertUnits.area(bdata[key], "kg/ha", req.unit);
                                        delete bdata[key];
                                        bdata[`Today Crop N Demand (${val.units})`] = val.value;
                                        break;
                                    case "Water Use (in)":
                                        val = convertUnits.length(bdata[key], "in", req.unit);
                                        delete bdata[key];
                                        bdata[`Water Use (${val.units})`] = val.value;
                                        break;
                                    default:
                                    // break;
                                }
                            });
                        });
                        jsonData.seasonal_data.map((sdata) => {
                            Object.keys(sdata).map((key) => {
                                let val;
                                switch (key) {
                                    case "Cumulative Deep Drainage(mm)":
                                        val = convertUnits.length(sdata[key], "mm", req.unit);
                                        delete sdata[key];
                                        sdata[`Cumulative Deep Drainage (${val.units})`] =
                                            val.value;
                                        break;
                                    case "Cumulative N Leaching (kg/ha)":
                                        val = convertUnits.area(sdata[key], "kg/ha", req.unit);
                                        delete sdata[key];
                                        sdata[`Cumulative N Leaching (${val.units})`] = val.value;
                                        break;
                                    case "Cumulative N fertilization (kg/ha)":
                                        val = convertUnits.area(sdata[key], "kg/ha", req.unit);
                                        delete sdata[key];
                                        sdata[`Cumulative N fertilization (${val.units})`] =
                                            val.value;
                                        break;
                                    case "Cumulative irrigation (mm)":
                                        val = convertUnits.length(sdata[key], "mm", req.unit);
                                        delete sdata[key];
                                        sdata[`Cumulative irrigation (${val.units})`] = val.value;
                                        break;
                                    case "Cumulative mineralization, 0.0 m - 0.3 m soil layer (kg/ha)":
                                        val = convertUnits.area(sdata[key], "kg/ha", req.unit);
                                        delete sdata[key];
                                        sdata[
                                            `Cumulative mineralization, 0.0 m - 0.3 m soil layer (${val.units})`
                                        ] = val.value;
                                        break;
                                    case "Cumulative mineralization, 0.3 m - 0.6 m soil layer (kg/ha)":
                                        val = convertUnits.area(sdata[key], "kg/ha", req.unit);
                                        delete sdata[key];
                                        sdata[
                                            `Cumulative mineralization, 0.3 m - 0.6 m soil layer (${val.units})`
                                        ] = val.value;
                                        break;
                                    case "Residual soil profile ammonium (kg/ha)":
                                        val = convertUnits.area(sdata[key], "kg/ha", req.unit);
                                        delete sdata[key];
                                        sdata[`Residual soil profile ammonium (${val.units})`] =
                                            val.value;
                                        break;
                                    case "Residual soil profile nitrate (kg/ha)":
                                        val = convertUnits.area(sdata[key], "kg/ha", req.unit);
                                        delete sdata[key];
                                        sdata[`Residual soil profile nitrate (${val.units})`] =
                                            val.value;
                                        break;
                                    case "Seasonal Actual Biomass (kg/ha)":
                                        val = convertUnits.area(sdata[key], "kg/ha", req.unit);
                                        delete sdata[key];
                                        sdata[`Seasonal Actual Biomass (${val.units})`] = val.value;
                                        break;
                                    case "Seasonal N Uptake (kg/ha)":
                                        val = convertUnits.area(sdata[key], "kg/ha", req.unit);
                                        delete sdata[key];
                                        sdata[`Seasonal N Uptake (${val.units})`] = val.value;
                                        break;
                                    case "Seasonal Potential Biomass (kg/ha)":
                                        val = convertUnits.area(sdata[key], "kg/ha", req.unit);
                                        delete sdata[key];
                                        sdata[`Seasonal Potential Biomass (${val.units})`] = val.value;
                                        break;
                                    case "Seasonal Transpiration (mm)":
                                        val = convertUnits.length(sdata[key], "mm", req.unit);
                                        delete sdata[key];
                                        sdata[`Seasonal Transpiration (${val.units})`] = val.value;
                                        break;
                                    default:
                                    // break;
                                }
                            });
                        });
                        jsonData.daily_data.map((ddata) => {
                            Object.keys(ddata).map((key) => {
                                let val;
                                if (key.includes("(kg/ha)")) {                                    
                                    val = convertUnits.area(ddata[key], "kg/ha", req.unit);
                                    const newKey = key.replace("(kg/ha)", `(${val.units})`);
                                    delete ddata[key];
                                    ddata[`${newKey}`] = val.value;
                                }
                                else if (key.includes("(mm)")) {                                    
                                    val = convertUnits.length(ddata[key], "mm", req.unit);
                                    const newKey = key.replace("(mm)", `(${val.units})`);
                                    delete ddata[key];
                                    ddata[`${newKey}`] = val.value;
                                }    
                                // else if (key.includes("(m/m)")) {                                    
                                //     val = convertUnits.newConversion(ddata[key], "m/m", req.unit);
                                //     const newKey = key.replace("(m/m)", `(${val.units})`);
                                //     delete ddata[key];
                                //     ddata[`${newKey}`] = val.value;
                                // }                            
                            })
                        });
                        return res.json(jsonData);
                    } catch (parseErr) {
                        console.error("ERROR - Failed to parse JSON file:", parseErr);
                        return res
                            .status(500)
                            .json({ error: "Invalid JSON format in output file." });
                    }
                });
            }, 1000); // Wait 500ms to ensure file is written
        });
    } catch (err) {
        console.error("ERROR - Exception running Python script:", err);
        return res
            .status(500)
            .json({
                error: "Error executing irrigation model.",
                details: err.message,
            });
    }
});

module.exports = IrrigationPy;
