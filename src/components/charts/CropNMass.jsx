import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const CropNMass = ({ closeModal, chartData }) => {
  const [chartOptions, setChartOptions] = useState(null);

  useEffect(() => {
    console.log("chartData received:", chartData); // Debugging step

    if (!chartData || typeof chartData !== "object") {
      console.error("chartData is undefined or not an object!", chartData);
      return;
    }

    // Convert object to an array
    const chartDataArray = Object.values(chartData);

    if (!Array.isArray(chartDataArray) || chartDataArray.length === 0) {
      console.error("Converted chartData is empty!", chartDataArray);
      return;
    }

    // Detect the key dynamically (label should always be "Crop N Mass")
    const firstEntry = chartDataArray[0];
    const nMassKey = Object.keys(firstEntry).find((key) =>
      key.startsWith("Crop N Mass")
    );

    if (!nMassKey) {
      console.error("Could not find a key for Crop N Mass!");
      return;
    }

    // Extract the unit dynamically from "Crop N Mass (unit)"
    const nMassUnit = nMassKey.match(/\((.*?)\)/)?.[1] || "Unknown Unit";

    setChartOptions({
      chart: {
        type: "line",
        height: 400,
        width: 400,
        backgroundColor: "transparent",
      },
      title: {
        text: null,
  
      },
      xAxis: {
        title: { text: "DAE", style: { color: "crimson" } },
        categories: chartDataArray.map((data) => data.DAE),
        labels: { style: { color: "crimson" } },
      },
      yAxis: {
        title: { text: `Value (${nMassUnit})`, style: { color: "Black" } },
        labels: { style: { color: "crimson" } },
        min: 0,
      },
      series: [
        {
          name: `Crop N Mass (${nMassUnit})`,
          data: chartDataArray.map((data) => {
            const value = data[nMassKey];
            return value !== undefined && value !== null
              ? Number(parseFloat(value).toFixed(3))
              : null;
          }),
          color: "crimson",
          lineWidth: 2,
        },
      ],
      
      credits: { enabled: false },
    });
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
        }}
      >
        Crop N Mass Chart
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
        {chartOptions ? (
          <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        ) : (
          <p style={{ color: "crimson" }}>No data available for chart</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CropNMass;
