const express = require('express');
const { fetchDataFromDb, bulkInsertToDb, executeQuery } = require('./dbConnection');
require('dotenv').config();
const fs = require("fs");
const path = require("path");

const WaterSource = express.Router();
const CSV_PATH = path.join(__dirname, "../input_for_python_model/water_source_settings.csv");

//  Function to map Water Source Name to a Number
const mapWaterSourceToNumber = (name) => {
    const waterSourceMap = {
        "River": 1,
        "Canal": 2,
        "Groundwater": 3
    };
    return waterSourceMap[name] || 0; // Default to 0 if name isn't recognized
};

//  Function to Save Water Source to CSV
const saveWaterSourceToCSV = async (waterSourceNumber, n_concentration) => {
    try {
        const fileExists = fs.existsSync(CSV_PATH);
        let existingData = fileExists ? fs.readFileSync(CSV_PATH, "utf8").trim().split("\n") : [];

        let headers = [];
        let values = [];

        //  Read existing headers and values
        if (existingData.length >= 2) {
            headers = existingData[0].split(",");
            values = existingData[1].split(",");
        }

        //  Ensure headers contain required fields
        if (!headers.includes("water_source")) headers.push("water_source");
        if (!headers.includes("water_n_concentration")) headers.push("water_n_concentration");

        //  Ensure values array matches headers length
        while (values.length < headers.length) {
            values.push("");
        }

        //  Update values in CSV
        values[headers.indexOf("water_source")] = waterSourceNumber;
        values[headers.indexOf("water_n_concentration")] = n_concentration;

        //  Write updated CSV back to file
        const csvContent = [headers.join(","), values.join(",")].join("\n");
        fs.writeFileSync(CSV_PATH, csvContent, "utf8");

        console.log(` Water Source saved to CSV: ${CSV_PATH}`);
    } catch (error) {
        console.error(" Error writing Water Source to CSV:", error);
    }
};

//  GET route to fetch all water sources (Safe from SQL Injection)
WaterSource.get("/", async (req, res) => {
    try {
        const { blockId } = req.query;
        if (!blockId) {
            return res.status(400).json({ message: "blockId is required" });
        }

        console.log("Fetching water sources for blockId:", blockId);
        const query = `SELECT * FROM table_water_source WHERE ranch_id = ? AND STATUS=1;`;

        const results = await fetchDataFromDb(query, [blockId]); // Pass parameters safely
        res.json(results);
    } catch (err) {
        console.error(' Database error:', err);
        res.status(500).send('Error fetching water source data');
    }
});

//  GET Route to Fetch Efficiency Data
WaterSource.get("/efficiency", async (req, res) => {
    try {
        const query = `SELECT * FROM historic_water_use.Efficiency;`;
        const results = await fetchDataFromDb(query);
        res.json(results);
    } catch (err) {
        console.error(' Database error:', err);
        res.status(500).send('Error fetching efficiency data');
    }
});

//  POST route to insert a new water source
WaterSource.post("/", async (req, res) => {
    const { name, ranch_id, n_concentration, ...values } = req.body;

    if (!name || !ranch_id) {
        return res.status(400).json({ message: "Name and Ranch ID are required" });
    }

    try {
        //  Convert Water Source Name to Number
        const waterSourceNumber = mapWaterSourceToNumber(name);

        //  Insert Water Source into Database (Safe from SQL Injection)
        const insertQuery = `INSERT INTO table_water_source (name, lastupdated, ranch_id, status) VALUES (?, ?, ?, ?)`;
        const result = await executeQuery(insertQuery, [name, new Date(), ranch_id, 1]);

        if (result.affectedRows > 0) {
            const waterSourceId = Number(result.insertId);
            console.log(` Water Source created successfully with ID ${waterSourceId}`);

            //  Log received data for debugging
            console.log("Received Request Body:", req.body);
            console.log("Extracted Additional Values for Settings:", values);

            //  Insert Water Source Settings (if additional values exist)
            if (Object.keys(values).length > 0) {
                // const records = Object.entries(values).map(([key, value]) => [waterSourceId, name, value, 1]);
                const records = Object.keys(values).map(key => {
                    return [waterSourceId, key, values[key], 1];
                });

                console.log("Formatted Records for Bulk Insert:", records);

                if (records.length > 0) {
                    //  Generate dynamic placeholders for bulk insert
                    // const placeholders = records.map(() => "(?, ?, ?, ?)").join(", ");
                    // const flattenedValues = records.flat(); // Convert array of arrays into a single array                    
                    const settingsQuery = `INSERT INTO table_water_source_settings (water_source_id, name, value, status) VALUES (?, ?, ?, ?)`;
                    // await executeQuery(settingsQuery, flattenedValues);


                    await bulkInsertToDb(settingsQuery, records);
                    console.log(` Water source settings saved successfully`);
                } else {
                    console.warn(" No additional settings found for water source.");
                }
            }

            //  Save Water Source to CSV
            await saveWaterSourceToCSV(waterSourceNumber, n_concentration);

            return res.status(201).json({ message: " Water source saved successfully!" });
        }

        return res.status(500).json({ message: "Unexpected database behavior" });

    } catch (err) {
        console.error(" Database error:", err);
        res.status(500).json({ message: "Failed to save data", error: err.message });
    }
});

WaterSource.put('/:objid', async (req, res) => {
    const { objid } = req.params;
    try {
        // Clean objid (remove non-numeric characters)
        const cleanObjid = objid.replace(/\D/g, '');
        
        const result = await executeQuery(
            'UPDATE table_water_source SET status = -1 WHERE objid = ?',
            [cleanObjid]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Water source not found' });
        }
        res.json({ message: 'Water source marked as deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
  
module.exports = WaterSource;
