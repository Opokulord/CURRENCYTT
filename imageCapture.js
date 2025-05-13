// === Upload Image for OCR ===
function captureCurrency() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) recognizeCurrencyText(file);
    };
    input.click();
}

// === Live Camera View with Capture and Cancel ===
function captureFromCamera() {
    // Check browser compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMessage = document.createElement('div');
        errorMessage.style = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(30,30,40,0.95);
            color: #fff;
            padding: 24px;
            border-radius: 12px;
            text-align: center;
            max-width: 90%;
            width: 400px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.2);
            z-index: 10000;
        `;
        
        let message = 'Your browser does not support camera access. ';
        if (/Firefox/.test(navigator.userAgent)) {
            message += 'Please make sure you\'re using Firefox 36 or later and have granted camera permissions.';
        } else if (/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
            message += 'Please use Safari 11 or later and make sure you\'re on HTTPS.';
        } else if (/Edge/.test(navigator.userAgent)) {
            message += 'Please use Microsoft Edge 12 or later.';
        } else if (/Chrome/.test(navigator.userAgent)) {
            message += 'Please use Chrome 47 or later and make sure you\'re on HTTPS.';
        } else {
            message += 'Please try using a modern browser like Chrome, Firefox, Safari, or Edge.';
        }
        
        errorMessage.innerHTML = `
            <div style="font-size: 1.2rem; margin-bottom: 12px;">⚠️ Camera Not Supported</div>
            <p style="margin: 0; line-height: 1.5;">${message}</p>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 16px;
                padding: 8px 16px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            ">Close</button>
        `;
        document.body.appendChild(errorMessage);
        return;
    }

    // Check if running on HTTPS (required for camera access in most browsers)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        const errorMessage = document.createElement('div');
        errorMessage.style = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(30,30,40,0.95);
            color: #fff;
            padding: 24px;
            border-radius: 12px;
            text-align: center;
            max-width: 90%;
            width: 400px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.2);
            z-index: 10000;
        `;
        errorMessage.innerHTML = `
            <div style="font-size: 1.2rem; margin-bottom: 12px;">⚠️ HTTPS Required</div>
            <p style="margin: 0; line-height: 1.5;">
                Camera access requires a secure connection (HTTPS). 
                Please access this page using HTTPS or localhost.
            </p>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 16px;
                padding: 8px 16px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            ">Close</button>
        `;
        document.body.appendChild(errorMessage);
        return;
    }

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const overlay = document.createElement('div');
    const gridOverlay = document.createElement('div');
    const focusIndicator = document.createElement('div');
    const loadingIndicator = document.createElement('div');

    // State
    let stream = null;
    let currentZoom = 1;
    let isFlashOn = false;
    let facingMode = 'environment';
    let isAutoFocusOn = true;

    // Full-bleed overlay
    overlay.style = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(18,18,18,0.92); z-index: 9999;
        overflow: hidden;
    `;

    // Video styling (full-bleed)
    video.autoplay = true;
    video.playsInline = true;
    video.style = `
        width: 100vw; height: 100vh; object-fit: cover;
        position: absolute; top: 0; left: 0; z-index: 1;
        background: #222;
    `;
    overlay.appendChild(video);

    // Grid overlay
    gridOverlay.style = `
        position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none;
        display: none; z-index: 2;
    `;
    gridOverlay.innerHTML = `<div style="width:100%;height:100%;background:
        linear-gradient(to right, transparent 33.33%, rgba(255,255,255,0.10) 33.33%, rgba(255,255,255,0.10) 66.66%, transparent 66.66%),
        linear-gradient(to bottom, transparent 33.33%, rgba(255,255,255,0.10) 33.33%, rgba(255,255,255,0.10) 66.66%, transparent 66.66%);"></div>`;
    overlay.appendChild(gridOverlay);

    // Focus indicator
    focusIndicator.style = `
        position: absolute; width: 60px; height: 60px; border: 2.5px solid #bb86fc;
        border-radius: 50%; display: none; pointer-events: none;
        box-shadow: 0 0 16px #bb86fc88; animation: focusPulse 1s infinite;
        z-index: 10;
    `;
    overlay.appendChild(focusIndicator);

    // Loading indicator
    loadingIndicator.innerHTML = `<div style="
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(30,30,40,0.92); color: #fff; padding: 28px 36px; border-radius: 20px;
        text-align: center; box-shadow: 0 4px 24px #0008;">
        <div style="width: 44px; height: 44px; border: 4px solid #b3b3b3; border-top: 4px solid #bb86fc; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px;"></div>
        <p style='font-size:1.1rem;'>Initializing camera...</p>
    </div>`;
    loadingIndicator.style = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.7); z-index: 10000; display: flex; justify-content: center; align-items: center;
    `;
    document.body.appendChild(loadingIndicator);

    // Add CSS animations and glassy controls
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes focusPulse { 0% { box-shadow: 0 0 16px #bb86fc88; } 50% { box-shadow: 0 0 32px #bb86fc; } 100% { box-shadow: 0 0 16px #bb86fc88; } }
        .camera-fab { background: rgba(40,40,70,0.7); color: #fff; border: none; border-radius: 50%; width: 70px; height: 70px; font-size: 2.3rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 24px #3ec6ff33, 0 0 0 8px rgba(62,198,255,0.10); cursor: pointer; transition: box-shadow 0.2s, background 0.2s, transform 0.2s; backdrop-filter: blur(8px); }
        .camera-fab:active { background: #03dac6; transform: scale(0.96); }
        .camera-fab.secondary { background: rgba(30,30,40,0.7); color: #bb86fc; font-size: 1.5rem; width: 48px; height: 48px; box-shadow: 0 2px 8px #2228; }
        .camera-fab.danger { background: rgba(207,102,121,0.85); color: #fff; }
        .camera-fab[disabled] { opacity: 0.5; cursor: not-allowed; }
        .camera-capture-glow { box-shadow: 0 0 0 8px #03dac655, 0 4px 24px #3ec6ff33; animation: capturePulse 1.2s infinite; }
        @keyframes capturePulse { 0% { box-shadow: 0 0 0 8px #03dac655; } 50% { box-shadow: 0 0 0 16px #03dac622; } 100% { box-shadow: 0 0 0 8px #03dac655; } }
        .camera-zoom-group { position: absolute; bottom: 90px; right: 24px; display: flex; flex-direction: column; gap: 10px; z-index: 4; }
        @media (max-width: 600px) {
          .camera-fab { width: 54px !important; height: 54px !important; font-size: 1.5rem !important; }
          .camera-zoom-group { bottom: 70px; right: 10px; }
        }
    `;
    document.head.appendChild(style);

    // Cancel (top left)
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'camera-fab danger';
    cancelBtn.innerHTML = '✖';
    cancelBtn.title = 'Cancel';
    cancelBtn.style.position = 'absolute';
    cancelBtn.style.top = '24px';
    cancelBtn.style.left = '24px';
    cancelBtn.style.zIndex = 20;
    overlay.appendChild(cancelBtn);

    // Switch camera (top right)
    const switchCameraBtn = document.createElement('button');
    switchCameraBtn.className = 'camera-fab secondary';
    switchCameraBtn.innerHTML = '🔄';
    switchCameraBtn.title = 'Switch Camera';
    switchCameraBtn.style.position = 'absolute';
    switchCameraBtn.style.top = '24px';
    switchCameraBtn.style.right = '100px';
    switchCameraBtn.style.zIndex = 20;
    overlay.appendChild(switchCameraBtn);

    // Flash (top right, next to switch)
    const flashBtn = document.createElement('button');
    flashBtn.className = 'camera-fab secondary';
    flashBtn.innerHTML = '⚡';
    flashBtn.title = 'Toggle Flash';
    flashBtn.style.position = 'absolute';
    flashBtn.style.top = '24px';
    flashBtn.style.right = '24px';
    flashBtn.style.zIndex = 20;
    overlay.appendChild(flashBtn);

    // Capture (bottom center)
    const captureBtn = document.createElement('button');
    captureBtn.className = 'camera-fab camera-capture-glow';
    captureBtn.innerHTML = '📸';
    captureBtn.title = 'Capture';
    captureBtn.style.position = 'absolute';
    captureBtn.style.bottom = '32px';
    captureBtn.style.left = '50%';
    captureBtn.style.transform = 'translateX(-50%)';
    captureBtn.style.zIndex = 20;
    overlay.appendChild(captureBtn);

    // Zoom controls (vertical pill, right edge)
    const zoomGroup = document.createElement('div');
    zoomGroup.className = 'camera-zoom-group';
    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'camera-fab secondary';
    zoomInBtn.innerHTML = '➕';
    zoomInBtn.title = 'Zoom In';
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'camera-fab secondary';
    zoomOutBtn.innerHTML = '➖';
    zoomOutBtn.title = 'Zoom Out';
    zoomGroup.appendChild(zoomInBtn);
    zoomGroup.appendChild(zoomOutBtn);
    overlay.appendChild(zoomGroup);

    document.body.appendChild(overlay);

    // Mobile detection
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    // Responsive styles
    const mobileStyles = {
        video: `
            width: 100%;
            height: 100vh;
            object-fit: cover;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1;
        `,
        controlsContainer: `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            padding: 20px;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
            z-index: 2;
        `,
        button: `
            padding: 12px 20px;
            font-size: 16px;
            border: none;
            border-radius: 50px;
            background-color: rgba(255,255,255,0.2);
            color: white;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            cursor: pointer;
            min-width: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        `,
        captureButton: `
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background-color: white;
            border: 4px solid rgba(255,255,255,0.3);
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 3;
        `,
        topControls: `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            z-index: 2;
            background: linear-gradient(rgba(0,0,0,0.8), transparent);
        `,
        sideControls: `
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            gap: 15px;
            z-index: 2;
        `
    };

    // Apply mobile styles
    if (isMobile) {
        video.style = mobileStyles.video;
        zoomGroup.style = mobileStyles.controlsContainer;
        
        // Create top controls container
        const topControls = document.createElement('div');
        topControls.style = mobileStyles.topControls;
        
        // Create side controls container
        const sideControls = document.createElement('div');
        sideControls.style = mobileStyles.sideControls;

        // Style all buttons
        [captureBtn, switchCameraBtn, flashBtn, cancelBtn].forEach(btn => {
            btn.style = mobileStyles.button;
        });

        // Special styling for capture button
        captureBtn.style = mobileStyles.captureButton;
        captureBtn.innerHTML = '<div style="width: 60%; height: 60%; background: white; border-radius: 50%;"></div>';

        // Reorganize controls for mobile
        topControls.appendChild(cancelBtn);
        
        sideControls.appendChild(zoomInBtn);
        sideControls.appendChild(zoomOutBtn);
        
        card.appendChild(topControls);
        card.appendChild(sideControls);
        card.appendChild(zoomGroup);
    } else {
        // Desktop layout remains the same
        overlay.appendChild(video);
        overlay.appendChild(gridOverlay);
        overlay.appendChild(focusIndicator);
        overlay.appendChild(zoomGroup);
    }

    // Add touch gestures for mobile
    if (isMobile) {
        let initialPinchDistance = 0;

        // Pinch to zoom
        video.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialPinchDistance = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
            }
        });

        video.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                const zoomDelta = currentDistance / initialPinchDistance;
                
                if (zoomDelta > 1.1) {
                    currentZoom = Math.min(currentZoom + 0.1, 4);
                    startCamera();
                    initialPinchDistance = currentDistance;
                } else if (zoomDelta < 0.9) {
                    currentZoom = Math.max(currentZoom - 0.1, 1);
                    startCamera();
                    initialPinchDistance = currentDistance;
                }
            }
        });

        // Double tap to switch camera
        let lastTap = 0;
        video.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                switchCameraBtn.click();
            }
            lastTap = currentTime;
        });

        // Long press for flash
        let pressTimer;
        video.addEventListener('touchstart', () => {
            pressTimer = setTimeout(() => {
                flashBtn.click();
            }, 500);
        });

        video.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });
    }

    // Add safe area insets for modern mobile devices
    if (isIOS) {
        const style = document.createElement('style');
        style.textContent = `
            @supports (padding: max(0px)) {
                .controls-container {
                    padding-bottom: max(20px, env(safe-area-inset-bottom));
                    padding-left: max(20px, env(safe-area-inset-left));
                    padding-right: max(20px, env(safe-area-inset-right));
                }
                .top-controls {
                    padding-top: max(20px, env(safe-area-inset-top));
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Camera logic
    async function startCamera() {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            const constraints = {
                video: {
                    facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    zoom: currentZoom
                }
            };

            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (error) {
                let errorMessage = 'Error accessing camera. ';
                
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    errorMessage += 'Camera access was denied. Please grant camera permissions in your browser settings.';
                } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                    errorMessage += 'No camera found. Please make sure your camera is connected and not in use by another application.';
                } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                    errorMessage += 'Your camera is already in use by another application. Please close other applications using the camera.';
                } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
                    // Try again with more relaxed constraints
                    constraints.video = {
                        facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    };
                    try {
                        stream = await navigator.mediaDevices.getUserMedia(constraints);
                    } catch (retryError) {
                        errorMessage += 'Could not find a camera that meets the requirements. Please try a different camera.';
                        throw new Error(errorMessage);
                    }
                } else if (error.name === 'TypeError' || error.name === 'TypeError') {
                    errorMessage += 'Camera access is not supported in your browser. Please try a different browser.';
                } else {
                    errorMessage += 'Please check your camera connection and try again.';
                }
                
                throw new Error(errorMessage);
            }

            video.srcObject = stream;
            loadingIndicator.remove();

            // Add error handling for video element
            video.onerror = (e) => {
                console.error('Video error:', e);
                alert('Error playing video stream. Please try refreshing the page.');
                if (stream) stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(overlay);
                loadingIndicator.remove();
            };

        } catch (error) {
            console.error('Camera error:', error);
            const errorDiv = document.createElement('div');
            errorDiv.style = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(30,30,40,0.95);
                color: #fff;
                padding: 24px;
                border-radius: 12px;
                text-align: center;
                max-width: 90%;
                width: 400px;
                box-shadow: 0 4px 24px rgba(0,0,0,0.2);
                z-index: 10000;
            `;
            errorDiv.innerHTML = `
                <div style="font-size: 1.2rem; margin-bottom: 12px;">⚠️ Camera Error</div>
                <p style="margin: 0; line-height: 1.5;">${error.message}</p>
                <button onclick="this.parentElement.remove()" style="
                    margin-top: 16px;
                    padding: 8px 16px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Close</button>
            `;
            document.body.appendChild(errorDiv);
            document.body.removeChild(overlay);
            loadingIndicator.remove();
        }
    }
    startCamera();

    // Event handlers
    cancelBtn.onclick = () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(overlay);
        loadingIndicator.remove();
    };
    switchCameraBtn.onclick = () => {
        facingMode = facingMode === 'environment' ? 'user' : 'environment';
        startCamera();
    };
    flashBtn.onclick = () => {
        isFlashOn = !isFlashOn;
        flashBtn.style.background = isFlashOn ? 'linear-gradient(135deg, #03dac6 60%, #bb86fc 100%)' : 'rgba(30,30,40,0.7)';
        startCamera();
    };
    zoomInBtn.onclick = () => {
        if (currentZoom < 4) {
            currentZoom += 0.5;
            startCamera();
        }
    };
    zoomOutBtn.onclick = () => {
        if (currentZoom > 1) {
            currentZoom -= 0.5;
            startCamera();
        }
    };
            captureBtn.onclick = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (stream) stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(overlay);
                canvas.toBlob(blob => recognizeCurrencyText(blob));
            };
    // Tap to focus
    video.addEventListener('click', (e) => {
        if (!isAutoFocusOn) return;
        const rect = video.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        focusIndicator.style.left = `${x - 30}px`;
        focusIndicator.style.top = `${y - 30}px`;
        focusIndicator.style.display = 'block';
        setTimeout(() => { focusIndicator.style.display = 'none'; }, 1000);
        });
}

// === OCR Processing with Enhanced Currency Extraction ===
function recognizeCurrencyText(imageBlob) {
    const resultElement = document.getElementById('result');
    resultElement.innerHTML = '<span class="loading-spinner"></span> Processing...';

    Tesseract.recognize(imageBlob, 'eng')
        .then(({ data: { text } }) => {
            console.log("Recognized text:", text);
            const result = extractCurrencyAmount(text);

            if (result) {
                document.getElementById('amount').value = result.amount;
                resultElement.innerHTML = `Recognized: ${result.currency || ''} ${result.amount}`;

                // Set the source currency if detected
                if (result.currency) {
                    const fromSelect = document.getElementById('fromCurrency');
                    for (let option of fromSelect.options) {
                        if (option.value.toUpperCase() === result.currency.toUpperCase()) {
                            fromSelect.value = option.value;
                            break;
                        }
                    }
                }
                
                // Set the target currency if detected
                if (result.targetCurrency) {
                    const toSelect = document.getElementById('toCurrency');
                    for (let option of toSelect.options) {
                        if (option.value.toUpperCase() === result.targetCurrency.toUpperCase()) {
                            toSelect.value = option.value;
                            break;
                        }
                    }
                    
                    // Trigger the conversion automatically
                    document.getElementById('convertButton').click();
                }
            } else {
                resultElement.innerHTML = 'No recognizable currency amount found.';
            }
        })
        .catch(error => {
            resultElement.innerHTML = 'Error recognizing text.';
            console.error(error);
        });
}

// === Enhanced Function to Extract Amount and Currency from Text ===
function extractCurrencyAmount(text) {
    // Basic pattern to match simple currency amounts
    const basicRegex = /(GHS|USD|EUR|GBP|NGN|CAD|AUD|CHF|JPY|CNY|ZAR|INR|₵|\$|€|£)?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i;
    
    // Advanced pattern to match phrases like "convert 100$ to cedis"
    const advancedRegex = /(?:convert\s+)?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)(?:\s*)([$€£₵]|USD|EUR|GBP|GHS|NGN|CAD|AUD|CHF|JPY|CNY|ZAR|INR|cedis|dollars|euros|pounds)/i;
    
    // Pattern to capture "to [currency]" phrases
    const toRegex = /to\s+([a-zA-Z]+)/i;

    // First try the advanced pattern for complex phrases
    let match = text.match(advancedRegex);
    let toMatch = text.match(toRegex);
    
    // If advanced pattern fails, try the basic pattern
    if (!match) {
        match = text.match(basicRegex);
    }

    if (match) {
        // Handle amount
        let amount = match[1] ? match[1].replace(/,/g, '') : match[2].replace(/,/g, '');
        
        // Handle currency
        let currencySymbol = match[1] && match[1].length === 1 ? match[1] : 
                            (match[2] && match[2].length === 1 ? match[2] : null);
        
        let currencyCode = currencySymbol ? null : 
                          (match[1] && match[1].length > 1 ? match[1] : 
                          (match[2] && match[2].length > 1 ? match[2] : null));
        
        // Map common symbols to currency codes
        const symbolToCurrency = {
            '$': 'USD',
            '₵': 'GHS',
            '€': 'EUR',
            '£': 'GBP'
        };
        
        // Determine the currency
        let currency = null;
        if (currencySymbol && symbolToCurrency[currencySymbol]) {
            currency = symbolToCurrency[currencySymbol];
        } else if (currencyCode) {
            // Handle currency names
            const currencyNames = {
                'CEDIS': 'GHS',
                'DOLLARS': 'USD',
                'EUROS': 'EUR',
                'POUNDS': 'GBP',
                'NAIRA': 'NGN'
            };
            
            currencyCode = currencyCode.toUpperCase();
            currency = currencyNames[currencyCode] || currencyCode;
        }
        
        // Extract target currency from "to [currency]" phrase
        let targetCurrency = null;
        if (toMatch) {
            const targetText = toMatch[1].toUpperCase();
            const targetMap = {
                'CEDIS': 'GHS',
                'DOLLARS': 'USD',
                'EUROS': 'EUR',
                'POUNDS': 'GBP',
                'NAIRA': 'NGN'
            };
            targetCurrency = targetMap[targetText] || targetText;
        }
        
        return { amount, currency, targetCurrency };
    }
    
    return null;
}

// === Unified Capture Option Menu ===
function openCaptureOptions() {
    const menu = document.createElement('div');
    menu.style = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: white; border-radius: 10px;
        padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000; display: flex;
        flex-direction: column; gap: 10px; align-items: center;
    `;

    const uploadBtn = document.createElement('button');
    uploadBtn.innerText = '📁 Upload Image';
    uploadBtn.onclick = () => {
        document.body.removeChild(menu);
        captureCurrency();
    };

    const cameraBtn = document.createElement('button');
    cameraBtn.innerText = '📷 Capture From Camera';
    cameraBtn.onclick = () => {
        document.body.removeChild(menu);
        captureFromCamera();
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = '✖ Cancel';
    cancelBtn.style = 'background: #ccc;';
    cancelBtn.onclick = () => {
        document.body.removeChild(menu);
    };

    [uploadBtn, cameraBtn, cancelBtn].forEach(btn => {
        btn.style = `
            padding: 10px 20px; border: none;
            border-radius: 5px; font-size: 16px;
            cursor: pointer;
        `;
    });

    menu.appendChild(uploadBtn);
    menu.appendChild(cameraBtn);
    menu.appendChild(cancelBtn);
    document.body.appendChild(menu);
}
