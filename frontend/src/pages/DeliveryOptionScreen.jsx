// frontend/src/pages/DeliveryOptionScreen.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CartIndicator from '../components/common/CartIndicator'; // Assuming you have this
// import { useOrderContext } from '../contexts/OrderContext'; // Or similar context to store delivery choice

const DeliveryOptionScreen = () => {
  const navigate = useNavigate();
  // const { setDeliveryType } = useOrderContext(); // Example context usage

  const handleOptionSelect = (path, type) => {
    // if (setDeliveryType) {
    //   setDeliveryType(type); // Persist choice in context
    // }
    // For now, we'll just use localStorage as per original HTML if no context
    localStorage.setItem('deliveryType', type);
    navigate(path);
  };

  // Styles
  const pageContainerStyle = {
    width: '2240px',
    height: '1400px',
    position: 'relative',
    background: 'white',
    overflow: 'hidden',
    fontFamily: 'Inter, sans-serif',
  };
  const titleStyle = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    top: '87px',
    color: '#00566F',
    fontSize: '96px',
    fontFamily: "'SS Magnetic', sans-serif", // Ensure SS Magnetic is available or fallback
    fontWeight: 400,
    whiteSpace: 'nowrap',
  };
  const backArrowStyle = {
    width: '120px',
    height: '120px',
    left: '127px',
    top: '94px',
    position: 'absolute',
    cursor: 'pointer',
  };

  const deliveryCardBaseStyle = {
    position: 'absolute',
    width: '585px',
    height: '514px',
    cursor: 'pointer',
    textDecoration: 'none',
  };

  const deliveryCardBackgroundStyle = {
    width: '100%',
    height: '100%',
    background: '#F3F9FF',
    borderRadius: '20px',
    position: 'absolute',
    top: 0,
    left: 0,
    transition: 'box-shadow 0.3s ease-in-out',
  };

  // Note: ':active' pseudo-class for box-shadow effect is better handled with CSS classes 
  // or state in React if more complex interaction is needed. For simplicity, direct CSS is often fine.
  // If you want dynamic shadow on click that React controls:
  // const [activeCard, setActiveCard] = useState(null);
  // style={ activeCard === 'pickup' ? {...deliveryCardBackgroundStyle, boxShadow: '...'} : deliveryCardBackgroundStyle}
  // onMouseDown={() => setActiveCard('pickup')} onMouseUp={() => setActiveCard(null)}

  const deliveryCardTextStyle = {
    position: 'absolute',
    color: '#00566F',
    fontSize: '64px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    wordWrap: 'break-word',
    zIndex: 1,
  };

  return (
    <div style={pageContainerStyle}>
      <CartIndicator />
      <div style={titleStyle}>Delivery Options</div>

      <Link to="/order-preview"> {/* Navigate back to Order Preview */}
        <img
          style={backArrowStyle}
          src="/Features_Display_Img/back arrow.png" // Assuming images are in public folder
          alt="Back"
        />
      </Link>

      {/* Store Pickup Option */}
      <div
        style={{ ...deliveryCardBaseStyle, left: '357px', top: '426px' }}
        onClick={() => handleOptionSelect('/store-pickup-form', 'store_pickup')}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && handleOptionSelect('/store-pickup-form', 'store_pickup')}
      >
        <div className="delivery-card-background-hover" style={deliveryCardBackgroundStyle}></div> {/* Add a class for hover/active if desired */}
        <img
          style={{ width: '273px', height: '228px', left: '156px', top: '106px', position: 'absolute', zIndex: 1 }}
          src="/QR_Screen_Img/Shop.png"
          alt="Store Pickup"
        />
        <div style={{ ...deliveryCardTextStyle, left: '100px', top: '360px' }}>
          Store Pickup
        </div>
      </div>

      {/* Home Delivery Option */}
      <div
        style={{ ...deliveryCardBaseStyle, left: '1298px', top: '426px' }}
        onClick={() => handleOptionSelect('/delivery-form', 'home_delivery')}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && handleOptionSelect('/delivery-form', 'home_delivery')}
      >
        <div className="delivery-card-background-hover" style={deliveryCardBackgroundStyle}></div>
        <img
          style={{ width: '310px', height: '245px', left: '145px', top: '100px', position: 'absolute', zIndex: 1 }}
          src="/Home_Screen_Img/motorcycle.png"
          alt="Home Delivery"
        />
        <div style={{ ...deliveryCardTextStyle, left: '76px', top: '362px' }}>
          Home Delivery
        </div>
      </div>
    </div>
  );
};

export default DeliveryOptionScreen;  