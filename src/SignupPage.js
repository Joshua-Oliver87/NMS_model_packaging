import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Link,
  Card,
  IconButton,
  InputAdornment,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { styled } from "@mui/system";
import { useTheme } from "@mui/material/styles";
import DynamicButton from "./DynamicButton";
import WSULogo from "./assets/WSU1.png";
import { registerUser } from "./util/apiUtil";

import md5 from "md5"; // Ensure MD5 hashing is available

// ICONS
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  Apartment as ApartmentIcon,
  LocationCity as LocationCityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon, // For toggling password visibility
  LocalPostOffice as LocalPostOfficeIcon,
} from "@mui/icons-material";
import PublicIcon from "@mui/icons-material/Public"; // For Country
import MapIcon from "@mui/icons-material/Map"; // For State

import registerImage from "./assets/register.jpg";

// Prebuilt list of countries
const countryOptions = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "IN", label: "India" },
  { value: "AU", label: "Australia" },
  { value: "GB", label: "United Kingdom" },
  { value: "WA", label: "Washington" },
];

// State options for each country
const stateOptions = {
  US: [
    { value: "AL", label: "Alabama" },
    { value: "AK", label: "Alaska" },
    { value: "AZ", label: "Arizona" },
    { value: "AR", label: "Arkansas" },
    { value: "CA", label: "California" },
    { value: "CO", label: "Colorado" },
    { value: "CT", label: "Connecticut" },
    { value: "DE", label: "Delaware" },
    { value: "FL", label: "Florida" },
    { value: "GA", label: "Georgia" },
    { value: "HI", label: "Hawaii" },
    { value: "ID", label: "Idaho" },
    { value: "IL", label: "Illinois" },
    { value: "IN", label: "Indiana" },
    { value: "IA", label: "Iowa" },
    { value: "KS", label: "Kansas" },
    { value: "KY", label: "Kentucky" },
    { value: "LA", label: "Louisiana" },
    { value: "ME", label: "Maine" },
    { value: "MD", label: "Maryland" },
    { value: "MA", label: "Massachusetts" },
    { value: "MI", label: "Michigan" },
    { value: "MN", label: "Minnesota" },
    { value: "MS", label: "Mississippi" },
    { value: "MO", label: "Missouri" },
    { value: "MT", label: "Montana" },
    { value: "NE", label: "Nebraska" },
    { value: "NV", label: "Nevada" },
    { value: "NH", label: "New Hampshire" },
    { value: "NJ", label: "New Jersey" },
    { value: "NM", label: "New Mexico" },
    { value: "NY", label: "New York" },
    { value: "NC", label: "North Carolina" },
    { value: "ND", label: "North Dakota" },
    { value: "OH", label: "Ohio" },
    { value: "OK", label: "Oklahoma" },
    { value: "OR", label: "Oregon" },
    { value: "PA", label: "Pennsylvania" },
    { value: "RI", label: "Rhode Island" },
    { value: "SC", label: "South Carolina" },
    { value: "SD", label: "South Dakota" },
    { value: "TN", label: "Tennessee" },
    { value: "TX", label: "Texas" },
    { value: "UT", label: "Utah" },
    { value: "VT", label: "Vermont" },
    { value: "VA", label: "Virginia" },
    { value: "WA", label: "Washington" },
    { value: "WV", label: "West Virginia" },
    { value: "WI", label: "Wisconsin" },
    { value: "WY", label: "Wyoming" },
  ],
  CA: [
    { value: "AB", label: "Alberta" },
    { value: "BC", label: "British Columbia" },
    { value: "MB", label: "Manitoba" },
    { value: "NB", label: "New Brunswick" },
    { value: "NL", label: "Newfoundland and Labrador" },
    { value: "NT", label: "Northwest Territories" },
    { value: "NS", label: "Nova Scotia" },
    { value: "NU", label: "Nunavut" },
    { value: "ON", label: "Ontario" },
    { value: "PE", label: "Prince Edward Island" },
    { value: "QC", label: "Quebec" },
    { value: "SK", label: "Saskatchewan" },
    { value: "YT", label: "Yukon" },
  ],
  IN: [
    { value: "AP", label: "Andhra Pradesh" },
    { value: "AR", label: "Arunachal Pradesh" },
    { value: "AS", label: "Assam" },
    { value: "BR", label: "Bihar" },
    { value: "CT", label: "Chhattisgarh" },
    { value: "GA", label: "Goa" },
    { value: "GJ", label: "Gujarat" },
    { value: "HR", label: "Haryana" },
    { value: "HP", label: "Himachal Pradesh" },
    { value: "JK", label: "Jammu and Kashmir" },
    { value: "JH", label: "Jharkhand" },
    { value: "KA", label: "Karnataka" },
    { value: "KL", label: "Kerala" },
    { value: "MP", label: "Madhya Pradesh" },
    { value: "MH", label: "Maharashtra" },
    { value: "MN", label: "Manipur" },
    { value: "ML", label: "Meghalaya" },
    { value: "MZ", label: "Mizoram" },
    { value: "NL", label: "Nagaland" },
    { value: "OR", label: "Odisha" },
    { value: "PB", label: "Punjab" },
    { value: "RJ", label: "Rajasthan" },
    { value: "SK", label: "Sikkim" },
    { value: "TN", label: "Tamil Nadu" },
    { value: "TG", label: "Telangana" },
    { value: "TR", label: "Tripura" },
    { value: "UP", label: "Uttar Pradesh" },
    { value: "UT", label: "Uttarakhand" },
    { value: "WB", label: "West Bengal" },
    // Union Territories
    { value: "AN", label: "Andaman and Nicobar Islands" },
    { value: "CH", label: "Chandigarh" },
    { value: "DN", label: "Dadra and Nagar Haveli and Daman and Diu" },
    { value: "DL", label: "Delhi" },
    { value: "LD", label: "Lakshadweep" },
    { value: "PY", label: "Puducherry" },
    { value: "LA", label: "Ladakh" },
  ],
  AU: [
    { value: "NSW", label: "New South Wales" },
    { value: "VIC", label: "Victoria" },
    { value: "QLD", label: "Queensland" },
    { value: "WA", label: "Western Australia" },
    { value: "SA", label: "South Australia" },
    { value: "TAS", label: "Tasmania" },
    // Territories
    { value: "ACT", label: "Australian Capital Territory" },
    { value: "NT", label: "Northern Territory" },
  ],
  GB: [
    { value: "ENG", label: "England" },
    { value: "SCO", label: "Scotland" },
    { value: "WLS", label: "Wales" },
    { value: "NIR", label: "Northern Ireland" },
  ],
};

const FormContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  width: "100%",
}));

// Reusable labeled TextField with left border & optional end icon
const LabeledField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  icon,
  endIcon = null,
  sx = {},
}) => (
  <Box sx={{ mb: 0.5 }}>
    <Typography sx={{ fontWeight: 500, color: "#000", mb: 0.5 }}>
      {label}
    </Typography>
    <TextField
      fullWidth
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      sx={{
        "& .MuiOutlinedInput-root": {
          minHeight: "50px",
          borderLeft: "2px solid #a60f2d", // Red left border
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
        ...sx,
      }}
      InputProps={{
        startAdornment: icon && (
          <InputAdornment position="start">{icon}</InputAdornment>
        ),
        endAdornment: endIcon,
      }}
    />
  </Box>
);

// LabeledSelect for Country/State with the same left border & icon inside
const LabeledSelect = ({
  label,
  icon,
  value,
  onChange,
  options,
  placeholder,
  disabledIndicator = false,
}) => (
  <Box sx={{ mb: 0.5 }}>
    <Typography sx={{ fontWeight: 500, color: "#000", mb: 0.5 }}>
      {label}
    </Typography>
    <TextField
      fullWidth
      select
      value={value ? value.value : ""}
      onChange={(e) =>
        onChange(options.find((option) => option.value === e.target.value))
      }
      placeholder={placeholder}
      sx={{
        "& .MuiOutlinedInput-root": {
          minHeight: "50px",
          borderLeft: "2px solid #a60f2d", // Red left border
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
        startAdornment: icon && (
          <InputAdornment position="start">{icon}</InputAdornment>
        ),
      }}
      disabled={disabledIndicator}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  </Box>
);

const SignupPage = () => {
  // State variables
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  // Password states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Eye icon toggles for password fields
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // More states
  const [fullName, setFullName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [apt, setApt] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState(null);
  const [state, setState] = useState(null);
  const [zipcode, setZipcode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const navigate = useNavigate();
  const theme = useTheme();

  // Toggle password visibility
  const handleTogglePassword = () => setShowPassword((prev) => !prev);
  const handleToggleConfirmPassword = () =>
    setShowConfirmPassword((prev) => !prev);

  const handleSignup = async () => {
    if (!termsAccepted || !privacyAccepted) {
      setPopupMessage("You must accept the Terms of Service and Privacy Policy.");
      setPopupOpen(true);
      return;
    }
    if (email !== confirmEmail) {
      setPopupMessage("Emails do not match. Please try again.");
      setPopupOpen(true);
      return;
    }
    if (password !== confirmPassword) {
      setPopupMessage("Passwords do not match. Please try again.");
      setPopupOpen(true);
      return;
    }
  
    // Prepare user data for API call
    const userData = {
      username,
      fullName,
      email,
      password, // MD5 will be applied in API function
      organisation,
      address1:streetAddress,
      address2:apt,
      city,
      state: state?.value || "",
      country: country?.value || "",
      zipcode,
    };
  
    try {
      const response = await registerUser(userData);
      
      if (response.success) {
        setPopupMessage("Signup successful! Redirecting...");
        setPopupOpen(true);
        setTimeout(() => navigate("/"), 2000); // Redirect to login page after success
      } else {
        setPopupMessage(response.message || "Signup failed. Please try again.");
        setPopupOpen(true);
      }
    } catch (error) {
      console.error("Signup Error:", error);
      setPopupMessage(
        error.response?.data?.message || "An error occurred during signup."
      );
      setPopupOpen(true);
    }
  };
  
  // Popups
  const handleClosePopup = () => setPopupOpen(false);
  const handleOpenDisclaimer = () => setDisclaimerOpen(true);
  const handleCloseDisclaimer = () => setDisclaimerOpen(false);

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 3,
        marginTop: "-60px",
      }}
    >
      {/* Main Card Container */}
      <Card
        sx={{
          display: "flex",
          width: { xs: "90%", sm: "85%", md: "70%", lg: "60%" },
          maxWidth: "1000px",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 0 6px 6px rgba(0, 0, 0, 0.1)",
          mx: "auto",
        }}
      >
        {/* LEFT SIDE: Form */}
        <Box sx={{ flex: 0.65, backgroundColor: "#fff", p: 3 }}>
          <DynamicButton currentPage="signup" />
          <FormContainer>
            {/* Title */}
            <Box sx={{ textAlign: "center", mb: 0.5 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "#000", mb: 0.5 }}
              >
                Welcome
              </Typography>
              <Typography variant="subtitle1" sx={{ color: "#666", mb: 0 }}>
                Please fill out the details below to create your account.
              </Typography>
            </Box>

            {/* USERNAME */}
            <LabeledField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 0 }}
              icon={<PersonIcon />}
            />

            {/* PASSWORD & CONFIRM PASSWORD */}
            <Box sx={{ display: "flex", gap: 2, mb: 0 }}>
              <Box sx={{ flex: 1 }}>
                <LabeledField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<LockIcon />}
                  endIcon={
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePassword}>
                        {showPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <LabeledField
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<LockIcon />}
                  endIcon={
                    <InputAdornment position="end">
                      <IconButton onClick={handleToggleConfirmPassword}>
                        {showConfirmPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </Box>
            </Box>

            {/* EMAIL & CONFIRM EMAIL */}
            <Box sx={{ display: "flex", gap: 2, mb: 0 }}>
              <Box sx={{ flex: 1 }}>
                <LabeledField
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<EmailIcon />}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <LabeledField
                  label="Confirm Email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  icon={<EmailIcon />}
                />
              </Box>
            </Box>

            {/* Personal Info Title */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#000",
                textAlign: "center",
                mb: -1,
                mt: 0.5,
              }}
            >
              Personal Information
            </Typography>

            {/* FULL NAME */}
            <LabeledField
              label="Fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              sx={{ mb: 0 }}
              icon={<PersonIcon />}
            />

            {/* ORGANIZATION */}
            <LabeledField
              label="Organization"
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              sx={{ mb: 0.5 }}
              icon={<BusinessIcon />}
            />

            {/* STREET ADDRESS & APT */}
            <Box sx={{ display: "flex", gap: 2, mb: 0.5 }}>
              <Box sx={{ flex: 1 }}>
                <LabeledField
                  label="Street Address"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  icon={<LocationOnIcon />}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <LabeledField
                  label="Apt or Suite"
                  value={apt}
                  onChange={(e) => setApt(e.target.value)}
                  icon={<ApartmentIcon />}
                />
              </Box>
            </Box>

            {/* CITY & COUNTRY */}
            <Box sx={{ display: "flex", gap: 2, mb: 0.5 }}>
              <Box sx={{ flex: 1 }}>
                <LabeledField
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  icon={<LocationCityIcon />}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <LabeledSelect
                  label="Country"
                  icon={<PublicIcon />}
                  value={country}
                  onChange={(selectedOption) => {
                    setCountry(selectedOption);
                    setState(null);
                  }}
                  options={countryOptions}
                  placeholder="Select Country"
                />
              </Box>
            </Box>

            {/* STATE & ZIPCODE */}
            <Box sx={{ display: "flex", gap: 2, mb: 0.5 }}>
              <Box sx={{ flex: 1 }}>
                <LabeledSelect
                  label="State"
                  icon={<MapIcon />}
                  value={state}
                  onChange={(selectedOption) => setState(selectedOption)}
                  options={country ? stateOptions[country.value] || [] : []}
                  placeholder="Select State"
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <LabeledField
                  label="Zipcode"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  icon={<LocalPostOfficeIcon />}
                />
              </Box>
            </Box>

            {/* TERMS & PRIVACY */}
            <Box sx={{ textAlign: "center", mt: 0.5, mb: -1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    sx={{
                      color: "crimson",
                      "&.Mui-checked": { color: "crimson" },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: "#333" }}>
                    I understand the{" "}
                    <Link
                      onClick={handleOpenDisclaimer}
                      sx={{
                        color: "crimson",
                        cursor: "pointer",
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      disclaimer
                    </Link>{" "}
                    and agree to the{" "}
                    <Link
                      href="#"
                      sx={{
                        color: "crimson",
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      terms of service
                    </Link>{" "}
                    as stated.
                  </Typography>
                }
              />
            </Box>

            <Box sx={{ textAlign: "center", mt: 0, mb: 0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    sx={{
                      color: "crimson",
                      "&.Mui-checked": { color: "crimson" },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: "#333" }}>
                    I accept the Privacy Policy
                  </Typography>
                }
              />
            </Box>

            {/* SIGN UP BUTTON */}
            <Box sx={{ textAlign: "center", mt: 0.5 }}>
              <Button
                variant="contained"
                color="error"
                sx={{
                  width: "100%",
                  maxWidth: "300px",
                  height: "40px",
                  fontWeight: "bold",
                  textTransform: "none",
                  borderRadius: 2,
                  backgroundColor: "#a60f2d",
                  "&:hover": { backgroundColor: "#8f0d28" },
                }}
                onClick={handleSignup}
              >
                Sign Up
              </Button>

              <Box sx={{ mt: 0.5 }}>
                <Typography variant="body2" sx={{ color: "#333" }}>
                  Already registered?{" "}
                  <Link
                    href="/"
                    sx={{
                      color: "#a60f2d",
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Sign In
                  </Link>
                </Typography>
              </Box>
            </Box>
          </FormContainer>
        </Box>

        {/* RIGHT SIDE: Background Image */}
        <Box
          sx={{
            flex: { xs: 0.4, md: 0.35 },
            backgroundImage: `url(${registerImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-end",
            p: 1,
            position: "relative",
          }}
        >
          {/* Logo and Text Container */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              p: 0.5,
              borderRadius: 1,
            }}
          >
            <img
              src={WSULogo}
              alt="WSU Logo"
              style={{ width: 70, height: "auto" }}
            />
            <Box
              sx={{
                height: 50,
                borderLeft: "2px solid #fff",
                mx: 0.5,
                [theme.breakpoints.down("sm")]: {
                  height: 40,
                  mx: 0.5,
                },
              }}
            />
            <Box>
              <Typography
                sx={{
                  color: "#fff",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontWeight: "bold",
                }}
              >
                Washington State University
              </Typography>
              <Typography
                sx={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "20px",
                }}
              >
                AgWeatherNet
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* DISCLAIMER DIALOG */}
      <Dialog open={disclaimerOpen} onClose={handleCloseDisclaimer}>
        <DialogContent>
          <Typography sx={{ fontSize: "14px", p: 1 }}>
            This is the disclaimer content. Please read it carefully before
            proceeding.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            sx={{
              color: "white",
              backgroundColor: "crimson",
              "&:hover": { backgroundColor: "darkred" },
              fontWeight: "bold",
              textTransform: "none",
              padding: "6px 12px",
              borderRadius: 1,
              mr: 0.5,
            }}
          >
            Agree
          </Button>
          <Button
            sx={{
              color: "white",
              backgroundColor: "crimson",
              "&:hover": { backgroundColor: "darkred" },
              fontWeight: "bold",
              textTransform: "none",
              padding: "6px 12px",
              borderRadius: 1,
            }}
            onClick={handleCloseDisclaimer}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* VALIDATION POPUP */}
      <Dialog open={popupOpen} onClose={handleClosePopup}>
        <DialogContent>
          <Typography sx={{ fontSize: "14px", p: 1 }}>
            {popupMessage}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClosePopup}
            sx={{
              color: "white",
              backgroundColor: "crimson",
              "&:hover": { backgroundColor: "darkred" },
              fontWeight: "bold",
              textTransform: "none",
              padding: "6px 12px",
              borderRadius: 1,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SignupPage;
