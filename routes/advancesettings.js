// advancesettings.js
const express = require('express');
const { fetchDataFromDb } = require('./dbConnection');
const unitMiddleware = require('./middleware/unitMiddleware');
const { convertUnits } = require('./utility');

const AdvancedSettings = express.Router();

// Route to fetch crop-specific advanced settings
AdvancedSettings.get('/:cropName', unitMiddleware, async (req, res) => {
  const { cropName } = req.params;  
  try {
    const query = 'SELECT * FROM table_nms_crop WHERE name = ?';
    const results = await fetchDataFromDb(query, [cropName]);

    if (!results || results.length === 0) {
      return res.status(404).json({ message: `Crop '${cropName}' not found` });
    }    
    const response = results[0];
    Object.keys(response).map((key) => {      
      switch(key){
        case "gddbase_c":          
          response[key] = convertUnits.temperature(response[key], "C", req.unit).value;           
          break;
        case "gddupperlimit_c":          
          response[key] = convertUnits.temperature(response[key], "C",req.unit).value;           
          break;
        case "yield":          
          response[key] = convertUnits.area(response[key], "kg/ha", req.unit).value;           
          break;
        default:
          //console.log("nothing");                  
      }
    });    
    res.status(200).json(response);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: 'Error fetching advanced crop settings' });
  }
});

module.exports = AdvancedSettings;
