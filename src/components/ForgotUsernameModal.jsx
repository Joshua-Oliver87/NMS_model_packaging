import React, { useState } from "react";
import CloseIcon from "@mui/icons-material/Close"; 
import { TextField, Button, Box, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { sendForgotUsernameEmail } from "../util/apiUtil"; // Import API utilities

const ForgotUsernameModal = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    //  Validate email input
    if (!email.trim()) {
      setMessage(" Please enter your email.");
      return;
    }

    setLoading(true);

    try {
      const response = await sendForgotUsernameEmail(email, "dummyUsername"); // Replace with actual username logic

      if (response.success) {
        setMessage(" Your username has been sent to your email.");
      } else {
        setMessage(" Failed to send email. Please try again.");
      }
    } catch (error) {
      setMessage(" Error sending email. Please try again later.");
      console.error("Email Send Error:", error);
    }

    setLoading(false);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">Forgot Username?</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Enter the email address associated with your account. Your username will be sent within 10 minutes.
        </Typography>

        <TextField
          fullWidth
          type="email"
          placeholder="youremail@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mt: 1 }}
          disabled={loading}
        />

        {message && (
          <Typography variant="body2" color={message.includes("") ? "error" : "success"} sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          sx={{ backgroundColor: "#a60f2d", color: "white" }} 
          disabled={loading}
        >
          {loading ? "Sending..." : "Get Username"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ForgotUsernameModal;
