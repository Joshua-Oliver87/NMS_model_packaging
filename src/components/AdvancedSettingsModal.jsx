import React, { useState, useEffect } from "react"; //  Added useEffect here
import {
  Box,
  FilledInput,
  FormControl,
  InputAdornment,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import { fetchAdvancedSettings } from "../util/apiUtil"; //  Import fetch function

export const AdvancedSettingsModal = ({ closeModal, selectedCrop }) => {
  // Transpiration Parameters
  const [midseasonCropCoefficient, setMidseasonCropCoefficient] = useState("");
  const [maxCropWaterUptake, setMaxCropWaterUptake] = useState("");
  const [leafWaterPotentialClosure, setLeafWaterPotentialClosure] =
    useState("");
  const [leafWaterPotentialWilting, setLeafWaterPotentialWilting] =
    useState("");
  const [seedingDepth, setSeedingDepth] = useState("");
  const [initialRootDepth, setInitialRootDepth] = useState("");
  const [maxRootDepth, setMaxRootDepth] = useState("");
  const [maxCropHeight, setMaxCropHeight] = useState("");

  // Fetch advanced settings for the selected crop
  useEffect(() => {
    const loadCropSettings = async () => {
      if (selectedCrop) {
        try {
          const data = await fetchAdvancedSettings(selectedCrop);
          setMidseasonCropCoefficient(parseFloat(data.midkc ?? 0).toFixed(2)); // Set default value from 'midkc'
          setMaxCropWaterUptake(parseFloat(data.maxcwu ?? 0).toFixed(2));
          setLeafWaterPotentialClosure(parseFloat(data.lwposc ?? 0).toFixed(2));  //  Set lwposc
          setLeafWaterPotentialWilting(parseFloat(data.lwppw ?? 0).toFixed(2));  // Set lwppw
          setInitialGreenCanopyCover(parseFloat(data.igcc ?? 0).toFixed(2));;  //  Set igcc
          setMaxGreenCanopyCover(parseFloat(data.maxgcc ?? 0).toFixed(2));  //  Set maxgcc
          setMaturityGreenCanopyCover(parseFloat(data.matgcc ?? 0).toFixed(2));  //  Set matgcc
          setTranspirationUseEfficiency(parseFloat(data.tue ?? 0).toFixed(2));  //  Fetch 'tue' column value
          setSlopeDaytimeVPD(parseFloat(data.spfdvpd ?? 0).toFixed(2));  //  Fetch 'spfdvpd' column value
          setMaxNAtEmergence(parseFloat(data.maxne ?? 0).toFixed(2));  //  Fetch 'maxne' column value
          setCriticalNAtEmergence(parseFloat(data.critne ?? 0).toFixed(2));  //  Fetch 'critne' column value
          setMinNAtEmergence(parseFloat(data.minne ?? data.maxne ?? 0).toFixed(2));
          setBiomassDilutionMaxN(parseFloat(data.bdmaxn ?? 0).toFixed(2));  //  Fetch 'bdmaxn' column value
          setBiomassDilutionCriticalN(parseFloat(data.bdcritn ?? 0).toFixed(2));  //  Fetch 'bdcritn' column value
          setBiomassDilutionMinN(parseFloat(data.bdminn ?? 0).toFixed(2));  //  Fetch 'bdminn' column value
          setNDilutionSlope(parseFloat(data.nds ?? 0).toFixed(2));  //  Fetch 'nds' column value
          setMaxNAtMaturity(parseFloat(data.maxnm ?? 0).toFixed(2));  //  Fetch 'maxnm' column value
          setCriticalNAtMaturity(parseFloat(data.critnm ?? 0).toFixed(2));  //  Fetch 'critnm' column value
          setMinNAtMaturity(parseFloat(data.minnm ?? 0).toFixed(2));  //  Fetch 'minnm' column value
          setPotentialNUptake(parseFloat(data.pnu ?? 0).toFixed(2));  //  Fetch 'pnu' column value
        } catch (error) {
          console.error("Error loading crop settings:", error);
        }
      }
    };

    loadCropSettings();
  }, [selectedCrop]); //  Fetch when crop changes

  // Canopy Growth Parameters
  const [initialGreenCanopyCover, setInitialGreenCanopyCover] = useState("");
  const [maxGreenCanopyCover, setMaxGreenCanopyCover] = useState("");
  const [maturityGreenCanopyCover, setMaturityGreenCanopyCover] = useState("");

  // Biomass Growth Parameters
  const [transpirationUseEfficiency, setTranspirationUseEfficiency] =
    useState(0);
  const [slopeDaytimeVPD, setSlopeDaytimeVPD] = useState(""); //  New state for spfdvpd

  // Nitrogen Uptake Parameters
  const [maxNAtEmergence, setMaxNAtEmergence] = useState("");
  const [criticalNAtEmergence, setCriticalNAtEmergence] = useState("");
  const [minNAtEmergence, setMinNAtEmergence] = useState("");
  const [biomassDilutionMaxN, setBiomassDilutionMaxN] = useState("");
  const [biomassDilutionCriticalN, setBiomassDilutionCriticalN] = useState("");
  const [biomassDilutionMinN, setBiomassDilutionMinN] = useState("");
  const [nDilutionSlope, setNDilutionSlope] = useState("");
  const [maxNAtMaturity, setMaxNAtMaturity] = useState("");
  const [criticalNAtMaturity, setCriticalNAtMaturity] = useState("");
  const [minNAtMaturity, setMinNAtMaturity] = useState("");
  const [potentialNUptake, setPotentialNUptake] = useState("");

  const handleSave = () => {
    const settingsData = {
      midseasonCropCoefficient,
      maxCropWaterUptake,
      leafWaterPotentialClosure,
      leafWaterPotentialWilting,
      seedingDepth,
      initialRootDepth,
      maxRootDepth,
      maxCropHeight,
      initialGreenCanopyCover,
      maxGreenCanopyCover,
      maturityGreenCanopyCover,
      transpirationUseEfficiency,
      slopeDaytimeVPD,
      maxNAtEmergence,
      criticalNAtEmergence,
      minNAtEmergence,
      biomassDilutionMaxN,
      biomassDilutionCriticalN,
      biomassDilutionMinN,
      nDilutionSlope,
      maxNAtMaturity,
      criticalNAtMaturity,
      minNAtMaturity,
      potentialNUptake,
    };
    console.log("Saved Advanced Settings:", settingsData);
    closeModal();
  };

  return (
    <Box
      sx={{
        position: "absolute",
        top: "65%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "90%",
        bgcolor: "white",
        borderRadius: "25px",
        boxShadow: 24,
        p: 4,
        zIndex: 999,
        overflowY: "auto",
        maxHeight: "80vh",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontSize: "1.2rem", // Increased font size
          fontWeight: "bold", // Bold text
        }}
      >
        Advanced Settings
      </Typography>

      {/* Transpiration Parameters */}
      <Typography
        variant="subtitle1"
        sx={{
          mt: 1,
          fontSize: "1rem", // Increased font size
          fontWeight: "bold", // Bold text
        }}
      >
        Transpiration Parameters
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        <FormControl sx={{ display: "flex", flexWrap: "wrap" }}>
          <Typography variant="body2">Midseason Crop Coefficient</Typography>
          <FilledInput
            value={midseasonCropCoefficient} inputProps={{ readOnly: true }}
            onChange={(e) => setMidseasonCropCoefficient(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>

        {/*  Max Crop Water Uptake */}
        <FormControl sx={{ display: "flex", flexWrap: "wrap" }}>
          <Typography variant="body2">
            Max Crop Water Uptake (mm/day)
          </Typography>
          <FilledInput
            value={maxCropWaterUptake} inputProps={{ readOnly: true }}
            onChange={(e) => setMaxCropWaterUptake(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>

        {/*  Leaf Water Potential (Closure) */}
        <FormControl sx={{ display: "flex", flexWrap: "wrap" }}>
          <Typography variant="body2">
            Leaf Water Potential (Closure) (J/kg)
          </Typography>
          <FilledInput
            value={leafWaterPotentialClosure} inputProps={{ readOnly: true }}
            onChange={(e) => setLeafWaterPotentialClosure(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>

        {/*  Leaf Water Potential (Wilting) */}
        <FormControl sx={{ display: "flex", flexWrap: "wrap" }}>
          <Typography variant="body2">
            Leaf Water Potential (Wilting) (J/kg)
          </Typography>
          <FilledInput
            type="number"
            value={leafWaterPotentialWilting} inputProps={{ readOnly: true }}
            onChange={(e) => setLeafWaterPotentialWilting(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>
      </Box>

      {/* Canopy Growth Parameters */}
      <Typography
        variant="subtitle1"
        sx={{
          mt: 2,
          fontSize: "1rem", // Increased font size
          fontWeight: "bold", // Bold text
        }}
      >
        Canopy Growth Parameters
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {/*  Initial Green Canopy Cover */}
        <FormControl sx={{ display: "flex", flexWrap: "wrap" }}>
          <Typography variant="body2">
            Initial Green Canopy Cover (0-1)
          </Typography>
          <FilledInput
            type="number"
            value={initialGreenCanopyCover} inputProps={{ readOnly: true }}
            onChange={(e) => setInitialGreenCanopyCover(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>

        {/*  Max Green Canopy Cover */}
        <FormControl sx={{ display: "flex", flexWrap: "wrap" }}>
          <Typography variant="body2">Max Green Canopy Cover (0-1)</Typography>
          <FilledInput
            type="number"
            value={maxGreenCanopyCover} inputProps={{ readOnly: true }}
            onChange={(e) => setMaxGreenCanopyCover(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>
        {/*  Maturity Green Canopy Cover */}
        <FormControl sx={{ display: "flex", flexWrap: "wrap" }}>
          <Typography variant="body2">
            Maturity Green Canopy Cover (0-1)
          </Typography>
          <FilledInput
            type="number"
            value={maturityGreenCanopyCover} inputProps={{ readOnly: true }}
            onChange={(e) => setMaturityGreenCanopyCover(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>
      </Box>

      {/* Biomass Growth Parameters */}
      <Typography
        variant="subtitle1"
        sx={{
          mt: 2,
          fontSize: "1rem", // Increased font size
          fontWeight: "bold", // Bold text
        }}
      >
        Biomass Growth Parameters
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        <FormControl sx={{ flex: "1 1 22%", minWidth: "20ch" }}>
          <Typography variant="body2">
            Transpiration Use Efficiency (kg/kg)
          </Typography>
          <FilledInput
            type="number"
            value={transpirationUseEfficiency} inputProps={{ readOnly: true }}
            onChange={(e) => setTranspirationUseEfficiency(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>

        <FormControl sx={{ flex: "1 1 22%", minWidth: "20ch" }}>
          {" "}
          {/*  Consistent styling */}
          <Typography variant="body2">Slope of Daytime VPD</Typography>
          <FilledInput
            type="number"
            value={slopeDaytimeVPD} inputProps={{ readOnly: true }}
            onChange={(e) => setSlopeDaytimeVPD(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>
      </Box>

      {/* Nitrogen Uptake Parameters */}
      <Typography
        variant="subtitle1"
        sx={{
          mt: 2,
          fontSize: "1rem", // Increased font size
          fontWeight: "bold", // Bold text
        }}
      >
        Nitrogen Uptake Parameters
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 2,
        }}
      >
        <FormControl sx={{ flex: "1 1 22%", minWidth: "20ch" }}>
          {" "}
          {/*  Consistent styling */}
          <Typography variant="body2">Max N at Emergence (kg/kg)</Typography>
          <FilledInput
            type="number"
            value={maxNAtEmergence} inputProps={{ readOnly: true }}
            onChange={(e) => setMaxNAtEmergence(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>

        <FormControl sx={{ flex: "1 1 22%", minWidth: "22ch" }}>
          {" "}
          {/*  Consistent styling */}
          <Typography variant="body2">
            Critical N at Emergence (kg/kg)
          </Typography>
          <FilledInput
            type="number"
            value={criticalNAtEmergence} inputProps={{ readOnly: true }}
            onChange={(e) => setCriticalNAtEmergence(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>

        <FormControl sx={{ flex: "1 1 22%", minWidth: "22ch" }}>
          {" "}
          {/*  Consistent styling */}
          <Typography variant="body2">
            Minimum N concentration at emergence (kg/kg) <br />
            (Default: Nmin = 0.45 × Nmax)
          </Typography>
          <FilledInput
            type="number"
            value={minNAtEmergence} inputProps={{ readOnly: true }}
            onChange={(e) => setMinNAtEmergence(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>

        <FormControl sx={{ mt: 2.5, flex: "1 1 22%", minWidth: "22ch" }}>
          {" "}
          {/*  Consistent styling */}
          <Typography variant="body2">
            Biomass to start dilution of Max N (Mg/ha)
          </Typography>
          <FilledInput
            type="number"
            value={biomassDilutionMaxN} inputProps={{ readOnly: true }}
            onChange={(e) => setBiomassDilutionMaxN(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>

        <FormControl sx={{ flex: "1 1 22%", minWidth: "22ch" }}>
          {" "}
          {/*  Consistent styling */}
          <Typography variant="body2">
            Biomass to start dilution of Critical N (Mg/ha)
          </Typography>
          <FilledInput
            type="number"
            value={biomassDilutionCriticalN} inputProps={{ readOnly: true }}
            onChange={(e) => setBiomassDilutionCriticalN(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>

        <FormControl sx={{ flex: "1 1 22%", minWidth: "22ch" }}>
          {" "}
          {/*  Consistent styling */}
          <Typography variant="body2">
            Biomass to start dilution of Min N (Mg/ha)
          </Typography>
          <FilledInput
            type="number"
            value={biomassDilutionMinN} inputProps={{ readOnly: true }}
            onChange={(e) => setBiomassDilutionMinN(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>

        <FormControl sx={{ flex: "1 1 22%", minWidth: "22ch" }}>
          {" "}
          {/*  Consistent styling */}
          <Typography variant="body2">N Dilution Slope</Typography>
          <FilledInput
            type="number"
            value={nDilutionSlope} inputProps={{ readOnly: true }}
            onChange={(e) => setNDilutionSlope(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>
        <FormControl sx={{ flex: "1 1 22%", minWidth: "22ch" }}>
          {" "}
          {/*  Consistent styling */}
          <Typography variant="body2">Max N at Maturity (kg/kg)</Typography>
          <FilledInput
            type="number"
            value={maxNAtMaturity} inputProps={{ readOnly: true }}
            onChange={(e) => setMaxNAtMaturity(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>

        <FormControl sx={{ flex: "1 1 22%", minWidth: "22ch" }}>
          {" "}
          {/*  Consistent styling */}
          <Typography variant="body2">
            Critical N at Maturity (kg/kg)
          </Typography>
          <FilledInput
            type="number"
            value={criticalNAtMaturity} inputProps={{ readOnly: true }}
            onChange={(e) => setCriticalNAtMaturity(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>

        <FormControl sx={{ flex: "1 1 22%", minWidth: "22ch" }}>
          {" "}
          {/*  Consistent styling */}
          <Typography variant="body2">Minimum N at Maturity (kg/kg)</Typography>
          <FilledInput
            type="number"
            value={minNAtMaturity} inputProps={{ readOnly: true }}
            onChange={(e) => setMinNAtMaturity(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>

        <FormControl sx={{ flex: "1 1 22%", minWidth: "22ch" }}>
          {" "}
          {/*  Consistent styling */}
          <Typography variant="body2">
            Potential N Uptake (kg/ha/day)
          </Typography>
          <FilledInput
            type="number"
            value={potentialNUptake} inputProps={{ readOnly: true }}
            onChange={(e) => setPotentialNUptake(e.target.value)}
            disableUnderline
            sx={{
              borderLeft: "3px solid #a60f2d",
              borderRadius: 1,
            }}
          />
        </FormControl>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={closeModal}
          sx={{
            backgroundColor: "#6c757d",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "5px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Cancel
        </Button>
        {/* <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          sx={{
            backgroundColor: "#a60f2d",
            color: "white",
            padding: "8px 25px",
            border: "none",
            borderRadius: "5px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Save
        </Button> */}
      </Box>
    </Box>
  );
};
