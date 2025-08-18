import React, { useState, useContext } from "react";
import { Menu, MenuItem, IconButton, Tooltip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddBoxIcon from "@mui/icons-material/AddBox";
import DeleteIcon from "@mui/icons-material/Delete";
import EditLocationAltIcon from '@mui/icons-material/EditLocationAlt';
import { useNavigate } from "react-router-dom";
import { FarmsContext } from "../context/FarmsContext";
import { deleteFarms, deleteBlocks } from "../util/apiUtil";
import DeleteBlocksModal from "../components/DeleteBlocksModal";

const EditFarmButton = ({ onEditFarm }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openBlocksModal, setOpenBlocksModal] = useState(false);
  const navigate = useNavigate();
  const { selectedFarm } = useContext(FarmsContext);
  const ranchId = selectedFarm?.objid;
  const [loading, setLoading] = useState(false);
  const { farms, fetchFarms } = useContext(FarmsContext);
  const [blocks, setBlocks] = useState([]); //  Define blocks state

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    setOpenDialog(true);
    handleClose();
  };

  const handleConfirmDelete = async () => {
    if (!ranchId) return;
    setLoading(true);
    try {
      await deleteBlocks(ranchId);
      const response = await deleteFarms(ranchId, [selectedFarm.name]);

      if (response.status === 200) {
        const remainingFarms = farms.filter(farm => farm.objid !== ranchId);
        if (remainingFarms.length > 0) {
          // onEditFarm(remainingFarms[0]);
          navigate("/maincontent?farm=" + remainingFarms[0].objid);
        } else {
          navigate("/maincontent");
        }
        await fetchFarms(); // Refresh farms after deletion
      }
      setOpenDialog(false);
    } catch (error) {
      console.error(" Error deleting farm and blocks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBlocks = () => {
    setOpenBlocksModal(true);
    handleClose();
  };

  return (
    <div style={{ position: "absolute", bottom: "80px", right: "12px", zIndex: 999 }}>
      <Tooltip title="Edit Farm Options" arrow enterDelay={300} leaveDelay={100}>
        <IconButton
          onClick={handleClick}
          sx={{
            backgroundColor: "#a60f2d",
            color: "white",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:hover": { backgroundColor: "#8b1e1e" },
          }}
        >
          <EditLocationAltIcon fontSize="medium" />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
      <MenuItem
  onClick={() => { 
    handleClose(); 
    console.log("🛠️ Edit Farm Menu Clicked! Calling onEditFarm...");
    if (onEditFarm) {
      onEditFarm();  // Calls the function to open the dialog in MainContent.js
    } else {
      console.error(" onEditFarm is undefined!");
    }
  }}
>
  <EditIcon style={{ marginRight: 8 }} /> Edit {selectedFarm?.name}
</MenuItem>


        <MenuItem onClick={() => { handleClose(); if (ranchId) { navigate(`/drawblock/${ranchId}`); } else { alert("No farm selected! Please select a farm first."); } }}>
          <AddBoxIcon style={{ marginRight: 8 }} /> Add Block to {selectedFarm?.name}
        </MenuItem>
        <MenuItem onClick={handleEditBlocks}>
          <DeleteIcon style={{ marginRight: 8 }} /> Edit Blocks
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon style={{ marginRight: 8 }} /> Delete {selectedFarm?.name}
        </MenuItem>
      </Menu>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the farm "{selectedFarm?.name}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{ padding: "18px"}}>
          <Button
            onClick={() => setOpenDialog(false)}
            variant="contained"
            sx={{
              backgroundColor: "#6c757d",
              color: "white",
              width: "18%",

              marginRight: "59%",
              "&:hover": {
                backgroundColor: "#5a6268",
              },
            }}
            disabled={loading}
          >
            No
          </Button>

          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              backgroundColor: "#a60f2d",
              color: "white",
              width: "20%",
              "&:hover": {
                backgroundColor: "#8f0d26",
              },
            }}
            autoFocus
            disabled={loading}
          >
            {loading ? "Deleting..." : "Yes"}
          </Button>
        </DialogActions>
      </Dialog>


      {/*  Pass blocks list to DeleteBlocksModal */}
      <DeleteBlocksModal
        open={openBlocksModal}
        onClose={() => setOpenBlocksModal(false)}
        ranchId={ranchId}
        blocks={blocks} // Pass blocks list
      />
    </div>
  );
};

export default EditFarmButton;
