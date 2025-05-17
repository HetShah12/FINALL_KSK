// frontend/src/pages/DeliveryFormScreen.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CartIndicator from '../components/common/CartIndicator';
// Make sure you have a CSS file for ::placeholder or use inline style for text color
// import './DeliveryFormScreen.css'; // If you create a separate CSS for placeholder

const DeliveryFormScreen = () => {
  // ... (keep existing state and functions: navigate, formData, isFormValid, useEffects, handleChange, handleSubmit) ...
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', addressLine1: '', addressLine2: '',
    pincode: '', phoneNumber: '', emailAddress: '',
  });
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const savedDetails = localStorage.getItem('deliveryDetails');
    if (savedDetails) {
      setFormData(JSON.parse(savedDetails));
    }
  }, []);

  useEffect(() => {
    const { firstName, lastName, addressLine1, addressLine2, pincode, phoneNumber, emailAddress } = formData;
    const pincodeRegex = /^[0-9]{6}$/;
    const phoneRegex = /^[0-9]{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid =
      firstName.trim() !== '' && lastName.trim() !== '' &&
      addressLine1.trim() !== '' && addressLine2.trim() !== '' &&
      pincodeRegex.test(pincode) && phoneRegex.test(phoneNumber) &&
      emailRegex.test(emailAddress);
    setIsFormValid(isValid);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) { // Step 1: Check form validity
      localStorage.setItem('deliveryDetails', JSON.stringify(formData)); // Step 2: Save data
      localStorage.setItem('deliveryType', 'home_delivery');
      console.log("Form data saved. Navigating to /final-cart..."); // Step 3: Log before navigate
      navigate('/final-cart'); // Step 4: Attempt navigation
    } else {
      alert('Please fill in all required fields correctly.');
    }
  };

  // Styles
  const pageContainerStyle = { /* ... */ width: '2240px', height: '1400px', position: 'relative', background: 'white', overflow: 'hidden', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' };
  const formTitleStyle = { /* ... */ textAlign: 'center', marginTop: '87px', marginBottom: '30px', color: '#00566F', fontSize: '96px', fontFamily: "'SS Magnetic', sans-serif", fontWeight: 400 };
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
  };
  // For placeholder, create a CSS file DeliveryFormScreen.css (or use a global one):
  // .formInput::placeholder { color: rgba(0, 0, 0, 0.36); }
  // .formInput:focus { border-color: #00566F; outline: none; }


  const shortInputStyle = { ...inputBaseStyle, width: '894px' };
  const longInputStyle = { ...inputBaseStyle, width: 'calc(894px * 2 + 131px)' };
  const rowStyle = { /* ... */ display: 'flex', gap: '131px' };
  const saveButtonStyle = { /* ... */ width: '397px', height: '120px', marginTop: '40px', marginLeft: 'auto', marginRight: '0', display: 'block', color: 'white', fontSize: '48px', fontFamily: 'Inter, sans-serif', fontWeight: 600, backgroundColor: isFormValid ? '#00566F' : 'rgba(0, 86, 111, 0.51)', borderRadius: '12.04px', border: 'none', cursor: isFormValid ? 'pointer' : 'default' };
  

  return (
    <div style={pageContainerStyle}>
      <CartIndicator />
      <div style={formTitleStyle}>Enter Delivery Details</div>
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
            style={shortInputStyle}
            name="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="formInput" // For placeholder CSS
          />
          <input
            type="text"
            style={shortInputStyle}
            name="lastName"
            placeholder="Last name"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="formInput" // For placeholder CSS
          />
        </div>
        <input
          type="text"
          style={longInputStyle}
          name="addressLine1"
          placeholder="House/Flat/Apartment"
          value={formData.addressLine1}
          onChange={handleChange}
          required
          className="formInput" // For placeholder CSS
        />
        <div style={rowStyle}>
          <input
            type="text"
            style={shortInputStyle}
            name="addressLine2"
            placeholder="Road/Area/Landmark"
            value={formData.addressLine2}
            onChange={handleChange}
            required
            className="formInput" // For placeholder CSS
          />
          <input
            type="text" 
            style={shortInputStyle}
            name="pincode"
            placeholder="Pincode (6 digits)"
            value={formData.pincode}
            onChange={handleChange}
            pattern="[0-9]{6}"
            title="Pincode must be 6 digits"
            required
            className="formInput" // For placeholder CSS
          />
        </div>
        <div style={rowStyle}>
          <input
            type="tel"
            style={shortInputStyle}
            name="phoneNumber"
            placeholder="Number (10 digits)"
            value={formData.phoneNumber}
            onChange={handleChange}
            pattern="[0-9]{10}"
            title="Please enter a 10-digit phone number"
            required
            className="formInput" // For placeholder CSS
          />
          <input
            type="email"
            style={shortInputStyle}
            name="emailAddress"
            placeholder="Email address"
            value={formData.emailAddress}
            onChange={handleChange}
            required
            className="formInput" // For placeholder CSS
          />
        </div>
        <button type="submit" style={saveButtonStyle} disabled={!isFormValid}>
          Save & Proceed
        </button>
      </form>
    </div>
  );
};

export default DeliveryFormScreen;