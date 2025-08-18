const express = require("express");
const router = express.Router();
const { bulkInsertToDb, fetchDataFromDb } = require("./dbConnection");
const unitMiddleware = require("./middleware/unitMiddleware");
const { convertUnits } = require("./utility");
const fs = require("fs");
const path = require("path");
const { convertInchesToMeters } = require("../src/util/shared-utils");
// Function to convert date to DOY (Day of Year)
const getDayOfYear = (dateString) => {
  const date = new Date(dateString);
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

// Route to Save Soil Sample Data
router.post("/soil-sample", unitMiddleware, async (req, res) => {
  try {
    let { userId, plantingObjId, name, rows, doy } = req.body;
    console.log(req.body);
    if (
      !userId ||
      !plantingObjId ||
      !name ||
      !doy ||
      !rows ||
      rows.length === 0
    ) {
      return res.status(400).json({ message: "Invalid input data" });
    }
    const insertSampleQuery = `
      INSERT INTO table_nms_soil_sample (user_id, planting_id, name, doy, depth, water_content, nitrate_content, ammonium_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = rows.map((row) => [
      userId,
      plantingObjId,
      name,
      doy,
      req.unit === "English"
        ? convertInchesToMeters(row["depth"])
        : row["depth"],
      row["water_content"],
      row["nitrate_content"],
      row["ammonium_content"],
    ]);
    console.log(values);
    await bulkInsertToDb(insertSampleQuery, values);
    res.status(201).json({ message: "Soil sample data saved successfully!" });
  } catch (error) {
    console.error("Error saving soil sample:", error);
    res.status(500).json({ message: "Database error", error });
  }
});

const roundToTenth = (val) => {
  const parsed = parseFloat(val);
  if (isNaN(parsed)) return 0.1;
  return Math.round(parsed * 10) / 10;
};

router.post(
  "/save-initial-soil-conditions",
  unitMiddleware,
  async (req, res) => {
    try {
      const { rows } = req.body;

      if (!rows || rows.length === 0) {
        return res.status(400).json({ message: "Missing initial soil data." });
      }

      const inputDir = path.resolve(__dirname, "../input_for_python_model");
      const filePath = path.join(inputDir, "initial_soil_conditions.csv");

      const headers = ["number_of_layers"];
      const values = [rows.length]; // Count of layers

      rows.forEach((row, i) => {
        const index = i + 1;
        let depth = convertInchesToMeters(row["depth"]);
        depth = roundToTenth(depth);

        headers.push(
          `layer_${index}_thickness`,
          `layer_${index}_water`,
          `layer_${index}_nitrate_n`,
          `layer_${index}_ammonium_n`
        );

        values.push(
          depth ?? 1,
          row["water_content"] ?? 1,
          row["nitrate_content"] ?? 1,
          row["ammonium_content"] ?? 1
        );
      });

      const csvContent = `${headers.join(",")}\n${values.join(",")}`;
      fs.writeFileSync(filePath, csvContent);

      console.log(`Initial soil conditions written to: ${filePath}`);

      res.status(201).json({
        message: "Initial soil conditions saved successfully.",
        csvPath: filePath,
      });
    } catch (err) {
      console.error(" Error saving initial soil conditions:", err.message);
      res
        .status(500)
        .json({
          message: "Failed to save soil conditions",
          error: err.message,
        });
    }
  }
);

// Route to Fetch All Soil Sample Data
router.get("/soil-sample", async (req, res) => {
  try {
    console.log("→ GET /soil-sample req.query:", req.query);
    const userId       = req.query.userId       || req.query.user_id;
    const plantingObjId= req.query.plantingObjId|| req.query.planting_objid;
    // let { userId, plantingObjId } = req.query;

    if (
      !userId ||
      !plantingObjId
    ) {
      return res.status(400).json({ message: "Invalid input data" });
    }
    const selectQuery = `SELECT * FROM table_nms_soil_sample where user_id = ? and planting_id = ?`;
    const soilSamples = await fetchDataFromDb(selectQuery, [userId, plantingObjId]);

    res.status(200).json({ data: soilSamples });
  } catch (error) {
    console.error("Error fetching soil sample data:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch soil sample data", error });
  }
});

module.exports = router;
