import { useEffect, useState, useRef } from "react";
import { SoilTable } from "./SoilTable";
import { fetchSoilData } from "../util/apiUtil";
import { Box, Modal, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export const SoilDataModal = ({
  closeModal,
  blockId,
  soilModalData,
  soilObjid,
  setSelectedBlockId,
  setIsSoilModalOpen,
}) => {
  const openModal = (blockId) => {
    setSelectedBlockId(blockId);
    setIsSoilModalOpen(true);
  };
  const modalRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    }
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeModal]);

  return (
    <Box
      ref={modalRef}
      sx={{
        position: "absolute",
        top: "88%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "68%",
        height: "400px",
        bgcolor: "background.paper",
        borderRadius: "30px",
        boxShadow: 24,
        padding: "24px",
        zIndex: 1500,
        overflowY: "auto",
      }}
    >
      {/* Close Button */}
      <IconButton
        aria-label="close"
        onClick={() => {
          closeModal(); // just to be safe
          setIsSoilModalOpen(false);
          setSelectedBlockId(null); // optional: if you want to reset selected block too
        }}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          color: "#888",
          backgroundColor: "transparent",
          transition: "transform 0.2s ease-in-out, background-color 0.2s",
          "&:hover": {
            color: "#a60f2d",               // WSU crimson highlight
            backgroundColor: "rgba(166, 15, 45, 0.1)", // Soft crimson bg
            transform: "scale(1.2)",        // Slightly enlarge
          },
        }}
      >
        <CloseIcon />
      </IconButton>

      <h4>Soil Information</h4>
      <div style={{ display: "flex" }}>
        {soilModalData && soilObjid && (
          <SoilTable
            onSuccess={closeModal}
            data={soilModalData}
            objid={soilObjid}
          />
        )}
      </div>
    </Box>
  );
};
