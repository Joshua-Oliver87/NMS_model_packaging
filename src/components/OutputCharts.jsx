import React from "react";
import DailyEtChartModal from "./charts/DailyEtChartModal";
import SoilWaterDepletion from "./charts/SoilWaterDepletion";
import PlantAvailableWaterDepletion from "./charts/PlantAvailableWaterDepletion";
import PlantNConcentration from "./charts/PlantNConcentration";
import CropNMass from "./charts/CropNMass";
import NUptakeRate from "./charts/NUptakeRate";
import PlantStressIndex from "./charts/PlantStressIndex";
import GreenCanopyCover from "./charts/GreenCanopyCover";
import CropHeight from "./charts/CropHeight";
import AbovegroundBiomass from "./charts/AbovegroundBiomass";
import SoilNMass from "./charts/SoilNMass";

/**
 * OutputCharts now shows ONLY the specific chart that matches 'chartKey'.
 * We no longer render a grid of all charts.
 */
const OutputCharts = ({ chartData, chartKey, closeModal }) => {
  if (!chartKey) return null; // safety check

  // Match the 'chartKey' to the appropriate component:
  switch (chartKey) {
    
    case "chart1":
      console.log("Rendering DailyEtChartModal with chartData:", chartData);
      return (
        
        <DailyEtChartModal chartData={chartData} closeModal={closeModal} />
      );
    case "chart2":
      return (
        <SoilWaterDepletion chartData={chartData} closeModal={closeModal} />
      );
    case "chart3":
      return (
        <PlantAvailableWaterDepletion
          chartData={chartData}
          closeModal={closeModal}
        />
      );
    case "chart4":
      return (
        <PlantNConcentration chartData={chartData} closeModal={closeModal} />
      );
    case "chart5":
      return <CropNMass chartData={chartData} closeModal={closeModal} />;
    case "chart6":
      return <NUptakeRate chartData={chartData} closeModal={closeModal} />;
    case "chart7":
      return <PlantStressIndex chartData={chartData} closeModal={closeModal} />;
    case "chart8":
      return <GreenCanopyCover chartData={chartData} closeModal={closeModal} />;
    case "chart9":
      return <CropHeight chartData={chartData} closeModal={closeModal} />;
    case "chart10":
      return (
        <AbovegroundBiomass chartData={chartData} closeModal={closeModal} />
      );
    case "chart11":
      return <SoilNMass chartData={chartData} closeModal={closeModal} />;
    default:
      return null;
  }
};

export default OutputCharts;
