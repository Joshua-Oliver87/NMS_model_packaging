import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { UserContext } from "./UserContext";
import API from "../util/api";

export const FarmsContext = createContext();

export const FarmsProvider = ({ children }) => {
  const { user } = useContext(UserContext); // Get logged-in user data dynamically

  // State variables
  const [farms, setFarms] = useState([]); // Stores farm data
  const [selectedFarm, setSelectedFarm] = useState(null); // Selected farm state
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error handling

  /**
   * Fetch farms from the API for the logged-in user
   */
  const fetchFarms = useCallback(async () => {
    if (!user?.objid) {
      console.warn("⚠️ No user ID found, skipping farm fetch.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Fetching farms for user:", user.objid);
      try{
        const response = await API.get(`/api/farms`, {
          params: { user_id: user.objid },
        });
        console.log(" API Response:", response.data);
 
      }
      catch(err){
        console.error(" Error in API call:", err);
        if (err.response && err.response.status === 404) {
          console.warn("⚠️ No farms found in API response.");
          setFarms([]); // Ensure state is cleared if no farms exist
          setSelectedFarm(null);
          return;
        }
      }
      const response = await API.get(`/api/farms`, {
        params: { user_id: user.objid },
      });

      console.log(" API Response:", response.data);

      // Ensure coordinates exist before modifying
      const updatedFarms = response.data.farms.map(farm => {
        if (farm.coordinates && Array.isArray(farm.coordinates)) {
          return {
            ...farm,
            coordinates: farm.coordinates.map(coord =>
              Array.isArray(coord) && coord.length === 2 ? [coord[1], coord[0]] : coord
            ),
          };
        } else {
          console.warn(`⚠️ Farm ${farm.id} has invalid coordinates`, farm);
          return farm; // Return farm unchanged if coordinates are invalid
        }
      });

      setFarms(updatedFarms); 
      // setSelectedFarm(newSelectedFarm || updatedFarms[0]);             
      let storedFarm = localStorage.getItem("selectedFarm");
      if (storedFarm) {
        storedFarm = JSON.parse(storedFarm);
        const newSelectedFarm = updatedFarms.find(
          (farm) => farm.objid.toString() === storedFarm.objid.toString()
        );
        setSelectedFarm(newSelectedFarm || updatedFarms[0]);        
      }
      else{
        setSelectedFarm(updatedFarms[0] || null);
      }     

    } catch (error) {
      console.error(" Error fetching farms:", error);
      setError(error.message || "Failed to fetch farms.");

      if (error.response) {
        console.error("🚨 Server responded with:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error(" No response received from API:", error.request);
      } else {
        console.error("⚠️ Request setup error:", error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.objid]); // Only re-run when `user.objid` changes

  /**
   * Auto-fetch farms when the user changes
   */
  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]); // Runs only when `fetchFarms` changes
  useEffect(() => {
    setSelectedFarm(selectedFarm);
  }, [selectedFarm]); // Runs only when `fetchFarms` changes


  return (
    <FarmsContext.Provider value={{ farms, selectedFarm, setSelectedFarm, fetchFarms, loading, error }}>
      {children}
    </FarmsContext.Provider>
  );
};