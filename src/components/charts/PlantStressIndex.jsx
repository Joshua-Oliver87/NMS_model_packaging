import React from "react";
import { Dialog, DialogTitle, DialogContent, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const PlantStressIndex = ({ closeModal, chartData }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const chartDataArray = Object.values(chartData);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDownload = (format) => {
    const chart = document.querySelector(".highcharts-container").parentNode;
    const svg = chart.querySelector("svg").outerHTML;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height + 30;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      ctx.font = "12px Arial";
      ctx.fillStyle = "#C62828";
      ctx.textAlign = "right";
      ctx.fillText("Source: AgWeatherNet", canvas.width - 10, canvas.height - 10);
      const link = document.createElement("a");
      link.download = `plant-stress-index.${format}`;
      link.href = canvas.toDataURL(`image/${format}`);
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    handleMenuClose();
  };

  const chartOptions = {
    chart: {
      type: "line",
      height: 400,
      width: 400,
      backgroundColor: "#ffffff", // White background
    },
    title: {
      text: null
    },
    xAxis: {
      title: { text: "DOY", style: { color: "black" } }, // Black title
      categories: chartDataArray.map((data) => data.DOY),
      labels: { style: { color: "crimson" } }, // Crimson labels
    },
    yAxis: {
      title: { text: "Value", style: { color: "black" } }, // Black title
      labels: { style: { color: "crimson" } }, // Crimson labels
      min: 0
    },
    series: [
      {
        name: "Plant Stress Index",
        data: chartDataArray.map((data) => data["Crop NSI (0-1)"] ?? null),
        color: "crimson",
        lineWidth: 2,
      },
    ],
    legend: {
      itemStyle: { color: "crimson" }, // Crimson legend text
    },
    credits: {
      enabled: false,
    },
    navigation: {
      buttonOptions: {
        enabled: false, // Disable the three-line menu button
      },
    },
    exporting: {
      chartOptions: {
        chart: {
          backgroundColor: "#ffffff",
        },
        xAxis: {
          title: { style: { color: "black" } },
          labels: { style: { color: "crimson" } },
        },
        yAxis: {
          title: { style: { color: "black" } },
          labels: { style: { color: "crimson" } },
        },
        legend: {
          itemStyle: { color: "crimson" },
        },
      },
    },
  };

  return (
    <Dialog
      open
      onClose={closeModal}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 6,
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          color: "#333",
          borderBottom: "0.5px solid #ddd",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span>Plant Stress Index Chart</span>
          <IconButton
            aria-label="download"
            onClick={handleMenuOpen}
            sx={{
              marginLeft: 30,
              color: "#999",
            }}
          >
            <DownloadIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleDownload("png")}>PNG</MenuItem>
            <MenuItem onClick={() => handleDownload("jpeg")}>JPG</MenuItem>
          </Menu>
        </div>
        <IconButton
          aria-label="close"
          onClick={closeModal}
          sx={{ position: "absolute", right: 8, top: 8, color: "crimson" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "420px",
          backgroundColor: "#fff",
        }}
      >
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        <Typography variant="body2" align="right" style={{ marginTop: "8px", width: "400px" }}>
          <a
            href="https://weather.wsu.edu/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#C62828", textDecoration: "none" }}
          >
            Source: AgWeatherNet
          </a>
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default PlantStressIndex;