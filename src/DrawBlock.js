import React, { useState, useEffect, useRef, useContext } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  FeatureGroup,
  Popup,
  Marker,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import MarkerClusterGroup from "react-leaflet-markercluster";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { UserContext } from "./context/UserContext";
import { useParams } from "react-router-dom";
import { Dropdown } from "./components/Dropdown";
import { Label } from "./components/Label";
import Draggable from "react-draggable";
import API from "./util/api";
import PropertyFocus from "./components/PropertyFocus";
import * as turf from "@turf/turf";
import { Snackbar, Alert } from "@mui/material"; //  Import Snackbar & Alert
import { useLocation } from "react-router-dom"; //  Import useLocation
import { globalUnits } from "../src/util/shared-utils";
const DrawBlock = () => {
  const location = useLocation(); //  Get location state  
  const [showDrawMessage, setShowDrawMessage] = useState(false);

  useEffect(() => {
    // Check if user came from DrawFarm page
    if (location.state?.fromDrawFarm) {
      setShowDrawMessage(true);

      // Hide the message after 5 seconds
      setTimeout(() => {
        setShowDrawMessage(false);
      }, 5000);
    }
  }, [location]);

  /*options:[{
    value:"value1",
    displayValue: "displayValue1"
  }],*/

  const blockInfo = {
    name: {
      label: "Name",
      elementName: "name",
    },
    acres: {
      label: "Area (Acres)",
      elementName: "acres",
    },
    nearestWeatherStation: {
      label: "Nearest Weather Stations",
      elementName: "nearestWeatherStation",
      defaultOptionValue: "Select a weather station",
      options: [],
    },
    crop: {
      label: "Crop",
      elementName: "crop",
      defaultOptionValue: "Select a crop",
      options: [],
    },
    fertilizer: {
      label: "Fertilizer",
      elementName: "fertilizer",
      defaultOptionValue: "Select a fertilizer",
      options: [
        {
          value: "Add a fertilizer",
          label: "Add a fertilizer",
        },
      ],
    },
    waterSource: {
      label: "Water Source",
      elementName: "waterSource",
      defaultOptionValue: "Select a water source",
      options: [
        {
          value: "Add a water source",
          label: "Add a water source",
        },
      ],
    },
  };
  const fertilizerInfo = {
    "Nitrate-N": {
      type: "number",
      label: "Nitrate-N (% mass)",
      elementName: "Nitrate-N",
    },
    "Ammonium-N": {
      type: "number",
      label: "Ammonium-N (% mass)",
      elementName: "Ammonium-N",
    },
    "Ammonia-N": {
      type: "number",
      label: "Ammonia-N (% mass)",
      elementName: "Ammonia-N",
    },
    Carbon: {
      type: "number",
      label: "Carbon (% mass)",
      elementName: "Carbon",
    },
    Nitrogen: {
      type: "number",
      label: "Nitrogen (% mass)",
      elementName: "Nitrogen",
    },
    fertilizerNameOptions: {
      label: "Fertilizer Name",
      elementName: "fertilizerNameOptions",
      defaultOptionValue: "",
      options: [
        {
          value: "Add a fertilizer",
          label: "Add a fertilizer",
        },
      ],
    },
    fertilizerName: {
      label: "Fertilizer Name",
      elementName: "fertilizerName",
    },
  };
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // "success", "error", "warning"
  const { isLoggedIn, user, userSavedUnit } = useContext(UserContext);  
  const { ranchId } = useParams();
  const mapRef = useRef(null);
  const [drawnShapes, setDrawnShapes] = useState([]);
  const [coordinates, setCoordinates] = useState(null);
  const [mainShapeCoordinates, setMainShapeCoordinates] = useState(null);
  const coordinatesRef = useRef(mainShapeCoordinates);
  const [stations, setStations] = useState([]); // Weather stations
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Dialog state
  const [selectedShapeIndex, setSelectedShapeIndex] = useState(null); // Track the index of the selected shape
  const [nearestStations, setNearestStations] = useState([]); // Nearest stations for dropdown
  const [cropData, setCropData] = useState([]); // Crop data state
  const [loadingCropData, setLoadingCropData] = useState(true); // Crop data loading state
  const [cropError, setCropError] = useState(null); // Crop data error state
  const [fertilizerData, setFertilizerData] = useState([]); // Fertilizer data state
  const [loadingFertilizerData, setLoadingFertilizerData] = useState(true); // Loading state for fertilizer data
  const [fertilizerError, setFertilizerError] = useState(null); // Error state for fertilizer data
  const [waterSources, setWaterSources] = useState([]);
  const [loadingWaterSources, setLoadingWaterSources] = useState(true);
  const [waterSourceError, setWaterSourceError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    acres: "", // Area field
    nearestWeatherStation: "", // Nearest stations
    crop: "",
    fertilizer: "",
    waterSource: "",
  });
  const [blockData, setBlockData] = useState(blockInfo);
  const [fertilizerSectionData, setFertilizerSectionData] =
    useState(fertilizerInfo);
  const [addNewFertilizer, setAddNewFertilizer] = useState(false);
  const [showFertilizersInfoSection, setShowFertilizersInfoSection] =
    useState(false);
  const [showWaterSourceInfoSection, setShowWaterSourceInfoSection] =
    useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false); // Modal state
  const [selectedRadius, setSelectedRadius] = useState(10); // Radius state (default: 5 miles)
  const [nameError, setNameError] = useState("");
  const [weatherStationError, setWeatherStationError] = useState("");
  const [blocks, setBlocks] = useState([]);
  const nameRegex = /^['a-z','A-Z','0-9','_','.',' ']*$/;

  console.log("ranch id", ranchId);

  const defaultCords = [47.7511, -120.7401]; // Default center of the map
  const zoomLevel = 7;
  const arcGisUrl =
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";

  // Convert square meters to acres
  const convertSqMetersToAcres = (sqMeters) => sqMeters * 0.000247105;

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const toRadians = (degree) => (degree * Math.PI) / 180;
    const R = 6371; // Earth's radius in kilometers
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

  const handleMapPointerClick = () => {
    if (nearestStations.length > 0) {
      if (mapRef.current) {
        const map = mapRef.current;

        // Get the bounds for all 10 nearest stations
        const bounds = L.latLngBounds(
          nearestStations.map((station) => [station.lat, station.lng])
        );

        // Fit the map to the bounds
        if (map.fitBounds) {
          map.fitBounds(bounds, { animate: true, bearing: -90 });
          console.log("Focusing on the map to show all nearest stations.");
        } else {
          console.warn("Map instance does not support fitBounds.");
        }
      } else {
        console.warn("Map reference is not available.");
      }

      // Open the modal to list all 10 nearest stations
      setIsMapModalOpen(true);
    } else {
      console.warn("No nearest stations available to display.");
      // alert("No nearest weather stations found. Please try again later.");
    }
  };

  // Find the 10 nearest weather stations
  const findNearestStations = (shapeCenter) => {
    const distances = stations.map((station) => ({
      ...station,
      distance: calculateDistance(
        shapeCenter.lat,
        shapeCenter.lng,
        station.lat,
        station.lng
      ),
    }));
    return distances.sort((a, b) => a.distance - b.distance).slice(0, 5);
  };

  // Fetch weather stations data
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_BASE_URL}/api/activeWeatherStations`)
      .then((response) => {
        if (response.data?.stations) {
          const filteredStations = response.data.stations.filter(
            (station) =>
              station !== null &&
              !isNaN(station.STATION_LATDEG) &&
              !isNaN(station.STATION_LNGDEG) &&
              station.STATION_LATDEG !== null &&
              station.STATION_LNGDEG !== null
          );
          const parsedStations = filteredStations.map((station) => ({
            lat: Math.abs(parseFloat(station.STATION_LATDEG)), // Ensure latitude is positive
            lng: -Math.abs(parseFloat(station.STATION_LNGDEG)), // Ensure longitude is negative
            name: station.STATION_NAME || "Unknown Station",
            temperature: parseInt(station.AIR_TEMP) || "N/A", // Include temperature
          }));
          console.log("Parsed Stations:", parsedStations); // Debug log
          setStations(parsedStations);
        }
      })
      .catch((error) => console.error("Error fetching station data:", error));
  }, []);

  //Fetch Crop Data
  useEffect(() => {
    const fetchCropData = async () => {
      try {
        const response = await API.get(`/api/crops`);

        setCropData(response.data);
        const cropOptions = response.data.map((crop) => {
          return {
            value: crop.name,
            label: crop.name,
          };
        });

        setBlockData((prevData) => ({
          ...prevData,
          crop: {
            label: blockInfo.crop.label,
            elementName: blockInfo.crop.elementName,
            options: cropOptions,
            defaultOptionValue: blockInfo.crop.defaultOptionValue,
          },
        }));
      } catch (error) {
        console.error("Error fetching crop data:", error.message || error);
        setCropError("Failed to fetch crop data. Please try again later.");
      } finally {
        setLoadingCropData(false);
      }
    };

    fetchCropData();
  }, []);

  // Fetch Fertilizer Data
  useEffect(() => {
    const fetchFertilizerData = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/fertilizerdata/fertilizers`
        );

        setFertilizerData(response.data.data);
      } catch (error) {
        console.error(
          "Error fetching fertilizer data:",
          error.message || error
        );
        setFertilizerError(
          "Failed to fetch fertilizer data. Please try again later."
        );
      } finally {
        setLoadingFertilizerData(false);
      }
    };

    fetchFertilizerData();
  }, []);

  // Fetch Water Source Data
  useEffect(() => {
    const fetchWaterSources = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/water-sources`
        );

        if (response.data?.success) {
          setWaterSources(response.data.data);
        } else {
          setWaterSourceError(
            "Failed to fetch water sources. Please try again later."
          );
        }
      } catch (error) {
        console.error("Error fetching water sources:", error.message || error);
        setWaterSourceError(
          "Failed to fetch water sources. Please try again later."
        );
      } finally {
        setLoadingWaterSources(false);
      }
    };

    fetchWaterSources();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      if (!nameRegex.test(value)) {
        setNameError("Name must be letters, numbers, dot and underscore.");
      } else {
        setNameError(""); // Clear the error if input is valid
      }
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  useEffect(() => {
    coordinatesRef.current = mainShapeCoordinates;
  }, [mainShapeCoordinates]);
  // Handle the creation of new shapes
  const handleCreated = (e) => {
    const layer = e.layer;
    const mapRef1 = mapRef.current;

    console.log("Shape created:", e.layer.getLatLngs());

    const newShape = layer.getLatLngs()[0];

    if (coordinatesRef.current) {
      const newShapeCoords = layer.toGeoJSON().geometry.coordinates;
      const newShapePolygon = turf.polygon(newShapeCoords);
      const mainShapePolygon = turf.polygon([coordinatesRef.current]);

      const isInside = turf.booleanContains(mainShapePolygon, newShapePolygon);
      if (!isInside) {
        if (mapRef1) {
          mapRef1.removeLayer(layer);
        }

        //  Show Snackbar instead of alert
        setSnackbarOpen(false);
        setSnackbarMessage("Please draw the block inside your farm.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
        return;
      }
    }

    const transformedShape = newShape.map(({ lat, lng }) => [lat, lng]);
    console.log("Transformed Shape:", transformedShape);

    const areaInSqMeters = L.GeometryUtil.geodesicArea(newShape);
    const areaInAcres = convertSqMetersToAcres(areaInSqMeters).toFixed(2);

    const shapeCenter = layer.getBounds().getCenter();
    console.log("Shape Center:", shapeCenter);

    setFormData((prevData) => ({
      ...prevData,
      acres: areaInAcres,
    }));

    setDrawnShapes((prevShapes) => [...prevShapes, transformedShape]);
    setSelectedShapeIndex(drawnShapes.length);
    setIsDialogOpen(true);
  };

  // Open dialog on shape click
  const handleShapeClick = (index) => {
    const shape = drawnShapes[index];

    // Calculate area of the clicked shape
    const areaInSqMeters = L.GeometryUtil.geodesicArea(shape);
    const areaInAcres = convertSqMetersToAcres(areaInSqMeters).toFixed(2);

    // Calculate shape center
    const shapeCenter = L.latLngBounds(shape).getCenter();
    console.log("Shape Center on Click:", shapeCenter);

    // Find 3 nearest weather stations
    // const nearest = findNearestStations(shapeCenter);
    // setNearestStations(nearest);

    // Update formData with area
    setFormData((prevData) => ({
      ...prevData,
      field2: areaInAcres,
    }));

    setSelectedShapeIndex(index); // Store clicked shape index
    setIsDialogOpen(true); // Open dialog box
  };

  // Close dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedShapeIndex(null); // Reset selected shape index
  };

  const handleFertilizerSection = () => {
    console.log("showFertilizersInfoSection", showFertilizersInfoSection);
    setShowFertilizersInfoSection(!showFertilizersInfoSection);
  };

  // Handle save action
  const handleSave = () => {
    const { name, nearestWeatherStation, acres } = formData;

    //  Validate form fields
    if (!name.trim()) {
      setNameError("Name is required.");
      return;
    }

    if (!nearestWeatherStation) {
      setSnackbarOpen(false); // Reset before opening again
      setSnackbarMessage("Please select a nearest weather station.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    if (nameError) {
      setSnackbarOpen(false);
      setSnackbarMessage("Please correct the errors before saving.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    if (!acres || isNaN(acres)) {
      setSnackbarOpen(false);
      setSnackbarMessage("Please provide a valid acreage value.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    if (!drawnShapes.length) {
      setSnackbarOpen(false);
      setSnackbarMessage("Please draw a shape before saving.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    //  Convert coordinates to ensure (latitude, longitude) format
    const formattedCoordinates = drawnShapes[drawnShapes.length - 1].map(
      ([lat, lng]) => [lat, lng]
    );

    //  Prepare the data object to send to the backend
    const postFarmObject = {
      ranch_id: ranchId,
      name: name.trim(),
      acres: parseFloat(acres),
      coordinates: JSON.stringify(formattedCoordinates),
    };

    console.log("Submitting form data:", postFarmObject);

    //  Make the API request
    API.post(`/api/addBlock`, postFarmObject)
      .then((res) => {
        console.log("Block saved successfully:", res.data);
        setIsDialogOpen(false); // Close the dialog box

        //  Show success Snackbar
        setSnackbarOpen(false);
        setSnackbarMessage("Block added successfully!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        //  Delay navigation so user sees the message
        setTimeout(() => {
          window.location.href = `${process.env.REACT_APP_API_BASE_URL}/maincontent`;
        }, 2000);
      })
      .catch((error) => {
        let errorMessage = "An unexpected error occurred. Please try again.";

        if (error.response) {
          console.error("Backend error:", error.response.data);
          errorMessage = error.response.data?.error || "Unknown error.";
        } else if (error.request) {
          console.error("No response from server:", error.request);
          errorMessage =
            "No response from server. Check your network connection.";
        } else {
          console.error("Error saving block:", error.message);
        }

        //  Show error Snackbar
        setSnackbarOpen(false);
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      });
  };

  // Fit map bounds to the shape
  const fitToShape = (map, coordinates) => {
    if (map && coordinates && coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds);
    } else {
      console.error("Invalid coordinates for fitting bounds.");
    }
  };
  const defaultCenter = { lat: 47.7511, lng: -120.7401 }; // Default coordinates
  const mapCenter = coordinates?.length
    ? { lat: coordinates[0][0], lng: coordinates[0][1] }
    : defaultCenter; // Use first coordinate if available

  console.log("Map Center Passed to PropertyFocus:", mapCenter); // Debugging log
  const fetchBlocks = async () => {
    try {
      const response = await API.get(`/api/blocks?farmId=${ranchId}`);

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
  // Fetch the most recent figure for the user
  useEffect(() => {
    const fetchMostRecentFigure = async () => {
      try {
        const res = await API.get(`/api/getRanchById`, {
          params: {
            user_id: user?.objid,
            ranchId: ranchId,
          },
        });

        const shapeData = res.data.shapeData;

        if (shapeData?.coordinates?.length > 0) {
          const lngLatCoords = shapeData.coordinates.map((coord) => [
            coord[1],
            coord[0],
          ]);
          setMainShapeCoordinates(lngLatCoords); // Set state for coordinates
          const latLngCoordinates = shapeData.coordinates;
          console.log(
            "Fetched and transformed coordinates:",
            latLngCoordinates
          );

          setCoordinates(latLngCoordinates); // Set state for coordinates
          fitToShape(mapRef.current, latLngCoordinates); // Adjust map bounds

          // Find 10 nearest weather stations
          const nearest = findNearestStations({
            lat: shapeData?.coordinates[0][0],
            lng: shapeData?.coordinates[0][1],
          });
          console.log(
            "nearest",
            nearest,
            shapeData?.coordinates[0][1],
            shapeData?.coordinates[0][0]
          );

          setNearestStations(nearest);
          const nearestStationOptions = nearest.map((station) => {
            return {
              value: station.name,
              label: `${station.name} (${station.distance.toFixed(2)} km)`,
            };
          });

          setBlockData((prevData) => ({
            ...prevData,
            nearestWeatherStation: {
              label: blockInfo.nearestWeatherStation.label,
              elementName: blockInfo.nearestWeatherStation.elementName,
              options: nearestStationOptions,
              defaultOptionValue:
                blockInfo.nearestWeatherStation.defaultOptionValue,
            },
          }));
        } else {
          console.error("Invalid shape data: No coordinates found.");
        }
      } catch (error) {
        console.error("Error fetching most recent figure:", error);
      }
    };
    fetchBlocks();

    if (isLoggedIn) {
      fetchMostRecentFigure();
    }
  }, [stations]);

  return (
    <div
      style={{
        width: "auto",
        height: "65vh",
        margin: "2em",
        marginTop: "-30px",
      }}
    >
      {/*  Show message only if user came from DrawFarm */}
      {showDrawMessage && (
        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "16px",
            color: "crimson",
          }}
        >
          Draw a block inside the farm.
        </div>
      )}

      <MapContainer
        center={defaultCords}
        zoom={zoomLevel}
        ref={mapRef}
        style={{ height: "100%", width: "100%" }}
        maxZoom={15}
        minZoom={5}
        zoomControl={true}
      >
        <TileLayer
          url={`${arcGisUrl}/tile/{z}/{y}/{x}`}
          attribution='&copy; <a href="https://www.esri.com">Esri</a>, Earthstar Geographics'
        />

        <FeatureGroup>
          <EditControl
            position="topright"
            onCreated={handleCreated}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              polyline: false,
              polygon: {
                allowIntersection: false, // Prevent self-intersecting polygons
                shapeOptions: {
                  color: "red", // Set the polygon color to red
                  weight: 3, // Adjust thickness
                },
              },
            }}
            edit={{
              edit: true,
              remove: true,
            }}
          />
        </FeatureGroup>

        {/* Render existing polygon in blue */}
        {coordinates && (
          <Polygon
            positions={coordinates}
            pathOptions={{ color: "blue", weight: 3 }}
            eventHandlers={{
              click: () => handleShapeClick(null), // Open dialog on click
            }}
          >
            <Popup>Original Shape</Popup>
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
          />
        ))}

        {/* Render newly drawn shapes in red */}
        {drawnShapes.map((shape, index) => (
          <Polygon
            key={index}
            positions={shape}
            pathOptions={{ color: "red", weight: 3 }}
            eventHandlers={{
              click: () => handleShapeClick(index), // Open dialog on click
            }}
          >
            <Popup>Drawn Shape {index + 1}</Popup>
          </Polygon>
        ))}

        {/* Weather station markers with clustering */}
        <MarkerClusterGroup>
          {stations.map((station, index) => (
            <Marker
              key={index}
              position={[station.lat, station.lng]}
              icon={
                new L.DivIcon({
                  html: `<div style="background:white;padding:5px;border-radius:50%;text-align:center;border:1px solid #999;">
                    <span style="font-size:12px;font-weight:bold;color:#333;">
                      ${
                        station.temperature !== "N/A"
                          ? `${station.temperature}${globalUnits[userSavedUnit]?.temperature || '°F'}`
                          : "N/A"
                      }
                    </span>
                  </div>`,
                  iconSize: [40, 40],
                  className: "temperature-icon",
                })
              }
              eventHandlers={{
                click: (e) => {
                  // Update the selected station in the dropdown
                  setFormData((prevData) => ({
                    ...prevData,
                    nearestWeatherStation: station.name,
                  }));
                  console.log(`Selected station: ${station.name}`);

                  // Programmatically open the popup
                  const marker = e.target; // Access the clicked marker
                  marker.openPopup(); // Open the popup
                },
              }}
            >
              {/* Popup for station */}
              <Popup name="popup">
                <div>
                  <strong>{station.name}</strong>
                  <br />
                  Temperature: {station.temperature}{globalUnits[userSavedUnit]?.temperature || '°F'}
                  {/* <br />
                  Lat: {station.lat}, Lng: {station.lng} */}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
        {/* Add PropertyFocus component at the bottom right */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            justifyContent: "center",
            bottom: "2%",
            right: "2px",
            zIndex: 999,
            border: "2px", // Debugging border
          }}
        >
          <PropertyFocus center={mapCenter} minZoomLevel={13} />
        </div>
      </MapContainer>

      {/* Dialog Box */}
      {isDialogOpen && (
        <Draggable
          handle=".drag-handle"
          axis="x"
          bounds={{ left: -520, right: 480 }}
        >
          <div
            style={{
              position: "relative",
              top: "-90%", // Adjusted to vertically center
              left: "40%",
              transform: "translate(-50%, -50%)",
              background: "rgba(255, 255, 255, 0.9)",
              border: "1px solid #e0e0e0",
              borderRadius: "10px", // Rounded corners
              padding: "20px",
              width: "280px", // Fixed width for consistency
              height: "auto",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)", // Stronger shadow for emphasis
              zIndex: 999,
            }}
          >
            {/* Draggable handle */}
            <h4
              className="drag-handle"
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#333",
                textAlign: "left",
                marginBottom: "15px",
                cursor: "move", // Indicates draggable area
              }}
            >
              Block Details
            </h4>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "6px",
                  color: "#333",
                }}
              >
                {blockData.name.label}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  fontSize: "14px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  boxSizing: "border-box",
                  marginBottom: "10px",
                  boxShadow: "inset 2px 0px 0px #a60f2d", // Red left border
                }}
              />
              {nameError && (
                <p
                  style={{
                    color: "red",
                    fontSize: "12px",
                    marginBottom: "4px",
                  }}
                >
                  {nameError}
                </p>
              )}

              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "6px",
                  color: "#333",
                }}
              >
                {blockData.acres.label}
              </label>
              <input
                type="text"
                name="acres"
                value={formData.acres}
                readOnly
                style={{
                  width: "100%",
                  padding: "8px",
                  fontSize: "14px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  boxSizing: "border-box",
                  marginBottom: "10px",
                  background: "#f9f9f9",
                  boxShadow: "inset 2px 0px 0px #a60f2d", // Red left border
                }}
              />

              <div style={{ marginTop: "10px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    marginBottom: "8px",
                    color: "#333",
                  }}
                >
                  {blockData.nearestWeatherStation.label}
                  <button
                    onClick={() => handleMapPointerClick()}
                    style={{
                      marginLeft: "2px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "16px",
                      color: "#d9534f", // Subtle red
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                    title="Click to focus on map"
                  >
                    📍
                  </button>
                </label>
                <select
                  name="nearestWeatherStation"
                  value={formData.nearestWeatherStation} // The currently selected station
                  onChange={handleInputChange} // Update the form data when changed manually
                  style={{
                    width: "100%",
                    padding: "8px",
                    fontSize: "14px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    boxSizing: "border-box",
                    marginBottom: "10px",
                    boxShadow: "inset 2px 0px 0px #a60f2d", // Red left border
                  }}
                >
                  <option value="">
                    {blockData.nearestWeatherStation.defaultOptionValue}
                  </option>
                  {nearestStations.map((station, index) => (
                    <option key={index} value={station.name}>
                      {station.name} ({station.distance.toFixed(2)} miles)
                    </option>
                  ))}
                </select>
                {weatherStationError && (
                  <p style={{ color: "red", fontSize: "12px" }}>
                    {weatherStationError}
                  </p>
                )}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "25px",
              }}
            >
              <button
                onClick={handleCloseDialog}
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
                onClick={handleSave}
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
        </Draggable>
      )}
      {/* Snackbar Component */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000} // Closes after 3 seconds
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }} //  Positioned at top
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default DrawBlock;
