// frontend/src/pages/AiDrawToImgScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// import CartIndicator from '../components/common/CartIndicator'; // For later
// import { useCurrentItem } from '../../contexts/CurrentItemContext'; // For later

// Placeholder values, similar to those in OrderPreviewScreen for resizable guide
const UI_RESIZABLE_GUIDE_DEFAULT_WIDTH = 75;
const UI_RESIZABLE_GUIDE_DEFAULT_HEIGHT = 122;

const AiDrawToImgScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const view = queryParams.get('view') || 'front';

  // --- State Management ---
  const [drawingPrompt, setDrawingPrompt] = useState('');
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState(null); // For the AI enhanced image
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmEnabled, setConfirmEnabled] = useState(false);

  // Refs for interactive elements
  const drawingCanvasAreaRef = useRef(null); // Placeholder for actual canvas integration
  const previewImageRef = useRef(null); // For the <img> tag
  const resizableGuideRef = useRef(null); // For the inner resizable guide

  // Simulate currentItem from localStorage (to be replaced by context)
  const [currentItem, setCurrentItemState] = useState(() => {
    const savedItem = localStorage.getItem('currentConfiguredItem');
    return savedItem ? JSON.parse(savedItem) : {
      id: Date.now() + "_config", productType: 'T-Shirt', size: null, color: 'black',
      thickness: null, thicknessName: null, frontCustomization: null, backCustomization: null, quantity: 1
    };
  });

  const updateCurrentItem = (updates) => {
    const newItem = { ...currentItem, ...updates };
    setCurrentItemState(newItem);
    localStorage.setItem('currentConfiguredItem', JSON.stringify(newItem));
  };

  useEffect(() => {
    const savedGlobalItem = localStorage.getItem('currentConfiguredItem');
    if (savedGlobalItem) {
        const parsedGlobalItem = JSON.parse(savedGlobalItem);
        setCurrentItemState(parsedGlobalItem); // Sync local state

        const relevantCustomization = view === 'front' ? parsedGlobalItem.frontCustomization : parsedGlobalItem.backCustomization;
        if (relevantCustomization && relevantCustomization.type === 'ai_draw_image') {
            setDrawingPrompt(relevantCustomization.prompt || '');
            setGeneratedPreviewUrl(relevantCustomization.src || null);
            setConfirmEnabled(!!relevantCustomization.src);
            // Position for resizable guide would also be restored here
            if (relevantCustomization.position && resizableGuideRef.current) {
                resizableGuideRef.current.style.left = `${relevantCustomization.position.x}px`;
                resizableGuideRef.current.style.top = `${relevantCustomization.position.y}px`;
                resizableGuideRef.current.style.width = `${relevantCustomization.position.width}px`;
                resizableGuideRef.current.style.height = `${relevantCustomization.position.height}px`;
            }
        }
    }
    if (!currentItem.size || !currentItem.thickness) {
        alert("Error: T-shirt size or thickness not selected. Please go back and select them.");
        navigate('/size-selection');
    }
    // Placeholder for drawing canvas initialization (e.g., p5.js, fabric.js)
    // For now, we just show the placeholder text.
    if (drawingCanvasAreaRef.current) {
        // Initialize your drawing library here if you had one
        console.log("Drawing canvas area is ready.");
    }

  }, [view, navigate, currentItem.size, currentItem.thickness]);


  const handleGenerateDrawing = async () => {
    setIsGenerating(true);
    setConfirmEnabled(false);
    setGeneratedPreviewUrl(null);

    // TODO: Get drawing data from the actual canvas (e.g., as base64)
    const drawingDataFromCanvas = "simulated_drawing_data"; // Placeholder

    console.log(`Simulating AI enhancement for drawing with prompt: "${drawingPrompt}"`);
    // Placeholder for actual API call
    // const response = await apiService.enhanceDrawingWithAI({ drawingData: drawingDataFromCanvas, prompt: drawingPrompt });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay

    const simulatedImageUrl = `https://via.placeholder.com/700x600.png/00566F/FFFFFF?text=DrawnImg+${view}+${Date.now()}`;
    // const simulatedBlob = await fetch(simulatedImageUrl).then(res => res.blob());
    // const blobUrl = URL.createObjectURL(simulatedBlob); // If API returns blob

    setIsGenerating(false);
    // if (response.success && response.imageUrl) {
    //   setGeneratedPreviewUrl(response.imageUrl);
    if (simulatedImageUrl) { // Using direct URL for placeholder simplicity
      setGeneratedPreviewUrl(simulatedImageUrl);
      setConfirmEnabled(true);
      if (resizableGuideRef.current && previewImageRef.current) {
        // Reset and show the guide
        resizableGuideRef.current.style.display = 'block';
        resizableGuideRef.current.style.width = `${UI_RESIZABLE_GUIDE_DEFAULT_WIDTH}px`;
        resizableGuideRef.current.style.height = `${UI_RESIZABLE_GUIDE_DEFAULT_HEIGHT}px`;
        // Center it roughly within the preview area initially, adjust as needed
        resizableGuideRef.current.style.left = `calc(50% - ${UI_RESIZABLE_GUIDE_DEFAULT_WIDTH / 2}px)`;
        resizableGuideRef.current.style.top = `calc(50% - ${UI_RESIZABLE_GUIDE_DEFAULT_HEIGHT / 2}px)`;
      }
    } else {
      console.error("Failed to generate enhanced image (Simulated).");
      // Handle error display
    }
  };

  const handleConfirmDrawing = () => {
    if (!generatedPreviewUrl || !resizableGuideRef.current) {
      alert("Please generate an image first.");
      return;
    }

    const guide = resizableGuideRef.current;
    const positionData = {
      x: parseInt(guide.style.left, 10) || 0,
      y: parseInt(guide.style.top, 10) || 0,
      width: guide.offsetWidth,
      height: guide.offsetHeight,
    };

    const customizationDetails = {
      type: 'ai_draw_image',
      src: generatedPreviewUrl, // Could be a blob URL or a server-hosted URL
      prompt: drawingPrompt,
      position: positionData, // Position of the resizable guide relative to preview image
      // Cost for ai_draw_image would be +₹50 based on Feature_Display.html
    };

    const updatedItem = { ...currentItem };
    if (view === 'front') {
      updatedItem.frontCustomization = customizationDetails;
    } else {
      updatedItem.backCustomization = customizationDetails;
    }
    updateCurrentItem(updatedItem);
    navigate('/order-preview');
  };

  // --- Styles (directly translated or inferred) ---
  const pageHeaderTitleStyle = {
    position: 'absolute', left: '50%', top: '117px', transform: 'translateX(-50%)',
    color: '#00566F', fontSize: '96px', fontFamily: 'SS Magnetic, sans-serif',
    fontWeight: 400, textAlign: 'center', width: '100%', whiteSpace: 'nowrap',
  };
  const backArrowStyle = {
    width: '120px', height: '120px', left: '127px', top: '94px', position: 'absolute'
  };
  const drawingAreaStyle = {
    width: '1206px', height: '667px', left: '79px', top: '366px', position: 'absolute',
    borderRadius: '16px', border: '2px solid #00566f', backgroundColor: '#e0efff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#999', fontSize: '28px', fontStyle: 'italic',
  };
  const previewAreaStyle = {
    width: '811px', height: '667px', left: '1327px', top: '366px', position: 'absolute',
    backgroundColor: '#F4FAFF', borderRadius: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid #ccc', position: 'relative', // For positioning the resizable guide
  };
  const generatedPreviewImageStyle = {
    display: generatedPreviewUrl ? 'block' : 'none',
    maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
    borderRadius: '8px', position: 'relative', zIndex: 0,
  };
  const canvaGuideInnerResizableStyle = {
    width: `${UI_RESIZABLE_GUIDE_DEFAULT_WIDTH}px`, // Initial size, will be updated
    height: `${UI_RESIZABLE_GUIDE_DEFAULT_HEIGHT}px`,
    border: '1px solid rgba(0,86,111,0.7)', backgroundColor: 'rgba(0,86,111,0.2)',
    position: 'absolute', resize: 'both', overflow: 'hidden', // 'auto' was in original, hidden usually better for design tool
    minWidth: '50px', minHeight: '50px',
    boxSizing: 'border-box', pointerEvents: 'auto', zIndex: 1,
    display: generatedPreviewUrl ? 'block' : 'none', // Show only when there's an image
    cursor: 'grab',
    // Max width/height can be dynamically set based on previewImageRef.current.offsetWidth/Height in an effect
  };
  const promptInputDrawStyle = {
    width: '934px', height: '135px', left: '79px', top: '1079px', position: 'absolute',
    border: '2px solid #00566F', backgroundColor: '#F4FAFF', borderRadius: '16px',
    color: '#00566F', paddingLeft: '20px', boxSizing: 'border-box',
    fontSize: '36px', fontFamily: 'Inter, sans-serif', fontWeight: 600,
  };
  const generateDrawingBtnStyle = {
    width: '272px', height: '135px', left: '1030px', top: '1079px', position: 'absolute',
    backgroundColor: '#00566F', border: 'none', borderRadius: '16px', color: 'white',
    fontSize: '36px', fontFamily: 'Inter, sans-serif', fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  };
  const confirmDrawingBtnStyle = {
    width: '329px', height: '123px', left: '1809px', top: '1079px', position: 'absolute',
    backgroundColor: confirmEnabled && !isGenerating ? '#00566F' : 'rgba(0, 86, 111, 0.5)',
    borderRadius: '16px', color: 'white',
    fontSize: '48px', fontFamily: 'Inter, sans-serif', fontWeight: 700,
    cursor: confirmEnabled && !isGenerating ? 'pointer' : 'not-allowed', border: 'none',
  };

  // Drag and resize logic for canvaGuideInnerResizable would go here
  // This is a simplified version. Real drag/resize is more complex.
  useEffect(() => {
    const guide = resizableGuideRef.current;
    const previewBox = guide?.parentElement;
    if (!guide || !previewBox) return;

    let isDraggingGuide = false;
    let startX, startY, startLeft, startTop;

    const onMouseDownGuide = (e) => {
        if (e.target === guide) { // Only drag if mousedown is on the guide itself, not children (if any) or resize handles
            isDraggingGuide = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = guide.offsetLeft;
            startTop = guide.offsetTop;
            guide.style.cursor = 'grabbing';
            document.body.style.cursor = 'grabbing'; // Optional: change cursor globally
            e.preventDefault();
        }
    };
    const onMouseMoveDocument = (e) => {
        if (!isDraggingGuide) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        let newLeft = startLeft + deltaX;
        let newTop = startTop + deltaY;

        // Basic boundary checks (relative to previewBox)
        const maxLeft = previewBox.offsetWidth - guide.offsetWidth;
        const maxTop = previewBox.offsetHeight - guide.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        guide.style.left = `${newLeft}px`;
        guide.style.top = `${newTop}px`;
    };
    const onMouseUpDocument = () => {
        if (isDraggingGuide) {
            isDraggingGuide = false;
            guide.style.cursor = 'grab';
            document.body.style.cursor = 'auto';
        }
    };

    guide.addEventListener('mousedown', onMouseDownGuide);
    document.addEventListener('mousemove', onMouseMoveDocument);
    document.addEventListener('mouseup', onMouseUpDocument);

    return () => {
        guide.removeEventListener('mousedown', onMouseDownGuide);
        document.removeEventListener('mousemove', onMouseMoveDocument);
        document.removeEventListener('mouseup', onMouseUpDocument);
    };
  }, [generatedPreviewUrl]); // Re-attach if preview URL changes (image reloads)


  return (
    <> {/* PageContainer wraps this */}
      {/* <CartIndicator /> */}
      <Link to="/feature-display">
        <img style={backArrowStyle} src="/Features_Display_Img/back arrow.png" alt="Back" />
      </Link>
      <div style={pageHeaderTitleStyle}>AI Draw to Image ({view === 'front' ? 'Front' : 'Back'})</div>

      <div ref={drawingCanvasAreaRef} style={drawingAreaStyle}>
        {/* This area would host your actual drawing canvas component (e.g., p5.js, Fabric.js instance) */}
        Interactive Drawing Canvas - Placeholder
      </div>

      <div style={previewAreaStyle}>
        <img ref={previewImageRef} id="generatedPreviewImage" src={generatedPreviewUrl || ""} alt="AI Enhanced Drawing Preview" style={generatedPreviewImageStyle} />
        <div ref={resizableGuideRef} className="canva-guide-inner-resizable" style={canvaGuideInnerResizableStyle}>
          {/* Content inside resizable guide, if any (e.g., if it frames a portion of the image) */}
        </div>
      </div>

      <input
        type="text"
        style={promptInputDrawStyle}
        id="promptInputDraw"
        placeholder="Optionally, add a text prompt to guide the AI..."
        value={drawingPrompt}
        onChange={(e) => setDrawingPrompt(e.target.value)}
        disabled={isGenerating}
      />
      <button
        style={generateDrawingBtnStyle}
        id="generateDrawingBtn"
        onClick={handleGenerateDrawing}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate'}
        <img src="/Features_Display_Img/aiicon.png" alt="AI Icon" style={{ width: '46px', height: '46px', marginLeft: '10px' }} />
      </button>
      <button
        style={confirmDrawingBtnStyle}
        id="confirmDrawBtn"
        onClick={handleConfirmDrawing}
        disabled={!confirmEnabled || isGenerating}
      >
        Confirm
      </button>
    </>
  );
};

export default AiDrawToImgScreen;