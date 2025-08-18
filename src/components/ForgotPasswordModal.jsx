import React, { useState } from "react";
import CloseIcon from "@mui/icons-material/Close"; 
import { TextField, Button, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { sendResetPasswordEmail } from "../util/apiUtil"; // Import API function

const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email.trim()) {
      setMessage(" Please enter your email.");
      return;
    }

    setLoading(true);

    const resetLink = `https://yourwebsite.com/reset-password?token=exampleToken123`;

    try {
      const response = await sendResetPasswordEmail(email, resetLink);

      if (response.success) {
        setMessage(" Password reset link has been sent to your email.");
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
        <Typography variant="h6">Reset Password</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Enter your email address, and we will send you a link to reset your password.
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
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ForgotPasswordModal;
