const express = require("express");
const { fetchDataFromDb, bulkInsertToDb } = require("./dbConnection");
require("dotenv").config();

const FertilizerData = express.Router();

// Debugging SQL query
FertilizerData.get("/fertilizers", async (req, res) => {
  try {
    const query = "SELECT * FROM table_fertilizer_settings WHERE status=2;";
    console.log("Executing Query:", query); // Debug log

    const rows = await fetchDataFromDb(query);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching fertilizer data:", error.message); //Detailed error log
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: error.message,
    });
  }
});

FertilizerData.get("/get-fertilizer-info", async (req, res) => {
  try {
    const { ranch_id } = req.query;
    const query = `SELECT * FROM table_fertilizer WHERE ranch_id=${ranch_id};`;
    console.log("Executing Query:", query); // 👈 Debug log

    const rows = await fetchDataFromDb(query);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching fertilizer data:", error.message); //Detailed error log
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: error.message,
    });
  }
});

FertilizerData.post("/createCustomFertilizer", async (req, res) => {
  const { fertilizerName, ranch_id, ...values } = req.body;

  const keyMap = {
    Nitrogen: "N",
    Phosphorus: "P",
    Potassium: "K",
    "Nitrate-N": "nitrate-n",
    "Ammonia-N": "ammonia-n",
    "Ammoniacal-N": "ammoniacal-n",
    "Urea-N": "urea-n",
    Calcium: "Calcium",
    Magnesium: "Magnesium",
    Sulfur: "Sulfur",
    "B (boron)": "B (boron)",
    Chloride: "Chloride",
    Copper: "Copper",
    Iron: "Iron",
    Manganese: "Manganese",
    "Na (sodium)": "Na (sodium)",
    Nickel: "Nickel",
    Zinc: "Zinc",
    "Organic Matter": "Organic Matter",
    "Potassium-Sap": "Potassium-Sap",
    // add others as needed
    Formulation: "Formulation"
  };
  


  if (!ranch_id || !fertilizerName) {
    return res.status(400).json({
      error: "Missing required fields: ranch_id, fertilizerName",
    });
  }

  try {
    // 1. Always insert a new fertilizer record for this user/ranch
    const insertFertQuery = `
      INSERT INTO table_fertilizer (name, ranch_id, status)
      VALUES (?, ?, ?)
    `;
    const result = await fetchDataFromDb(insertFertQuery, [fertilizerName, ranch_id, 1]);

    if (result.affectedRows > 0) {
      const fertilizerId = Number(result.insertId);

      // 2. Figure out if it's custom or dropdown:
      let settingsToInsert = [];
      let settingsMap = {};

      const anyNonZero = Object.values(values).some(val => val !== "0" && val !== "" && val !== undefined);
      if (anyNonZero) {
        // CUSTOM: Use user POSTed values -- always use mapped keys!
        settingsToInsert = Object.keys(values).map(key => {
          const dbKey = keyMap[key] || key;
          return [fertilizerId, dbKey, values[key], 1];
        });
        Object.keys(values).forEach(key => {
          const dbKey = keyMap[key] || key;
          settingsMap[dbKey.toLowerCase()] = values[key];
        });
      } else {
        // DROPDOWN: Fetch from master settings table
        const masterFertQuery = `SELECT objid FROM table_fertilizer WHERE name = ? AND status = 2 LIMIT 1`;
        const masterResult = await fetchDataFromDb(masterFertQuery, [fertilizerName]);
        if (!masterResult.length) {
          return res.status(400).json({ error: "Reference fertilizer not found." });
        }
        const masterObjId = masterResult[0].objid;

        const masterSettingsQuery = `SELECT name, value FROM table_fertilizer_settings WHERE fertilizer_id = ? AND status = 2`;
        const masterSettingsRows = await fetchDataFromDb(masterSettingsQuery, [masterObjId]);
        settingsToInsert = masterSettingsRows.map(row => [fertilizerId, row.name, row.value, 1]);
        masterSettingsRows.forEach(row => {
          settingsMap[row.name.toLowerCase()] = row.value;
        });
      }

      // Insert all settings for this new fertilizer (so you can retrieve later if needed)
      if (settingsToInsert.length > 0) {
        const insertSettingsQuery = `
          INSERT INTO table_fertilizer_settings (fertilizer_id, name, value, status) VALUES (?, ?, ?, ?)
        `;
        await bulkInsertToDb(insertSettingsQuery, settingsToInsert);
      }

      // 3. Now map those settings to your CSV output, using flexible name matching
      function getValue(keys) {
        for (const k of keys) {
          const value = settingsMap[k];
          if (value !== undefined && value !== "NA" && value !== "") {
            return value;
          }
          // Try lowercase fallback if you want to cover for lower/uppercase mismatches
          const lower = k.toLowerCase();
          if (settingsMap[lower] && settingsMap[lower] !== "NA" && settingsMap[lower] !== "") {
            return settingsMap[lower];
          }
        }
        return "0";
      }
      

      // Flexible key mapping for various fertilizer names
      const mineralRate      = getValue(["N"]);
      const nitrateFraction  = getValue(["nitrate-n"]);
      const ammoniumFraction = getValue(["ammoniacal-n"]);
      const ammoniaFraction  = getValue(["ammonia-n"]);
      const date             = getValue(["date", "fertilization_date", "fertilization date"]);


      // 4. Write CSV
      try {
        const fs = require("fs");
        const path = require("path");
        const outputDir = path.resolve(__dirname, "../input_for_python_model");
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        const csvPath = path.join(outputDir, `fertilizer_input_data.csv`);

        const csvHeaders = [
          "fertilization_1_fertilizer_name",
          "fertilization_1_mineral_rate",
          "fertilization_1_nitrate_fraction",
          "fertilization_1_ammonium_fraction",
          "fertilization_1_ammonia_fraction",
          "fertilization_1_date"
        ];
        const csvValues = [
          fertilizerName || "0",
          mineralRate,
          nitrateFraction,
          ammoniumFraction,
          ammoniaFraction,
          date
        ];

        const csvContent = `${csvHeaders.join(",")}\n${csvValues.join(",")}`;
        fs.writeFileSync(csvPath, csvContent);
        console.log(`CSV written to: ${csvPath}`);
      } catch (csvError) {
        console.error("Error writing fertilizer_input_data.csv:", csvError);
      }

      // Respond success
      return res.status(201).json({ message: `Custom Fertilizer values created and CSV written successfully with fertilizerId ${fertilizerId}` });
    }

    return res.status(500).json({ message: "Unexpected database behavior" });
  } catch (err) {
    console.error("Error inserting fertilizer:", err.message);
    return res.status(500).json({ message: "Database error", details: err.message });
  }
});





module.exports = FertilizerData;
