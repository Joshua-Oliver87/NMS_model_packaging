const express = require("express");
const { fetchDataFromDb } = require("./dbConnection");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { convertUnits } = require("./utility");
const unitMiddleware = require("./middleware/unitMiddleware");

// API Route: Fetch blocks for a specific farm
router.get("/blocks", async (req, res) => {
  const { farmId } = req.query; // Get the farmId (ranch_id) from query parameters

  if (!farmId) {
    return res.status(400).json({ message: "Farm ID (ranch_id) is required." });
  }

  try {
    // Fetch the farm name using /getFarm/:objid
    const farmResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/getFarm/${farmId}`);

    if (!farmResponse.data.farm) {
      return res.status(404).json({ message: "Farm not found." });
    }

    const farm_name = farmResponse.data.farm.name;

    // Query to fetch blocks for the specified ranch_id
    const query = `
      SELECT 
        objid AS block_id, 
        name AS block_name, 
        coordinates, 
        acres, 
        dateadded, 
        lastupdated, 
        status
      FROM table_planting_area
      WHERE ranch_id = ? AND status = 1
    `;

    const rows = await fetchDataFromDb(query, [farmId]);


    // Check if any blocks are found
    if (rows.length === 0) {
      return res.status(404).json({ message: "No blocks found for the selected farm." });
    }

    // Respond with the list of blocks
    res.status(200).json({ farm_name, blocks: rows });
  } catch (err) {
    console.error("Error fetching blocks:", err.message);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  } 
});


// API Route: Fetch blocks for a specific farm
router.get("/tablePlanting", unitMiddleware, async (req, res) => {
  const { planting_area_id } = req.query;

  if (!planting_area_id) {
    return res.status(400).json({ message: "Planting Area ID is required." });
  }

  try {
    // Query to get the planting area details
    const plantingQuery = `
      SELECT objid AS planting_area_id, name AS field_name, ranch_id AS farmId
      FROM table_planting_area
      WHERE objid = ?
    `;
    
    const plantingResults = await fetchDataFromDb(plantingQuery, [planting_area_id]);
    console.log("plantingResults", plantingResults);

    if (plantingResults.length === 0) {
      return res.status(404).json({ message: "No field found for the given planting area ID." });
    }

    const { planting_area_id: field_number, field_name, farmId } = plantingResults[0];

    console.log(`Field Info: field_name=${field_name}, field_number=${field_number}, farmId=${farmId}`);

    // Step 2: Get farm name from `/getFarm/:objid`
    const farmResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/getFarm/${farmId}`);
    
    if (!farmResponse.data.farm) {
      return res.status(404).json({ message: "Farm not found." });
    }

    const farm_name = farmResponse.data.farm.name;

    console.log(`Farm Info: farm_name=${farm_name}`);

    // Step 3: Get blocks
    const blocksResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/blocks?farmId=${farmId}`);

    if (!blocksResponse.data.blocks || blocksResponse.data.blocks.length === 0) {
      return res.status(404).json({ message: "No blocks found for the selected farm." });
    }

    const matchingBlock = blocksResponse.data.blocks.find(block => block.block_id == field_number);

    if (!matchingBlock) {
      return res.status(404).json({ message: "Matching block not found for the given planting area ID." });
    }

    const acres = matchingBlock.acres;

    console.log(` Block Info: block_name=${field_name}, block_id=${field_number}, acres=${acres}`);

    // Step 4: Fetch soil data from table_planting_area_settings
    const soilQuery = `
      SELECT objid, name, planting_area_id, value
      FROM table_planting_area_settings
      WHERE planting_area_id = ? AND status = 1
      ORDER BY objid DESC LIMIT 1
    `;

    const soilResults = await fetchDataFromDb(soilQuery, [planting_area_id]);
    console.log("soilResults", soilResults);

    soilResults.forEach(row => {
      const layers = JSON.parse(row.value);

      layers.forEach(layer => {

        let rawThick;
        if (layer["Thickness (m)"] != null) {
          rawThick = { value: layer["Thickness (m)"], unit: "m" };
        } else if (layer["Thickness (in)"] != null) {
          rawThick = { value: layer["Thickness (in)"], unit: "in" };
        } else if (layer["Thickness (mm)"] != null) {
          rawThick = { value: layer["Thickness (mm)"], unit: "mm" };
        }
        if (rawThick) {
          delete layer["Thickness (m)"];
          delete layer["Thickness (in)"];
          delete layer["Thickness (mm)"];
          const conv = convertUnits.length(rawThick.value, rawThick.unit, req.unit);
          layer[`Thickness (${conv.units})`] = conv.value;
        }

        const rawFC =
        layer["Field Capacity Water Content (m/m)"] != null ? layer["Field Capacity Water Content (m/m)"] : layer["Field Capacity Water Content (in)"];
        [
          "Field Capacity Water Content (m/m)",
          "Field Capacity Water Content (in)",
          "Field Capacity Water Content (%)",  
        ].forEach(k => delete layer[k]);
        if (rawFC != null) {
          layer["Field Capacity Water Content (%)"] = rawFC * 100;
        }

        const rawPWP =
          layer["Permanent Wilting Point Water Content (m/m)"] != null
            ? layer["Permanent Wilting Point Water Content (m/m)"]
            : layer["Permanent Wilting Point Water Content (in)"];
        [
          "Permanent Wilting Point Water Content (m/m)",
          "Permanent Wilting Point Water Content (in)",
          "Permanent Wilting Point Water Content (%)",
        ].forEach(k => delete layer[k]);
        if (rawPWP != null) {
          layer["Permanent Wilting Point Water Content (%)"] = rawPWP * 100;
        }
      });

      row.value = JSON.stringify(layers);
    });

    // Step 5: Write to CSV with headers
    const csvPath = path.join(__dirname, "../input_for_python_model/farm_and_field_data.csv");
    const headers = "farm_name,field_name,field_number,acres\n";
    const csvContent = `${farm_name},${field_name},${field_number},${acres}\n`;
    fs.writeFileSync(csvPath, headers + csvContent, "utf8");
    console.log(` CSV overwritten with new data: ${csvPath}`);

    // Step 6: Return the combined response
    res.status(200).json({
      planting_area: plantingResults,
      farm_name,
      field_number,
      field_name,
      acres,
      soil_data: soilResults, // Include soil data in the response
    });

  } catch (err) {
    console.error(" Error fetching planting area details:", err.message);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

const isMissing = (val) => {
  return (
    val === undefined ||
    val === null ||
    val === "" ||
    val === "NA" ||
    val === "NaN" ||
    (typeof val === "string" && val.trim().toLowerCase() === "na") ||
    isNaN(Number(val))
  );
};

// reupdate soil CSV every time change is made to soil table
router.post("/updateSoilDetails", async (req, res) => {
  const { objid, value } = req.body; // Get objid and new value from request body

  if (!objid || value === undefined) {
    return res.status(400).json({ message: "objid and value are required." });
  }

  try {
    //  Update the value column in the database
    const query = `
      UPDATE table_planting_area_settings
      SET value = ?
      WHERE objid = ? AND status = 1
    `;
    const result = await fetchDataFromDb(query, [value, objid]);

    //  Check if the update was successful
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No record found or no change made." });
    }

    //  Fetch updated soil data from the database
    const fetchQuery = `SELECT value FROM table_planting_area_settings WHERE objid = ?`;
    const fetchResult = await fetchDataFromDb(fetchQuery, [objid]);

    if (!fetchResult.length) {
      return res.status(404).json({ message: "No soil data found for the given objId." });
    }

    //  Parse stored JSON soil data
    let soilData = JSON.parse(fetchResult[0].value);

    //  Define CSV Output Path
    const fs = require("fs");
    const path = require("path");
    const outputDir = path.resolve(__dirname, "../input_for_python_model");
    const csvPath = path.join(outputDir, `soildata.csv`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    //  Generate Headers & Values
    // default values for first row if any fields are NA or NaN
    let lastThickness = 0.1;
    let lastClay = 20;
    let lastSilt = 40;
    let lastSand = 40;
    let lastFC = 0.25;
    let lastPWP = 0.10;
    let lastOM = 1.5;

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

      // Carry forward for Thickness
      let thickness = lastThickness;
      if (!isMissing(row["Thickness (m)"])) {
        thickness = parseFloat(row["Thickness (m)"]);
      } else if (!isMissing(row["Thickness (in)"])) {
        thickness = parseFloat(row["Thickness (in)"]) * 0.0254;
      } else if (!isMissing(row["Thickness (mm)"])) {
        thickness = parseFloat(row["Thickness (mm)"]) * 0.001;
      }
      lastThickness = thickness;

      // Carry forward for Clay, Silt, Sand, FC, PWP, OM
      let clay = !isMissing(row["Clay (%)"]) ? parseFloat(row["Clay (%)"]) : lastClay;
      let silt = !isMissing(row["Silt (%)"]) ? parseFloat(row["Silt (%)"]) : lastSilt;
      let sand = !isMissing(row["Sand (%)"]) ? parseFloat(row["Sand (%)"]) : lastSand;
      let fc   = !isMissing(row["Field Capacity Water Content (m/m)"]) ? parseFloat(row["Field Capacity Water Content (m/m)"]) : lastFC;
      let pwp  = !isMissing(row["Permanent Wilting Point Water Content (m/m)"]) ? parseFloat(row["Permanent Wilting Point Water Content (m/m)"]) : lastPWP;
      let om   = !isMissing(row["Soil Organic Matter (%)"]) ? parseFloat(row["Soil Organic Matter (%)"]) : lastOM;


      // Prevent FC == PWP or FC < PWP
      if (fc <= pwp) {
        pwp = Math.min(pwp, 0.10);
        fc = pwp + 0.05;
      }

      lastClay = clay;
      lastSilt = silt;
      lastSand = sand;
      lastFC = fc;
      lastPWP = pwp;
      lastOM = om;

      csvValues.push(thickness, clay, silt, sand, fc, pwp, om);
    });

    //  Write CSV File
    const csvContent = `${csvHeaders.join(",")}\n${csvValues.join(",")}`;
    fs.writeFileSync(csvPath, csvContent);

    console.log(` CSV successfully written at: ${csvPath}`);

    //  Respond with success message
    return res.status(200).json({
      message: "Value updated and CSV successfully generated!",
      csvPath: csvPath,
      csvContent: csvContent,
    });

  } catch (err) {
    console.error("Error updating value:", err.message);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  } 
});

// API Route: Delete a block by blockId
router.delete("/deleteBlock", async (req, res) => {
  const { blockId } = req.body; // Get blockId from request body

  if (!blockId) {
    return res.status(400).json({ message: "Block ID is required for deletion." });
  }

  
  try {
   
    // Query to delete the block with the specified blockId
    const query = `
      DELETE FROM table_planting_area
      WHERE objid = ?
    `;

    const result = await fetchDataFromDb(query, [blockId]);

    // Check if any rows were affected (block was deleted)
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Block deleted successfully." });
    } else {
      res.status(404).json({ message: "No block found with the specified ID." });
    }
  } catch (err) {
    console.error("Error deleting block:", err.message);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

module.exports = router;