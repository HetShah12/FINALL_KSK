// backend/src/api/imageRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // For unique filenames
const multer = require('multer'); // If you need to handle direct file uploads (form-data)

// --- Configuration for Temporary Image Storage ---
const TEMP_UPLOAD_DIR = path.join(__dirname, '..', '..', 'temp_uploads'); // Create this folder
if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
    fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
}

// --- Multer setup for direct file uploads (if your "Upload Image" feature sends form-data) ---
// If you only send base64 from all features, you might not need multer here for this endpoint.
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, TEMP_UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = uuidv4();
        const extension = path.extname(file.originalname) || '.png'; // Default to png if no extension
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});
const upload = multer({ storage: storage });


// --- Route to handle temporary image uploads ---
// Accepts Base64 data URL or a file upload (if multer is used)
// We'll primarily focus on Base64 for consistency with AI image generation flow
router.post('/upload-temporary', async (req, res) => {
    const { imageDataUrl, originalFileName, source } = req.body; // source can be 'ai', 'draw', 'upload'

    if (!imageDataUrl || !imageDataUrl.startsWith('data:image')) {
        return res.status(400).json({ message: "Invalid or missing imageDataUrl (must be Base64 data URL)." });
    }

    try {
        const base64Data = imageDataUrl.split(';base64,').pop();
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Determine extension
        let extension = '.png'; // Default
        if (imageDataUrl.startsWith('data:image/jpeg')) extension = '.jpg';
        else if (imageDataUrl.startsWith('data:image/png')) extension = '.png';
        else if (imageDataUrl.startsWith('data:image/webp')) extension = '.webp';
        // Add more types as needed

        const imageId = uuidv4();
        const filename = `${imageId}${extension}`;
        const filePath = path.join(TEMP_UPLOAD_DIR, filename);

        await fs.promises.writeFile(filePath, imageBuffer);

        const temporaryImageUrl = `/api/images/temp/${filename}`; // URL to serve the image
        console.log(`Temp image saved: ${filename}, URL: ${temporaryImageUrl}, Source: ${source || 'unknown'}`);
        
        res.status(201).json({
            success: true,
            message: "Image uploaded temporarily.",
            imageId: imageId, // Send back the ID without extension
            temporaryImageUrl: temporaryImageUrl,
            filename: filename // Filename with extension
        });

    } catch (error) {
        console.error("Error saving temporary image:", error);
        res.status(500).json({ message: "Failed to save temporary image." });
    }
});

// --- Route to serve temporary images ---
// This allows <img> tags in frontend to use /api/images/temp/some-image.png
router.get('/temp/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(TEMP_UPLOAD_DIR, filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        console.warn(`Temporary image not found: ${filename}`);
        res.status(404).send("Temporary image not found.");
    }
});

// TODO: Add a cleanup mechanism for TEMP_UPLOAD_DIR (e.g., a cron job or on server start)

module.exports = router;