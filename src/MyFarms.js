// import React, { useEffect, useState, useContext } from "react";
// import InfoPane from "./InfoPane"; // Import InfoPane for consistent layout
// import axios from "axios";
// import { UserContext } from "./context/UserContext"; // Import UserContext for logged-in user info
// import { useNavigate } from "react-router-dom";
// import { Box, Typography, Paper, Button, Radio, Select, MenuItem } from "@mui/material";

// const MyFarms = () => {
//   const [farmNames, setFarmNames] = useState([]); // State to hold farm names
//   const [selectedFarm, setSelectedFarm] = useState(null); // Ensure no default selection
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const { user } = useContext(UserContext); // Access logged-in user data
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Fetch farm names from the API
//     const fetchFarmNames = async () => {
//       if (!user?.objid) {
//         setError("User objid not found.");
//         setLoading(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/farms`, {
//           params: { user_id: user.objid },
//         });
        
//         console.log("Fetched Farms:", response.data); // Debugging
//         setFarmNames(response.data.farms); // Set the farm names
//       } catch (err) {
//         console.error("Error fetching farms:", err);
//         setError(err.response?.data?.error || "Failed to fetch farm names");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFarmNames();
//   }, [user?.objid]);

//   const handleFarmSelect = (farmObjid) => {
//     const farm = farmNames.find((f) => f.objid === farmObjid);
//     setSelectedFarm(farm); // Set the selected farm
//     console.log("Selected Farm:", farm); // Debugging
//   };

//   const handleDeleteSelected = async () => {
//     if (!selectedFarm) {
//       alert("No farm selected.");
//       return;
//     }

//     try {
//       const response = await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/deleteFarms`, {
//         data: { objid: user.objid, farms: [selectedFarm.name] },
//       });
      
//       setFarmNames((prev) => prev.filter((farm) => farm.objid !== selectedFarm.objid));
//       setSelectedFarm(null);
//       alert(response.data.message || "Farm deleted successfully!");
//     } catch (err) {
//       console.error("Error deleting farm:", err);
//       alert(err.response?.data?.error || "Failed to delete the selected farm.");
//     }
//   };

//   const handleEditSelected = () => {
//     if (!selectedFarm || !selectedFarm.objid) {
//       alert("No valid farm selected.");
//       return;
//     }
//     navigate(`/savefarm/${selectedFarm.objid}`, { state: { farm: selectedFarm } });
//   };

//   const handleAddFarm = () => {
//     navigate("/drawfarm");
//   };

//   if (loading) {
//     return (
//       <InfoPane>
//         <div style={{ textAlign: "center", padding: "20px" }}>Loading farms...</div>
//       </InfoPane>
//     );
//   }

//   if (error) {
//     return (
//       <InfoPane>
//         <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
//           Error: {error}
//         </div>
//       </InfoPane>
//     );
//   }

//   return (
//     <InfoPane>
//       <Box style={{ padding: "30px" }}>
//         <Typography variant="h4" gutterBottom>
//           My Farms
//         </Typography>

//         {/* Dropdown for Selecting Farms */}
//         {/* <Select
//           value={selectedFarm?.objid || ""}
//           onChange={(e) => handleFarmSelect(e.target.value)}
//           displayEmpty
//           fullWidth
//           style={{ marginBottom: "20px" }}
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

//         {/* Farm Display */}
//         <Box style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
//           {farmNames.map((farm) => (
//             <Box
//               key={farm.objid}
//               style={{ display: "flex", alignItems: "center", gap: "4px" }}
//             >
//               {/* Farm card */}
//               <Paper
//                 onClick={() => handleFarmSelect(farm.objid)}
//                 elevation={3}
//                 style={{
//                   width: "100px",
//                   height: "100px",
//                   display: "flex",
//                   flexDirection: "column",
//                   justifyContent: "center",
//                   alignItems: "center",
//                   cursor: "pointer",
//                   textAlign: "center",
//                   backgroundColor:
//                     selectedFarm?.objid === farm.objid ? "#f8d7da" : "#f5f5f5",
//                   border: "1px solid #ddd",
//                 }}
//               >
//                 <Typography variant="h6" style={{ color: "crimson" }}>
//                   {farm.name}
//                 </Typography>
//               </Paper>
//             </Box>
//           ))}

//           {/* Add Farm Button */}
//           {/* <Button
//             variant="contained"
//             sx={{
//               backgroundColor: "crimson",
//               color: "white",
//               "&:hover": { backgroundColor: "darkred" },
//             }}
//             onClick={handleAddFarm}
//           >
//             Add Farm
//           </Button> */}
//         </Box>

//         {/* Edit and Delete Buttons */}
//         {selectedFarm && (
//           <Box mt={2} style={{ display: "flex", gap: "10px" }}>
//             <Button variant="contained" color="error" onClick={handleEditSelected}>
//               Edit Farm
//             </Button>
//             <Button variant="contained" color="error" onClick={handleDeleteSelected}>
//               Delete Farm
//             </Button>
//           </Box>
//         )}
//       </Box>
//     </InfoPane>
//   );
// };

// export default MyFarms;
