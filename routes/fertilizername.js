const express = require('express');
const { fetchDataFromDb } = require('./dbConnection'); // Correct path to dbConnection

const FertilizerName = express.Router();

FertilizerName.get('/fertilizername', async (req, res) => {
    try {
        const query = 'SELECT * FROM table_fertilizer';
        const results = await fetchDataFromDb(query);
        res.json(results);
    } catch (err) {
        console.error('Error fetching fertilizer data:', err);
        res.status(500).send('Error fetching fertilizer data');
    }
});

module.exports = FertilizerName;
