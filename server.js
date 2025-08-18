const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 80;
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS || [
  "http://localhost:3000",
  "http://35.90.181.26",
  "https://nms.awn.cahnrs.wsu.edu ",
  "http://44.247.44.217",
];

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`CORS blocked request from: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies & authentication headers
  })
);
// Ensure preflight requests are handled properly
app.options("*", cors());
app.use(bodyParser.json()); // Parse JSON payloads
app.use(cookieParser()); // Parse cookies for session handling
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: "your-session-secret", // Replace with a real secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true for HTTPS
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("Server is running!");
});

// Example endpoint to test MariaDB connection
// app.get("/api/testdb", async (req, res) => {
//   let connection;
//   try {
//     connection = await pool.getConnection(); // Get a connection from the pool
//     const result = await connection.query("SELECT 1 as status");
//     res.status(200).json({ message: "Database connected!", result });
//   } catch (err) {
//     console.error("Database connection failed:", err.message);
//     res.status(500).json({ message: "Database connection failed", error: err.message });
//   } finally {
//     if (connection) connection.end(); // Release connection back to the pool
//   }
// });

// Import routes
const loginRoute = require("./routes/login");
const ranchRoute = require("./routes/myfarms");
const weatherStationsMarkers = require("./routes/weatherstationmarkers");
const nearestStationsRoute = require("./routes/nearestweatherstation");
const getMostRecentFigureRoute = require("./routes/getMostRecentFigure");
const saveBlockRoute = require("./routes/saveblock");
const myblocksRoute = require("./routes/myblocks");
const getSoilsRoute = require("./routes/getsoils");
const CropData = require("./routes/cropdata");
const FertilizerData = require("./routes/fertilizerdata");
const AddFarm = require("./routes/addfarm");
const AdvancedSettings = require("./routes/advancesettings");
const PlantingData = require("./routes/plantingdata"); // Import the plantingdata API
const UpdateWaterSource = require("./routes/updatewatersource");
const WaterSourceSettings = require("./routes/watersourcesettings");
const FertilizerName = require("./routes/fertilizername");
const WaterSource = require("./routes/watersource");
const WeatherDaily = require("./routes/WeatherDaily");
const IrrigationPy = require("./routes/irrigationpy");
const GddData = require("./routes/gddDataApi");
const CompletedTasks = require("./routes/completedtasks");
const soilSampleRoutes = require("./routes/soilsample"); // Import the soil sample routes
const MetricEnglish = require("./routes/MetricsEnglish");
const ProfileRouter = require("./routes/profilesettings"); // Import Profile Router
const signupRoutes = require("./routes/signup");
const awsSesRoutes = require("./routes/aws-ses"); // Import AWS SES routes
const resetPasswordRoutes = require("./routes/resetpassword"); // Import Reset Password Route
const forecastRoute = require("./routes/forecast");

// Serve React static files
app.use(express.static(path.join(__dirname, "build")));
// Mount routes
app.use("/api", loginRoute); // Login-related routes
app.use("/api", ranchRoute); // Ranch operations
app.use("/api", weatherStationsMarkers); // Weather station markers
app.use("/api", nearestStationsRoute); // Nearest weather stations
app.use("/api", getMostRecentFigureRoute); // Fetch most recent figure
app.use("/api", saveBlockRoute); // Save block data
app.use("/api", myblocksRoute); // Fetch blocks for a selected farm
app.use("/api", getSoilsRoute); // Fetch soil data route
app.use("/api/crops", CropData); // Fetch crop data
app.use("/api", FertilizerData); // Fetch fertilizer data
app.use("/api/advancesettings", AdvancedSettings);
app.use("/api", WaterSource); // Fetch water source data
app.use("/api", AddFarm);
app.use("/api/planting", PlantingData);
// app.use("/api/planting/save", PlantingData);
// app.use("/api/planting/writeCsv", PlantingData);
app.use("/api/water-resources", UpdateWaterSource);
app.use("/api/water-resources/settings", WaterSourceSettings);
app.use("/api", FertilizerName);
app.use("/api/daily-weather", WeatherDaily);
app.use("/api/irrigationpy", IrrigationPy);
app.use("/api/gddapi", GddData);
app.use("/api/completedtasks", CompletedTasks);
app.use("/api", soilSampleRoutes); // Mount the soil sample API under /api
app.use("/api", MetricEnglish);
app.use("/api/profile", ProfileRouter); // Mount Profile Router under /api/profile
app.use("/api/users", signupRoutes);
app.use("/api", awsSesRoutes); // All routes in aws-ses.js will be prefixed with "/api"
app.use("/api", resetPasswordRoutes); // Register API route
app.use("/api/forecast", forecastRoute);

// Catch-all route to serve React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// // Start the server
app.listen(80, "0.0.0.0", () => {
  console.log("Server running on http://0.0.0.0:80");
});

// Start the server
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
