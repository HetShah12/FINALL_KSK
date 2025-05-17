<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Kiosk Image Upload</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; margin: 0; background-color: #f0f2f5; padding: 20px; text-align: center; }
        .container { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
        h1 { color: #333; margin-bottom: 10px; font-size: 1.8em; }
        h2 { color: #00566F; margin-bottom: 25px; font-size: 1.4em; font-weight: normal;}
        input[type="file"] { display: none; }
        .upload-button { display: inline-block; padding: 12px 25px; background-color: #00566F; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1.1em; transition: background-color 0.2s ease; margin-bottom: 20px; }
        .upload-button:hover { background-color: #004053; }
        #imagePreview { display: none; max-width: 100%; max-height: 300px; margin: 20px auto; border: 1px solid #ddd; border-radius: 6px; object-fit: contain; }
        #uploadStatus { margin-top: 15px; font-weight: bold; min-height: 1.2em; font-size: 1em; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .info { color: #17a2b8; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #00566F; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 10px auto; display: none; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <h1>Upload Image</h1>
        <h2 id="uploadTargetText">to T-Shirt</h2>
        <label for="imageFile" class="upload-button">Select Image</label>
        <input type="file" id="imageFile" accept="image/*">
        <img id="imagePreview" src="#" alt="Preview">
        <div id="spinner" class="spinner"></div>
        <p id="uploadStatus"></p>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const imageFileInput = document.getElementById('imageFile');
        const imagePreview = document.getElementById('imagePreview');
        const uploadStatus = document.getElementById('uploadStatus');
        const uploadTargetText = document.getElementById('uploadTargetText');
        const spinner = document.getElementById('spinner');
        let KIOSK_SOCKET_ID = null; // To send the image to a specific kiosk
        let UPLOAD_SIDE = 'front'; // Default side

        // Connect to Socket.IO server that served this page
        const socket = io();

        socket.on('connect', () => {
            console.log('Phone connected to Socket.IO Server:', socket.id);
            showStatus('Connected to Kiosk Service.', 'info');
        });

        socket.on('disconnect', () => {
            console.log('Phone disconnected from Socket.IO Server.');
            showStatus('Disconnected. Please re-scan QR.', 'error');
        });

        socket.on('error', (error) => {
            console.error('Socket error on phone:', error);
            showStatus('Connection error. Try again.', 'error');
        });

        function getUrlParameter(name) {
            name = name.replace(/[\\[]/, '\\[').replace(/[\\]]/, '\\]');
            const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
            const results = regex.exec(location.search);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\\+/g, ' '));
        }

        document.addEventListener('DOMContentLoaded', () => {
            KIOSK_SOCKET_ID = getUrlParameter('kioskId');
            UPLOAD_SIDE = getUrlParameter('side') || 'front';
            if (KIOSK_SOCKET_ID) {
                uploadTargetText.textContent = `to T-Shirt ${UPLOAD_SIDE.charAt(0).toUpperCase() + UPLOAD_SIDE.slice(1)}`;
                console.log(`Targeting Kiosk: ${KIOSK_SOCKET_ID} for side: ${UPLOAD_SIDE}`);
            } else {
                showStatus('Error: Kiosk ID not found. Please re-scan the QR code from the kiosk.', 'error');
                document.querySelector('.upload-button').style.display = 'none'; // Hide button if no ID
            }
        });

        imageFileInput.addEventListener('change', handleFileSelect);

        function handleFileSelect(event) {
            showStatus('', ''); // Clear previous status
            imagePreview.style.display = 'none';
            imagePreview.src = '#';
            const file = event.target.files[0];

            if (file) {
                if (!file.type.startsWith('image/')) {
                    showStatus('Please select a valid image file.', 'error');
                    imageFileInput.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onloadstart = () => {
                    showStatus('Processing image...', 'info');
                    spinner.style.display = 'block';
                };
                reader.onload = (e) => {
                    const imageDataUrl = e.target.result;
                    imagePreview.src = imageDataUrl;
                    imagePreview.style.display = 'block';
                    uploadFile(imageDataUrl);
                };
                reader.onerror = (e) => {
                    console.error("FileReader Error:", e);
                    showStatus('Error reading file.', 'error');
                    spinner.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        }

        async function uploadFile(imageDataUrl) {
            if (!imageDataUrl) {
                showStatus('No image data.', 'error');
                spinner.style.display = 'none';
                return;
            }
             if (!KIOSK_SOCKET_ID) {
                showStatus('Cannot upload: Kiosk ID missing. Re-scan QR.', 'error');
                spinner.style.display = 'none';
                return;
            }

            showStatus('Uploading to kiosk...', 'info');
            spinner.style.display = 'block';

            try {
                // Send image data via Socket.IO directly to the server,
                // which will then relay it to the specific kiosk.
                socket.emit('phone_upload_image', {
                    kioskSocketId: KIOSK_SOCKET_ID,
                    side: UPLOAD_SIDE,
                    imageDataUrl: imageDataUrl
                }, (response) => { // Optional acknowledgement callback
                    spinner.style.display = 'none';
                    if (response && response.success) {
                        showStatus('Image sent to kiosk successfully!', 'success');
                        // Optionally clear preview/input after success for multiple uploads
                        // imagePreview.style.display = 'none';
                        // imageFileInput.value = '';
                    } else {
                        showStatus(response.message || 'Failed to send image to kiosk.', 'error');
                    }
                });

            } catch (error) {
                console.error('Upload Failed on Phone:', error);
                showStatus(`Upload failed: ${error.message}`, 'error');
                spinner.style.display = 'none';
            }
        }

        function showStatus(message, type = 'info') {
            uploadStatus.textContent = message;
            uploadStatus.className = type;
        }
    </script>
</body>
</html>