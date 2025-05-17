// backend/api/aiRoutes.js
const express = require('express');
const importedFetch = require('node-fetch'); // Assuming you renamed it
const FormData = require('form-data');
const router = express.Router();

const HF_API_TOKEN = process.env.HF_AUTH_TOKEN; // Ensure this matches your .env
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;
const STABLE_DIFFUSION_MODEL_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
//const STABLE_DIFFUSION_MODEL_URL = "https://api-inference.huggingface.co/models/dreamlike-art/dreamlike-photoreal-2.0";

const REMOVE_BG_URL = "https://api.remove.bg/v1.0/removebg";

router.post('/text-to-image', async (req, res) => {
    const { prompt } = req.body;
    console.log(`STEP 1 (BACKEND): /api/ai/text-to-image received prompt: "${prompt}"`);

    if (!prompt) {
        console.log("STEP 2 (BACKEND): Prompt is missing.");
        return res.status(400).json({ success: false, message: 'Prompt is required.' });
    }
    if (!HF_API_TOKEN) {
        console.error('STEP 2 (BACKEND) ERROR: Hugging Face API Token (HF_AUTH_TOKEN) is not configured or undefined.');
        return res.status(500).json({ success: false, message: 'Server configuration error (AI Token).' });
    }
    console.log(`STEP 2 (BACKEND): HF_AUTH_TOKEN seems to be present (prefix: ${HF_API_TOKEN ? HF_API_TOKEN.substring(0,5) : 'N/A'}).`);

    try {
        console.log(`STEP 3 (BACKEND): Calling Hugging Face API (${STABLE_DIFFUSION_MODEL_URL}) with prompt: "${prompt}"`);
        const hfResponse = await importedFetch(STABLE_DIFFUSION_MODEL_URL, { // Use importedFetch
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } }),
        });

        console.log(`STEP 4 (BACKEND): Hugging Face API response status: ${hfResponse.status}`);
        console.log(`STEP 4.1 (BACKEND): HF Response OK? ${hfResponse.ok}`);

        if (!hfResponse.ok) {
            const errorBodyText = await hfResponse.text();
            console.error(`STEP 5 (BACKEND) ERROR: Hugging Face API Error (${hfResponse.status}):`, errorBodyText);
            let hfErrorMessage = `AI service error: ${hfResponse.status}`;
            try { const parsedError = JSON.parse(errorBodyText); if (parsedError && parsedError.error) hfErrorMessage = parsedError.error; } catch (e) {/* not JSON */}
            return res.status(hfResponse.status).json({ success: false, message: hfErrorMessage });
        }

        console.log("STEP 6 (BACKEND): Attempting to get image blob from Hugging Face response.");
        const imageBlob = await hfResponse.blob();
        console.log(`STEP 7 (BACKEND): Received blob. Type: ${imageBlob.type}, Size: ${imageBlob.size}`);
        
        if (!imageBlob.type || !imageBlob.type.startsWith("image/")) {
            console.error("STEP 8 (BACKEND) ERROR: Hugging Face response was OK but not an image. Type:", imageBlob.type);
            return res.status(502).json({ success: false, message: "Bad response from AI service (not an image)." });
        }

        console.log(`STEP 9 (BACKEND): Image generated successfully from Hugging Face. Preparing to send to client.`);
        res.setHeader('Content-Type', imageBlob.type);
        const buffer = Buffer.from(await imageBlob.arrayBuffer());
        console.log(`STEP 10 (BACKEND): Sending image buffer to client. Length: ${buffer.length}`);
        res.send(buffer);

    } catch (error) {
        // This catch block is being hit. The 'error' object here will contain the actual error.
        console.error('FINAL CATCH (BACKEND) ERROR: Unhandled error in text-to-image route:', error);
        // The 'error' object usually has a 'message' property and often a 'stack' property.
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack); // This will be very informative
        res.status(500).json({ success: false, message: 'Internal server error generating image.' });
    }
});

// ... remove-background route ...
router.post('/remove-background', async (req, res) => {
    const { imageBase64 } = req.body;
    console.log('STEP 1 (BACKEND - RemoveBG): /api/ai/remove-background received request.');
    if (!REMOVE_BG_API_KEY) {
         console.error('STEP 2 (BACKEND - RemoveBG) ERROR: Remove.bg API Key is not configured.');
        return res.status(500).json({ success: false, message: 'Server configuration error (BG Removal Key).' });
    }
    // ... (add similar STEP logging here for RemoveBG if needed) ...
    try {
        // ... existing removeBG logic with importedFetch
        const base64ImageContent = imageBase64.split(',')[1];
        const formData = new FormData();
        formData.append('image_file_b64', base64ImageContent);
        formData.append('size', 'auto');

        const removeBgResponse = await importedFetch(REMOVE_BG_URL, {
            method: 'POST',
            headers: {
                ...formData.getHeaders(),
                'X-Api-Key': REMOVE_BG_API_KEY,
            },
            body: formData,
        });

        if (!removeBgResponse.ok) { /* ... error handling ... */ }
        const imageBlob = await removeBgResponse.blob();
        if (!imageBlob.type || !imageBlob.type.startsWith("image/")) { /* ... error handling ... */ }

        res.setHeader('Content-Type', imageBlob.type);
        const buffer = Buffer.from(await imageBlob.arrayBuffer());
        res.send(buffer);
    } catch (error) {
        console.error('FINAL CATCH (BACKEND - RemoveBG) ERROR:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Internal server error removing background.' });
    }
});


module.exports = router;