// frontend/src/pages/StorePickUpFormScreen.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CartIndicator from '../components/common/CartIndicator';
import FinalCartScreen from './FinalCartScreen'; 
// Make sure you have a CSS file for ::placeholder or use inline style for text color
// import './StorePickUpFormScreen.css'; 

const StorePickUpFormScreen = () => {
  // ... (keep existing state and functions: navigate, formData, isFormValid, useEffects, handleChange, handleSubmit) ...
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pickupFirstName: '',
    pickupLastName: '',
    pickupPhoneNumber: '',
    pickupEmailAddress: '',
  });
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const savedDetails = localStorage.getItem('pickupDetails');
    if (savedDetails) {
      setFormData(JSON.parse(savedDetails));
    }
  }, []);

  useEffect(() => {
    const { pickupFirstName, pickupLastName, pickupPhoneNumber, pickupEmailAddress } = formData;
    const phoneRegex = /^[0-9]{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid =
      pickupFirstName.trim() !== '' &&
      pickupLastName.trim() !== '' &&
      phoneRegex.test(pickupPhoneNumber) &&
      emailRegex.test(pickupEmailAddress);
    setIsFormValid(isValid);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      localStorage.setItem('pickupDetails', JSON.stringify(formData));
      localStorage.setItem('deliveryType', 'store_pickup');
      navigate('/final-cart');
    } else {
      alert('Please fill in all required fields correctly.');
    }
  };

  // Styles
  const pageContainerStyle = { /* ... */ width: '2240px', height: '1400px', position: 'relative', background: 'white', overflow: 'hidden', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' };
  const formTitleStyle = { /* ... */ textAlign: 'center', marginTop: '87px', marginBottom: '100px', color: '#00566F', fontSize: '96px', fontFamily: "'SS Magnetic', sans-serif", fontWeight: 400 };
  const backArrowStyle = { /* ... */ width: '120px', height: '120px', position: 'absolute', left: '127px', top: '94px', cursor: 'pointer' };
  const formStyle = { /* ... */ width: 'fit-content', marginTop: '20px' };
  
  const inputBaseStyle = {
    height: '164px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    fontSize: '38px',
    border: '1px solid rgba(0, 86, 111, 0.44)',
    borderRadius: '10px',
    backgroundColor: '#F3F9FF', // Light background
    color: '#000000', // ***** ADDED: Explicitly set text color to black *****
    paddingLeft: '30px',
    boxSizing: 'border-box',
    marginBottom: '30px',
    width: '894px',
  };
  // For placeholder, create a CSS file StorePickUpFormScreen.css:
  // .formInput::placeholder { color: rgba(0, 0, 0, 0.36); }
  // .formInput:focus { border-color: #00566F; outline: none; }

  const rowStyle = { /* ... */ display: 'flex', gap: '131px' };
  const saveButtonStyle = { /* ... */ width: '397px', height: '120px', marginTop: '40px', marginLeft: 'auto', marginRight: '0', display: 'block', color: 'white', fontSize: '48px', fontFamily: 'Inter, sans-serif', fontWeight: 600, backgroundColor: isFormValid ? '#00566F' : 'rgba(0, 86, 111, 0.51)', borderRadius: '12.04px', border: 'none', cursor: isFormValid ? 'pointer' : 'default' };


  return (
    <div style={pageContainerStyle}>
      <CartIndicator />
      <div style={formTitleStyle}>Enter Contact Details</div>
      <Link to="/delivery-options">
        <img
          style={backArrowStyle}
          src="/Features_Display_Img/back arrow.png"
          alt="Back to Delivery Options"
        />
      </Link>

      <form style={formStyle} onSubmit={handleSubmit}>
        <div style={rowStyle}>
          <input
            type="text"
            style={inputBaseStyle}
            className="formInput" // For placeholder CSS
            name="pickupFirstName"
            placeholder="First name"
            value={formData.pickupFirstName}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            style={inputBaseStyle}
            className="formInput" // For placeholder CSS
            name="pickupLastName"
            placeholder="Last name"
            value={formData.pickupLastName}
            onChange={handleChange}
            required
          />
        </div>
        <div style={rowStyle}>
          <input
            type="tel"
            style={inputBaseStyle}
            className="formInput" // For placeholder CSS
            name="pickupPhoneNumber"
            placeholder="Number (10 digits)"
            value={formData.pickupPhoneNumber}
            onChange={handleChange}
            pattern="[0-9]{10}"
            title="Please enter a 10-digit phone number"
            required
          />
          <input
            type="email"
            style={inputBaseStyle}
            className="formInput" // For placeholder CSS
            name="pickupEmailAddress"
            placeholder="Email address"
            value={formData.pickupEmailAddress}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" style={saveButtonStyle} disabled={!isFormValid}>
          Save & Proceed
        </button>
      </form>
    </div>
  );
};

export default StorePickUpFormScreen;