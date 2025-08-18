import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TableSortLabel from "@mui/material/TableSortLabel";

const ListViewModal = ({ open, onClose, title, data, columns }) => {
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortedData, setSortedData] = useState([...data]);

  // Sorting function for date column
  const handleSort = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);

    const sorted = [...sortedData].sort((a, b) => {
      const dateA = new Date(a["DOE"]);
      const dateB = new Date(b["DOE"]);
      return newOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    setSortedData(sorted);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      // Add your styles for curved edges (rounded corners) here:
      PaperProps={{
        style: {
          borderRadius: "15px",
          width: "45%",
          height: "70%",
          padding: "0.5rem",
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TableContainer component={Paper} style={{ borderRadius: "8px" }}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((col, index) => (
                  <TableCell key={index}>
                    {col.field === "DOE" ? (
                      <TableSortLabel
                        active={true}
                        direction={sortOrder}
                        onClick={handleSort}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.length > 0 ? (
                sortedData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((col, colIndex) => (
                      <TableCell key={colIndex}>
                        {row[col.field] || "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    No events available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        {/* Example close button styling snippet */}
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: "#6c757d",
            color: "white",
            width: "15%",
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ListViewModal;
