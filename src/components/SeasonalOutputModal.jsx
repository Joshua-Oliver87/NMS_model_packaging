import React, { useState, useRef, useContext } from "react";
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
  Switch,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";

// Highcharts
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { UserContext } from "../context/UserContext";

const SeasonalOutputModal = ({ closeModal, seasonalData }) => {
  const [showChart, setShowChart] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { userSavedUnit } = useContext(UserContext); // Access login state from context
  const open = Boolean(anchorEl);

  // For screenshots
  const tableRef = useRef(null);
  const chartRef = useRef(null);

  const units = {
    "English":{
      "distance": "in",
      "area": "lb/acre",
    },
    "Metric":{
      "distance": "mm",
      "area": "kg/ha",
    }
  };    
  // Your row names
  const rowNames = [
    `Cumulative Deep Drainage(${units[userSavedUnit]["distance"]})`,
    `Cumulative N Leaching (${units[userSavedUnit]["area"]})`,
    `Cumulative mineralization, 0.0 m - 0.3 m soil layer (${units[userSavedUnit]["area"]})`,
    `Cumulative mineralization, 0.3 m - 0.6 m soil layer (${units[userSavedUnit]["area"]})`,
    `Residual soil profile nitrate (${units[userSavedUnit]["area"]})`,
    `Residual soil profile ammonium (${units[userSavedUnit]["area"]})`,
    `Cumulative irrigation (${units[userSavedUnit]["distance"]})`,
    `Cumulative N fertilization (${units[userSavedUnit]["area"]})`,
    `Seasonal Transpiration (${units[userSavedUnit]["distance"]})`,
    `Seasonal N Uptake (${units[userSavedUnit]["area"]})`,
    `Seasonal Potential Biomass (${units[userSavedUnit]["area"]})`,
    `Seasonal Actual Biomass (${units[userSavedUnit]["area"]})`,
  ];

  // Prepare data for Highcharts
  const chartData = rowNames.map((name) => ({
    name,
    value: seasonalData?.[0]?.[name]
      ? Number(seasonalData[0][name]).toFixed(2)
      : "0.00",
  }));

  // === Menu Handlers ===
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // === Exports: CSV/PDF/Image ===
  const handleDownloadCSV = () => {
    handleMenuClose();
    if (!seasonalData?.length) return;

    const csvHeader = ["Seasonal Factor,Seasonal Data"];
    const csvRows = rowNames.map((name) => {
      const val = seasonalData[0][name] || 0;
      return `${name},${Number(val).toFixed(2)}`;
    });

    const csvString = [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Seasonal_Output_Data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    handleMenuClose();
    if (!seasonalData?.length) return;

    const doc = new jsPDF();
    doc.text("Seasonal Output Data", 14, 10);

    const tableColumn = ["Seasonal Factor", "Seasonal Data"];
    const tableRows = rowNames.map((name) => {
        const val = seasonalData[0][name] || 0;
        return [name, Number(val).toFixed(2)];
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    });

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

    doc.save("Seasonal_Output_Data.pdf");
};

const handleDownloadImage = async (format) => {
    handleMenuClose();
    if (!seasonalData?.length) return;

    const targetRef = showChart ? chartRef : tableRef;
    if (!targetRef.current) return;

    try {
        const canvas = await html2canvas(targetRef.current, { useCORS: true });

        // Create a new canvas with extra space for the source text
        const newCanvas = document.createElement("canvas");
        const ctx = newCanvas.getContext("2d");

        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height + 30; // Extra space at the bottom

        // Fill bottom area with white
        ctx.fillStyle = "white";
        ctx.fillRect(0, canvas.height, newCanvas.width, 30);

        // Draw the original chart or table onto the new canvas
        ctx.drawImage(canvas, 0, 0);

        // Set text properties for the source
        ctx.font = "12px Arial";
        ctx.fillStyle = "#C62828"; // Crimson color
        ctx.textAlign = "right";

        // Draw the source text at the bottom-right
        ctx.fillText("Source: AgWeatherNet", newCanvas.width - 10, newCanvas.height - 10);

        // Convert to image and download
        const link = document.createElement("a");
        link.download = `Seasonal_Output_Data.${format}`;
        link.href = newCanvas.toDataURL(`image/${format}`, 1.0);
        link.click();
    } catch (error) {
        console.error("Failed to capture image:", error);
    }
};


  // === Highcharts config with a Logarithmic Axis ===
  const chartOptions = {
    chart: {
      type: "column",
      spacingBottom: 0, // remove extra space below
      spacingTop: 20,
      backgroundColor: null,
      marginBottom: 100,
    },
    title: {
      text: "Seasonal Output Data",
      style: { fontSize: "16px", fontWeight: "bold" },
    },
    xAxis: {
      categories: chartData.map((item) => item.name),
      labels: {
        rotation: -35,
        style: { color: "crimson", fontSize: "12px" },
      },
    },
    // 1) Use a log axis so small bars are visible
    yAxis: {
      type: "logarithmic",
      minorTickInterval: 1,
      title: { text: "Value (log scale)" },
      labels: { style: { color: "crimson", fontSize: "12px" } },
    },
    legend: {
      align: "center",
      verticalAlign: "top",
    },
    tooltip: {
      shared: true,
      headerFormat: "<b>{point.key}</b><br/>",
    },
    plotOptions: {
      column: {
        pointWidth: 30,
        borderRadius: 5,
      },
    },
    series: [
      {
        name: "Seasonal Data",
        data: chartData.map((item) => parseFloat(item.value) || 0),
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "crimson"],
            [1, "#FF6F61"],
          ],
        },
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
        top: "55%",
        left: "50%",
        width: "38%",
        height: "66%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transform: "translate(-50%, -50%)",
        bgcolor: "background.paper",
        boxShadow: 24,
        p: 3,
        borderRadius: "10px",
        zIndex: 999,
        overflowY: "auto",
        flexGrow: 1, 
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

      {/* Header Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "1.5rem",
        }}
      >
        <Typography variant="h6" align="left" gutterBottom>
          Seasonal Output Data
        </Typography>

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
          sx={{ color: "crimson", marginRight: "1rem" }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-0.6rem" }}>
          <IconButton onClick={handleMenuOpen}>
            <FileDownloadIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
            <MenuItem onClick={handleDownloadCSV}>CSV</MenuItem>
            <MenuItem onClick={handleDownloadPDF}>PDF</MenuItem>
            <MenuItem onClick={() => handleDownloadImage("jpeg")}>JPG</MenuItem>
            <MenuItem onClick={() => handleDownloadImage("png")}>PNG</MenuItem>
          </Menu>
        </div>
      </div>

      {/* Table or Chart */}
      {!showChart ? (
        <div ref={tableRef}>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Seasonal Factor</strong></TableCell>
                  <TableCell><strong>Seasonal Data</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {seasonalData?.length > 0 ? (
                  Object.keys(seasonalData[0]).map((name, index) => (
                    <TableRow key={index}>
                      <TableCell>{name}</TableCell>
                      <TableCell>
                        {Number(seasonalData[0][name]).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      ) : (
        <div
          ref={chartRef}
          style={{
            width: "100%",
            height: "450px",
            marginBottom: 0,
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

      {/* Cancel Button: definitely present */}
      {/* <Button
        onClick={closeModal}
        variant="contained"
        sx={{
          mt: 1,
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

export default SeasonalOutputModal;
