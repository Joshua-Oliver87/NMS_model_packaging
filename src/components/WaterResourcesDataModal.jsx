import { useEffect, useState, useRef } from "react";
import {
  Box,
  FilledInput,
  FormControl,
  FormHelperText,
  InputAdornment,
  Button,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  fetchWaterSources,
  deleteWaterSource,
  saveWaterSource,
} from "../util/apiUtil";

export const WaterResourcesDataModal = ({
  closeModal,
  blockId,
  waterSourceAdded,
  setIsWaterResourcesModalOpen,
  setSelectedBlockId,
}) => {
  const [mode, setMode] = useState("add"); // <-- add vs view/edit
  const [name, setName] = useState("");
  const [nitrogen, setNitrogen] = useState("");
  const [conductivity, setConductivity] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [successDeleteMessage, setSuccessDeleteMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState(false);
  const [errorDeleteMessage, setErrorDeleteMessage] = useState(false);
  const [sources, setSources] = useState([]);
  const modalRef = useRef();

  // fetch list on mount, on blockId change, or after a save
  useEffect(() => {
    if (!blockId || !mode) return;

    fetchWaterSources(blockId)
      .then((data) => {
        setSources(data);

        if (mode === "view" && data.length > 0) {
          setName(data[0].name || "");
          setNitrogen(data[0].n_concentration || "");
          setConductivity(data[0].water_ec_concentration || "");
        } else if (mode === "add") {
          setName("");
          setNitrogen("");
          setConductivity("");
        }
      })
      .catch((err) => console.error("Error fetching water sources:", err));
  }, [blockId, mode, successMessage, successDeleteMessage]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    }
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeModal]);
  
  const handleSave = async () => {
    if (!name.trim() || !nitrogen.trim() || !conductivity.trim()) {
      alert("Please fill in all fields.");
      return;
    }
    if (!blockId || isNaN(blockId)) {
      alert("Invalid block ID. Please try again.");
      return;
    }

    try {
      setLoading(true);
      const waterSourceData = {
        name: name.trim(),
        ranch_id: blockId,
        n_concentration: nitrogen.trim(),
        values: [
          {
            name: "water_source",
            value: name.trim(),
            water_source_id: blockId,
          },
          {
            name: "water_n_concentration",
            value: nitrogen.trim(),
            water_source_id: blockId,
          },
          {
            name: "water_ec_concentration",
            value: conductivity.trim(),
            water_source_id: blockId,
          },
        ],
      };

      await saveWaterSource(waterSourceData);
      waterSourceAdded(true);
      setSuccessMessage(true);
    } catch (error) {
      console.error(
        "Error saving data:",
        error.response ? error.response.data : error.message
      );
      setErrorMessage(true);
    } finally {
      setLoading(false);
      closeModal();
    }
  };
  const handleSoftDelete = async (objid) => {
    try {
      const formattedObjid = objid.toString().replace(/\D/g, "");
      await deleteWaterSource(formattedObjid);
      setSuccessDeleteMessage(true);

      // Refetch water sources to update the UI
      const updatedSources = await fetchWaterSources(blockId);
      setSources(updatedSources);
    } catch (error) {
      console.error("Delete error:", error);
      setErrorDeleteMessage(true);
    }
  };

  return (
    <Box
      ref={modalRef}
      sx={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        top: "88%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "auto",
        bgcolor: "background.paper",
        borderRadius: "25px",
        boxShadow: 24,
        p: 3,
        zIndex: 1300,
      }}
    >
      <IconButton
        aria-label="close"
        onClick={() => {
          closeModal();
        }}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          color: "#888",
          backgroundColor: "transparent",
          transition: "transform 0.2s ease-in-out, background-color 0.2s",
          "&:hover": {
            color: "#a60f2d",
            backgroundColor: "rgba(166, 15, 45, 0.1)",
            transform: "scale(1.2)",
          },
        }}
      >
        <CloseIcon />
      </IconButton>
      <h4>Water Source</h4>

      {/* --- MODE SWITCH --- */}
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value)}>
          <FormControlLabel value="add" control={<Radio />} label="Add" />
          <FormControlLabel value="view" control={<Radio />} label="Delete" />
        </RadioGroup>
      </FormControl>
      {/* -------------------- */}

      {mode === "add" ? (
        <>
          {/* --- ADD FORM (unchanged) --- */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <FormControl sx={{ m: 0, width: "30ch", mt: -2 }} variant="filled">
              <FormHelperText>Name</FormHelperText>
              <FilledInput
                disableUnderline
                disabled={mode === "view"} // 👈 disables input when in view mode
                sx={{
                  borderRadius: "4px",
                  borderLeft: "3px solid #a60f2d",
                }}
                value={name}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^[a-zA-Z0-9 ]*$/.test(v) || v === "") {
                    setName(v);
                  }
                }}
              />
            </FormControl>

            <FormControl sx={{ m: 0, width: "30ch" }} variant="filled">
              <FormHelperText>Nitrate</FormHelperText>
              <FilledInput
                disableUnderline
                sx={{
                  borderRadius: "4px",
                  borderLeft: "3px solid #a60f2d",
                }}
                value={nitrogen}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^\d*\.?\d*$/.test(v) || v === "") {
                    setNitrogen(v);
                  }
                }}
                endAdornment={
                  <InputAdornment position="end">ppm</InputAdornment>
                }
              />
            </FormControl>

            <FormControl sx={{ m: 0, width: "30ch" }} variant="filled">
              <FormHelperText>Electrical Conductivity</FormHelperText>
              <FilledInput
                disableUnderline
                sx={{
                  borderRadius: "4px",
                  borderLeft: "3px solid #a60f2d",
                }}
                value={conductivity}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^\d*\.?\d*$/.test(v) || v === "") {
                    setConductivity(v);
                  }
                }}
                endAdornment={
                  <InputAdornment position="end">dS/m</InputAdornment>
                }
              />
            </FormControl>
          </div>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 3,
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={closeModal}
              sx={{
                backgroundColor: "#6c757d",
                color: "white",
                px: 2,
                borderRadius: "5px",
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              sx={{
                backgroundColor: "#a60f2d",
                color: "white",
                px: 3,
                borderRadius: "5px",
              }}
            >
              Save
            </Button>
          </Box>
        </>
      ) : (
        <>
          {/* --- VIEW / EDIT TABLE --- */}
          <TableContainer
            component={Paper}
            sx={{ mb: 2, maxHeight: 200, overflow: "auto" }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sources.map((ws) => (
                  <TableRow key={ws.objid} hover>
                    <TableCell>{ws.name}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleSoftDelete(ws.objid)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Success Message */}
          <Snackbar
            open={successDeleteMessage}
            autoHideDuration={3000}
            onClose={() => setSuccessDeleteMessage(false)}
            sx={{width: "75%"}}
          >
            <Alert severity="success">Water source deleted successfully!</Alert>
          </Snackbar>

          {/* Error Message */}
          <Snackbar
            open={errorDeleteMessage}
            autoHideDuration={3000}
            onClose={() => setErrorDeleteMessage(false)}
            sx={{width: "75%"}}
          >
            <Alert severity="error">Failed to delete water source.</Alert>
          </Snackbar>

          <Button
            variant="contained"
            onClick={closeModal}
            sx={{
              backgroundColor: "#6c757d",
              color: "white",
              px: 2,
              borderRadius: "5px",
            }}
          >
            Cancel
          </Button>
        </>
      )}

      <Snackbar
        open={successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessMessage(false)}
          severity="success"
          sx={{ width: "auto" }}
        >
          Water source and settings saved successfully!
        </Alert>
      </Snackbar>

      <Snackbar
        open={errorMessage}
        autoHideDuration={3000}
        onClose={() => setErrorMessage(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setErrorMessage(false)}
          severity="error"
          sx={{ width: "auto" }}
        >
          Failed to save water source data.
        </Alert>
      </Snackbar>
    </Box>
  );
};
