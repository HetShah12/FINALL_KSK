// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import ALL your page components
import HomeScreen from './pages/HomeScreen';
import ProductSelectionScreen from './pages/ProductSelectionScreen';
import CategoriesScreen from './pages/CategoriesScreen';
import SizeSelectionScreen from './pages/SizeSelectionScreen';
import FeatureDisplayScreen from './pages/FeatureDisplayScreen';
import AiTextImgScreen from './pages/AiTextImgScreen';
import AiDrawToImgScreen from './pages/AiDrawToImgScreen'; // Assuming you have this
import UploadImageScreen from './pages/UploadImageScreen';   // Assuming you have this
import EmbroideryScreen from './pages/EmbroideryScreen';     // Assuming you have this
import DesignLibraryScreen from './pages/DesignLibraryScreen';// Assuming you have this
import OrderPreviewScreen from './pages/OrderPreviewScreen';
import DeliveryOptionScreen from './pages/DeliveryOptionScreen'; // Assuming you have this
import DeliveryFormScreen from './pages/DeliveryFormScreen';     // Assuming you have this
import StorePickUpFormScreen from './pages/StorePickUpFormScreen';// Assuming you have this
import FinalCartScreen from './pages/FinalCartScreen';         // Assuming you have this

// Your PageContainer component (ensure path is correct if it's not in the same dir as App.jsx)
// If it's in ./components/common/PageContainer.jsx use that path.
// For simplicity, I'll use the basic one we had, assuming it might be defined in this file or imported.
const PageContainer = ({ children }) => (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ width: '2240px', minHeight: '1400px', height:'1400px', overflow:'hidden', position: 'relative', background: 'white', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
            {children}
        </div>
    </div>
);
// OR import it:
// import PageContainer from './components/common/PageContainer';


function App() {
  return (
    <PageContainer>
      <Routes>
        {/* --- SET THE HOME SCREEN AS THE DEFAULT ENTRY POINT --- */}
        <Route path="/" element={<HomeScreen />} />
        <Route path="/home" element={<HomeScreen />} /> {/* Optional: explicit /home route */}

        {/* --- ADD BACK ALL YOUR OTHER ROUTES --- */}
        <Route path="/product-selection" element={<ProductSelectionScreen />} />
        <Route path="/categories" element={<CategoriesScreen />} />
        <Route path="/size-selection" element={<SizeSelectionScreen />} />
        <Route path="/feature-display" element={<FeatureDisplayScreen />} />
        <Route path="/ai-text-to-image" element={<AiTextImgScreen />} />
        <Route path="/ai-draw-to-image" element={<AiDrawToImgScreen />} />
        <Route path="/upload-image" element={<UploadImageScreen />} />
        <Route path="/design-library" element={<DesignLibraryScreen />} />
        <Route path="/embroidery" element={<EmbroideryScreen />} />
        <Route path="/order-preview" element={<OrderPreviewScreen />} />
        <Route path="/delivery-options" element={<DeliveryOptionScreen />} />
        <Route path="/delivery-form" element={<DeliveryFormScreen />} />
        <Route path="/store-pickup-form" element={<StorePickUpFormScreen />} />
        <Route path="/final-cart" element={<FinalCartScreen />} />

        {/* Catch-all route: navigates to home if no other route matches */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageContainer>
  );
}

export default App;