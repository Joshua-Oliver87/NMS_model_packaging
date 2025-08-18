import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Component Imports
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import MainContent from "./MainContent";
import DrawFarm from "./DrawFarm";
import DrawBlock from "./DrawBlock";
import SaveFarm from "./SaveFarm";
import MyFarms from "./MyFarms";
import ProfileSettings from "./ProfileSettings";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BlockInformation from "./BlockInformation"; // Import BlockInformation Component
import SoilInformation from "./SoilInformation"; // Import SoilInformation Component


// Context and HOC
import { UserContext } from "./context/UserContext";
import ProtectedRoute from "./ProtectedRoutes";

const App = () => {
  const { isLoggedIn, user } = useContext(UserContext); // Access login state from context

  return (
    <Router>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Navbar /> {/* Global Navbar */}

        <div style={{ flex: 1, marginTop: "60px" }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected Routes */}
            <Route
              path="/maincontent"
              element={
                <ProtectedRoute>
                  <MainContent />
                </ProtectedRoute>                                
              }
            />
            <Route
              path="/drawfarm"
              element={
                <ProtectedRoute>
                  <DrawFarm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/drawblock/:ranchId"
              element={
                <ProtectedRoute>
                  <DrawBlock />
                </ProtectedRoute>
              }
            />
            <Route
              path="/savefarm/:ranchId" // Added ranchId parameter
              element={
                <ProtectedRoute>
                  <SaveFarm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/blockinformation/:objid" // Accept objid as a parameter
              element={
                <ProtectedRoute>
                  <BlockInformation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/soil-information" // New route for SoilInformation
              element={
                <ProtectedRoute>
                  <SoilInformation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/myfarms"
              element={
                <ProtectedRoute>
                  <MyFarms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profilesettings"
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>

        <Footer /> {/* Global Footer */}
      </div>
    </Router>
  );
};

export default App;
