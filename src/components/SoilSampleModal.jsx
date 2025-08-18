import React, { useContext, useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import { getDayOfYear, globalUnits } from "../util/shared-utils";
import { saveSoilSampleData,  saveInitialSoilConditions, saveTask, getSoilSampleData} from "../util/apiUtil";
import { UserContext } from "../context/UserContext";
import API from "../util/api";

const SoilSampleModal = ({ userId, plantingObjId, selectedSoilTask, closeModal, loadTasks }) => {
  const {userSavedUnit} = useContext(UserContext);
  const [columns] = useState([
    `Depth (${globalUnits[userSavedUnit].length})`,
    "Water Content",
    "Nitrate Content",
    "Ammonium Content",
  ]);
  const [rows, setRows] = useState([
    {
      depth: 0,
      water_content: 0,
      nitrate_content: 0,
      ammonium_content: 0,
    },
  ]);
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); //  Default to today's date
  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear - 2}-01-01`;
  const maxDate = `${currentYear + 2}-12-31`;
  
  const [dateError, setDateError] = useState("");
  const validateDate = (value) => {
    const enteredYear = new Date(value).getFullYear();
    if (enteredYear < currentYear - 2 || enteredYear > currentYear + 2) {
      setDateError(`Please enter a date between ${minDate} and ${maxDate}`);
    } else {
      setDateError("");
    }
  };
    
  const addRow = () => {
    const newRow = {
      depth: 0,
      water_content: 0,
      nitrate_content: 0,
      ammonium_content: 0,
    };
    setRows([...rows, newRow]);
  };

  const handleCellChange = (rowIndex, cellKey, cellValue) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex][cellKey] = cellValue;
    setRows(updatedRows);
  };

  const handleSave = async () => {
    const doy = getDayOfYear(new Date(date));
 
    const parsedRows = rows.map((row) => ({
      depth: parseFloat(row["depth"]),
      water_content: parseFloat(row["water_content"]),
      nitrate_content: parseFloat(row["nitrate_content"]),
      ammonium_content: parseFloat(row["ammonium_content"]),
    }));
 
    const input = { userId, plantingObjId, name, doy, rows: parsedRows };
    let finalTask = {
      planting_objid: plantingObjId,
      user_id: userId,
      applied_item: 'Soil Sample',
      DOE: new Date(date),   //  Use the actual date object
      applied_value: name,
      quantity: Number(rows[0]["depth"]),
    };
    
    
    try {
      await saveTask(finalTask); 
      await saveSoilSampleData(input); // saves to DB
      await saveInitialSoilConditions({ rows: parsedRows, doy }); // writes CSV
      // alert("Soil sample + initial soil conditions saved!");

      if (typeof loadTasks === "function") {
        await loadTasks(userId, plantingObjId);
      }

      closeModal();

    } catch (error) {
      alert("Saving soil data failed.");
      console.error(error);
    }
  };
  useEffect(() => {
    if(userId && plantingObjId && selectedSoilTask) {
      const fetchData = async () => {
        try {
          const data = await getSoilSampleData(userId, plantingObjId);  
          const match = data.find(d => d.name === selectedSoilTask.applied_value);        
          if (match) {
            setRows(data.map(row => ({
              depth: row.depth,
              water_content: row.water_content,
              nitrate_content: row.nitrate_content,
              ammonium_content: row.ammonium_content,
            })));
            setName(match.name);
            setDate(match.date);
          }
        } catch (error) {
          console.error("Error fetching soil sample data:", error);
        }
      };
      fetchData();
    }
  }, [userId, plantingObjId, selectedSoilTask]);

  return (
    <Dialog
      open={true}
      onClose={closeModal}
      maxWidth="md"
      fullWidth
      // Give the dialog a rounded corner:
      PaperProps={{
        style: { borderRadius: 5, width: "45%" },
      }}
    >
      <DialogTitle>Soil Sample Data</DialogTitle>
      <DialogContent>
        {/* Name & Date Fields */}
        <Box display="flex" flexDirection="column" gap={2} mb={2}>
          <TextField
            label="Name"
            placeholder="e.g. Sample 1"
            variant="outlined"
            fullWidth
            value={name}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[a-zA-Z0-9 ]*$/.test(value)) {
                setName(value);
              }   
            }}
            error={!/^[a-zA-Z0-9 ]*$/.test(name)}
            helperText={
              !/^[a-zA-Z0-9 ]*$/.test(name)
                ? "Only letters, numbers, and spaces are allowed"
                : ""
            }
            InputLabelProps={{ shrink: true }}
            sx={{
              mt: 1,
              "& .MuiOutlinedInput-root": {
                height: 48,
                "& fieldset": {
                  borderColor: "transparent",
                },
                "&:hover fieldset": {
                  borderColor: "transparent",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "transparent",
                },
              },
            }}
              fullWidth
          />

          <TextField
            label="Date"
            type="date"
            variant="outlined"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onBlur={(e) => validateDate(e.target.value)}
            inputProps={{ min: minDate, max: maxDate }}
            error={Boolean(dateError)}
            helperText={dateError}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 48,
                "& fieldset": {
                  borderColor: "transparent",
                },
                "&:hover fieldset": {
                  borderColor: "transparent",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "transparent",
                },
              },
            }}
              fullWidth
          />

        </Box>

        {/* Soil Sample Table */}
        <table
          border="1"
          cellPadding="8"
          style={{
            borderCollapse: "collapse",
            width: "100%",
            marginTop: "10px",
            textAlign: "center",
          }}
        >
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Object.keys(row).map((cell) => (
                  <td key={cell} style={{padding:0, border:" 1px solid #ddd", transition:"background-color 0.2s"}}>
                    <input
                      type="text"
                      value={row[cell]}
                      onChange={(e) =>
                        handleCellChange(rowIndex, cell, e.target.value)
                      }
                      onMouseEnter={e => e.target.style.backgroundColor = "#fafafa"}
                      onMouseLeave={e => e.target.style.backgroundColor = "transparent"}
                      style={{
                        width: "100%",
                        border: "none",
                        textAlign: "center",
                        outline: "none",
                        padding: "8px",
                        fontSize: "0.9rem",
                        transition: "background-color 0.2s, box-shadow 0.2s",
                        boxShadow: "inset 0 0 0 rgba(0,0,0,0)",
                      }}
                      onFocus={(e) => {(e.currentTarget.style.boxShadow = "inset 0 0 0 2px #a60f2d")}}
                      onBlur={(e) => {(e.currentTarget.style.boxShadow = "inset 0 0 0 rgba(0,0,0,0)")}
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add Row Button */}
        <Box display="flex" justifyContent="center" mt={2}>
          <Button
            onClick={addRow}
            variant="contained"
            style={{
              backgroundColor: "#a60f2d",
              color: "white",
              fontWeight: "300",
            }}
          >
            ➕ Add Row
          </Button>
        </Box>
      </DialogContent>

      {/* Buttons (Close on left, Save on right) */}
      <DialogActions
        style={{ justifyContent: "space-between", padding: "16px" }}
      >
        <Button
          onClick={closeModal}
          variant="contained"
          sx={{
            top: "0.2rem",
            backgroundColor: "#6c757d",
            color: "white",
            width: "15%",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          style={{
            backgroundColor: "#a60f2d",
            color: "white",
            padding: "8px 20px",
            border: "none",
            borderRadius: "5px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SoilSampleModal;
