import React, { useState, useEffect, useContext } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { Tabs, Tab, TableSortLabel } from "@mui/material";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  WaterDrop,
  Science,
  CalendarMonth,
  Terrain,
} from "@mui/icons-material";
import { getTasks } from "../util/apiUtil";
import { UserContext } from "../context/UserContext";
import { globalUnits, units } from "../util/shared-utils";

const GridViewModal = ({ closeModal, userId, plantingObjId }) => {
  
  const {userSavedUnit} = useContext(UserContext);
  const [tabIndex, setTabIndex] = useState(0);
  const [eventData, setEventData] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc"); // Sorting order state

  useEffect(() => {
    if (!userId || !plantingObjId) {
      console.warn("Skipping API call - userId or plantingObjId is missing.");
      return;
    }

    console.log("Fetching completed tasks for:", { userId, plantingObjId });

    getTasks(userId, plantingObjId)
      .then((data) => {
        console.log("API Response (Tasks):", data);
        const formattedData = data.map((task) => ({
          date: new Date(task.DOE), // Store date as a Date object for sorting
          dateFormatted: new Date(task.DOE).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          irrigationMethod: task.irrigation_method || "-",
          appliedIrrigation:
            task.applied_item === "Irrigation" ? `${task.quantity.value}` : "-",
          recommendedIrrigation: task.recommended_irrigation || "-",
          fertilizer:
            task.applied_item === "Fertilizer"
              ? `${task.quantity.value}`
              : "-",
          soilSampleDepth:
            task.applied_item === "Soil Sample" ? `${task.depth} cm` : "-",
          soilMoisture:
            task.applied_item === "Soil Sample" ? `${task.moisture}%` : "-",
          soilPH: task.applied_item === "Soil Sample" ? task.ph : "-",
        }));
        setEventData(formattedData);
      })
      .catch((err) => console.error("Error fetching completed tasks:", err));
  }, [userId, plantingObjId]);

  // Sort Function for Date Column
  const handleSort = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);

    const sortedData = [...eventData].sort((a, b) =>
      newOrder === "asc" ? a.date - b.date : b.date - a.date
    );

    setEventData(sortedData);
  };

  // Filter data based on selected tab
  const filteredEvents = eventData.filter((event) => {
    if (tabIndex === 1) return event.appliedIrrigation !== "-"; // Water tab
    if (tabIndex === 2) return event.fertilizer !== "-"; // Fertilizer tab
    if (tabIndex === 3) return event.soilSampleDepth !== "-"; // Soil Sample tab
    return true; // All tab
  });

  // Set dynamic heading based on selected tab
  const getDialogTitle = () => {
    if (tabIndex === 0) return `Total Events: ${eventData.length}`;
    if (tabIndex === 1) return `Water Events: ${filteredEvents.length}`;
    if (tabIndex === 2) return `Fertilizer Events: ${filteredEvents.length}`;
    if (tabIndex === 3) return `Soil Sample Events: ${filteredEvents.length}`;
    return "Events";
  };

  return (
    <Dialog
      open
      onClose={closeModal}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: "20px",
          width: "50%",
          height: "70%",
          padding: "0.5rem",
        },
      }}
    >
      <DialogTitle>{getDialogTitle()}</DialogTitle>
      <Tabs
        value={tabIndex}
        onChange={(e, newIndex) => setTabIndex(newIndex)}
        centered
        variant="fullWidth"
        textColor="inherit"
        sx={{
          "& .MuiTabs-indicator": { backgroundColor: "#a60f2d" },
          "& .Mui-selected": { color: "#a60f2d" },
          "& .Mui-selected svg": { fill: "#a60f2d" },
        }}
      >
        <Tab label="All" icon={<CalendarMonth />} />
        <Tab label="Water" icon={<WaterDrop />} />
        <Tab label="Fertilizer" icon={<Science />} />
        <Tab label="Soil Sample" icon={<Terrain />} />
      </Tabs>

      {/* 
         1) Give DialogContent a fixed max-height (or use %).
         2) Allow vertical scrolling to prevent overlap with tabs above.
      */}
      <DialogContent
        sx={{
          maxHeight: "39vh", // Adjust as needed so tabs are never covered.
          overflowY: "auto",
        }}
      >
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {/* Sortable Date Column */}
                <TableCell>
                  <TableSortLabel
                    active
                    direction={sortOrder}
                    onClick={handleSort}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                {tabIndex === 1 ? (
                  <>
                    <TableCell>Method</TableCell>
                    <TableCell>{`Applied (${globalUnits[userSavedUnit]?.length})`}</TableCell>
                    <TableCell>{`Recommended (${globalUnits[userSavedUnit]?.length})`}</TableCell>
                  </>
                ) : tabIndex === 2 ? (
                  <>
                    <TableCell>Name</TableCell>
                    <TableCell>{`Applied (${globalUnits[userSavedUnit]?.area})`}</TableCell>
                    <TableCell>{`Recommended (${globalUnits[userSavedUnit]?.area})`}</TableCell>
                  </>
                ) : tabIndex === 3 ? (
                  <>
                    <TableCell>Depth</TableCell>
                    <TableCell>Soil Moisture</TableCell>
                    <TableCell>Soil pH</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{`Fertilizer (${globalUnits[userSavedUnit]?.area})`}</TableCell>
                    <TableCell>{`Water (${globalUnits[userSavedUnit]?.length})`}</TableCell>
                    <TableCell>{`Soil Sample (${globalUnits[userSavedUnit]?.area})`}</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell>{event.dateFormatted}</TableCell>
                    {tabIndex === 1 ? (
                      <>
                        <TableCell>{event.irrigationMethod}</TableCell>
                        <TableCell>{event.appliedIrrigation}</TableCell>
                        <TableCell>{event.recommendedIrrigation}</TableCell>
                      </>
                    ) : tabIndex === 2 ? (
                      <>
                        <TableCell>{event.fertilizerName}</TableCell>
                        <TableCell>{event.appliedFertilizer}</TableCell>
                        <TableCell>{event.recommendedFertilizer}</TableCell>
                      </>
                    ) : tabIndex === 3 ? (
                      <>
                        <TableCell>{event.soilSampleDepth}</TableCell>
                        <TableCell>{event.soilMoisture}</TableCell>
                        <TableCell>{event.soilPH}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{event.fertilizer}</TableCell>
                        <TableCell>{event.appliedIrrigation}</TableCell>
                        <TableCell>{event.soilSampleDepth}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={
                      tabIndex === 1 || tabIndex === 2 || tabIndex === 3 ? 4 : 4
                    }
                    align="center"
                  >
                    No events available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={closeModal}
          variant="contained"
          sx={{
            backgroundColor: "#6c757d",
            color: "white",
            width: "15%",
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GridViewModal;
