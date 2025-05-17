// frontend/src/hooks/useDraggableResizable.js
import { useState, useEffect, useCallback, useRef } from 'react';

const FALLBACK_MIN_WIDTH_HOOK = 50;
const FALLBACK_MIN_HEIGHT_HOOK = 50;

export const useDraggableResizable = (
    initialElementState, // { x, y, width, height } in PIXELS
    boundsElementRef,    // Ref to the parent bounding DOM element
    onInteractionEnd,    // Callback: (newStateInPixels) => void
    isEnabled = true,
    minDimensionsOverride = {} // Optional: { minWidth, minHeight } in PIXELS
) => {
    const draggableElementRef = useRef(null);
    const interactionState = useRef({
        isInteracting: false,
        interactionType: null,
        startX: 0, startY: 0,
        initialElLeft: 0, initialElTop: 0,
        initialElWidth: 0, initialElHeight: 0,
    });

    const getEffectiveMinDimensions = useCallback(() => {
        const propMinWidth = minDimensionsOverride.minWidth;
        const propMinHeight = minDimensionsOverride.minHeight;
        return {
            width: (typeof propMinWidth === 'number' && propMinWidth > 0) ? propMinWidth : FALLBACK_MIN_WIDTH_HOOK,
            height: (typeof propMinHeight === 'number' && propMinHeight > 0) ? propMinHeight : FALLBACK_MIN_HEIGHT_HOOK,
        };
    }, [minDimensionsOverride.minWidth, minDimensionsOverride.minHeight]);

    const [currentStyle, setCurrentStyle] = useState(() => {
        const { width: minW, height: minH } = getEffectiveMinDimensions();
        const iX = initialElementState?.x || 0;
        const iY = initialElementState?.y || 0;
        const iW = Math.max(minW, initialElementState?.width || minW);
        const iH = Math.max(minH, initialElementState?.height || minH);

        return {
            display: isEnabled ? 'flex' : 'none',
            position: 'absolute',
            left: `${iX}px`,
            top: `${iY}px`,
            width: `${iW}px`,
            height: `${iH}px`,
            border: '2px solid #00566F',
            backgroundColor: 'rgba(0, 86, 111, 0.15)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            cursor: 'grab',
            zIndex: 10,
            userSelect: 'none',
            alignItems: 'center',
            justifyContent: 'center',
        };
    });
    
    useEffect(() => {
        if (!interactionState.current.isInteracting) {
            const { width: minW, height: minH } = getEffectiveMinDimensions();
            const iX = initialElementState?.x || 0;
            const iY = initialElementState?.y || 0;
            const iW = Math.max(minW, initialElementState?.width || minW);
            const iH = Math.max(minH, initialElementState?.height || minH);
            
            setCurrentStyle(prev => ({
                ...prev,
                left: `${iX}px`,
                top: `${iY}px`,
                width: `${iW}px`,
                height: `${iH}px`,
                display: isEnabled ? 'flex' : 'none',
            }));
        }
    }, [initialElementState, isEnabled, getEffectiveMinDimensions]);


    const calculateConstrainedState = useCallback((requestedX, requestedY, requestedWidth, requestedHeight) => {
        const { width: minW, height: minH } = getEffectiveMinDimensions();
        
        if (!boundsElementRef.current) {
            console.warn("useDraggableResizable: Bounds element ref not ready for constraints.");
            return { 
                x: requestedX || 0, 
                y: requestedY || 0, 
                width: Math.max(minW, requestedWidth || minW), 
                height: Math.max(minH, requestedHeight || minH) 
            };
        }

        const boundsWidth = boundsElementRef.current.offsetWidth;
        const boundsHeight = boundsElementRef.current.offsetHeight;

        let newWidth = Math.max(minW, requestedWidth);
        let newHeight = Math.max(minH, requestedHeight);
        newWidth = Math.min(newWidth, boundsWidth);
        newHeight = Math.min(newHeight, boundsHeight);

        let newX = Math.max(0, Math.min(requestedX, boundsWidth - newWidth));
        let newY = Math.max(0, Math.min(requestedY, boundsHeight - newHeight));
        
        // Final clamping if minimums made it go out of bounds from new X,Y
        newWidth = Math.min(newWidth, boundsWidth - newX);
        newHeight = Math.min(newHeight, boundsHeight - newY);
        newWidth = Math.max(minW, newWidth); // re-ensure minimums didn't get violated by clamping
        newHeight = Math.max(minH, newHeight);

        // if width became min and pushes past boundary, re-adjust x
        if (newX + newWidth > boundsWidth) newX = Math.max(0, boundsWidth - newWidth);
        if (newY + newHeight > boundsHeight) newY = Math.max(0, boundsHeight - newHeight);


        return { x: newX, y: newY, width: newWidth, height: newHeight };
    }, [boundsElementRef, getEffectiveMinDimensions]);


    const handleMouseMove = useCallback((e) => {
        if (!interactionState.current.isInteracting || !draggableElementRef.current || !boundsElementRef.current) return;
        e.preventDefault(); e.stopPropagation();

        const { startX, startY, initialElLeft, initialElTop, initialElWidth, initialElHeight, interactionType } = interactionState.current;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let reqX = initialElLeft, reqY = initialElTop, reqW = initialElWidth, reqH = initialElHeight;

        if (interactionType === 'drag') {
            reqX += deltaX;
            reqY += deltaY;
        } else if (interactionType === 'resize-br') {
            reqW += deltaX;
            reqH += deltaY;
        } 
        // Add more resize handles here, e.g.:
        // else if (interactionType === 'resize-tl') {
        //     reqW -= deltaX; reqH -= deltaY;
        //     reqX += deltaX; reqY += deltaY;
        // }
        // else if (interactionType === 'resize-tr') {
        //     reqW += deltaX; reqH -= deltaY;
        //     reqY += deltaY;
        // }
        // ... and so on for all 8 handles if desired

        const constrained = calculateConstrainedState(reqX, reqY, reqW, reqH);
        setCurrentStyle(prev => ({
            ...prev,
            left: `${constrained.x}px`, top: `${constrained.y}px`,
            width: `${constrained.width}px`, height: `${constrained.height}px`,
        }));
    }, [boundsElementRef, calculateConstrainedState]);

    const handleMouseUp = useCallback(() => {
        if (interactionState.current.isInteracting) {
            const el = draggableElementRef.current;
            // Read final dimensions directly from the element's offset to be sure
            const finalState = {
                x: el ? el.offsetLeft : parseFloat(currentStyle.left) || 0,
                y: el ? el.offsetTop : parseFloat(currentStyle.top) || 0,
                width: el ? el.offsetWidth : parseFloat(currentStyle.width) || getEffectiveMinDimensions().width,
                height: el ? el.offsetHeight : parseFloat(currentStyle.height) || getEffectiveMinDimensions().height,
            };
            if (onInteractionEnd) {
                onInteractionEnd(finalState);
            }
            if(draggableElementRef.current) draggableElementRef.current.style.cursor = 'grab';
            document.body.style.cursor = 'auto';
        }
        interactionState.current.isInteracting = false;
        interactionState.current.interactionType = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [currentStyle, onInteractionEnd, handleMouseMove, getEffectiveMinDimensions]);

    const handleMouseDown = useCallback((e) => {
        if (!draggableElementRef.current || !boundsElementRef.current || !isEnabled) return;
        
        const targetIsResizeHandle = e.target.dataset.resizeHandle;
        // Only proceed if the mousedown is on the element itself OR a designated resize handle child.
        if (targetIsResizeHandle || e.target === draggableElementRef.current || draggableElementRef.current.contains(e.target) && !targetIsResizeHandle /* click inside for drag */) {
            
            interactionState.current.isInteracting = true;
            interactionState.current.startX = e.clientX;
            interactionState.current.startY = e.clientY;
            // Ensure these are numbers for calculation
            interactionState.current.initialElLeft = draggableElementRef.current.offsetLeft || 0;
            interactionState.current.initialElTop = draggableElementRef.current.offsetTop || 0;
            interactionState.current.initialElWidth = draggableElementRef.current.offsetWidth || 0;
            interactionState.current.initialElHeight = draggableElementRef.current.offsetHeight || 0;

            if (targetIsResizeHandle) {
                interactionState.current.interactionType = `resize-${e.target.dataset.resizeHandle}`;
                const handleCursor = getComputedStyle(e.target).cursor;
                document.body.style.cursor = handleCursor || 'default';
                if(draggableElementRef.current) draggableElementRef.current.style.cursor = handleCursor || 'default';
            } else { // Assumed drag
                interactionState.current.interactionType = 'drag';
                document.body.style.cursor = 'grabbing';
                if(draggableElementRef.current) draggableElementRef.current.style.cursor = 'grabbing';
            }

            e.preventDefault();
            e.stopPropagation();
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
    }, [boundsElementRef, isEnabled, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        const el = draggableElementRef.current;
        if (el && isEnabled) {
            el.addEventListener('mousedown', handleMouseDown);
            // If you make separate div elements for resize handles and give them data-resize-handle,
            // this will still work because handleMouseDown checks e.target.
            return () => {
                el.removeEventListener('mousedown', handleMouseDown);
                document.removeEventListener('mousemove', handleMouseMove); // Important to remove global listeners
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isEnabled, handleMouseDown, handleMouseMove, handleMouseUp]);

    return { elementRef: draggableElementRef, currentElementStyle: currentStyle };
};