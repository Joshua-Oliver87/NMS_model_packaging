import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "./context/UserContext";
import { FarmsContext } from "./context/FarmsContext";
import ProfileDropdown from "./ProfileDropdown";
import { Menu, MenuItem, Button, IconButton } from "@mui/material";
import SpaTwoToneIcon from "@mui/icons-material/SpaTwoTone";
// import AgricultureOutlinedIcon from "@mui/icons-material/AgricultureOutlined";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();
  const { isLoggedIn, user, logout } = useContext(UserContext);
  const { farms, selectedFarm, setSelectedFarm, fetchFarms } =
    useContext(FarmsContext); // Get logged-in user data dynamically
  const [showFarmsDropdown, setShowFarmsDropdown] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (user?.objid) {
      fetchFarms(user.objid);
    }
  }, [user?.objid]);

  useEffect(() => {
    if (location.pathname === "/login") {
      setShowFarmsDropdown(false);
    } else {
      setShowFarmsDropdown(true);
    }
  }, [location]);
  

  const handleProfile = () => {
    navigate("/profilesettings");
  };

  const handleFarmSelect = (farmObjid) => {
    const farm = farms.find((f) => f.objid === farmObjid);
    if (farm) {
      setSelectedFarm(farm); // Set the selected farm
      console.log("Selected Farm:", farm); // Debugging
  
      // Navigate to the main content or farm-specific page after selection
      navigate(`/maincontent?farm=${farm.objid}`);
    }
  };
  

  const [anchorEl, setAnchorEl] = useState(null); //  State for the dropdown menu
  const open = Boolean(anchorEl); //  Checks if menu is open

  //  Automatically close dropdown when a farm is selected and loaded
  useEffect(() => {
    if (selectedFarm) {
      setAnchorEl(null); // Close the dropdown
    }
  }, [selectedFarm]); //  Runs when selectedFarm changes

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <header
      className="wsu-header-unit wsu-color-scheme--light"
      style={{ position: "sticky", top: 0, zIndex: 1000 }}
    >
      <div className="wsu-header-unit__inner">
        <div className="wsu-header-unit__banner">
          <div className="wsu-logo-lockup wsu-logo-lockup--style-unit">
            <a className="wsu-logo-lockup__icon-wrapper">
              {/* SVG Logo */}
              <svg
                role="img"
                aria-labelledby="wsu-coug-head__title"
                className="wsu-coug-head"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 70.2 69.6"
              >
                <title id="wsu-coug-head__title">
                  Washington State University
                </title>
                <path
                  className="st0"
                  d="m42.8 69.6s3.6-1.5 5.5-7.4c1 2.3 1.5 4.8 1.3 7.3-2.3 0.1-4.5 0.2-6.8 0.1zm14.9-11.8c-10.4 1.4-12.2-20.3-12.2-20.3s3.5 11.1 10.9 10.7c7.7-0.4 5.5-12.2 5.5-12.2s7.5 20.2-4.2 21.8zm-47.7-5c-3.3 1-6.6 1.8-10 2.4 0 0 5.9-4.5 10.3-18.3l4.3 3.9-0.8 2.6c1.1 1.5 1.9 3.1 2.5 4.9 1.6-3.6 1.5-7.7-0.3-11.2l-0.5 1.6-1.7-1.5-2.8-2.7c1.2-3.6 3-7 5.3-10.1l0.4 0.4 3.3 3.8-1 1.7c1.5 1.7 2.9 3.4 4.2 5.3 0.6-3.4 0.4-6.8-0.4-10.1l-1.5 1.4-3.6-4.2c4.5-4.7 10-8.2 16.2-10.3-0.4 0.4-0.7 0.8-1 1.3-2 2.9-4.1 8.1-2.4 16.4 0.3 1.3 0.7 3.2 1.1 5.1 0.9 3.8 1.9 8.2 2.2 10.9 0.7 5.7 0.1 9.4-1.8 11.4-1.3 1.4-3.5 2-6.4 1.9v-1.4c0-2.4-0.3-4.8-0.8-7.2l-0.8-2.7-1.2 2.6c-1.9 4.1-8.6 14.1-17.2 16.1 2.6-4.2 4.1-9 4.4-14zm25.4 16.4h-0.5-0.1-0.3c-0.5 0-0.8-0.1-1.2-0.1-0.7-0.1-1.6-0.2-2.6-0.4-6.4-1.1-12.9-1.7-19.4-2 6.2-3.6 10.4-9.9 12-12.5 0.2 1.3 0.3 2.5 0.3 3.8 0 0.8 0 1.6-0.1 2.2l-0.1 1.1 1.1 0.1c0.7 0.1 1.3 0.1 1.9 0.1 3.3 0 5.7-0.8 7.3-2.5 2.4-2.5 3.1-6.7 2.3-13.1-0.4-2.9-1.4-7.4-2.3-11.1-0.5-2-0.9-3.8-1.1-5-1.5-7.6 0.3-12.3 2.1-14.8 1.3-1.9 3.2-3.4 5.5-4.2h0.1l3.3-10.8h1.1l-2.3 10.3c0.7-0.1 1.2-0.2 1.7-0.3l3-9.5h1.1l-2 9.2c2.9-0.4 6.1-0.7 10.3-1 0.8 0.4 1.4 1.1 1.8 1.9l9.8-3 0.4 1.1-9.5 3.7c0.1 0.2 0.2 0.4 0.2 0.6l10.3-1.3 0.2 1.1-10 2c0 0.2 0.1 0.4 0.1 0.6l10.4 0.3v1.1l-10.2 0.4c0 1.2-0.2 2.4-0.5 3.6 0.6 2.1 0.7 4.3 0.3 6.5-1.7-3.9-3-5.1-3-5.1-1.4-0.7-2.9-1-4.5-1-2.5 0-4.8 1.1-6.4 2.9-2.3 2.6-3.5 6-3.3 9.5 0.2 2.4 0.7 5.1 1.4 8.6 0.7 3.6 1.6 8.1 2.3 13.5 0.6 4.1-0.1 7.3-1.8 9.7-1.6 2.1-4 3.4-6.5 3.8h-0.1-0.2-0.1-2.2zm10.4-51.5c-2.1-0.1-4.2 0.4-6 1.3-1.5 1-2.5 2.7-2.6 4.5-0.1 0.6-0.1 1.2 0 1.8 0.8-1.5 2-2.8 3.3-3.9 2.4-1.5 5.1-2.3 7.9-2.4h0.9 0.3c0.4 0 0.7-0.1 0.8-0.2 0-0.1-0.1-0.3-0.4-0.4-1.3-0.5-2.7-0.8-4.2-0.7z"
                ></path>
              </svg>
            </a>
            <a
              className="wsu-logo-lockup__title-wrapper"
              href={
                isLoggedIn
                  ? `${process.env.REACT_APP_API_BASE_URL}/maincontent`
                  : "#"
              }
              // href={
              //   isLoggedIn
              //     ? "http://localhost:3000/maincontent" : `${process.env.REACT_APP_API_BASE_URL}/maincontent`
              // }
              onClick={(e) => {
                if (!isLoggedIn) {
                  e.preventDefault(); // Prevent navigation if not logged in
                  alert(
                    "You must be logged in to access the Nutrient Management System."
                  );
                }
              }}
            >
              <span className="wsu-logo-lockup__subtitle">
                Welcome to AgWeatherNet
              </span>
              <span className="wsu-logo-lockup__title">
                Nutrient Management System
              </span>
            </a>
          </div>
          {/* Farm Selection Button with Icon */}
          {isLoggedIn &&
            user &&
            showFarmsDropdown &&
            location.pathname !== "/login" &&
            location.pathname !== "/" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginRight: "20px",
                }}
              >
                <Button
                  onClick={handleClick}
                  variant="contained"
                  sx={{
                    backgroundColor: "#a60f2d",
                    color: "white",
                    fontWeight: "bold",
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#870d24" },
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    top: "6px",
                    height: "30px",
                    width: "100%",
                    padding: "8px 16px",
                  }}
                >
                  <SpaTwoToneIcon sx={{ fontSize: 24, color: "white" }} />
                  {selectedFarm?.name || "Select a Farm"}
                </Button>

                {/* Dropdown Menu for Farm Selection */}
                <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                  {farms.length > 0 ? (
                    farms.map((farm) => (
                      <MenuItem
                        key={farm.objid}
                        onClick={() => handleFarmSelect(farm.objid)}
                      >
                        {farm.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No Farms Available</MenuItem>
                  )}
                  {/* Add Farm Option */}
                  {/* Add Farm Option */}
                  <MenuItem
                    key="add_farm"
                    onClick={() => {
                      handleClose(); // Close dropdown
                      navigate("/drawfarm"); // Navigate to DrawFarm.js component
                    }}
                    style={{ fontWeight: "bold", color: "#a60f2d" }}
                  >
                    ➕ Add Farm
                  </MenuItem>
                </Menu>
              </div>
            )}

          {/* Profile Dropdown */}
          {isLoggedIn &&
            user &&
            location.pathname !== "/login" &&(
           
              <div style={{ position: "absolute", right: "20px", top: "40px" }}>
                <ProfileDropdown
                  username={user.username}
                  onLogout={logout}
                  onProfile={handleProfile}
                />
              </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
