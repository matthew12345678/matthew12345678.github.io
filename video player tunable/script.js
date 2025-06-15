const video = document.getElementById('videoFeed');
const canvas = document.getElementById('overlayCanvas');
const ctx = canvas.getContext('2d');
const volumeSlider = document.getElementById('volumeSlider');
const frequencySlider = document.getElementById('frequencySlider');
const frequencyDisplay = document.getElementById('frequencyDisplay');
const axisRadioButtons = document.querySelectorAll('input[name="scanAxis"]');
const waveformColorPicker = document.getElementById('waveformColorPicker');
const liveUpdateCheckbox = document.getElementById('liveUpdateCheckbox');

let audioCtx;
let gainNode;
const hiddenCanvas = document.createElement('canvas');
const hiddenCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });
let currentAudioSource = null;
let latestSoundWave = new Float32Array(0);

let scanAxis = 'y';
let playheadX = 50;
let playheadY = 50;
const playheadXColor = 'rgba(255, 0, 0, 0.7)';
const playheadYColor = 'rgba(0, 255, 0, 0.7)';
const playheadWidth = 2;
let waveformColor = waveformColorPicker.value;
const waveformHeightPercentage = 0.25;
let isDragging = false;
let isLiveUpdateEnabled = false;
let wasLiveUpdateEnabledBeforeDrag = false; // To restore state after dragging

function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioCtx.createGain();
        gainNode.connect(audioCtx.destination);
        gainNode.gain.value = parseFloat(volumeSlider.value);
        console.log("AudioContext and GainNode initialized.");
    }
}

function drawWaveform() {
    if (!latestSoundWave || latestSoundWave.length === 0) return;
    const wfHeight = canvas.height * waveformHeightPercentage;
    const wfStartY = canvas.height - wfHeight;
    const wfWidth = canvas.width;
    ctx.strokeStyle = waveformColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, wfStartY + wfHeight / 2);
    ctx.lineTo(wfWidth, wfStartY + wfHeight / 2);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < latestSoundWave.length; i++) {
        const x = (i / (latestSoundWave.length - 1)) * wfWidth;
        const y = wfStartY + (wfHeight / 2) * (1 - latestSoundWave[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

async function processFrameAndPlaySound() {
    if (!audioCtx || !gainNode) { return; }
    if (video.paused || video.ended || video.readyState < 2 || !video.videoWidth || !video.videoHeight || !canvas.width || !canvas.height) {
        return;
    }
    if (hiddenCanvas.width !== video.videoWidth || hiddenCanvas.height !== video.videoHeight) {
        hiddenCanvas.width = video.videoWidth;
        hiddenCanvas.height = video.videoHeight;
    }
    hiddenCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    let imageData, waveformLength, sourceCoordinateInfo;
    if (scanAxis === 'x') {
        const sourceX = Math.floor(playheadX * (video.videoWidth / canvas.width));
        const clampedSourceX = Math.max(0, Math.min(sourceX, hiddenCanvas.width - 1));
        imageData = hiddenCtx.getImageData(clampedSourceX, 0, 1, hiddenCanvas.height).data;
        waveformLength = hiddenCanvas.height;
        sourceCoordinateInfo = `sourceX: ${clampedSourceX}`;
    } else {
        const sourceY = Math.floor(playheadY * (video.videoHeight / canvas.height));
        const clampedSourceY = Math.max(0, Math.min(sourceY, hiddenCanvas.height - 1));
        imageData = hiddenCtx.getImageData(0, clampedSourceY, hiddenCanvas.width, 1).data;
        waveformLength = hiddenCanvas.width;
        sourceCoordinateInfo = `sourceY: ${clampedSourceY}`;
    }
    if (!latestSoundWave || latestSoundWave.length !== waveformLength) {
        latestSoundWave = new Float32Array(waveformLength);
    }
    for (let i = 0; i < waveformLength; i++) {
        const r = imageData[i * 4], g = imageData[i * 4 + 1], b = imageData[i * 4 + 2];
        latestSoundWave[i] = ((r + g + b) / 3 / 255.0) * 2.0 - 1.0;
    }
    if (latestSoundWave.length === 0) { return; }
    
    const audioBuffer = audioCtx.createBuffer(1, latestSoundWave.length, audioCtx.sampleRate);
    audioBuffer.getChannelData(0).set(latestSoundWave);
    if (currentAudioSource) { currentAudioSource.stop(); currentAudioSource.disconnect(); }
    currentAudioSource = audioCtx.createBufferSource();
    currentAudioSource.buffer = audioBuffer;
    currentAudioSource.playbackRate.value = parseFloat(frequencySlider.value) / 440; // Normalize to A4
    currentAudioSource.connect(gainNode);
    currentAudioSource.loop = true;
    currentAudioSource.start();
    drawPlayhead();
}

function drawPlayhead() {
    if (!canvas.width || !canvas.height) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    if (scanAxis === 'x') {
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, canvas.height);
        ctx.strokeStyle = playheadXColor;
    } else {
        ctx.moveTo(0, playheadY);
        ctx.lineTo(canvas.width, playheadY);
        ctx.strokeStyle = playheadYColor;
    }
    ctx.lineWidth = playheadWidth;
    ctx.stroke();
    drawWaveform();
}

function resizeOverlayCanvas() {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
        playheadX = Math.max(playheadWidth / 2, Math.min(playheadX, canvas.width - playheadWidth / 2));
        playheadY = Math.max(playheadWidth / 2, Math.min(playheadY, canvas.height - playheadWidth / 2));
        if(!isLiveUpdateEnabled) drawPlayhead(); // Avoid redundant draw if live loop is active
    }
}

// Live update animation loop
function liveUpdateLoop() {
    if (isLiveUpdateEnabled && !isDragging && video.readyState >= 2 && !video.paused) {
        processFrameAndPlaySound();
    }
    requestAnimationFrame(liveUpdateLoop);
}

async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;
        video.onplaying = () => {
            console.log("Video playing. Initializing.");
            initAudioContext();
            resizeOverlayCanvas();
            if (scanAxis === 'x') {
                if (canvas.width > 0 && playheadX > canvas.width) playheadX = canvas.width / 2;
            } else {
                if (canvas.height > 0 && playheadY > canvas.height) playheadY = canvas.height / 2;
            }
            isLiveUpdateEnabled = liveUpdateCheckbox.checked; // Set initial state from checkbox
            drawPlayhead();
            liveUpdateLoop(); // Start the master animation loop
        };
    } catch (err) { console.error("Camera error: ", err); alert("No camera access."); }
}

// Event Listeners
window.addEventListener('resize', resizeOverlayCanvas);
volumeSlider.addEventListener('input', (e) => { if (gainNode) gainNode.gain.value = parseFloat(e.target.value); });

frequencySlider.addEventListener('input', (e) => {
    if (currentAudioSource) {
        const freq = parseFloat(e.target.value);
        currentAudioSource.playbackRate.value = freq / 440; // Normalize to A4
        frequencyDisplay.textContent = `${Math.round(freq)} Hz`;
    }
});

axisRadioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
        scanAxis = e.target.value;
        console.log("Scan axis changed to:", scanAxis);
        if (scanAxis === 'x') playheadX = canvas.width / 2; else playheadY = canvas.height / 2;
        if (!isLiveUpdateEnabled) processFrameAndPlaySound(); else drawPlayhead();
    });
});

waveformColorPicker.addEventListener('input', (e) => {
    waveformColor = e.target.value;
    if (!isLiveUpdateEnabled) drawPlayhead();
});

liveUpdateCheckbox.addEventListener('change', (e) => {
    isLiveUpdateEnabled = e.target.checked;
    console.log("Live update enabled:", isLiveUpdateEnabled);
    if (isLiveUpdateEnabled && (video.paused || video.ended)) {
        console.warn("Live update enabled, but video is not playing.");
    }
});

// Shared drag start logic for mouse and touch
function startDrag(clientX, clientY) {
    if (!audioCtx) initAudioContext();
    const rect = canvas.getBoundingClientRect();
    let clickOnPlayhead = false;
    let cursorStyle = 'crosshair'; // Default

    if (scanAxis === 'x') {
        const inputX = clientX - rect.left;
        if (inputX >= playheadX - playheadWidth * 4 && inputX <= playheadX + playheadWidth * 4) {
            clickOnPlayhead = true; cursorStyle = 'ew-resize';
        }
    } else {
        const inputY = clientY - rect.top;
        if (inputY >= playheadY - playheadWidth * 4 && inputY <= playheadY + playheadWidth * 4) {
            clickOnPlayhead = true; cursorStyle = 'ns-resize';
        }
    }

    if (clickOnPlayhead) {
        isDragging = true;
        canvas.style.cursor = cursorStyle;
        wasLiveUpdateEnabledBeforeDrag = isLiveUpdateEnabled;
        isLiveUpdateEnabled = false;
        processFrameAndPlaySound();
    }
}

// Shared drag move logic for mouse and touch
function dragMove(clientX, clientY) {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        if (scanAxis === 'x') {
            playheadX = Math.max(0, Math.min(clientX - rect.left, canvas.width));
        } else {
            playheadY = Math.max(0, Math.min(clientY - rect.top, canvas.height));
        }
        processFrameAndPlaySound();
    }
}

// endDrag remains the same, used by mouseup, mouseleave, touchend, touchcancel
function endDrag() {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'crosshair';
        isLiveUpdateEnabled = liveUpdateCheckbox.checked;
    }
}

// Mouse Events
canvas.addEventListener('mousedown', (e) => {
    startDrag(e.clientX, e.clientY);
});

canvas.addEventListener('mousemove', (e) => {
    dragMove(e.clientX, e.clientY);
});

canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('mouseleave', endDrag);

// Touch Events
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
        // e.preventDefault(); // Prevent mouse event emulation if not needed, but can sometimes interfere with other desired defaults. Test behavior.
    }
}, { passive: false }); // passive: false allows preventDefault if used

canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
        dragMove(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault(); // Crucial to prevent page scrolling during drag
    }
}, { passive: false }); // Required for preventDefault

canvas.addEventListener('touchend', (e) => {
    // No need to check e.touches.length, endDrag handles isDragging state
    endDrag();
});

canvas.addEventListener('touchcancel', (e) => {
    endDrag();
});

setupCamera(); 