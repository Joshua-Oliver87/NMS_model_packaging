import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Button,
  Modal,
  Tabs,
  Tab,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  TextField,
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

import CloseIcon from "@mui/icons-material/Close";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import GetAppIcon from "@mui/icons-material/GetApp"; // Added for download icon
import OutputCharts from "./OutputCharts";
import { fetchForecastDailySummary, fetchSeasonalOutputData, forecastCSV, saveEtForecast } from "../util/apiUtil";
import { calculateIrrigation } from "../util/apiUtil"; // Adjust path if needed


import {
  convertDOYToDate,
  dropDownOptions,
  getCurrentDateForSimulation,
  getCustomDateForSimulation,
  getCustomDateForTasks,
  getDayOfYear,
  getFrequencyDatesForSimulation,
  globalUnits,
} from "../util/shared-utils";
import { Label } from "./Label";
import { UserContext } from "../context/UserContext";

// Add dependency for CSV and PDF generation (you'll need to install these packages)
import Papa from "papaparse";
import jsPDF from "jspdf";

import { createTheme } from "@mui/material";

const theme = createTheme({
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "white",
        },
      },
    },
  },
});


const SimulationOutputModal = ({
  closeModal,
  simulationData = [],
  plantingDate,
  cropType = "",
  budgetData = [],
  nearestStationUnitId = 0
}) => {
  const { userSavedUnit } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState(0);
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedData, setSortedData] = useState([]);
  const [simulationDataFrequency, setSimulationDataFrequency] = useState(
    dropDownOptions[0]
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [frequencyStartDate, setFrequencyStartDate] = useState(null);
  const [frequencyEndDate, setFrequencyEndDate] = useState(null);
  const [simulationOutputData, setSimulationOutputData] = useState(null);
  const [seasonalOutputData, setSeasonalOutputData] = useState(null);
  const [budgetOutputData, setBudgetOutputData] = useState(null);
  const [irrigationBudgetData, setIrrigationBudgetData] = useState(null);
  const currentYear = new Date().getFullYear();
const minDate = `${currentYear - 2}-01-01`;
const maxDate = `${currentYear + 2}-12-31`;
const [dateErrors, setDateErrors] = useState({
  frequencyStartDate: "",
  frequencyEndDate: "",
});
const validateDate = (fieldName, value) => {
  const year = new Date(value).getFullYear();
  if (year < currentYear - 2 || year > currentYear + 2) {
    setDateErrors((prev) => ({
      ...prev,
      [fieldName]: `Enter a date between ${minDate} and ${maxDate}`,
    }));
  } else {
    setDateErrors((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  }
};

  const isCalculateEnabled =
  frequencyStartDate &&
  frequencyEndDate &&
  new Date(frequencyStartDate) < new Date(frequencyEndDate);
  
  const handleCalculateClick = async () => {
    console.log("⏳ Calculate button clicked");
    setLoading(true);
  
    try {
      
        const dateAfter7Days = getCurrentDateForSimulation(new Date(new Date().setDate(new Date().getDate() + 7)));
        const frequencyStart = getCustomDateForSimulation(frequencyStartDate);
        const frequencyEnd = getCustomDateForSimulation(frequencyEndDate);
        const currentDate = getCurrentDateForSimulation(new Date());
        const startDateInRange = frequencyStart >= currentDate && frequencyStart <= dateAfter7Days;
        const endDateInRange = frequencyEnd >= currentDate && frequencyEnd <= dateAfter7Days;
        if (
          frequencyStart &&
          frequencyEnd &&
          frequencyStart < frequencyEnd
        ) {          
          if(startDateInRange && endDateInRange) {
            // call new API function to get forecast data
            /*await forecastCSV();
            await saveEtForecast({
              unitId: nearestStationUnitId,
              startDate: frequencyStartDate,
              endDate: frequencyEndDate,
            });
            await fetchForecastDailySummary(nearestStationUnitId);   */
            console.log("Forecast data fetched successfully!");         
          }          
          let data = await fetchSeasonalOutputData();    
          if(data) {
            const simulationData = data.daily_data.filter(
              (info) => info["Crop Number"] === cropType
            );
            const seasonalData = data.seasonal_data.find(
              (info) => info["Crop Number"] === cropType
            );
            setSeasonalOutputData([seasonalData]);
            setSimulationOutputData(simulationData);
            setBudgetOutputData(data.budget_data);
            handleSimulationData();
            handleSimulationOutputBudgetData();
          }         
        }
    } catch (err) {
      console.error("❌ Error during irrigation calculation:", err);
      setSnackbarMessage("Failed to give output");  // Set Snackbar Message
      setSnackbarOpen(true);                         // Open Snackbar
    } finally {
      setLoading(false);
    }
  };
  

//   const [nearestWeatherStations, setNearestWeatherStations] = useState([]);
// const [nearestWeatherStation, setNearestWeatherStation] = useState("");

// const handleStationSelection = async (e) => {
//   const unitId = e.target.value;
//   setNearestWeatherStation(unitId);
//   localStorage.setItem("unitId", unitId);
//   // optionally call fetchAndSaveWeatherData(unitId) if needed here
// };

  // State for download menu
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Handle download menu open/close
  const handleDownloadClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setAnchorEl(null);
  };

  // Function to generate CSV data based on active tab
  const generateCSVData = () => {
    let headers = [];
    let data = [];

    if (activeTab === 0) {
      // Soil Table
      headers = [
        "Date (MM/DD/YYYY)",
        "PAW Depletion Top 50 cm (0-1)",
        "PAW Depletion Mid 50 cm (0-1)",
        "PAW Depletion Bottom 50 cm (0-1)",
        "PAW Depletion Profile (0-1)",
        `N Mass Mid 50 cm (${globalUnits[userSavedUnit].area})`,
        `N Leaching (${globalUnits[userSavedUnit].area})`,
        `Mineralized-N (${globalUnits[userSavedUnit].area}) L1`,
        `Mineralized-N (${globalUnits[userSavedUnit].area}) L2`,
        `Mineralized-N (${globalUnits[userSavedUnit].area}) L3`,
        `Mineralized-N (${globalUnits[userSavedUnit].area}) L4`,
        `Mineralized-N (${globalUnits[userSavedUnit].area}) L5`,
        `Mineralized-N (${globalUnits[userSavedUnit].area}) L6`,
      ];

      data = Object.values(sortedData).map((row) => [
        row.date ?? "-",
        row["PAW Depletion Top 50 cm (0-1)"]?.toFixed(2) ?? "-",
        row["PAW Depletion Mid 50 cm (0-1)"]?.toFixed(2) ?? "-",
        row["PAW Depletion bottom 50 cm (0-1)"]?.toFixed(2) ?? "-",
        row["PAW Depletion Profile (0-1)"]?.toFixed(2) ?? "-",
        row[`N Mass Mid 50 cm (${globalUnits[userSavedUnit].area})`]?.toFixed(
          2
        ) ?? "-",
        row[`N Leaching (${globalUnits[userSavedUnit].area})`]?.toFixed(2) ??
          "-",
        row[`Mineralized-N (${globalUnits[userSavedUnit].area}) L1`]?.toFixed(
          2
        ) ?? "-",
        row[`Mineralized-N (${globalUnits[userSavedUnit].area}) L2`]?.toFixed(
          2
        ) ?? "-",
        row[`Mineralized-N (${globalUnits[userSavedUnit].area}) L3`]?.toFixed(
          2
        ) ?? "-",
        row[`Mineralized-N (${globalUnits[userSavedUnit].area}) L4`]?.toFixed(
          2
        ) ?? "-",
        row[`Mineralized-N (${globalUnits[userSavedUnit].area}) L5`]?.toFixed(
          2
        ) ?? "-",
        row[`Mineralized-N (${globalUnits[userSavedUnit].area}) L6`]?.toFixed(
          2
        ) ?? "-",
      ]);
    } else if (activeTab === 1) {
      // Water Table
      headers = [
        "Date (MM/DD/YYYY)",
        `Water Use (${globalUnits[userSavedUnit].length})`,
        `Rain and Irrigation (${globalUnits[userSavedUnit].length})`,
        `Irrigation Recommendation (${globalUnits[userSavedUnit].length})`,
        "Water Stress Index (0-1)",
        `Today Crop N Demand (${globalUnits[userSavedUnit].area})`,
        `N Uptake (${globalUnits[userSavedUnit].area})`,
        `N Fertilization (${globalUnits[userSavedUnit].area})`,
        `N Available (${globalUnits[userSavedUnit].area})`,
        `N Deficit (${globalUnits[userSavedUnit].area})`,
        "Nitrogen Stress Index (0-1)",
      ];

      data = (irrigationBudgetData || []).map((row) => [
        row.date ?? "-",
        typeof row[`Water Use (${globalUnits[userSavedUnit].length})`] ===
        "number"
          ? row[`Water Use (${globalUnits[userSavedUnit].length})`].toFixed(2)
          : row[`Water Use (${globalUnits[userSavedUnit].length})`] ?? "-",
        typeof row[
          `Rain and Irrigation (${globalUnits[userSavedUnit].length})`
        ] === "number"
          ? row[
              `Rain and Irrigation (${globalUnits[userSavedUnit].length})`
            ].toFixed(2)
          : row[`Rain and Irrigation (${globalUnits[userSavedUnit].length})`] ??
            "-",
        typeof row[
          `Irrigation Recommendation (${globalUnits[userSavedUnit].length})`
        ] === "number"
          ? row[
              `Irrigation Recommendation (${globalUnits[userSavedUnit].length})`
            ].toFixed(2)
          : row[
              `Irrigation Recommendation (${globalUnits[userSavedUnit].length})`
            ] ?? "-",
        typeof row["Water Stress Index (0-1)"] === "number"
          ? row["Water Stress Index (0-1)"].toFixed(2)
          : row["Water Stress Index (0-1)"] ?? "-",
        typeof row[
          `Today Crop N Demand (${globalUnits[userSavedUnit].area})`
        ] === "number"
          ? row[
              `Today Crop N Demand (${globalUnits[userSavedUnit].area})`
            ].toFixed(2)
          : row[`Today Crop N Demand (${globalUnits[userSavedUnit].area})`] ??
            "-",
        typeof row[`N Uptake (${globalUnits[userSavedUnit].area})`] === "number"
          ? row[`N Uptake (${globalUnits[userSavedUnit].area})`].toFixed(2)
          : row[`N Uptake (${globalUnits[userSavedUnit].area})`] ?? "-",
        typeof row[`N Fertilization (${globalUnits[userSavedUnit].area})`] ===
        "number"
          ? row[`N Fertilization (${globalUnits[userSavedUnit].area})`].toFixed(
              2
            )
          : row[`N Fertilization (${globalUnits[userSavedUnit].area})`] ?? "-",
        typeof row[`N Available (${globalUnits[userSavedUnit].area})`] ===
        "number"
          ? row[`N Available (${globalUnits[userSavedUnit].area})`].toFixed(2)
          : row[`N Available (${globalUnits[userSavedUnit].area})`] ?? "-",
        typeof row[`N Deficit (${globalUnits[userSavedUnit].area})`] ===
        "number"
          ? row[`N Deficit (${globalUnits[userSavedUnit].area})`].toFixed(2)
          : row[`N Deficit (${globalUnits[userSavedUnit].area})`] ?? "-",
        typeof row["Nitrogen Stress Index (0-1)"] === "number"
          ? row["Nitrogen Stress Index (0-1)"].toFixed(2)
          : row["Nitrogen Stress Index (0-1)"] ?? "-",
      ]);
    } else if (activeTab === 2) {
      // Crop Table
      headers = [
        "Date (MM/DD/YYYY)",
        "Pot Green Canopy Cover",
        "Green Canopy Cover",
        `Pot crop Transpiration (${globalUnits[userSavedUnit].length}/day)`,
        `Transpiration (${globalUnits[userSavedUnit].length})`,
        `Pot Biomass (${globalUnits[userSavedUnit].area})`,
        `Biomass (${globalUnits[userSavedUnit].area})`,
        `Root Depth (${globalUnits[userSavedUnit].length})`,
        `Height (${globalUnits[userSavedUnit].length})`,
        "Max N Conc (kg/kg)",
        "Crit N Conc (kg/kg)",
        "Min N Conc (kg/kg)",
        "Crop N Conc (kg/kg)",
        `Crop N Mass (${globalUnits[userSavedUnit].area})`,
      ];

      data = Object.values(sortedData).map((row) => [
        row.date ?? "-",
        row["Pot Green Canopy Cover"]?.toFixed?.(2) ??
          row["Pot Green Canopy Cover"] ??
          "-",
        row["Green Canopy Cover"]?.toFixed?.(2) ??
          row["Green Canopy Cover"] ??
          "-",
        row[`Pot crop Transpiration (mm/day)`]?.toFixed?.(2) ??
          row[`Pot crop Transpiration (mm/day)`] ??
          "-",
        row[`Transpiration (${globalUnits[userSavedUnit].length})`]?.toFixed?.(
          2
        ) ??
          row[`Transpiration (${globalUnits[userSavedUnit].length})`] ??
          "-",
        row[`Pot Biomass (${globalUnits[userSavedUnit].area})`]?.toFixed?.(2) ??
          row[`Pot Biomass (${globalUnits[userSavedUnit].area})`] ??
          "-",
        row[`Biomass (${globalUnits[userSavedUnit].area})`]?.toFixed?.(2) ??
          row[`Biomass (${globalUnits[userSavedUnit].area})`] ??
          "-",
        row[`Root Depth (m)`]?.toFixed?.(2) ?? row[`Root Depth (m)`] ?? "-",
        row[`Height (m)`]?.toFixed?.(2) ?? row[`Height (m)`] ?? "-",
        row["Max N Conc (kg/kg)"]?.toFixed?.(2) ??
          row["Max N Conc (kg/kg)"] ??
          "-",
        row["Crit N Conc (kg/kg)"]?.toFixed?.(2) ??
          row["Crit N Conc (kg/kg)"] ??
          "-",
        row["Min N Conc (kg/kg)"]?.toFixed?.(2) ??
          row["Min N Conc (kg/kg)"] ??
          "-",
        row["Crop N Conc (kg/kg)"]?.toFixed?.(2) ??
          row["Crop N Conc (kg/kg)"] ??
          "-",
        row[`Crop N Mass (${globalUnits[userSavedUnit].area})`]?.toFixed?.(2) ??
          row[`Crop N Mass (${globalUnits[userSavedUnit].area})`] ??
          "-",
      ]);
    }

    return { headers, data };
  };

  // Function to generate PDF data based on active tab
  const generatePDFData = () => {
    const { headers, data } = generateCSVData();
    const doc = new jsPDF();
    const tableColumn = headers;
    const tableRows = data;

    doc.text(
      `${activeTab === 0 ? "Soil" : activeTab === 1 ? "Water" : "Crop"} Table`,
      14,
      15
    );
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 20 } },
    });

    doc.save(
      `${
        activeTab === 0 ? "soil" : activeTab === 1 ? "water" : "crop"
      }-table.pdf`
    );
  };

  // Handle CSV download
  const handleCSVDownload = () => {
    const { headers, data } = generateCSVData();
    const csv = Papa.unparse({
      fields: headers,
      data: data,
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${
        activeTab === 0 ? "soil" : activeTab === 1 ? "water" : "crop"
      }-table.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleDownloadClose();
  };

  // Handle PDF download
  const handlePDFDownload = () => {
    generatePDFData();
    handleDownloadClose();
  };

  useEffect(() => {}, [budgetData]);

  // Tracks which chart is opened in the popup dialog (e.g., "chart2").
  const [openChart, setOpenChart] = useState(null);

  // Updated chartList with 11 charts/names
  const chartList = [
    { key: "chart1", label: "Daily Evapotranspiration" },
    // { key: "chart3", label: "Plant Available Water Depletion(0-1)" },
    { key: "chart4", label: "Plant N Concentration(kg N/kg Biomass)" },
    { key: "chart5", label: "Crop N Mass (kg/ha)" },
    { key: "chart6", label: "N Uptake Rate" },
    { key: "chart7", label: "Plant Stress Index(0-1)" },
    { key: "chart8", label: "Green Canopy Cover (0-1)" },
    { key: "chart9", label: "Crop Height and Root Depth(m)" },
    { key: "chart10", label: "Above Ground Biomass(kg)" },
    { key: "chart11", label: "Soil N Mass(Kg/ha)" },
  ];

  /*useEffect(() => {
    // Default frequency
    setFrequencyDates(dropDownOptions[0].value);
  }, []);

  useEffect(() => {
    if (
      frequencyStartDate &&
      frequencyEndDate &&
      frequencyStartDate < frequencyEndDate
    ) {
      handleSimulationData();
      handleSimulationOutputBudgetData();
    }
  }, [frequencyStartDate, frequencyEndDate]);

  // Handle Frequency dropdown selection
  const setFrequency = (e) => {
    const selectedIndex = dropDownOptions[e.target.selectedIndex];
    setSimulationDataFrequency(selectedIndex);
    if (selectedIndex.value !== "Custom") {
      setFrequencyDates(selectedIndex.value);
    }
  };

  const setFrequencyDates = (frequency) => {
    const { startDate, endDate } = getFrequencyDatesForSimulation(
      frequency,
      // plantingDate
      new Date()
    );
    setFrequencyStartDate(startDate);
    setFrequencyEndDate(endDate);
  };*/

  const handleSimulationData = () => {
    if (Array.isArray(simulationData) && simulationData.length > 0) {
      const currentYear = simulationData[0]?.year ?? new Date().getFullYear();
      console.log("current year!", currentYear);
      // Format simulationData into DOY -> data (with readable date)
      const formattedData = simulationData.reduce((res, item) => {
        const doy = Number(item.DOY);
        if (!isNaN(doy)) {
          const date = convertDOYToDate(currentYear, doy);
          res[doy] = { ...res[doy], ...item, date };
        }
        return res;
      }, {});

      const allDOYs = Object.keys(formattedData)
        .map(Number)
        .sort((a, b) => a - b);
      // const todayDOY = getDayOfYear(new Date());

      // const baseDOY = allDOYs.includes(todayDOY) ? todayDOY : allDOYs[0] ?? 1;
      const startDOY = getDayOfYear(
        new Date(getCustomDateForTasks(frequencyStartDate))
      );
      const endDOY = getDayOfYear(
        new Date(getCustomDateForTasks(frequencyEndDate))
      );

      const filteredData = Object.fromEntries(
        Object.entries(formattedData).filter(([key]) => {
          const doy = Number(key);
          return doy >= startDOY && doy <= endDOY;
        })
      );

      setSortedData(filteredData);

      const emergenceDOY = Math.min(...allDOYs);
      // setEmergenceOutOfRange(emergenceDOY < startDOY || emergenceDOY > endDOY);
    } else {
      setSortedData([]);
    }
  };

  const handleSimulationOutputBudgetData = () => {
    if (Array.isArray(budgetData) && budgetData.length > 0) {
      const currentYear = new Date().getFullYear();
      // const today = new Date();
      // const todayDOY = getDayOfYear(today);

      // Extract all DOYs from the data
      /* const allDOYs = budgetData
      .map(item => item.DOY)
      .filter(doy => typeof doy === "number")
      .sort((a, b) => a - b); */

      // Fallback: if today’s DOY not in data, use first DOY in the dataset
      // const baseDOY = allDOYs.includes(todayDOY) ? todayDOY : allDOYs[0] ?? 1;
      const startDOY = getDayOfYear(
        new Date(getCustomDateForTasks(frequencyStartDate))
      );
      const endDOY = getDayOfYear(
        new Date(getCustomDateForTasks(frequencyEndDate))
      );

      const filteredBudget = budgetData
        .filter((item) => {
          const doy = item.DOY;
          return typeof doy === "number" && doy >= startDOY && doy <= endDOY;
        })
        .map((item) => {
          const date = item.DOY ? convertDOYToDate(currentYear, item.DOY) : "-";
          return { ...item, date };
        });

      console.log("Filtered Budget Data:", filteredBudget);
      setIrrigationBudgetData(filteredBudget);
    }
  };

  // Handle Sorting by Date
  const handleSort = () => {
    const sorted = Object.keys(sortedData)
      .sort((a, b) => {
        return sortDirection === "asc"
          ? parseInt(a) - parseInt(b)
          : parseInt(b) - parseInt(a);
      })
      .reduce((sortedResult, sortedKey) => {
        sortedResult[sortedKey] = sortedData[sortedKey];
        return sortedResult;
      }, {});
    setSortedData(sorted);
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  // Row component for Table (unchanged from your original)
  const Row = ({ row }) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
          <TableCell>
            <Button
              size="small"
              onClick={() => setOpen(!open)}
              style={{ textTransform: "none", color: "#a60f2d" }}
            >
              {row.date}
            </Button>
          </TableCell>
        </TableRow>
        {open && (
          <TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
              <Box sx={{ margin: 1 }}>
                <Table size="small" aria-label="purchases">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Factor</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Value</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(row).map((key) => (
                      <TableRow key={key}>
                        <TableCell>{key}</TableCell>
                        <TableCell>
                          {typeof row[key] === "number"
                            ? row[key].toFixed(2)
                            : row[key]}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </TableCell>
          </TableRow>
        )}
      </>
    );
  };

  const mapSimulationOutputData = () => {
    // 3 arrays with keys to hold the data for each tab
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: "52%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "auto",
        maxWidth: "80%",
        height: "60vh",
        bgcolor: "background.paper",
        borderRadius: 5,
        boxShadow: 24,
        p: 3,
        zIndex: 1300,
        overflowY: "auto",
      }}
    >
      <IconButton
        aria-label="close"
        onClick={closeModal}
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

      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
        Output
      </Typography>

      {/* Modified Frequency selection box to conditionally render download icon */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 0,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
       <Box sx={{ display: "flex", gap: 5 }}>
       <Box sx={{ display: "flex", gap: 1 }}>
        
       <FormControl fullWidth error={Boolean(dateErrors.frequencyStartDate)}>
  <Typography variant="subtitle2">Start Date</Typography>
  <TextField
    required
    type="date"
    variant="outlined"
    value={frequencyStartDate}
    onChange={(e) => setFrequencyStartDate(e.target.value)}
    onBlur={() => {
      const year = new Date(frequencyStartDate).getFullYear();
      if (year < currentYear - 2 || year > currentYear + 2) {
        setDateErrors((prev) => ({
          ...prev,
          frequencyStartDate: `Enter a date between ${minDate} and ${maxDate}`,
        }));
      } else {
        setDateErrors((prev) => ({ ...prev, frequencyStartDate: "" }));
      }
    }}
    inputProps={{ min: minDate, max: maxDate }}
    sx={{
      borderLeft: "3px solid #a60f2d",
      borderRadius: 1,
      minWidth: 180,
    }}
    helperText={dateErrors.frequencyStartDate}
/>
</FormControl>


<FormControl fullWidth error={Boolean(dateErrors.frequencyEndDate)}>
  <Typography variant="subtitle2">End Date</Typography>
  <TextField
    required
    type="date"
    variant="outlined"
    value={frequencyEndDate}
    onChange={(e) => setFrequencyEndDate(e.target.value)}
    onBlur={() => {
      const start = new Date(frequencyStartDate);
      const end = new Date(frequencyEndDate);
      const year = end.getFullYear();
    
      if (year < currentYear - 2 || year > currentYear + 2) {
        setDateErrors((prev) => ({
          ...prev,
          frequencyEndDate: `Enter a date between ${minDate} and ${maxDate}`,
        }));
      } else if (start && end <= start) {
        setDateErrors((prev) => ({
          ...prev,
          frequencyEndDate: "End date must be after the start date.",
        }));
      } else {
        setDateErrors((prev) => ({ ...prev, frequencyEndDate: "" }));
      }
    }}
    
    helperText={dateErrors.frequencyEndDate}
/>
</FormControl>

<Button
  variant="contained"
  color="primary"
  onClick={handleCalculateClick}
  disabled={!isCalculateEnabled || loading}
  sx={{
    marginTop: 3,
    height: 40,
    textTransform: "none",
    backgroundColor: "#a60f2d",
    color: "white",
    fontWeight: 500,
    padding: "8px 24px",
    borderRadius: "6px",
    whiteSpace: "nowrap",
    "&:hover": {
      backgroundColor: "#920c25",
    },
  }}
>
  {loading ? "Calculating..." : "Calculate"}
</Button>

</Box>

</Box>

        {/* <RadioGroup
          row
          name="dateMode"
          value={simulationDataFrequency?.value}
          onChange={(e) => {
            const selectedValue = e.target.value;
            setSimulationDataFrequency({
              label: selectedValue,
              value: selectedValue,
            });

            if (selectedValue !== "Custom") {
              setFrequencyDates(selectedValue);
            }
          }}
        >
          <FormControlLabel
            value="7 Days"
            control={<Radio />}
            label="Next 7 Days"
          />
          <FormControlLabel
            value="Custom"
            control={<Radio />}
            label="Custom Dates"
          />
        </RadioGroup> */}

        {/* Conditionally render the Download Icon and Menu only for Soil, Water, and Crop tabs */}
        {activeTab !== 3 && (
  <Box>
    <IconButton onClick={handleDownloadClick}>
      <GetAppIcon />
    </IconButton>
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={handleDownloadClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <MenuItem onClick={handleCSVDownload}>CSV</MenuItem>
      <MenuItem onClick={handlePDFDownload}>PDF</MenuItem>
    </Menu>
  </Box>
)}


        {simulationDataFrequency?.value === "Custom" && (
          <>
            {/* <Label
              type="date"
              label="Start Date"
              elementName="startDate"
              inputValue={frequencyStartDate}
              onChange={(e) => setFrequencyStartDate(e.target.value)}
            />
            <Label
              type="date"
              label="End Date"
              elementName="endDate"
              inputValue={frequencyEndDate}
              onChange={(e) => setFrequencyEndDate(e.target.value)}
            /> */}
          </>
        )}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
  {/* Weather Station Dropdown */}
  {/* <select
    name="nearestWeatherStation"
    value={nearestWeatherStation}
    onChange={(e) => handleStationSelection(e)}
    className="weather-dropdown"
  >
    <option value="">Weather Station</option>
    {nearestWeatherStations?.map((station, index) => (
      <option
        key={index}
        value={station.UNIT_ID}
        title={`Lat: ${station.lat}, Lng: ${station.lng}`}
      >
        {station.name || `Station ${index + 1}`} (
        {(station.distance * 0.621371)?.toFixed(2) || "0.00"} mi)
      </option>
    ))}
  </select> */}
  </Box>



</Box>

     
      <>
  {/* Tabs for Table vs. Charts */}
<Tabs
  value={activeTab}
  onChange={(_, newValue) => setActiveTab(newValue)}
  sx={{ borderBottom: 1, borderColor: "divider" }}
  variant="scrollable"
>
  <Tab label="Budget" />
  <Tab label="Soil" />
  <Tab label="Crop" />
  <Tab icon={<InsertChartOutlinedIcon />} aria-label="Charts" />
</Tabs>

</>


      {activeTab === 1 && (
        <Box sx={{ mt: 1, maxHeight: "48vh", overflowY: "auto" }}>
          {/* <Typography variant="h6" sx={{ mb: 1 }}>
            Soil Table
          </Typography> */}

          <TableContainer
            component={Paper}
            sx={{
              maxHeight: "44vh", // set height so sticky header has space to work
              overflowY: "auto",
              backgroundColor: "white"
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Date (MM/DD/YYYY)</strong>
                  </TableCell>
                  {/* <TableCell>PAW Depletion Top 50 cm (0-1)</TableCell> */}
                  {/* <TableCell>PAW Depletion Mid 50 cm (0-1)</TableCell> */}
                  {/* <TableCell>PAW Depletion Bottom 50 cm (0-1)</TableCell> */}
                  <TableCell>PAW Depletion Profile (0-1)</TableCell>
                  {/* <TableCell>{`N Mass Top 50 cm (${globalUnits[userSavedUnit].area})`}</TableCell> */}
                  <TableCell>{`N Mass Mid 50 cm (${globalUnits[userSavedUnit].area})`}</TableCell>
                  {/* <TableCell>{`N Mass Bottom 50 cm (${globalUnits[userSavedUnit].area})`}</TableCell> */}
                  {/* <TableCell>{`Soil N Mass down to 150 cm (${globalUnits[userSavedUnit].area})`}</TableCell> */}
                  <TableCell>{`N Leaching (${globalUnits[userSavedUnit].area})`}</TableCell>
                  {/* <TableCell>{`N Uptake Rate (${globalUnits[userSavedUnit].area}/day)`}</TableCell> */}
                  <TableCell>{`Mineralized-N (${globalUnits[userSavedUnit].area}) L1`}</TableCell>
                  <TableCell>{`Mineralized-N (${globalUnits[userSavedUnit].area}) L2`}</TableCell>
                  <TableCell>{`Mineralized-N (${globalUnits[userSavedUnit].area}) L3`}</TableCell>
                  <TableCell>{`Mineralized-N (${globalUnits[userSavedUnit].area}) L4`}</TableCell>
                  <TableCell>{`Mineralized-N (${globalUnits[userSavedUnit].area}) L5`}</TableCell>
                  <TableCell>{`Mineralized-N (${globalUnits[userSavedUnit].area}) L6`}</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {Object.values(sortedData).map((row, i) => {
                  // const nMassTopKey = `N Mass Top 50 cm (${globalUnits[userSavedUnit].area})`;
                  const nMassMidKey = `N Mass Mid 50 cm (${globalUnits[userSavedUnit].area})`;
                  // const nMassBottomKey = `N Mass Bottom 50 cm (${globalUnits[userSavedUnit].area})`;
                  // const soilNMass150Key = `Soil N Mass down to 150 cm (${globalUnits[userSavedUnit].area})`;
                  const nLeachingKey = `N Leaching (${globalUnits[userSavedUnit].area})`;
                  // const nUptakeRateKey = `N Uptake Rate (${globalUnits[userSavedUnit].area}/day)`;
                  const mineralizedNL1Key = `Mineralized-N (${globalUnits[userSavedUnit].area}) L1`;
                  const mineralizedNL2Key = `Mineralized-N (${globalUnits[userSavedUnit].area}) L2`;
                  const mineralizedNL3Key = `Mineralized-N (${globalUnits[userSavedUnit].area}) L3`;
                  const mineralizedNL4Key = `Mineralized-N (${globalUnits[userSavedUnit].area}) L4`;
                  const mineralizedNL5Key = `Mineralized-N (${globalUnits[userSavedUnit].area}) L5`;
                  const mineralizedNL6Key = `Mineralized-N (${globalUnits[userSavedUnit].area}) L6`;

                  return (
                    <TableRow key={`table-${i}`}>
                      <TableCell>{row.date ?? "-"}</TableCell>
                      {/* <TableCell>
                        {row["PAW Depletion Top 50 cm (0-1)"]?.toFixed(2) ??
                          "-"}
                      </TableCell> */}
                      {/* <TableCell>
                        {row["PAW Depletion Mid 50 cm (0-1)"]?.toFixed(2) ??
                          "-"}
                      </TableCell> */}
                      {/* <TableCell>
                        {row["PAW Depletion bottom 50 cm (0-1)"]?.toFixed(2) ??
                          "-"}
                      </TableCell> */}
                      <TableCell>
                        {row["PAW Depletion Profile (0-1)"]?.toFixed(2) ?? "-"}
                      </TableCell>
                      {/* <TableCell>
                        {row[nMassTopKey]?.toFixed(2) ?? "-"}
                      </TableCell> */}
                      <TableCell>
                        {row[nMassMidKey]?.toFixed(2) ?? "-"}
                      </TableCell>
                      {/* <TableCell>
                        {row[nMassBottomKey]?.toFixed(2) ?? "-"}
                      </TableCell> */}
                      {/* <TableCell>
                        {row[soilNMass150Key]?.toFixed(2) ?? "-"}
                      </TableCell> */}
                      <TableCell>
                        {row[nLeachingKey]?.toFixed(2) ?? "-"}
                      </TableCell>
                      {/* <TableCell>
                        {row[nUptakeRateKey]?.toFixed(2) ?? "-"}
                      </TableCell> */}
                      <TableCell>
                        {row[mineralizedNL1Key]?.toFixed(2) ?? "-"}
                      </TableCell>
                      <TableCell>
                        {row[mineralizedNL2Key]?.toFixed(2) ?? "-"}
                      </TableCell>
                      <TableCell>
                        {row[mineralizedNL3Key]?.toFixed(2) ?? "-"}
                      </TableCell>
                      <TableCell>
                        {row[mineralizedNL4Key]?.toFixed(2) ?? "-"}
                      </TableCell>
                      <TableCell>
                        {row[mineralizedNL5Key]?.toFixed(2) ?? "-"}
                      </TableCell>
                      <TableCell>
                        {row[mineralizedNL6Key]?.toFixed(2) ?? "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {activeTab === 0 && (
        <Box sx={{ mt: 1, maxHeight: "48vh", overflowY: "auto" }}>
          {/* <Typography variant="h6" sx={{ mb: 1 }}>
            Budget Table
          </Typography> */}
          <TableContainer
            component={Paper}
            sx={{ padding: "0px 4px", backgroundColor: "white" }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Date (MM/DD/YYYY)</strong>
                  </TableCell>
                  <TableCell>{`Water Use (${globalUnits[userSavedUnit].length})`}</TableCell>
                  <TableCell>{`Rain and Irrigation (${globalUnits[userSavedUnit].length})`}</TableCell>
                  <TableCell>{`Irrigation Recommendation (${globalUnits[userSavedUnit].length})`}</TableCell>
                  <TableCell>
                    <strong>Water Stress Index (0-1)</strong>
                  </TableCell>
                  <TableCell>{`Today Crop N Demand (${globalUnits[userSavedUnit].area})`}</TableCell>
                  <TableCell>{`N Uptake (${globalUnits[userSavedUnit].area})`}</TableCell>
                  <TableCell>{`N Fertilization (${globalUnits[userSavedUnit].area})`}</TableCell>
                  <TableCell>{`N Available (${globalUnits[userSavedUnit].area})`}</TableCell>
                  <TableCell>{`N Deficit (${globalUnits[userSavedUnit].area})`}</TableCell>
                  <TableCell>
                    <strong>Nitrogen Stress Index (0-1)</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(irrigationBudgetData || []).map((row, i) => {
                  const waterUseKey = `Water Use (${globalUnits[userSavedUnit].length})`;
                  const rainKey = `Rain and Irrigation (${globalUnits[userSavedUnit].length})`;
                  const irrigationKey = `Irrigation Recommendation (${globalUnits[userSavedUnit].length})`;
                  const waterStressKey = "Water Stress Index (0-1)";
                  const todayCropNDemandKey = `Today Crop N Demand (${globalUnits[userSavedUnit].area})`;
                  const nUptakeKey = `N Uptake (${globalUnits[userSavedUnit].area})`;
                  const nFertilizationKey = `N Fertilization (${globalUnits[userSavedUnit].area})`;
                  const nAvailableKey = `N Available (${globalUnits[userSavedUnit].area})`;
                  const nDeficitKey = `N Deficit (${globalUnits[userSavedUnit].area})`;
                  const nitrogenStressKey = "Nitrogen Stress Index (0-1)";

                  return (
                    <TableRow key={`budget-${i}`}>
                      <TableCell>{row.date ?? "-"}</TableCell>
                      <TableCell>
                        {typeof row[waterUseKey] === "number"
                          ? row[waterUseKey].toFixed(2)
                          : row[waterUseKey] ?? "-"}
                      </TableCell>
                      <TableCell>
                        {typeof row[rainKey] === "number"
                          ? row[rainKey].toFixed(2)
                          : row[rainKey] ?? "-"}
                      </TableCell>
                      <TableCell>
                        {typeof row[irrigationKey] === "number"
                          ? row[irrigationKey].toFixed(2)
                          : row[irrigationKey] ?? "-"}
                      </TableCell>
                      <TableCell>
                        {typeof row[waterStressKey] === "number"
                          ? row[waterStressKey].toFixed(2)
                          : row[waterStressKey] ?? "-"}
                      </TableCell>
                      <TableCell>
                        {typeof row[todayCropNDemandKey] === "number"
                          ? row[todayCropNDemandKey].toFixed(2)
                          : row[todayCropNDemandKey] ?? "-"}
                      </TableCell>
                      <TableCell>
                        {typeof row[nUptakeKey] === "number"
                          ? row[nUptakeKey].toFixed(2)
                          : row[nUptakeKey] ?? "-"}
                      </TableCell>
                      <TableCell>
                        {typeof row[nFertilizationKey] === "number"
                          ? row[nFertilizationKey].toFixed(2)
                          : row[nFertilizationKey] ?? "-"}
                      </TableCell>
                      <TableCell>
                        {typeof row[nAvailableKey] === "number"
                          ? row[nAvailableKey].toFixed(2)
                          : row[nAvailableKey] ?? "-"}
                      </TableCell>
                      <TableCell>
                        {typeof row[nDeficitKey] === "number"
                          ? row[nDeficitKey].toFixed(2)
                          : row[nDeficitKey] ?? "-"}
                      </TableCell>
                      <TableCell>
                        {typeof row[nitrogenStressKey] === "number"
                          ? row[nitrogenStressKey].toFixed(2)
                          : row[nitrogenStressKey] ?? "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {activeTab === 2 && (
        <Box sx={{ mt: 1, maxHeight: "48vh", overflowY: "auto" }}>
          {/* <Typography variant="h6" sx={{ mb: 1 }}>
            Crop Table
          </Typography> */}
          <TableContainer
            component={Paper}
            sx={{ padding: "0px 4px", backgroundColor: "white" }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Date (MM/DD/YYYY)</strong>
                  </TableCell>
                  <TableCell>Pot Green Canopy Cover</TableCell>
                  <TableCell>Green Canopy Cover</TableCell>
                  <TableCell>{`Pot crop Transpiration (${globalUnits[userSavedUnit].length}/day)`}</TableCell>
                  <TableCell>{`Transpiration (${globalUnits[userSavedUnit].length})`}</TableCell>
                  <TableCell>{`Pot Biomass (${globalUnits[userSavedUnit].area})`}</TableCell>
                  <TableCell>{`Biomass (${globalUnits[userSavedUnit].area})`}</TableCell>
                  <TableCell>{`Root Depth (${globalUnits[userSavedUnit].length})`}</TableCell>
                  <TableCell>{`Height (${globalUnits[userSavedUnit].length})`}</TableCell>
                  <TableCell>Max N Conc (kg/kg)</TableCell>
                  <TableCell>Crit N Conc (kg/kg)</TableCell>
                  <TableCell>Min N Conc (kg/kg)</TableCell>
                  <TableCell>Crop N Conc (kg/kg)</TableCell>
                  <TableCell>{`Crop N Mass (${globalUnits[userSavedUnit].area})`}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.values(sortedData).map((row, i) => {
                  const potTranspirationKey = "Pot crop Transpiration (mm/day)";
                  const transpirationKey = `Transpiration (${globalUnits[userSavedUnit].length})`;
                  const potBiomassKey = `Pot Biomass (${globalUnits[userSavedUnit].area})`;
                  const biomassKey = `Biomass (${globalUnits[userSavedUnit].area})`;
                  const rootDepthKey = "Root Depth (m)";
                  const heightKey = "Height (m)";

                  return (
                    <TableRow key={`soil-${i}`}>
                      <TableCell>{row.date ?? "-"}</TableCell>
                      <TableCell>
                        {row["Pot Green Canopy Cover"]?.toFixed?.(2) ??
                          row["Pot Green Canopy Cover"] ??
                          "-"}
                      </TableCell>
                      <TableCell>
                        {row["Green Canopy Cover"]?.toFixed?.(2) ??
                          row["Green Canopy Cover"] ??
                          "-"}
                      </TableCell>
                      <TableCell>
                        {row[potTranspirationKey]?.toFixed?.(2) ??
                          row[potTranspirationKey] ??
                          "-"}
                      </TableCell>
                      <TableCell>
                        {row[transpirationKey]?.toFixed?.(2) ??
                          row[transpirationKey] ??
                          "-"}
                      </TableCell>
                      <TableCell>
                        {row[potBiomassKey]?.toFixed?.(2) ??
                          row[potBiomassKey] ??
                          "-"}
                      </TableCell>
                      <TableCell>
                        {row[biomassKey]?.toFixed?.(2) ??
                          row[biomassKey] ??
                          "-"}
                      </TableCell>
                      <TableCell>
                        {row[rootDepthKey]?.toFixed?.(2) ??
                          row[rootDepthKey] ??
                          "-"}
                      </TableCell>
                      <TableCell>
                        {row[heightKey]?.toFixed?.(2) ?? row[heightKey] ?? "-"}
                      </TableCell>
                      <TableCell>
                        {row["Max N Conc (kg/kg)"]?.toFixed?.(2) ??
                          row["Max N Conc (kg/kg)"] ??
                          "-"}
                      </TableCell>
                      <TableCell>
                        {row["Crit N Conc (kg/kg)"]?.toFixed?.(2) ??
                          row["Crit N Conc (kg/kg)"] ??
                          "-"}
                      </TableCell>
                      <TableCell>
                        {row["Min N Conc (kg/kg)"]?.toFixed?.(2) ??
                          row["Min N Conc (kg/kg)"] ??
                          "-"}
                      </TableCell>
                      <TableCell>
                        {row["Crop N Conc (kg/kg)"]?.toFixed?.(2) ??
                          row["Crop N Conc (kg/kg)"] ??
                          "-"}
                      </TableCell>
                      <TableCell>
                        {row[
                          `Crop N Mass (${globalUnits[userSavedUnit].area})`
                        ]?.toFixed?.(2) ??
                          row[
                            `Crop N Mass (${globalUnits[userSavedUnit].area})`
                          ] ??
                          "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ==== CHARTS VIEW ==== */}
      {activeTab === 3 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="h6" sx={{ mb: 0 }}>
            Charts
          </Typography>
          {/* Render a simple list of chart names. Clicking one opens the chart in a popup. */}
          <List component="nav">
            {chartList.map((chartItem) => (
              <ListItemButton
                key={chartItem.key}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "15px",
                  mb: 0.5,
                  transition: "background-color 0.2s",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                }}
                onClick={() => setOpenChart(chartItem.key)}
              >
                <ListItemText
                  primary={chartItem.label}
                  primaryTypographyProps={{ fontWeight: "normal" }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        {/* <Button
          variant="contained"
          style={{
            backgroundColor: "#6c757d",
            color: "white",
            width: "100%",
          }}
          onClick={closeModal}
        >
          Cancel
        </Button> */}
      </Box>

      {/* Popup for the selected chart */}
      <Modal
        open={Boolean(openChart)}
        onClose={() => setOpenChart(null)}
        aria-labelledby="chart-modal"
        aria-describedby="chart-modal-description"
      >
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            maxWidth: "90%",
            maxHeight: "90vh",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 3,
            overflowY: "auto",
          }}
        >
          {/* The single chart, chosen by openChart */}
          <OutputCharts
            chartData={sortedData}
            chartKey={openChart}
            closeModal={() => setOpenChart(null)}
          />
        </Box>
      </Modal>
      <Snackbar
  open={snackbarOpen}
  autoHideDuration={5000}
  onClose={() => setSnackbarOpen(false)}
  anchorOrigin={{ vertical: "top", horizontal: "center" }}
>
  <MuiAlert
    onClose={() => setSnackbarOpen(false)}
    severity="error"
    sx={{
      width: '100%',
      backgroundColor: '#d32f2f',
      color: 'white',
      fontWeight: 'bold',
    }}
  >
    {snackbarMessage}
  </MuiAlert>
</Snackbar>

    </Box>
  );
};

export default SimulationOutputModal;