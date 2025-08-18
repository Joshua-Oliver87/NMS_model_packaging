import React, { useState, useRef, useEffect, useContext } from "react";
import { MapContainer, TileLayer, Marker, Popup, FeatureGroup, Polygon } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import MarkerClusterGroup from "react-leaflet-markercluster";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
} from "@mui/material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Snackbar, Alert } from "@mui/material";
import { fetchAndSaveWeatherData } from "./util/apiUtil"; 
import SearchLocation from "./SearchLocation";
import { GeometryUtil } from "leaflet";
import { convertSqMeterAcre, globalUnits } from "../src/util/shared-utils";
import { UserContext } from "./context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "./util/api";

const defaultCords = [47.7511, -120.7401];


const DrawFarm = () => {
  const { isLoggedIn, user, userSavedUnit } = useContext(UserContext);
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false); // Track save state
  const arcGisUrl = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";
  const openStreetMapUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const zoomLevel = 7;

  const [isSatelliteLayer, setIsSatelliteLayer] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShapeData, setSelectedShapeData] = useState(null);
  const [farmName, setFarmName] = useState("");
  const [farmAcre, setFarmAcre] = useState("");
  const [currentCords, setCurrentCords] = useState(defaultCords);
  const [dropdown1, setDropdown1] = useState("");
  const [dropdown2, setDropdown2] = useState("");
  const [farms, setFarms] = useState([]);
  const [stations, setStations] = useState([]);
  const [nearestStations, setNearestStations] = useState([]);
  const [drawingBounds, setDrawingBounds] = useState(null);
  const [dialogKey, setDialogKey] = useState(0);
  const mapRef = useRef(null);
  const [addBlock, setAddBlock] = useState(false);
  const [nameError, setNameError] = useState(""); // Error message for name validation
  const [formData, setFormData] = useState({ name: "" }); // Store form data
  const nameRegex = /^['a-z','A-Z','0-9','_','.',' ']*$/;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // "success", "error", "warning"
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    // Validate name field
    if (name === "name") {
      if (!nameRegex.test(value)) {
        setNameError("Name must be letters, numbers, dot, or underscore.");
      } else {
        setNameError(""); // Clear error if input is valid
      }
    }
    // Update form data
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleStationSelection = async (e) => {
    const selectedUnitId = e.target.value;
  
    // Update form data
    setFormData((prevData) => ({
      ...prevData,
      nearestWeatherStation: selectedUnitId,
    }));
  
    const selectedStationObj = nearestStations.find(
      (station) => station.UNIT_ID === selectedUnitId
    );
  
    if (!selectedStationObj) {
      console.warn("⚠️ Selected station not found in nearestStations.");
      return;
    }
  
    try {
      const objId = user?.objid || "demo";
  
      const response = await fetchAndSaveWeatherData(selectedUnitId, objId);
  
      if (response?.message) {
        console.log("✅ Weather CSV creation successful:", response.message);
        setSnackbarMessage("Weather data saved and CSV created.");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("❌ Error calling fetchAndSaveWeatherData:", error);
      setSnackbarMessage("Error fetching weather data.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };
  
  // Fetch weather stations data
  useEffect(() => {
    API
      .get(`/api/activeWeatherStations`)
      .then((response) => {
        if (response.data?.stations) {
          const filteredStations = response.data.stations
          .filter(
            (station) =>
              station !== null &&
              !isNaN(station.STATION_LATDEG) &&
              !isNaN(station.STATION_LNGDEG) &&
              station.STATION_LATDEG !== null &&
              station.STATION_LNGDEG !== null
          );
          const parsedStations = 
          filteredStations.map((station) => ({
              lat: Math.abs(parseFloat(station.STATION_LATDEG)), // Ensure latitude is positive
              lng: -Math.abs(parseFloat(station.STATION_LNGDEG)), // Ensure longitude is negative
              name: station.STATION_NAME || "Unknown Station",
              temperature: Math.round(station.AIR_TEMP) || "N/A", // Include temperature
              UNIT_ID: station.UNIT_ID, //  Add this line
            }));
          console.log("Parsed Stations:", parsedStations); // Debug log
            setStations(parsedStations);
        }
      })
      .catch((error) => console.error("Error fetching station data:", error));
  }, []);

  const handleLocationSearch = ({ lat, lon }) => {
    setCurrentCords([lat, lon]);
  
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 15, { duration: 1.5 }); // Smooth transition
    }
  };
  
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const toRadians = (degree) => (degree * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const findNearestStations = (shapeCenter) => {  
    if (!stations.length) {
      console.warn("Stations data not loaded yet.");
      return;
    }

    const distances = stations.map((station) => ({
      ...station,
      distance: calculateDistance(
        shapeCenter.lat,
        shapeCenter.lng,
        station.lat,
        station.lng
      ),
    }));

    const nearest = distances.sort((a, b) => a.distance - b.distance).slice(0, 10);
    console.log("Nearest Stations:", nearest);
    setNearestStations(nearest);
  };

  const handleCreated = (e) => {
    const { layer } = e;
    const shapeData = layer.toGeoJSON();
    
    console.log("Shape Data:", shapeData); // Debugging output

  if (
    !shapeData.geometry ||
    !shapeData.geometry.coordinates ||
    shapeData.geometry.coordinates.length === 0
  ) {
    console.error("Shape data has invalid coordinates.");
    return;
  }

    setSelectedShapeData(shapeData);

    const areaSqMeters = GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
    const acres = convertSqMeterAcre(areaSqMeters).toFixed(2);
    setFarmAcre(acres);

    const shapeCenter = layer.getBounds().getCenter();
    findNearestStations(shapeCenter);

    setDialogKey((prevKey) => prevKey + 1);
    setDialogOpen(true);
  };

  const handlePolygonClick = (farm) => {
    setSelectedShapeData(farm.shape);
    setFarmName(farm.details.farmName);
    setFarmAcre(farm.details.farmAcre);
    setDropdown1(farm.details.dropdown1);
    setDropdown2(farm.details.dropdown2);
    setDialogKey((prevKey) => prevKey + 1);
    setDialogOpen(true);
  };

  const handleNext = () => {
    if (!selectedShapeData || !selectedShapeData.geometry || !selectedShapeData.geometry.coordinates) {
      console.error("Invalid shape data: No coordinates found.");
      return;
    }
  
    const originalCoordinates = selectedShapeData.geometry.coordinates[0];
  
    if (!originalCoordinates || originalCoordinates.length === 0) {
      console.error("Invalid shape data: Coordinates are empty.");
      return;
    }
  
    const latLngCoordinates = originalCoordinates.map(([lng, lat]) => [lat, lng]);
  
    if (!formData.name) {
      setNameError("Farm name is required.");
      return;
    }
  
    if (!nameRegex.test(formData.name)) {
      setNameError("Name must be letters, numbers, dot, or underscore.");
      return;
    }
  
    setNameError("");
    setIsSaving(true);
  
    const newFarm = {
      shape: selectedShapeData,
      details: {
        farmName: formData.name,
        farmAcre,
      },
    };
  
    setFarms((prevFarms) => [...prevFarms, newFarm]);
  
    const postFarmObject = {
      user_id: user?.objid,
      name: formData.name,
      acres: farmAcre,
      coordinates: JSON.stringify(latLngCoordinates),
    };
  
    API.post(`/api/addFarms`, postFarmObject)
      .then((res) => {
        setDialogOpen(false);
        setFarmName("");
        setFormData({ name: "" });
        setAddBlock(false);
  
        const ranchId = res?.data?.ranchId;
  
        if (!ranchId) {
          console.error("Error: Ranch ID is undefined.");
          setIsSaving(false);
          return;
        }
  
        const plantingAreaPayload = {
          ranch_id: ranchId,
          name: formData.name,
          acres: farmAcre,
          coordinates: JSON.stringify(latLngCoordinates),
        };
  
        console.log("Payload with Transformed Coordinates:", plantingAreaPayload);
  
        if (!addBlock) {
          return API.post(`/api/tablePlantingArea`, plantingAreaPayload)
            .then(() => {
              console.log("Coordinates saved in table_planting_area.");
              
              //  Show Success Snackbar
              setSnackbarMessage("Farm saved successfully!");
              setSnackbarSeverity("success");
              setSnackbarOpen(true);
  
              //  Delay navigation to let the user see the message
              setTimeout(() => {
                window.location.href = `${process.env.REACT_APP_API_BASE_URL}/maincontent?farm=${ranchId}`;
              }, 2000);
            })
            .catch((err) => {
              console.error("Error saving planting area:", err);
              setIsSaving(false);
            });
        } else {
          navigate(`/drawblock/${ranchId}`, { state: { fromDrawFarm: true } }); //  Pass state
        }
      })
      .catch((error) => {
        console.error("Error saving farm:", error);
        setSnackbarMessage("Error saving farm.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setIsSaving(false);
      });
  };
  
  
  
  return (
    <div style={{ width: "auto", height: "80vh", position: "relative", margin: "2em",marginTop: "-1em" }}>
      <Box
        sx={{
          position: "absolute",
          top: "10px",
          right: "50px",
          zIndex: 999,
          width: "300px",
        }}
      >
        <SearchLocation onLocationSearch={handleLocationSearch} />
      </Box>
      <MapContainer
        center={currentCords}
        zoom={zoomLevel}
        ref={mapRef}
        style={{ height: "100%", width: "100%" }}
        maxBounds={drawingBounds || null}
      >
        <TileLayer
          url={isSatelliteLayer ? `${arcGisUrl}/tile/{z}/{y}/{x}` : openStreetMapUrl}
          attribution='&copy; <a href="https://www.esri.com">Esri</a>, Earthstar Geographics'
        />
        <FeatureGroup>
        {
          stations?.length > 0 &&
          <EditControl
            position="topright"
            onCreated={handleCreated}
            draw={{
              rectangle: true,
              polygon: true,
              circle: false,
              circlemarker: false,
              polyline: false,
              marker: false,
            }}
          />
          }
          {farms.map((farm, index) => (
            <Polygon
              key={index}
              positions={L.GeoJSON.coordsToLatLngs(farm.shape.geometry.coordinates[0])}
              eventHandlers={{
                click: () => handlePolygonClick(farm),
              }}
            >
              <Popup>
                <b>{farm.details.farmName}</b>
                <br />
                Area: {farm.details.farmAcre} acres
                {/* <br />
                Nearest Station: {nearestStations[index]?.name || "N/A"} */}
              </Popup>
            </Polygon>
          ))}
        </FeatureGroup>
        <MarkerClusterGroup>
          {stations?.map((station, index) => (
            <Marker
              key={index}
              position={[station?.lat, station?.lng]}
              icon={
                new L.DivIcon({
                  html: `<div style="background:white;padding:5px;border-radius:50%;text-align:center;border:1px solid #999;">
                    <span style="font-size:12px;font-weight:bold;color:#333;">${
                      station?.temperature !== "N/A" ? station?.temperature+globalUnits[userSavedUnit].temperature : "N/A"
                    }</span>
                  </div>`,
                  iconSize: [40, 40],
                  className: "temperature-icon",
                })
              }
            >
              <Popup>
              <b>{station.name}</b>
                <br />
                Temperature: {station.temperature}{globalUnits[userSavedUnit]?.temperature || '°F'}
                {/* <br />
                Lat: {station.lat}, Lng: {station.lng} */}
                {/* <br />
                Timestamp: {station.timestamp} */}
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      <Dialog
        key={dialogKey}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{
          style: {
            borderRadius: "10px", // Rounded corners
            width: "280px", // Fixed width
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)", // Shadow
            padding: "20px", // Unified padding
            background: "rgba(255, 255, 255, 0.9)", 
          },
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#333",
              textAlign: "left",
              marginBottom: "15px",
            }}
          >
            Add Farm Details
          </div>

          {/* Farm Name Field */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: "15px",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#333",
              }}
            >
              Farm Name
            </label>
            <input
              type="text"
              name="name" // Important to match the `name` key in formData
              value={formData.name}
              onChange={(e) => {
                setFarmName(e.target.value);
                handleInputChange(e); // Call the validation function
              }}
              style={{
                border: "1px solid #ccc",
                borderLeft: "3px solid #a60f2d", // Left border color
                borderRadius: "5px",
                padding: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            {nameError && (
        <p style={{ color: "red", fontSize: "12px", marginBottom: "1px" }}>{nameError}</p>
      )}
          </div>

          {/* Area Field */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: "20px",
              marginTop: "-5px",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "6px",
                color: "#333",
              }}
            >
              Area (Acres)
            </label>
            <input
              type="text"
              value={farmAcre}
              readOnly
              style={{
                border: "1px solid #ccc",
                borderLeft: "3px solid #a60f2d", // Left border color
                borderRadius: "5px",
                padding: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                background: "#f9f9f9", // Read-only background
                outline: "none",
              }}
            />
          </div>
<div
  style={{
    display: "flex",
    flexDirection: "column",
    marginBottom: "20px",
  }}
>
  {/* <label
    style={{
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      marginBottom: "6px",
      color: "#333",
    }}
  >
    Nearest Weather Station
  </label> */}
  {/* <select
    name="nearestWeatherStation"
    value={formData.nearestWeatherStation}
    onChange={(e) => handleStationSelection(e)}

    style={{
      border: "1px solid #ccc",
      borderLeft: "3px solid #a60f2d",
      borderRadius: "5px",
      padding: "8px",
      fontSize: "14px",
      boxSizing: "border-box",
      outline: "none",
    }}
  >
    <option value="">Select a station</option>
    {nearestStations.map((station, index) => (
      <option
        key={index}
        value={station.UNIT_ID} // ✅ Use UNIT_ID as value
        title={`Lat: ${station.lat}, Lng: ${station.lng}`}
      >
        {(station.name || `Station ${index + 1}`)}{" "}
        ({station.distance?.toFixed(2) || "0.00"} km)
      </option>
    ))}
  </select> */}
</div>

          {/* Add Block Checkbox */}
          {/* <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
            <input
              type="checkbox"
              id="addBlockCheckbox"
              checked={addBlock}
              onChange={(e) => setAddBlock(e.target.checked)}
              style={{
                accentColor: addBlock ? "#a60f2d" : undefined,
                width: "16px",
                height: "16px",
              }}
            />
            <label htmlFor="addBlockCheckbox" style={{ marginLeft: "6px", fontSize: "14px" }}>
              Check if you want to add block
            </label>
          </div> */}

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={() => setDialogOpen(false)}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "5px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              style={{
                backgroundColor: "#a60f2d",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "5px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>
 

        </div>
      </Dialog>
      <Snackbar
  open={snackbarOpen}
  autoHideDuration={3000} // Closes after 3 seconds
  onClose={() => setSnackbarOpen(false)}
  anchorOrigin={{ vertical: "top", horizontal: "center" }} //  Moved to top
>
  <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
    {snackbarMessage}
  </Alert>
</Snackbar>

    </div>
  );
};

export default DrawFarm;
