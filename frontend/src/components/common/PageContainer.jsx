// frontend/src/components/layout/PageContainer.jsx
import React, { useState } from 'react';
import CartIndicator from '../common/CartIndicator'; // Adjust path
import CartPreview from '../cart/CartPreview';   // Adjust path

const PageContainer = ({ children }) => {
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);

  const toggleCartPreview = () => {
    setIsCartPreviewOpen(prev => !prev);
  };

  const pageContainerStyle = {
    width: '2240px',
   height: '1400px',
   // margin: '0 auto', // Not strictly needed if #root is centering it
   position: 'relative', 
   overflow: 'hidden', 
   fontFamily: 'Inter, sans-serif',
   background: 'white', // <--- ENSURE YOUR KIOSK AREA IS WHITE
   boxShadow: '0 0 20px rgba(0,0,0,0.2)', // Use a system font stack for better performance
  };

  // This inner div is useful if the main content (children) needs to scroll
  // independently of fixed/absolute elements like the cart preview.
  const contentWrapperStyle = {
    flexGrow: 1,
    position: 'relative', // Can also be a positioning context if needed
    width: '100%',
    height: '100%', // Takes height from flex parent
    overflowY: 'auto', // Allows page content to scroll if it's too long
    overflowX: 'hidden',
  };


  return (
    <div style={pageContainerStyle}>
      <div style={contentWrapperStyle}> {/* Content area for pages */}
        {children}
      </div>
      <CartIndicator onPreviewToggle={toggleCartPreview} />
      {/* CartPreview is rendered here, it will position itself absolutely within PageContainer */}
      <CartPreview isOpen={isCartPreviewOpen} onClose={toggleCartPreview} />
    </div>
  );
};

export default PageContainer;