import React, { useEffect, useState, useRef, useContext } from "react";
import { fetchGDDData, fetchGddDataForNext7Days, fetchPlantingSettings } from "../util/apiUtil";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Menu,
  MenuItem,
  IconButton,
  TextField,
  FormControlLabel,
  Switch,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";

// === Highcharts imports
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { UserContext } from "../context/UserContext";
import { globalUnits } from "../util/shared-utils";

const GDDDataModal = ({ closeModal, stationId, plantingData }) => {
  const [gddData, setGDDData] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [formData, setFormData] = useState({
    baseTemp: "",
    startDate: "",
    endDate: "",
  });
  const [showChart, setShowChart] = useState(false);
  const {userSavedUnit} = useContext(UserContext);

  // Reference for capturing the chart (for PNG/JPG export)
  const chartContainerRef = useRef(null);

  /**
   * 1. Fetch baseTemp, plantingDate, harvestDate from planting settings
   *    and populate formData on load.
   */
  useEffect(() => {
    if (plantingData?.objid) {
      fetchPlantingSettings(plantingData.objid)
        .then((data) => {
          const baseTempObj = data.find((info) => info.name === "gddBaseTemp");
          const plantingDateObj = data.find((info) => info.name === "plantingDate");
          const harvestDateObj = data.find((info) => info.name === "harvestDate");

          // Convert any valid date to YYYY-MM-DD for the <input type="date" />
          const plantingDate = plantingDateObj.value
            ? new Date(plantingDateObj.value).toISOString().split("T")[0]
            : "";
          const harvestDate = harvestDateObj.value
            ? new Date(harvestDateObj.value).toISOString().split("T")[0]
            : "";

          setFormData((prev) => ({
            ...prev,
            baseTemp: baseTempObj ? baseTempObj.value : "",
            startDate: plantingDate,
            endDate: harvestDate,
          }));
          // get forecast data for next 7 days
          let forecastGddData = [];                    
          fetchGddDataForNext7Days(stationId, baseTempObj.value).then(data => {
            
            data.data.forEach((item) => {
              const gddObj = {
                Date: item?.date?.split("T")[0],
                Day_Of_Year: item?.day_of_year,
                Cumulative_GDD: item?.cumulative_gdd,
                Daily_GDD: item?.daily_gdd,
              };
              forecastGddData.push(gddObj);
            });

            setGDDData(forecastGddData);

          }).catch((error) => {
            console.error("Failed to fetch GDD data for next 7 days:", error);
            setGDDData([]);
          });
          
        })
        .catch((error) => {
          console.error("Failed to fetch planting settings:", error);
        });
    }
  }, [plantingData, stationId]);

  // 2. Fetch GDD data from the API based on form inputs
  const loadGDDData = async () => {
    const { startDate, endDate, baseTemp } = formData;
    if (!startDate || !endDate || !baseTemp) {
      alert("Please enter all required fields.");
      return;
    }

    try {
      const data = await fetchGDDData(stationId, baseTemp, startDate, endDate);
      console.log("GDD API Response:", data);

      if (Array.isArray(data)) {
        // Convert each Date to YYYY-MM-DD
        data.forEach((item) => {
          item.Date = new Date(item.Date).toISOString().split("T")[0];
        });
        setGDDData(data);
      } else {
        console.error("Unexpected GDD API response:", data);
        setGDDData([]);
      }
    } catch (err) {
      console.error("Failed to load GDD data:", err);
      setGDDData([]);
    }
  };

  // 3. Handle user input in the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Example restriction: baseTemp can only be up to 2 digits
    if (name === "baseTemp") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length > 2) return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // === Exports: CSV, PDF, Image (PNG/JPG) ===
  const downloadCSV = () => {
    if (!gddData.length) return;
    const csvHeader = ["Date,Day of Year,Daily GDD,Cumulative GDD"];
    const csvRows = gddData.map((row) =>
      [row.Date, row.Day_Of_Year, row.Daily_GDD, row.Cumulative_GDD].join(",")
    );
    const csvString = [csvHeader, ...csvRows].join("\n");

    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "GDD_Data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setAnchorEl(null);
  };

  //  **Updated PDF Export (Includes Source in Crimson at Bottom-Right)**
  const downloadPDF = () => {
    if (!gddData.length) return;
    const doc = new jsPDF();
    doc.text("Growing Degree Days", 14, 10);

    const tableColumn = ["Date", "Day of Year", "Daily GDD", "Cumulative GDD"];
    const tableRows = gddData.map((row) => [
      row.Date,
      row.Day_Of_Year,
      row.Daily_GDD,
      row.Cumulative_GDD,
    ]);

    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });

    // Add source text at the bottom-right
    let finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(9);
    doc.setTextColor(198, 40, 40); // Crimson color
    const sourceText = "Source: AgWeatherNet";
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(sourceText);
    doc.textWithLink(sourceText, pageWidth - textWidth - 14, finalY + 10, {
      url: "https://weather.wsu.edu/",
    });

    doc.save("GDD_Data.pdf");
    setAnchorEl(null);
  };

  //  **Updated JPG/PNG Export (Includes Source at Bottom with White Strip)**
  const handleDownloadChartImage = async (format) => {
    if (!gddData.length || !chartContainerRef.current) return;

    try {
      const chartContainer = chartContainerRef.current;
      const canvas = await html2canvas(chartContainer, { useCORS: true });

      // Create a new canvas with extra height for the source text
      const newCanvas = document.createElement("canvas");
      const ctx = newCanvas.getContext("2d");

      newCanvas.width = canvas.width;
      newCanvas.height = canvas.height + 30; // Extra space at the bottom

      // Fill bottom with white
      ctx.fillStyle = "white";
      ctx.fillRect(0, canvas.height, newCanvas.width, 30);

      // Draw the chart onto the new canvas
      ctx.drawImage(canvas, 0, 0);

      // Set text properties
      ctx.font = "12px Arial";
      ctx.fillStyle = "#C62828"; // Crimson text color
      ctx.textAlign = "right";

      // Draw the source text at the bottom-right
      ctx.fillText("Source: AgWeatherNet", newCanvas.width - 10, newCanvas.height - 10);

      // Convert to image and download
      const link = document.createElement("a");
      link.download = `GDD_Chart.${format}`;
      link.href = newCanvas.toDataURL(`image/${format}`, 1.0);
      link.click();
    } catch (error) {
      console.error("Failed to download chart image:", error);
    }

    setAnchorEl(null);
  };

  // 4. Define Highcharts configuration
  const chartOptions = {
    chart: {
      type: "line",
      spacingTop: 10,
      spacingBottom: 50, // Extra space to ensure the legend is visible
    },
    title: {
      text: "Growing Degree Days",
      style: { fontSize: "18px", fontWeight: "bold" },
    },
    xAxis: {
      categories: gddData.map((row) => row.Date),
      labels: { rotation: -45 },
    },
    yAxis: {
      title: { text: "GDD" },
      min: 0,
    },
    legend: {
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
    },
    tooltip: {
      shared: true,
    },
    plotOptions: {
      series: {
        lineWidth: 3,
        marker: {
          enabled: false, // Straight lines, no circle markers
        },
        shadow: {
          color: "rgba(0,0,0,0.25)",
          offsetX: 3,
          offsetY: 3,
          opacity: 0.6,
          width: 3,
        },
      },
    },
    series: [
      {
        name: "Daily GDD",
        data: gddData.map((row) => parseFloat(row.Daily_GDD) || 0),
        color: "black",
        lineWidth: 2,
      },
      {
        name: "Cumulative GDD",
        data: gddData.map((row) => parseFloat(row.Cumulative_GDD) || 0),
        color: "red",
        lineWidth: 2,
      },
    ],
    credits: {
      enabled: false
    },
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: "52%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "32%",
        bgcolor: "background.paper",
        boxShadow: 24,
        padding: "2%",
        borderRadius: "10px",
        zIndex: 999,
        overflow: "auto",
        // Tweak if needed so the chart + table fit well
        height: "60vh",
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
      {/* === Header row with Title, Switch, and Download Menu === */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5px" }}>
        <Typography variant="h6" align="left" gutterBottom>
          Growing Degree Days
        </Typography>

        {/* Toggle between Table and Chart */}
        <FormControlLabel
          control={
            <Switch
              checked={showChart}
              onChange={() => setShowChart(!showChart)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "crimson" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "crimson",
                },
              }}
            />
          }
          label={showChart ? "Table" : "Chart"}
          sx={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "10px",
            color: "crimson",
          }}
        />

        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          <FileDownloadIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={downloadCSV}>CSV</MenuItem>
          <MenuItem onClick={downloadPDF}>PDF</MenuItem>
          <MenuItem onClick={() => handleDownloadChartImage("jpeg")}>JPG</MenuItem>
          <MenuItem onClick={() => handleDownloadChartImage("png")}>PNG</MenuItem>
        </Menu>
      </div>

      {/* === Form Fields === */}
      {/* <div style={{ display: "flex", flexDirection: "column", marginBottom: "20px" }}> */}
      <Box
        // component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TextField
          label={`Base Temperature (${globalUnits[userSavedUnit]?.temperature})`}
          type="number"
          name="baseTemp"
          value={formData.baseTemp}
          onChange={handleInputChange}
          inputProps={{ min: 0, max: 99, maxLength: 2 }}
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true,
       }}
       sx={{
        "& .MuiOutlinedInput-root": {
          height: 48,
          "& fieldset": {
            borderColor: "transparent",
          },
          "&:hover fieldset": {
            borderColor: "transparent",
          },
          "&.Mui-focused fieldset": {
            borderColor: "transparent",
          },
        },
      }}
        fullWidth
        />
        <TextField
          label="Start Date (Planting)"
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleInputChange}
          inputProps={{ max: new Date().toISOString().split("T")[0] }}
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          sx={{
            "& .MuiOutlinedInput-root": {
              height: 48,
              "& fieldset": {
                borderColor: "transparent",
              },
              "&:hover fieldset": {
                borderColor: "transparent",
              },
              "&.Mui-focused fieldset": {
                borderColor: "transparent",
              },
            },
          }}
            fullWidth
        />
        <TextField
          label="End Date (Harvest)"
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleInputChange}
          inputProps={{ max: new Date().toISOString().split("T")[0] }}
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          sx={{
            "& .MuiOutlinedInput-root": {
              height: 48,
              "& fieldset": {
                borderColor: "transparent",
              },
              "&:hover fieldset": {
                borderColor: "transparent",
              },
              "&.Mui-focused fieldset": {
                borderColor: "transparent",
              },
            },
          }}
            fullWidth
        />

        {/* Button to fetch GDD data */}
        <Button
          onClick={loadGDDData}
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 1, backgroundColor: "rgb(166, 15, 45)", mt: 1 }}
        >
          Calculate GDD
        </Button>
      {/* </div> */}
      </Box>

      {/* === Table or Highcharts Chart === */}
      {!showChart ? (
        <TableContainer component={Paper} sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Day of Year</strong></TableCell>
                <TableCell><strong>Daily GDD</strong></TableCell>
                <TableCell><strong>Cumulative GDD</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gddData.length > 0 ? (
                gddData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.Date}</TableCell>
                    <TableCell>{row.Day_Of_Year}</TableCell>
                    <TableCell>{row.Daily_GDD}</TableCell>
                    <TableCell>{row.Cumulative_GDD}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // === Highcharts Chart ===
        <div
          ref={chartContainerRef}
          style={{
            width: "100%",
            height: "350px", 
            marginTop: "8px",
          }}
        >
          <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        </div>
      )}

      {/*  Source Above Cancel Button */}
      <Typography variant="body2" align="right" style={{ marginTop: "8px" }}>
        <a href="https://weather.wsu.edu/" target="_blank" rel="noopener noreferrer" style={{ color: "#C62828", textDecoration: "none" }}>
          Source: AgWeatherNet
        </a>
      </Typography>

      {/* === Cancel/Close Button === */}
      {/* <Button
        onClick={closeModal}
        variant="contained"
        sx={{
          mt: 2,
          backgroundColor: "#6c757d",
          color: "white",
          width: "100%",
        }}
      >
        Cancel
      </Button> */}
    </Box>
  );
};

export default GDDDataModal;
