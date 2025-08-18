const express = require("express");
const { fetchDataFromDb } = require("./dbConnection"); // Import database connection
const unitMiddleware = require("./middleware/unitMiddleware");
const { convertUnits } = require("./utility");
require("dotenv").config();

const CompletedTasks = express.Router();

// Helper function to convert BigInt values to strings
const convertBigIntToString = (data) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) => (typeof value === "bigint" ? value.toString() : value))
  );
};

//  Helper function to ensure quantity is numeric
const getNumericQuantity = (quantity) => {
  return typeof quantity === "object" && quantity.value !== undefined ? quantity.value : quantity;
};

//  API Route: Save Completed Task
CompletedTasks.post("/save-task", unitMiddleware, async (req, res) => {
  try {
    let { planting_objid, applied_item, quantity, user_id, DOE, applied_value } = req.body;

    // Input Validation
    if (!planting_objid || !applied_item || !quantity || !DOE || !user_id || !applied_value) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    //  Convert DOE to MySQL-compatible format
    const formattedDOE = new Date(DOE).toISOString().slice(0, 19).replace("T", " ");

    //  Convert quantity to Metric before storing
    if (req.unit === "English") {
      if (applied_item === "Irrigation" || applied_item === "Soil Sample") {
        quantity = convertUnits.length(quantity, "in", "mm"); // Convert inches to mm
      } else if (applied_item === "Fertilizer") {
        quantity = convertUnits.area(quantity, "lb/acre", "kg/ha"); // Convert lb/acre to kg/ha
      }
    }

    //  Extract only numeric value for storage
    const quantityValue = getNumericQuantity(quantity);

    //  Fix: Use formattedDOE in the values array
    const query = `
      INSERT INTO table_nms_completed_tasks 
      (planting_objid, applied_item, quantity, user_id, DOE, applied_value)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    const values = [planting_objid, applied_item, quantityValue, user_id, formattedDOE, applied_value];

    const result = await fetchDataFromDb(query, values);

    //  Fix: Convert BigInt values before sending response
    res.status(200).json({
      success: true,
      message: "Task saved successfully!",
      task: convertBigIntToString(result),
    });
  } catch (error) {
    console.error("Error saving task:", error);
    res.status(500).json({ error: `Error saving task - ${error.message}` });
  }
});

//  API Route: Get Completed Tasks for the Logged-in User
CompletedTasks.get("/get-tasks", unitMiddleware, async (req, res) => {
  try {
    const { user_id, planting_objid } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required." });
    }

    //  Corrected SQL query and parameter order
    const query = `
      SELECT * FROM table_nms_completed_tasks 
      WHERE user_id = ? AND planting_objid = ? AND STATUS = 0
      ORDER BY DOE DESC
    `;
    const values = [user_id, planting_objid];

    let result = await fetchDataFromDb(query, values);

    //  Convert BigInt values before sending response
    result = result.map(res => {
      if (res.applied_item === "Irrigation" || res.applied_item === "Soil Sample") {
        res.quantity = convertUnits.length(res.quantity, "mm", req.unit); // Convert from mm to requested unit
      } else if (res.applied_item === "Fertilizer") {
        res.quantity = convertUnits.area(res.quantity, "kg/ha", req.unit); // Convert from kg/ha to requested unit
      }
      return res;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    res.status(500).json({ error: `Error fetching user tasks - ${error.message}` });
  }
});

//  API Route: Get Completed Tasks for a Specific Block
CompletedTasks.get("/:block_id", async (req, res) => {
  try {
    const { block_id } = req.params;

    const result = await fetchDataFromDb(
      "SELECT * FROM table_nms_completed_tasks WHERE planting_objid = ? ORDER BY DOE DESC",
      [block_id]
    );

    //  Convert BigInt values before sending response
    res.status(200).json(convertBigIntToString(result));
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//  API Route: Delete a Task
CompletedTasks.put("/delete/:id", unitMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.objid;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    // Mark the task as deleted
    const query = `
      UPDATE table_nms_completed_tasks
      SET status = -1
      WHERE id = ? AND user_id = ?
    `;
    await fetchDataFromDb(query, [id, userId]);
    res.json({ success: true, message: "Task deleted (status set to -1)" });
  } catch (err) {
    console.error("Error soft‐deleting task:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = CompletedTasks;
