// frontend/src/pages/AiTextImgScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCurrentItem } from '../contexts/CurrentItemContext';
import apiService from '../services/apiService';

// Mockup color maps
const frontColorMap = {
  black: '/tshirtmockups/blacktshirt.png', // Ensure this is a FRONT view
  red: '/tshirtmockups/redfront.png',
  navy: '/tshirtmockups/bluefront.png', // Use a specific navy front
  brown: '/tshirtmockups/brownfront.png',
  cream: '/tshirtmockups/creamfront.png',
  white: '/tshirtmockups/whitefront.png',
};
const backColorMap = {
  black: '/tshirtmockups/blackback.png',
  red: '/tshirtmockups/backred.png',     // e.g., redback.png
  navy: '/tshirtmockups/backblue.png',    // e.g., navyback.png
  brown: '/tshirtmockups/backbrown.png',  // e.g., brownback.png
  cream: '/tshirtmockups/backcream.png',  // e.g., creamback.png
  white: '/tshirtmockups/backwhite.png',  // e.g., whiteback.png
};


const AiTextImgScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentItem, setCustomization, DEFAULT_CUSTOMIZATION_POSITION, updateCurrentItem } = useCurrentItem();

  const queryParams = new URLSearchParams(location.search);
  const view = queryParams.get('view') || 'front'; // 'front' or 'back'

  const [promptInput, setPromptInput] = useState('');
  const [displayedImageUrl, setDisplayedImageUrl] = useState(null); 
  const [currentImageId, setCurrentImageId] = useState(null); 
  const [currentFilename, setCurrentFilename] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [status, setStatusState] = useState({ message: 'Describe the image you want to create...', type: 'info' });
  
  const [imageGeneratedThisInteraction, setImageGeneratedThisInteraction] = useState(false);
  const [backgroundRemovedThisInteraction, setBackgroundRemovedThisInteraction] = useState(false);

  const [imageStyle, setImageStyle] = useState({}); // For simple load animation
  const initialImageStyle = { opacity: 0, transform: 'scale(0.95)', transition: 'opacity 0.5s ease, transform 0.5s ease' };
  const loadedImageStyle = { opacity: 1, transform: 'scale(1)' };
  
  // T-shirt preview state
  const [isPreviewFront, setIsPreviewFront] = useState(view === 'front');
  const tshirtColor = currentItem?.color || 'black';
  
  const tshirtSrc = isPreviewFront 
    ? frontColorMap[tshirtColor.toLowerCase()] || frontColorMap.black
    : backColorMap[tshirtColor.toLowerCase()] || backColorMap.black;


  const resetForNewGeneration = useCallback((statusMsg = 'Describe the image you want to create...', statusType = 'info') => {
    setDisplayedImageUrl(null);
    setCurrentImageId(null);
    setCurrentFilename(null);
    setImageGeneratedThisInteraction(false);
    setBackgroundRemovedThisInteraction(false);
    setStatusState({ message: statusMsg, type: statusType });
    setImageStyle(initialImageStyle);
  }, []);

  // Load existing customization or reset
  useEffect(() => {
    // Ensure currentItem has essential properties (size, thickness) before proceeding
    if (!currentItem || !currentItem.id || !currentItem.size || !currentItem.thicknessName) {
        console.error("AiTextImgScreen: Incomplete currentItem (missing ID, size, or thickness). Redirecting.");
        // alert("Please select T-shirt size and thickness first.");
        navigate('/size-selection'); 
        return;
    }
    setIsPreviewFront(view === 'front'); // Sync preview with the intended design view

    const activeSideCustomization = view === 'front' ? currentItem.frontCustomization : currentItem.backCustomization;

    if (activeSideCustomization && activeSideCustomization.type === 'ai_text_image') {
      setPromptInput(activeSideCustomization.prompt || '');
      setDisplayedImageUrl(activeSideCustomization.src || null);
      setCurrentImageId(activeSideCustomization.imageId || null);
      setCurrentFilename(activeSideCustomization.filename || null);
      setImageGeneratedThisInteraction(!!activeSideCustomization.src);
      setBackgroundRemovedThisInteraction(activeSideCustomization.removedBackground || false);
      setStatusState({ message: 'Loaded existing AI design for this side.', type: 'info' });
      if (activeSideCustomization.src) setImageStyle(loadedImageStyle);
    } else {
      // If no relevant customization, reset the fields for this screen
      setPromptInput(''); // Clear prompt for a new design on this side
      resetForNewGeneration();
    }
  }, [currentItem, view, navigate, resetForNewGeneration]); // resetForNewGeneration added


  const handleGenerateImage = async () => { /* ... same as your provided version, no changes needed for back view logic here ... */ 
    if (!promptInput.trim()) {
        setStatusState({ message: 'Please enter a prompt text.', type: 'error' });
        return;
      }
      setIsLoading(true);
      resetForNewGeneration('Generating your creative image via backend...', 'info');
  
      try {
        const sessionId = currentItem?.sessionId || "session_placeholder"; 
        const kioskId = currentItem?.kioskId || "kiosk_placeholder";
  
        const response = await apiService.generateAiTextToImage({ prompt: promptInput, sessionId, kioskId });
        
        if (response.success && response.imageUrl) {
          setDisplayedImageUrl(response.imageUrl); 
          setCurrentImageId(response.imageId);
          setCurrentFilename(response.filename);
          setImageGeneratedThisInteraction(true);
          setStatusState({ message: 'Image generated and stored on server!', type: 'success' });
          setImageStyle(initialImageStyle); // For animation
          setTimeout(() => setImageStyle(loadedImageStyle), 50); 
        } else {
          setStatusState({ message: response.message || 'Failed to generate image via backend.', type: 'error' });
        }
      } catch (error) {
        console.error("Error generating image via backend:", error);
        setStatusState({ message: error.message || 'An unexpected error occurred with backend.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
  };

  const handleRemoveBackground = async () => { /* ... same as your provided version, no changes needed for back view logic here ... */
    if (!displayedImageUrl) {
        setStatusState({ message: 'No image to process. Generate an image first.', type: 'error' });
        return;
      }
  
      setIsRemovingBg(true);
      setStatusState({ message: 'Requesting background removal via backend...', type: 'info' });
      setImageStyle(initialImageStyle);
  
      try {
          const imageResponse = await fetch(displayedImageUrl);
          if (!imageResponse.ok) throw new Error("Could not fetch current image for BG removal.");
          const imageBlob = await imageResponse.blob();
          
          const reader = new FileReader();
          reader.readAsDataURL(imageBlob);
          reader.onloadend = async () => {
              const base64data = reader.result;
              const sessionId = currentItem?.sessionId || "session_placeholder";
              const kioskId = currentItem?.kioskId || "kiosk_placeholder";
  
              const response = await apiService.removeBackgroundImage({ imageBase64: base64data, sessionId, kioskId });
  
              if (response.success && response.imageUrl) {
                  setDisplayedImageUrl(response.imageUrl); 
                  setCurrentImageId(response.imageId);
                  setCurrentFilename(response.filename);
                  setBackgroundRemovedThisInteraction(true);
                  setStatusState({ message: 'Background removed and new image stored on server!', type: 'success' });
                  setImageStyle(initialImageStyle); 
                  setTimeout(() => setImageStyle(loadedImageStyle), 50);
              } else {
                  setStatusState({ message: response.message || 'Failed to remove background via backend.', type: 'error' });
                  setImageStyle(loadedImageStyle); 
              }
              setIsRemovingBg(false);
          };
          reader.onerror = (error) => {
              console.error("FileReader error for BG removal input:", error);
              setIsRemovingBg(false);
              setStatusState({ message: 'Error preparing image for background removal request.', type: 'error'});
              setImageStyle(loadedImageStyle);
          };
      } catch (error) {
        console.error("Error removing background via backend:", error);
        setStatusState({ message: error.message || 'An unexpected error occurred with backend BG removal.', type: 'error' });
        setIsRemovingBg(false);
        setImageStyle(loadedImageStyle);
      }
  };

  const handleConfirmImage = () => {
    if (!displayedImageUrl || !imageGeneratedThisInteraction || !currentImageId) {
      setStatusState({ message: 'No valid server image to confirm.', type: 'error' });
      return;
    }
    const customizationDetails = {
      type: 'ai_text_image',
      src: displayedImageUrl,       
      imageId: currentImageId,        
      filename: currentFilename,    
      prompt: promptInput,
      removedBackground: backgroundRemovedThisInteraction,
      // Use DEFAULT_CUSTOMIZATION_POSITION from context for initial placement
      position: { ...(DEFAULT_CUSTOMIZATION_POSITION || {x:10,y:10,width:150,height:50}) } 
    };
    // `setCustomization` from context saves to the correct side (front or back) based on `view`
    setCustomization(view, customizationDetails); 
    console.log(`AI_SCREEN: Confirmed server image for ${view}. ImageID: ${currentImageId}`);
    navigate('/order-preview');
  };

  // --- Styles ---
  const styles = { 
    pageContainer: { width: '2240px', height: '1400px', position: 'relative', background: 'white', overflow: 'hidden', fontFamily: 'Inter, sans-serif'},
    mainContent: { width: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '70px', gap: '30px' },
    title: { color: '#00566F', fontSize: '72px', fontFamily: "'SS Magnetic', sans-serif", marginBottom: '20px', textAlign: 'center'},
    backArrow: { width: '100px', height: '100px', position: 'absolute', left: '80px', top: '70px', cursor: 'pointer' },
    inputRow: { display: 'flex', gap: '20px', width: '100%', alignItems: 'center', marginBottom: '10px' },
    promptInput: { flexGrow: 1, height: '100px', fontSize: '32px', padding: '0 25px', borderRadius: '12px', border: '2px solid #00566F', backgroundColor: '#F4FAFF' },
    button: { height: '100px', padding: '0 35px', borderRadius: '12px', color: 'white', fontSize: '32px', fontFamily: 'Inter', fontWeight: 600, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'background-color 0.3s, opacity 0.3s' },
    statusMessage: { minHeight: '36px', fontWeight: 600, fontSize: '24px', padding: '8px 20px', borderRadius: '8px', color: '#fff', textAlign: 'center', marginBottom: '10px', width: 'fit-content', alignSelf: 'center' },
    previewLayout: { display: 'flex', width: '100%', justifyContent: 'space-between', gap: '40px', marginTop:'20px' },
    tshirtMockupContainer: { width: '500px', height: '500px', background: '#e0e0e0', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow:'hidden' },
    tshirtMockupImage: { maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' },
    aiImageContainer: { width: '660px', height: '500px', background: '#f0f0f0', border: `2px dashed #00566F`, borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
    spinner: { width: '50px', height: '50px', border: '5px solid rgba(0,0,0,0.1)', borderLeftColor: '#00566F', borderRadius: '50%', animation: 'spin 1s linear infinite', position: 'absolute' },
    actionsRow: { display: 'flex', gap: '25px', justifyContent: 'center', width: '100%', marginTop: '20px' },
  };
  const generateButtonStyle = { ...styles.button, backgroundColor: '#00566F', minWidth: '250px' };
  const removeBgButtonStyle = { ...styles.button, backgroundColor: '#E67E22', minWidth: '250px' };
  const confirmButtonStyle = { ...styles.button, backgroundColor: '#27AE60', minWidth: '200px' };
  const disabledStyle = { opacity: 0.6, cursor: 'not-allowed' };
  const getStatusBackgroundColor = () => { if (status.type === 'error') return '#E74C3C'; if (status.type === 'success') return '#2ECC71'; if (isLoading || isRemovingBg) return 'rgba(0,86,111,0.1)'; return 'rgba(0,0,0,0.05)'; };
  const getStatusColor = () => { if (isLoading || isRemovingBg || status.type === 'info') return '#00566F'; return '#fff'; };


  return (
    <div style={styles.pageContainer}>
      <Link to="/feature-display"> {/* Simpler back navigation for now */}
        <img style={styles.backArrow} src="/Features_Display_Img/back arrow.png" alt="Back" />
      </Link>
      
      <div style={styles.mainContent}>
        <div style={styles.title}>AI Text to Image ({view === 'front' ? 'Front' : 'Back'})</div>

        <div style={styles.inputRow}>
          <input type="text" style={styles.promptInput} placeholder="A cat wearing a chef hat, detailed..." value={promptInput} onChange={(e) => setPromptInput(e.target.value)} disabled={isLoading || isRemovingBg}/>
          <button style={{ ...generateButtonStyle, ...(isLoading || isRemovingBg || !promptInput.trim() ? disabledStyle : {}) }} onClick={handleGenerateImage} disabled={isLoading || isRemovingBg || !promptInput.trim()} >
            {isLoading ? 'Generating...' : 'Generate ✨'}
          </button>
        </div>

        {status.message && ( <div style={{...styles.statusMessage, backgroundColor: getStatusBackgroundColor(), color: getStatusColor()}}> {status.message} </div> )}

        <div style={styles.previewLayout}>
            <div style={styles.tshirtMockupContainer}>
                <img 
                    src={tshirtSrc} 
                    alt={`T-shirt ${view} Preview`} 
                    style={styles.tshirtMockupImage}
                    onError={(e) => { e.target.src = frontColorMap.black; /* Fallback */ }}
                />
                 {/* Optional: Overlay generated image on T-shirt preview for AI screen too */}
                 {/* This preview is static and small, not the main editable one */}
                {displayedImageUrl && !(isLoading || isRemovingBg) && (
                    <img 
                        src={displayedImageUrl} 
                        alt="Generated Preview" 
                        style={{
                            position: 'absolute',
                            width: '40%', // Adjust size as needed for preview
                            height: '40%',
                            objectFit: 'contain',
                            opacity: 0.8, // Slight transparency
                            top: '30%', // Adjust position
                        }}
                    />
                )}
            </div>
            <div style={styles.aiImageContainer}>
                {(isLoading || isRemovingBg) && <div style={styles.spinner} />}
                {displayedImageUrl && !(isLoading || isRemovingBg) && (
                <img src={displayedImageUrl} alt={promptInput || 'AI Generated Image'} style={{...initialImageStyle, ...imageStyle, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} onLoad={() => setImageStyle(loadedImageStyle)} onError={() => { setStatusState({message: "Error displaying generated image.", type: 'error'}); setDisplayedImageUrl(null);}} />
                )}
                {!displayedImageUrl && !(isLoading || isRemovingBg) && (<p style={{color: '#6c757d', fontSize:'20px', textAlign:'center'}}>Generated image will appear here</p>)}
            </div>
        </div>


        <div style={styles.actionsRow}>
          <button style={{ ...removeBgButtonStyle, ...(!imageGeneratedThisInteraction || isLoading || isRemovingBg ? disabledStyle : {}) }} onClick={handleRemoveBackground} disabled={!imageGeneratedThisInteraction || isLoading || isRemovingBg} >
            {isRemovingBg ? 'Processing...' : 'Remove BG ✂️'}
          </button>
          <button style={{ ...confirmButtonStyle, ...(!imageGeneratedThisInteraction || isLoading || isRemovingBg ? disabledStyle : {}) }} onClick={handleConfirmImage} disabled={!imageGeneratedThisInteraction || isLoading || isRemovingBg} >
            Confirm 👍
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AiTextImgScreen;