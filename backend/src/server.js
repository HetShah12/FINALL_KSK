// backend/server.js
const dotenv = require('dotenv'); // Import dotenv
dotenv.config(); // Load environment variables from .env file

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const qrcode = require('qrcode');
const ip = require('ip');
const path = require('path');
const cors = require('cors');
const aiRoutes = require('./api/aiRoutes');
const imageStorageRoutes = require('./api/imageStorageRoutes'); // <--- REQUIRE THIS
const SERVER_IP = ip.address(); // Use the automatically detected IP
 // Now this will have process.env available

const PORT = process.env.PORT || 5001;
const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: '50mb' })); // For parsing application/json
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // For parsing application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, 'public'))); // To serve phone_upload_page.html
console.log(`Serving static files from: ${path.join(__dirname, 'public')}`);


// API Routes
app.use('/api/ai', aiRoutes); // Mount the AI routes
app.use('/api/images', imageStorageRoutes); // <--- AND MOUNT THIS


// Simple health check
app.get('/health', (req, res) => {
    res.status(200).send('Backend is healthy!');
});

app.get('/qr_code_kiosk.png', async (req, res) => {
    const { kioskId, side = 'front' } = req.query;

    if (!kioskId) {
        console.error("BACKEND QR Gen: kioskId is required.");
        return res.status(400).send("kioskId is required for QR code generation.");
    }

    // URL for the phone to open, passing kioskId and side
    const phoneUploadUrl = `http://${SERVER_IP}:${PORT}/phone_upload_page.html?kioskId=${encodeURIComponent(kioskId)}&side=${encodeURIComponent(side)}`;
    console.log(`BACKEND QR Gen: Generating QR for URL: ${phoneUploadUrl}`);

    try {
        const qrImageBuffer = await qrcode.toBuffer(phoneUploadUrl, { errorCorrectionLevel: 'M' });
        res.type('image/png');
        res.send(qrImageBuffer);
    } catch (err) {
        console.error("BACKEND QR Gen: QR Code Generation Error:", err);
        res.status(500).send("Error generating QR code.");
    }
});

app.post('/upload_to_kiosk', (req, res) => {
    const { imageDataUrl, originalFileName, kioskId, side } = req.body;
    console.log(`BACKEND Upload: Received upload for Kiosk ID: ${kioskId}, Side: ${side}, File: ${originalFileName ? originalFileName.substring(0,30) : 'N/A'}`);

    if (!imageDataUrl || !kioskId || !side) {
        console.error("BACKEND Upload Error: Missing data. Required: imageDataUrl, kioskId, side.");
        return res.status(400).json({ success: false, message: "Missing required data." });
    }
    if (typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image')) {
        console.error("BACKEND Upload Error: Invalid image data format.");
        return res.status(400).json({ success: false, message: "Invalid image data format." });
    }

    // Find the target kiosk socket
    const targetSocket = io.sockets.sockets.get(kioskId);
    if (targetSocket) {
        console.log(`BACKEND Upload: Sending 'kiosk_display_image' to socket ${kioskId}.`);
        targetSocket.emit('kiosk_display_image', {
            imageDataUrl: imageDataUrl, // Base64 Data URL
            originalFileName: originalFileName || 'uploaded_image.png',
            side: side
        });
        res.status(200).json({ success: true, message: "Image data sent to kiosk." });
    } else {
        console.warn(`BACKEND Upload Warning: Kiosk ID ${kioskId} not found or disconnected.`);
        res.status(404).json({ success: false, message: `Kiosk ${kioskId} not connected.` });
    }
});


const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // << SPECIFICALLY ALLOW YOUR FRONTEND ORIGIN
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log(`BACKEND Socket: Client connected - ID: ${socket.id}`);
     // The client (kiosk UI) now has socket.id, which it will use to request its specific QR code.

    socket.on('disconnect', (reason) => {
        console.log(`BACKEND Socket: Client disconnected - ID: ${socket.id}. Reason: ${reason}`);
    });

    socket.on('error', (error) => {
        console.error(`BACKEND Socket Error from ${socket.id}:`, error);
    });
});
httpServer.listen(PORT, () => {
    console.log(`\n--- Kiosk Backend (QR Upload Focus) ---`);
    console.log(`Server running at: http://localhost:${PORT}`);
    console.log(`Phone upload page at: http://${SERVER_IP}:${PORT}/phone_upload_page.html`);
    console.log(`------------------------------------`);
});

httpServer.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`FATAL ERROR: Port ${PORT} is already in use.`);
    } else {
        console.error(`FATAL ERROR starting server: ${error}`);
    }
    process.exit(1);
});