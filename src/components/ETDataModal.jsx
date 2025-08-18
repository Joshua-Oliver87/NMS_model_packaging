import { useEffect, useState, useRef, useContext } from "react";
import { fetchDailyWeatherData } from "../util/apiUtil";
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TableCell,
  Paper,
  FormControlLabel,
  Switch,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Dropdown } from "./Dropdown";
import { Label } from "./Label";
import {
  dropDownOptions,
  getFrequencyDates,
  globalUnits,
} from "../util/shared-utils";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import { UserContext } from "../context/UserContext.js";

// Highcharts imports
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export const ETDataModal = ({
  closeModal,
  nearestStationUnitId,
  setIsETModalOpen,
}) => {
  const [dailyWeatherData, setDailyWeatherData] = useState([]);
  const [dailyWeatherChart, setDailyWeatherChart] = useState([]); // Ensure initialized as array
  const [weatherDataFrequency, setWeatherDataFrequency] = useState(
    dropDownOptions[0]
  );
  const [frequencyStartDate, setFrequencyStartDate] = useState(null);
  const [frequencyEndDate, setFrequencyEndDate] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { userSavedUnit } = useContext(UserContext);
  const open = Boolean(anchorEl);

  const chartContainerRef = useRef(null);

  useEffect(() => {
    // Default frequency
    setFrequencyDates(dropDownOptions[0].value);
  }, []);

  useEffect(() => {
    if (nearestStationUnitId && frequencyStartDate && frequencyEndDate) {
      fetchDailyWeatherData(
        nearestStationUnitId,
        frequencyStartDate,
        frequencyEndDate
      )
        .then((res) => {
          // Convert each row's data to numeric
          const chartData = (res || []).map((row) => ({
            ...row,
            Date: formatDateSafe(row.Date),
            ETR: parseFloat(row.ETR) || 0,
            ETO: parseFloat(row.ETO) || 0,
          }));
          setDailyWeatherData(res || []);
          setDailyWeatherChart(chartData);
        })
        .catch((err) => {
          console.error("Error fetching daily weather data:", err);
          setDailyWeatherData([]);
          setDailyWeatherChart([]); // Set to empty array on error
        });
    }
  }, [nearestStationUnitId, frequencyStartDate, frequencyEndDate]);

  const setFrequencyDates = (frequency) => {
    const { startDate, endDate } = getFrequencyDates(frequency);
    setFrequencyStartDate(startDate);
    setFrequencyEndDate(endDate);
  };

  const setFrequency = (e) => {
    const selectedIndex = dropDownOptions[e.target.selectedIndex];
    setWeatherDataFrequency(selectedIndex);
    if (selectedIndex.value !== "Custom") {
      setFrequencyDates(selectedIndex.value);
    }
  };

  const formatDateSafe = (dateStr) => {
    if (typeof dateStr === "string" && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toISOString().split("T")[0];
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // CSV Export
  const downloadCSV = () => {
    handleClose();
    if (!dailyWeatherData.length) return;

    const csvHeader = ["Date,ETR,ETO"];
    const csvRows = dailyWeatherData.map(
      (row) => `${formatDateSafe(row.Date)},${row.ETR},${row.ETO}`
    );
    const csvString = [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ET_Data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export
  const downloadPDF = () => {
    handleClose();
    if (!dailyWeatherData.length) return;

    const doc = new jsPDF();
    doc.text("ET Data", 14, 10);

    // Create table
    const tableColumn = ["Date", "ETR", "ETO"];
    const tableRows = dailyWeatherData.map((row) => [
      formatDateSafe(row.Date),
      row.ETR,
      row.ETO,
    ]);

    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });

    // Calculate final Y position after table is done
    const finalY = doc.lastAutoTable.finalY;

    // Configure text for "Source: AgWeatherNet"
    doc.setFontSize(9); // smaller font
    doc.setTextColor(198, 40, 40); // crimson color (C62828)

    const sourceText = "Source: AgWeatherNet";
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(sourceText);

    // Position near the right edge, 14px from the edge
    const xPos = pageWidth - textWidth - 14;
    const yPos = finalY + 10;

    // Draw clickable link
    doc.textWithLink(sourceText, xPos, yPos, {
      url: "https://weather.wsu.edu/",
    });

    doc.save("ET_Data.pdf");
  };

  // Image Export
  const handleDownloadChartImage = async (format) => {
    if (!dailyWeatherChart.length || !chartContainerRef.current) return;

    try {
      // Capture the chart container as a canvas
      const chartContainer = chartContainerRef.current;
      const canvas = await html2canvas(chartContainer, { useCORS: true });

      // Create a new canvas with extra height for the source text
      const newCanvas = document.createElement("canvas");
      const ctx = newCanvas.getContext("2d");

      // Increase canvas height to add source text
      newCanvas.width = canvas.width;
      newCanvas.height = canvas.height + 30; // Extra space at the bottom

      // Fill bottom area with white
      ctx.fillStyle = "white";
      ctx.fillRect(0, canvas.height, newCanvas.width, 30);

      // Draw the original chart onto the new canvas
      ctx.drawImage(canvas, 0, 0);

      // Set text properties for source text
      ctx.font = "12px Arial";
      ctx.fillStyle = "#C62828"; // Crimson text color
      ctx.textAlign = "right";

      // Draw the source text at the bottom-right
      ctx.fillText(
        "Source: AgWeatherNet",
        newCanvas.width - 10,
        newCanvas.height - 10
      );

      // Convert to image and download
      const link = document.createElement("a");
      link.download = `ET_Chart.${format}`;
      link.href = newCanvas.toDataURL(`image/${format}`, 1.0);
      link.click();
    } catch (error) {
      console.error("Failed to download chart image:", error);
    }

    handleClose();
  };

  // Highcharts configuration
  const chartOptions = {
    chart: {
      type: "line",
      spacingBottom: 40, // extra space for legend
    },
    title: {
      text: "ET Data",
    },
    legend: {
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
    },
    xAxis: {
      categories: Array.isArray(dailyWeatherChart)
        ? dailyWeatherChart.map((row) => row.Date)
        : [],
      labels: {
        rotation: -45,
      },
    },
    yAxis: {
      title: {
        text: "ETR/ETO",
      },
      min: 0,
    },
    series: [
      {
        name: "ETR",
        data: Array.isArray(dailyWeatherChart)
          ? dailyWeatherChart.map((row) => row.ETR)
          : [],
        color: "black",
        lineWidth: 2,
      },
      {
        name: "ETO",
        data: Array.isArray(dailyWeatherChart)
          ? dailyWeatherChart.map((row) => row.ETO)
          : [],
        color: "red",
        lineWidth: 2,
      },
    ],
    credits: {
      enabled: false,
    },
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: "52%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "40%",
        height: "369px",
        bgcolor: "background.paper",
        borderRadius: "30px",
        boxShadow: 24,
        padding: "24px",
        zIndex: 999,
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

      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "15px",
        }}
      >
        <h4>ET Data</h4>
        <FormControlLabel
          control={
            <Switch
              checked={showChart}
              onChange={() => setShowChart(!showChart)}
            />
          }
          label={showChart ? " Table" : " Chart"}
        />

        <IconButton onClick={handleClick} 
            sx={{
            color: "#555",
            backgroundColor: "transparent",
            "&:hover": {
              color: "#000",
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
          }}>
          <FileDownloadIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          <MenuItem onClick={downloadCSV}>CSV</MenuItem>
          <MenuItem onClick={downloadPDF}>PDF</MenuItem>
          <MenuItem onClick={() => handleDownloadChartImage("jpeg")}>
            JPG
          </MenuItem>
          <MenuItem onClick={() => handleDownloadChartImage("png")}>
            PNG
          </MenuItem>
        </Menu>
      </div>

      {/* Frequency + optional date range */}
      <div style={{marginBottom: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 100px"}}>
          <Dropdown
            label="Frequency"
            options={dropDownOptions}
            onChange={setFrequency}
            defaultOptionValue={weatherDataFrequency.value}
          />
        </div>

        {weatherDataFrequency.value === "Custom" && (
          <>
            <div style={{ flex: "1 1 100px", flexWrap: "wrap", alignItems: "flex-end"}}>
              <Label
                type="date"
                label="Start Date"
                elementName="startDate"
                onChange={(e) => setFrequencyStartDate(e.target.value)}
              />
            </div>
            <div style={{ flex: "1 1 100px" }}>
              <Label
                type="date"
                label="End Date"
                elementName="endDate"
                onChange={(e) => setFrequencyEndDate(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* Show either table or chart */}
      {!showChart ? (
        <TableContainer component={Paper}>
          {dailyWeatherData.length === 0 ? (
            <Typography variant="h6" align="center" style={{ margin: "16px" }}>
              No records to display
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    "Date",
                    `ETR(${globalUnits[userSavedUnit]?.length})`,
                    `ETO(${globalUnits[userSavedUnit]?.length})`,
                  ].map((key) => (
                    <TableCell key={key}>{key}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {dailyWeatherData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell>{formatDateSafe(row.Date)}</TableCell>
                    <TableCell>
                      {row.ETR ? parseFloat(row.ETR).toFixed(2) : "0.00"}
                    </TableCell>
                    <TableCell>
                      {row.ETO ? parseFloat(row.ETO).toFixed(2) : "0.00"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      ) : (
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

      {/* Source link (no underline), always above Cancel button */}
      <Typography variant="body2" align="right" style={{ marginTop: "8px" }}>
        <a
          href="https://weather.wsu.edu/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#C62828", textDecoration: "none" }}
        >
          Source: AgWeatherNet
        </a>
      </Typography>

      {/* Cancel button */}
      {/* <Button
        variant="contained"
        style={{
          marginTop: "8px",
          backgroundColor: "#6c757d",
          color: "white",
          width: "100%",
        }}
        onClick={closeModal}
      >
        Cancel
      </Button> */}
    </Box>
  );
};
