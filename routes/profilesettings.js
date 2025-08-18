const express = require("express");
const crypto = require("crypto"); // For MD5 hashing
const { fetchDataFromDb } = require("./dbConnection");
require("dotenv").config();

const ProfileRouter = express.Router();

// 🔹 Get user profile information
ProfileRouter.get("/get-profile/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const query = `SELECT * FROM users WHERE objid = ?`;
    const result = await fetchDataFromDb(query, [userId]);

    if (result.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result[0]); // Return the first record (assuming objid is unique)
  } catch (error) {
    console.error(" Error fetching profile:", error);
    res.status(500).json({ error: "Error fetching profile information" });
  }
});

// 🔹 Update user profile information
ProfileRouter.put("/update-profile", async (req, res) => {
  const {
    userId,
    username,
    fullname,
    email,
    organization,
    address1,
    address2,
    city,
    zipcode,
    state,
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const query = `
      UPDATE users 
      SET username = ?, fullname = ?, email = ?, organization = ?, 
          address1 = ?, address2 = ?, city = ?, zipcode = ?, state = ?
      WHERE objid = ?;
    `;

    const result = await fetchDataFromDb(query, [
      username,
      fullname,
      email,
      organization,
      address1,
      address2,
      city,
      zipcode,
      state,
      userId,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "User not found or no changes made" });
    }

    res.json({ message: " Profile updated successfully" });
  } catch (error) {
    console.error(" Error updating profile:", error);
    res.status(500).json({ error: "Error updating profile information" });
  }
});

// 🔹 Verify user password (MD5 check)
ProfileRouter.post("/verify-password", async (req, res) => {
  console.log("🔹 Received API request for password verification:", req.body);

  const { userId, password } = req.body;

  if (!userId || !password) {
    console.error("🔴 Backend Error: Missing user ID or password", {
      userId,
      password,
    });
    return res
      .status(400)
      .json({ error: "User ID and password are required." });
  }

  try {
    const query = "SELECT password FROM users WHERE objid = ?";
    const result = await fetchDataFromDb(query, [userId]);

    if (result.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const storedPassword = result[0].password;
    console.log("🔹 Stored Password in DB:", storedPassword);
    console.log("🔹 Received Hashed Password:", password);

    if (storedPassword === password) {
      return res.json({ success: true });
    } else {
      return res
        .status(401)
        .json({ success: false, error: "Incorrect password." });
    }
  } catch (error) {
    console.error("🔴 Error verifying password in backend:", error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});

// 🔹 Update user password (Checks current password before updating)
ProfileRouter.put("/update-password", async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 🔍 Fetch current password from DB
    const queryCheck = `SELECT password FROM users WHERE objid = ?`;
    const result = await fetchDataFromDb(queryCheck, [userId]);

    if (result.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const storedPassword = result[0].password;
    const hashedCurrentPassword = crypto
      .createHash("md5")
      .update(currentPassword)
      .digest("hex");

    //  Reject if the current password is incorrect
    if (storedPassword !== hashedCurrentPassword) {
      return res.status(403).json({ error: "Incorrect current password" });
    }

    // 🔄 Hash the new password before saving
    const hashedNewPassword = crypto
      .createHash("md5")
      .update(newPassword)
      .digest("hex");

    const queryUpdate = "UPDATE users SET password = ? WHERE objid = ?";
    const updateResult = await fetchDataFromDb(queryUpdate, [
      hashedNewPassword,
      userId,
    ]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: "Password update failed" });
    }

    res.json({ message: " Password updated successfully" });
  } catch (error) {
    console.error(" Error updating password:", error);
    res.status(500).json({ error: "Error updating password" });
  }
});

module.exports = ProfileRouter;
