// frontend/vite.config.js (or .ts)
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // Make sure you have @vitejs/plugin-react for JSX

export default defineConfig(({ mode }) => {
    // Load env file based on mode (development, production) in the current working directory
    const env = loadEnv(mode, process.cwd(), ''); // Use process.cwd()
    return {
      plugins: [react()], // Add this if not present, especially if using .jsx
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY) // Corrected to use VITE_ prefix
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'), // Assuming your source is in 'src'
        }
      },
      // If your backend (for image storage) is on a different port during dev
      server: {
        proxy: {
          '/api': { // Proxy requests to /api to your backend image storage server
            target: 'http://localhost:5001', // Your backend server URL
            changeOrigin: true,
          }
        }
      }
    };
});