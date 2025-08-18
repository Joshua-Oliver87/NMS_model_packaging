const express = require('express');
const MetricEnglish = express.Router();
const { fetchDataFromDb } = require("./dbConnection");

/**
 * 1) GET user preference
 *    Example request: GET /users/:id/favoriteUnit
 *    Response: { "favoriteUnit": "metric" }
 */
MetricEnglish.get('/:id/favoriteUnit', async (req, res) => {
  const userId = req.params.id;

  try {
    const [rows] = await fetchDataFromDb(
      'SELECT favorite_unit FROM awn.users WHERE OBJID = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log(rows);
    // Extract favorite_unit from the first row
    const { favorite_unit } = rows;
    return res.json({ favoriteUnit: favorite_unit });
  } catch (error) {
    console.error('Error fetching favorite_unit:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

/**
 * 2) UPDATE user preference
 *    Example request: PUT /users/:id/favoriteUnit
 *    Body: { "newUnit": "english" }
 */
MetricEnglish.put('/:id/favoriteUnit', async (req, res) => {
  const userId = req.params.id;
  const { newUnit } = req.body; // e.g. "metric" or "english"

  // Optional: validate the newUnit value
  if (!['Metric', 'English'].includes(newUnit)) {
    return res.status(400).json({ error: 'Invalid unit preference' });
  }

  try {
    const result = await fetchDataFromDb(
      'UPDATE awn.users SET favorite_unit = ? WHERE OBJID = ?',
      [newUnit, userId]
    );
    console.log(result);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ message: 'Favorite unit updated successfully' });
  } catch (error) {
    console.error('Error updating favorite_unit:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

module.exports = MetricEnglish;
