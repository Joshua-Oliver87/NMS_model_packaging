import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const PlanNtAvailableWaterDepletion = ({ closeModal, chartData }) => {
  const [chartOptions, setChartOptions] = useState(null);
  
  useEffect(() => {    
    setChartOptions({
      chart: {
        type: "line",
        height: 400,
        width: 400,
        backgroundColor: "transparent",
      },
      title: {
        text: "Plant N Concentration",
        style: { color: "#333", fontSize: "1.2rem" },
      },
      xAxis: {
        title: { text: "DOY", style: { color: "crimson" } },
        categories: Object.values(chartData)?.map((data) => data.DOY),
        labels: { style: { color: "crimson" } },
      },
      yAxis: {
        title: { text: "Value", style: { color: "Black" } },
        labels: { style: { color: "crimson" } },
        min: 0,
        max: 1,
      },
      series: [
        {
          name: "Plant N Concentration",
          data: Object.values(chartData)?.map((data) => data["PAW Depletion (0-1)"]),
          color: "crimson",
          lineWidth: 2,
        },
      ],
      credits: {
        enabled: false,
      },
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
        Plant N Concentration Chart
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

export default PlanNtAvailableWaterDepletion;
