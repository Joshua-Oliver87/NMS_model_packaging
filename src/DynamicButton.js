import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const DynamicButton = ({ currentPage }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (currentPage === "login") {
      navigate("/signup"); // Navigate to Sign Up page
    } else {
      navigate("/"); // Navigate to Login page
    }
  };

  return (
    <Button
      variant="contained"
      sx={{
        position: "absolute", // Positioning the button over the image
        top: "10px", // Adjust the vertical position
        right: "20px", // Align the button to the right
        zIndex: 2, // Ensure the button appears above the image
        backgroundColor: "crimson",
        color: "white",
        fontWeight: "bold",
        borderRadius: "20px",
        textTransform: "none",
        padding: "8px 20px",
      }}
      onClick={handleClick}
    >
      {currentPage === "login" ? "Sign Up" : "Log In"}
    </Button>
  );
};

export default DynamicButton;
