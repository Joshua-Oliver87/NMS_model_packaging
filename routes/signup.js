const express = require("express");
const { fetchDataFromDb } = require("./dbConnection"); // Ensure correct import path
const crypto = require("crypto");

const router = express.Router();

console.log(" signup.js is loaded");

router.post("/register", async (req, res) => {
  console.log(" Received POST request at /api/users/register");
  console.log("🛠 Request Body:", req.body);

  try {
    const {
      username,
      email,
      password,
      fullName,
      organization,
      address1,
      address2,
      city,
      state,
    } = req.body;

    if (!username || !email || !password || !fullName || !address1 || !city) {
      console.log("⚠️ Validation Failed: Missing required fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Hash the password using MD5
    const hashedPassword = crypto.createHash("md5").update(password).digest("hex");

    console.log("🔹 MD5 Hashed Password:", hashedPassword);

    const query = `
      INSERT INTO users (username, email, password, fullname, organization, address1, address2, city, state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [username, email, hashedPassword, fullName, organization, address1, address2, city, state];

    console.log("🛠 Executing SQL Query:", query);
    console.log("🛠 Query Values:", values);

    // Use fetchDataFromDb() instead of execute()
    const result = await fetchDataFromDb(query, values);

    console.log(" Query Result:", result);

    if (result.affectedRows > 0) {
      console.log(" User registered successfully");
      return res.status(201).json({ message: "User registered successfully" });
    } else {
      console.log(" Failed to register user");
      return res.status(500).json({ error: "Failed to register user" });
    }
  } catch (error) {
    console.error("🔴 Error saving user:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

module.exports = router;
