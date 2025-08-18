import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import "../App.css";
import API from "../util/api";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import ListIcon from "@mui/icons-material/List";
import CalendarViewMonthIcon from "@mui/icons-material/CalendarViewMonth";
import EventIcon from "@mui/icons-material/Event";
import {
  fetchIrrigationWaterSources,
  fetchPlantingSettings,
  fetchSeasonalOutputData,
  updateIrrigationParams,
  getTasks,
  saveTask,
} from "../util/apiUtil";
import { ETDataModal } from "./ETDataModal";
import GDDDataModal from "./GDDDataModal";
import SeasonalOutputModal from "./SeasonalOutputModal";
import SimulationOutputModal from "./SimulationOutputModal";
import { UserContext } from "../context/UserContext";
import CalendarViewModal from "../components/CalendarViewModal";
import GridViewModal from "../components/GridViewModal";
import SoilSampleModal from "../components/SoilSampleModal";
import {
  getCustomDate,
  getCustomDateForTasks,
  getDayOfYear,
} from "../util/shared-utils";
import { Tooltip } from "@mui/material"; // Import Tooltip
import ListViewModal from "../components/ListViewModal";
import {
  saveIrrigationParams,
  calculateIrrigation,
  appendCSVData,
} from "../util/apiUtil";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { fetchFertilizerData } from "../util/apiUtil";
import DeleteIcon from "@mui/icons-material/Delete";
import { deleteTask } from "../util/apiUtil";
import IconButton from "@mui/material/IconButton";

const TaskButton = ({
  blockId,
  nearestStationUnitId,
  plantingData,
  plantingDate,
}) => {
  const cropTypes = {
    "Silage corn": 1,
    Triticale: 2,
  };
  const { user,userSavedUnit } = useContext(UserContext); // Get logged-in user data dynamically
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isIrrigationModalOpen, setIsIrrigationModalOpen] = useState(false);
  const [isFertilizerModalOpen, setIsFertilizerModalOpen] = useState(false);
  const [selectedSoilTask, setSelectedSoilTask] = useState(null);

  const [isChartDropdownOpen, setIsChartDropdownopen] = useState(false);
  const [isETModalOpen, setIsETModalOpen] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [showSummaryDetails, setShowSummaryDetails] = useState(false);
  const [showFertilizerRecommendation, setShowFertilizerRecommendation] = useState(false);
  const [showFertilizerSummaryDetails, setShowFertilizerSummaryDetails] = useState(false);
  const [isGDDModalOpen, setIsGDDModalOpen] = useState(false); // GDD Modal state
  const dropdownRef = useRef(null);
  const [waterSources, setWaterSources] = useState([]);
  const [isSeasonalOutputModalOpen, setIsSeasonalOutputModalOpen] = useState(false);
  const [isSimulationOutputModalOpen, setIsSimulationOutputModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear - 2}-01-01`;
  const maxDate = `${currentYear + 2}-12-31`;

  const [dateErrors, setDateErrors] = useState({
    irrigationEventDate: "",
    fertilizerEventDate: "",
  });
  const validateEventDate = (fieldName, value) => {
    const enteredYear = new Date(value).getFullYear();
    if (enteredYear < currentYear - 2 || enteredYear > currentYear + 2) {
      setDateErrors((prev) => ({
        ...prev,
        [fieldName]: `Please enter a date between ${minDate} and ${maxDate}`,
      }));
    } else {
      setDateErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };


  const [cropType, setCropType] = useState(0);
  const [seasonalOutputData, setSeasonalOutputData] = useState(null);
  const [simulationOutputData, setSimulationOutputData] = useState(null);

  const [budgetData, setBudgetData] = useState(null);
  const [irrigationBudgetData, setIrrigationBudgetData] = useState(null);
  const [fertilizerBudgetData, setFertilizerBudgetData] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [irrigationTask, setIrrigationTask] = useState({
    applied_item: "Irrigation",
  });
  const [fertilizerTask, setFertilizerTask] = useState({
    applied_item: "Fertilizer",
  });
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isGridViewModalOpen, setIsGridViewModalOpen] = useState(false);
  const [isListViewModalOpen, setIsListViewModalOpen] = useState(false);
  const [isSoilSampleModalOpen, setIsSoilSampleModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [showHint, setShowHint] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [fertilizerOptions, setFertilizerOptions] = useState([]);
  
  useEffect(() => {
    if (showHint) {
      setSnackbarOpen(true);
      setShowHint(false); 
    }
  }, []);


  // // Calculate today's date and the date 7 days from today dynamically
  // const today = new Date();
  // const maxDate = new Date();
  // maxDate.setDate(today.getDate() + 7);

  // // Format dates as YYYY-MM-DD for the input type="date"
  // const formatDate = (date) => {
  //   const year = date.getFullYear();
  //   const month = String(date.getMonth() + 1).padStart(2, '0');
  //   const day = String(date.getDate()).padStart(2, '0');
  //   return `${year}-${month}-${day}`;
  // };

  // const minDateStr = formatDate(today);
  // const maxDateStr = formatDate(maxDate);

  // ---- Handlers ----

  const handleCalculateIrrigation = async () => {
    setShowRecommendation(false);
    setLoading(true);

    try {
      // Step 1: Save irrigation parameters
      const response = await saveIrrigationParams(irrigationTask);

      if (response) {
        console.log(
          " Irrigation parameters saved successfully, now appending CSVs..."
        );

        // Step 2: Append CSVs
        const appendResponse = await appendCSVData();
        console.log(" CSVs appended successfully:", appendResponse);

        // Step 3: Calculate irrigation recommendation
        console.log(" Now calculating irrigation recommendations...");
        const calculationResponse = await calculateIrrigation();
        console.log(
          " Irrigation model triggered successfully:",
          calculationResponse
        );

        console.log(
          "🔄 Re-running handleBudgetData to fetch updated irrigationBudgetData..."
        );
        handleBudgetData(irrigationTask.irrigationEventDate); // <---- Add this line

        setShowRecommendation(true);
      }
    } catch (error) {
      console.error(" Error in irrigation calculation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleIrrigationTaskChange = (e) => {
    const { name, value } = e.target;
    setIrrigationTask((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === "irrigationEventDate") {
      handleBudgetData(value);
    }
    
  };

  const handleFertilizerTaskChange = (e) => {
    const { name, value } = e.target;
    setFertilizerTask((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === "fertilizerEventDate") {
      handleBudgetData(value);
    }
  };

  const handleTaskSave = async (task) => {
    let finalTask = {
      planting_objid: plantingData?.objid,
      user_id: user?.objid,
    };

    if (task?.applied_item === "Fertilizer") {
      finalTask = {
        ...finalTask,
        applied_item: task.applied_item,
        DOE: new Date(task.fertilizerEventDate),
        applied_value: task.fertilizerType,
        quantity: Number(task.appliedFertilizer),
      };
    } else if (task?.applied_item === "Irrigation") {
      const irrigationDepth = document.querySelector(
        '[name="irrigationAppliedWater"]'
      ).value;
      finalTask = {
        ...finalTask,
        applied_item: task.applied_item,
        DOE: new Date(task.irrigationEventDate),
        applied_value: task.irrigationMethod, //  Only saving method
        quantity: Number(irrigationDepth),
      };

      try {
        const updateResponse = await updateIrrigationParams(
          getDayOfYear(new Date(task.irrigationEventDate)),
          task.irrigationMethod,
          irrigationDepth // Pass the depth entered by the user
        );
        console.log(" Irrigation event saved with depth:", updateResponse);
      } catch (err) {
        console.error(" Error saving irrigation event:", err);
      }
    }

    console.log(finalTask);

    try {
      await saveTask(finalTask); //  Save the task asynchronously
      console.log(" Task saved successfully");
    } catch (err) {
      console.error(" Error saving task:", err);
    } finally {
      setIrrigationTask({ applied_item: "Irrigation" });
      setFertilizerTask({ applied_item: "Fertilizer" });
      loadTasks(finalTask.user_id, finalTask.planting_objid);
    }
  };

  const loadTasks = (userId, plantingObjId) => {
    getTasks(userId, plantingObjId).then((data) => {
      console.log("Task API Response:", data);
  
      const updatedData = data.map((dataMap) => {
        let parsedDate = "";
  
        // ✅ Convert DOY (number) to actual date
        if (typeof dataMap.DOE === "number") {
          const year = plantingDate ? new Date(plantingDate).getFullYear() : new Date().getFullYear();
          const baseDate = new Date(year, 0);
          baseDate.setDate(dataMap.DOE);
          parsedDate = baseDate.toISOString().substring(0, 10);
        }
  
        // Handle already-formatted date strings
        else if (typeof dataMap.DOE === "string" && !isNaN(Date.parse(dataMap.DOE))) {
          parsedDate = new Date(dataMap.DOE).toISOString().substring(0, 10);
        }
  
        return {
          ...dataMap,
          DOE: parsedDate,
          quantity: typeof dataMap.quantity === "object"
            ? dataMap.quantity
            : {
                value: Number(dataMap.quantity || 0),
                units: dataMap.applied_item === "Fertilizer" ? "lbs/acre" :
                       dataMap.applied_item === "Irrigation" ? "in" : "",
              },
        };
      });
  
      const sortedData = updatedData.sort((a, b) => new Date(a.DOE) - new Date(b.DOE));
setCompletedTasks(sortedData);
      console.log(" Sorted tasks:", sortedData);
    });
  };
  
  const handleDeleteClick = async (e, taskId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(taskId);
      // reload tasks after deletion
      loadTasks(user.objid, plantingData.objid);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete task.");
    }
  };
  

  const handleBudgetData = (date) => {
    let irrigationSelectedData = {};
    let fertilizerSelectedData = {};

    const selectedDateDOY = getDayOfYear(new Date(date)); // User's DOY
    console.log("📌 Selected DOY:", selectedDateDOY);

    //  Find closest match in model's DOY data
    const dataForSelectedDoy =
      budgetData?.find((bd) => Math.abs(bd.DOY - selectedDateDOY) <= 2) || {};

    if (Object.keys(dataForSelectedDoy).length === 0) {
      console.log("⚠ No matching budget data found for DOY:", selectedDateDOY);
      return;
    }

    console.log(" Found budget data for DOY:", dataForSelectedDoy.DOY);

    Object.keys(dataForSelectedDoy).forEach((key) => {
      if (
        key.includes("Irrigation Recommendation") ||
        key === "Soil Water Depletion (0-1)" ||
        key.includes("Rain and Irrigation") ||
        key.includes("Water Use") ||
        key.includes("Water Stress Index")
      ) {
        irrigationSelectedData[key] =
          dataForSelectedDoy[key] !== undefined
            ? parseFloat(dataForSelectedDoy[key]).toFixed(2)
            : "--";
      } else if (key === "Days Since Last Irrigation") {
        irrigationSelectedData[key] = dataForSelectedDoy[key];
      } else if (
        key.includes("Nitrogen Stress Index") ||
        key.includes("Today Crop N Demand") ||
        key.includes("N Available") ||
        key.includes("N Deficit") ||
        key.includes("N Fertilization") ||
        key.includes("N Uptake")
      ) {
        fertilizerSelectedData[key] =
          dataForSelectedDoy[key] !== undefined
            ? parseFloat(dataForSelectedDoy[key]).toFixed(2)
            : "--";
      }
    });

    console.log(" Setting irrigation and fertilizer budget data...");
    setIrrigationBudgetData(irrigationSelectedData);
    setFertilizerBudgetData(fertilizerSelectedData);
  };

  // ---- useEffect Hooks ----
  const [plantingDOY, setPlantingDOY] = useState(null);

  useEffect(() => {
    if (plantingData?.objid) {
      fetchPlantingSettings(plantingData?.objid).then((data) => {
        const cropTypeInfo = data.find(
          (info) => info["Crop Number"] === cropType || !info.hasOwnProperty("Crop Number")
        )?.value;
        setCropType(cropTypes[cropTypeInfo]);

        //  Fetch Planting DOY from API
        fetch(`/api/get-planting-settings?plantingId=${plantingData.objid}`)
          .then((res) => res.json())
          .then((result) => {
            const plantingDOYEntry = result.find(
              (entry) => entry.name === "planting_doy"
            );
            if (plantingDOYEntry) {
              setPlantingDOY(parseInt(plantingDOYEntry.value, 10));
              console.log("🌱 Loaded Planting DOY:", plantingDOYEntry.value);
            } else {
              console.warn("⚠ No planting DOY found in API response.");
              setPlantingDOY(null);
            }
          })
          .catch((error) =>
            console.error(" Error fetching planting DOY:", error)
          );
      });

      loadTasks(user?.objid, plantingData?.objid);
    }
  }, [plantingData]);

  useEffect(() => {
    if (cropType) {
      fetchSeasonalOutputData().then((data) => {
        const dailyData = data.daily_data.filter(
          (info) => info["Crop Number"] === cropType || !info.hasOwnProperty("Crop Number")
        );
        const seasonalData = data.seasonal_data.find(
          (info) => info["Crop Number"] === cropType || !info.hasOwnProperty("Crop Number")
        );
        setSeasonalOutputData([seasonalData]);
        setSimulationOutputData(dailyData);
        setBudgetData(data.budget_data);
      });
    }
  }, [cropType]);

  useEffect(() => {
    if (budgetData?.length > 0 && irrigationTask?.irrigationEventDate) {
      console.log(
        "🔄 Detected new budget data, updating irrigationBudgetData..."
      );
      handleBudgetData(irrigationTask.irrigationEventDate);
    }
  }, [budgetData]); // <---- Watch budgetData for updates

  // ---- UI Toggles ----
  const toggleBox = () => {
    setIsOpen((prev) => !prev);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownOpen((prev) => !prev);
  };

  const openIrrigationModal = (e) => {
    e.stopPropagation();
    setIsIrrigationModalOpen(true);
    fetchIrrigationWaterSources().then((res) => {
      setWaterSources(res.data);
    });
  };

  const openFertilizerModal = (e) => {
    e.stopPropagation();
    setIsFertilizerModalOpen(true);
    if (blockId) {
      fetchFertilizerData(blockId).then((res) => {
        setFertilizerOptions(res || []);
      });
    }
  };

  const closeIrrigationModal = () => {
    setIsIrrigationModalOpen(false);
    setShowRecommendation(false);
  };

  const closeFertilizerModal = () => {
    setIsFertilizerModalOpen(false);
    setShowFertilizerRecommendation(false);
  };

  const toggleChartDropdown = () => {
    setIsChartDropdownopen((prev) => !prev);
  };

  const openETModal = () => {
    setIsChartDropdownopen(false);
    setIsETModalOpen(true);
  };

  const closeModal = () => {
    setIsETModalOpen(false);
    setIsSeasonalOutputModalOpen(false);
    setIsSimulationOutputModalOpen(false);
  };

  const openSeasonalOutputModal = () => {
    setIsChartDropdownopen(false);
    setIsSeasonalOutputModalOpen(true);
  };

  const openSimulationOutputModal = () => {
    setIsChartDropdownopen(false);
    setIsSimulationOutputModalOpen(true);
  };

  const openSoilSampleModal = (e) => {
    e.stopPropagation();
    setSelectedSoilTask(null);
    setIsSoilSampleModalOpen(true);
  };

  const closeSoilSampleModal = () => {
    setIsSoilSampleModalOpen(false);
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // ---- Render ----
  return (
    <div style={{ zIndex: 999 }}>
      {/* Button to toggle task details box with Tooltip */}
      <Tooltip title="Task Options and Analysis" arrow enterDelay={300} leaveDelay={100}>
        <div className="circle-button" onClick={toggleBox} style={{animation: showHint ? "pulse 5s infinite": "none", boxShadow: showHint ? "0 0 0 rgba(166, 15, 45, 0.4)": "none",}}>
          <img
            src="https://img.icons8.com/ios-filled/50/FFFFFF/menu--v1.png"
            alt="Options"
            style={{ width: "15px", height: "15px" }}
          />
        </div>
      </Tooltip>

      {/* Task Details Box */}
      {isOpen && (
        <div className="task-details-box">
          <div className="task-header">
            <h3>{plantingData?.name}</h3>
            <div className="task-icons">
              <Tooltip title="View Charts & Analysis" arrow enterDelay={300} leaveDelay={100}>
              <BarChartIcon onClick={toggleChartDropdown} style={{cursor: "pointer",}} 
              />
              </Tooltip>
              {isChartDropdownOpen && (
                <div className="dropdown-tables" ref={dropdownRef}>
                  <div className="dropdown-item" onClick={openETModal}>
                    <span>ET Data</span>
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => setIsGDDModalOpen(true)}
                  >
                    <span>GDD</span>
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={openSeasonalOutputModal}
                  >
                    <span>Seasonal Output</span>
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={openSimulationOutputModal}
                  >
                    <span>Simulation Output</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="task-content">
              <h4>COMPLETED TASKS</h4>
              <button className="add-task-btn" onClick={toggleDropdown}>
                ➕ Add Task
              </button>
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="dropdown-menu" ref={dropdownRef}>
                  <div className="dropdown-item" onClick={openIrrigationModal}>
                    <span>Irrigation</span>
                  </div>
                  <div className="dropdown-item" onClick={openFertilizerModal}>
                    <span>Fertilizer</span>
                  </div>
                  <div className="dropdown-item" onClick={openSoilSampleModal}>
                    <span>Soil Sample</span>
                  </div>
                </div>
              )}
            </div>

            {/* Completed Tasks */}
              <div
                className="completed-tasks-container"
                style={{
                  position: "relative",
                  paddingBottom: "60px",
                }}
              >
                {completedTasks.length > 0 ? (
                  completedTasks.map((task, index) => (
                    <div
                      key={index}
                      className="completed-task-item"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "4px 8px",
                      }}
                    >
                      {/* 1) Clickable area */}
                      <div
                        onClick={() => {
                          if (task.applied_item === "Irrigation") {
                            setIrrigationTask({
                              applied_item: "Irrigation",
                              irrigationEventDate: task.DOE,
                              irrigationMethod: task.applied_value,
                              irrigationAppliedWater: task.quantity?.value?.toFixed(2),
                            });
                            setIsIrrigationModalOpen(true);
                          } else if (task.applied_item === "Fertilizer") {
                            setFertilizerTask({
                              applied_item: "Fertilizer",
                              fertilizerEventDate: task.DOE,
                              fertilizerType: task.applied_value,
                              appliedFertilizer: task.quantity?.value?.toFixed(2),
                            });
                            setIsFertilizerModalOpen(true);
                          } else if (task.applied_item === "Soil Sample") {
                            setSelectedSoilTask(task);
                            setIsSoilSampleModalOpen(true);
                          }
                        }}
                        style={{
                          display: "flex",
                          gap: "12px",
                          flex: 1,
                          cursor:
                            task.applied_item === "Irrigation" ||
                            task.applied_item === "Fertilizer"
                              ? "pointer"
                              : "default",
                        }}
                      >
                        <span><strong>{task.DOE}</strong></span>
                        <span>{task.applied_value}</span>
                        <span>
                          {task.quantity.value.toFixed(2)} {task.quantity.units}
                        </span>
                      </div>

                      {/* 2) Delete button */}
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteClick(e, task.objid /* or task.id */)}
                        title="Delete task"
                      >
                        <DeleteIcon fontSize="small" style={{ color: "#a60f2d" }} />
                      </IconButton>
                    </div>
                  ))
                ) : (
                  <p className="no-tasks-message">No tasks completed yet.</p>
                )}


              {/* Icons in bottom-right */}
              <div
                className="bottom-right-icons"
                style={{
                  position: "absolute", // Sticks to the dialog box
                  bottom: "1px", // Distance from bottom inside the dialog
                  right: "0px", // Distance from right inside the dialog
                  display: "flex",
                  gap: "5px",
                  padding: "10px",
                  zIndex: 2, // Keep above content inside the dialog
                }}
              >
                <EventIcon
                  titleAccess="Calendar View"
                  onClick={() => setIsCalendarModalOpen(true)}
                  style={{
                    fontSize: "28px",
                    color: "#a60f2d",
                    cursor: "pointer",
                    transition: "transform 0.2s ease-in-out",
                  }}
                  onMouseOver={(e) => (e.target.style.transform = "scale(1.1)")}
                  onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
                />
              </div>
            </div>
          </div>
          </div>
      )}

      {/* ---------------- IRRIGATION MODAL ---------------- */}
      {isIrrigationModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Irrigation Event</h3>
            </div>
            <div className="modal-body">
              <label>
                Event Date<span style={{ color: "red" }}>*</span>
              </label>
              <input
              type="date"
              className="input-field"
              name="irrigationEventDate"
              value={irrigationTask.irrigationEventDate || ""}
              onChange={handleIrrigationTaskChange}
              onBlur={(e) => validateEventDate("irrigationEventDate", e.target.value)}
              min={minDate}
              max={maxDate}
            />
            {dateErrors.irrigationEventDate && (
              <p style={{ color: "red", fontSize: "12px" }}>{dateErrors.irrigationEventDate}</p>
            )}

              <label>
                Irrigation Method<span style={{ color: "red" }}>*</span>
              </label>
              <select
                className="input-field"
                value={irrigationTask?.irrigationMethod}
                name="irrigationMethod"
                onChange={handleIrrigationTaskChange}
              >
                <option value="">Select Method</option>
                {waterSources?.map((source) => (
                  <option key={source.ID} value={source.Irrig_System}>
                    {source.Irrig_System}
                  </option>
                ))}
              </select>

              {/* Recommendation Section */}
              {showRecommendation && (
                <div className="recommendation-section">
                  <h4>Recommendation</h4>
                  <span>
                    Applied {irrigationTask?.irrigationAppliedWater} inches
                    using {irrigationTask?.irrigationMethod} method.
                  </span>
                  <div
                    className="recommendation-summary"
                    onClick={() => setShowSummaryDetails(!showSummaryDetails)}
                  >
                    Recommendation Summary
                    <span style={{ marginLeft: "8px" }}>
                      {showSummaryDetails ? "▼" : "▶"}
                    </span>
                  </div>

                  {showSummaryDetails && (
                    <div className="summary-items">
                      {irrigationBudgetData &&
                      typeof irrigationBudgetData === "object" &&
                      Object.keys(irrigationBudgetData).length > 0 &&
                      Object.values(irrigationBudgetData).some((val) => val !== "--") ? (
                        Object.keys(irrigationBudgetData).map((key) => (
                          <div
                            key={key}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>{key}</span>
                            <span>{irrigationBudgetData?.[key] ?? "--"}</span>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            fontStyle: "italic",
                            fontSize: "12px",
                            color: "#000",
                            padding: "8px 0",
                          }}
                        >
                          No irrigation recommendations available for the selected date.
                        </div>
                      )}
                    </div>
                  )}
                  {/* Water Input Section */}
                  <div className="input-container">
                    <div className="input-box">
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Applied Water"
                        value={irrigationTask?.irrigationAppliedWater}
                        name="irrigationAppliedWater"
                        onChange={handleIrrigationTaskChange}
                      />
                       <span className="unit-label">{userSavedUnit === "Metric" ? "mm" : "in"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* --- Footer with Cancel on the LEFT, Create/Calc on the RIGHT --- */}
            <div
              className="modal-footer"
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "10px",
              }}
            >
              {/* Cancel button (left) */}
              <button
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  minHeight: "30px",
                  lineHeight: 1,
                }}
                onClick={() => {
                  setIrrigationTask({ type: "Irrigation" });
                  setShowRecommendation(false);
                  closeIrrigationModal();
                }}
              >
                Cancel
              </button>

              {/* Create/Calculate button (right) */}
              <button
                disabled={!irrigationTask?.irrigationMethod}
                style={{
                  backgroundColor: "#a60f2d",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  minHeight: "30px",
                  lineHeight: 1,
                }}
                onClick={() => {
                  if (!showRecommendation) {
                    setShowRecommendation(true);
                    handleCalculateIrrigation();
                  } else {
                    handleTaskSave(irrigationTask);
                    setShowRecommendation(false);
                    closeIrrigationModal();
                  }
                }}
              >
                {loading
                  ? "Loading..."
                  : showRecommendation
                  ? "Create"
                  : "Calculate Recommendation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- FERTILIZER MODAL ---------------- */}
      {isFertilizerModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Fertilization Event</h3>
            </div>
            <div className="modal-body">
            <label>
  Event Date<span style={{ color: "red" }}>*</span>
</label>
<input
  type="date"
  className="input-field"
  name="fertilizerEventDate"
  value={fertilizerTask.fertilizerEventDate || ""}
  onChange={handleFertilizerTaskChange}
  onBlur={(e) => validateEventDate("fertilizerEventDate", e.target.value)}
  min={minDate}
  max={maxDate}
/>
{dateErrors.fertilizerEventDate && (
  <p style={{ color: "red", fontSize: "12px", marginBottom: "0px", marginTop: "5px" }}>
    {dateErrors.fertilizerEventDate}
  </p>
)}

<label style={{ marginTop: "5px" }}>
  Fertilizer Type<span style={{ color: "red" }}>*</span>
</label>
<select
  className="input-field"
  value={fertilizerTask?.fertilizerType}
  name="fertilizerType"
  onChange={handleFertilizerTaskChange}
>
  <option value="">Select Fertilizer</option>
  {Array.isArray(fertilizerOptions) && fertilizerOptions.length > 0 ? (
    fertilizerOptions.map((fertilizer) => (
      <option key={fertilizer.objid} value={fertilizer.name}>
        {fertilizer.name}
      </option>
    ))
  ) : (
    <option disabled>No Fertilizers Available</option>
  )}
</select>


              {/* <label>
                Days To Next Fertilization
                <span style={{ color: "red" }}>*</span>
              </label>
              <input type="number" min="1" className="input-field" /> */}

              {/* Recommendation Section */}
              {showFertilizerRecommendation && (
                <div className="recommendation-section">
                  <h4>Recommendation</h4>
                  <span>
                    Apply {fertilizerTask?.appliedFertilizer} lbs/acre using{" "}
                    {fertilizerTask?.fertilizerType} fertilizer.
                  </span>
                  <div
                    className="recommendation-summary"
                    onClick={() =>
                      setShowFertilizerSummaryDetails(
                        !showFertilizerSummaryDetails
                      )
                    }
                  >
                    Recommendation Summary
                    <span style={{ marginLeft: "8px" }}>
                      {showFertilizerSummaryDetails ? "▼" : "▶"}
                    </span>
                  </div>

                  {showFertilizerSummaryDetails && (
                      <div className="summary-items">
                        {fertilizerBudgetData && typeof fertilizerBudgetData === "object" ? (
                          Object.keys(fertilizerBudgetData).length > 0 &&
                          Object.values(fertilizerBudgetData).some((val) => val !== "--") ? (
                            Object.keys(fertilizerBudgetData).map((key) => (
                              <div
                                key={key}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>{key}</span>
                                <span>{fertilizerBudgetData[key]}</span>
                              </div>
                            ))
                          ) : (
                            <div
                              style={{
                                fontStyle: "italic",
                                color: "#999",
                                padding: "8px 0",
                              }}
                            >
                              No fertilizer recommendations available for the selected date.
                            </div>
                          )
                        ) : (
                          <div
                            style={{
                              fontStyle: "italic",
                              fontSize: "12px",
                              color: "#000",
                              padding: "8px 0",
                            }}
                          >
                            Recommendation data not loaded yet.
                          </div>
                        )}
                      </div>
                    )}


                  {/* Fertilizer Input Section */}
                  <div className="input-container">
                    <div className="input-box">
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Applied Fertilizer"
                        value={fertilizerTask?.appliedFertilizer}
                        name="appliedFertilizer"
                        onChange={handleFertilizerTaskChange}
                      />
                      <span className="unit-label">lbs/acre</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* --- Footer with Cancel on the LEFT, Create/Calc on the RIGHT --- */}
            <div
              className="modal-footer"
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "10px",
              }}
            >
              {/* Cancel button (left) */}
              <button
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  minHeight: "30px",
                  lineHeight: 1,
                }}
                onClick={() => {
                  setFertilizerTask({ type: "Fertilizer" });
                  setShowFertilizerRecommendation(false);
                  closeFertilizerModal();
                }}
              >
                Cancel
              </button>

              {/* Create/Calculate button (right) */}
              <button
                disabled={!fertilizerTask?.fertilizerType}
                style={{
                  backgroundColor: "#a60f2d",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  minHeight: "30px",
                  lineHeight: 1,
                }}
                onClick={() => {
                  if (!showFertilizerRecommendation) {
                    setShowFertilizerRecommendation(true);
                  } else {
                    handleTaskSave(fertilizerTask);
                    setShowFertilizerRecommendation(false);
                    closeFertilizerModal();
                  }
                }}
              >
                {showFertilizerRecommendation
                  ? "Create"
                  : "Calculate Recommendation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ET, GDD, Seasonal, Simulation Modals */}
      {isETModalOpen && nearestStationUnitId && (
        <ETDataModal
          closeModal={closeModal}
          nearestStationUnitId={nearestStationUnitId}
          setIsETModalOpen={setIsETModalOpen}
        />
      )}

      {isGDDModalOpen && (
        <GDDDataModal
          closeModal={() => setIsGDDModalOpen(false)}
          stationId={nearestStationUnitId}
          plantingData={plantingData}
        />
      )}

      {isSeasonalOutputModalOpen && (
        <SeasonalOutputModal
          closeModal={closeModal}
          plantingData={plantingData}
          seasonalData={seasonalOutputData}
        />
      )}

      {isSimulationOutputModalOpen && (
        <SimulationOutputModal
          closeModal={closeModal}
          simulationData={simulationOutputData}
          budgetData={budgetData}
          plantingDate={plantingDate}
          nearestStationUnitId={nearestStationUnitId}
        />
      )}

      {isCalendarModalOpen && user?.objid && plantingData?.objid && (
        <CalendarViewModal
          closeModal={() => setIsCalendarModalOpen(false)}
          userId={user.objid}
          plantingObjId={plantingData.objid}
        />
      )}

      {isGridViewModalOpen && user?.objid && plantingData?.objid && (
        <GridViewModal
          closeModal={() => setIsGridViewModalOpen(false)}
          userId={user.objid}
          plantingObjId={plantingData.objid}
        />
      )}

      {isSoilSampleModalOpen && user?.objid && plantingData?.objid && (
        <SoilSampleModal
          userId={user.objid}
          plantingObjId={plantingData.objid}
          selectedSoilTask={selectedSoilTask}
          closeModal={closeSoilSampleModal}
          loadTasks={loadTasks}
        />
      )}
      {isListViewModalOpen && (
        <ListViewModal
          open={isListViewModalOpen}
          onClose={() => setIsListViewModalOpen(false)}
          title="List View Events"
          data={completedTasks} // Pass the completed tasks
          columns={[
            { label: "Date", field: "DOE" },
            { label: "Applied Item", field: "applied_item" },
            { label: "Applied Value", field: "applied_value" },
            { label: "Quantity", field: "quantity" },
          ]}
        />
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setSnackbarOpen(false)}
          severity="info"
          sx={{
            width: '100%',
            backgroundColor: '#a60f2d',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          Tasks and analysis available on " ☰ " menu on the map.
        </MuiAlert>
      </Snackbar>
    </div>
  );
};

export default TaskButton;
