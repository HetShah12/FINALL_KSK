// frontend/src/hooks/useDraggableResizable.js
import { useState, useEffect, useCallback, useRef } from 'react';

// Default pixel minimums if dynamic ones aren't provided or calculate to 0
const FALLBACK_MIN_WIDTH = 50;
const FALLBACK_MIN_HEIGHT = 50;

export const useDraggableResizable = (
    initialElementState, // { x, y, width, height }
    boundsElementRef,    // Ref to the parent bounding element
    onInteractionEnd,    // Callback: (finalState) => void
    isEnabled = true,
    minDimensionsProp = {} // Optional: { minWidth, minHeight } in pixels
) => {
    const draggableElementRef = useRef(null);
    const interactionState = useRef({
        isInteracting: false,
        interactionType: null,
        startX: 0, startY: 0,
        initialLeft: 0, initialTop: 0,
        initialWidth: 0, initialHeight: 0,
    });

    // Determine actual minWidth and minHeight to use
    const getMinDimensions = useCallback(() => {
        const dynamicMinWidth = minDimensionsProp.minWidth;
        const dynamicMinHeight = minDimensionsProp.minHeight;
        return {
            width: (typeof dynamicMinWidth === 'number' && dynamicMinWidth > 0) ? dynamicMinWidth : FALLBACK_MIN_WIDTH,
            height: (typeof dynamicMinHeight === 'number' && dynamicMinHeight > 0) ? dynamicMinHeight : FALLBACK_MIN_HEIGHT,
        };
    }, [minDimensionsProp.minWidth, minDimensionsProp.minHeight]);


    const [currentStyle, setCurrentStyle] = useState(() => {
        const mins = getMinDimensions();
        return {
            display: isEnabled ? 'flex' : 'none',
            position: 'absolute',
            left: `${initialElementState.x}px`,
            top: `${initialElementState.y}px`,
            width: `${Math.max(mins.width, initialElementState.width)}px`, // Ensure initial respects min
            height: `${Math.max(mins.height, initialElementState.height)}px`,// Ensure initial respects min
            border: '1px solid rgba(0,86,111,0.8)',
            backgroundColor: 'rgba(0,86,111,0.15)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            cursor: 'grab',
            zIndex: 20,
            alignItems: 'center',
            justifyContent: 'center',
        };
    });

    // Sync with external initial state changes
    useEffect(() => {
        if (!interactionState.current.isInteracting) {
            const mins = getMinDimensions();
            setCurrentStyle(prev => ({
                ...prev,
                left: `${initialElementState.x}px`,
                top: `${initialElementState.y}px`,
                width: `${Math.max(mins.width, initialElementState.width)}px`,
                height: `${Math.max(mins.height, initialElementState.height)}px`,
                display: isEnabled ? 'flex' : 'none',
            }));
        }
    }, [initialElementState, isEnabled, getMinDimensions]);


    const calculateConstrainedState = useCallback((requestedX, requestedY, requestedWidth, requestedHeight) => {
        if (!boundsElementRef.current) {
            const mins = getMinDimensions();
            return { x: 0, y: 0, width: mins.width, height: mins.height };
        }

        const boundsWidth = boundsElementRef.current.offsetWidth;
        const boundsHeight = boundsElementRef.current.offsetHeight;
        const { width: minW, height: minH } = getMinDimensions();

        // Apply minimums first
        let newWidth = Math.max(minW, requestedWidth);
        let newHeight = Math.max(minH, requestedHeight);

        // Ensure width/height don't exceed parent bounds
        newWidth = Math.min(newWidth, boundsWidth);
        newHeight = Math.min(newHeight, boundsHeight);

        // Constrain position based on the (potentially adjusted) newWidth/newHeight
        let newX = Math.max(0, Math.min(requestedX, boundsWidth - newWidth));
        let newY = Math.max(0, Math.min(requestedY, boundsHeight - newHeight));
        
        // Final check: if position was clamped, width/height might need readjustment
        // if they were relying on that position to fit.
        newWidth = Math.min(newWidth, boundsWidth - newX);
        newHeight = Math.min(newHeight, boundsHeight - newY);
        
        // And re-ensure min dimensions are still met after all clamping.
        newWidth = Math.max(minW, newWidth);
        newHeight = Math.max(minH, newHeight);
        
        // If width or height became minimum and makes it exceed boundary, adjust X,Y
        if (newX + newWidth > boundsWidth) newX = boundsWidth - newWidth;
        if (newY + newHeight > boundsHeight) newY = boundsHeight - newHeight;
        // Ensure x,y are not negative after adjustments for min width/height
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);


        return { x: newX, y: newY, width: newWidth, height: newHeight };
    }, [boundsElementRef, getMinDimensions]);


    const handleMouseDown = useCallback((e) => {
        // ... (same mousedown logic as before, sets interactionState.current.interactionType) ...
        if (!draggableElementRef.current || !boundsElementRef.current || !isEnabled) return;
        
        const target = e.target;
        const resizeHandleType = target.dataset.resizeHandle;

        interactionState.current.startX = e.clientX;
        interactionState.current.startY = e.clientY;
        interactionState.current.initialLeft = draggableElementRef.current.offsetLeft;
        interactionState.current.initialTop = draggableElementRef.current.offsetTop;
        interactionState.current.initialWidth = draggableElementRef.current.offsetWidth;
        interactionState.current.initialHeight = draggableElementRef.current.offsetHeight;

        if (resizeHandleType) {
            interactionState.current.interactionType = `resize-${resizeHandleType}`;
            document.body.style.cursor = target.style.cursor || 'nwse-resize';
        } else if (target === draggableElementRef.current) {
            interactionState.current.interactionType = 'drag';
            document.body.style.cursor = 'grabbing';
        } else {
            return;
        }
        interactionState.current.isInteracting = true;
        e.preventDefault();
        e.stopPropagation();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [boundsElementRef, isEnabled, handleMouseMove, handleMouseUp]); // Added missing dependencies

    const handleMouseMove = useCallback((e) => {
        if (!interactionState.current.isInteracting || !draggableElementRef.current || !boundsElementRef.current) return;
        e.preventDefault();

        const deltaX = e.clientX - interactionState.current.startX;
        const deltaY = e.clientY - interactionState.current.startY;

        let requestedX = interactionState.current.initialLeft;
        let requestedY = interactionState.current.initialTop;
        let requestedWidth = interactionState.current.initialWidth;
        let requestedHeight = interactionState.current.initialHeight;

        const type = interactionState.current.interactionType;

        if (type === 'drag') {
            requestedX += deltaX;
            requestedY += deltaY;
        } else if (type === 'resize-br') { // Only bottom-right for now
            requestedWidth += deltaX;
            requestedHeight += deltaY;
        }
        // Add logic for other resize handles if you implement them

        const constrained = calculateConstrainedState(requestedX, requestedY, requestedWidth, requestedHeight);

        setCurrentStyle(prev => ({
            ...prev,
            left: `${constrained.x}px`,
            top: `${constrained.y}px`,
            width: `${constrained.width}px`,
            height: `${constrained.height}px`,
        }));
    }, [boundsElementRef, calculateConstrainedState]);

    const handleMouseUp = useCallback(() => {
        // ... (same mouseup logic as before, calls onInteractionEnd) ...
        if (interactionState.current.isInteracting) {
            const finalStateFromStyle = {
                x: parseInt(currentStyle.left, 10),
                y: parseInt(currentStyle.top, 10),
                width: parseInt(currentStyle.width, 10),
                height: parseInt(currentStyle.height, 10),
            };
             if (onInteractionEnd) {
                onInteractionEnd(finalStateFromStyle);
            }
        }
        interactionState.current.isInteracting = false;
        interactionState.current.interactionType = null;
        document.body.style.cursor = 'auto';
        setCurrentStyle(prev => ({...prev, cursor: 'grab' }));

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [onInteractionEnd, handleMouseMove, currentStyle.height, currentStyle.left, currentStyle.top, currentStyle.width ]); // Added currentStyle parts

    useEffect(() => {
        const el = draggableElementRef.current;
        if (el && isEnabled) {
            // Add mousedown listener to the main element for dragging
            el.addEventListener('mousedown', handleMouseDown);

            // Add mousedown listener specifically to any child with data-resize-handle
            const resizeHandles = el.querySelectorAll('[data-resize-handle]');
            resizeHandles.forEach(handle => handle.addEventListener('mousedown', handleMouseDown));

            return () => {
                el.removeEventListener('mousedown', handleMouseDown);
                resizeHandles.forEach(handle => handle.removeEventListener('mousedown', handleMouseDown));
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [draggableElementRef, isEnabled, handleMouseDown, handleMouseMove, handleMouseUp]);


    return { elementRef: draggableElementRef, currentElementStyle: currentStyle };
};