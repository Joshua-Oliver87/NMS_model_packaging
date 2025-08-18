import React, { useContext, useState, useEffect } from "react";
import md5 from "md5"; // Import MD5 hashing
import { Snackbar, Alert } from "@mui/material";
import { fetchUserProfile } from "./util/apiUtil";

import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  OutlinedInput,
  InputAdornment,
  IconButton,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import HomeIcon from "@mui/icons-material/Home";
import BusinessIcon from "@mui/icons-material/Business";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import PinDropIcon from "@mui/icons-material/PinDrop";
import SettingsIcon from "@mui/icons-material/Settings";
import SecurityIcon from "@mui/icons-material/Security";
import MapIcon from "@mui/icons-material/Map";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import StarIcon from "@mui/icons-material/Star";
import { UserContext } from "./context/UserContext";
import { updateUserFavoriteUnits } from "./util/apiUtil";
import { updateUserProfile } from "./util/apiUtil";
import { verifyUserPassword } from "./util/apiUtil";
import { updateUserPassword } from "./util/apiUtil";

const ProfileSettings = () => {
  const { setFavoriteUnit, user, userSavedUnit } = useContext(UserContext);
  const [selectedTab, setSelectedTab] = useState("personalInfo");
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [defaultUnits, setDefaultUnits] = useState(userSavedUnit);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [email, setEmail] = useState(""); // State to store email
  const [username, setUsername] = useState(""); // State to store username
  const [fullname, setFullname] = useState(""); // State to store fullname
  const [organization, setOrganization] = useState(""); // State to store organization
  const [address1, setAddress1] = useState(""); // State to store Address 1
  const [address2, setAddress2] = useState(""); // State to store Address 2
  const [city, setCity] = useState(""); // State to store City
  const [zipcode, setZipcode] = useState(""); // State to store Zipcode
  const [userState, setUserState] = useState(""); // State to store user’s state
  const [currentPassword, setCurrentPassword] = useState("");
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  {
    /* State for new passwords */
  }
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(false); //  State to track password match
  {
    /* Track if the update button should be enabled */
  }
  useEffect(() => {
    setPasswordsMatch(
      newPassword === confirmNewPassword && newPassword.length > 0
    );
  }, [newPassword, confirmNewPassword]);
  const [isUpdating, setIsUpdating] = useState(false); //  Track update process

  const isUpdateButtonEnabled =
    newPassword.length > 0 && confirmNewPassword.length > 0 && passwordsMatch;
  const handleUpdatePassword = async () => {
    if (
      !user?.objid ||
      !newPassword ||
      !confirmNewPassword ||
      !passwordsMatch
    ) {
      setSnackbarMessage("Please make sure both passwords match.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    setIsUpdating(true); //  Start loading

    try {
      const hashedCurrentPassword = md5(currentPassword);
      const hashedNewPassword = md5(newPassword);

      console.log("🔹 Hashed Current Password:", hashedCurrentPassword);
      console.log("🔹 Hashed New Password:", hashedNewPassword);

      const response = await updateUserPassword(
        user.objid,
        hashedCurrentPassword,
        hashedNewPassword
      );

      console.log("🔹 API Response:", response);

      if (response.success) {
        setSnackbarMessage("Password updated successfully!");
        setSnackbarSeverity("success");
      } else {
        setSnackbarMessage(response.message || "Failed to update password.");
        setSnackbarSeverity("error");
      }
    } catch (error) {
      console.error(
        "🔴 Error updating password:",
        error.response?.data || error.message
      );
      setSnackbarMessage(
        error.response?.data?.error ||
          "Error updating password. Try again later."
      );
      setSnackbarSeverity("error");
    } finally {
      setOpenSnackbar(true);
      setIsUpdating(false); //  Stop loading
      setNewPassword("");
      setConfirmNewPassword("");
      setIsPasswordVerified(false); // Reset password verification
    }
  };

  const [, setForceUpdate] = useState(false);
  const handlePasswordCheck = async (inputPassword) => {
    if (!inputPassword || !user?.objid) {
      console.error("🔴 Missing user ID or password:", {
        userId: user?.objid,
        inputPassword,
      });
      setIsPasswordVerified(false);
      return;
    }

    try {
      const hashedPassword = md5(inputPassword); // Hash input password
      console.log("🔹 Sending hashed password to API:", {
        userId: user.objid,
        hashedPassword,
      });

      const response = await verifyUserPassword(user.objid, hashedPassword);

      console.log("🔹 API Response:", response);

      if (response.success) {
        setIsPasswordVerified(true);
      } else {
        setIsPasswordVerified(false);
        setSnackbarMessage("Incorrect current password. Please try again.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setIsPasswordVerified(false);
      setSnackbarMessage("Error verifying password. Try again later.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      console.error("🔴 Error verifying password:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.objid) {
      setSnackbarMessage("User ID not found. Please try again.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setForceUpdate((prev) => !prev); //  Forces re-render
      return;
    }

    const updatedProfile = {
      userId: user.objid,
      username,
      fullname,
      email,
      organization,
      address1,
      address2,
      city,
      zipcode,
      state: userState,
    };

    try {
      const response = await updateUserProfile(updatedProfile);
      setSnackbarMessage(response.message || "Profile updated successfully!");
      setSnackbarSeverity("success");
    } catch (error) {
      setSnackbarMessage(
        error.response?.data?.error || "Failed to update profile."
      );
      setSnackbarSeverity("error");
    } finally {
      console.log("🔵 Opening snackbar now...");
      setOpenSnackbar(true);
      setForceUpdate((prev) => !prev); //  Forces re-render
    }
  };

  const setDynamicFavoriteUnit = () => {
    updateUserFavoriteUnits(user?.objid, defaultUnits)
      .then(() => {
        setFavoriteUnit(user?.objid);
        setSnackbarMessage("Your changes have been saved successfully.");
        setSnackbarSeverity("success");
      })
      .catch(() => {
        setSnackbarMessage("Saving failed. Please try again.");
        setSnackbarSeverity("error");
      })
      .finally(() => {
        setOpenSnackbar(true);
      });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };
  useEffect(() => {
    if (user?.objid) {
      fetchUserProfile(user.objid)
        .then((profileData) => {
          console.log("Fetched Profile Data:", profileData); // Debugging
          if (profileData) {
            if (profileData.email) {
              setEmail(profileData.email);
            } else {
              console.warn("Email field is missing in API response");
            }

            if (profileData.username) {
              setUsername(profileData.username);
            } else {
              console.warn("Username field is missing in API response");
            }

            if (profileData.fullname) {
              setFullname(profileData.fullname);
            } else {
              console.warn("Fullname field is missing in API response");
            }

            if (profileData.organization) {
              setOrganization(profileData.organization);
            } else {
              console.warn("Organization field is missing in API response");
            }

            if (profileData.address1) {
              setAddress1(profileData.address1);
            } else {
              console.warn("Address 1 field is missing in API response");
            }

            if (profileData.address2) {
              setAddress2(profileData.address2);
            } else {
              console.warn("Address 2 field is missing in API response");
            }

            if (profileData.city) {
              setCity(profileData.city);
            } else {
              console.warn("City field is missing in API response");
            }

            if (profileData.zipcode) {
              setZipcode(profileData.zipcode);
            } else {
              console.warn("Zipcode field is missing in API response");
            }

            if (profileData.state) {
              setUserState(profileData.state);
            } else {
              console.warn("State field is missing in API response");
            }
          }
        })
        .catch((error) => {
          console.error("Failed to fetch user profile:", error);
        });
    }
  }, [user?.objid]);

  return (
    <Box
      sx={{
        display: "flex",
        height: "74vh",
        backgroundColor: "#f9f9f9",
        marginTop: "-52px",
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          width: "250px",
          backgroundColor: "white",
          p: 2,
          boxShadow: "2px 0px 5px rgba(0,0,0,0.1)",
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Settings
        </Typography>
        <List component="nav">
          <ListItemButton
            selected={selectedTab === "personalInfo"}
            onClick={() => setSelectedTab("personalInfo")}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Profile Information" />
          </ListItemButton>

          <ListItemButton
            selected={selectedTab === "passwordSecurity"}
            onClick={() => setSelectedTab("passwordSecurity")}
          >
            <ListItemIcon>
              <SecurityIcon />
            </ListItemIcon>
            <ListItemText primary="Password & Security" />
          </ListItemButton>

          <ListItemButton
            selected={selectedTab === "favoritesSettings"}
            onClick={() => setSelectedTab("favoritesSettings")}
          >
            <ListItemIcon>
              <StarIcon />
            </ListItemIcon>
            <ListItemText primary="Favorites Settings" />
          </ListItemButton>
        </List>
      </Box>

      {/* Content Area */}
      <Box
        sx={{
          flex: 1,
          p: 4,
          backgroundColor: "white",
          borderRadius: "10px",
          margin: "20px",
          boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        {/* 1. Profile Information Section */}
        {selectedTab === "personalInfo" && (
          <>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
              Profile Information
            </Typography>
            {/* First 6 fields: Username, Fullname, Email, Organization, Address 1, Address 2 */}
            <Grid
              container
              spacing={2}
              sx={{
                "& .MuiOutlinedInput-root": {
                  minHeight: "50px",
                  borderLeft: "2px solid #a60f2d",
                  borderRadius: 2,

                  "& .MuiOutlinedInput-input": {
                    border: "none", // Removes any inner border on the input itself
                    outline: "none", // Removes any outline on focus for the input
                    backgroundColor: "transparent", // Ensures the background is transparent
                  },
                },
              }}
            >
              {[
                {
                  label: "Username",
                  icon: <PersonIcon />,
                  value: username,
                  setter: setUsername,
                },
                {
                  label: "Fullname",
                  icon: <PersonIcon />,
                  value: fullname,
                  setter: setFullname,
                },
                {
                  label: "Email",
                  icon: <EmailIcon />,
                  value: email,
                  setter: setEmail,
                },
                {
                  label: "Organization",
                  icon: <BusinessIcon />,
                  value: organization,
                  setter: setOrganization,
                },
                {
                  label: "Address 1",
                  icon: <HomeIcon />,
                  value: address1,
                  setter: setAddress1,
                },
                {
                  label: "Address 2",
                  icon: <HomeIcon />,
                  value: address2,
                  setter: setAddress2,
                },
              ].map((field, i) => (
                <Grid item xs={6} key={i}>
                  <FormControl fullWidth>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {field.label}
                    </Typography>
                    <OutlinedInput
                      size="small"
                      startAdornment={
                        <InputAdornment position="start">
                          {field.icon}
                        </InputAdornment>
                      }
                      placeholder={field.label}
                      value={field.value} //  Fetch from state
                      onChange={(e) => field.setter(e.target.value)} //  Make editable
                      sx={{
                        height: 40,
                        borderRadius: "8px",
                        borderLeft: "2px solid #a60f2d",
                        pl: 1.5,
                      }}
                    />
                  </FormControl>
                </Grid>
              ))}
            </Grid>
            {/* City, Zipcode, and State in a single row => each xs={4} for 3 columns */}
            <Grid
              container
              spacing={2}
              sx={{
                "& .MuiOutlinedInput-root": {
                  minHeight: "50px",
                  borderLeft: "2px solid #a60f2d",
                  borderRadius: 2,

                  "& .MuiOutlinedInput-input": {
                    border: "none", // Removes any inner border on the input itself
                    outline: "none", // Removes any outline on focus for the input
                    backgroundColor: "transparent", // Ensures the background is transparent
                  },
                },
              }}
            >
              {/* City Field */}
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    City
                  </Typography>
                  <OutlinedInput
                    size="small"
                    startAdornment={
                      <InputAdornment position="start">
                        <LocationCityIcon />
                      </InputAdornment>
                    }
                    placeholder="City"
                    value={city} //  Set fetched city value
                    onChange={(e) => setCity(e.target.value)}
                    sx={{
                      height: 40,
                      borderRadius: "8px",
                      borderLeft: "2px solid #a60f2d",
                      pl: 1.5,
                    }}
                  />
                </FormControl>
              </Grid>

              {/* Zipcode Field */}
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Zipcode
                  </Typography>
                  <OutlinedInput
                    size="small"
                    startAdornment={
                      <InputAdornment position="start">
                        <PinDropIcon />
                      </InputAdornment>
                    }
                    placeholder="Zipcode"
                    value={zipcode} //  Set fetched zipcode value
                    onChange={(e) => setZipcode(e.target.value)}
                    sx={{
                      height: 40,
                      borderRadius: "8px",
                      borderLeft: "2px solid #a60f2d",
                      pl: 1.5,
                    }}
                  />
                </FormControl>
              </Grid>

              {/* State Field (Now Editable) */}
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    State
                  </Typography>
                  <OutlinedInput
                    size="small"
                    startAdornment={
                      <InputAdornment position="start">
                        <MapIcon />
                      </InputAdornment>
                    }
                    placeholder="State"
                    value={userState} //  Fetching from state variable
                    onChange={(e) => setUserState(e.target.value)} //  User can edit
                    sx={{
                      height: 40,
                      borderRadius: "8px",
                      borderLeft: "2px solid #a60f2d",
                      pl: 1.5,
                    }}
                  />
                </FormControl>
              </Grid>
            </Grid>

            {/* Save Personal Info Button */}
            <Box sx={{ mt: 3 }}>
              <Button
                fullWidth
                onClick={handleSaveProfile} // Call API on button click
                sx={{
                  backgroundColor: "#a60f2d",
                  color: "white",
                  padding: "8px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#8b0c24" },
                }}
              >
                Save Personal Info
              </Button>
            </Box>
          </>
        )}

        {/* 2. Password & Security Section */}
        {selectedTab === "passwordSecurity" && (
          <>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 4 }}>
              Password & Security
            </Typography>
            <Grid
              container
              spacing={3}
              sx={{
                // Target the MUI OutlinedInput container
                "& .MuiOutlinedInput-root": {
                  // Remove any background so the inside is transparent
                  backgroundColor: "transparent",
                },
                // Target the actual input to remove any "inner line" or background
                "& .MuiOutlinedInput-input": {
                  border: "none",
                  backgroundColor: "transparent",
                  outline: "none",
                  boxShadow: "none",
                },
                // Optionally remove the dotted outline
                "& .MuiOutlinedInput-input:focus": {
                  outline: "none",
                },
                // Remove default browser autofill styling if needed:
                "& input:-webkit-autofill": {
                  boxShadow: "0 0 0 100px transparent inset !important",
                  WebkitTextFillColor: "#000 !important",
                },
              }}
            >
              {/* Current Password */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Current Password
                  </Typography>
                  <OutlinedInput
                    type={showPassword.current ? "text" : "password"}
                    startAdornment={
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility("current")}
                          edge="end"
                        >
                          {showPassword.current ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    onBlur={() => handlePasswordCheck(currentPassword)} //  Trigger password check on blur
                    sx={{
                      height: "56px",
                      borderRadius: "8px",
                      borderLeft: `3px solid ${
                        isPasswordVerified ? "#4caf50" : "#d32f2f"
                      }`, //  Green if correct, red if incorrect
                      pl: 1.5,
                    }}
                  />
                  {/*  Show password validation message */}
                  {!isPasswordVerified && currentPassword && (
                    <Typography
                      variant="caption"
                      sx={{ color: "#d32f2f", mt: 0.5 }}
                    >
                       Incorrect password. Please try again.
                    </Typography>
                  )}
                  {isPasswordVerified && (
                    <Typography
                      variant="caption"
                      sx={{ color: "#4caf50", mt: 0.5 }}
                    >
                       Password verified.
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* New Password Field */}
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    New Password
                  </Typography>
                  <OutlinedInput
                    type={showPassword.new ? "text" : "password"}
                    startAdornment={
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility("new")}
                          edge="end"
                        >
                          {showPassword.new ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="New Password"
                    disabled={!isPasswordVerified}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    sx={{
                      height: "56px",
                      borderRadius: "8px",
                      borderLeft: isPasswordVerified
                        ? "2px solid #4caf50"
                        : "2px solid #d32f2f",
                      pl: 1.5,
                      backgroundColor: isPasswordVerified ? "white" : "#f0f0f0",
                    }}
                  />
                </FormControl>
              </Grid>

              {/* Confirm New Password Field */}
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Confirm New Password
                  </Typography>
                  <OutlinedInput
                    type={showPassword.confirm ? "text" : "password"}
                    startAdornment={
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility("confirm")}
                          edge="end"
                        >
                          {showPassword.confirm ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="Confirm New Password"
                    disabled={!isPasswordVerified}
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      setPasswordsMatch(newPassword === e.target.value);
                    }}
                    sx={{
                      height: "56px",
                      borderRadius: "8px",
                      borderLeft:
                        confirmNewPassword.length === 0
                          ? "2px solid #ccc"
                          : passwordsMatch
                          ? "2px solid #4caf50"
                          : "2px solid #d32f2f",
                      pl: 1.5,
                      backgroundColor: isPasswordVerified ? "white" : "#f0f0f0",
                    }}
                  />
                  {/*  Show validation message if passwords don’t match */}
                  {!passwordsMatch && confirmNewPassword.length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{ color: "#d32f2f", mt: 0.5 }}
                    >
                       Passwords do not match.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>
            {/* Update Password Button */}
            <Box sx={{ mt: 3 }}>
              <Button
                fullWidth
                disabled={!isUpdateButtonEnabled || isUpdating} // Disable while updating
                onClick={handleUpdatePassword} //  Call the update function
                sx={{
                  backgroundColor: isUpdateButtonEnabled ? "#a60f2d" : "#ccc",
                  color: "white",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  textTransform: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color 0.3s ease-in-out",
                  "&:hover": isUpdateButtonEnabled
                    ? { backgroundColor: "#8b0c24" }
                    : {},
                }}
              >
                {isUpdating ? "Updating..." : "Update Password"}
              </Button>
            </Box>
          </>
        )}

        {/* 3. Favorites Settings Section */}
        {selectedTab === "favoritesSettings" && (
          <>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 4 }}>
              Favorites Settings
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Default Units
                </Typography>
                <FormControl fullWidth>
                  {/* No InputLabel => single outline */}
                  <Select
                    value={defaultUnits}
                    onChange={(e) => setDefaultUnits(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <DeviceThermostatIcon fontSize="medium" />
                      </InputAdornment>
                    }
                    sx={{
                      height: "56px",
                      borderRadius: "8px",
                      borderLeft: "2px solid #a60f2d",
                      pl: 1.5,
                    }}
                  >
                    <MenuItem value="Metric">Metric (°C)</MenuItem>
                    <MenuItem value="English">English (°F)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button
                fullWidth
                sx={{
                  backgroundColor: "#a60f2d",
                  color: "white",
                  padding: "8px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#8b0c24" },
                }}
                onClick={setDynamicFavoriteUnit}
              >
                Save Favorite Settings
              </Button>
            </Box>
          </>
        )}
      </Box>
      {/* Snackbar for Success/Failure Messages */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{
            width: "100%",
            backgroundColor:
              snackbarSeverity === "success" ? "#4caf50" : "#d32f2f",
            color: "white",
            fontWeight: "bold",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfileSettings;
