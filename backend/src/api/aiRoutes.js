// backend/api/aiRoutes.js
const express = require('express');
const fetch = require('node-fetch'); // Explicitly use node-fetch v2 for CommonJS
const FormDataNode = require('form-data');
const router = express.Router();
const { HfInference } = require('@huggingface/inference');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai"); // For Gemini

const HF_API_TOKEN = process.env.HF_AUTH_TOKEN; // Used for Hugging Face models
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY_BACKEND; // Use a separate key for backend Gemini calls if needed

const STABLE_DIFFUSION_TEXT_TO_IMAGE_MODEL_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

// Configure Gemini AI
let genAI;
if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} else {
    console.warn("BACKEND WARNING: GEMINI_API_KEY_BACKEND is not set. AI Draw feature (Gemini) will not function.");
}

const TEMP_IMAGE_DIR = path.join(__dirname, '..', '..', 'public', 'generated_images_temp'); 
if (!fs.existsSync(TEMP_IMAGE_DIR)){
    fs.mkdirSync(TEMP_IMAGE_DIR, { recursive: true });
}

// Text to Image (Hugging Face - stabilityai)
router.post('/text-to-image', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required.' });
    if (!HF_API_TOKEN) return res.status(500).json({ success: false, message: 'Server AI Token (HF) not configured.' });

    try {
        const hf = new HfInference(HF_API_TOKEN);
        console.log(`BACKEND: Calling HF textToImage with prompt: ${prompt}`);
        const imageBlob = await hf.textToImage({
            model: STABLE_DIFFUSION_TEXT_TO_IMAGE_MODEL_URL,
            inputs: prompt,
            parameters: { negative_prompt: "blurry, deformed, ugly, text, watermark, signature", wait_for_model: true }
        });
        
        if (!imageBlob || !imageBlob.type || !imageBlob.type.startsWith("image/")) {
            return res.status(502).json({ success: false, message: "AI service (HF) did not return a valid image." });
        }
        
        const generatedImageBuffer = Buffer.from(await imageBlob.arrayBuffer());
        const uniqueFilename = `hf_text_${Date.now()}.png`;
        const tempFilePath = path.join(TEMP_IMAGE_DIR, uniqueFilename);
        fs.writeFileSync(tempFilePath, generatedImageBuffer);
        const imageUrlForClient = `/generated_images_temp/${uniqueFilename}`;
        
        res.json({ 
            success: true, imageUrl: imageUrlForClient, 
            imageId: `hf_text_${Date.now()}`, filename: uniqueFilename,
            message: 'Image generated successfully'
        });
    } catch (error) {
        console.error('BACKEND /text-to-image ERROR:', error);
        res.status(500).json({ success: false, message: error.message || 'Error generating image via HF.' });
    }
});

// Remove Background
router.post('/remove-background', async (req, res) => { /* ... (same as your provided version) ... */ });


// AI DRAW TO IMAGE (USING GEMINI via Backend, then storing it via /api/images/upload-design)
router.post('/draw-to-image', async (req, res) => {
    if (!GEMINI_API_KEY || !genAI) {
        return res.status(500).json({ success: false, message: "AI Draw service (Gemini) not configured on server." });
    }
    const { sketchBase64, prompt, sessionId, kioskId } = req.body; // sketchBase64 includes "data:image/png;base64," prefix
    
    if (!sketchBase64 || !prompt) {
        return res.status(400).json({ success: false, message: 'Sketch data (base64) and prompt are required.' });
    }

    try {
        const actualBase64Data = sketchBase64.split(',')[1]; // Remove the prefix
        if (!actualBase64Data) {
            return res.status(400).json({ success: false, message: 'Invalid sketch base64 data format.' });
        }

        console.log(`BACKEND AI Draw: Prompt: "${prompt}", Session: ${sessionId}, Kiosk: ${kioskId}. Sketch data received (length: ${actualBase64Data.length})`);

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Or "gemini-pro-vision" if that's preferred
        
        // Constructing the prompt for Gemini Vision model (image and text together)
        const imagePart = { inlineData: { data: actualBase64Data, mimeType: 'image/png' } };
        const textPart = { text: `${prompt}. Enhance the sketch, keep the style of the sketch but make it look more polished. Consider the sketch as a primary guide.` };
        
        const result = await model.generateContent([imagePart, textPart]); // Sending parts as an array
        const response = await result.response;
        const candidate = response.candidates?.[0];

        if (candidate && candidate.content && candidate.content.parts) {
            const generatedImagePart = candidate.content.parts.find(part => part.inlineData && part.inlineData.mimeType.startsWith('image/'));
            if (generatedImagePart) {
                const generatedImageData = generatedImagePart.inlineData.data; // This is base64 from Gemini

                // Now, we want to treat this like an upload to our own server for consistency
                // This part will call your existing internal logic for saving an image if you had one,
                // or save directly here and construct the response.

                const buffer = Buffer.from(generatedImageData, 'base64');
                const uniqueFilename = `gemini_draw_${sessionId}_${Date.now()}.png`;
                const tempFilePath = path.join(TEMP_IMAGE_DIR, uniqueFilename);
                fs.writeFileSync(tempFilePath, buffer);

                const imageUrlForClient = `/generated_images_temp/${uniqueFilename}`;
                const imageIdFromServer = `gemini_draw_${Date.now()}`; // Your system's ID for this image

                console.log(`BACKEND AI Draw: Gemini image generated and saved as ${uniqueFilename}`);
                res.json({
                    success: true,
                    imageUrl: imageUrlForClient, // URL client uses to display the image
                    imageId: imageIdFromServer,
                    filename: uniqueFilename,
                    message: 'Image generated from sketch using Gemini!'
                });
            } else {
                console.error("BACKEND AI Draw: No image part found in Gemini response. Parts:", candidate.content.parts);
                throw new Error('Gemini generated content, but no image data was found.');
            }
        } else {
            const blockReason = response.promptFeedback?.blockReason;
            const safetyRatings = response.promptFeedback?.safetyRatings || [];
            let feedbackMsg = 'Image generation from sketch failed with Gemini.';
            if(blockReason) feedbackMsg += ` Reason: ${blockReason}.`;
            if(safetyRatings.length > 0) feedbackMsg += ` Safety: ${JSON.stringify(safetyRatings)}`;
            console.error('BACKEND AI Draw: Gemini error:', feedbackMsg, response);
            throw new Error(feedbackMsg);
        }

    } catch (error) {
        console.error('BACKEND AI Draw - Overall Error:', error);
        let errorMessage = 'Failed to generate image from sketch using Gemini service.';
        if(error.message) errorMessage = error.message;
        if (error.response && error.response.data && error.response.data.error) { // For Gaxios like errors if genAI used it
            errorMessage = `Gemini Service Error: ${error.response.data.error}`;
        }
        res.status(500).json({ success: false, message: errorMessage, errorDetails: error.toString() });
    }
});


module.exports = router;