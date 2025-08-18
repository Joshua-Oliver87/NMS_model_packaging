{/* =================== IRRIGATION MODAL =================== */}
{isIrrigationModalOpen && (
    <div
      className="modal-overlay"
      style={{
        fontFamily: "Arial, sans-serif",
        // You could also put font-family in your CSS
      }}
    >
      <div
        className="modal-content"
        style={{
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          maxWidth: "500px",
          margin: "100px auto",
          background: "#fff",
          padding: "1.5rem",
          position: "relative",
        }}
      >
        <div className="modal-header" style={{ marginBottom: "1rem" }}>
          <h3 style={{ margin: 0 }}>Add Irrigation Event</h3>
        </div>
        <div className="modal-body">
          <label>
            Event Date<span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="date"
            className="input-field"
            name="irrigationEventDate"
            onChange={handleIrrigationTaskChange}
          />

          <label>
            Irrigation Method<span style={{ color: "red" }}>*</span>
          </label>
          <select
            className="input-field"
            value={irrigationTask?.irrigationMethod}
            name="irrigationMethod"
            onChange={handleIrrigationTaskChange}
          >
            <option value="">Select Method</option>
            {waterSources?.map((source) => (
              <option key={source.ID} value={source.Irrig_System}>
                {source.Irrig_System}
              </option>
            ))}
          </select>

          {/* Recommendation Section */}
          {showRecommendation && (
            <div className="recommendation-section">
              <h4 style={{ marginBottom: "0.5rem" }}>Recommendation</h4>
              <span>
                Applied {irrigationTask?.irrigationAppliedWater} inches
                using {irrigationTask?.irrigationMethod} method.
              </span>
              <div
                className="recommendation-summary"
                onClick={() => setShowSummaryDetails(!showSummaryDetails)}
                style={{
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: "0.5rem",
                }}
              >
                Recommendation Summary
                <span style={{ marginLeft: "8px" }}>
                  {showSummaryDetails ? "▼" : "▶"}
                </span>
              </div>
              {showSummaryDetails && (
                <div className="summary-items" style={{ marginTop: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Days Since Last Irrigation</span>
                    <span>{selectedBudgetData?.["Days Since Last Irrigation"]}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Irrigation Recommendation (in)</span>
                    <span>
                      {selectedBudgetData?.["Irrigation_Recommendation (in)"] !==
                      undefined
                        ? parseFloat(
                            selectedBudgetData["Irrigation_Recommendation (in)"]
                          ).toFixed(2)
                        : "--"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Soil Water Depletion (0-1)</span>
                    <span>
                      {selectedBudgetData?.["PAW Depletion (0-1)"] !== undefined
                        ? parseFloat(
                            selectedBudgetData["PAW Depletion (0-1)"]
                          ).toFixed(2)
                        : "--"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Rain and Irrigation (in)</span>
                    <span>
                      {selectedBudgetData?.["Rain and Irrig (in)"] !== undefined
                        ? parseFloat(
                            selectedBudgetData["Rain and Irrig (in)"]
                          ).toFixed(2)
                        : "--"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Water Use (in)</span>
                    <span>
                      {selectedBudgetData?.["Water Use (in)"] !== undefined
                        ? parseFloat(
                            selectedBudgetData["Water Use (in)"]
                          ).toFixed(2)
                        : "--"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Water Stress Index (0-1)</span>
                    <span>
                      {selectedBudgetData?.["Water_Stress_Index (0-1)"]}
                    </span>
                  </div>
                </div>
              )}

              {/* Water Input Section */}
              <div
                className="input-container"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "1rem",
                }}
              >
                <div className="input-box" style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Recommended"
                    name="irrigationRecommendedValue"
                    style={{ paddingRight: "40px" }}
                    value={
                      selectedBudgetData?.["Irrigation_Recommendation (in)"] ||
                      ""
                    }
                    readOnly
                  />
                  <span
                    className="unit-label"
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "0.9rem",
                      color: "#666",
                    }}
                  >
                    in
                  </span>
                </div>

                <div className="input-box" style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Applied Water"
                    value={irrigationTask?.irrigationAppliedWater || ""}
                    name="irrigationAppliedWater"
                    onChange={handleIrrigationTaskChange}
                    style={{ paddingRight: "40px" }}
                  />
                  <span
                    className="unit-label"
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "0.9rem",
                      color: "#666",
                    }}
                  >
                    in
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Cancel left, "Calculate" / "Create" right */}
        <div
          className="modal-footer"
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "1.5rem",
          }}
        >
          <button
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              borderRadius: "5px",
              fontSize: "14px",
              fontWeight: "500",
              padding: "10px 20px",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => {
              setIrrigationTask({ type: "Irrigation" });
              setShowRecommendation(false);
              closeIrrigationModal();
            }}
          >
            Cancel
          </button>

          <button
            disabled={!irrigationTask?.irrigationMethod}
            style={{
              backgroundColor: "#a60f2d",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
            onClick={() => {
              if (!showRecommendation) {
                setShowRecommendation(true);
              } else {
                handleTaskSave(irrigationTask);
                setShowRecommendation(false);
                closeIrrigationModal();
              }
            }}
          >
            {showRecommendation ? "Create" : "Calculate Recommendation"}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* =================== FERTILIZER MODAL =================== */}
  {isFertilizerModalOpen && (
    <div
      className="modal-overlay"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <div
        className="modal-content"
        style={{
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          maxWidth: "500px",
          margin: "100px auto",
          background: "#fff",
          padding: "1.5rem",
          position: "relative",
        }}
      >
        <div className="modal-header" style={{ marginBottom: "1rem" }}>
          <h3 style={{ margin: 0 }}>Edit Fertilization Event</h3>
        </div>
        <div className="modal-body">
          <label>
            Event Date<span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="date"
            className="input-field"
            name="fertilizerEventDate"
            onChange={handleFertilizerTaskChange}
          />

          <label>
            Fertilizer Type<span style={{ color: "red" }}>*</span>
          </label>
          <select
            className="input-field"
            value={fertilizerTask?.fertilizerType}
            name="fertilizerType"
            onChange={handleFertilizerTaskChange}
          >
            <option value="">Select Fertilizer</option>
            <option value="nitrogen">Nitrogen</option>
            <option value="phosphorus">Phosphorus</option>
          </select>

          <label>
            Days To Next Fertilization
            <span style={{ color: "red" }}>*</span>
          </label>
          <input type="number" min="1" className="input-field" />

          {/* Recommendation Section */}
          {showFertilizerRecommendation && (
            <div className="recommendation-section" style={{ marginTop: "1rem" }}>
              <h4 style={{ marginBottom: "0.5rem" }}>Recommendation</h4>
              <span>
                Apply {fertilizerTask?.appliedFertilizer} lbs/acre using{" "}
                {fertilizerTask?.fertilizerType} fertilizer.
              </span>
              <div
                className="recommendation-summary"
                onClick={() =>
                  setShowFertilizerSummaryDetails(!showFertilizerSummaryDetails)
                }
                style={{
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: "0.5rem",
                }}
              >
                Recommendation Summary
                <span style={{ marginLeft: "8px" }}>
                  {showFertilizerSummaryDetails ? "▼" : "▶"}
                </span>
              </div>

              {showFertilizerSummaryDetails && (
                <div className="summary-items" style={{ marginTop: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>N Available (kg/ha)</span>
                    <span>
                      {selectedBudgetData?.["N Available (kg/ha)"] !== undefined
                        ? parseFloat(
                            selectedBudgetData["N Available (kg/ha)"]
                          ).toFixed(2)
                        : "--"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>N Deficit (kg/ha)</span>
                    <span>
                      {selectedBudgetData?.["N Deficit (kg/ha)"] !== undefined
                        ? parseFloat(
                            selectedBudgetData["N Deficit (kg/ha)"]
                          ).toFixed(2)
                        : "--"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>N Fertilization (kg/ha)</span>
                    <span>
                      {selectedBudgetData?.["N Fertilization (kg/ha)"] !==
                      undefined
                        ? parseFloat(
                            selectedBudgetData["N Fertilization (kg/ha)"]
                          ).toFixed(2)
                        : "--"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>N Uptake (kg/ha)</span>
                    <span>
                      {selectedBudgetData?.["N Uptake (kg/ha)"] !== undefined
                        ? parseFloat(
                            selectedBudgetData["N Uptake (kg/ha)"]
                          ).toFixed(2)
                        : "--"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Nitrogen Stress Index (0-1)</span>
                    <span>
                      {selectedBudgetData?.["Today_Crop_N_Demand (kg/ha)"] !==
                      undefined
                        ? parseFloat(
                            selectedBudgetData["Today_Crop_N_Demand (kg/ha)"]
                          ).toFixed(2)
                        : "--"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Today Crop N Demand (kg/ha)</span>
                    <span>
                      {selectedBudgetData?.["Today_Crop_N_Demand (kg/ha)"] !==
                      undefined
                        ? parseFloat(
                            selectedBudgetData["Today_Crop_N_Demand (kg/ha)"]
                          ).toFixed(2)
                        : "--"}
                    </span>
                  </div>
                </div>
              )}

              {/* Fertilizer Input Section */}
              <div
                className="input-container"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "1rem",
                }}
              >
                <div className="input-box" style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Recommended"
                    name="fertilizerRecommendedValue"
                    style={{ paddingRight: "60px" }}
                    // For now, we leave it not connected. You can connect your own recommended data
                  />
                  <span
                    className="unit-label"
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "0.9rem",
                      color: "#666",
                    }}
                  >
                    lbs/acre
                  </span>
                </div>

                <div className="input-box" style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Applied Fertilizer"
                    value={fertilizerTask?.appliedFertilizer || ""}
                    name="appliedFertilizer"
                    onChange={handleFertilizerTaskChange}
                    style={{ paddingRight: "60px" }}
                  />
                  <span
                    className="unit-label"
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "0.9rem",
                      color: "#666",
                    }}
                  >
                    lbs/acre
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Cancel left, "Calculate" / "Create" right */}
        <div
          className="modal-footer"
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "1.5rem",
          }}
        >
          <button
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              borderRadius: "5px",
              fontSize: "14px",
              fontWeight: "500",
              padding: "10px 20px",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => {
              setFertilizerTask({ type: "Fertilizer" });
              setShowFertilizerRecommendation(false);
              closeFertilizerModal();
            }}
          >
            Cancel
          </button>

          <button
            disabled={!fertilizerTask?.fertilizerType}
            style={{
              backgroundColor: "#a60f2d",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
            onClick={() => {
              if (!showFertilizerRecommendation) {
                setShowFertilizerRecommendation(true);
              } else {
                handleTaskSave(fertilizerTask);
                setShowFertilizerRecommendation(false);
                closeFertilizerModal();
              }
            }}
          >
            {showFertilizerRecommendation
              ? "Create"
              : "Calculate Recommendation"}
          </button>
        </div>
      </div>
    </div>
  )}