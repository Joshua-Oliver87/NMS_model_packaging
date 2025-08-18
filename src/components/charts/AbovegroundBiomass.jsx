import React from "react";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const AboveGroundBiomass = ({ closeModal, chartData }) => {
  const chartDataArray = Object.values(chartData);
  const firstEntry = chartDataArray[0];
    const biomassKey = Object.keys(firstEntry).find(key => key.startsWith("Biomass "));    

    if (!biomassKey) {
      console.error("Could not find dynamic keys for biomass!");
      return;
    }

    // Extract the units dynamically
    const biomassUnit = biomassKey.match(/\((.*?)\)/)?.[1] || "Unknown Unit";    
  const chartOptions = {
    chart: {
      type: "line",
      height: 400,
      width: 400,
      backgroundColor: "transparent",
    },
    title: {
      text: null

    },
    xAxis: {
      title: { text: "DOY", style: { color: "crimson" } },
      categories: chartDataArray.map((data) => data.DOY),
      labels: { style: { color: "crimson" } },
    },
    yAxis: {
      title: { text: "Value (kg)", style: { color: "Black" } },      
      labels: { style: { color: "crimson" } },
      min: 0
    },
    series: [
      {
        name: `Above Ground Biomass ${biomassUnit}`,
        data: chartDataArray.map((data) => {
          const value = data[biomassKey];
          return value !== undefined && value !== null
            ? Number(parseFloat(value).toFixed(2))
            : null;
        }),
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
        Above Ground Biomass Chart
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

export default AboveGroundBiomass;
