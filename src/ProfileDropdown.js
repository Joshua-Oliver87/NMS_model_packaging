import React, { useState } from "react";
import { Menu, MenuItem, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SpaTwoToneIcon from '@mui/icons-material/SpaTwoTone';
// import AgricultureTwoToneIcon from '@mui/icons-material/AgricultureTwoTone';
import AddCircleTwoToneIcon from '@mui/icons-material/AddCircleTwoTone';
import PermIdentityTwoToneIcon from '@mui/icons-material/PermIdentityTwoTone';
import LogoutTwoToneIcon from '@mui/icons-material/LogoutTwoTone';

const ProfileDropdown = ({ onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDrawFarm = () => {
    navigate("/drawfarm");
    handleClose();
  };

  const handleMyFarms = () => {
    navigate("/myfarms");
    handleClose();
  };

  const handleProfile = () => {
    navigate("/profilesettings");
    handleClose();
  };

  return (
    <div>
      {/* Icon Button with custom color */}
      <IconButton
        aria-controls="profile-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <AccountCircleIcon sx={{ fontSize: 40, color: "#a60f2d" }} /> 
      </IconButton>

      {/* Dropdown Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {/* <MenuItem onClick={handleMyFarms}>My Farms</MenuItem>
        <MenuItem onClick={handleDrawFarm}>Add Farm</MenuItem>
        <MenuItem onClick={handleProfile}>Profile</MenuItem>
        <MenuItem onClick={onLogout}>Logout</MenuItem> */}
        {/* <MenuItem onClick={handleMyFarms}>
        <SpaTwoToneIcon sx={{ mr: 1, fontSize: 20 }} />
        My Farms
      </MenuItem> */}
      {/* <MenuItem onClick={handleDrawFarm}>
        <AddCircleTwoToneIcon sx={{ mr: 1, fontSize: 20 }} />
        Add Farm
      </MenuItem> */}
      <MenuItem onClick={handleProfile}>
        <PermIdentityTwoToneIcon sx={{ mr: 1, fontSize: 20 }} />
        Profile
      </MenuItem>
      <MenuItem onClick={onLogout}>
        <LogoutTwoToneIcon sx={{ mr: 1, fontSize: 20 }} />
        Logout
      </MenuItem>
      </Menu>
    </div>
  );
};

export default ProfileDropdown;
