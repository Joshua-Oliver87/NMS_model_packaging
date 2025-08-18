import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  useTheme, // Import useTheme to access the theme object
} from "@mui/material";
import { styled } from "@mui/system";
import axios from "axios";
import { UserContext } from "./context/UserContext";
import farmlandImage from "./assets/Weather_Station.png";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { InputAdornment, IconButton } from "@mui/material";
import WSULogo from "./assets/WSU1.png";
import ForgotUsernameModal from "./components/ForgotUsernameModal";
import ForgotPasswordModal from "./components/ForgotPasswordModal";
import { validateUserSession } from "./util/apiUtil";


// StyledCard remains unchanged but with added responsiveness
const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 400,
  width: "80%", // Default width for larger screens (matches original)
  borderRadius: 10,
  padding: "25px", // Keep original padding
  boxShadow: "5px 5px 10px rgba(10, 7, 7, 0.1)",
  backgroundColor: "#fff",
  [theme.breakpoints.down("sm")]: {
    // For small screens (e.g., mobile, <600px)
    width: "80%", // Maintain the same width percentage but adjust for smaller screens
    padding: "25px", // Keep original padding to preserve view
    maxWidth: 350, // Ensure the card doesn’t grow too large on smaller screens
  },
  [theme.breakpoints.down("xs")]: {
    // For extra small screens (e.g., <480px)
    width: "80%", // Keep the same width percentage for consistency
    padding: "25px", // Preserve original padding
    maxWidth: 300, // Slightly reduce maxWidth on very small screens while keeping design
  },
}));

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isDisclaimerChecked, setIsDisclaimerChecked] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotUsernameModal, setShowForgotUsernameModal] = useState(false);
  const { login } = useContext(UserContext);
  const navigate = useNavigate();
  const theme = useTheme(); // Use the useTheme hook to access the theme object
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSignIn = async () => {
    if (username.trim() && password.trim()) {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/api/login`,
          { username, password },
          { withCredentials: true }
        );

        if (response.status === 200) {
          await login(response.data.user);

          // Store username and password in localStorage if "Remember Me" is checked
          if (rememberMe) {
            localStorage.setItem("rememberMe", "true");
            localStorage.setItem("username", username);
            localStorage.setItem("password", password); // Storing password (Consider encrypting for security)
          } else {
            localStorage.removeItem("rememberMe");
            localStorage.removeItem("username");
            localStorage.removeItem("password");
          }

          navigate("/maincontent");
        }
      } catch (error) {
        let errorMessage = "An error occurred. Please try again.";

        if (error.response) {
          switch (error.response.status) {
            case 404:
              errorMessage = "Username does not exist.";
              break;
            case 401:
              errorMessage = "Password does not match.";
              break;
            default:
              errorMessage =
                "Error: " + (error.response.data?.error || "Unknown error.");
              break;
          }
        } else if (error.request) {
          errorMessage =
            "No response from the server. Check your network connection.";
        } else {
          errorMessage = "An error occurred: " + error.message;
        }

        alert(errorMessage);
      }
    } else {
      alert("Please enter both username and password.");
    }
  };


  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };
  const handleDisclaimerChange = () => {
    setIsDisclaimerChecked(true);
    localStorage.setItem("disclaimerAccepted", "true");
  };
  const handleSignUp = () => {
    navigate("/signup"); // Navigate to the signup page
  };


  useEffect(() => {
    const storedDisclaimer = localStorage.getItem("disclaimerAccepted");
    if (storedDisclaimer === "true") {
      setIsDisclaimerChecked(true);
    }
    const storedRememberMe = localStorage.getItem("rememberMe") === "true";
    if (storedRememberMe) {
      setRememberMe(true);
      setUsername(localStorage.getItem("username") || "");
      setPassword(localStorage.getItem("password") || ""); // Retrieve saved password
    }
  }, []);

  // Validate user session on component mount
  useEffect(() => {
    async function validateSession() {
      const cookies = document.cookie.split("; ");
      const userid = cookies.find((row) => row.startsWith("awncookid="));
      const username = cookies.find((row) => row.startsWith("awncookname="));
      if (userid && username) {
        const userData = {
          userid: userid.split("=")[1],
          username: username.split("=")[1]
        };
        const response = await validateUserSession(userData);
        if (response) {
          await login(response);
          navigate("/maincontent");
        } else {
          console.log("User session invalid or expired.");
        }
      }
    }
    validateSession();
  }, [login, navigate]); // ✅ Added dependencies
  
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: `url(${farmlandImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        marginTop: "-10%", // Keep original margin
        marginBottom: "-6%", // Keep original margin
        position: "relative",
        [theme.breakpoints.down("sm")]: {
          // Adjust background on small screens to maintain view
          backgroundSize: "cover", // Keep the original cover behavior
          marginTop: "-15%", // Preserve original margin
          marginBottom: "-3%", // Preserve original margin
        },
        [theme.breakpoints.down("xs")]: {
          // Ensure background fits on very small screens while maintaining view
          backgroundSize: "cover", // Keep the original cover behavior
          marginTop: "-9%", // Preserve original margin
          marginBottom: "-3%", // Preserve original margin
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh", // Full viewport height for centering
          width: "130%", // Full width for responsiveness
          padding: 2, // Keep original padding
          zIndex: 2,
          [theme.breakpoints.down("sm")]: {
            padding: 2, // Maintain original padding on smaller screens
            width: "90%",
          },
          [theme.breakpoints.down("xs")]: {
            padding: 1, // Slightly reduce padding on very small screens if needed, but keep design intact
          },
        }}
      >
        <StyledCard sx={{ maxWidth: 350 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              marginBottom: 2,
              color: "#000",
              textAlign: "center",
            }}
          >
            Welcome
          </Typography>

          {/* USERNAME FIELD */}
          <form
            onSubmit={(e) => {
              e.preventDefault(); // Prevent page refresh
              handleSignIn(); // Call login function
            }}
          >
            <Box sx={{ marginBottom: 2 }}>
              <Typography sx={{ fontWeight: 500, color: "#000", mb: 1 }}>
                Username
              </Typography>
              <TextField
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    minHeight: "50px",
                    borderLeft: "2px solid #a60f2d",
                    borderRadius: 2,

                    "&.Mui-focused fieldset": {
                      borderColor: "#aaa",
                    },
                    "& .MuiOutlinedInput-input": {
                      border: "none",
                      outline: "none",
                      backgroundColor: "transparent",
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* PASSWORD FIELD */}
            <Box sx={{ marginBottom: 2 }}>
              <Typography sx={{ fontWeight: 500, color: "#000", mb: 1 }}>
                Password
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    minHeight: "50px",
                    borderLeft: "2px solid #a60f2d",
                    borderRadius: 2,

                    "&.Mui-focused fieldset": {
                      borderColor: "#aaa",
                    },
                    "& .MuiOutlinedInput-input": {
                      border: "none",
                      outline: "none",
                      backgroundColor: "transparent",
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePassword} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* "Remember Me" Checkbox */}
            <Box display="flex" alignItems="center" sx={{ marginBottom: 1 }}>
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <Typography sx={{ fontWeight: 400, color: "#000" }}>
                Remember Me
              </Typography>

            </Box>

            {/* Disclaimer Checkbox & link */}
            <Box
              display="flex"
              justifyContent="center"
              sx={{ marginBottom: 1, marginTop: 2 }} // Adjust spacing
            >
              <Typography
                sx={{
                  fontWeight: 400,
                  color: "#000",
                  fontSize: "12px", // Small text
                  textAlign: "center", // Center align
                }}
              >
                By clicking Login, I agree to the{" "}
                <span
                  style={{
                    color: "blue",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  onClick={() => setIsDisclaimerOpen(true)}
                >
                  Disclaimer
                </span>
              </Typography>
            </Box>


            {/* Login button */}
            <Button
              type="submit" //  Pressing Enter will trigger the login
              variant="contained"
              sx={{
                backgroundColor: "#a60f2d",
                color: "white",
                padding: "10px",
                borderRadius: "5px",
                fontSize: "15px",
                fontWeight: 600,
                width: "100%",
                marginTop: 2,
              }}
            // disabled={!isDisclaimerChecked}
            >
              Login
            </Button>
          </form>

          {/* Forgot username/password */}
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography
              component="a"
              onClick={() => setShowForgotUsernameModal(true)}
              sx={{
                color: "#a60f2d",
                textDecoration: "none",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Forgot my username
            </Typography>

            <Typography
              component="a"
              onClick={() => setShowForgotPasswordModal(true)}
              sx={{
                color: "#a60f2d",
                textDecoration: "none",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Forgot my password
            </Typography>

          </Box>

          {/* Not a Member? Register */}
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography sx={{ fontSize: 14 }}>Not a Member?</Typography>
            <Typography
              component="a"
              onClick={handleSignUp}
              sx={{
                color: "#a60f2d",
                textDecoration: "none",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Register
            </Typography>
          </Box>
        </StyledCard>
      </Box>
      {/* Forgot Username Modal */}
      {showForgotUsernameModal && (
        <ForgotUsernameModal onClose={() => setShowForgotUsernameModal(false)} />
      )}
      {showForgotPasswordModal && (
        <ForgotPasswordModal onClose={() => setShowForgotPasswordModal(false)} />
      )}

      {/* Disclaimer Dialog */}
      <Dialog
        open={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
        maxWidth="sm" // Keep dialog responsive but preserve design
        fullWidth // Ensure dialog fits on smaller screens
      >
        <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
          Disclaimer
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body1"
            sx={{
              fontSize: "16px", // Keep original font size
              color: "#333",
              textAlign: "justify",
              padding: "10px",
            }}
          >
            I agree to share my data with the Washington State Department of
            Agriculture (WSDA) and my local conservation district (required to
            qualify for a free soil sample). My data will be used to connect me
            to technical and financial assistance. WSDA will aggregate and
            anonymize data from all participants in public reports and will not
            share data in a way that makes individuals identifiable. However,
            data may be subject to release as required by the Washington State
            Public Records Act (RCW 42.56).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsDisclaimerOpen(false)}
            variant="contained"
            sx={{
              backgroundColor: "#6c757d",
              color: "white",
              width: "20%", // Keep original width
              margin: "auto",
              bottom: "0.5rem",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginPage;
