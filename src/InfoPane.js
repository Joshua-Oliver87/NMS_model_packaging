import React, { useState } from "react";
import "./App.css";

const InfoPane = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      {/* Sidebar */}
      <div className={`info-pane ${isOpen ? "open" : ""}`}>
        <button className="hamburger-menu" onClick={toggleSidebar}>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
        </button>
      </div>

      {/* Main Content */}
      <div className={`main-content ${isOpen ? "shifted" : ""}`}>
        {children}
      </div>
    </div>
  );
};

export default InfoPane;
