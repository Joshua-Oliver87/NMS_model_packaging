import { spawn } from "child_process";
import { fetchDataFromDb } from "./dbConnection.js";
import os from "os";

const conversionFactors = {
  "in_mm": 25.4,
  "mm_in": 0.0393701,
  "mph_kmph": 1.60934,
  "kmph_mph": 0.62137,
  "kg/ha_lb/acre": 0.89218,
  "lb/acre_kg/ha": 1.12085,
  "m/m_ft/ft": 0.356, // TBD - calculate
  "ft/ft_m/m": 1.89 // TBD - calculate
};

export const convertUnits = {
  temperature: (value, fromUnit, toUnit) => {
    toUnit = toUnit === "English" ? "°F" : "°C";    
    const num = parseFloat(value);
    if(fromUnit === "°C" && toUnit === "°F") {
      return {units: toUnit, value: (num * 9)/5 + 32};
    }
    else if(fromUnit === "°F" && toUnit === "°C"){
      return {units: toUnit, value: (num - 32) * 5/9};
    }  
    else{
      return {units: toUnit, value: num};
    }  
  },
  area: (value, fromUnit, toUnit) => {
    toUnit = toUnit === "English" ? "lb/acre" : "kg/ha";    
    const key = `${fromUnit}_${toUnit}`;
    const num = parseFloat(value);
    return {units: toUnit, value: conversionFactors[key] ? num * conversionFactors[key]: num};
  },  
  length: (value, fromUnit, toUnit) => {
    toUnit = toUnit === "English" ? "in" : "mm";    
    const key = `${fromUnit}_${toUnit}`;
    const num = parseFloat(value);    
    return {units: toUnit, value: conversionFactors[key] ? num * conversionFactors[key]: num};
  }, 
  speed: (value, fromUnit, toUnit) => {
    toUnit = toUnit === "English" ? "mph" : "kmph";    
    const key = `${fromUnit}_${toUnit}`;
    const num = parseFloat(value);    
    return {units: toUnit, value: conversionFactors[key] ? num * conversionFactors[key]: num};
  }, 
  newConversion: (value, fromUnit, toUnit) => {
    toUnit = toUnit === "English" ? "ft/ft" : "m/m";    
    const key = `${fromUnit}_${toUnit}`;
    const num = parseFloat(value);
    return {units: toUnit, value: conversionFactors[key] ? num * conversionFactors[key]: num};
  }, 
}
export const storeSoilInfo = async () => {
  return new Promise((resolve, reject) => {
    const pythonCommand = os.platform() === "win32" ? "python" : "/home/ec2-user/awn_nms/venv/bin/python3";

    const pythonProcess = spawn(pythonCommand, [
      "routes/fetch_soil_data.py", // Adjust the path as needed      
    ]);


    let errorOutput = "";

    // Collect script stderr data
    pythonProcess.stderr.on("data", (data) => {
      console.log("Collect script stderr data", data);
      errorOutput += data.toString();
      console.error("Python script error:", data.toString());
    });

    // Handle script completion
    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        console.error(`Error output: ${errorOutput}`);
        reject({ message: "Failed to store soil data." });
      }
      else {
        console.log(`Python script succesful`);
        resolve({ message: "Successfully stored soil data." })
      }
    });
  });
}

export const fetchDailyWeatherData = async (unitId, startDate, endDate) => {
  try {    
    const query = `
          SELECT 
            DATE(JULDATE) AS Date, 
            ROUND(ETR, 2) AS ETR, 
            ROUND(ETO, 2) AS ETO
          FROM awndaily.station${unitId}daily 
          WHERE JULDATE BETWEEN '${startDate}' AND '${endDate}' 
          ORDER BY JULDATE;
        `;
        console.log(query);
    const weatherData = await fetchDataFromDb(query);
    return weatherData;
  }
  catch (err) {
    throw err;
  }
}

