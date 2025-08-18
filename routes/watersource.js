// Import required modules
const express = require('express');
const { fetchDataFromDb } = require('./dbConnection');


require('dotenv').config();

const WaterSource = express.Router();



// Endpoint to fetch water source data
WaterSource.get('/water-sources', async (req, res) => {
    
    try {
        // Query the water source data
        const query = 'SELECT ID, Irrig_System, Ea FROM `historic_water_use`.`Efficiency`;';

        const results = await fetchDataFromDb(query);

        // Send the results as JSON response
        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error fetching water source data:', error);

        // Send error response
        res.status(500).json({
            success: false,
            message: 'Failed to fetch water source data.'
        });
    }
});

module.exports = WaterSource;