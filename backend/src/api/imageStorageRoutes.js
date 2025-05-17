// backend/api/imageStorageRoutes.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

// Define a directory to store images persistently (or more permanently than temp)
// Ensure this directory exists in your backend project structure
const USER_UPLOADS_DIR = path.join(__dirname, '..', 'user_uploaded_designs');

const ensureDirExists = async (dirPath) => {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error(`Error creating directory ${dirPath}:`, error);
            throw error;
        }
    }
};

router.post('/upload-design', async (req, res) => {
    const { imageDataUrl, originalFileName, source, sessionId, kioskId } = req.body;
    console.log(`BACKEND (/api/images/upload-design): Received upload. Source: ${source}, Session: ${sessionId}`);

    if (!imageDataUrl || !imageDataUrl.startsWith('data:image')) {
        return res.status(400).json({ success: false, message: 'Invalid image data URL.' });
    }
    if (!sessionId) {
        return res.status(400).json({ success: false, message: 'Session ID is required.' });
    }

    try {
        await ensureDirExists(USER_UPLOADS_DIR);

        const base64Data = imageDataUrl.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        const imageId = `${source}_${sessionId.substring(0,8)}_${crypto.randomBytes(4).toString('hex')}`;
        const extension = originalFileName.split('.').pop() || 'png'; // Get extension or default to png
        const filename = `${imageId}.${extension}`;
        const filePath = path.join(USER_UPLOADS_DIR, filename);

        await fs.writeFile(filePath, imageBuffer);
        console.log(`BACKEND: Image saved successfully to ${filePath}`);

        return res.json({
            success: true,
            imageId: imageId, // You might use this as an ID in your DB later
            imageUrl: `/api/images/view/${filename}`, // URL for the frontend to fetch/display
            filename: filename,
            message: 'Image uploaded and stored successfully.'
        });

    } catch (error) {
        console.error('BACKEND ERROR: Failed to save uploaded design image:', error);
        return res.status(500).json({ success: false, message: 'Server error saving image.' });
    }
});

router.get('/view/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(USER_UPLOADS_DIR, filename);

    // Basic security: prevent path traversal
    if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).send('Invalid filename.');
    }

    console.log(`BACKEND (/api/images/view): Attempting to serve ${filePath}`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`BACKEND ERROR: Error serving file ${filename}:`, err.message);
            if (err.code === "ENOENT") {
                res.status(404).send('Image not found.');
            } else {
                res.status(500).send('Error serving image.');
            }
        }
    });
});


module.exports = router;