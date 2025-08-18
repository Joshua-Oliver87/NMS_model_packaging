import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import {
  Box,
  IconButton,
  Grid,
  FilledInput,
  FormControl,
  FormHelperText,
  InputAdornment,
  TextField,
  MenuItem,
  Button,
  Link,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import { AdvancedSettingsModal } from "./AdvancedSettingsModal.jsx"; //  Import the AdvancedSettingsModal
import {
  fetchCropData,
  fetchAdvancedSettings,
  savePlantingData,
  fetchPlantingInfoSettings,
  writeCsv,
} from "../util/apiUtil"; // Combined imports
import { UserContext } from "../context/UserContext.js";
import { globalUnits } from "../util/shared-utils.js";
import { convertDOYToDate } from "../util/shared-utils";
export const PlantingInfoModal = ({
  closeModal,
  selectedBlockId,
  plantingInfoSaved,
  plantingInfoModalData,
  selectedPlantingSettings,
  selectedPlantingAdvanceSettings,
  setIsPlantingInfoModalOpen,
  setSelectedBlockId,
}) => {
  const [plantName, setPlantName] = useState("");
  const [cropType, setCropType] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [emergenceDate, setEmergenceDate] = useState("");
  const [fullCanopyDate, setFullCanopyDate] = useState("");
  const [canopySenescence, setCanopySenescence] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [expectedYield, setExpectedYield] = useState("");
  const [gddBaseTemp, setGddBaseTemp] = useState("");
  const [gddUpperTemp, setGddUpperTemp] = useState("");
  const [cropList, setCropList] = useState([]); //  State for crop list
  const [selectedOption, setSelectedOption] = useState("paw_depletion"); // State for dropdown selection
  const [pawDepletionValue, setPawDepletionValue] = useState(""); // State for PAW Depletion input field
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false); //  State for Advanced Settings Modal
  const [autoIrrigation, setAutoIrrigation] = useState("START");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const { userSavedUnit } = useContext(UserContext);
  const currentYear = new Date().getFullYear();
const minDate = `${currentYear - 2}-01-01`;
const maxDate = `${currentYear + 2}-12-31`;
const modalRef = useRef();

const [dateErrors, setDateErrors] = useState({
  plantingDate: "",
  emergenceDate: "",
  fullCanopyDate: "",
  canopySenescence: "",
  maturityDate: "",
  harvestDate: "",
  startDate: "",    
  endDate: "", 
});
const validateDateField = (fieldName, dateValue) => {
  const enteredYear = new Date(dateValue).getFullYear();
  if (enteredYear < currentYear - 2 || enteredYear > currentYear + 2) {
    setDateErrors((prev) => ({
      ...prev,
      [fieldName]: `Enter a date between ${minDate} and ${maxDate}`,
    }));
  } else {
    setDateErrors((prev) => ({ ...prev, [fieldName]: "" }));
  }
};


  useEffect(() => {
    if (selectedPlantingSettings) {
      const currentYear = selectedPlantingSettings?.plantingDate
        ? new Date(selectedPlantingSettings.plantingDate).getFullYear()
        : new Date().getFullYear();
      console.log("selectedPlantingSettings:", selectedPlantingSettings);
      console.log("current year!", currentYear);
      const plantingDOY = selectedPlantingSettings?.plantingDOY;

      setPlantName(selectedPlantingSettings?.plantName);
      setCropType(selectedPlantingSettings.cropType);
      setCanopySenescence(selectedPlantingSettings.canopySenescence);
      setEmergenceDate(selectedPlantingSettings.emergenceDate);
      setExpectedYield(
        parseFloat(selectedPlantingSettings.expectedYield).toFixed(2)
      );
      setFullCanopyDate(selectedPlantingSettings.fullCanopyDate);
      setGddBaseTemp(
        parseFloat(selectedPlantingSettings.gddBaseTemp).toFixed(2)
      );
      setGddUpperTemp(
        parseFloat(selectedPlantingSettings.gddUpperTemp).toFixed(2)
      );
      setHarvestDate(selectedPlantingSettings.harvestDate);
      setMaturityDate(selectedPlantingSettings.maturityDate);
      setPawDepletionValue(
        selectedPlantingSettings.irrigationData["pawDepletionTrigger"]
      );

      // 🌱 Convert DOY to plantingDate (yyyy-mm-dd)
      if (plantingDOY) {
        const plantingDateFormatted = convertDOYToDate(
          currentYear,
          plantingDOY
        );
        setPlantingDate(plantingDateFormatted);
      } else {
        setPlantingDate(selectedPlantingSettings.plantingDate); // fallback
      }

      if (selectedPlantingSettings.startDate) {
            setStartDate(selectedPlantingSettings.startDate);
      }
      if (selectedPlantingSettings.endDate) {
        setEndDate(selectedPlantingSettings.endDate);
      }
    }
  }, [selectedPlantingSettings]);
  //  Fetch crop data on component mount
  useEffect(() => {
    const loadCropData = async () => {
      try {
        const crops = await fetchCropData();
        setCropList(crops);
      } catch (error) {
        console.error("Failed to load crop data", error);
      }
    };
    loadCropData();
  }, []);

  useEffect(() => {
    const loadAdvanceSettings = async () => {
      if (cropType && !selectedPlantingSettings) {
        try {
          const cropDetails = await fetchAdvancedSettings(cropType);
          console.log("Fetched crop details:", cropDetails);

          if (cropDetails) {
            setPawDepletionValue(cropDetails.PAWDEPLETION);
            setCropType(cropDetails.name);
            setCanopySenescence(getDateFromDOY(cropDetails.senescencedoy));
            setEmergenceDate(getDateFromDOY(cropDetails.emergencedoy));
            setExpectedYield(
              cropDetails.yield ? parseFloat(cropDetails.yield).toFixed(2) : 0
            );
            setFullCanopyDate(getDateFromDOY(cropDetails.fullcanopydoy));
            setGddBaseTemp(parseFloat(cropDetails.gddbase_c).toFixed(2));
            setGddUpperTemp(parseFloat(cropDetails.gddupperlimit_c).toFixed(2));
            setHarvestDate(getDateFromDOY(cropDetails.harvestdoy));
            setMaturityDate(getDateFromDOY(cropDetails.maturitydoy));
            setPlantingDate(getDateFromDOY(cropDetails.plantdoy));
          } else {
            console.warn("No advance settings found for the selected crop.");
          }
        } catch (error) {
          console.error("Error fetching advance settings:", error);
        }
      }
    };
    loadAdvanceSettings();
  }, [cropType]); // Fetch when cropType changes

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current?.contains(event.target)) return;

      const listbox = document.querySelector('[role="listbox"]');
      if (listbox?.contains(event.target)) return;

      closeModal();
    }
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeModal]);

  const getDateFromDOY = (doy) => {
    const currentYear = new Date().getFullYear();
    return new Date(currentYear, 0, doy).toISOString().split("T")[0];
  };

  const handleSave = async () => {
    if (!plantName || !cropType || !selectedBlockId) {
      alert(
        "Please enter the Planting Name, select a Crop Type, and choose a Block."
      );
      return;
    }

    try {
      const irrigationData = {
        irrigationMethod: selectedOption,
        pawDepletionTrigger: pawDepletionValue,
        refillDepth: "", // optional
      };

      const plantingInfo = {
        plantName,
        cropType,
        plantingDate,
        emergenceDate,
        fullCanopyDate,
        canopySenescence,
        maturityDate,
        harvestDate,
        expectedYield,
        gddBaseTemp,
        gddUpperTemp,
        plantingAreaId: selectedBlockId,
        startDate,
        endDate,
        irrigationData: irrigationData,
        ...selectedPlantingAdvanceSettings,
      };

      console.log("Debug Payload:", plantingInfo);

      //  1. Save the planting data
      await savePlantingData(plantingInfo);
      // console.log(" Planting data saved successfully");

      //  2. Generate the CSV
      await writeCsv(plantingInfo);
      // console.log(" CSV generated successfully");

      plantingInfoSaved();
      // alert("Planting data saved and CSV generated successfully!");
      closeModal();
    } catch (error) {
      console.error(
        " Error during save or CSV generation:",
        error.response || error
      );
      alert("Error saving planting data or generating CSV. Please try again.");
    }
  };

  return (
    <Box
      ref={modalRef}
      sx={{
        position: "absolute",
        top: "88%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "50%", // Wider modal
        bgcolor: "background.paper",
        borderRadius: "25px",
        boxShadow: 24,
        p: 3,
        zIndex: 1300,
        overflowY: "auto",
        maxHeight: "68vh",
      }}
    >
      <IconButton
        aria-label="close"
        onClick={() => {
          closeModal();
          setIsPlantingInfoModalOpen(false);
          setSelectedBlockId(null);
        }}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          color: "#888",
          backgroundColor: "transparent",
          transition: "transform 0.2s ease-in-out, background-color 0.2s",
          "&:hover": {
            color: "#a60f2d",
            backgroundColor: "rgba(166, 15, 45, 0.1)",
            transform: "scale(1.2)",
          },
        }}
      >
        <CloseIcon />
      </IconButton>
      <Typography
        variant="h6"
        sx={{
          fontSize: "1.3rem", // Increased font size
          fontWeight: "bold", // Bold text
        }}
        gutterBottom
      >
        Crop Information
      </Typography>

      {/* Use MUI Grid for a two-column layout */}
      <Grid container rowSpacing={0} columnSpacing={3}>
        {/* Planting Name */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Typography variant="subtitle2">Crop Name</Typography>
            <TextField
              required
              variant="outlined"
              value={plantName}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[a-zA-Z0-9-_ ]*$/.test(value) || value === "") {
                  setPlantName(value);
                }
              }}
              sx={{
                borderLeft: "3px solid #a60f2d",
                borderRadius: 1,
              }}
              error={!/^[a-zA-Z0-9-_ ]*$/.test(plantName)}
              helperText={
                !/^[a-zA-Z0-9-_ ]*$/.test(plantName)
                  ? "Only letters, numbers, hyphens, underscores, and spaces are allowed"
                  : ""
              }
            />
          </FormControl>
        </Grid>

        {/* Crop Type */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Typography variant="subtitle2">Crop Type</Typography>
            <TextField
              select
              required
              variant="outlined"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              sx={{
                borderLeft: "3px solid #a60f2d",
                borderRadius: 1,
              }}
            >
              {cropList.length > 0 ? (
                cropList.map((crop) => (
                  <MenuItem key={crop.id} value={crop.name}>
                    {crop.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>Loading crops...</MenuItem>
              )}
            </TextField>
          </FormControl>
        </Grid>

        {/* Planting Date */}
        <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={Boolean(dateErrors.plantingDate)}>
          <Typography variant="subtitle2">Planting Date</Typography>
          <TextField
            required
            type="date"
            variant="outlined"
            value={plantingDate}
            onChange={(e) => setPlantingDate(e.target.value)}
            onBlur={() => validateDateField("plantingDate", plantingDate)}
            inputProps={{ min: minDate, max: maxDate }}
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
            helperText={dateErrors.plantingDate}
          />
        </FormControl>
        </Grid>

        {/* Emergence Date */}
        <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={Boolean(dateErrors.emergenceDate)}>
          <Typography variant="subtitle2">Emergence Date</Typography>
          <TextField
            required
            type="date"
            variant="outlined"
            value={emergenceDate}
            onChange={(e) => setEmergenceDate(e.target.value)}
            onBlur={() => validateDateField("emergenceDate", emergenceDate)}
            inputProps={{ min: minDate, max: maxDate }}
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
            helperText={dateErrors.emergenceDate}
          />
        </FormControl>
        </Grid>

        {/* Full Canopy Date */}
        <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={Boolean(dateErrors.fullCanopyDate)}>
          <Typography variant="subtitle2">Full Canopy Date</Typography>
          <TextField
            required
            type="date"
            variant="outlined"
            value={fullCanopyDate}
            onChange={(e) => setFullCanopyDate(e.target.value)}
            onBlur={() => validateDateField("fullCanopyDate", fullCanopyDate)}
            inputProps={{ min: minDate, max: maxDate }}
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
            helperText={dateErrors.fullCanopyDate}
          />
        </FormControl>
        </Grid>

        {/* Canopy Senescence Date */}
        <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={Boolean(dateErrors.canopySenescence)}>
          <Typography variant="subtitle2">Canopy Senescence Date</Typography>
          <TextField
            required
            type="date"
            variant="outlined"
            value={canopySenescence}
            onChange={(e) => setCanopySenescence(e.target.value)}
            onBlur={() => validateDateField("canopySenescence", canopySenescence)}
            inputProps={{ min: minDate, max: maxDate }}
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
            helperText={dateErrors.canopySenescence}
          />
        </FormControl>
        </Grid>

        {/* Maturity Date */}
        <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={Boolean(dateErrors.maturityDate)}>
          <Typography variant="subtitle2">Maturity Date</Typography>
          <TextField
            required
            type="date"
            variant="outlined"
            value={maturityDate}
            onChange={(e) => setMaturityDate(e.target.value)}
            onBlur={() => validateDateField("maturityDate", maturityDate)}
            inputProps={{ min: minDate, max: maxDate }}
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
            helperText={dateErrors.maturityDate}
          />
        </FormControl>
        </Grid>

        {/* Harvest Date */}
        <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={Boolean(dateErrors.harvestDate)}>
          <Typography variant="subtitle2">Harvest Date</Typography>
          <TextField
            required
            type="date"
            variant="outlined"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            onBlur={() => validateDateField("harvestDate", harvestDate)}
            inputProps={{ min: minDate, max: maxDate }}
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
            helperText={dateErrors.harvestDate}
          />
        </FormControl>
        </Grid>

        {/* Expected Yield */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Typography variant="subtitle2">Expected Yield</Typography>
            <FilledInput
              type="text"
              value={expectedYield}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*\.?\d*$/.test(value)) {
                  setExpectedYield(value);
                }
              }}
              onBlur={() => {
                setExpectedYield((prev) =>
                  prev ? parseFloat(prev).toFixed(2) : ""
                );
              }} // Converts input to 2 decimal places on blur
              disableUnderline
              sx={{
                borderLeft: "3px solid #a60f2d",
                borderRadius: 1,
              }}
              endAdornment={
                <InputAdornment position="end">
                  {`${globalUnits[userSavedUnit]?.area}`}
                </InputAdornment>
              }
            />
          </FormControl>
        </Grid>

        {/* GDD Base Temperature */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Typography variant="subtitle2">
              Growing Degree Days (Base Temperature)
            </Typography>
            <FilledInput
              type="number"
              value={gddBaseTemp}
              onChange={(e) => {
                const val = e.target.value;
                setGddBaseTemp(val ? parseFloat(val).toFixed(2) : "");
              }}
              disableUnderline
              disabled // This makes the field read-only
              sx={{
                borderLeft: "3px solid #a60f2d",
                borderRadius: 1,
                backgroundColor: "#f5f5f5", // Optional: Grey background for clarity
                cursor: "not-allowed", // Optional: Cursor change for better UX
              }}
              endAdornment={
                <InputAdornment position="end">
                  {`${globalUnits[userSavedUnit]?.temperature}`}
                </InputAdornment>
              }
            />
          </FormControl>
        </Grid>

        {/* GDD Upper Limit Temperature */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Typography variant="subtitle2">
              Growing Degree Days (Upper Temperature Limit)
            </Typography>
            <FilledInput
              type="number"
              value={gddUpperTemp}
              disableUnderline
              disabled // Makes the field read-only
              sx={{
                borderLeft: "3px solid #a60f2d",
                borderRadius: 1,
                backgroundColor: "#f5f5f5", // Optional: Light grey background to indicate it's disabled
                cursor: "not-allowed", // Optional: Changes cursor to indicate non-editable field
              }}
              endAdornment={
                <InputAdornment position="end">
                  {`${globalUnits[userSavedUnit]?.temperature}`}
                </InputAdornment>
              }
            />
          </FormControl>
        </Grid>

        {/* Dropdown above Advanced Settings */}
        {/* Dropdown for PAW Depletion Selection */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Typography variant="subtitle2">
              Automatic Irrigation Method
            </Typography>
            <TextField
              select
              variant="outlined"
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              sx={{ borderLeft: "3px solid #a60f2d", borderRadius: 1 }}
            >
              <MenuItem value="paw_depletion">Soil Water Depletion</MenuItem>
              <MenuItem value="water_stress">Water Stress</MenuItem>
              <MenuItem value="auto_fill">Soil Depth(in)</MenuItem>
            </TextField>
          </FormControl>
        </Grid>
        {/* New Auto Irrigation Dropdown */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Typography variant="subtitle2">Auto Irrigation</Typography>
            <TextField
              select
              variant="outlined"
              value={autoIrrigation}
              onChange={(e) => setAutoIrrigation(e.target.value)}
              sx={{ borderLeft: "3px solid #a60f2d", borderRadius: 1 }}
            >
              <MenuItem value="START">START</MenuItem>
              <MenuItem value="STOP">STOP</MenuItem>
              <MenuItem value="REFILL">REFILL</MenuItem>
            </TextField>
          </FormControl>
        </Grid>
        {/* Start Date Field */}
        <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={Boolean(dateErrors.startDate)}>
          <Typography variant="subtitle2">Start Date</Typography>
          <TextField
            type="date"
            variant="outlined"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onBlur={() => validateDateField("startDate", startDate)}
            inputProps={{ min: minDate, max: maxDate }}
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
            helperText={dateErrors.startDate}
          />
        </FormControl>
        </Grid>

        {/* End Date Field */}
        <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={Boolean(dateErrors.endDate)}>
          <Typography variant="subtitle2">End Date</Typography>
          <TextField
            type="date"
            variant="outlined"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            onBlur={() => validateDateField("endDate", endDate)}
            inputProps={{ min: minDate, max: maxDate }}
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
            helperText={dateErrors.endDate}
          />
        </FormControl>
        </Grid>
        {/* TextField appears only if "PAW Depletion" is selected */}
        {selectedOption === "paw_depletion" && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Typography variant="subtitle2">
                Soil Water Depletion %
              </Typography>
              <TextField
                type="number"
                variant="outlined"
                value={pawDepletionValue}
                onChange={(e) => setPawDepletionValue(e.target.value)}
                sx={{ borderLeft: "3px solid #a60f2d", borderRadius: 1 }}
                placeholder="Enter PAW Depletion Value"
              />
            </FormControl>
          </Grid>
        )}

        {/* Advanced Settings Link */}
        <Grid item xs={12} sm={6} display="flex" alignItems="center">
          <FormControl>
            <Link
              href="#"
              underline="hover"
              style={{ fontSize: "1rem" }}
              onClick={() => setIsAdvancedSettingsOpen(true)}
            >
              Advanced Settings
            </Link>
          </FormControl>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box mt={3} display="flex" justifyContent="space-between">
        <Button
          variant="outlined"
          color="primary"
          onClick={closeModal}
          sx={{
            backgroundColor: "#6c757d",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "5px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          sx={{
            backgroundColor: "#a60f2d",
            color: "white",
            padding: "8px 25px",
            border: "none",
            borderRadius: "5px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Save
        </Button>
      </Box>

      {/* Advanced Settings Modal */}
      {isAdvancedSettingsOpen && (
        <AdvancedSettingsModal
          closeModal={() => setIsAdvancedSettingsOpen(false)}
          selectedCrop={cropType}
        />
      )}
    </Box>
  );
};
