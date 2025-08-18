// cropdata.js
const express = require('express');

const { fetchDataFromDb } = require('./dbConnection');
require('dotenv').config();

const CropData = express.Router();

// Define route
CropData.get('/', async (req, res) => {

    try {        
        const results = await fetchDataFromDb('SELECT * FROM awn.table_nms_crop');
        res.json(results);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Error fetching crop data');
    }
});


module.exports = CropData;
