// src/services/apiService.js

// --- Constants (from your Ai_Text_Img_Screen.html) ---
// You should move these to a .env file in a real application
const HF_AUTH_TOKEN = "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"; // Your Hugging Face Token
const HF_API_ENDPOINT = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
const REMOVE_BG_API_KEY = "D7Q8tXR4h5bzFv2jzuEY5BPN"; // Your Remove.bg API Key
const REMOVE_BG_API_ENDPOINT = "https://api.remove.bg/v1.0/removebg";

const apiService = {
  /**
   * Simulates generating an image from text using a placeholder.
   * In a real app, this would call the Hugging Face API.
   * @param {object} data - Contains { prompt: string }
   * @returns {Promise<object>} - { success: boolean, imageUrl: string (blob URL), blob: Blob, message?: string }
   */
  generateAiTextToImage: async ({ prompt }) => {
    console.log(`apiService.generateAiTextToImage called with prompt: "${prompt}"`);
    if (!prompt) {
      return { success: false, message: "Prompt cannot be empty." };
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // --- SIMULATED API CALL ---
    // In a real scenario, you'd fetch from HF_API_ENDPOINT
    // For now, use a placeholder image URL
    try {
      const placeholderText = encodeURIComponent(`AI: ${prompt.substring(0, 30)}...`);
      const placeholderUrl = `https://via.placeholder.com/512x512/00566F/FFFFFF?text=${placeholderText}`;
      
      const response = await fetch(placeholderUrl);
      if (!response.ok) {
        throw new Error(`Placeholder image fetch failed: ${response.statusText}`);
      }
      const imageBlob = await response.blob();
      const imageUrl = URL.createObjectURL(imageBlob);

      console.log("apiService: Simulated image generation successful.", { imageUrl, imageBlob });
      return { success: true, imageUrl, blob: imageBlob };

    } catch (error) {
      console.error("apiService: Error in simulated image generation:", error);
      return { success: false, message: error.message || "Failed to simulate image generation." };
    }
    // --- END SIMULATED API CALL ---

    
    // --- REAL HUGGING FACE API CALL (Example) ---
    try {
      if (!HF_AUTH_TOKEN || !HF_AUTH_TOKEN.startsWith("hf_")) {
        return { success: false, message: "Hugging Face API Token is invalid or missing." };
      }
      const response = await fetch(HF_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: prompt }),
      });

      if (!response.ok) {
        let errorDetails = `HF API Error (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorDetails += `: ${errorData.error}`;
            if (errorData.estimated_time) errorDetails += ` (Est. time: ${Math.round(errorData.estimated_time)}s)`;
          }
        } catch (e) { console.warn("Could not parse HF error JSON", e); }
        throw new Error(errorDetails);
      }

      const imageBlob = await response.blob();
      if (!imageBlob.type.startsWith("image/")) {
        throw new Error("HF API did not return an image.");
      }
      const imageUrl = URL.createObjectURL(imageBlob);
      return { success: true, imageUrl, blob: imageBlob };

    } catch (error) {
      console.error('apiService: HF Generation failed:', error);
      return { success: false, message: error.message || "Hugging Face API request failed." };
    }
    // --- END REAL HUGGING FACE API CALL ---
    
  },

  /**
   * Simulates removing background from an image using a placeholder.
   * In a real app, this would call the Remove.bg API.
   * @param {object} data - Contains { imageBase64?: string, imageBlob?: Blob }
   * @returns {Promise<object>} - { success: boolean, imageUrl: string (blob URL), blob: Blob, message?: string }
   */
  removeBackgroundImage: async ({ imageBase64, imageBlob }) => {
    console.log("apiService.removeBackgroundImage called");
    if (!imageBlob && !imageBase64) {
        return { success: false, message: "No image data provided for background removal." };
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // --- SIMULATED API CALL ---
    try {
        // Create a slightly modified placeholder to indicate BG removal
        const placeholderText = encodeURIComponent(`BG Removed Image`);
        const placeholderUrl = `https://via.placeholder.com/512x512/FFFFFF/00566F?text=${placeholderText}`; // Inverted colors

        const response = await fetch(placeholderUrl);
        if (!response.ok) {
            throw new Error(`Placeholder image fetch failed (BG removal): ${response.statusText}`);
        }
        const newImageBlob = await response.blob();
        const newImageUrl = URL.createObjectURL(newImageBlob);

        console.log("apiService: Simulated background removal successful.", { newImageUrl, newImageBlob });
        return { success: true, imageUrl: newImageUrl, blob: newImageBlob };

    } catch (error) {
        console.error("apiService: Error in simulated BG removal:", error);
        return { success: false, message: error.message || "Failed to simulate background removal." };
    }
    // --- END SIMULATED API CALL ---

    
    // --- REAL REMOVE.BG API CALL (Example using Blob) ---
    try {
        if (!REMOVE_BG_API_KEY || REMOVE_BG_API_KEY.startsWith("YOUR_") || REMOVE_BG_API_KEY.length < 10) {
             return { success: false, message: "Remove.bg API Key is invalid or missing." };
        }
        const formData = new FormData();
        if (imageBlob instanceof Blob) {
            formData.append('image_file', imageBlob, 'imageToProcess.png');
        } else if (imageBase64) {
            // Remove.bg might prefer specific base64 formats or direct file upload.
            // This example focuses on Blob. If using base64, you might need to convert it
            // to a blob first or send as `image_file_b64`.
             return { success: false, message: "Base64 upload to Remove.bg not fully implemented in this example; use Blob." };
        }
        formData.append('size', 'auto'); // Other options: 'preview', 'hd', etc.

        const response = await fetch(REMOVE_BG_API_ENDPOINT, {
            method: 'POST',
            headers: {
            'X-Api-Key': REMOVE_BG_API_KEY,
            // 'Content-Type' is set automatically by FormData
            },
            body: formData,
        });

        if (!response.ok) {
            let errorDetails = `Remove.bg API Error (${response.status})`;
            try {
                const errorData = await response.json();
                if (errorData.errors && errorData.errors[0] && errorData.errors[0].title) {
                    errorDetails += `: ${errorData.errors[0].title}`;
                }
            } catch (e) { console.warn("Could not parse Remove.bg error JSON", e); }
            throw new Error(errorDetails);
        }

        const resultImageBlob = await response.blob();
         if (!resultImageBlob.type.startsWith("image/")) {
            throw new Error("Remove.bg API did not return an image after processing.");
        }
        const resultImageUrl = URL.createObjectURL(resultImageBlob);
        return { success: true, imageUrl: resultImageUrl, blob: resultImageBlob };

    } catch (error) {
        console.error('apiService: Remove.bg failed:', error);
        return { success: false, message: error.message || "Remove.bg API request failed." };
    }
    // --- END REAL REMOVE.BG API CALL ---
    
  },
};

export default apiService;