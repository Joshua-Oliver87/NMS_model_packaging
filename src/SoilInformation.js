import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

const SoilInformation = () => {
  const location = useLocation();
  const [soilData, setSoilData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSoilData = async (blockId) => {
      try {
        setLoading(true);
        const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/fetch_soil_data`, { blockId });

        setSoilData(response.data || []); // Ensure soilData is always an array
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch soil data");
        setLoading(false);
      }
    };

    if (location.state && location.state.blockId) {
      fetchSoilData(location.state.blockId);
    } else {
      setError("No block ID provided");
      setLoading(false);
    }
  }, [location.state]);

  return (
    <div style={{ padding: "20px" }}>      
      <h2>Soil Description</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Horizon #</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Texture</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Thickness (m)</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Clay (%)</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Silt (%)</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Sand (%)</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Field Capacity Water Content (m/m)</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Permanent Wilting Point Water Content (m/m)</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Soil Organic Matter (%)</th>
          </tr>
        </thead>
        
        <tbody>
          {soilData && soilData.length > 0 ? (
            soilData.map((row, index) => (
              <tr key={index}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row["Horizon #"]}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row["Texture"]}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row["Thickness (m)"]}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row["Clay (%)"]}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row["Silt (%)"]}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row["Sand (%)"]}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row["Field Capacity Water Content (m/m)"]}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row["Permanent Wilting Point Water Content (m/m)"]}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row["Soil Organic Matter (%)"]}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>
                No soil data available
              </td>
            </tr>
          )}
        </tbody>
        
      </table>
      
    </div>
  );
};

export default SoilInformation;
