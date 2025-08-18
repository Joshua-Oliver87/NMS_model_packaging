const express = require('express');
const app = express();
const path = require("path");
const fs = require("fs");  //  Add this line if missing

app.use(express.json()); // Middleware to parse JSON bodies

const { fetchDataFromDb, bulkInsertToDb } = require('./dbConnection');
require('dotenv').config();

const PlantingData = express.Router();

const writeCsv = async (plantingData) => {
    console.log("inside writeCSV");
    try {
        if (!plantingData || Object.keys(plantingData).length === 0) {
            throw new Error("Missing planting data for CSV generation");
        }

        console.log("Received Planting Data:", plantingData);

        // Define Header Mappings with Crop Indexing
        const headerMappings = {
            name: "name",
            yield: "expected_yield",
            plantdoy: "planting_doy",
            emergencedoy: "emergence_doy",
            fullcanopydoy: "full_canopy_doy",
            senescencedoy: "begin_senescence_doy",
            maturitydoy: "maturity_doy",
            harvestdoy: "harvest_doy",
            midkc: "midseason_crop_coefficient",
            maxcwu: "maximum_crop_water_uptake_mm/day",
            lwposc: "leaf_water_potential_onset_of_stomatal_closure_j/kg",
            lwppw: "leaf_water_potential_permanent_wilting_j/kg",
            sd: "seeding_depth_m",
            irdgs: "initial_root_depth_m",
            mrd: "maximum_root_depth_m",
            mch: "maximum_crop_height_m",
            igcc: "initial_green_canopy_cover_fraction_0_1",
            maxgcc: "maximum_green_canopy_cover_fraction_0_1",
            matgcc: "maturity_green_canopy_cover_fraction_0_1",
            tue: "transpiration_use_efficiency_kg/kg",
            spfdvpd: "slope_of_daytime_vpd_power_function",
            maxne: "maximum_n_concentration_at_emergence_kg/kg",
            critne: "critical_n_concentration_at_emergence_kg/kg",
            minne: "minimum_n_concentration_at_emergence_kg/kg",
            bdmaxn: "biomass_start_dilution_maximum_n_concentration_mg/ha",
            bdcritn: "biomass_start_dilution_critical_n_concentration_mg/ha",
            bdminn: "biomass_start_dilution_minimum_n_concentration_mg/ha",
            nds: "n_dilution_slope",
            maxnm: "maximum_n_concentration_at_maturity_kg/kg",
            critnm: "critical_n_concentration_at_maturity_kg/kg",
            minnm: "minimum_n_concentration_at_maturity_kg/kg"
        };

        // Determine Number of Crops
        const numberOfCrops = plantingData.number_of_crops || 1;
        console.log("Number of Crops:", numberOfCrops);

        // Dynamically Rename Headers and assign values from the plantingData
        const formattedData = {};
        for (let cropIndex = 1; cropIndex <= numberOfCrops; cropIndex++) {
            Object.entries(headerMappings).forEach(([originalKey, newKey]) => {
                const dynamicKey = `crop_${cropIndex}_${newKey}`;
                formattedData[dynamicKey] = plantingData[originalKey] ?? ""; // Default to empty string if missing
            });
        }

        console.log("Formatted CSV Data:", formattedData);

        // Define Output Directory and CSV File Path
        const outputDir = path.resolve(__dirname, "../input_for_python_model"); // One level up
        const csvPath = path.join(outputDir, "cropdata.csv");

        // Ensure Directory Exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate CSV Content
        const csvHeaders = Object.keys(formattedData);
        const csvValues = Object.values(formattedData);
        const csvContent = `${csvHeaders.join(",")}\n${csvValues.join(",")}`;

        // Write to CSV
        fs.writeFileSync(csvPath, csvContent);

        console.log(`CSV successfully written at: ${csvPath}`);

        return { 
            message: "CSV successfully written!", 
            csvPath: csvPath,  // Return file path
            csvContent: csvContent // Return CSV content for verification
        };
    } catch (error) {
        console.error("Error writing CSV:", error);
        throw new Error(`Error writing CSV: ${error.message}`);
    }
};


// Function to convert date string to day of year
const convertDateToDoy = (dateStr) => {
    const date = new Date(dateStr); // Convert the string to a Date object
    const start = new Date(date.getFullYear(), 0, 0); // January 1st of the same year
    const diff = date - start; // Time difference between the date and the start of the year
    const oneDay = 1000 * 60 * 60 * 24; // Number of milliseconds in one day
    const dayOfYear = Math.floor(diff / oneDay); // Calculate DOY
    return dayOfYear;
};

const writeAutoIrrigationParams = async (irrigationData) => {
    try {
        const { 
            startDate, 
            endDate, 
            irrigationMethod, 
            pawDepletionTrigger, 
            refillDepth, 
            cropNumber = 1 
        } = irrigationData;

        // Default values for missing fields
        const defaultValues = {
            startDate: startDate || "",
            endDate: endDate || "",
            irrigationMethod: irrigationMethod || "paw_depletion", // Default to "paw_depletion"
            pawDepletionTrigger: pawDepletionTrigger || 0,
            refillDepth: refillDepth || 0,
            cropNumber: cropNumber || 1
        };

        // Map irrigationMethod to 1 for "PAW" and 2 for "CWSI"
        const methodValue = defaultValues.irrigationMethod === "CWSI" ? 2 : 1;

        let irrigationEvents = [];
        let eventCount = 0;

        // Process start date (Event 1)
        if (defaultValues.startDate) {
            eventCount++;
            const startDoy = convertDateToDoy(defaultValues.startDate);
            const startEvent = {
                doy: startDoy,
                autoIrrigation: "START",
                method: methodValue, // Use mapped method value (1 or 2)
                pawDepletion: defaultValues.pawDepletionTrigger,
                refillDepth: defaultValues.refillDepth,
                cropNumber: defaultValues.cropNumber
            };
            irrigationEvents.push(startEvent);
        }

        // Process end date (Event 2)
        if (defaultValues.endDate) {
            eventCount++;
            const endDoy = convertDateToDoy(defaultValues.endDate);
            irrigationEvents.push({
                doy: endDoy,
                autoIrrigation: "STOP",
                method: methodValue, // Use mapped method value (1 or 2)
                pawDepletion: 0,
                refillDepth: 0,
                cwsi: 0,
                cropNumber: defaultValues.cropNumber
            });
        }

        // Generate headers for dynamic events, but omit empty fields
        let headerParts = [];
        let dataParts = [];
        const maxEvents = 4; // Max number of events, you can change this value if required

        // Create header based on the number of events
        for (let i = 1; i <= eventCount; i++) {
            if (irrigationEvents[i-1].doy) {
                headerParts.push(
                    `irrigation_event_${i}_doy`,
                    `irrigation_event_${i}_auto_irrigation`,
                    `irrigation_event_${i}_method`,
                    `irrigation_event_${i}_max_paw_depletion`,
                    `irrigation_event_${i}_cwsi`,
                    `irrigation_event_${i}_refill_depth`,
                    `irrigation_event_${i}_crop_number`
                );
            }
        }

        // Create data row based on events, omitting empty values
        const emptyData = [];
        irrigationEvents.forEach((event, i) => {
            const baseIndex = i * 7;
            // Only add values to the data row if they exist
            emptyData.push(event.doy || 0);  // Always push a value, default to 0
            emptyData.push(event.autoIrrigation || "STOP");  // Always push a value, default to "STOP" if missing
            emptyData.push(event.method || 1);  // Default method if missing
            emptyData.push(event.pawDepletion || 0);  // Ensure pawDepletion is defaulted to 0 if missing
            emptyData.push(event.cwsi || 0);  // Default to 0 if cwsi is empty
            emptyData.push(event.refillDepth || 0); // Default to 0 if refillDepth is empty
            emptyData.push(event.cropNumber || 1);
        });

        // Define the path for the CSV file
        const csvPath = path.resolve(__dirname, "../input_for_python_model/auto_irrigation_params.csv");

        // Ensure directory exists
        const outputDir = path.dirname(csvPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate the CSV content
        const csvContent = `${headerParts.join(",")}\n${emptyData.join(",")}`;

        // Write to CSV
        fs.writeFileSync(csvPath, csvContent);

        console.log(`Auto Irrigation CSV successfully written at: ${csvPath}`);
        return {
            message: "CSV for auto irrigation parameters successfully written!",
            csvPath,
            csvContent
        };
    } catch (error) {
        console.error("Error writing Auto Irrigation CSV:", error);
        throw new Error(`Error writing Auto Irrigation CSV: ${error.message}`);
    }
};


PlantingData.get('/get-planting-info/:blockId', async (req, res) => {
    try {
        const {blockId} = req.params;
        console.log("here blockId", blockId);
        const query = `SELECT * FROM table_planting where plantingarea_id = ${blockId} AND status = 1`;
        const results = await fetchDataFromDb(query);        
        res.json(results);
    } catch (err) {
        console.error('Error fetching planting info data:', err);
        res.status(500).send('Error fetching planting info data');
    }
});

PlantingData.get('/get-planting-settings', async (req, res) => {
    try {
        const {plantingId} = req.query;
        console.log("here plantingId", plantingId);
        
        const query = `SELECT * FROM table_planting_settings WHERE planting_id=${plantingId} AND status = 1`; 
        const results = await fetchDataFromDb(query);
        console.log("get-planting-settings results", results);
        res.json(results);
    } catch (err) {
        console.error('Error fetching planting info settings data:', err);
        res.status(500).send(`Error fetching planting info settings data - ${err.message}`);
    }
});
/**
 *  Insert Planting Data
 * - `dateadded`: Current date
 * - `lastupdated`: NULL
 * - `ranch_id`: NULL
 * - `status`: 1
 */
PlantingData.post('/save', async (req, res) => {
    const {
        plantName, 
        plantingAreaId, 
        irrigationData, // Add irrigationData here from the request body
        startDate,
        endDate,
        ...values
    } = req.body;

    if (startDate) values.startDate = startDate;
    if (endDate)   values.endDate   = endDate;

    console.log("Request Body:", req.body);

    const getDayOfYear = (dateStr) => {
        const date = new Date(dateStr);
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    };

    // Override DOY values using provided date fields
    if (values.plantingDate) {
        values.plantdoy = getDayOfYear(values.plantingDate);
    }
    if (values.emergenceDate) {
        values.emergencedoy = getDayOfYear(values.emergenceDate);
    }
    if (values.fullCanopyDate) {
        values.fullcanopydoy = getDayOfYear(values.fullCanopyDate);
    }
    if (values.canopySenescence) {
        values.senescencedoy = getDayOfYear(values.canopySenescence);
    }
    if (values.maturityDate) {
        values.maturitydoy = getDayOfYear(values.maturityDate);
    }
    if (values.harvestDate) {
        values.harvestdoy = getDayOfYear(values.harvestDate);
    }

    try {
        // Check if plantingAreaId exists in table_planting_area
        const checkQuery = `SELECT objid FROM table_planting_area WHERE objid = ?`;
        let result = await fetchDataFromDb(checkQuery, [plantingAreaId]);

        if (result.length === 0) {
            return res.status(404).json({ message: "Planting Area ID not found." });
        }

        // Insert planting data into the database
        const insertQuery = `
            INSERT INTO table_planting (name, plantingarea_id, status)
            VALUES (?, ?, 1)
        `;

        result = await fetchDataFromDb(insertQuery, [plantName, plantingAreaId]);

        if (result.affectedRows > 0) {
            const plantingAreaSettingsId = Number(result.insertId);
            console.log({ message: `Planting area created successfully with plantingAreaId ${plantingAreaSettingsId}` });

            const records = Object.keys(values).map(key => {
                return [plantingAreaSettingsId, key, values[key], 1];
            });

            const query = `INSERT INTO table_planting_settings (planting_id, name, value, status)
            VALUES (?, ?, ?, 1)`;

            const response = await bulkInsertToDb(query, records);

            const finalResponse = `Planting area settings created successfully with plantingAreaSettingsId ${plantingAreaSettingsId}`;
            console.log({ message: finalResponse });

            let writeIrrigationResponse = null;

            // Call /writeAutoIrrigationParams with the relevant irrigation data
            if (irrigationData) {
                writeIrrigationResponse = await writeAutoIrrigationParams(irrigationData);
                console.log('Auto Irrigation Response:', writeIrrigationResponse);
            }

            // Define the data object with all saved information
            const data = {
                plantingId: plantingAreaSettingsId,
                plantName,
                plantingAreaId,
                settings: { ...values }, // Spread values to include all key-value pairs
                irrigationData: irrigationData || null // Include irrigation data if provided
            };

            return res.status(201).json({
                message: finalResponse,
                writeIrrigationMessage: irrigationData ? writeIrrigationResponse.message : "No irrigation data provided",
                data // Now correctly defined and included
            });
        }

        return res.status(500).json({ message: "Unexpected database behavior" });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: "Error saving planting data." });
    }
});


/**
 * Generate CSV for Planting Data
 */
PlantingData.post('/writeCsv', async (req, res) => {
    const plantingData = req.body;

    if (!plantingData || Object.keys(plantingData).length === 0) {
        return res.status(400).json({ error: "Missing planting data for CSV generation." });
    }

    const getDayOfYear = (dateStr) => {
        const date = new Date(dateStr);
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    };

    // Override DOY values using provided date fields
    if (plantingData.plantingDate) {
        plantingData.plantdoy = getDayOfYear(plantingData.plantingDate);
    }
    if (plantingData.emergenceDate) {
        plantingData.emergencedoy = getDayOfYear(plantingData.emergenceDate);
    }
    if (plantingData.fullCanopyDate) {
        plantingData.fullcanopydoy = getDayOfYear(plantingData.fullCanopyDate);
    }
    if (plantingData.canopySenescence) {
        plantingData.senescencedoy = getDayOfYear(plantingData.canopySenescence);
    }
    if (plantingData.maturityDate) {
        plantingData.maturitydoy = getDayOfYear(plantingData.maturityDate);
    }
    if (plantingData.harvestDate) {
        plantingData.harvestdoy = getDayOfYear(plantingData.harvestDate);
    }

    try {
        const result = await writeCsv(plantingData);
        return res.status(200).json({
            message: result.message,
            csvPath: result.csvPath,
            csvContent: result.csvContent
        });
    } catch (error) {
        console.error("Error writing CSV:", error);
        return res.status(500).json({
            error: "Failed to generate CSV.",
            details: error.message
        });
    }
});

PlantingData.delete('/delete/:plantingId', async (req, res) => {
    const { plantingId } = req.params;
  
    try {
      // soft‐delete the settings
      await fetchDataFromDb(
        `UPDATE table_planting_settings
           SET status = -1
         WHERE planting_id = ?`,
        [plantingId]
      );
  
      // soft‐delete the planting itself
      await fetchDataFromDb(
        `UPDATE table_planting
           SET status = -1
         WHERE objid = ?`,
        [plantingId]
      );
  
      return res
        .status(200)
        .json({ message: 'Planting info and its settings were soft-deleted.' });
    } catch (err) {
      console.error('Error soft-deleting planting info:', err);
      return res
        .status(500)
        .json({ error: 'Failed to soft-delete planting info.' });
    }
  });

module.exports = PlantingData;