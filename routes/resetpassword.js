require("dotenv").config();
const express = require("express");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const router = express.Router();

//  Initialize AWS SES Client (SDK v3)
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

//  Reset Password API Route
router.post("/send-reset-password-email", async (req, res) => {
  console.log("📩 API Request Received: /send-reset-password-email");

  const { email, resetLink } = req.body;
  if (!email || !resetLink) {
    return res.status(400).json({ success: false, message: "Email and reset link are required" });
  }

  const senderEmail = process.env.SENDER_EMAIL;
  const params = {
    Destination: { ToAddresses: [email] },
    Message: {
      Body: { Html: { Data: `<h3>Click <a href="${resetLink}">here</a> to reset your password.</h3>` } },
      Subject: { Data: "Reset Your Password" },
    },
    Source: senderEmail,
  };

  try {
    const command = new SendEmailCommand(params);
    await sesClient.send(command);
    res.status(200).json({ success: true, message: "Reset password email sent successfully" });
  } catch (error) {
    console.error("AWS SES Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

//  Export the router
module.exports = router;
