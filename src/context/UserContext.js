import React, { createContext, useState, useEffect } from "react";
import { getUserSavedUnits } from "../util/apiUtil";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User state
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Login state  
  const [userSavedUnit, setUserSavedUnit] = useState("");

  // Load user data from localStorage on app load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const savedUnit = localStorage.getItem("favoriteUnit");
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // Parse and set user data
      setIsLoggedIn(true);
    }
    if(savedUnit){
      setUserSavedUnit(savedUnit);
    }
  }, [isLoggedIn, userSavedUnit]);
  
  const setFavoriteUnit = async (userId) => {
    const storedUser = userId;
    if(storedUser){
      const data = await getUserSavedUnits(storedUser);
        localStorage.setItem("favoriteUnit", data.favoriteUnit); 
        setUserSavedUnit(data.favoriteUnit);             
    }
  }
  const login = async (userData) => {
    setUser(userData); // Set user data
    await setFavoriteUnit(userData.objid);
      setIsLoggedIn(true); // Set login state
      localStorage.setItem("user", JSON.stringify(userData)); // Persist user data         
  };

  const logout = () => {
    setUser(null); // Clear user data
    setIsLoggedIn(false); // Reset login state
    localStorage.removeItem("user"); // Clear persisted data
    localStorage.removeItem("favoriteUnit"); // Clear persisted data
  };

  return (
    <UserContext.Provider value={{ user, isLoggedIn, login, logout, userSavedUnit, setUserSavedUnit, setFavoriteUnit }}>
      {children}
    </UserContext.Provider>
  );
};
