// backend/src/api/qrCodeRoutes.js
const express = require('express');
const router = express.Router(); // Make sure Router is capitalized
const qrcode = require('qrcode');
const ip = require('ip');

const SERVER_IP = ip.address(); // Gets local IP. For production, use a public domain/IP.
const PORT = process.env.PORT || 5000;

router.get('/generate', async (req, res) => {
    const kioskSocketId = req.query.kioskSocketId; // Kiosk's Socket.IO ID
    const side = req.query.side || 'front'; // 'front' or 'back'

    if (!kioskSocketId) {
        return res.status(400).json({ message: "Kiosk Socket ID ('kioskSocketId') is required in query." });
    }

    // The phone will navigate to this URL to upload image.
    // It includes the kiosk's socket ID so the phone knows where to send the image data via the server.
    // It also includes the 'side' to specify where the image should be applied on the kiosk.
    const uploadPageUrl = `http://${SERVER_IP}:${PORT}/phone/kiosk_upload_phone.html?kioskId=${kioskSocketId}&side=${side}`;
    console.log(`QR Code: Generating for URL: ${uploadPageUrl}`);

    try {
        const qrImageBuffer = await qrcode.toBuffer(uploadPageUrl);
        res.type('png');
        res.send(qrImageBuffer);
    } catch (err) {
        console.error("QR Code Generation Error:", err);
        res.status(500).json({ message: "Error generating QR code", error: err.message });
    }
});

module.exports = router; // CRITICAL