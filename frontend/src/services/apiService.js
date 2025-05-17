// frontend/src/services/apiService.js

// DEFINE CONSTANTS FIRST
const BACKEND_AI_TEXT_TO_IMAGE_ENDPOINT = '/api/ai/text-to-image';
const BACKEND_REMOVE_BACKGROUND_ENDPOINT = '/api/ai/remove-background';
const BACKEND_DESIGN_IMAGE_UPLOAD_ENDPOINT = '/api/images/upload-design'; // For new database flow
const BACKEND_CREATE_ORDER_ENDPOINT = '/api/orders/create';

// Helper function to convert Blob to Base64 Data URL
const blobToDataURL = (blob) => {
    return new Promise((resolve, reject) => {
        if (!(blob instanceof Blob)) {
            console.warn("blobToDataURL: Input was not a Blob.", blob);
            // If it's already a data URL or another string, pass it through.
            // If it's something else invalid, resolve with null or reject.
            if (typeof blob === 'string') {
                resolve(blob);
            } else {
                resolve(null); // Or reject(new Error("Invalid input: Not a Blob or Data URL"));
            }
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result);
        };
        reader.onerror = (error) => {
            console.error("FileReader error in blobToDataURL:", error);
            reject(error);
        };
        reader.readAsDataURL(blob);
    });
};

// THEN DEFINE THE apiService OBJECT
const apiService = {
    generateAiTextToImage: async ({ prompt, sessionId, kioskId }) => {
        console.log(`FRONTEND API: generateAiTextToImage prompt: "${prompt}" for session: ${sessionId}`);
        if (!prompt) return { success: false, message: "Prompt cannot be empty."};
        try {
            // Step 1: Get the image blob from the AI proxy (your backend)
            const aiResponse = await fetch(BACKEND_AI_TEXT_TO_IMAGE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!aiResponse.ok) {
                let errorMessage = `AI service error from backend: ${aiResponse.status}`;
                try {
                    const errorBodyText = await aiResponse.text(); // Read error body as text
                    if (errorBodyText) {
                        try {
                            const parsedJsonError = JSON.parse(errorBodyText); // Try to parse it as JSON
                            errorMessage = parsedJsonError.message || errorBodyText.substring(0, 250);
                        } catch (e) {
                            errorMessage = errorBodyText.substring(0, 250); // Not JSON, use text
                        }
                    } else if (aiResponse.statusText) {
                        errorMessage = aiResponse.statusText;
                    }
                } catch (e) {
                    console.error("Error trying to read/parse backend error response body (generateAiTextToImage):", e);
                    errorMessage = aiResponse.statusText || `AI service error: ${aiResponse.status} (unreadable error body)`;
                }
                console.error(`Error details from backend proxy (text-to-image): ${errorMessage}`);
                throw new Error(errorMessage);
            }

            const imageBlob = await aiResponse.blob();
            if (!imageBlob.type || !imageBlob.type.startsWith("image/")) {
                console.error("AI service (via proxy) returned OK but not an image. Type:", imageBlob.type, "Size:", imageBlob.size);
                throw new Error("AI service (via proxy) did not return a valid image format despite successful response.");
            }

            // Step 2: Convert returned blob to Base64 and upload it to your /api/images/upload-design
            const imageDataUrl = await blobToDataURL(imageBlob);
            const tempUploadResponse = await apiService.uploadDesignImage({
                imageDataUrl,
                originalFileName: `ai_generated_${Date.now()}.png`,
                source: 'ai_text', // Indicate where this image came from
                sessionId, 
                kioskId 
            });

            if (!tempUploadResponse.success) { // Check the success flag from uploadDesignImage
                throw new Error(tempUploadResponse.message || "Failed to store AI generated image temporarily on server.");
            }
            // Return the details from the temporary storage service
            return { 
                success: true, 
                imageId: tempUploadResponse.imageId, 
                imageUrl: tempUploadResponse.imageUrl, // This is the /api/images/view/... URL
                filename: tempUploadResponse.filename
            };

        } catch (error) {
            console.error("apiService: FULL Error in generateAiTextToImage flow:", error);
            return { success: false, message: error.message || "Complete AI image generation and storage process failed." };
        }
    },

    removeBackgroundImage: async ({ imageBase64, sessionId, kioskId }) => {
        console.log(`FRONTEND API: removeBackgroundImage for session: ${sessionId}`);
        if (!imageBase64 || !imageBase64.startsWith('data:image')) {
            return { success: false, message: "Valid Base64 image data (with prefix) is required for BG removal."};
        }
        try {
            // Step 1: Get the background-removed image blob from the BG removal proxy
            const bgRemovalResponse = await fetch(BACKEND_REMOVE_BACKGROUND_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64 }), // Send original image (with BG) base64
            });

            if (!bgRemovalResponse.ok) {
                let errorMessage = `BG removal service error from backend: ${bgRemovalResponse.status}`;
                try {
                    const errorBodyText = await bgRemovalResponse.text();
                    const parsedJsonError = JSON.parse(errorBodyText);
                    errorMessage = parsedJsonError.message || errorBodyText.substring(0, 250);
                } catch (e) { errorMessage = (await bgRemovalResponse.text()).substring(0,250) || bgRemovalResponse.statusText || `BG removal service error: ${bgRemovalResponse.status}`; }
                console.error(`Error details from backend proxy (remove-bg): ${errorMessage}`);
                throw new Error(errorMessage);
            }
            const imageBlobNoBg = await bgRemovalResponse.blob();
            if (!imageBlobNoBg.type || !imageBlobNoBg.type.startsWith("image/")) {
                 throw new Error("Background removal service (via proxy) did not return a valid image format.");
            }
            
            // Step 2: Convert new blob (without BG) to Base64 and upload for temporary storage
            const imageDataUrlNoBg = await blobToDataURL(imageBlobNoBg);
            return apiService.uploadDesignImage({ // Re-use uploadDesignImage
                imageDataUrl: imageDataUrlNoBg,
                originalFileName: `bg_removed_${Date.now()}.png`,
                source: 'ai_text_bg_removed', // Indicate this version
                sessionId, kioskId
            });
        } catch (error) {
            console.error("apiService: Error in removeBackgroundImage flow:", error);
            return { success: false, message: error.message || "Complete background removal and storage process failed." };
        }
    },

    uploadDesignImage: async ({ imageDataUrl, originalFileName = 'custom_design.png', source = 'unknown', sessionId, kioskId }) => {
        console.log(`apiService: Uploading design. Source: ${source}, Session: ${sessionId}`);
        if (!sessionId) {
            console.error("apiService.uploadDesignImage: Session ID is missing.");
            return { success: false, message: "Session ID is required for image upload."};
        }
        if (!imageDataUrl || !imageDataUrl.startsWith('data:image')) {
            console.error("apiService.uploadDesignImage: imageDataUrl is missing or invalid.");
            return { success: false, message: "Valid Base64 image data (imageDataUrl) is required."};
        }
        try {
            const response = await fetch(BACKEND_DESIGN_IMAGE_UPLOAD_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageDataUrl, originalFileName, source, sessionId, kioskId }),
            });
            const result = await response.json(); // Always expect JSON from this backend endpoint
            if (!response.ok) {
                throw new Error(result.message || `Image upload HTTP error: ${response.status}`);
            }
            if (!result.success) { // Explicitly check success flag from backend
                throw new Error(result.message || "Backend reported failure for image upload.");
            }
            return result; // Should be { success: true, imageId, imageUrl, filename }
        } catch (error) { 
            console.error("apiService: Error in uploadDesignImage call:", error);
            return { success: false, message: error.message || "Failed to upload design image to server." };
        }
    },

    placeOrder: async (orderPayload) => {
        console.log("apiService: Placing order:", orderPayload);
        try {
            const response = await fetch(BACKEND_CREATE_ORDER_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Order placement failed: ${response.status}`);
            if (!result.success) throw new Error(result.message || "Backend reported order placement failure.");
            return result; // Should be { success: true, orderId, message }
        } catch (error) {
            console.error("apiService: Error placing order:", error);
            return { success: false, message: error.message || "Failed to place order." };
        }
    }
};

export default apiService;