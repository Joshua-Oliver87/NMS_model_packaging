import { useEffect, useState, useRef } from "react";
import {
  createCustomFertilizer,
  fetchFertilizerInfo,
  fetchFertilizerNames,
} from "../util/apiUtil";
import {
  Box,
  Button,
  Modal,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
export const FertilizerDataModal = ({ closeModal, blockId, fertilizerAdded, setIsFertilizerModalOpen,
  setSelectedBlockId}) => {
  const customFertilizers = {
    Nitrogen: 0,
    Phosphorus: "0",
    Potassium: "0",
    Calcium: "0",
    Magnesium: "0",
    "Nitrate-N": "0",
    "Potassium-Sap": "0",
    Sulfur: "0",
    "B (boron)": "0",
    Chloride: "0",
    Copper: "0",
    Iron: "0",
    Manganese: "0",
    "Ammonia-N": "0",
    "Na (sodium)": "0",
    Nickel: "0",
    Zinc: "0",
    "Organic Matter": "0",
  };

  const [fertilizerData, setFertilizerData] = useState(null);
  const [customFertilizerOption, setCustomFertilizerOption] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [customFertilizerValues, setCustomFertilizerValues] = useState({
    ranch_id: blockId,
    fertilizerName: "",
    Formulation: "Dry",
    ...customFertilizers,
  });
  const [fertilizerNames, setFertilizerNames] = useState([]);
  const modalRef = useRef();

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

  useEffect(() => {
    fetchFertilizerNames()
      .then((res) => setFertilizerNames(res))
      .catch((err) => console.error("Error fetching fertilizer names:", err));
  }, []);

  useEffect(() => {
    fetchFertilizerInfo()
      .then((res) => setFertilizerData(res))
      .catch((err) => console.log(err));
  }, []);

  const handleRadioChange = (row) => {
    setSelectedRow(row);
  };

  const handleCustomFertilizerOptions = (e) => {
    const { name, value } = e.target;
  
    if (name === "fertilizerName") {
      // Allow only letters, numbers, hyphen (-), and underscore (_)
      if (/^[a-zA-Z0-9-_]*$/.test(value) || value === "") {
        setCustomFertilizerValues((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else if (/^\d*\.?\d*$/.test(value) || value === "") {
      // Allow only numbers and a single decimal point for nutrient values
      setCustomFertilizerValues((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  // Format input value to 2 decimal places when the user exits the field
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (value) {
      setCustomFertilizerValues((prev) => ({
        ...prev,
        [name]: parseFloat(value).toFixed(2),
      }));
    }
  };

  const saveFertilizer = () => {
    if (customFertilizerOption) {
      // Save custom fertilizer
      createCustomFertilizer(customFertilizerValues).then(data => fertilizerAdded(true));
    
    } else if (selectedRow) {
      // Save selected fertilizer from list
      createCustomFertilizer({
        ranch_id: blockId,
        fertilizerName: selectedRow.name
        // DO NOT SEND all those "0" fields!
      }).then(data => fertilizerAdded(true));
      
    }
    closeModal();
  };

  return (
    <Box
      ref={modalRef}
      sx={{
        position: "absolute",
        top: "88%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: { xs: "90%", md: "50%" },
        maxWidth: "100%",
        height: "70vh",
        bgcolor: "background.paper",
        borderRadius: "25px",
        boxShadow: 24,
        p: 2,
        zIndex: 1300,
        overflowY: "auto",
      }}
    >
      {/* Close Button */}
      <IconButton
        aria-label="close"
        onClick={() => {
          closeModal(); // just to be safe
          // setIsFertilizerModalOpen(false);
          // setSelectedBlockId(null); // optional: if you want to reset selected block too
        }}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          color: "#888",
          backgroundColor: "transparent",
          transition: "transform 0.2s ease-in-out, background-color 0.2s",
          "&:hover": {
            color: "#a60f2d",               // WSU crimson highlight
            backgroundColor: "rgba(166, 15, 45, 0.1)", // Soft crimson bg
            transform: "scale(1.2)",        // Slightly enlarge
          },
        }}
      >
        <CloseIcon />
      </IconButton>

      <h3>Fertilizer Information</h3>
      <div
        style={{ display: "flex", flexDirection: "column", paddingTop: "15px" }}
      >
        {/* Radio Buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "-15px",
          }}
        >
          <label style={{ marginBottom: "6px" }}>
            <input
              type="radio"
              name="fertilizerOption"
              value="list"
              checked={customFertilizerOption === false}
              onChange={() => setCustomFertilizerOption(false)}
              style={{ marginRight: "8px" }}
            />
            Choose from List
          </label>
          <label>
            <input
              type="radio"
              name="fertilizerOption"
              value="custom"
              checked={customFertilizerOption === true}
              onChange={() => setCustomFertilizerOption(true)}
              style={{ marginRight: "8px" }}
            />
            Create a Custom Fertilizer
          </label>
        </div>

        {/* Fertilizer Data */}
        <div style={{ overflowX: "auto" }}>
          {!customFertilizerOption ? (
            <>
              <h3>Fertilizer List</h3>
              <TableContainer
                sx={{ overflowX: "auto", maxWidth: "98%", padding: "7px" }}
              >
                <Table size="small" sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: "5%", padding: "4px" }}>
                        Select
                      </TableCell>
                      <TableCell sx={{ width: "25%", padding: "4px" }}>
                        Name
                      </TableCell>
                      <TableCell sx={{ width: "8%", padding: "4px" }}>
                        Formulation
                      </TableCell>
                      <TableCell sx={{ width: "10%", padding: "4px" }}>
                        Nitrogen (N)
                      </TableCell>
                      <TableCell sx={{ width: "10%", padding: "4px" }}>
                        Phosphorus (P)
                      </TableCell>
                      <TableCell sx={{ width: "10%", padding: "4px" }}>
                        Potassium (K)
                      </TableCell>
                      <TableCell sx={{ width: "10%", padding: "4px" }}>
                        %Ammoniacal-N
                      </TableCell>
                      <TableCell sx={{ width: "10%", padding: "4px" }}>
                        %Nitrate-N
                      </TableCell>
                      <TableCell sx={{ width: "10%", padding: "4px" }}>
                        %Urea-N
                      </TableCell>
                      <TableCell sx={{ width: "10%", padding: "4px" }}>
                        Formulation
                      </TableCell>
                      <TableCell sx={{ width: "10%", padding: "4px" }}>
                        Application Rate(if liquid)
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fertilizerNames
                      ?.filter((nameData) => nameData.status === 2)
                      .map((nameData) => (
                        <TableRow key={nameData.objid}>
                          <TableCell>
                            <Radio
                              checked={selectedRow?.objid === nameData.objid}
                              onChange={() => handleRadioChange(nameData)}
                              value={`123${nameData.objid}`}
                              name="radio-buttons"
                            />
                          </TableCell>
                          <TableCell>{nameData.name}</TableCell>
                          <TableCell>
                            {fertilizerData?.find(
                              (data) =>
                                data.name === "formulation" &&
                                data.fertilizer_id === nameData.objid
                            )?.value || ""}
                          </TableCell>
                          <TableCell>
                            {fertilizerData?.find(
                              (data) =>
                                data.name === "N" &&
                                data.fertilizer_id === nameData.objid
                            )?.value || ""}
                          </TableCell>
                          <TableCell>
                            {fertilizerData?.find(
                              (data) =>
                                data.name === "P" &&
                                data.fertilizer_id === nameData.objid
                            )?.value || ""}
                          </TableCell>
                          <TableCell>
                            {fertilizerData?.find(
                              (data) =>
                                data.name === "K" &&
                                data.fertilizer_id === nameData.objid
                            )?.value || ""}
                          </TableCell>
                          <TableCell>
                            {fertilizerData?.find(
                              (data) =>
                                data.name === "ammoniacal-n" &&
                                data.fertilizer_id === nameData.objid
                            )?.value || ""}
                          </TableCell>
                          <TableCell>
                            {fertilizerData?.find(
                              (data) =>
                                data.name === "nitrate-n" &&
                                data.fertilizer_id === nameData.objid
                            )?.value || ""}
                          </TableCell>
                          <TableCell>
                            {fertilizerData?.find(
                              (data) =>
                                data.name === "urea-n" &&
                                data.fertilizer_id === nameData.objid
                            )?.value || ""}
                          </TableCell>
                          <TableCell>
                            {fertilizerData?.find(
                              (data) =>
                                data.name === "formulation" &&
                                data.fertilizer_id === nameData.objid
                            )?.value || ""}
                          </TableCell>
                          <TableCell>
                            {fertilizerData?.find(
                              (data) =>
                                data.name === "apprate" &&
                                data.fertilizer_id === nameData.objid
                            )?.value || ""}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <>
              <h3>Create a Custom Fertilizer</h3>
              <div
                style={{
                  display: "flex",
                  gap: "10px", // space between fields
                  alignItems: "center", // optional alignment on the cross-axis
                }}
              >
                <input
                  type="text"
                  placeholder="Fertilizer Name *"
                  style={{
                    flex: 1,
                    padding: "6px",
                    maxWidth: "47.3%",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    borderLeft: "3px solid #a60f2d",
                  }}
                  name="fertilizerName"
                  value={customFertilizerValues.fertilizerName}  // Ensure the value is bound
                  onChange={handleCustomFertilizerOptions}       // Use updated handler
                />
                <select
                  style={{
                    flex: 1, // same width as the input
                    padding: "6px",
                    maxWidth: "47.3%",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    borderLeft: "3px solid #a60f2d",
                  }}
                  onChange={handleCustomFertilizerOptions}
                  name="Formulation"
                >
                  <option value="Dry">Dry</option>
                  <option value="Wet">Wet</option>
                </select>
              </div>

              <h4>Nutrient Composition (%)</h4>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {Object.keys(customFertilizers).map((nutrient, index) => (
                  <div
                    key={index}
                    style={{
                      width: "30%",
                      marginBottom: "10px",
                      marginRight: "3%",
                    }}
                  >
                    <label>{nutrient} *</label>
                    <input
                      type="number"
                      placeholder="0"
                      style={{
                        width: "100%",
                        padding: "5px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        borderLeft: "2px solid #a60f2d",
                      }}
                      name={nutrient}
                      onChange={handleCustomFertilizerOptions}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            margin: "15px",
          }}
        >
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
          <Button
            variant="contained"
            color="primary"
            onClick={saveFertilizer} // Updated to use the new save function
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
          </Button>
        </div>
      </div>
    </Box>
  );
};