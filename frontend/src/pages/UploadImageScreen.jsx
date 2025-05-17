// frontend/src/pages/UploadImageScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import io from 'socket.io-client';
import { useCurrentItem } from '../contexts/CurrentItemContext';
import CartIndicator from '../components/common/CartIndicator'; // Ensure path is correct

const UI_OUTER_PRINTABLE_PIXEL_WIDTH = 300; // Width of the dashed Rnd parent on mockup
const UI_OUTER_PRINTABLE_PIXEL_HEIGHT = 488; // Height of the dashed Rnd parent on mockup
const DYNAMIC_MIN_CANVA_WIDTH_UPLOAD = 50;
const DYNAMIC_MIN_CANVA_HEIGHT_UPLOAD = 50;

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

const NODE_SERVER_BASE_URL = import.meta.env.VITE_NODE_SERVER_URL || 'http://localhost:5001';
const socketRef = React.createRef();

const UploadImageScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const contextValue = useCurrentItem();
  if (!contextValue) {
    console.error("UploadImageScreen FATAL: CurrentItemContext not available!");
    return <div style={{padding: "50px", color: "red", textAlign: "center", fontSize: "24px"}}>Critical Error: Item Configuration System Failed. Please restart.</div>;
  }
  const { currentItem, updateCurrentItem, setCustomization, DEFAULT_CUSTOMIZATION_POSITION } = contextValue;

  const queryParams = new URLSearchParams(location.search);
  const view = queryParams.get('view') || 'front';

  const [isFrontViewLocal, setIsFrontViewLocal] = useState(view === 'front');
  const tshirtColor = currentItem?.color || 'black';
  
  const currentSideCust = view === 'front' ? currentItem?.frontCustomization : currentItem?.backCustomization;
  
  const defaultRndPosSize = DEFAULT_CUSTOMIZATION_POSITION || {x:10, y:10, width:150, height:150};
  const [rndPosition, setRndPosition] = useState(currentSideCust?.position || defaultRndPosSize);
  const [rndSize, setRndSize] = useState({ 
    width: currentSideCust?.position?.width || defaultRndPosSize.width, 
    height: currentSideCust?.position?.height || defaultRndPosSize.height 
  });
  const [currentDisplayBlobUrl, setCurrentDisplayBlobUrl] = useState(currentSideCust?.type === 'uploaded_image' ? currentSideCust.src : null);
  const [currentDisplayOriginalFilename, setCurrentDisplayOriginalFilename] = useState(currentSideCust?.type === 'uploaded_image' ? currentSideCust.originalFileName : null);

  const [isScanCardVisible, setIsScanCardVisible] = useState(true);
  const [isFlipCardShowingUploadQR, setIsFlipCardShowingUploadQR] = useState(true);
  const [uploadQrSrc, setUploadQrSrc] = useState('');
  const [qrLoadingMessage, setQrLoadingMessage] = useState('Initializing upload service...');
  const [kioskUploadStatus, setKioskUploadStatus] = useState({ message: '', type: '' });
  const [socketConnected, setSocketConnected] = useState(false);
  
  // *** THIS WAS THE MISSING LINE ***
  const outerPrintableAreaRef = useRef(null); 
  // *********************************

  const instanceLocalBlobUrlRef = useRef(null);

  useEffect(() => {
    if (!currentItem || !currentItem.id || !currentItem.size || !currentItem.thicknessName) {
      console.error("UploadImageScreen: Incomplete currentItem. Redirecting.");
      navigate('/size-selection');
      return;
    }
    setIsFrontViewLocal(view === 'front');

    const existingCustForView = view === 'front' ? currentItem.frontCustomization : currentItem.backCustomization;
    if (existingCustForView && existingCustForView.type === 'uploaded_image') {
      setCurrentDisplayBlobUrl(existingCustForView.src); 
      setCurrentDisplayOriginalFilename(existingCustForView.originalFileName);
      setRndPosition(existingCustForView.position || defaultRndPosSize);
      setRndSize({
          width: existingCustForView.position?.width || defaultRndPosSize.width,
          height: existingCustForView.position?.height || defaultRndPosSize.height,
      });
      setIsScanCardVisible(false); 
      setIsFlipCardShowingUploadQR(false); 
    } else {
      setCurrentDisplayBlobUrl(null);
      setCurrentDisplayOriginalFilename(null);
      setRndPosition(defaultRndPosSize);
      setRndSize(defaultRndPosSize);
      setIsScanCardVisible(true);
      setIsFlipCardShowingUploadQR(true);
    }
  }, [currentItem, view, navigate, defaultRndPosSize]);


  const revokePreviousInstanceBlob = useCallback(() => {
    if (instanceLocalBlobUrlRef.current) {
        URL.revokeObjectURL(instanceLocalBlobUrlRef.current);
        instanceLocalBlobUrlRef.current = null;
    }
  }, []);

  const showKioskStatus = useCallback((message, type = 'info', duration = 4500) => {
    setKioskUploadStatus({ message, type });
    setTimeout(() => {
      setKioskUploadStatus(prevStatus => (prevStatus.message === message ? { message: '', type: '' } : prevStatus));
    }, type === 'error' ? Math.max(duration, 7000) : duration);
  }, []);


  const fetchAndSetUploadQr = useCallback(() => {
    const currentSocket = socketRef.current;
    if (currentSocket && currentSocket.connected && currentSocket.id && isScanCardVisible && isFlipCardShowingUploadQR) {
      const sideForQr = view; 
      const qrUrlFromServer = `${NODE_SERVER_BASE_URL}/qr_code_kiosk.png?kioskId=${encodeURIComponent(currentSocket.id)}&side=${encodeURIComponent(sideForQr)}&t=${Date.now()}`;
      setQrLoadingMessage('Loading QR Code...');
      setUploadQrSrc(''); 
      const img = new Image();
      img.onload = () => { setUploadQrSrc(qrUrlFromServer); setQrLoadingMessage(''); showKioskStatus(`Scan QR to upload image for the ${sideForQr}.`, 'info', 10000); };
      img.onerror = () => { setQrLoadingMessage('Error loading QR.'); setUploadQrSrc('/placeholder-qr.png'); showKioskStatus('Error loading QR code from server.', 'error');};
      img.src = qrUrlFromServer;
    } else if (isScanCardVisible && isFlipCardShowingUploadQR) {
        setQrLoadingMessage('Upload service connecting...');
        if (currentSocket && !currentSocket.connected && !currentSocket.connecting) {
            currentSocket.connect();
        } else if (!currentSocket){
             console.error("UploadImageScreen: fetchAndSetUploadQr - socketRef.current is null.");
        }
    }
  }, [isScanCardVisible, isFlipCardShowingUploadQR, showKioskStatus, view]);

  useEffect(() => {
    if(isScanCardVisible && isFlipCardShowingUploadQR && socketConnected){
        fetchAndSetUploadQr();
    } else if (isScanCardVisible && !isFlipCardShowingUploadQR) {
        setQrLoadingMessage(''); setUploadQrSrc('');
    } else if (!isScanCardVisible) {
        setQrLoadingMessage(''); setUploadQrSrc('');
    }
  }, [isScanCardVisible, isFlipCardShowingUploadQR, fetchAndSetUploadQr, socketConnected]);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(NODE_SERVER_BASE_URL, {
        autoConnect: false, transports: ['websocket', 'polling'],
        reconnectionAttempts: 3, reconnectionDelay: 3000, timeout: 5000,
      });
    }
    const localSocket = socketRef.current;
    const onConnect = () => { setSocketConnected(true); showKioskStatus('Upload service active!', 'success'); };
    const onKioskDisplayImage = async (data) => {
        if (data && data.imageDataUrl && data.side && data.originalFileName && data.side === view) {
          revokePreviousInstanceBlob();
          let imageBlob, clientDisplayUrl;
          try {
            const fetchRes = await fetch(data.imageDataUrl);
            if (!fetchRes.ok) throw new Error(`Failed to fetch image: ${fetchRes.status}`);
            imageBlob = await fetchRes.blob();
            if (!imageBlob.type.startsWith('image/')) throw new Error (`Fetched data not an image: ${imageBlob.type}`);
            clientDisplayUrl = URL.createObjectURL(imageBlob);
            instanceLocalBlobUrlRef.current = clientDisplayUrl; 
            setCurrentDisplayBlobUrl(clientDisplayUrl);
            setCurrentDisplayOriginalFilename(data.originalFileName);
            // Reset position/size for newly uploaded image
            const defaultPos = DEFAULT_CUSTOMIZATION_POSITION || { x: 10, y: 10, width: 150, height: 150 };
            setRndPosition({x: defaultPos.x, y: defaultPos.y});
            setRndSize({width: defaultPos.width, height: defaultPos.height});
          } catch (e) { console.error("Error processing received image data:", e); showKioskStatus("Error displaying uploaded image.", "error"); return; }
          
          const customizationData = { 
            type: 'uploaded_image', 
            src: clientDisplayUrl, 
            _blobDataForUpload: imageBlob, 
            originalFileName: data.originalFileName, 
            position: { ...(DEFAULT_CUSTOMIZATION_POSITION || {x:10,y:10,width:150,height:150})} 
          };
          setCustomization(view, customizationData);
          showKioskStatus(`Image "${data.originalFileName}" applied to ${view}!`, "success");
          setIsScanCardVisible(false); 
          setIsFlipCardShowingUploadQR(false); 
        } else if (data && data.side !== view) {
            showKioskStatus(`Image received for the ${data.side} side. Flip view to see it.`, "info", 6000);
        } else { showKioskStatus("Error: Invalid image data received from server.", "error"); }
    };
    const onDisconnect = (reason) => { setSocketConnected(false); showKioskStatus(`Upload service disconnected: ${reason}.`, "error"); };
    const onConnectError = (error) => { setSocketConnected(false); showKioskStatus(`Cannot connect: ${error.message}.`, "error", 7000);};

    localSocket.on('connect', onConnect); localSocket.on('kiosk_display_image', onKioskDisplayImage);
    localSocket.on('disconnect', onDisconnect); localSocket.on('connect_error', onConnectError);
    if (!localSocket.connected && !localSocket.connecting) { localSocket.connect(); } 
    else if (localSocket.connected && !socketConnected) { setSocketConnected(true); }

    return () => {
      revokePreviousInstanceBlob();
      if (localSocket) {
        localSocket.disconnect();
        localSocket.off('connect', onConnect); localSocket.off('kiosk_display_image', onKioskDisplayImage);
        localSocket.off('disconnect', onDisconnect); localSocket.off('connect_error', onConnectError);
      }
    };
  }, [view, revokePreviousInstanceBlob, showKioskStatus, setCustomization, DEFAULT_CUSTOMIZATION_POSITION]);


  const handleRndInteractionEnd = useCallback((newPositionAndSize) => {
    const activeCustForSide = view === 'front' ? currentItem?.frontCustomization : currentItem?.backCustomization;
    if (activeCustForSide && activeCustForSide.type === 'uploaded_image' && activeCustForSide.src) {
      const currentPosInContext = activeCustForSide.position || {};
      if (Math.abs(currentPosInContext.x - newPositionAndSize.x) > 0.01 || Math.abs(currentPosInContext.y - newPositionAndSize.y) > 0.01 ||
          Math.abs(currentPosInContext.width - newPositionAndSize.width) > 0.01 || Math.abs(currentPosInContext.height - newPositionAndSize.height) > 0.01 ||
          !activeCustForSide.position) {
        const updatedCustomization = { ...activeCustForSide, position: newPositionAndSize };
        setCustomization(view, updatedCustomization);
      }
    }
  }, [currentItem, setCustomization, view]);

  const handleColorChange = (colorName) => { updateCurrentItem({ color: colorName }); };
  
  const handleFlipView = () => { 
    if (currentDisplayBlobUrl) {
        handleRndInteractionEnd({x: rndPosition.x, y: rndPosition.y, width: rndSize.width, height: rndSize.height});
    }
    const newView = view === 'front' ? 'back' : 'front';
    navigate(`/upload-image?view=${newView}`);
    // State will re-sync based on `view` from URL in useEffect
  };

  const handleDeleteCustomization = () => { 
      revokePreviousInstanceBlob(); 
      setCurrentDisplayBlobUrl(null);
      setCurrentDisplayOriginalFilename(null);
      setCustomization(view, null); 
      setIsScanCardVisible(true); 
      setIsFlipCardShowingUploadQR(true); 
      showKioskStatus('Image removed.', 'info');
  };
  
  const toggleScanCard = useCallback(() => {
    setIsScanCardVisible(prev => {
        const newVisibility = !prev;
        if (newVisibility && !isFlipCardShowingUploadQR) {
            setIsFlipCardShowingUploadQR(false); 
        }
        if (!newVisibility) {
            setUploadQrSrc(''); 
            setQrLoadingMessage('');
        }
        return newVisibility;
    });
  }, [isFlipCardShowingUploadQR]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'S') { e.preventDefault(); toggleScanCard();}};
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleScanCard]);

  const handleNext = () => {
    if (currentDisplayBlobUrl) {
        handleRndInteractionEnd({x: rndPosition.x, y: rndPosition.y, width: rndSize.width, height: rndSize.height});
    }
    setTimeout(() => navigate('/order-preview'), 50);
  };
  
  const tshirtSrcToDisplay = isFrontViewLocal 
    ? frontColorMap[tshirtColor.toLowerCase()] || frontColorMap.black
    : backColorMap[tshirtColor.toLowerCase()] || backColorMap.black;

  const canProceed = !!currentDisplayBlobUrl; 

  // --- Styles (same as before, ensure they are complete in your actual file) ---
  const pageContainerStyle = { width: '2240px', height: '1400px', position: 'relative', background: 'white', overflow: 'hidden', fontFamily: 'Inter, sans-serif' };
  const leftPreviewPanelStyle = { width: '792px', height: '975px', left: '113px', top: '285px', position: 'absolute', background: '#F4F9FF', borderRadius: '12px' };
  const colorBarBgStyle = { width: '792px', height: '134px', top: '841px', position: 'absolute', background: 'rgba(0, 86, 111, 0.08)', boxShadow: '0px -1px 4px rgba(0, 0, 0, 0.13)' };
  const mockupSectionStyle = { position: 'absolute', left: '52px', top: '98px', width: '689px', height: '691px' };
  const tshirtImageStyle = { width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0, zIndex: 0 };
  const outerPrintableAreaCurrentStyle = { // Renamed to avoid conflict with other screen styles
      display: currentDisplayBlobUrl ? 'flex' : 'none', 
      justifyContent: 'center', alignItems: 'center', position: 'absolute', 
      width: `${UI_OUTER_PRINTABLE_PIXEL_WIDTH}px`, height: `${UI_OUTER_PRINTABLE_PIXEL_HEIGHT}px`, 
      border: '2px dashed rgba(0, 86, 111, 0.7)', 
      top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
      boxSizing: 'border-box', zIndex: 5, 
      // pointerEvents: 'none' // Removed: RND needs pointer events for its parent
  };
  const rndWrapperStyle = { border: '1px solid rgba(0,86,111,1)', backgroundColor: 'rgba(0,86,111,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxSizing: 'border-box', cursor: 'grab' };
  const uploadedImagePreviewStyleInRnd = { width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' };
  const colorOptionsStyle = { left: '142px', top: '879px', position: 'absolute', display: 'flex', gap: '30px' };
  const colorDotStyle = (c, isSel) => ({ width: '59px', height: '59px', borderRadius: '50%', cursor: 'pointer', backgroundColor: c.code, border: isSel ? '3px solid #00566F' : c.borderStyle || (c.code === '#ffffff' ? '1px solid #ccc' : 'transparent'), boxShadow: isSel ? '0 0 8px #00566F' : 'none', transition: 'border 0.2s, box-shadow 0.2s' });
  const pageTitleStyle = { width: 'auto', height: '127px', left: '50%', transform: 'translateX(-50%)', top: '91px', position: 'absolute', color: '#00566F', fontSize: '96px', fontFamily: "'SS Magnetic', sans-serif", fontWeight: 400, whiteSpace: 'nowrap', textAlign:'center' };
  const scanCardStyle = { left:'1076px', top:'279px', position: 'absolute', opacity: isScanCardVisible ? 1:0, transform: isScanCardVisible ? 'translateX(0)' : 'translateX(50px)', transition: 'transform 0.5s ease-out, opacity 0.5s ease-out', zIndex: 50, display: isScanCardVisible ? 'block' : 'none' };
  const flipCardStyle = { width: '712px', height: '800px', position: 'relative', transition: 'transform 0.8s', transformStyle: 'preserve-3d', transform: isFlipCardShowingUploadQR ? 'rotateY(180deg)' : 'rotateY(0deg)' };
  const cardFaceBaseStyle = { width: '100%', height: '100%', background: '#F4FAFF', borderRadius: '12px', position: 'absolute', WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display:'flex', flexDirection:'column', justifyContent:'space-around', alignItems:'center', padding:'30px 20px', boxSizing:'border-box' };
  const cardFaceBackStyle = {...cardFaceBaseStyle, transform: 'rotateY(180deg)'};
  const qrCodeImageStyle = { width:'349px', height:'367px', objectFit: 'contain', marginBottom: '15px', backgroundColor:'#fff', border:'1px solid #ddd' }; 
  const uploadInstructionImageTagStyle = { width:'425px', height:'447px', objectFit: 'contain', backgroundColor: 'white', border: '1px solid #eee', marginBottom: '10px'};
  const cardTextStyle = { color: '#00566F', fontSize: '42px', fontFamily: 'Inter', fontWeight: 700, textAlign:'center' };
  const cardInfoTextStyle = {color: '#6298A9', fontSize: '32px', fontFamily: 'Inter', fontWeight: 600, textAlign:'center', lineHeight:'1.4'};
  const cardActionButtonStyle = {width: 'auto', minWidth:'220px', height: '70px', padding:'0 25px', backgroundColor: '#00566F', border: 'none', borderRadius: '12px', color: 'white', fontSize: '32px', cursor: 'pointer', marginTop:'10px', transition: 'background-color 0.2s ease' };
  const nextButtonStyle = { width: '288px', height: '123px', left: '1878px', top: '1192px', position: 'absolute', borderRadius: '15px', color: 'white', fontSize: '48px', fontFamily: 'Inter', fontWeight: 700, border: 'none', backgroundColor: canProceed ? '#00566F' : 'rgba(0,86,111,0.5)', cursor: canProceed ? 'pointer' : 'default', pointerEvents: canProceed ? 'auto':'none'};
  const uploadStatusKioskStyle = { position: 'absolute', left: `calc(1076px + 712px / 2)`, top: `calc(279px + 800px + 20px)`, transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: '5px', fontSize: '28px', fontWeight: 'bold', textAlign: 'center', zIndex: 60, display: kioskUploadStatus.message ? 'block' : 'none', backgroundColor: kioskUploadStatus.type === 'success' ? '#d4edda' : kioskUploadStatus.type === 'error' ? '#f8d7da' : '#d1ecf1', color: kioskUploadStatus.type === 'success' ? '#155724' : kioskUploadStatus.type === 'error' ? '#721c24' : '#0c5460' };
  const backArrowNavStyle = { width: '100px', height: '100px', position: 'absolute', left: '80px', top: '70px', cursor: 'pointer' };
  const flipIconUploadStyle = { width: '80px', height: '80px', position: 'absolute', right: '20px', top: '20px', cursor:'pointer', zIndex: 7 };
  const deleteBtnStyle = { width: '50px', height: '50px', position: 'absolute', right: '20px', bottom: 'calc(134px + 20px)', cursor: 'pointer', zIndex: 7 };

  // Colors data for the color dots on this screen
  const displayColors = [
    { name: 'black', code: '#1e1e1e', borderStyle: 'none' },
    { name: 'red', code: '#8b0000', borderStyle: 'none' },
    { name: 'navy', code: '#002244', borderStyle: 'none' },
    { name: 'brown', code: '#7A4824', borderStyle: 'none' },
    { name: 'cream', code: '#fdf1dc', borderStyle: 'none' },
    { name: 'white', code: '#ffffff', borderStyle: '1px solid #ccc' },
  ];

  return (
    <div style={pageContainerStyle}>
      {/* <CartIndicator /> */}
      <div style={leftPreviewPanelStyle}>
        <div style={colorBarBgStyle}></div>
        <div style={mockupSectionStyle}>
          <img 
            id="tshirt-image" 
            src={tshirtSrcToDisplay} 
            alt={`T-shirt ${view} Mockup`} 
            style={tshirtImageStyle} 
            onError={(e) => { e.target.src = isFrontViewLocal ? frontColorMap.black : backColorMap.black; }}
          />
          {/* outerPrintableAreaRef IS USED HERE for the dashed guide */}
          <div ref={outerPrintableAreaRef} style={outerPrintableAreaCurrentStyle}>
            {currentDisplayBlobUrl && (
              <Rnd
                style={rndWrapperStyle}
                size={{ width: rndSize.width, height: rndSize.height }}
                position={{ x: rndPosition.x, y: rndPosition.y }}
                minWidth={DYNAMIC_MIN_CANVA_WIDTH_UPLOAD} minHeight={DYNAMIC_MIN_CANVA_HEIGHT_UPLOAD}
                bounds="parent"
                onDragStop={(e, d) => { setRndPosition({ x: d.x, y: d.y }); handleRndInteractionEnd({ x: d.x, y: d.y, width: rndSize.width, height: rndSize.height }); }}
                onResizeStop={(e, direction, ref, delta, position) => { const newDims = { x: position.x, y: position.y, width: parseFloat(ref.style.width), height: parseFloat(ref.style.height) }; setRndSize({ width: newDims.width, height: newDims.height }); setRndPosition({x: newDims.x, y: newDims.y }); handleRndInteractionEnd(newDims); }}
                enableResizing={{ bottomRight: true }}
                resizeHandleComponent={{ bottomRight: <div style={{width: '24px', height: '24px', background: 'rgba(0,86,111,0.6)', borderRadius: '50%', border: '2px solid white', cursor: 'nwse-resize', position: 'absolute', right: '-12px', bottom: '-12px'}}/> }}
              >
                <img src={currentDisplayBlobUrl} alt={currentDisplayOriginalFilename || "Uploaded Design"} style={uploadedImagePreviewStyleInRnd} draggable="false" 
                  onError={(e) => {console.error("Error loading RND image for display:", currentDisplayBlobUrl); if(e.target) e.target.style.display='none';}}
                />
              </Rnd>
            )}
          </div>
        </div>
        <div style={colorOptionsStyle}>
          {displayColors.map(c => (
            <div key={c.name} style={colorDotStyle(c, tshirtColor === c.name)} onClick={() => handleColorChange(c.name)} />
          ))}
        </div>
        {currentDisplayBlobUrl && (<img id="deleteCustomizationBtn" src="/QR_Screen_Img/Delete.png" alt="Delete" style={deleteBtnStyle} onClick={handleDeleteCustomization}/>)}
        <img id="flip-icon-upload" style={flipIconUploadStyle} src="/QR_Screen_Img/flip.png" alt="Flip View" onClick={handleFlipView} />
      </div>

      <Link to="/feature-display" onClick={() => {revokePreviousInstanceBlob();}}>
        <img style={backArrowNavStyle} src="/Features_Display_Img/back arrow.png" alt="Back" />
      </Link>
      <div style={pageTitleStyle}>Upload Your Image ({view})</div>

      {isScanCardVisible && (
      <div id="scanCard" style={scanCardStyle}>
        <div id="flipCard" style={flipCardStyle}>
          <div id="frontCard" style={cardFaceBaseStyle}> {/* Wi-Fi Info */}
            <div style={cardTextStyle}>Connect to Store Wi-Fi</div>
            <img id="wifiQrImage" src="/QR_Screen_Img/wifi_qr_placeholder.png" alt="Wi-Fi QR Code" style={qrCodeImageStyle}/>
            <div style={cardInfoTextStyle}>1. Connect phone to "KioskNet" Wi-Fi.<br/>2. Tap 'Next' to scan upload QR.</div>
            <button style={cardActionButtonStyle} onClick={() => {
                const currentSocket = socketRef.current;
                if (currentSocket && currentSocket.connected) { 
                    setIsFlipCardShowingUploadQR(true); 
                } else { 
                    showKioskStatus("Connecting upload service...", "info"); 
                    if (currentSocket && !currentSocket.connecting) currentSocket.connect();
                }
            }}>Next: Upload QR →</button>
          </div>
          <div id="backCard" style={cardFaceBackStyle}> {/* Upload QR */}
            <div style={cardTextStyle}>Scan to Upload to <span>{view}</span></div>
            {qrLoadingMessage && <div style={{...uploadInstructionImageTagStyle, display:'flex', alignItems:'center', justifyContent:'center'}}><p style={{fontSize:'22px', color:'#555'}}>{qrLoadingMessage}</p></div>}
            {!qrLoadingMessage && uploadQrSrc && <img id="uploadInstructionImage" src={uploadQrSrc} alt="Scan to Upload Your Image" style={uploadInstructionImageTagStyle} />}
            {!qrLoadingMessage && !uploadQrSrc && ( <div style={{...uploadInstructionImageTagStyle, display:'flex', alignItems:'center', justifyContent:'center', border:'1px dashed #ccc'}}><p style={{fontSize:'22px', color:'#555'}}>QR loading or service unavailable.</p></div> )}
            <p style={{fontSize:'24px', color:'#555', textAlign:'center', lineHeight: '1.3', marginTop: '10px'}}>Image will appear on T-shirt after phone upload.</p>
            <button style={{...cardActionButtonStyle, backgroundColor: '#555'}} onClick={() => setIsFlipCardShowingUploadQR(false)} >← Wi-Fi Info</button>
          </div>
        </div>
      </div>
      )}
      
      {!isScanCardVisible && currentDisplayBlobUrl && (
          <button 
            onClick={toggleScanCard} 
            style={{...cardActionButtonStyle, position:'absolute', left:'calc(1076px + 712px/2 - 125px)', top:'calc(279px + 800px + 30px)', width:'250px'}}
            title="Re-open QR scanner card"
            >
            Upload Another?
          </button>
      )}

      <button style={nextButtonStyle} onClick={handleNext} disabled={!canProceed}>Next</button>
      <div style={uploadStatusKioskStyle}>{kioskUploadStatus.message}</div>
    </div>
  );
};

export default UploadImageScreen;