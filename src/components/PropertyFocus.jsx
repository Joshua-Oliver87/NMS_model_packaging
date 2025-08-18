import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { BsFillPinMapFill } from "react-icons/bs"; // Import the Map Pin Icon
import { Tooltip } from "@mui/material"; // Import Tooltip for hover effect

const PropertyFocus = ({ center, minZoomLevel }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, minZoomLevel);
    }
  }, [map, center, minZoomLevel]);

  const resetMapFocus = () => {
    map.setView(center, minZoomLevel);
  };

  return (
    <Tooltip title="Reset Map View" arrow enterDelay={300} leaveDelay={100}>
      <button
        onClick={resetMapFocus}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "10px",
          width: "40px",
          height: "40px",
          backgroundColor: "#a60f2d",
          color: "white",
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          zIndex: 999,
        }}
      >
        <BsFillPinMapFill /> {/* Icon inside the button */}
      </button>
    </Tooltip>
  );
};

export default PropertyFocus;
