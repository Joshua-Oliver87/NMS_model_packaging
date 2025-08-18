import React, { useState, useEffect } from "react";
import { Select, MenuItem, Box } from "@mui/material";
import axios from "axios";
import API from "../util/api";

const BlocksDropdown = ({ farmId, onBlockSelect }) => {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState("");

  // Fetch blocks based on the farm ID
  const fetchBlocks = async () => {
    try {
      const response = await API.get(`/api/blocks`, {
        params: { farmId },
      });
      
      if (Array.isArray(response.data.blocks)) {
        setBlocks(response.data.blocks);
      } else {
        setBlocks([]);
      }
    } catch (error) {
      console.error("Error fetching blocks:", error.response || error.message || error);
    }
  };

  // Handle block selection
  const handleBlockSelect = (e) => {
    const selectedBlockId = e.target.value;
    setSelectedBlock(selectedBlockId);
    onBlockSelect(selectedBlockId); // Pass the selected block ID to the parent component
  };

  useEffect(() => {
    if (farmId) {
      fetchBlocks();
    }
  }, [farmId]);

  // return (
  //   <Box sx={{ width: "15%" }}>
  //     <Select
  //       value={selectedBlock}
  //       onChange={handleBlockSelect}
  //       fullWidth
  //       displayEmpty
  //     >
  //       <MenuItem value="" disabled>
  //         Select a block
  //       </MenuItem>
  //       {blocks.map((block) => (
  //         <MenuItem key={block.block_id} value={block.block_id}>
  //           {block.block_name}
  //         </MenuItem>
  //       ))}
  //     </Select>
  //   </Box>
  // );
};

export default BlocksDropdown;
