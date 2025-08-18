import React from "react";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const SoilWaterDepletion = ({ closeModal }) => {
  const chartOptions = {
    chart: {
      type: "line",
      height: 400,
      width: 400,
      backgroundColor: "transparent",
    },
    title: {
      text: "Soil Water Depletion",
      style: { color: "#333", fontSize: "1.2rem" },
    },
    xAxis: {
      title: { text: "DAE", style: { color: "Crimson" } },
      tickPositions: [20, 40, 80, 160, 240],
      labels: { style: { color: "crimson" } },
    },
    yAxis: {
      title: { text: "Value", style: { color: "Black" } },
      tickPositions: [20, 40, 80, 160, 240],
      labels: { style: { color: "crimson" } },
      min: 0,
      max: 240,
    },
    series: [
      {
        name: "Soil Water Depletion",
        data: [20, 40, 80, 160, 240], // Replace with actual data as needed
        color: "crimson",
        lineWidth: 2,
      },
    ],
    credits: {
      enabled: false,
    },
  };

  return (
    <Dialog
      open
      onClose={closeModal}
      maxWidth="sm"
      fullWidth
      // Add a paper style for a professional look & rounded corners
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
        }}
      >
        Soil Water Depletion Chart
        <IconButton
          aria-label="close"
          onClick={closeModal}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "crimson",
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "420px",
          backgroundColor: "#fff",
        }}
      >
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </DialogContent>
    </Dialog>
  );
};

export default SoilWaterDepletion;
