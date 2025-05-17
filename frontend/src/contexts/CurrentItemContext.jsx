// frontend/src/contexts/CurrentItemContext.js
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

const DEFAULT_POS = { x: 10, y: 10, width: 150, height: 50 };

export const initialCurrentItemState = {
  id: Date.now(),
  productType: 'T-Shirt',
  size: null,
  thickness: null,
  thicknessName: null,
  color: 'black',
  quantity: 1,
  frontCustomization: null,
  backCustomization: null,
  DEFAULT_CUSTOMIZATION_POSITION: DEFAULT_POS,
  basePrice: 0,
  customizationPrice: 0,
  calculatedUnitPrice: 0,
  priceBreakdown: {},
  productVariant: null,
  _blobUrls: [],
};

const CurrentItemContext = createContext(undefined);

export const useCurrentItem = () => {
  const context = useContext(CurrentItemContext);
  if (context === undefined) {
    throw new Error('useCurrentItem must be used within a CurrentItemProvider');
  }
  return context;
};

export const CurrentItemProvider = ({ children }) => {
  const [currentItem, setCurrentItemState] = useState(initialCurrentItemState);

  useEffect(() => {
    // console.log("CurrentItemContext: currentItem updated", currentItem ? JSON.parse(JSON.stringify(currentItem)) : "null");
  }, [currentItem]);

  const updateCurrentItem = useCallback((updates) => {
    setCurrentItemState(prevItem => ({ ...prevItem, ...updates }));
  }, []);

  const setCustomization = useCallback((side, customizationData) => {
    setCurrentItemState(prevItem => {
      const key = side === 'front' ? 'frontCustomization' : 'backCustomization';
      
      const newItem = { 
        ...prevItem, 
        [key]: customizationData 
      };
      
      let runningCustPrice = 0;
      const calculateSidePrice = (cust) => {
        if (!cust) return 0;
        if (cust.type === 'multi_library_design' && Array.isArray(cust.elements)) {
          return cust.elements.reduce((sum, el) => sum + (el.price || 0), 0);
        }
        return cust.price || 0; // Assumes single customization objects have a .price field
      };

      runningCustPrice = calculateSidePrice(newItem.frontCustomization) + calculateSidePrice(newItem.backCustomization);
      newItem.customizationPrice = runningCustPrice;

      // console.log(`CurrentItemContext (setCustomization for ${side}): currentItem updated. New state:`, JSON.parse(JSON.stringify(newItem)));
      return newItem;
    });
  }, []);

  const revokeTheseBlobUrls = useCallback((blobUrlsArray) => {
    if (blobUrlsArray && blobUrlsArray.length > 0) {
      blobUrlsArray.forEach(url => {
        try { URL.revokeObjectURL(url); } catch (e) { console.warn("Error revoking URL:", url, e); }
      });
    }
  }, []);

  const clearCurrentItemForNewProduct = useCallback(() => {
    if (currentItem && currentItem._blobUrls) {
        revokeTheseBlobUrls(currentItem._blobUrls);
    }
    const newId = Date.now();
    setCurrentItemState({
      ...initialCurrentItemState,
      id: newId,
      DEFAULT_CUSTOMIZATION_POSITION: currentItem?.DEFAULT_CUSTOMIZATION_POSITION || DEFAULT_POS,
      _blobUrls: [],
    });
  }, [currentItem, revokeTheseBlobUrls]);

  const addBlobUrlToItem = useCallback((blobUrl) => {
    setCurrentItemState(prev => {
      const existingBlobUrls = Array.isArray(prev._blobUrls) ? prev._blobUrls : [];
      return { ...prev, _blobUrls: [...existingBlobUrls, blobUrl] };
    });
  }, []);

  const revokeItemBlobUrls = useCallback(() => {
    if (currentItem && currentItem._blobUrls) {
        revokeTheseBlobUrls(currentItem._blobUrls);
        setCurrentItemState(prev => ({...prev, _blobUrls: []}));
    }
  }, [currentItem, revokeTheseBlobUrls]);

  const contextValue = {
    currentItem,
    setCurrentItem: setCurrentItemState,
    updateCurrentItem,
    setCustomization,
    clearCurrentItemForNewProduct,
    DEFAULT_CUSTOMIZATION_POSITION: currentItem.DEFAULT_CUSTOMIZATION_POSITION,
    addBlobUrlToItem,
    revokeItemBlobUrls,
  };

  return (
    <CurrentItemContext.Provider value={contextValue}>
      {children}
    </CurrentItemContext.Provider>
  );
};