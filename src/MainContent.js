import React, { useState, useEffect, useContext } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polygon,
  Tooltip,
} from "react-leaflet";
import { Tooltip as ReactTooltip } from "react-tooltip";
import MarkerClusterGroup from "react-leaflet-markercluster"; // Import marker cluster
import L from "leaflet"; // Import Leaflet
import { useNavigate, useSearchParams } from "react-router-dom"; // Import useNavigate
import "leaflet/dist/leaflet.css"; // Leaflet styles
import "leaflet.markercluster/dist/MarkerCluster.css"; // Marker cluster styles
import "leaflet.markercluster/dist/MarkerCluster.Default.css"; // Default cluster styles
import "esri-leaflet";
import layersIcon from "./layers.png"; // Import layers icon
import pointerIcon from "./pointer.png"; // Import custom pointer icon
import { UserContext } from "./context/UserContext"; // Import UserContext to get user info dynamically
import axios from "axios";
import "./App.css";
import { MenuItem, Select, Typography, IconButton, FormControl, InputLabel,  } from "@mui/material";
import { FarmsContext } from "./context/FarmsContext";
import { findNearestStations, globalUnits } from "./util/shared-utils";
import { Card } from "./components/Card";
import { Item } from "./components/Item";
import { Label } from "./components/Label";
import TaskButton from "./components/TaskButton";
import { Radio } from "antd";
import DeleteIcon from "@mui/icons-material/Delete";
import CardContent from "@mui/material/CardContent";


import {
  writeCsv,
  calculateIrrigation,
  appendCSVData,
  fetchAndSaveWeatherData,
} from "./util/apiUtil"; // Ensure writeCsv is imported
import {
  fetchAdvancedSettings,
  fetchFertilizerData,
  fetchPlantingInfoSettings,
  fetchPlantingNames,
  fetchSoilData,
  fetchWaterSources,
  savePlantingData,
  updateFarmName,
} from "./util/apiUtil";
import { useParams } from "react-router-dom";

import { SoilDataModal } from "./components/SoilDataModal";
import { FertilizerDataModal } from "./components/FertilizerDataModal";
import { WaterResourcesDataModal } from "./components/WaterResourcesDataModal";
import { PlantingInfoModal } from "./components/PlantingInfoModal";
import BlocksDropdown from "./components/BlocksDropdown";
import PropertyFocus from "./components/PropertyFocus"; //  Correct Default Import
import EditFarmButton from "./components/EditFarmButton"; //  Import the new component
import API from "./util/api";

function MapViewUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center);
    }
  }, [center, map]);
  return null;
}

const handleSoil = async (objid, rows, onSuccess = () => {}) => {
  const payload = { objid, value: JSON.stringify(rows) };

  try {
    await API.post(`/api/updateSoilDetails`, payload);
    onSuccess(true);
  } catch (error) {
    console.error("Error while updating:", error);
    alert("Error while saving.");
  }
};



const MainContent = () => {
  const arcGisUrl =
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";
  const openStreetMapUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const [isCardsVisible, setIsCardsVisible] = useState(false); // State to control card visibility
  const washingtonStateCenter = [46.75577, -117.233049];
  const zoomLevel = 16;
  const maxZoomLevel = 19; // Allow users to zoom in a little more
  const [farmNames, setFarmNames] = useState([]); // Store list of farms
  const [selectedFarmFromDropdown, setSelectedFarmFromDropdown] =
    useState(null);
  const [farmName, setFarmName] = useState("");
  const [area, setArea] = useState("");

  const [soilRows, setSoilRows] = useState([]);


  const plantingInfo = [
    {
      label: "Planting Name",
      elementName: "plantingName",
    },
    {
      label: "Crop Type",
      elementName: "cropType",
      elementType: "dropdown",
      options: ["Wheat", "Corn", "Soybean", "Rice", "Barley"], // Example crop options
    },
    {
      label: "Planting Date",
      elementName: "plantingDate",
    },
    {
      label: "Emergence",
      elementName: "emergence",
    },
    {
      label: "Full Canopy",
      elementName: "fullCanopy",
    },
    {
      label: "Canopy Senescence",
      elementName: "senescence",
    },
    {
      label: "Maturity",
      elementName: "maturity",
    },
    {
      label: "Harvest",
      elementName: "harvest",
    },
    {
      label: "Expected Yield at Commercial Moisture (kg/ha)",
      elementName: "expectedYield",
    },
    {
      label: "GDD Base Temperature (C)",
      elementName: "gddBase",
    },
    {
      label: "GDD Upper Limit Temperature",
      elementName: "gddUpper",
    },
  ];
  const [customFertilizer, setCustomFertilizer] = useState({
    name: "",
    formulation: "Dry",
    nutrients: {
      nitrogen: 0,
      phosphorus: 0,
      potassium: 0,
      calcium: 0,
      magnesium: 0,
      nitrateN: 0,
      potassiumSap: 0,
      sulfur: 0,
      boron: 0,
      chloride: 0,
      copper: 0,
      iron: 0,
      manganese: 0,
      molybdenum: 0,
      sodium: 0,
      nickel: 0,
      zinc: 0,
      organicMatter: 0,
    },
  });
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [isPlantingInfoModalOpen, setIsPlantingInfoModalOpen] = useState(false);

  const [farmCoordinates, setFarmCoordinates] = useState(null);
  const [searchParams] = useSearchParams();

  const [mapCenter, setMapCenter] = useState(washingtonStateCenter);
  const [isSatelliteLayer, setIsSatelliteLayer] = useState(true);
  const [stations, setStations] = useState([]); // To store station data
  const navigate = useNavigate(); // Initialize navigate function
  const { user, userSavedUnit } = useContext(UserContext); // Get logged-in user data dynamically
  const { farms, selectedFarm, fetchFarms } = useContext(FarmsContext); // Get logged-in user data dynamically
  const [blocks, setBlocks] = useState([]);
  const [nearestStations, setNearestStations] = useState([]); // Nearest stations for dropdown
  const [isSoilModalOpen, setIsSoilModalOpen] = useState(false);
  const [isFertilizerModalOpen, setIsFertilizerModalOpen] = useState(false);
  const [isWaterResourcesModalOpen, setIsWaterResourcesModalOpen] =
    useState(false);
  const [isPlantingInfoModal, setIsPlantingInfoModal] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fertilizerAdded, setFertilizerAdded] = useState(false);
  const [waterSourceAdded, setWaterSourceAdded] = useState(false);
  const [selectedPlantingSettings, setSelectedPlantingSettings] =
    useState(null);
  const [selectedPlantingAdvanceSettings, setSelectedPlantAdvanceSettings] =
    useState(null);

  const handleEditFarm = () => {
    console.log("Edit Farm Clicked!");
    setIsDialogOpen(!isDialogOpen);
  };

  useEffect(() => {
    console.log(" isDialogOpen changed:", isDialogOpen);
  }, [isDialogOpen]);

  const [plantingInfoDropdown, setPlantingInfoDropdown] = useState([]); // Irrigation
  const [soilModalData, setSoilModalData] = useState([]);
  const [soilCardData, setSoilCardData] = useState("");
  const [soilObjid, setSoilObjid] = useState("");
  const [selectedPlanting, setSelectedPlanting] = useState(null);
  const [fertilizerCardData, setFertilizerCardData] = useState(null);
  const [waterSourcesCardData, setWaterSourcesCardData] = useState([]); //  Always start with an empty array
  const [plantingDate, setPlantingDate] = useState(null); //  Always start with an empty array
  const [nearestWeatherStation, setNearestWeatherStation] = useState(null); //  Always start with an empty array
  const [nearestWeatherStations, setNearestWeatherStations] = useState(null); //  Always start with an empty array
  const selectedBlock = blocks.find(b => b.block_id === selectedBlockId);

  useEffect(() => {
    if (selectedBlockId && blocks.length) {
      const exists = blocks.some(b => b.block_id === selectedBlockId);
      if (!exists) {
        setSelectedBlockId(null);
        setIsCardsVisible(false); // hide the cards too
      }
    }
  }, [blocks]);  

  useEffect(() => {
    if (!farms.length) {
      setMapCenter(washingtonStateCenter); // Default to Washington if no farms
      return; //  Prevent running until farms are loaded
    }

    let selectedFarm = null;
    const farmId = searchParams.get("farm");
    if (farmId) {
      // Ensure comparison works by converting both to strings
      const newSelectedFarm = farms.find(
        (farm) => farm.objid.toString() === farmId
      );
      selectedFarm = { ...newSelectedFarm };
    }

    if (selectedFarm != null && Object.keys(selectedFarm).length > 0) {
      selectedFarm.coordinates = selectedFarm?.coordinates.map((coord) => [
        coord[1],
        coord[0],
      ]);
      setIsCardsVisible(false);
      setSelectedFarmFromDropdown(selectedFarm);
      setFarmName(selectedFarm.name);
      setArea(selectedFarm.acres);
      setFarmCoordinates(selectedFarm.coordinates);
      setMapCenter(selectedFarm.coordinates?.[0] || [46.75577, -117.233049]);

      localStorage.setItem("selectedFarm", JSON.stringify(selectedFarm));
      fetchBlocks(selectedFarm.objid);
    }
  }, [searchParams, farms, selectedFarm]);

  // Add the missing useEffect to populate nearestStations
  useEffect(() => {
    if (stations && farmCoordinates) {
      const res = findNearestStations(farmCoordinates[0], stations);
      setNearestWeatherStations(res); // set nearest weather stations
      setNearestStations(res[0]);
    }
  }, [stations, farmCoordinates]);

  useEffect(() => {
    if (selectedBlockId) {
      fetchSoilData(selectedBlockId).then((res) => {
        if (res && res.finalSoilTableResponse) {
          const units = globalUnits[userSavedUnit].length;
          const firstSoilResponse = res.finalSoilTableResponse[0];
          setSoilRows(res?.finalSoilTableResponse || []);
          const soilCardText = `Texture: ${firstSoilResponse.Texture || "N/A"}
          Thickness (${units}): ${
          firstSoilResponse[`Thickness (${units})`] != null
            ? Math.round(firstSoilResponse[`Thickness (${units})`])
            : "N/A"
          }
                Clay (%): ${
          firstSoilResponse["Clay (%)"] != null
            ? Math.round(firstSoilResponse["Clay (%)"])
            : "N/A"
          }
          Silt (%): ${
          firstSoilResponse["Silt (%)"] != null
            ? Math.round(firstSoilResponse["Silt (%)"])
            : "N/A"
          }
          Sand (%): ${
          firstSoilResponse["Sand (%)"] != null
            ? Math.round(firstSoilResponse["Sand (%)"])
            : "N/A"
          }`.trim();
                setSoilModalData(res?.finalSoilTableResponse);
                setSoilCardData(soilCardText);
                setSoilObjid(res?.objid);
          } else {
            console.error("No soil data available for blockId", selectedBlockId);
            setSoilCardData("No Soil Data Available");
            setSoilRows([]);
            setSoilModalData([]);
          }
      });
      fetchPlantingInfoData();
      fetchFertilizerData(selectedBlockId).then((res) =>
        setFertilizerCardData(res)
      );
      fetchWaterSources(selectedBlockId).then((res) => {
        setWaterSourcesCardData(res);
        console.log(res);
      });
    }
  }, [selectedBlockId]);

  useEffect(() => {
    if (fertilizerAdded) {
      fetchFertilizerData(selectedBlockId).then((res) =>
        setFertilizerCardData(res)
      );
      setFertilizerAdded(false);
    }
  }, [fertilizerAdded]);

  useEffect(() => {
    if (waterSourceAdded) {
      fetchWaterSources(selectedBlockId).then((res) => {
        setWaterSourcesCardData(res);
      });
      setWaterSourceAdded(false);
    }
  }, [waterSourceAdded]);
  const fetchPlantingInfoData = () => {
    fetchPlantingNames(selectedBlockId).then((res) =>
      setPlantingInfoDropdown(res)
    );
  };

  const deletePlanting = async (plantingId) => {
    try {
      await API.delete(`/api/planting/delete/${plantingId}`);
      fetchPlantingInfoData();
    } catch (err) {
      console.error("Error deleting planting:", err);
      alert("Failed to delete planting.");
    }
  };
  

  const fetchBlocks = async (objid) => {
    try {
      const response = await API.get(`/api/blocks?farmId=${objid}`);

      if (Array.isArray(response.data.blocks)) {
        setBlocks(response.data.blocks);
      } else {
        setBlocks([]);
      }
    } catch (error) {
      console.error(
        "Error fetching blocks:",
        error.response || error.message || error
      );
    }
  };

  useEffect(() => {
    API.get(`/api/activeWeatherStations`) // Fetch from your backend API
      .then((data) => {
        if (data?.data?.stations) {
          // Filter and parse valid station data
          const filteredStations = data.data.stations.filter(
            (station) =>
              station !== null &&
              !isNaN(station.STATION_LATDEG) &&
              !isNaN(station.STATION_LNGDEG) &&
              station.STATION_LATDEG !== null &&
              station.STATION_LNGDEG !== null
          );
          const parsedStations = filteredStations.map((station) => ({
            UNIT_ID: station.UNIT_ID || null,
            lat: Math.abs(parseFloat(station.STATION_LATDEG)), // Ensure latitude is positive
            lng: -Math.abs(parseFloat(station.STATION_LNGDEG)), // Ensure longitude is negative
            name: station.STATION_NAME || "Unknown Station",
            temperature: parseInt(station.AIR_TEMP) || "N/A", // Include temperature
            SOIL_TEMP_8_IN: station.SOIL_TEMP_8_IN || "N/A",
            REL_HUMIDITY: station.REL_HUMIDITY || "N/A",
            SOIL_MOIS_8_IN: station.SOIL_MOIS_8_IN || "N/A",
            WIND_SPEED: station.WIND_SPEED || "N/A",
            WIND_SPEED_MAX: station.WIND_SPEED_MAX || "N/A",
            SOIL_TEMP_2_IN: station.SOIL_TEMP_2_IN || "N/A",
            AIR_PRESSURE: station.AIR_PRESSURE || "N/A",
            PRECIP: station.PRECIP || "N/A",
            SOLAR_RAD: station.SOLAR_RAD || "N/A",
          }));
          console.log("Parsed Stations:", parsedStations); // Debug log
          setStations(parsedStations); // Update state with valid station data
        }
      })
      .catch((error) => console.error("Error fetching stations:", error));
  }, []);

  const handleStationSelection = async (e) => {
    const selectedUnitId = e.target.value;
    try {
      const objId = user.objid;
      const response = await fetchAndSaveWeatherData(selectedUnitId, objId);

      if (response?.message) {
        console.log("Weather CSV creation successful:", response.message);
        // alert("Weather data saved and CSV created.");
      }
    } catch (error) {
      console.error("Error calling fetchAndSaveWeatherData:", error);
      alert("Error fetching weather data.");
    }
  };

  const createCustomIcon = (temperature) =>
    new L.DivIcon({
      html: `<div style="background: white; padding: 5px; border-radius: 50%; text-align: center; border: 1px solid #999;">
               <span style="font-size: 12px; font-weight: bold;">${temperature}${
        globalUnits[userSavedUnit]?.temperature || "°F"
      }</span>
             </div>`,
      iconSize: [40, 40],
      className: "temperature-icon",
    });

  // const fetchWeatherData = async (unitId) => {
  //   // Example API fetch; replace with your actual API call
  //   const response = await fetch(`/api/weather?unitId=${unitId}`);
  //   const data = await response.json();
  //   return data;
  // };

  const openModal = () => {
    setIsSoilModalOpen(true);
  };
  const closeModal = () => {
    setIsSoilModalOpen(false);
    setIsFertilizerModalOpen(false);
  };

  const setCardsData = (id) => {
    setIsCardsVisible(true);
    setSelectedBlockId(id);
  };

  const handlePlantingChange = (e) => {
    const plantingInfo = {};
    let cropType = "";
    const irrigationData = {
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      irrigationMethod: "paw_depletion",
      refillDepth: "",
    };

    const selectedId = parseInt(e.target.value);
    const selectedPlant = plantingInfoDropdown.find(
      (option) => option.objid === selectedId
    );
    setSelectedPlanting(selectedPlant);

    fetchPlantingInfoSettings(selectedPlant?.objid).then((data) => {
      plantingInfo["plantName"] = selectedPlant?.name;
      plantingInfo["plantingAreaId"] = selectedBlockId;

      data.forEach((element) => {
        switch (element.name) {
          case "PAWDEPLETION":
            irrigationData["pawDepletionTrigger"] = element.value;
            break;
          case "cropType":
            cropType = element.value;
            plantingInfo["cropType"] = element.value;
            break;
          case "plantingDate":
            plantingInfo["plantingDate"] = element.value;
            break;
          case "canopySenescence":
            plantingInfo["canopySenescence"] = element.value;
            break;
          case "emergenceDate":
            plantingInfo["emergenceDate"] = element.value;
            break;
          case "expectedYield":
            plantingInfo["expectedYield"] = element.value;
            break;
          case "fullCanopyDate":
            plantingInfo["fullCanopyDate"] = element.value;
            break;
          case "gddBaseTemp":
            plantingInfo["gddBaseTemp"] = element.value;
            break;
          case "gddUpperTemp":
            plantingInfo["gddUpperTemp"] = element.value;
            break;
          case "harvestDate":
            plantingInfo["harvestDate"] = element.value;
            break;
          case "maturityDate":
            plantingInfo["maturityDate"] = element.value;
            break;
          case "startDate":
            irrigationData.startDate = element.value;
            break;
          case "endDate":
            irrigationData.endDate = element.value;
            break;
          default:
            break;
        }
      });

      plantingInfo["irrigationData"] = irrigationData;
      setSelectedPlantingSettings(plantingInfo);

      fetchAdvancedSettings(cropType).then((info) => {
        if (info) {
          setSelectedPlantAdvanceSettings(info);

          const finalPayload = {
            ...plantingInfo,
            ...info,
          };

          console.log("🔹 Writing CSV Payload:", finalPayload);

          writeCsv(finalPayload)
            .then(() => { 
              console.log("CSV written successfully");
              appendCSVData();
              //return calculateIrrigation();
            })
            .then(() => {
              console.log("Irrigation model calculated successfully");
            })
            .catch((err) => {
              console.error("Error during CSV write or irrigation calc:", err);
            });

          if (info.plantdoy) {
            const currentYear = new Date().getFullYear();
            const plantingDateFormatted = new Date(
              currentYear,
              0,
              info.plantdoy
            );
            setPlantingDate(plantingDateFormatted);
          }
        }
      });
    });
  };

  // const handleAddCropClick = () => {
  //   const advancedPlantingSettings = fetchAdvancedSettings(
  //     selectedPlanting
  //   ).then((data) => console.log(data));
  //   setIsPlantingInfoModalOpen(true);
  // };

  const saveFarmInformationName = () => {
    // update farm name api
    console.log("farmName", selectedFarm);
    updateFarmName(selectedFarm.objid, farmName).then((data) => {
      fetchFarms().then((data) => setIsDialogOpen(false));
    });
  };

  return (
    <div>
      <div>
        <div
          style={{
            width: "auto",
            height: "60vh",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            margin: "-52px 25px 25px",
            top: "1vh",
          }}
        >
          {farms.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "#a60f2d",
                padding: "1px",
                fontWeight: "Bold",
                borderRadius: "8px",
                margin: "6px auto",
                width: "fit-content",
                fontSize: "14px",
              }}
            >
              Please{" "}
              <span
                onClick={() => navigate("/DrawFarm")}
                style={{
                  color: "blue",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Add a farm
              </span>
              . No farms available.
            </div>
          )}
          {farms.length > 0 && !selectedFarmFromDropdown && (
            <div
              style={{
                textAlign: "center",
                color: "#a60f2d",
                padding: "1px",
                fontWeight: "Bold",
                borderRadius: "8px",
                margin: "6px auto",
                width: "fit-content",
                fontSize: "14px",
              }}
            >
              Select a Farm from the Dropdown to see its details.
            </div>
          )}
          {blocks.length > 0 && !selectedBlockId && (
            <div
              style={{
                textAlign: "center",
                color: "#a60f2d",
                padding: "1px",
                fontWeight: "Bold",
                borderRadius: "8px",
                margin: "6px auto",
                width: "fit-content",
                fontSize: "14px",
              }}
            >
              Click on the farm to add details.
            </div>
          )}

          <MapContainer
            center={mapCenter}
            zoom={zoomLevel}
            minZoom={2} //  Allow zooming out to a lower level
            maxZoom={maxZoomLevel} //  Set a reasonable max zoom level
            scrollWheelZoom={false} //  Disable zooming with mouse wheel
            doubleClickZoom={false} //  Prevent zooming with double-click
            dragging={true} //  Allow moving the map
            touchZoom={true} //  Allow pinch-to-zoom on touch devices
            zoomControl={true} //  Enable zoom controls (buttons for zooming in/out)
            style={{ flex: 1 }}
          >
            {selectedFarm && (
              <EditFarmButton
                onEditFarm={handleEditFarm}
                onAddBlock={() => console.log("Add Block Clicked")} // Replace with actual function
              />
            )}
            <MapViewUpdater center={mapCenter} />
            <TileLayer
              url={`${arcGisUrl}/tile/{z}/{y}/{x}`}
              attribution='© <a href="https://www.esri.com">Esri</a>, Earthstar Geographics'
            />
            <PropertyFocus center={mapCenter} minZoomLevel={zoomLevel} />
            <div
              data-tooltip-id="circle-tooltip"
              data-tooltip-html={`
                <div id="weather-toggle">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <img src='https://img.icons8.com/color/48/temperature.png' alt='Temperature Icon' height='28px' width='28px'/>
                  <span> <strong>${
                    nearestStations?.temperature <= 200
                      ? `${nearestStations?.temperature || "N/A"}${
                          userSavedUnit === "Metric" ? "°C" : "°F"
                        }`
                      : "N/A"
                  }</strong></span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <img src='https://img.icons8.com/color/48/humidity.png' alt='Humidity Icon' height='24px' width='24px'/>
                  <span> <strong>${
                    nearestStations?.REL_HUMIDITY <= 101
                      ? `${Math.ceil(nearestStations?.REL_HUMIDITY || 0)}%`
                      : "N/A"
                  }</strong></span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <img src='https://img.icons8.com/color/48/wind.png' alt='Wind Icon' height='24px' width='24px'/>
                  <span> <strong>${
                    nearestStations?.WIND_SPEED <= 500
                      ? `${Math.ceil(nearestStations?.WIND_SPEED || 0)} ${
                          globalUnits[userSavedUnit]?.speed || "mph"
                        }`
                      : "N/A"
                  }</strong></span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <img src='https://img.icons8.com/color/48/15360/rain.png' alt='Rain Icon' height='24px' width='24px'/>
                  <span> <strong>${
                    nearestStations?.PRECIP <= 1500
                      ? `${Math.ceil(nearestStations?.PRECIP || 0)} ${
                          userSavedUnit === "Metric" ? "mm" : "in"
                        }`
                      : "N/A"
                  }</strong></span>
                </div>
                <div style="display: "flex", align-items: "center", gap: "4px">
                  <img src='https://img.icons8.com/color/48/67607/sun.png' alt='Solar Radiation Icon' height='24px' width='24px'/>
                  <span>Solar Rad: <strong>${
                    nearestStations?.SOLAR_RAD <= 1500
                      ? `${Math.ceil(nearestStations?.SOLAR_RAD || 0)} W/m²`
                      : "N/A"
                  }</strong></span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <img src='https://img.icons8.com/color/48/soil.png' alt='Soil Temperature Icon' height='24px' width='24px'/>
                  <span>Soil Temp (2 in): <strong>${
                    nearestStations?.SOIL_TEMP_2_IN <= 200
                      ? `${Math.ceil(nearestStations?.SOIL_TEMP_2_IN || 0)}${
                          userSavedUnit === "Metric" ? "°C" : "°F"
                        }`
                      : "N/A"
                  }</strong></span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <img src='https://img.icons8.com/color/48/soil.png' alt='Soil Temperature Icon' height='24px' width='24px'/>
                  <span>Soil Temp (8 in): <strong>${
                    nearestStations?.SOIL_TEMP_8_IN <= 200
                      ? `${Math.ceil(nearestStations?.SOIL_TEMP_8_IN)}${
                          userSavedUnit === "Metric" ? "°C" : "°F"
                        }`
                      : "N/A"
                  }</strong></span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <img src='https://img.icons8.com/color/48/m8BO9n0ggZIy/moisture.png' alt='Soil Moisture Icon' height='24px' width='24px'/>
                  <span>Soil Moist (8 in): <strong>${
                    nearestStations?.SOIL_MOIS_8_IN <= 200
                      ? `${Math.ceil(nearestStations?.SOIL_MOIS_8_IN)}%`
                      : "N/A"
                  }</strong></span>
                </div>
              </div>
              `}
              className="custom-circle"
            >
              {`${nearestStations?.temperature || "N/A"}${
                globalUnits[userSavedUnit]?.temperature || "°F"
              }`}
            </div>
            {selectedPlanting && (
              <TaskButton
                blockId={selectedBlockId}
                nearestStationUnitId={nearestStations?.UNIT_ID}
                plantingData={selectedPlanting}
                plantingDate={plantingDate}
              />
            )}
            <MarkerClusterGroup>
              {stations.map((station, index) => (
                <Marker
                  key={index}
                  position={[station.lat, station.lng]}
                  icon={createCustomIcon(station.temperature)}
                >
                  <Popup>
                    <b>{station.name}</b>
                    {/* <br />
                    Lat: {station.lat}, Lng: {station.lng} */}
                    <br />
                    Temperature: {station.temperature}
                    {globalUnits[userSavedUnit]?.temperature || "°F"}
                  </Popup>
                </Marker>
              ))}

              {farmCoordinates && (
                <Polygon
                  positions={farmCoordinates}
                  pathOptions={{ color: "blue", weight: 3 }}
                  eventHandlers={{
                    click: (e) => {
                      setIsDialogOpen(true);
                    },
                  }}
                >
                  <Tooltip sticky direction="top" opacity={1}>
                    <span style={{ fontSize: "12px", fontWeight: "normal" }}>
                      {selectedFarm?.name}
                    </span>
                  </Tooltip>
                </Polygon>
              )}

              {blocks.map((block) => (
                <Polygon
                  key={block.block_id}
                  positions={JSON.parse(block.coordinates).map((values) => [
                    values[0],
                    values[1],
                  ])}
                  pathOptions={{ color: "red", weight: 2 }}
                  eventHandlers={{
                    click: () => setCardsData(block.block_id),
                  }}
                >
                  <Tooltip sticky direction="top" opacity={1}>
                    <span style={{ fontSize: "12px", fontWeight: "normal" }}>
                      {block.block_name}
                    </span>
                  </Tooltip>
                </Polygon>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>
        {selectedBlock && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "5px",
              fontSize: "16px",
              fontWeight: "bold",
              color: "white",
              padding: "6px",
              background: "#a60f2d",
              borderRadius: "8px",
              width: "fit-content",
              margin: "auto",
            }}
          >
            {`Block: ${selectedBlock.block_name}`}
          </div>
        )}

        <div style={{ margin: "20px 0" }}>
          <BlocksDropdown
            farmId={selectedFarm?.objid}
            onBlockSelect={(blockId) => {
              setSelectedBlockId(blockId);
              setIsCardsVisible(true);
            }}
          />
        </div>
        <ReactTooltip
          id="circle-tooltip"
          place="right"
          type="dark"
          effect="solid"
          style={{ zIndex: 999 }}
        />
      </div>
      <div>
        {isCardsVisible && (
          <div className="container">
            <div className="grid">
            <Card
              title="Soil"
              onAddClick={() => handleSoil(soilObjid, soilRows, openModal)}
            >
              <Typography
                variant="subtitle1"
                style={{
                  whiteSpace: "pre-line",
                  fontSize: "14px",
                  fontWeight: "normal",
                }}
              >
                {soilCardData}
              </Typography>
            </Card>
            <Card title="Crop and Weather" onAddClick={() => setIsPlantingInfoModalOpen(true)}>
            <CardContent sx={{ pt: 1, px: 1 }}>
              {/* — Weather Station — */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel
                  id="nearestWeatherStation-label"
                  style={{ fontSize: '0.85rem', color: 'black' }}
                >
                  Weather Station
                </InputLabel>
                <Select
                  labelId="nearestWeatherStation-label"
                  label="Weather Station"
                  value={nearestWeatherStation || ''}
                  onChange={e => {
                    const unit = e.target.value;
                    setNearestWeatherStation(unit);
                    handleStationSelection(e)}}
                  sx={{
                    fontSize: '0.95rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0a60f2d',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0a60f2d',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0a60f2d',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#0a60f2d',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: { minWidth: 200 }
                    }
                  }}
                >
                  <MenuItem disabled value="">
                    <em>Select Weather Station</em>
                  </MenuItem>
                  {nearestWeatherStations?.map((s, i) => (
                    <MenuItem key={i} value={s.UNIT_ID} title={`Lat: ${s.lat}, Lng: ${s.lng}`}>
                      {s.name} ({(s.distance * 0.621371).toFixed(2)} mi)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* — My Planting Areas — */}
              <FormControl fullWidth size="small">
                <InputLabel
                  id="planting-dropdown-label"
                  style={{ fontSize: '0.85rem', color: 'black' }}
                >
                  My Planting Areas
                </InputLabel>
                <Select
                  labelId="planting-dropdown-label"
                  label="My Planting Areas"
                  value={selectedPlanting?.objid || ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'add-new-planting') {
                      setIsPlantingInfoModalOpen(true);
                    } else {
                      handlePlantingChange({ target: { value: val } });
                    }
                  }}
                  renderValue={value => {
                    const p = plantingInfoDropdown.find(x => x.objid === value);
                    return p ? p.name : <em>Select Planting</em>;
                  }}
                  sx={{
                    fontSize: '0.95rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0a60f2d',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0a60f2d',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0a60f2d',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#0a60f2d',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: { minWidth: 200 }
                    }
                  }}
                >
                  <MenuItem disabled value="">
                    <em>Select Planting</em>
                  </MenuItem>
                  {plantingInfoDropdown.map(p => (
                    <MenuItem key={p.objid} value={p.objid}>
                      <Typography noWrap sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={e => {
                          e.stopPropagation();
                          deletePlanting(p.objid);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </MenuItem>
                  ))}
                  <MenuItem value="add-new-planting">➕ Add Planting</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>


              <Card
                title="Fertilizer"
                description=""
                onAddClick={() => setIsFertilizerModalOpen(true)}
              >
                <div>
                  {fertilizerCardData &&
                    fertilizerCardData.map((data) => <ul>{data.name}</ul>)}
                </div>
              </Card>

              <Card
                title="Water Source"
                onAddClick={() => setIsWaterResourcesModalOpen(true)}
              >
                <div style={{ fontSize: "12px" }}>
                  {Array.isArray(waterSourcesCardData) &&
                  waterSourcesCardData.length > 0 ? (
                    <ul style={{ paddingLeft: "16px" }}>
                      {waterSourcesCardData.map((data, index) => (
                        <li
                          key={index}
                          style={{ fontSize: "14px", marginBottom: "5px" }}
                        >
                          {data.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: "12px" }}>
                      No water sources available.
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
        {isDialogOpen && (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "white",
              padding: "20px",
              boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
              zIndex: 1000,
              borderRadius: "8px",
              minWidth: "300px",
            }}
          >
            <h3>Farm Information</h3>
            <div style={{ marginBottom: "10px" }}>
              <label>Farm Name:</label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "5px",
                  marginTop: "5px",
                  background: "#f3f3f3",
                  border: "1px solid #ddd",
                }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label>Area (acres):</label>
              <input
                type="text"
                value={area}
                readOnly
                style={{
                  width: "100%",
                  padding: "5px",
                  marginTop: "5px",
                  background: "#f3f3f3",
                  border: "1px solid #ddd",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "10px",
              }}
            >
              <button
                style={{
                  backgroundColor: "gray",
                  color: "white",
                  padding: "8px 15px",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  backgroundColor: "crimson",
                  color: "white",
                  padding: "8px 15px",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => {
                  saveFarmInformationName();
                  setIsDialogOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {isSoilModalOpen && (
          <SoilDataModal
            closeModal={closeModal}
            blockId={selectedBlockId}
            soilModalData={soilModalData}
            soilObjid={soilObjid}
            setIsSoilModalOpen={setIsSoilModalOpen}
            setSelectedBlockId={setSelectedBlockId}
          />
        )}
        {isFertilizerModalOpen && (
          <FertilizerDataModal
            closeModal={closeModal}
            blockId={selectedBlockId}
            fertilizerAdded={setFertilizerAdded}
          />
        )}
        {isWaterResourcesModalOpen && (
          <WaterResourcesDataModal
            blockId={selectedBlockId}
            closeModal={() => setIsWaterResourcesModalOpen(false)}
            waterSourceAdded={setWaterSourceAdded}
          />
        )}
        {isPlantingInfoModalOpen && (
          <PlantingInfoModal
          closeModal={() => setIsPlantingInfoModalOpen(false)}
          plantingInfoSaved={fetchPlantingInfoData}
          selectedBlockId={selectedBlockId}
          plantingInfoModalData={selectedPlanting}
          selectedPlantingSettings={selectedPlantingSettings}
          selectedPlantingAdvanceSettings={selectedPlantingAdvanceSettings}
          setIsPlantingInfoModalOpen={setIsPlantingInfoModalOpen}
          setSelectedBlockId={setSelectedBlockId} 
          />
        )}
      </div>
    </div>
  );
};
export default MainContent;
