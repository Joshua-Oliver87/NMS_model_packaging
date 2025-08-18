require("dotenv").config();
const express = require("express");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const router = express.Router();

//  Initialize AWS SES Client with Explicit Signature Version
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY.trim(),
    secretAccessKey: process.env.AWS_SECRET_KEY.trim(),
  },
  signatureVersion: "v4", //  Fix for "SignatureDoesNotMatch" issue
});

//  Forgot Username API Route
router.put("/send-forgot-username-email", async (req, res) => {
  console.log("API Request Received: /send-forgot-username-email");

  const { email, username } = req.body;
  if (!email || !username) {
    return res.status(400).json({ success: false, message: "Email and username are required" });
  }

  const senderEmail = process.env.SENDER_EMAIL;
  const params = {
    Destination: { ToAddresses: [email] },
    Message: {
      Body: { Html: { Data: `<h3>Your username is: <b>${username}</b></h3>` } },
      Subject: { Data: "Your Requested Username" },
    },
    Source: senderEmail,
  };

  try {
    const command = new SendEmailCommand(params);
    await sesClient.send(command);
    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("AWS SES Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

//  Export the router
module.exports = router;
