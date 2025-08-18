import axios from "axios";
import API from "./api";
import md5 from "md5";
import { getDayOfYear } from "../util/shared-utils";

// Validate user session
export const validateUserSession = async (values) => {
  let res = null;  
  try {
    await API.post(`/api/validate-user-session`, values).then(
      (response) => {
        res = response.data.user;
      }
    );
  } catch (error) {
    console.error(
      "Error validating user session:",
      error.response || error.message || error
    );
  }
  return res;  
};
// Fetch Soil Data
export const fetchSoilData = async (blockId) => {
  try {
    const response = await API.get(`/api/tablePlanting`, {
      params: { planting_area_id: blockId },
    });

    const units =
      localStorage.getItem("favoriteUnit") === "English" ? "in" : "mm";
    console.log("fetchSoilData", response.data);

    if (response.data?.soil_data?.length > 0) {
      const soilDataItem = response.data.soil_data[0];
      const objid = soilDataItem.objid;
      const jsonResponse = JSON.parse(soilDataItem.value);

      const soilDataByHorizon = jsonResponse.reduce((acc, cur) => {
        const key = cur["Horizon #"];
        if (!acc[key]) {
          acc[key] = [];
        }

        const currentThickness = parseFloat(cur[`Thickness (${units})`]);
        if (
          acc[key].length === 0 ||
          currentThickness > parseFloat(acc[key][0][`Thickness (${units})`])
        ) {
          const updatedEntry = {
            ...cur,
            [`Thickness (${units})`]: currentThickness.toFixed(2),
            [`Field Capacity Water Content (${units})`]: parseFloat(
              cur[`Field Capacity Water Content (${units})`]
            ).toFixed(2),
            [`Permanent Wilting Point Water Content (${units})`]: parseFloat(
              cur[`Permanent Wilting Point Water Content (${units})`]
            ).toFixed(2),
          };
          acc[key] = [updatedEntry];
        }
        return acc;
      }, {});

      const flattenedSoilData = Object.values(soilDataByHorizon).flat();

      const finalSoilCardResponse = [];
      const finalSoilTableResponse = [];
      flattenedSoilData.forEach((entry) => {
        const { MuKey, MuName, ...rest } = entry;
        if (MuKey !== undefined && MuName !== undefined) {
          finalSoilCardResponse.push({ MuKey, MuName });
        }
        finalSoilTableResponse.push(rest);
      });

      return { objid, finalSoilCardResponse, finalSoilTableResponse };
    }
    return null;
  } catch (error) {
    console.error(
      "Error fetching fetchSoilData:",
      error.response || error.message || error
    );
    return null;
  }
};

// Fetch fertilizers settings
export const fetchFertilizerInfo = async () => {
  let fertilizerInfo = null;
  try {
    const response = await API.get(`/api/fertilizers`);
    if (response.data.success) {
      fertilizerInfo = response.data.data;
    } else {
      console.error("Failed to fetch fertilizer data");
    }
  } catch (error) {
    console.error(
      "Error fetching fertilizer info:",
      error.response || error.message || error
    );
  }
  return fertilizerInfo;
};

// Fetch fertilizers
export const fetchFertilizerData = async (ranch_id) => {
  let fertilizerInfo = null;
  try {
    const response = await API.get(`/api/get-fertilizer-info`, {
      params: { ranch_id: ranch_id },
    });
    if (response.data.success) {
      fertilizerInfo = response.data.data;
    } else {
      console.error("Failed to fetch fertilizer data");
    }
  } catch (error) {
    console.error(
      "Error fetching fertilizer info:",
      error.response || error.message || error
    );
  }
  return fertilizerInfo;
};

// Create custom fertilizers
export const createCustomFertilizer = async (values) => {
  let res = null;
  try {
    const response = await API.post(`/api/createCustomFertilizer`, values).then(
      (response) => {
        res = response.data.message;
      }
    );
  } catch (error) {
    console.error(
      "Error creating custom fertilizer info:",
      error.response || error.message || error
    );
  }
  return res;
};

// Fetch daily weather data
export const fetchDailyWeatherData = async (unitId, startDate, endDate) => {
  try {
    const response = await API.get(`/api/daily-weather/dailyWeatherData`, {
      params: { unitId, startDate, endDate },
    });

    if (response.data) {
      return response.data;
    } else {
      console.error("Failed to fetch daily weather data - no data received");
      return null;
    }
  } catch (error) {
    console.error(
      "Error fetching daily weather data:",
      error.response?.data || error.message || error
    );
    return null;
  }
};

// Fetch Forecast data for next 7 days
export const fetchGddDataForNext7Days = async (unitId, baseTemp) => {
  try {
    const response = await API.get(`/api/gddapi/forecastGDDData`, {
      params: { unitId, baseTemp },
    });

    if (response.data) {
      return response.data;
    } else {
      console.error("Failed to fetch forecast data for GDD");
      return null;
    }
  } catch (error) {
    console.error(
      "Error while fetching forecast data for GDD:",
      error.response?.data || error.message || error
    );
    return null;
  }
};

// Fetch crop data
export const fetchCropData = async () => {
  try {
    const response = await API.get(`/api/crops`);
    return response.data;
  } catch (error) {
    console.error("Error fetching crop data:", error);
    throw error;
  }
};

// Fetch advanced settings for selected crop
export const fetchAdvancedSettings = async (cropName) => {
  try {
    const response = await API.get(`/api/advancesettings/${cropName}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching settings for ${cropName}:`, error);
    throw error;
  }
};

// Save planting data to backend
export const savePlantingData = async (data) => {
  try {
    const response = await API.post(`/api/planting/save`, data);
    return response.data;
  } catch (error) {
    console.error("Error in savePlantingData:", error.response || error);
    throw error;
  }
};

// Save water source (updated to match backend expectations)
export const saveWaterSource = async (data) => {
  try {
    const response = await API.post(`/api/water-resources`, data);
    return response.data;
  } catch (error) {
    console.error(
      "Error saving water source:",
      error.response?.data || error.message || error
    );
    throw error;
  }
};

// Save water source settings
export const saveWaterSourceSettings = async (settings) => {
  try {
    const response = await API.post(`/api/water-resources/settings`, settings);
    return response.data;
  } catch (error) {
    console.error("Error saving water source settings:", error);
    throw error;
  }
};

// Fetch planting names
export const fetchPlantingNames = async (blockId) => {
  let plantingNames = [];
  try {
    const response = await API.get(
      `/api/planting/get-planting-info/${blockId}`
    );
    console.log("fetchPlantingNames:", response.data);
    plantingNames = response.data;
  } catch (error) {
    console.error(
      "Error fetching planting names:",
      error.response || error.message || error
    );
  }
  return plantingNames;
};

// Fetch planting info settings
export const fetchPlantingInfoSettings = async (plantingId) => {
  try {
    const response = await API.get(`/api/planting/get-planting-settings`, {
      params: { plantingId },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching planting settings:",
      error.response || error.message || error
    );
    throw error;
  }
};

// Fetch fertilizer names
export const fetchFertilizerNames = async () => {
  let fertilizerNames = null;
  try {
    const response = await API.get(`/api/fertilizername`);
    console.log("fetchFertilizerNames:", response.data);
    fertilizerNames = response.data;
  } catch (error) {
    console.error(
      "Error fetching fertilizer names:",
      error.response || error.message || error
    );
  }
  return fertilizerNames;
};

// Fetch water sources
export const fetchWaterSources = async (blockId) => {
  try {
    const response = await API.get(`/api/water-resources`, {
      params: { blockId },
    });
    return response.data ?? [];
  } catch (error) {
    console.error("Error fetching water sources:", error);
    throw error;
  }
};

// Fetch irrigation water sources
export const fetchIrrigationWaterSources = async () => {
  try {
    const response = await API.get(`/api/water-sources`);
    return response.data ?? [];
  } catch (error) {
    console.error("Error fetching water sources for irrigation:", error);
    throw error;
  }
};

// Fetch seasonal output data
export const fetchSeasonalOutputData = async () => {
  try {
    const response = await API.post(`/api/irrigationpy/calculate-irrigation`, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      params: { timestamp: new Date().getTime() },
    });

    if (!response.data) {
      throw new Error("No data received from API");
    }
    return response.data;
  } catch (error) {
    console.error("Error executing seasonal output:", error);
    // alert("Failed to execute seasonal output. Please check the backend logs.");
  }
};

// Fetch planting settings
export const fetchPlantingSettings = async (plantingId) => {
  try {
    const response = await API.get(`/api/gddapi/get-planting-settings`, {
      params: { plantingId },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching planting settings:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Fetch GDD data
export const fetchGDDData = async (stationId, baseTemp, startDate, endDate) => {
  try {
    const response = await API.get(`/api/gddapi/fetchGDDData`, {
      params: { stationId, baseTemp, startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching GDD data:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Save task
export const saveTask = async (task) => {
  try {
    const response = await API.post(`/api/completedtasks/save-task`, task);
    return response.data;
  } catch (error) {
    console.error("Error saving task:", error.response?.data || error.message);
    throw error;
  }
};

// Get tasks
export const getTasks = async (userId, plantingId) => {
  try {
    const response = await API.get(`/api/completedtasks/get-tasks`, {
      params: { user_id: userId, planting_objid: plantingId },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error getting tasks:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Delete task
export const deleteTask = async (taskId) => {
  try {
    const response = await API.put(`/api/completedtasks/delete/${taskId}`);
    return response.data;
  } catch (err) {
    console.error("Error deleting task:", err.response || err);
    throw err;
  }
};

// Save soil sample data
export const saveSoilSampleData = async (data) => {
  try {
    const response = await API.post(`/api/soil-sample`, {
      userId: data["userId"],
      plantingObjId: data["plantingObjId"],
      name: data["name"],
      rows: data["rows"],
      doy: data["doy"],
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error saving soil sample data:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Get soil sample data
export const getSoilSampleData = async (userId, plantingObjId) => {
  try {
    const response = await API.get(`/api/soil-sample`, {
      params: { userId, plantingObjId }      
    });
    return response.data.data;
  } catch (error) {
    console.error(
      "Error getting soil sample data:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Get user saved units
export const getUserSavedUnits = async (userId) => {
  try {
    const response = await API.get(`/api/${userId}/favoriteUnit`);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching units:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Update irrigation parameters
export const updateIrrigationParams = async (
  irrigationDOY,
  irrigationMethod,
  irrigationDepth
) => {
  try {
    const response = await API.post(
      "/api/irrigationpy/update-irrigation-params",
      {
        irrigationDOY,
        irrigationMethod,
        irrigationDepth,
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating irrigation parameters:",
      error.response || error
    );
    throw error;
  }
};

// Update user favorite units
export const updateUserFavoriteUnits = async (userId, newUnit) => {
  try {
    const response = await API.put(`/api/${userId}/favoriteUnit`, { newUnit });
    return response.data;
  } catch (error) {
    console.error(
      "Error updating units:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Fetch user profile
export const fetchUserProfile = async (userId) => {
  try {
    const response = await API.get(`/api/profile/get-profile/${userId}`);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching user profile:",
      error.response?.data || error.message || error
    );
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (userData) => {
  try {
    const response = await API.put(`/api/profile/update-profile`, userData);
    return response.data;
  } catch (error) {
    console.error(
      "Error updating user profile:",
      error.response?.data || error.message || error
    );
    throw error;
  }
};

// Verify user’s current password
export const verifyUserPassword = async (userId, hashedPassword) => {
  if (!userId || !hashedPassword) {
    console.error("🔴 API Request Error: Missing user ID or password", {
      userId,
      hashedPassword,
    });
    return { success: false, error: "User ID and password are required." };
  }

  try {
    console.log("🔹 Sending API request to verify password...", {
      userId,
      hashedPassword,
    });
    const response = await API.post(`/api/profile/verify-password`, {
      userId,
      password: hashedPassword,
    });
    console.log("🔹 API Response from verify-password:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "🔴 Error in verifyUserPassword API:",
      error.response?.data || error.message || error
    );
    return { success: false, error: "API request failed." };
  }
};

// Update user password
export const updateUserPassword = async (
  userId,
  currentPassword,
  newPassword
) => {
  try {
    const response = await API.put(`/api/profile/update-password`, {
      userId,
      currentPassword,
      newPassword: md5(newPassword),
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error updating user password:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Register user
export const registerUser = async (userData) => {
  try {
    const hashedPassword = md5(userData.password);
    const response = await API.post(`/api/users/register`, {
      ...userData,
      password: hashedPassword,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error registering user:",
      error.response?.data || error.message || error
    );
    throw error;
  }
};

// Send forgot username email
export const sendForgotUsernameEmail = async (email, username) => {
  try {
    const response = await API.post(`/api/send-forgot-username-email`, {
      email,
      username,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error sending forgot username email:",
      error.response || error
    );
    return { success: false, message: "Failed to send email." };
  }
};

// Send reset password email
export const sendResetPasswordEmail = async (email, resetLink) => {
  try {
    const response = await API.post("/api/send-reset-password-email", {
      email,
      resetLink,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error sending reset password email:",
      error.response || error
    );
    return { success: false, message: "Failed to send email." };
  }
};

// Save irrigation params
export const saveIrrigationParams = async (irrigationTask) => {
  if (
    !irrigationTask?.irrigationEventDate ||
    !irrigationTask?.irrigationMethod
  ) {
    alert("Please select an irrigation date and method before calculating.");
    return;
  }

  try {
    console.log("Saving irrigation parameters...");
    const response = await API.post(
      `/api/irrigationpy/save-irrigation-params`,
      {
        irrigationDOY: getDayOfYear(
          new Date(irrigationTask.irrigationEventDate)
        ),
        irrigationMethod: irrigationTask.irrigationMethod,
      }
    );
    console.log("Irrigation parameters saved:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    alert("Error calculating irrigation. Check backend logs.");
    throw error;
  }
};

// Append CSV data
export const appendCSVData = async (useForecast = false) => {
  try {
    console.log("🔹 Appending CSV data...");
    const response = await API.post(`/api/irrigationpy/append-csvs`, {
      useForecast,
    });
    console.log("CSVs appended successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error appending CSVs:", error);
    throw error;
  }
};


// Calculate irrigation
export const calculateIrrigation = async () => {
  try {
    console.log("🔹 Running irrigation model...");
    const response = await API.post(`/api/irrigationpy/calculate-irrigation`);
    console.log("Irrigation model triggered successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error triggering irrigation model:", error);
    throw error;
  }
};

// Delete selected farms
export const deleteFarms = async (objid, farms) => {
  try {
    const response = await API.delete(`/api/deleteFarms`, {
      data: { objid, farms },
    });
    return response;
  } catch (error) {
    console.error(
      "Error deleting farms:",
      error.response || error.message || error
    );
    throw error;
  }
};

// Delete blocks
export const deleteBlocks = async (objid) => {
  try {
    const response = await API.delete(`/api/deleteBlocks`, {
      data: { objid },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error deleting blocks:",
      error.response || error.message || error
    );
    throw error;
  }
};

// Update farm name
export const updateFarmName = async (objid, farmName) => {
  try {
    const response = await API.post(`/api/update-farm-name`, {
      objid,
      farmName,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error updating farm name:",
      error.response || error.message || error
    );
    throw error;
  }
};

// Write CSV for selected planting data
export const writeCsv = async (plantingData) => {
  try {
    const response = await API.post(`/api/planting/writeCsv`, plantingData); 
    console.log("CSV written successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error writing CSV:", error.response || error.message || error);
    throw error;
  }
};

// Fetch & Save Daily Weather Data as CSV
export const fetchAndSaveWeatherData = async (unitId, objId) => {
  try {
    const response = await API.post(`/api/daily-weather/fetchAndSaveWeatherData`, {
      unitId,
      objId,
    });

    if (response.data) {
      console.log(" Weather CSV creation response:", response.data);
      return response.data;
    } else {
      console.error(" Failed to save weather CSV - no response body");
      return null;
    }
  } catch (error) {
    console.error(
      " Error saving weather CSV:",
      error.response?.data || error.message || error
    );
    return null;
  }
};

export const saveInitialSoilConditions = async (input) => {
  try {
    const response = await API.post("/api/save-initial-soil-conditions", input);
    return response.data;
  } catch (error) {
    console.error("Error saving initial soil conditions:", error.response?.data || error.message);
    throw error;
  }
};

export const fetchForecastDailySummary = async (unitId) => {
  try {
    const response = await API.get("/api/daily-weather/forecastDailySummary", {
      params: { unitId },
    });

    const forecastData = response.data;

    if (forecastData) {
      console.log("Forecast Daily Summary:", forecastData);

      // Forecast data is already written to forecast_weather.csv with precip & ETr
      // Just append the final combined CSV now
      await appendCSVData(true);

      return forecastData;
    }
  } catch (error) {
    console.error(
      "Error fetching forecast daily summary:",
      error.response?.data || error.message || error
    );

    // Fall back to normal CSV if forecast fails
    await appendCSVData(false);

    return null;
  }
};

export const deleteWaterSource = async (objid) => {
  try {
    // Ensure URL uses clean numeric ID
    const cleanId = objid.toString().replace(/\D/g, '');
    const response = await API.put(`/api/water-resources/${cleanId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting water source:', error.response?.data || error);
    throw error;
  }    
};
export const forecastCSV = async () => {
  try {        
    await API.get(`/api/forecast`);    
  } catch (error) {
    console.error('Error forecast CSV:', error.response?.data || error);
    throw error;
  }
}
export const saveEtForecast = async (body) => {
  try {        
    await API.post(`/api/forecast/saveEtForecast`, body);    
  } catch (error) {
    console.error('Error saveEtForecast:', error.response?.data || error);
    throw error;
  }
}