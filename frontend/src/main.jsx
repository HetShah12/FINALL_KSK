// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client'; // <--- IMPORT ReactDOM HERE
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CurrentItemProvider } from './contexts/CurrentItemContext';
import { CartProvider } from './contexts/CartContext'; // <<< ENSURE THIS IS IMPORTED
import './index.css';

const container = document.getElementById('root');

if (container._reactRootContainer) {
  console.warn("React root already created for this container. This might be due to HMR re-execution.");
} else {
  // Line 9 (approximately) would have been here before the import:
  const root = ReactDOM.createRoot(container); // Now ReactDOM is defined
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <CartProvider>
          <CurrentItemProvider>
            <App />
          </CurrentItemProvider>
        </CartProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}