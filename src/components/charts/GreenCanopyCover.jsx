import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const GreenCanopyCover = ({ closeModal, chartData }) => {
  const [chartOptions, setChartOptions] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

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
      // Set canvas dimensions with extra height for the source text
      canvas.width = img.width;
      canvas.height = img.height + 30; // Extra space for source text

      // Fill background with white
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the chart image
      ctx.drawImage(img, 0, 0);

      // Add source text
      ctx.font = "12px Arial";
      ctx.fillStyle = "#C62828"; // Crimson color for the text
      ctx.textAlign = "right";
      ctx.fillText("Source: AgWeatherNet", canvas.width - 10, canvas.height - 10);

      // Create download link
      const link = document.createElement("a");
      link.download = `green-canopy-cover.${format}`;
      link.href = canvas.toDataURL(`image/${format}`);
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    handleMenuClose();
  };

  useEffect(() => {
    if (chartData) {
      setChartOptions({
        chart: {
          type: "line",
          height: 400,
          width: 400,
          backgroundColor: "#ffffff",
        },
        title: {
          text: null,
        },
        xAxis: {
          title: { text: "DOY", style: { color: "black" } },
          categories: Object.values(chartData)?.map((data) => data.DOY),
          labels: { style: { color: "crimson" } },
          tickInterval: 1,
        },
        yAxis: {
          title: { text: "Value", style: { color: "black" } },
          labels: { style: { color: "crimson" } },
          min: 0,
          max: 1,
        },
        series: [
          {
            name: "Green Canopy Cover",
            data: Object.values(chartData)?.map((data) => {
              const value = data["Green Canopy Cover"];
              return value !== undefined && value !== null
                ? Number(parseFloat(value).toFixed(2))
                : null;
            }),
            color: "crimson",
            lineWidth: 2,
          },
        ],
        legend: {
          itemStyle: { color: "crimson" },
        },
        credits: {
          enabled: false,
        },
        navigation: {
          buttonOptions: {
            enabled: false,
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
      });
    }
  }, [chartData]);

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
          <span>Green Canopy Cover Chart</span>
          <IconButton
            aria-label="download"
            onClick={handleMenuOpen}
            sx={{
              marginLeft: 25,
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
        {chartOptions ? (
          <>
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
          </>
        ) : (
          <p style={{ color: "crimson" }}>No data available for chart</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GreenCanopyCover;