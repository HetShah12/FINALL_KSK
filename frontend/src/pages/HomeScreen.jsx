// frontend/src/pages/HomeScreen.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CartIndicator from '../components/common/CartIndicator'; // Assuming this component exists

const HomeScreen = () => {
  const [dbStatus, setDbStatus] = useState({ message: 'Connecting to Kiosk services...', type: 'info' });

  // Simulate the DB check or replace with an actual API call to your backend
  useEffect(() => {
    // Placeholder for checkDatabaseConnection
    // In a real React app, you'd fetch from an API endpoint
    // For example:
    // fetch('/api/status/db') // Your backend route
    //   .then(response => response.json())
    //   .then(data => {
    //     if (data.connected) {
    //       setDbStatus({ message: data.message || 'Successfully connected to services.', type: 'success' });
    //     } else {
    //       setDbStatus({ message: data.message || 'Failed to connect to services.', type: 'error' });
    //     }
    //   })
    //   .catch(error => {
    //     console.error('Error checking Kiosk services connection:', error);
    //     setDbStatus({ message: 'Could not reach Kiosk services.', type: 'error' });
    //   });

    // Simulating a successful connection for now
    const timer = setTimeout(() => {
      setDbStatus({ message: 'Kiosk services connected.', type: 'success' });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Styles
  const pageContainerStyle = {
    width: '2240px', // Kiosk width
    height: '1400px', // Kiosk height
    position: 'relative',
    overflow: 'hidden',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Inter, sans-serif', // Matching font
  };

  const logoLinkStyle = {
    display: 'block',
    marginBottom: '20px',
  };

  const logoStyle = {
    width: '380px',
    height: 'auto',
  };

  const dbStatusMessageStyle = {
    padding: '10px 15px',
    borderRadius: '5px',
    fontSize: '18px', // Matched HTML
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: '20px',
    position: 'absolute',
    bottom: '50px',
    left: '50%',
    transform: 'translateX(-50%)',
    border: '1px solid', // Base border
  };

  const getDbStatusDynamicStyle = () => {
    if (dbStatus.type === 'success') {
      return { ...dbStatusMessageStyle, backgroundColor: '#e6ffed', color: '#28a745', borderColor: '#a3e9a4' };
    } else if (dbStatus.type === 'error') {
      return { ...dbStatusMessageStyle, backgroundColor: '#ffebee', color: '#dc3545', borderColor: '#f5c6cb' };
    }
    return { ...dbStatusMessageStyle, backgroundColor: '#e0e0e0', color: '#555', borderColor: '#ccc' }; // Info/default
  };

  return (
    <div style={pageContainerStyle}>
      <CartIndicator />
      <Link to="/product-selection" style={logoLinkStyle}> {/* Updated link */}
        <img src="/Home_Screen_Img/logo.png" alt="Company Logo" style={logoStyle} />
      </Link>
      <div id="db-status-message" style={getDbStatusDynamicStyle()}>
        {dbStatus.message}
      </div>
    </div>
  );
};

export default HomeScreen;