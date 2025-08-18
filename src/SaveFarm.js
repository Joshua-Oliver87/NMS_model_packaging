// // React Component: SaveFarm.js
// import React, { useState, useEffect, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";
// import {
//   Box,
//   Button,
//   Typography,
//   TextField,
//   Paper,
//   Grid,
//   Tabs,
//   Tab,
//   Select,
//   MenuItem,
// } from "@mui/material";
// import { styled } from "@mui/system";
// import { MapContainer, TileLayer, FeatureGroup, Polygon, useMap, Popup } from "react-leaflet";
// import { EditControl } from "react-leaflet-draw";
// import { useLocation } from "react-router-dom";

// import "leaflet/dist/leaflet.css";
// import "leaflet-draw/dist/leaflet.draw.css";
// import L from "leaflet";

// // Styled Components
// const Header = styled(Box)({
//   backgroundColor: "#d9d9d9",
//   height: "108px",
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "space-between",
//   padding: "0 20px",
// });

// const Sidebar = styled(Box)({
//   width: "250px",
//   backgroundColor: "crimson",
//   height: "100vh",
//   color: "white",
//   padding: "20px",
//   display: "flex",
//   flexDirection: "column",
//   gap: "10px",
// });

// const MainContent = styled(Box)({
//   flex: 1,
//   padding: "20px",
// });

// const MapWrapper = styled(Box)({
//   width: "40%",
//   height: "90%",
// });

// // Custom Layer Toggle Button Component
// const LayerToggle = ({ setTileLayer }) => {
//   const map = useMap();
//   const [isSatellite, setIsSatellite] = useState(false);

//   const handleLayerToggle = () => {
//     setIsSatellite((prev) => !prev);

//     const newTileLayer = isSatellite
//       ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       : "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

//     setTileLayer(newTileLayer);

//     map.eachLayer((layer) => {
//       if (layer instanceof L.TileLayer) map.removeLayer(layer);
//     });
//     L.tileLayer(newTileLayer).addTo(map);
//   };

//   return (
//     <div
//       style={{
//         position: "absolute",
//         top: "100px",
//         left: "10px",
//         backgroundColor: "white",
//         padding: "5px",
//         borderRadius: "5px",
//         cursor: "pointer",
//         boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
//         zIndex: 1000,
//       }}
//       onClick={handleLayerToggle}
//     >
//       <Typography variant="body2" style={{ textAlign: "center" }}>
//         {isSatellite ? "Map" : "Satellite"}
//       </Typography>
//     </div>
//   );
// };

// const SaveFarm = () => {
//   const [activeTab, setActiveTab] = useState("Farm Information");
//   const [activeSubTab, setActiveSubTab] = useState("My Blocks");
//   const [farmName, setFarmName] = useState("");
//   const [area, setArea] = useState("");
//   const [blocks, setBlocks] = useState([]);
//   const [selectedBlock, setSelectedBlock] = useState(null);
//   const [drawnShapes, setDrawnShapes] = useState([]);
//   const [tileLayer, setTileLayer] = useState("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
//   const [figure, setFigure] = useState([]);
//   const { ranchId } = useParams();
//   const mapRef = useRef(null);
//   const [coordinates, setCoordinates] = useState(null);
//   const navigate = useNavigate();

//   const location = useLocation();
//   const defaultCords = [47.7511, -120.7401];
//   const selectedFarm = location.state?.farm;

//   const [farmNames, setFarmNames] = useState([]);
//   const [selectedFarmFromDropdown, setSelectedFarmFromDropdown] = useState(null);

//   useEffect(() => {
//     const fetchFarmNames = async () => {
//       const user_id = location.state?.user_id; // Pass user_id dynamically
//       if (user_id) {
//         try {
//           const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/farms`, {
//             params: { user_id: user_id },
//           });
          
//           if (response.data && response.data.farms) {
//             setFarmNames(response.data.farms);
//           } else {
//             console.warn("No farms found for this user.");
//           }
//         } catch (error) {
//           console.error("Error fetching farm names:", error);
//         }
//       } else {
//         console.error("User ID is missing.");
//       }
//     };

//     fetchFarmNames();
//   }, []);

//   const handleDropdownChange = (event) => {
//     const selected = farmNames.find((farm) => farm.objid === event.target.value);
//     setSelectedFarmFromDropdown(selected);
//     setFarmName(selected?.name || ""); // Update the farm name field
//     setArea(selected?.acres || ""); // Update the area field
//     setCoordinates(selected?.coordinates || null); // Update map coordinates
//   };

//   const fitToShape = (map, coordinates) => {
//     if (map && coordinates && coordinates.length > 0) {
//       const bounds = L.latLngBounds(coordinates);
//       map.fitBounds(bounds);
//     } else {
//       console.log("Invalid coordinates for fitting bounds.");
//     }
//   };

//   useEffect(() => {
//     const latLngs = selectedFarm?.coordinates.map((coord) => [coord[0], coord[1]]);
//     setFarmName(selectedFarm?.name);
//     setArea(selectedFarm?.acres);

//     if (selectedFarm?.coordinates?.length > 0) {
//       const latLngCoordinates = selectedFarm.coordinates.map((coord) => [coord[1], coord[0]]);
//       setCoordinates(latLngCoordinates);
//       fitToShape(mapRef.current, latLngCoordinates);
//     } else {
//       console.log("Invalid shape data: No coordinates found.");
//     }
//   }, [mapRef]);

//   const handleCreated = (e) => {
//     const layer = e.layer;
//     const newShape = layer.getLatLngs()[0];
//     setDrawnShapes((prev) => [...prev, newShape]);
//   };

//   const handleEdited = (e) => {
//     const layers = e.layers;
//     const updatedShapes = [];
//     layers.eachLayer((layer) => {
//       updatedShapes.push(layer.getLatLngs()[0]);
//     });
//     setDrawnShapes(updatedShapes);

//     if (coordinates) {
//       const editedCoordinates = layers
//         .toGeoJSON()
//         .features[0]
//         .geometry.coordinates[0].map((coord) => [coord[1], coord[0]]);
//       setCoordinates(editedCoordinates);
//     }
//   };

//   const handleDeleted = (e) => {
//     const layers = e.layers;
//     const remainingShapes = drawnShapes.filter((shape) => {
//       return !layers.hasLayer(shape);
//     });
//     setDrawnShapes(remainingShapes);
//   };

//   const navigateToBlockInformation = () => {
//     const objid = selectedFarm?.objid; // Extract objid from the selected farm
//     if (objid) {
//       navigate("/maincontent"); // Navigate with objid
//     } else {
//       console.error("No objid found for the selected farm.");
//     }
//   };

//   return (
//     <Box display="flex" flexDirection="column" height="100vh">
//       <Header>
//         {/* Dropdown Added */}
//         {/* <Select
//           value={selectedFarmFromDropdown?.objid || ""}
//           onChange={handleDropdownChange}
//           displayEmpty
//           style={{ minWidth: "200px" }}
//         >
//           <MenuItem value="" disabled>
//             Select a Farm
//           </MenuItem>
//           {farmNames.map((farm) => (
//             <MenuItem key={farm.objid} value={farm.objid}>
//               {farm.name}
//             </MenuItem>
//           ))}
//         </Select> */}
//       </Header>

//       <Box display="flex" flex={1}>
//         <Sidebar>
//           <Typography
//             variant="h6"
//             sx={{ fontWeight: activeTab === "Farm Information" ? "bold" : "normal", cursor: "pointer" }}
//             onClick={() => setActiveTab("Farm Information")}
//           >
//             Farm Information
//           </Typography>
//           {/* <Typography
//             variant="h6"
//             sx={{ fontWeight: activeTab === "Block Information" ? "bold" : "normal", cursor: "pointer" }}
//             onClick={navigateToBlockInformation}
//           >
//             Block Information
//           </Typography> */}
//         </Sidebar>

//         <MainContent>
//   {activeTab === "Farm Information" && (
//     <>
//       <Typography variant="h5">Farm Information</Typography>

//       {/* Dropdown Above Farm Name Field 
//       <Select
//         value={selectedFarmFromDropdown?.objid || ""}
//         onChange={handleDropdownChange}
//         displayEmpty
//         fullWidth
//         size="small"
//         sx={{ marginBottom: "10px" }}
//       >
//         <MenuItem value="" disabled>
//           Select a Farm
//         </MenuItem>
//         {farmNames.map((farm) => (
//           <MenuItem key={farm.objid} value={farm.objid}>
//             {farm.name}
//           </MenuItem>
//         ))}
//       </Select>
//     */}
//       <TextField label="Farm Name" value={farmName} fullWidth size="small" sx={{ marginBottom: "10px" }} />
//       <TextField label="Area (acres)" value={area} fullWidth size="small" sx={{ marginBottom: "20px" }} />

//       <MapContainer
//         center={defaultCords}
//         zoom={5}
//         style={{ height: "550px", width: "200%", marginBottom: "20px" }}
//         ref={mapRef}
//       >
//         <TileLayer url={tileLayer} attribution="&copy; OpenStreetMap contributors" />
//         <LayerToggle setTileLayer={setTileLayer} />

//         {coordinates && (
//           <Polygon
//             positions={coordinates}
//             pathOptions={{ color: "blue", weight: 3 }}
//             eventHandlers={{
//               add: () => {
//                 if (mapRef.current) {
//                   const bounds = L.latLngBounds(coordinates);
//                   mapRef.current.fitBounds(bounds);
//                 }
//               },
//             }}
//           >
//             <Popup>Original Shape</Popup>
//           </Polygon>
//         )}

//         {drawnShapes.map((shape, index) => (
//           <Polygon key={index} positions={shape} pathOptions={{ color: "red" }} />
//         ))}

//         <FeatureGroup>
//           <EditControl
//             position="topright"
//             onCreated={handleCreated}
//             onEdited={handleEdited}
//             onDeleted={handleDeleted}
//             draw={{
//               rectangle: true,
//               polygon: true,
//               circle: false,
//               circlemarker: false,
//               marker: false,
//               polyline: false,
//             }}
//           />
//         </FeatureGroup>
//       </MapContainer>

//       <Button
//         variant="contained"
//         sx={{ backgroundColor: "crimson", color: "white", marginTop: "20px" }}
//         onClick={navigateToBlockInformation}
//       >
//         Save
//       </Button>
//     </>
//   )}
// </MainContent>



//         <MapWrapper>
//           {/* <MapContainer
//             center={defaultCords}
//             zoom={5}
//             style={{ height: "100%", width: "100%" }}
//             ref={mapRef}
//           >
//             <TileLayer url={tileLayer} attribution="&copy; OpenStreetMap contributors" />
//             <LayerToggle setTileLayer={setTileLayer} />

//             {coordinates && (
//               <Polygon
//                 positions={coordinates}
//                 pathOptions={{ color: "blue", weight: 3 }}
//                 eventHandlers={{
//                   add: () => {
//                     if (mapRef.current) {
//                       const bounds = L.latLngBounds(coordinates);
//                       mapRef.current.fitBounds(bounds);
//                     }
//                   },
//                 }}
//               >
//                 <Popup>Original Shape</Popup>
//               </Polygon>
//             )}

//             {drawnShapes.map((shape, index) => (
//               <Polygon key={index} positions={shape} pathOptions={{ color: "red" }} />
//             ))}

//             <FeatureGroup>
//               <EditControl
//                 position="topright"
//                 onCreated={handleCreated}
//                 onEdited={handleEdited}
//                 onDeleted={handleDeleted}
//                 draw={{
//                   rectangle: true,
//                   polygon: true,
//                   circle: false,
//                   circlemarker: false,
//                   marker: false,
//                   polyline: false,
//                 }}
//               />
//             </FeatureGroup>
//           </MapContainer> */}
//         </MapWrapper>
//       </Box>
//     </Box>
//   );
// };

// export default SaveFarm;
