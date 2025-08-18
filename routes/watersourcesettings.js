const express = require('express');
const { fetchDataFromDb } = require('./dbConnection');
const fs = require("fs");
const path = require("path");
require('dotenv').config();

const WaterSourceSettings = express.Router();

//  Define Header Mappings
const headerMappings = {
    water_source: "water_source",
    water_n_concentration: "water_n_concentration"
};

//  POST route to insert water source settings (Nitrogen and Electrical Conductivity)
WaterSourceSettings.post('/', async (req, res) => {
    const settings = req.body;

    if (!Array.isArray(settings) || settings.length === 0) {
        return res.status(400).json({ message: "Invalid settings data" });
    }

    try {
        const dateAdded = new Date();
        const status = 1;

        //  Dynamically Rename Headers & Store Data
        const formattedData = {};
        settings.forEach((setting, index) => {
            Object.entries(headerMappings).forEach(([originalKey, newKey]) => {
                if (setting.name === originalKey) {
                    formattedData[`${newKey}_${index + 1}`] = setting.value ?? ""; // Default to empty string
                }
            });
        });

        //  Ensure Output Directory Exists
        const outputDir = path.resolve(__dirname, "../input_for_python_model");
        const csvPath = path.join(outputDir, "water_source_settings.csv");

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        //  Generate CSV Content
        const csvHeaders = Object.keys(formattedData);
        const csvValues = Object.values(formattedData);
        const csvContent = `${csvHeaders.join(",")}\n${csvValues.join(",")}`;

        //  Write to CSV
        fs.writeFileSync(csvPath, csvContent);

        console.log(` CSV successfully written at: ${csvPath}`);

        //  Save settings to the database
        for (const setting of settings) {
            const query = `
                INSERT INTO table_water_source_settings (water_source_id, name, value, dateadded, lastupdated, status)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            await fetchDataFromDb(query, [
                setting.water_source_id,
                setting.name,
                setting.value,
                dateAdded,
                dateAdded,
                status
            ]);
        }

        res.status(201).json({
            message: "Settings saved successfully",
            csvPath: csvPath,
            csvContent: csvContent
        });

    } catch (err) {
        console.error(' Database error:', err);
        res.status(500).json({ message: "Failed to save settings" });
    }
});

module.exports = WaterSourceSettings;
