import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "./context/UserContext"; // Adjust the path based on your structure

const ProtectedRoute = ({ children }) => {
  const storedUser = localStorage.getItem("user");
  // If user is not logged in, redirect to login page
    if (!storedUser) {      
      return <Navigate to="/" replace />;
    }

    

  // If user is logged in, render the protected content
  return children;
};

export default ProtectedRoute;
