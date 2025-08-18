import React, { useState } from "react";
import { EsriProvider } from "leaflet-geosearch";

const SearchLocation = ({ onLocationSearch }) => {
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleInputChange = async (e) => {
    const query = e.target.value;
    setLocation(query);

    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const provider = new EsriProvider();
      const results = await provider.search({
        query,
        params: {
          forStorage: false, // Prevent results from being stored by ArcGIS services
          maxSuggestions: 5, // Limit the number of suggestions
          countryCode: "US", // Prioritize US locations
        },
      });

      // Prioritize US results
      const usResults = results.filter((result) =>
        result.label.toLowerCase().includes("united states")
      );
      const otherResults = results.filter(
        (result) => !result.label.toLowerCase().includes("united states")
      );

      setSuggestions([...usResults, ...otherResults]);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const { label, x: lon, y: lat } = suggestion;

    // Ensure latitudes are positive (north) and longitudes are negative (west)
    const adjustedLat = Math.abs(parseFloat(lat));
    const adjustedLon = -Math.abs(parseFloat(lon));

    console.log("Selected suggestion:", { adjustedLat, adjustedLon, label });
    setLocation(label); // Update the input field with the selected suggestion
    setSuggestions([]); // Clear suggestions
    onLocationSearch({ lat: adjustedLat, lon: adjustedLon, label });
  };

  const handleSearch = async () => {
    if (!location.trim()) {
      alert("Please enter a valid location.");
      return;
    }

    setIsSearching(true);

    try {
      const provider = new EsriProvider();
      const results = await provider.search({
        query: location,
        params: {
          forStorage: false,
          maxSuggestions: 1,
          countryCode: "US",
        },
      });

      if (results.length === 0) {
        alert("No location found. Please try a different query.");
        return;
      }

      const { x: lon, y: lat, label } = results[0];

      // Ensure latitudes are positive (north) and longitudes are negative (west)
      const adjustedLat = Math.abs(parseFloat(lat));
      const adjustedLon = -Math.abs(parseFloat(lon));

      console.log("Parsed coordinates with adjustments:", { adjustedLat, adjustedLon });
      onLocationSearch({ lat: adjustedLat, lon: adjustedLon, label });
    } catch (error) {
      console.error("Error fetching location data:", error);
      alert("Failed to fetch location data. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <input
        type="text"
        placeholder="Enter a location or ZIP code"
        value={location}
        onChange={handleInputChange}
        style={{
          padding: "10px",
          fontSize: "16px",
          borderRadius: "4px",
          border: "1px solid #ccc",
        }}
      />
      {suggestions.length > 0 && (
        <ul
          style={{
            listStyleType: "none",
            margin: 0,
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            maxHeight: "150px",
            overflowY: "auto",
            backgroundColor: "white",
          }}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                padding: "5px",
                cursor: "pointer",
                borderBottom: index !== suggestions.length - 1 ? "1px solid #ccc" : "none",
              }}
            >
              {suggestion.label}
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={handleSearch}
        style={{
          padding: "10px",
          fontSize: "16px",
          backgroundColor: "crimson",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        disabled={isSearching}
      >
        Search Location
      </button>
    </div>
  );
};

export default SearchLocation;
