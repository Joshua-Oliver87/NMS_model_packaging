import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const NUptakeRate = ({ closeModal, chartData }) => {
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

    // Detect the key dynamically (label should always be "N Uptake")
    const firstEntry = chartDataArray[0];
    const uptakeRateKey = Object.keys(firstEntry).find((key) =>
      key.startsWith("N Uptake")
    );

    if (!uptakeRateKey) {
      console.error("Could not find a key for N Uptake!");
      return;
    }

    // Extract the unit dynamically from "N Uptake (unit)"
    const uptakeUnit = uptakeRateKey.match(/\((.*?)\)/)?.[1] || "Unknown Unit";

    setChartOptions({
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
        title: { text: "DAE", style: { color: "crimson" } },
        categories: chartDataArray.map((data) => data.DAE),
        labels: { style: { color: "crimson" } },
      },
      yAxis: {
        title: { text: `Value (${uptakeUnit})`, style: { color: "Black" } },
        labels: { style: { color: "crimson" } },
        min: 0,
      },
      series: [
        {
          name: `N Uptake (${uptakeUnit})`,
          data: chartDataArray.map((data) => data[uptakeRateKey] ?? null),
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
        N Uptake Chart
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

export default NUptakeRate;
