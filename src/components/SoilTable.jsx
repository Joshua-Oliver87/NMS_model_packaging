import React, { useState } from "react";
import API from "../util/api";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
} from "@mui/material";

export const SoilTable = ({ data, objid, onSuccess }) => {
  const colWidths = {
    "Horizon #": "75px",
    Texture: "130px",
    "Thickness (in)": "110px",
    "Clay (%)": "100px",
    "Silt (%)": "100px",
    "Sand (%)": "100px",
    "Field Capacity Water Content (m/m)": "130px",
    "Permanent Wilting Point Water Content (m/m)": "140px",
    "Soil Organic Matter (%)": "100px",
  };

  const [rows, setRows] = useState(data);

  const handleInputChange = (rowIndex, key, newValue) => {
    setRows((prevRows) => {
      const updatedRows = [...prevRows];
      updatedRows[rowIndex] = { ...updatedRows[rowIndex], [key]: newValue };
      return updatedRows;
    });
  };

  const handleSave = async () => {
    const payload = { objid, value: JSON.stringify(rows) };

    try {
      await API.post(`/api/updateSoilDetails`, payload);
      onSuccess(true);
      alert("Saved successfully");
    } catch (error) {
      console.error("Error while updating:", error);
      alert("Error while saving.");
    }
  };

  if (!rows.length) {
    return (
      <Typography variant="h6" align="center" sx={{ m: 2 }}>
        No records to display
      </Typography>
    );
  }

  // Ensure "Horizon #" is always included in the columns
  const columnKeys = ["Horizon #", ...Object.keys(data[0]).filter(key => key !== "Horizon #")];

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columnKeys.map((key) => (
                <TableCell key={key} sx={{ width: colWidths[key] }}>
                  {key}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columnKeys.map((cellKey) => {
                  if (cellKey === "Horizon #") {
                    return (
                      <TableCell key={cellKey} sx={{ width: colWidths[cellKey] }}>
                        {rowIndex + 1}
                      </TableCell>
                    );
                  }
                  if (cellKey === "Texture") {
                    return (
                      <TableCell key={cellKey} sx={{ width: colWidths[cellKey] }}>
                        {row[cellKey] || "N/A"}
                      </TableCell>
                    );
                  }
                  return (
                    <TableCell key={cellKey} sx={{ width: colWidths[cellKey], padding: "4px" }}>
                      <TextField
                        value={row[cellKey] || row[cellKey] === "" ? row[cellKey] : "N/A"}
                        onChange={(e) =>
                          handleInputChange(rowIndex, cellKey, e.target.value)
                        }
                        variant="outlined"
                        size="small"
                        fullWidth
                        InputProps={{
                          sx: {
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(0, 0, 0, 0.23)", // Default border color
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(0, 0, 0, 0.87)", // Hover border color
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#1976d2", // Blue focus border color
                              borderWidth: "2px", // Ensure the focus border is visible
                            },
                          },
                        }}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <Button
          variant="outlined"
          onClick={() => onSuccess(false)}
          sx={{
            backgroundColor: "#6c757d",
            color: "white",
            px: 2,
            py: 1,
            borderRadius: "5px",
            fontSize: "14px",
            fontWeight: 500,
            textTransform: "none",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            backgroundColor: "#a60f2d",
            color: "white",
            px: 3,
            py: 1,
            borderRadius: "5px",
            fontSize: "14px",
            fontWeight: 500,
            textTransform: "none",
          }}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
};