import React, { useState } from "react";
import {
  Box,
  Tab,
  Tabs,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from "@mui/material";

const AddBlock = () => {
  const [activeTab, setActiveTab] = useState(0); // To track active tab
  const [subBlock1, setSubBlock1] = useState({ name: "", area: "", crop: "", irrigation: "" });
  const [subBlock2, setSubBlock2] = useState({ name: "", area: "", crop: "", irrigation: "" });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSubBlockChange = (subBlock, field, value) => {
    if (subBlock === 1) {
      setSubBlock1({ ...subBlock1, [field]: value });
    } else {
      setSubBlock2({ ...subBlock2, [field]: value });
    }
  };

  const handleSave = () => {
    console.log("Sub-Block 1 Details:", subBlock1);
    console.log("Sub-Block 2 Details:", subBlock2);
    // alert("Block details saved successfully!");
  };

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      {/* Header */}
      <Box
        sx={{
          backgroundColor: "crimson",
          padding: "10px 20px",
          color: "white",
          textAlign: "center",
        }}
      >
        <Typography variant="h5">Block Information</Typography>
      </Box>

      {/* Tabs for Sub-Blocks */}
      <Box sx={{ flexGrow: 1, bgcolor: "background.paper", padding: "20px" }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Sub-Block 1" />
          <Tab label="Sub-Block 2" />
        </Tabs>

        {/* Sub-Block 1 */}
        {activeTab === 0 && (
          <Box sx={{ marginTop: 4 }}>
            <Typography variant="h6" sx={{ marginBottom: 2, color: "crimson" }}>
              Sub-Block 1 Details
            </Typography>
            <TextField
              label="Block Name"
              value={subBlock1.name}
              onChange={(e) => handleSubBlockChange(1, "name", e.target.value)}
              fullWidth
              margin="normal"
              size="small"
            />
            <TextField
              label="Area (acres)"
              value={subBlock1.area}
              onChange={(e) => handleSubBlockChange(1, "area", e.target.value)}
              fullWidth
              margin="normal"
              size="small"
            />
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel id="crop-label-1">Crop</InputLabel>
              <Select
                labelId="crop-label-1"
                value={subBlock1.crop}
                onChange={(e) => handleSubBlockChange(1, "crop", e.target.value)}
              >
                <MenuItem value="Crop A">Crop A</MenuItem>
                <MenuItem value="Crop B">Crop B</MenuItem>
                <MenuItem value="Crop C">Crop C</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel id="irrigation-label-1">Irrigation</InputLabel>
              <Select
                labelId="irrigation-label-1"
                value={subBlock1.irrigation}
                onChange={(e) =>
                  handleSubBlockChange(1, "irrigation", e.target.value)
                }
              >
                <MenuItem value="Drip">Drip</MenuItem>
                <MenuItem value="Sprinkler">Sprinkler</MenuItem>
                <MenuItem value="Flood">Flood</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Sub-Block 2 */}
        {activeTab === 1 && (
          <Box sx={{ marginTop: 4 }}>
            <Typography variant="h6" sx={{ marginBottom: 2, color: "crimson" }}>
              Sub-Block 2 Details
            </Typography>
            <TextField
              label="Block Name"
              value={subBlock2.name}
              onChange={(e) => handleSubBlockChange(2, "name", e.target.value)}
              fullWidth
              margin="normal"
              size="small"
            />
            <TextField
              label="Area (acres)"
              value={subBlock2.area}
              onChange={(e) => handleSubBlockChange(2, "area", e.target.value)}
              fullWidth
              margin="normal"
              size="small"
            />
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel id="crop-label-2">Crop</InputLabel>
              <Select
                labelId="crop-label-2"
                value={subBlock2.crop}
                onChange={(e) => handleSubBlockChange(2, "crop", e.target.value)}
              >
                <MenuItem value="Crop A">Crop A</MenuItem>
                <MenuItem value="Crop B">Crop B</MenuItem>
                <MenuItem value="Crop C">Crop C</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel id="irrigation-label-2">Irrigation</InputLabel>
              <Select
                labelId="irrigation-label-2"
                value={subBlock2.irrigation}
                onChange={(e) =>
                  handleSubBlockChange(2, "irrigation", e.target.value)
                }
              >
                <MenuItem value="Drip">Drip</MenuItem>
                <MenuItem value="Sprinkler">Sprinkler</MenuItem>
                <MenuItem value="Flood">Flood</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Save Button */}
        <Box sx={{ textAlign: "center", marginTop: 4 }}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "crimson",
              color: "white",
              "&:hover": { backgroundColor: "#991313" },
            }}
            onClick={handleSave}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AddBlock;
