// import React, { useState, useEffect, useRef, useContext } from "react";
// import { MapContainer, TileLayer, Polygon, FeatureGroup, Popup, Marker } from "react-leaflet";
// import { EditControl } from "react-leaflet-draw";
// import MarkerClusterGroup from "react-leaflet-markercluster";
// import axios from "axios";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import "leaflet-draw/dist/leaflet.draw.css";
// import "leaflet.markercluster/dist/MarkerCluster.css";
// import "leaflet.markercluster/dist/MarkerCluster.Default.css";
// import { UserContext } from "./context/UserContext";

// const DrawBlock = () => {
//   const { isLoggedIn, user } = useContext(UserContext);

//   const mapRef = useRef(null);
//   const [drawnShapes, setDrawnShapes] = useState([]);
//   const [coordinates, setCoordinates] = useState(null);
//   const [stations, setStations] = useState([]); // Weather stations
//   const [isDialogOpen, setIsDialogOpen] = useState(false); // Dialog state
//   const [selectedShapeIndex, setSelectedShapeIndex] = useState(null); // Track the index of the selected shape
//   const [nearestStations, setNearestStations] = useState([]); // Nearest stations for dropdown
//   const [formData, setFormData] = useState({
//     field1: "",
//     field2: "", // Area field
//     dropdown1: "", // Nearest stations
//     dropdown2: "",
//   });

//   const defaultCords = [47.7511, -120.7401]; // Default center of the map
//   const zoomLevel = 7;
//   const arcGisUrl = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";

//   // Convert square meters to acres
//   const convertSqMetersToAcres = (sqMeters) => sqMeters * 0.000247105;

//   // Calculate distance between two coordinates (Haversine formula)
//   const calculateDistance = (lat1, lng1, lat2, lng2) => {
//     const toRadians = (degree) => (degree * Math.PI) / 180;
//     const R = 6371; // Earth's radius in kilometers
//     const dLat = toRadians(lat2 - lat1);
//     const dLng = toRadians(lng2 - lng1);
//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   };

//   // Find the 3 nearest weather stations
//   const findNearestStations = (shapeCenter) => {
//     const distances = stations.map((station) => ({
//       ...station,
//       distance: calculateDistance(shapeCenter.lat, shapeCenter.lng, station.lat, station.lng),
//     }));
//     const nearest = distances.sort((a, b) => a.distance - b.distance).slice(0, 3);
//     console.log("Nearest Stations:", nearest); // Log nearest stations for debugging
//     return nearest;
//   };

//   // Fetch weather stations data
//   useEffect(() => {
//     axios
//       .get("http:// /api/activeStations")
//       .then((response) => {
//         if (response.data?.stations) {
//           const parsedStations = response.data.stations
//             .filter(
//               (station) =>
//                 !isNaN(parseFloat(station.STATION_LATDEG)) &&
//                 !isNaN(parseFloat(station.STATION_LNGDEG)) &&
//                 station.STATION_LATDEG !== null &&
//                 station.STATION_LNGDEG !== null
//             )
//             .map((station) => ({
//               lat: Math.abs(parseFloat(station.STATION_LATDEG)), // Northwest coordinates (lat is positive)
//               lng: -Math.abs(parseFloat(station.STATION_LNGDEG)), // Northwest coordinates (lng is negative)
//               name: station.STATION_NAME || "Unknown Station",
//               temperature: station.AIR_TEMP || "N/A",
//               timestamp: station.TSAMP || "N/A",
//             }));
//           console.log("Fetched Stations:", parsedStations); // Log fetched stations for debugging
//           setStations(parsedStations);
//         }
//       })
//       .catch((error) => console.error("Error fetching station data:", error));
//   }, []);

//   // Handle form input changes
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: value,
//     }));
//   };

//   // Handle the creation of new shapes
//   const handleCreated = (e) => {
//     const layer = e.layer;

//     const newShape = layer.getLatLngs()[0];
//     console.log("New shape is valid:", newShape);

//     // Calculate area of the new shape
//     const areaInSqMeters = L.GeometryUtil.geodesicArea(newShape);
//     const areaInAcres = convertSqMetersToAcres(areaInSqMeters).toFixed(2); // Convert to acres and round to 2 decimals

//     // Calculate shape center
//     const shapeCenter = layer.getBounds().getCenter();
//     console.log("Shape Center:", shapeCenter);

//     // Find 3 nearest weather stations
//     const nearest = findNearestStations(shapeCenter);
//     setNearestStations(nearest);

//     // Update formData with area
//     setFormData((prevData) => ({
//       ...prevData,
//       field2: areaInAcres, // Automatically set the area in field2
//     }));

//     setDrawnShapes((prevShapes) => [...prevShapes, newShape]);
//     setSelectedShapeIndex(drawnShapes.length); // Set the index of the newly drawn shape
//     setIsDialogOpen(true); // Open the dialog automatically
//   };

//   return (
//     <div style={{ width: "auto", height: "80vh", margin: "2em" }}>
//       {/* Map Container */}
//       <MapContainer
//         center={defaultCords}
//         zoom={zoomLevel}
//         ref={mapRef}
//         style={{ height: "100%", width: "100%" }}
//         maxZoom={19}
//         minZoom={5}
//         zoomControl={true}
//       >
//         <TileLayer
//           url={`${arcGisUrl}/tile/{z}/{y}/{x}`}
//           attribution='&copy; <a href="https://www.esri.com">Esri</a>, Earthstar Geographics'
//         />

//         <FeatureGroup>
//           <EditControl
//             position="topright"
//             onCreated={handleCreated}
//             draw={{
//               rectangle: false,
//               circle: false,
//               circlemarker: false,
//               polyline: false,
//               polygon: {
//                 allowIntersection: false, // Prevent self-intersecting polygons
//                 shapeOptions: {
//                   color: "red", // Set the polygon color to red
//                   weight: 3, // Adjust thickness
//                 },
//               },
//             }}
//             edit={{
//               edit: true,
//               remove: true,
//             }}
//           />
//         </FeatureGroup>

//         {/* Render Weather Stations as Markers */}
//         <MarkerClusterGroup>
//           {stations.map((station, index) => (
//             <Marker
//               key={index}
//               position={[station.lat, station.lng]}
//               icon={
//                 new L.DivIcon({
//                   html: `<div style="background:white;padding:5px;border-radius:50%;text-align:center;border:1px solid #999;">
//                     <span style="font-size:12px;font-weight:bold;color:#333;">${
//                       station.temperature !== "N/A" ? `${station.temperature}°C` : "N/A"
//                     }</span>
//                   </div>`,
//                   iconSize: [40, 40],
//                   className: "temperature-icon",
//                 })
//               }
//             >
//               <Popup>
//                 <b>{station.name}</b>
//                 <br />
//                 Temperature: {station.temperature}°C
//                 <br />
//                 Timestamp: {station.timestamp}
//               </Popup>
//             </Marker>
//           ))}
//         </MarkerClusterGroup>
//       </MapContainer>

//       {/* Dialog Box */}
//       {isDialogOpen && (
//         <div
//           style={{
//             position: "fixed",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             background: "rgba(255, 255, 255, 0.9)", // Transparent background
//             border: "1px solid #ccc",
//             padding: "20px",
//             width: "500px", // Increased width
//             height: "auto", // Adjust height automatically
//             boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
//             zIndex: 1000,
//           }}
//         >
//           <h3>Shape Details</h3>
//           <div>
//             <label>
//               Dropdown 1 (Nearest Stations):
//               <select
//                 name="dropdown1"
//                 value={formData.dropdown1}
//                 onChange={handleInputChange}
//                 style={{ margin: "10px 0", width: "100%", padding: "5px" }}
//               >
//                 <option value="">Select an option</option>
//                 {nearestStations.map((station, index) => (
//                   <option key={index} value={station.name}>
//                     {station.name} ({station.distance.toFixed(2)} km)
//                   </option>
//                 ))}
//               </select>
//             </label>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DrawBlock;
