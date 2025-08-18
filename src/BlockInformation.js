import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, Select, MenuItem } from "@mui/material";
import { color, styled } from "@mui/system";
import { MapContainer, TileLayer, FeatureGroup, Polygon } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import axios from "axios";
import { useParams } from "react-router-dom";
import { SoilTable } from './components/SoilTable.jsx';
import { useLocation } from "react-router-dom";
import API from "./util/api.js";


const Header = styled(Box)({
  backgroundColor: "#a60f2d",
  height: "60px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 20px",
  boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
});

const DropdownWrapper = styled(Box)({
  padding: "10px 20px",
  backgroundColor: "#f5f5f5",
  borderBottom: "1px solid #ccc",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
});

const MapWrapper = styled(Box)({
  padding: "20px",
  backgroundColor: "#ffffff",
  border: "1px solid #ddd",
  borderRadius: "8px",
  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
  marginTop: "20px",
});

const SoilInfoWrapper = styled(Box)({
  padding: "20px",
  backgroundColor: "#f9f9f9",
  border: "1px solid #ddd",
  borderRadius: "8px",
  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
  marginTop: "20px",
});

const BlockInformation = () => {

  // const newTileLayer = isSatellite
  // ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  // : "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  const [tileLayer, setTileLayer] = useState("https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}");
  const [coordinates, setCoordinates] = useState(null);
  const [farmCoordinates, setFarmCoordinates] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [secondDropdownVisible, setSecondDropdownVisible] = useState(false);
  const [secondOption, setSecondOption] = useState("");
  const [soilData, setSoilData] = useState(null);
  const mapRef = useRef(null);
  const location = useLocation();
  const farm = location.state;
  const { objid } = useParams();

  const fetchFarmCoordinates = async () => {

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/getFarm/${objid}`);

      const farmCoords = JSON.parse(response.data.farm.coordinates).map((coord) => [coord[1], coord[0]]);
      setFarmCoordinates(farmCoords);
      if (mapRef.current) {
        const bounds = L.latLngBounds(farmCoords);
        mapRef.current.fitBounds(bounds);
      }
    } catch (error) {
      console.error("Error fetching farm coordinates:", error.response || error.message || error);
    }
  };
  
  const fetchBlocks = async () => {
    try {
      const response = await API.get(`/api/blocks?farmId=${objid}`);

      if (Array.isArray(response.data.blocks)) {
        setBlocks(response.data.blocks);                
      } else {
        setBlocks([]);
      }
    } catch (error) {
      console.error("Error fetching blocks:", error.response || error.message || error);
    }
  };

  const fetchSoilData = async (blockId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/tablePlanting?planting_area_id=${blockId}`).then(res=> {
        console.log('fetchSoilData', res.data);
        if(res.data?.planting_area && res.data?.planting_area?.length > 0){
          let jsonResponse = JSON.parse(res.data?.planting_area[0]?.value)
          // console.log(jsonResponse);  
          jsonResponse = jsonResponse.map(resp => {
            resp["Thickness (m)"] = (parseFloat(resp["Thickness (m)"])/100).toFixed(2); // Converting cm to m, to convert to in, use *0.393701
            resp["Field Capacity Water Content (m/m)"] = (parseFloat(resp["Field Capacity Water Content (m/m)"])/100).toFixed(3); // Converting cm to m
            resp["Permanent Wilting Point Water Content (m/m)"] = (parseFloat(resp["Permanent Wilting Point Water Content (m/m)"])/100).toFixed(3); // Converting cm to m
            return resp;
          });        
          setSoilData({ ...res.data?.planting_area[0], value: jsonResponse })
        }
      });
     
    } catch (error) {
      console.error("Error fetching fetchSoilData:", error.response || error.message || error);
    }
  };
  const setSelectedBlockCoordinates = (selectedBlockId) => {
    try {
      const selectedBlockInfo =  blocks.filter(block => block.block_id == selectedBlockId);
      const parsedCoordinates = JSON.parse(selectedBlockInfo[0].coordinates).map(values => [values[0], values[1]]);
      setCoordinates(parsedCoordinates);

      // Adjust the map to fit the selected block's bounds
      if (mapRef.current) {
        const bounds = L.latLngBounds(parsedCoordinates);
        mapRef.current.fitBounds(bounds);
      }
    } catch (error) {
      console.error("Error parsing block coordinates:", error);
    }
  }
  const handleBlockSelect = (e) => {
    const selectedBlockId = e.target.value;
    setSelectedBlock(selectedBlockId);
    setSelectedBlockCoordinates(selectedBlockId);
    setSecondDropdownVisible(true);
    setSoilData(null); // Reset soil data when a new block is selected
  };


  const handleSecondOptionSelect = (e) => {
    const option = e.target.value;
    setSecondOption(option);
    if (option === "soil") {
      fetchSoilData(selectedBlock);
    }
  };

  useEffect(() => {
    if (objid) {
      console.log('hi', farm);
      
      fetchFarmCoordinates();
      fetchBlocks();
    }
  }, [objid]);

  return (
    <>
      <Header style={{ color: "white" }}>
        <Typography variant="h5">Block Information</Typography>
      </Header>
      <DropdownWrapper>
        <Select
          value={selectedBlock}
          onChange={handleBlockSelect}
          fullWidth
          displayEmpty
        >
          <MenuItem value="" disabled>
            Select a block
          </MenuItem>
          {blocks.map((block) => (
            <MenuItem key={block.block_id} value={block.block_id}>
              {block.block_name}
            </MenuItem>
          ))}
        </Select>
        {secondDropdownVisible && (
          <Select
            value={secondOption}
            onChange={handleSecondOptionSelect}
            fullWidth
            displayEmpty
          >
            <MenuItem value="" disabled>
              Select an option
            </MenuItem>
            <MenuItem value="soil">Soil Information</MenuItem>
          </Select>
        )}
      </DropdownWrapper>
      <MapWrapper>
        <MapContainer
          center={[50.5, 30.5]}
          zoom={13}
          style={{ height: "400px", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer url={tileLayer} attribution="&copy; OpenStreetMap contributors" />
          {farmCoordinates && (
            <Polygon
              positions={farmCoordinates}
              pathOptions={{ color: "blue", weight: 3 }}
            />
          )}
          {coordinates && (
            <Polygon
              positions={coordinates}
              pathOptions={{ color: "red", weight: 3 }}
            />
          )}
          <FeatureGroup>
            <EditControl
              position="topright"
              draw={{
                rectangle: true,
                polygon: true,
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </MapWrapper>
      {soilData && (
         <SoilTable data={soilData?.value} objid={soilData?.objid}   />
      )}
    </>
  );
};

export default BlockInformation;
