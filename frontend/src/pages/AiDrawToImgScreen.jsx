// frontend/src/pages/AiDrawToImageScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// REMOVE: import { ReactSketchCanvas } from 'react-sketch-canvas'; // If you were using this, remove it
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useCurrentItem } from '../contexts/CurrentItemContext';
import apiService from '../services/apiService';
import { LoaderCircle, SendHorizontal, Trash2, RotateCcw } from 'lucide-react';

const frontColorMap = { black: '/tshirtmockups/blacktshirt.png', red: '/tshirtmockups/redfront.png', navy: '/tshirtmockups/navyfront.png', brown: '/tshirtmockups/brownfront.png', cream: '/tshirtmockups/creamfront.png', white: '/tshirtmockups/whitefront.png',};
const backColorMap = { black: '/tshirtmockups/blackback.png', red: '/tshirtmockups/redback.png', navy: '/tshirtmockups/navyback.png', brown: '/tshirtmockups/brownback.png', cream: '/tshirtmockups/creamback.png', white: '/tshirtmockups/whiteback.png',};

const CANVAS_WIDTH_INTERNAL = 960; 
const CANVAS_HEIGHT_INTERNAL = 540;
const CANVAS_DISPLAY_WIDTH = 550; 
const CANVAS_DISPLAY_HEIGHT = 420;

const DEFAULT_STROKE_COLOR = '#000000';
const DEFAULT_STROKE_WIDTH = 4;
const CANVAS_BACKGROUND_COLOR = '#FFFFFF'; 

const API_KEY = process.env.GEMINI_API_KEY;
let genAI, model;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
} else {
    console.error("FATAL: AiDrawToImageScreen - Gemini API Key is not defined.");
}

const AiDrawToImageScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentItem, setCustomization, DEFAULT_CUSTOMIZATION_POSITION } = useCurrentItem();

  const queryParams = new URLSearchParams(location.search);
  const view = queryParams.get('view') || 'front';

  const canvasRef = useRef(null);      
  const [ctx, setCtx] = useState(null); 
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPaths, setDrawingPaths] = useState([]); 
  const [currentPath, setCurrentPath] = useState([]);  

  const [strokeColor] = useState(DEFAULT_STROKE_COLOR);
  const [strokeWidth] = useState(DEFAULT_STROKE_WIDTH);

  const [prompt, setPrompt] = useState('');
  const [geminiGeneratedImageDataUrl, setGeminiGeneratedImageDataUrl] = useState(null); 
  const [finalStoredImageUrl, setFinalStoredImageUrl] = useState(null); 
  const [finalStoredImageId, setFinalStoredImageId] = useState(null);
  const [finalStoredFilename, setFinalStoredFilename] = useState(null);
  const [isLoading, setIsLoading] = useState(false); 
  const [isStoring, setIsStoring] = useState(false); 
  const [status, setStatusState] = useState({ message: 'Draw a sketch and describe your desired image.', type: 'info' });
  const [imageConfirmedByGemini, setImageConfirmedByGemini] = useState(false);
  const [canvasKey, setCanvasKey] = useState(Date.now());

  const isPreviewFront = view === 'front';
  const tshirtColor = currentItem?.color || 'black';
  const tshirtSrc = isPreviewFront 
    ? frontColorMap[tshirtColor.toLowerCase()] || frontColorMap.black
    : backColorMap[tshirtColor.toLowerCase()] || backColorMap.black;

  // Initialize canvas context and set initial background
  useEffect(() => {
    if (canvasRef.current) {
      const canvasElement = canvasRef.current;
      canvasElement.width = CANVAS_WIDTH_INTERNAL;
      canvasElement.height = CANVAS_HEIGHT_INTERNAL;
      const context = canvasElement.getContext('2d');
      context.lineCap = 'round';
      context.lineJoin = 'round';
      // strokeStyle and lineWidth will be set per path or before drawing
      setCtx(context);
      
      context.fillStyle = CANVAS_BACKGROUND_COLOR;
      context.fillRect(0, 0, canvasElement.width, canvasElement.height);
      setDrawingPaths([]); // Clear paths history on init or view change (covered by key)
      setCurrentPath([]);
    }
  }, [canvasKey]); // Rerun when canvasKey changes (e.g. view flip)

  // Redraw canvas when paths change (e.g., after undo or during drawing)
  useEffect(() => {
    if (ctx && canvasRef.current) {
        // Clear with background color
        ctx.fillStyle = CANVAS_BACKGROUND_COLOR;
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Redraw completed paths
        drawingPaths.forEach(path => {
            if (path.points.length < 1) return; // Need at least one point to start
            ctx.beginPath();
            ctx.moveTo(path.points[0].x, path.points[0].y);
            for (let i = 1; i < path.points.length; i++) {
                ctx.lineTo(path.points[i].x, path.points[i].y);
            }
            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.width;
            ctx.stroke();
        });
        // Redraw current path being actively drawn (provides smoother drawing feedback)
        if (isDrawing && currentPath.length > 1) {
            ctx.beginPath();
            ctx.moveTo(currentPath[0].x, currentPath[0].y);
            for (let i = 1; i < currentPath.length; i++) {
                ctx.lineTo(currentPath[i].x, currentPath[i].y);
            }
            ctx.strokeStyle = strokeColor; 
            ctx.lineWidth = strokeWidth;   
            ctx.stroke();
        }
    }
  }, [drawingPaths, currentPath, ctx, strokeColor, strokeWidth, isDrawing]); // Added isDrawing to re-render live path

  useEffect(() => { /* ... for checking currentItem basics and loading existing ai_draw_image ... */
    if (!API_KEY || !genAI || !model) {
        setStatusState({ message: "AI Drawing Service is not configured correctly (API Key).", type: "error" });
        setIsLoading(false); return;
    }
    if (!currentItem || !currentItem.id || !currentItem.size || !currentItem.thicknessName) {
      navigate('/size-selection'); return;
    }
    
    const activeSideCustomization = view === 'front' ? currentItem.frontCustomization : currentItem.backCustomization;
    if (activeSideCustomization && activeSideCustomization.type === 'ai_draw_image') {
        setPrompt(activeSideCustomization.prompt || '');
        setFinalStoredImageUrl(activeSideCustomization.src || null); 
        setFinalStoredImageId(activeSideCustomization.imageId || null);
        setFinalStoredFilename(activeSideCustomization.filename || null);
        setImageConfirmedByGemini(!!activeSideCustomization.src); 
        setGeminiGeneratedImageDataUrl(activeSideCustomization.src); 
        setStatusState({ message: 'Loaded existing AI drawn design.', type: 'info'});
    } else {
        setPrompt('');
        setGeminiGeneratedImageDataUrl(null);
        setFinalStoredImageUrl(null); setFinalStoredImageId(null); setFinalStoredFilename(null);
        setImageConfirmedByGemini(false);
        setStatusState({ message: 'Draw a sketch and describe your desired image.', type: 'info' });
    }
    setCanvasKey(Date.now()); // Force re-initialization of canvas drawing state
   }, [currentItem, view, navigate]);

  const getCoordinates = (event) => { /* ... same as before ... */ 
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX !== undefined ? event.clientX : event.touches?.[0]?.clientX;
    const clientY = event.clientY !== undefined ? event.clientY : event.touches?.[0]?.clientY;
    if (clientX === undefined || clientY === undefined) return { x: 0, y: 0 }; 
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY};
  };
  
  // MODIFIED: Event Handlers for Drawing (used in useEffect below)
  const handleDrawingStart = useCallback((event) => {
    if (isLoading || isStoring || !ctx) return;
    event.preventDefault(); // Call preventDefault based on event type
    const { x, y } = getCoordinates(event.touches ? event.touches[0] : event);
    setCurrentPath([{ x, y }]); 
    setIsDrawing(true);
    if (imageConfirmedByGemini || geminiGeneratedImageDataUrl) {
        setGeminiGeneratedImageDataUrl(null); setImageConfirmedByGemini(false);
        setStatusState({ message: 'Sketch modified. Generate again.', type: 'info' });
    }
  }, [isLoading, isStoring, ctx, imageConfirmedByGemini, geminiGeneratedImageDataUrl]);

  const handleDrawingMove = useCallback((event) => {
    if (!isDrawing || !ctx) return;
    event.preventDefault();
    const { x, y } = getCoordinates(event.touches ? event.touches[0] : event);
    setCurrentPath(prevPath => [...prevPath, { x, y }]);
  }, [isDrawing, ctx]);

  const handleDrawingEnd = useCallback(() => {
    if (!isDrawing) return;
    if (currentPath.length > 1) { // Only add path if it has more than a single point
        setDrawingPaths(prevPaths => [...prevPaths, {points: [...currentPath], color: strokeColor, width: strokeWidth}]);
    }
    setCurrentPath([]); 
    setIsDrawing(false);
  }, [isDrawing, currentPath, strokeColor, strokeWidth]);

  // Effect for attaching canvas event listeners with passive: false
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && ctx) { // Ensure canvas and context are ready
      // Mouse events
      canvas.addEventListener('mousedown', handleDrawingStart);
      canvas.addEventListener('mousemove', handleDrawingMove);
      canvas.addEventListener('mouseup', handleDrawingEnd);
      canvas.addEventListener('mouseleave', handleDrawingEnd); // Also end drawing if mouse leaves

      // Touch events with passive: false
      canvas.addEventListener('touchstart', handleDrawingStart, { passive: false });
      canvas.addEventListener('touchmove', handleDrawingMove, { passive: false });
      canvas.addEventListener('touchend', handleDrawingEnd);
      canvas.addEventListener('touchcancel', handleDrawingEnd); // Handle touch cancel

      return () => {
        canvas.removeEventListener('mousedown', handleDrawingStart);
        canvas.removeEventListener('mousemove', handleDrawingMove);
        canvas.removeEventListener('mouseup', handleDrawingEnd);
        canvas.removeEventListener('mouseleave', handleDrawingEnd);
        canvas.removeEventListener('touchstart', handleDrawingStart);
        canvas.removeEventListener('touchmove', handleDrawingMove);
        canvas.removeEventListener('touchend', handleDrawingEnd);
        canvas.removeEventListener('touchcancel', handleDrawingEnd);
      };
    }
  }, [ctx, handleDrawingStart, handleDrawingMove, handleDrawingEnd]); // Dependencies

  const isCanvasEffectivelyEmpty = () => drawingPaths.length === 0 && currentPath.length === 0;
  const handleGenerateImage = async () => { /* ... same Gemini API call logic ... */ };
  const handleConfirmAndStoreImage = async () => { /* ... same image storage and context update ... */ };

  const clearCanvasUserAction = () => { 
    if (ctx && canvasRef.current) {
      ctx.fillStyle = CANVAS_BACKGROUND_COLOR;
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setDrawingPaths([]); setCurrentPath([]);
    setGeminiGeneratedImageDataUrl(null); setImageConfirmedByGemini(false);
    setStatusState({message:'Canvas cleared.', type:'info'});
  };
  const undoLastStroke = () => { 
    if (drawingPaths.length > 0) {
        setDrawingPaths(prevPaths => prevPaths.slice(0, -1));
        if (imageConfirmedByGemini || geminiGeneratedImageDataUrl) {
            setGeminiGeneratedImageDataUrl(null); setImageConfirmedByGemini(false);
            setStatusState({message: 'Sketch changed after undo. Generate again.', type:'info'});
        }
    }
  };

  // --- Styles ---
  const styles = { /* ... (same simplified styles as before) ... */ 
    pageContainer: { width: '2240px', height: '1400px', position: 'relative', background: 'white', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }, topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '40px 60px 0', width: 'calc(100% - 120px)' }, title: { color: '#00566F', fontSize: '64px', fontFamily: "'SS Magnetic', sans-serif", textAlign: 'center', flexGrow: 1, marginBottom:'10px' }, backArrow: { width: '80px', height: '80px', cursor: 'pointer' }, mainLayout: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '50px', padding: '20px', width: '100%', boxSizing:'border-box' }, leftPanel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '600px', flexShrink:0 }, tshirtMockupContainer: { width: '100%', height: '480px', background: '#f0f8ff', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow:'hidden', border:'1px solid #ddd'}, tshirtMockupImage: { maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }, generatedImagePreviewSmall: { position: 'absolute', width: '40%', height: '40%', objectFit: 'contain', opacity: 0.8, top: '30%', border: '1px dashed #aaa', background:'rgba(255,255,255,0.5)' }, promptInput: { width: '100%', height: '70px', fontSize: '26px', padding: '0 20px', borderRadius: '10px', border: '2px solid #00566F', backgroundColor: '#F4FAFF', boxSizing: 'border-box', marginTop:'15px'}, canvasControlsSimplified: { display: 'flex', gap: '20px', alignItems: 'center', marginTop: '20px', width:'100%', justifyContent:'center'}, controlButtonSimplified: { padding: '10px 25px', fontSize: '22px', borderRadius: '10px', border: '1px solid #00566F', cursor: 'pointer', background: 'white', color: '#00566F', display:'flex', alignItems:'center', gap:'8px', transition: 'background-color 0.2s'}, rightPanel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: `${CANVAS_DISPLAY_WIDTH + 60}px`, flexShrink:0 }, 
    drawingCanvasOuterContainer: {width: `${CANVAS_DISPLAY_WIDTH}px`, height: `${CANVAS_DISPLAY_HEIGHT}px`, border: '2px solid #00566F', borderRadius: '12px', overflow: 'hidden', background: CANVAS_BACKGROUND_COLOR, position:'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', touchAction: 'none' },
    htmlCanvasElementStyle: { display: 'block', width: '100%', height: '100%' }, 
    generatedImageContainer: { marginTop: '20px', width: CANVAS_DISPLAY_WIDTH, height: CANVAS_DISPLAY_HEIGHT, background: '#e0e0e0', border: `2px dashed #00566F`, borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative'}, statusMessage: { minHeight: '30px', fontWeight: 500, fontSize: '20px', padding: '8px 20px', borderRadius: '8px', textAlign: 'center', width: 'auto', maxWidth:'90%', margin:'10px auto' }, actionButtonsRow: { display: 'flex', gap: '30px', justifyContent: 'center', marginTop: '40px', width: '100%'}, generateButton: { padding: '15px 45px', fontSize: '32px', fontFamily: 'Inter', fontWeight: 600, borderRadius: '12px', background: '#00566F', color: 'white', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px' }, confirmButton: { padding: '15px 45px', fontSize: '32px', fontFamily: 'Inter', fontWeight: 600, borderRadius: '12px', background: '#27AE60', color: 'white', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px'  }, disabledStyle: { opacity: 0.5, cursor: 'not-allowed' }, spinner: { width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.1)', borderLeftColor: '#00566F', borderRadius: '50%', animation: 'spin 1s linear infinite', position: 'absolute' },
  };
  const getStatusBackgroundColor = () => { /* ... */ };
  const getStatusColor = () => { /* ... */ };


  if (!currentItem) return <div style={{padding:"20px", textAlign:'center'}}>Loading...</div>;
  if (!API_KEY || !genAI || !model) return <div style={{ padding: "20px", textAlign: 'center', color: 'red', fontSize: '20px' }}>AI Service Error.</div>;

  return (
    <div style={styles.pageContainer}>
      <div style={styles.topBar}>
        <Link to="/feature-display"><img style={styles.backArrow} src="/Features_Display_Img/back arrow.png" alt="Back" /></Link>
        <div style={styles.title}>AI Draw & Imagine ({view})</div>
        <div style={{width: '80px'}}></div>
      </div>

      {status.message && (<div style={{...styles.statusMessage, backgroundColor: getStatusBackgroundColor(), color: getStatusColor()}}>{status.message}</div>)}

      <div style={styles.mainLayout}>
        <div style={styles.leftPanel}>
          <div style={styles.tshirtMockupContainer}>
            <img src={tshirtSrc} alt={`T-shirt ${view} Preview`} style={styles.tshirtMockupImage} onError={(e) => { e.target.src = isPreviewFront ? frontColorMap.black : backColorMap.black;}}/>
            {(geminiGeneratedImageDataUrl || finalStoredImageUrl) && !(isLoading || isStoring) && (
              <img src={finalStoredImageUrl || geminiGeneratedImageDataUrl} alt="Generated Preview" style={styles.generatedImagePreviewSmall} />
            )}
          </div>
          <input type="text" style={styles.promptInput} placeholder="Describe the image (e.g., 'a happy cloud')" value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={isLoading || isStoring}/>
          <div style={styles.canvasControlsSimplified}>
            <button onClick={undoLastStroke} style={styles.controlButtonSimplified} title="Undo Sketch" disabled={drawingPaths.length === 0}><RotateCcw size={22}/>Undo</button>
            <button onClick={clearCanvasUserAction} style={styles.controlButtonSimplified} title="Clear Sketch & Reset"><Trash2 size={22}/>Clear All</button>
          </div>
        </div>

        <div style={styles.rightPanel}>
            <div style={styles.drawingCanvasOuterContainer}>
                <canvas
                    key={canvasKey} // Use key to help re-initialize canvas if needed
                    ref={canvasRef}
                    // Event handlers are now attached in useEffect
                    style={styles.htmlCanvasElementStyle}
                />
            </div>
            <div style={styles.generatedImageContainer}>
            {(isLoading || isStoring) && <div style={styles.spinner} />}
            {!isLoading && !isStoring && geminiGeneratedImageDataUrl && (
              <img src={geminiGeneratedImageDataUrl} alt="AI Generated from Sketch" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} 
                   onError={() => {setStatusState({message: "Error displaying new AI image.", type: 'error'}); setGeminiGeneratedImageDataUrl(null); setImageConfirmedByGemini(false);}}/>
            )}
            {!isLoading && !isStoring && !geminiGeneratedImageDataUrl && finalStoredImageUrl && (
                <img src={finalStoredImageUrl} alt="Previously Saved AI Drawn Image" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}}
                    onError={() => {setStatusState({message: "Error displaying saved AI image.", type: 'error'}); setFinalStoredImageUrl(null); }}/>
            )}
            {!isLoading && !isStoring && !geminiGeneratedImageDataUrl && !finalStoredImageUrl && (<p style={{color: '#6c757d', fontSize:'18px', textAlign:'center', padding:'10px'}}>AI Generated Image will appear here</p>)}
          </div>
        </div>
      </div>
      
      <div style={styles.actionButtonsRow}>
        <button 
          style={{...styles.generateButton, ...((isLoading || isStoring || !prompt.trim() || isCanvasEffectivelyEmpty()) ? styles.disabledStyle : {}) }} 
          onClick={handleGenerateImage} 
          disabled={isLoading || isStoring || !prompt.trim() || isCanvasEffectivelyEmpty()}
        >
          <SendHorizontal size={26} style={{marginRight:'10px'}} />
          {isLoading ? 'Generating...' : (imageConfirmedByGemini || geminiGeneratedImageDataUrl ? 'Re-Generate' : 'Generate Image')}
        </button>
        <button 
          style={{...styles.confirmButton, ...((!imageConfirmedByGemini && !finalStoredImageUrl) || isLoading || isStoring ? styles.disabledStyle : {}) }} 
          onClick={handleConfirmAndStoreImage} 
          disabled={(!imageConfirmedByGemini && !finalStoredImageUrl) || isLoading || isStoring}
        >
          {isStoring ? 'Saving...' : 'Confirm & Use'}
        </button>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
export default AiDrawToImageScreen;   