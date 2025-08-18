import React, { useState, useEffect, useContext } from "react";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { deleteBlocks } from "../util/apiUtil";
import API from "../util/api";
import { FarmsContext } from "../context/FarmsContext";

const DeleteBlocksModal = ({ open, onClose, ranchId }) => {
  const { fetchFarms } = useContext(FarmsContext); // Get logged-in user data dynamically
  const [blocks, setBlocks] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [blockName, setBlockName] = useState("");
  const [blockArea, setBlockArea] = useState("");

  // Fetch blocks when modal opens
  useEffect(() => {
    if (open && ranchId) {
      fetchBlocks();
    }
  }, [open, ranchId]);

  // Fetch blocks API call
  const fetchBlocks = async () => {
    try {
      const response = await API.get(`/api/blocks`, {
        params: { farmId: ranchId },
      });

      if (Array.isArray(response.data.blocks)) {
        setBlocks(response.data.blocks);
      } else {
        setBlocks([]);
      }
    } catch (error) {
      console.error("Error fetching blocks:", error);
    }
  };

  // Handle block deletion
  const handleDelete = async (blockId) => {
    try {
      await deleteBlocks(blockId);
      setBlocks((prevBlocks) =>
        prevBlocks.filter((block) => block.block_id !== blockId)
      );
      await fetchFarms(); // Refresh farms after deletion
    } catch (error) {
      console.error("Error deleting block:", error);
    }
  };

  // Handle block edit
  const handleEditClick = (block) => {
    setSelectedBlock(block);
    setBlockName(block.block_name);
    setBlockArea(block.acres);
    setEditModalOpen(true);
  };

  // Handle block save
  const handleSave = async () => {
    console.log("Saving block:", { blockName, blockArea });
    setEditModalOpen(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Manage Blocks Modal */}
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Manage Blocks</h3>
            <IconButton className="close-btn" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </div>

          <div className="modal-divider"></div>

          <div className="modal-body">
            {blocks.length > 0 ? (
              <ul className="block-list">
                {blocks.map((block) => (
                  <li key={block.block_id} className="block-item">
                    <div className="block-info">
                      <span className="block-name">{block.block_name}</span>
                      <IconButton
                        className="edit-icon"
                        onClick={() => handleEditClick(block)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        className="delete-icon"
                        onClick={() => handleDelete(block.block_id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-blocks">No blocks available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Block Modal */}
      {editModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Block</h3>
              <IconButton
                className="close-btn"
                onClick={() => setEditModalOpen(false)}
              >
                <CloseIcon />
              </IconButton>
            </div>

            <div className="modal-divider"></div>

            <div className="modal-body">
              <label>Block Name</label>
              <input
                type="text"
                className="input-field"
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
              />

              <label>Block Area (Acres)</label>
              <input
                type="number"
                className="input-field"
                value={blockArea}
                readOnly // Making the field read-only
              />
            </div>

            <div
              className="modal-actions"
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "8px",
              }}
            >
              <button
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  width: "25%",
                  transition: "background-color 0.3s",
                }}
                onClick={() => setEditModalOpen(false)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#5a6268")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#6c757d")
                }
              >
                Cancel
              </button>
              <button
                style={{
                  backgroundColor: "#a60f2d",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  width: "25%",
                  transition: "background-color 0.3s",
                }}
                onClick={handleSave}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#8b0c24")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#a60f2d")
                }
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteBlocksModal;
