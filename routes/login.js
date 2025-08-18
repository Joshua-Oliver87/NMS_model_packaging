const express = require("express");
const crypto = require("crypto"); // For MD5 hashing
const { fetchDataFromDb } = require("./dbConnection");

// Initialize router
const router = express.Router();

// Function to hash passwords using MD5
const hashPassword = (password) => {
  return crypto.createHash("md5").update(password).digest("hex");
};

// Login endpoint
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  const hashedPassword = hashPassword(password);

  try {
    const query = "SELECT * FROM users WHERE username = ?";
    const results = await fetchDataFromDb(query, [username]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Username does not exist" });
    }

    const user = results[0];

    if (user.password !== hashedPassword) {
      return res.status(401).json({ error: "Password does not match" });
    }

    // Set the user_id in the session
    req.session.user_id = user.OBJID;

    // Set user session in cookie
    res.cookie(
      "user_session",
      { id: user.OBJID, username: user.username },
      {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      }
    );

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        objid: user.OBJID,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Database query error" });
  }
});
//  Add your user search suggestion route here:
router.get("/search-users", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Missing query param" });

  try {
    const userSearchQuery = `
      SELECT objid, username FROM users
      WHERE username LIKE ?
      LIMIT 10
    `;
    const results = await fetchDataFromDb(userSearchQuery, [`%${query}%`]);
    const usernames = results.map((row) => ({
      key: row.objid,
      value: row.username,
      text: row.username,
    }));
    res.status(200).json(usernames);
  } catch (error) {
    console.error("Error fetching user suggestions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Validate cookies and session
// ✅ Correct
router.post("/validate-user-session", async (req, res) => {

  const { username, userid } = req.body;
  if (!username || !userid)  return res.status(404).json({ error: "Missing required parameters" });

  try {
    const query = `
      select * from users where userid = ? and username = ?
    `;
    const results = await fetchDataFromDb(query, [userid, username]);
    if (results.length === 0) {
      return res.status(401).json({ error: "invalid user session" });
    }
    const user = results[0];

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        objid: user.OBJID,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error validating user session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
