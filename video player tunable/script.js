const video = document.getElementById('videoFeed');
const canvas = document.getElementById('overlayCanvas');
const ctx = canvas.getContext('2d');
const volumeSlider = document.getElementById('volumeSlider');
const frequencySlider = document.getElementById('frequencySlider');
const frequencyDisplay = document.getElementById('frequencyDisplay');
const axisRadioButtons = document.querySelectorAll('input[name="scanAxis"]');
const waveformColorPicker = document.getElementById('waveformColorPicker');
const liveUpdateCheckbox = document.getElementById('liveUpdateCheckbox');
const videoFileInput = document.getElementById('videoFile');
const cameraButton = document.getElementById('cameraButton');
const timelineSlider = document.getElementById('timelineSlider');
const timelineDisplay = document.getElementById('timelineDisplay');
const playbackSpeedSlider = document.getElementById('playbackSpeedSlider');
const playbackSpeedDisplay = document.getElementById('playbackSpeedDisplay');
const recordButton = document.getElementById('recordButton');
const downloadRecordingLink = document.getElementById('downloadRecordingLink');
const peakPitchToggle = document.getElementById('peakPitchToggle');
const brightnessSlider = document.getElementById('brightnessSlider');
const brightnessDisplay = document.getElementById('brightnessDisplay');
const contrastSlider = document.getElementById('contrastSlider');
const contrastDisplay = document.getElementById('contrastDisplay');
const saturationSlider = document.getElementById('saturationSlider');
const saturationDisplay = document.getElementById('saturationDisplay');
const resetImageControlsButton = document.getElementById('resetImageControlsButton');
const invertMappingToggle = document.getElementById('invertMappingToggle');

let audioCtx;
let gainNode;
let recordingAudioDestination = null;
const hiddenCanvas = document.createElement('canvas');
const hiddenCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });
const recordingCanvas = document.createElement('canvas');
const recordingCtx = recordingCanvas.getContext('2d');
let currentAudioSource = null;
let latestSoundWave = new Float32Array(0);
let currentCameraStream = null;
let currentObjectUrl = null;
let liveLoopStarted = false;
let currentSourceMode = 'camera';
let mediaRecorder = null;
let recordingChunks = [];
let recordingObjectUrl = null;
const peakPitchMinHz = 60;
const peakPitchMaxHz = 2000;
let isPeakPitchEnabled = false;
let brightnessValue = 1;
let contrastValue = 1;
let saturationValue = 1;
let isInvertedMappingEnabled = false;

let scanAxis = 'y';
let playheadX = 50;
let playheadY = 50;
let segmentStart = 0;
let segmentEnd = 0;
const playheadXColor = 'rgba(255, 0, 0, 0.7)';
const playheadYColor = 'rgba(0, 255, 0, 0.7)';
const playheadWidth = 2;
const handleRadius = 7;
const minSegmentLength = 10;
const hitTolerance = 8;
let waveformColor = waveformColorPicker.value;
const waveformHeightPercentage = 0.25;
let isDragging = false;
let isLiveUpdateEnabled = true;
let dragMode = null;
let dragStartPointerX = 0;
let dragStartPointerY = 0;
let dragStartPlayheadX = 0;
let dragStartPlayheadY = 0;
let dragStartSegmentStart = 0;
let dragStartSegmentEnd = 0;

function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioCtx.createGain();
        gainNode.connect(audioCtx.destination);
        recordingAudioDestination = audioCtx.createMediaStreamDestination();
        gainNode.connect(recordingAudioDestination);
        gainNode.gain.value = parseFloat(volumeSlider.value);
        console.log("AudioContext and GainNode initialized.");
    }
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

function updateTimelineDisplay() {
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    timelineDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(duration)}`;
}

function setTimelineEnabled(enabled) {
    timelineSlider.disabled = !enabled;
    if (!enabled) {
        timelineSlider.value = '0';
        timelineDisplay.textContent = 'Live input';
    }
}

function renderRecordingFrame() {
    if (!recordingCtx || !video.videoWidth || !video.videoHeight) return;
    if (recordingCanvas.width !== video.videoWidth || recordingCanvas.height !== video.videoHeight) {
        recordingCanvas.width = video.videoWidth;
        recordingCanvas.height = video.videoHeight;
    }
    recordingCtx.clearRect(0, 0, recordingCanvas.width, recordingCanvas.height);
    recordingCtx.filter = `brightness(${brightnessValue}) contrast(${contrastValue}) saturate(${saturationValue})`;
    recordingCtx.drawImage(video, 0, 0, recordingCanvas.width, recordingCanvas.height);
    recordingCtx.filter = 'none';
    if (canvas.width && canvas.height) {
        recordingCtx.drawImage(canvas, 0, 0, recordingCanvas.width, recordingCanvas.height);
    }
}

function updateVideoFilterStyle() {
    const filter = `brightness(${brightnessValue}) contrast(${contrastValue}) saturate(${saturationValue})`;
    video.style.filter = filter;
}

function applyImageControlValues(nextBrightness, nextContrast, nextSaturation) {
    brightnessValue = nextBrightness;
    contrastValue = nextContrast;
    saturationValue = nextSaturation;
    brightnessSlider.value = String(brightnessValue);
    contrastSlider.value = String(contrastValue);
    saturationSlider.value = String(saturationValue);
    brightnessDisplay.textContent = brightnessValue.toFixed(2);
    contrastDisplay.textContent = contrastValue.toFixed(2);
    saturationDisplay.textContent = saturationValue.toFixed(2);
    updateVideoFilterStyle();
}

function stopCurrentAudioSource() {
    if (currentAudioSource) {
        currentAudioSource.stop();
        currentAudioSource.disconnect();
        currentAudioSource = null;
    }
}

function stopCameraStream() {
    if (currentCameraStream) {
        currentCameraStream.getTracks().forEach((track) => track.stop());
        currentCameraStream = null;
    }
}

function attachVideoHandlers() {
    video.onplaying = () => {
        initAudioContext();
        resizeOverlayCanvas();
        if (scanAxis === 'x') {
            if (canvas.width > 0 && playheadX > canvas.width) playheadX = canvas.width / 2;
        } else {
            if (canvas.height > 0 && playheadY > canvas.height) playheadY = canvas.height / 2;
        }
        isLiveUpdateEnabled = liveUpdateCheckbox.checked;
        drawPlayhead();
        if (!liveLoopStarted) {
            liveUpdateLoop();
            liveLoopStarted = true;
        }
    };
    video.ontimeupdate = () => {
        if (currentSourceMode === 'file' && Number.isFinite(video.duration) && video.duration > 0) {
            const ratio = video.currentTime / video.duration;
            timelineSlider.value = String(Math.round(Math.max(0, Math.min(1, ratio)) * 1000));
            updateTimelineDisplay();
        }
    };
    video.onloadedmetadata = () => {
        if (currentSourceMode === 'file' && Number.isFinite(video.duration) && video.duration > 0) {
            setTimelineEnabled(true);
            updateTimelineDisplay();
        } else {
            setTimelineEnabled(false);
        }
    };
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

function clampSegmentToBounds(start, end, minBound, maxBound) {
    const length = end - start;
    if (length >= (maxBound - minBound)) {
        return [minBound, maxBound];
    }
    if (start < minBound) {
        const shift = minBound - start;
        start += shift;
        end += shift;
    }
    if (end > maxBound) {
        const shift = end - maxBound;
        start -= shift;
        end -= shift;
    }
    return [Math.max(minBound, start), Math.min(maxBound, end)];
}

function resetSegmentForAxis() {
    if (scanAxis === 'x') {
        segmentStart = 0;
        segmentEnd = canvas.height;
    } else {
        segmentStart = 0;
        segmentEnd = canvas.width;
    }
}

function syncSegmentBounds() {
    const maxBound = scanAxis === 'x' ? canvas.height : canvas.width;
    if (maxBound <= 0) return;
    if (segmentEnd <= segmentStart) {
        resetSegmentForAxis();
        return;
    }
    const bounded = clampSegmentToBounds(segmentStart, segmentEnd, 0, maxBound);
    segmentStart = bounded[0];
    segmentEnd = bounded[1];
    if (segmentEnd - segmentStart < minSegmentLength) {
        segmentEnd = Math.min(maxBound, segmentStart + minSegmentLength);
        if (segmentEnd - segmentStart < minSegmentLength) {
            segmentStart = Math.max(0, segmentEnd - minSegmentLength);
        }
    }
}

function getInteractionType(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (scanAxis === 'x') {
        const handleTopHit = Math.abs(x - playheadX) <= handleRadius + 2 && Math.abs(y - segmentStart) <= handleRadius + 2;
        const handleBottomHit = Math.abs(x - playheadX) <= handleRadius + 2 && Math.abs(y - segmentEnd) <= handleRadius + 2;
        if (handleTopHit) return 'resize-start';
        if (handleBottomHit) return 'resize-end';
        const withinLine = Math.abs(x - playheadX) <= hitTolerance && y >= segmentStart - hitTolerance && y <= segmentEnd + hitTolerance;
        if (withinLine) return 'move';
        return null;
    }

    const handleLeftHit = Math.abs(x - segmentStart) <= handleRadius + 2 && Math.abs(y - playheadY) <= handleRadius + 2;
    const handleRightHit = Math.abs(x - segmentEnd) <= handleRadius + 2 && Math.abs(y - playheadY) <= handleRadius + 2;
    if (handleLeftHit) return 'resize-start';
    if (handleRightHit) return 'resize-end';
    const withinLine = Math.abs(y - playheadY) <= hitTolerance && x >= segmentStart - hitTolerance && x <= segmentEnd + hitTolerance;
    if (withinLine) return 'move';
    return null;
}

function updateCursor(clientX, clientY) {
    if (isDragging) return;
    const interaction = getInteractionType(clientX, clientY);
    if (interaction === 'move') {
        canvas.style.cursor = 'move';
    } else if (interaction === 'resize-start' || interaction === 'resize-end') {
        canvas.style.cursor = scanAxis === 'x' ? 'ns-resize' : 'ew-resize';
    } else {
        canvas.style.cursor = 'crosshair';
    }
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
    hiddenCtx.filter = `brightness(${brightnessValue}) contrast(${contrastValue}) saturate(${saturationValue})`;
    hiddenCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    hiddenCtx.filter = 'none';
    let imageData, waveformLength;
    if (scanAxis === 'x') {
        const sourceStartY = Math.floor(segmentStart * (video.videoHeight / canvas.height));
        const sourceEndY = Math.floor(segmentEnd * (video.videoHeight / canvas.height));
        const sourceX = Math.floor(playheadX * (video.videoWidth / canvas.width));
        const clampedSourceX = Math.max(0, Math.min(sourceX, hiddenCanvas.width - 1));
        const topY = Math.max(0, Math.min(sourceStartY, sourceEndY, hiddenCanvas.height - 1));
        const bottomY = Math.max(0, Math.min(Math.max(sourceStartY, sourceEndY), hiddenCanvas.height - 1));
        const sampleHeight = Math.max(1, bottomY - topY + 1);
        imageData = hiddenCtx.getImageData(clampedSourceX, topY, 1, sampleHeight).data;
        waveformLength = sampleHeight;
    } else {
        const sourceStartX = Math.floor(segmentStart * (video.videoWidth / canvas.width));
        const sourceEndX = Math.floor(segmentEnd * (video.videoWidth / canvas.width));
        const sourceY = Math.floor(playheadY * (video.videoHeight / canvas.height));
        const clampedSourceY = Math.max(0, Math.min(sourceY, hiddenCanvas.height - 1));
        const leftX = Math.max(0, Math.min(sourceStartX, sourceEndX, hiddenCanvas.width - 1));
        const rightX = Math.max(0, Math.min(Math.max(sourceStartX, sourceEndX), hiddenCanvas.width - 1));
        const sampleWidth = Math.max(1, rightX - leftX + 1);
        imageData = hiddenCtx.getImageData(leftX, clampedSourceY, sampleWidth, 1).data;
        waveformLength = sampleWidth;
    }
    if (!latestSoundWave || latestSoundWave.length !== waveformLength) {
        latestSoundWave = new Float32Array(waveformLength);
    }
    for (let i = 0; i < waveformLength; i++) {
        const r = imageData[i * 4], g = imageData[i * 4 + 1], b = imageData[i * 4 + 2];
        const normalizedLuminance = (r + g + b) / 3 / 255.0;
        const mappedLuminance = isInvertedMappingEnabled ? (1 - normalizedLuminance) : normalizedLuminance;
        latestSoundWave[i] = mappedLuminance * 2.0 - 1.0;
    }
    if (latestSoundWave.length === 0) { return; }

    let peakIndex = 0;
    let peakValue = -Infinity;
    for (let i = 0; i < latestSoundWave.length; i++) {
        const value = latestSoundWave[i];
        if (value > peakValue) {
            peakValue = value;
            peakIndex = i;
        }
    }

    const sliderFrequency = parseFloat(frequencySlider.value);
    let dynamicFrequency = sliderFrequency;
    if (isPeakPitchEnabled) {
        const normalizedPeakPosition = latestSoundWave.length > 1 ? (peakIndex / (latestSoundWave.length - 1)) : 0;
        const basePeakFrequency = peakPitchMinHz + (peakPitchMaxHz - peakPitchMinHz) * normalizedPeakPosition;
        const frequencyScale = sliderFrequency / 440;
        dynamicFrequency = Math.max(20, Math.min(4000, basePeakFrequency * frequencyScale));
    }
    
    const audioBuffer = audioCtx.createBuffer(1, latestSoundWave.length, audioCtx.sampleRate);
    audioBuffer.getChannelData(0).set(latestSoundWave);
    if (currentAudioSource) { currentAudioSource.stop(); currentAudioSource.disconnect(); }
    currentAudioSource = audioCtx.createBufferSource();
    currentAudioSource.buffer = audioBuffer;
    currentAudioSource.playbackRate.value = dynamicFrequency / 440;
    currentAudioSource.connect(gainNode);
    currentAudioSource.loop = true;
    currentAudioSource.start();
    frequencyDisplay.textContent = `${Math.round(dynamicFrequency)} Hz`;
    drawPlayhead();
}

function drawPlayhead() {
    if (!canvas.width || !canvas.height) return;
    syncSegmentBounds();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    if (scanAxis === 'x') {
        ctx.moveTo(playheadX, segmentStart);
        ctx.lineTo(playheadX, segmentEnd);
        ctx.strokeStyle = playheadXColor;
    } else {
        ctx.moveTo(segmentStart, playheadY);
        ctx.lineTo(segmentEnd, playheadY);
        ctx.strokeStyle = playheadYColor;
    }
    ctx.lineWidth = playheadWidth;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (scanAxis === 'x') {
        ctx.arc(playheadX, segmentStart, handleRadius, 0, Math.PI * 2);
        ctx.arc(playheadX, segmentEnd, handleRadius, 0, Math.PI * 2);
    } else {
        ctx.arc(segmentStart, playheadY, handleRadius, 0, Math.PI * 2);
        ctx.arc(segmentEnd, playheadY, handleRadius, 0, Math.PI * 2);
    }
    ctx.fill();

    drawWaveform();
}

function resizeOverlayCanvas() {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
        const previousWidth = canvas.width || video.clientWidth;
        const previousHeight = canvas.height || video.clientHeight;
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
        playheadX = Math.max(playheadWidth / 2, Math.min(playheadX, canvas.width - playheadWidth / 2));
        playheadY = Math.max(playheadWidth / 2, Math.min(playheadY, canvas.height - playheadWidth / 2));
        if (scanAxis === 'x' && previousHeight > 0 && segmentEnd > segmentStart) {
            const ratio = canvas.height / previousHeight;
            segmentStart *= ratio;
            segmentEnd *= ratio;
        } else if (scanAxis === 'y' && previousWidth > 0 && segmentEnd > segmentStart) {
            const ratio = canvas.width / previousWidth;
            segmentStart *= ratio;
            segmentEnd *= ratio;
        } else {
            resetSegmentForAxis();
        }
        syncSegmentBounds();
        if(!isLiveUpdateEnabled) drawPlayhead(); // Avoid redundant draw if live loop is active
    }
}

// Live update animation loop
function liveUpdateLoop() {
    renderRecordingFrame();
    if (isLiveUpdateEnabled && !isDragging && video.readyState >= 2 && !video.paused) {
        processFrameAndPlaySound();
    }
    requestAnimationFrame(liveUpdateLoop);
}

async function setupCamera() {
    try {
        stopCurrentAudioSource();
        stopCameraStream();
        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
            currentObjectUrl = null;
        }
        video.pause();
        video.removeAttribute('src');
        video.srcObject = null;
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        currentCameraStream = stream;
        video.srcObject = stream;
        currentSourceMode = 'camera';
        setTimelineEnabled(false);
        attachVideoHandlers();
        await video.play();
    } catch (err) { console.error("Camera error: ", err); alert("No camera access."); }
}

async function setupVideoFile(file) {
    if (!file) return;
    stopCurrentAudioSource();
    stopCameraStream();
    if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
    }
    video.pause();
    video.srcObject = null;
    currentObjectUrl = URL.createObjectURL(file);
    video.src = currentObjectUrl;
    currentSourceMode = 'file';
    video.playbackRate = parseFloat(playbackSpeedSlider.value);
    attachVideoHandlers();
    try {
        await video.play();
    } catch (err) {
        console.error("File video play error:", err);
    }
}

// Event Listeners
window.addEventListener('resize', resizeOverlayCanvas);
volumeSlider.addEventListener('input', (e) => { if (gainNode) gainNode.gain.value = parseFloat(e.target.value); });

frequencySlider.addEventListener('input', (e) => {
    if (video.readyState >= 2) {
        if (!isLiveUpdateEnabled) {
            processFrameAndPlaySound();
        } else {
            const freq = parseFloat(e.target.value);
            frequencyDisplay.textContent = isPeakPitchEnabled
                ? `${Math.round(freq)} Hz scale`
                : `${Math.round(freq)} Hz`;
        }
    }
});

peakPitchToggle.addEventListener('change', (e) => {
    isPeakPitchEnabled = e.target.checked;
    if (video.readyState >= 2) {
        processFrameAndPlaySound();
    }
});

brightnessSlider.addEventListener('input', (e) => {
    brightnessValue = parseFloat(e.target.value);
    brightnessDisplay.textContent = brightnessValue.toFixed(2);
    updateVideoFilterStyle();
    if (!isLiveUpdateEnabled && video.readyState >= 2) {
        processFrameAndPlaySound();
    }
});

contrastSlider.addEventListener('input', (e) => {
    contrastValue = parseFloat(e.target.value);
    contrastDisplay.textContent = contrastValue.toFixed(2);
    updateVideoFilterStyle();
    if (!isLiveUpdateEnabled && video.readyState >= 2) {
        processFrameAndPlaySound();
    }
});

saturationSlider.addEventListener('input', (e) => {
    saturationValue = parseFloat(e.target.value);
    saturationDisplay.textContent = saturationValue.toFixed(2);
    updateVideoFilterStyle();
    if (!isLiveUpdateEnabled && video.readyState >= 2) {
        processFrameAndPlaySound();
    }
});

resetImageControlsButton.addEventListener('click', () => {
    applyImageControlValues(1, 1, 1);
    if (video.readyState >= 2) {
        if (!isLiveUpdateEnabled) {
            processFrameAndPlaySound();
        } else {
            drawPlayhead();
        }
    }
});

invertMappingToggle.addEventListener('change', (e) => {
    isInvertedMappingEnabled = e.target.checked;
    if (video.readyState >= 2) {
        processFrameAndPlaySound();
    }
});

playbackSpeedSlider.addEventListener('input', (e) => {
    const speed = parseFloat(e.target.value);
    playbackSpeedDisplay.textContent = `${speed.toFixed(2)}x`;
    video.playbackRate = speed;
});

timelineSlider.addEventListener('input', (e) => {
    if (currentSourceMode !== 'file' || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const ratio = parseFloat(e.target.value) / 1000;
    video.currentTime = ratio * video.duration;
    updateTimelineDisplay();
    if (!isLiveUpdateEnabled) {
        processFrameAndPlaySound();
    }
});

axisRadioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
        scanAxis = e.target.value;
        console.log("Scan axis changed to:", scanAxis);
        if (scanAxis === 'x') {
            playheadX = canvas.width / 2;
        } else {
            playheadY = canvas.height / 2;
        }
        resetSegmentForAxis();
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

videoFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    setupVideoFile(file);
});

cameraButton.addEventListener('click', () => {
    setupCamera();
});

recordButton.addEventListener('click', () => {
    initAudioContext();
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        return;
    }

    renderRecordingFrame();
    const stream = recordingCanvas.captureStream(30);
    if (recordingAudioDestination && recordingAudioDestination.stream) {
        recordingAudioDestination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    }

    recordingChunks = [];
    const preferredMimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
    ];
    const selectedMimeType = preferredMimeTypes.find((mime) => MediaRecorder.isTypeSupported(mime)) || '';
    try {
        mediaRecorder = selectedMimeType ? new MediaRecorder(stream, { mimeType: selectedMimeType }) : new MediaRecorder(stream);
    } catch (err) {
        alert('Recording is not supported in this browser.');
        stream.getTracks().forEach((track) => track.stop());
        return;
    }
    mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            recordingChunks.push(event.data);
        }
    };
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunks, { type: 'video/webm' });
        if (recordingObjectUrl) {
            URL.revokeObjectURL(recordingObjectUrl);
        }
        recordingObjectUrl = URL.createObjectURL(blob);
        downloadRecordingLink.href = recordingObjectUrl;
        downloadRecordingLink.style.display = 'inline';
        recordButton.textContent = 'Start Recording';
        stream.getTracks().forEach((track) => track.stop());
    };
    mediaRecorder.start();
    downloadRecordingLink.style.display = 'none';
    recordButton.textContent = 'Stop Recording';
});

// Shared drag start logic for mouse and touch
function startDrag(clientX, clientY) {
    if (!audioCtx) initAudioContext();
    dragMode = getInteractionType(clientX, clientY);
    if (dragMode) {
        isDragging = true;
        dragStartPointerX = clientX;
        dragStartPointerY = clientY;
        dragStartPlayheadX = playheadX;
        dragStartPlayheadY = playheadY;
        dragStartSegmentStart = segmentStart;
        dragStartSegmentEnd = segmentEnd;
        isLiveUpdateEnabled = false;
        updateCursor(clientX, clientY);
        processFrameAndPlaySound();
    }
}

// Shared drag move logic for mouse and touch
function dragMove(clientX, clientY) {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const pointerX = clientX - rect.left;
        const pointerY = clientY - rect.top;
        const startX = dragStartPointerX - rect.left;
        const startY = dragStartPointerY - rect.top;

        if (scanAxis === 'x') {
            if (dragMode === 'move') {
                const dx = pointerX - startX;
                const dy = pointerY - startY;
                playheadX = Math.max(0, Math.min(dragStartPlayheadX + dx, canvas.width));
                segmentStart = dragStartSegmentStart + dy;
                segmentEnd = dragStartSegmentEnd + dy;
                const bounded = clampSegmentToBounds(segmentStart, segmentEnd, 0, canvas.height);
                segmentStart = bounded[0];
                segmentEnd = bounded[1];
            } else if (dragMode === 'resize-start') {
                segmentStart = Math.max(0, Math.min(pointerY, segmentEnd - minSegmentLength));
            } else if (dragMode === 'resize-end') {
                segmentEnd = Math.min(canvas.height, Math.max(pointerY, segmentStart + minSegmentLength));
            }
        } else {
            if (dragMode === 'move') {
                const dx = pointerX - startX;
                const dy = pointerY - startY;
                playheadY = Math.max(0, Math.min(dragStartPlayheadY + dy, canvas.height));
                segmentStart = dragStartSegmentStart + dx;
                segmentEnd = dragStartSegmentEnd + dx;
                const bounded = clampSegmentToBounds(segmentStart, segmentEnd, 0, canvas.width);
                segmentStart = bounded[0];
                segmentEnd = bounded[1];
            } else if (dragMode === 'resize-start') {
                segmentStart = Math.max(0, Math.min(pointerX, segmentEnd - minSegmentLength));
            } else if (dragMode === 'resize-end') {
                segmentEnd = Math.min(canvas.width, Math.max(pointerX, segmentStart + minSegmentLength));
            }
        }
        syncSegmentBounds();
        processFrameAndPlaySound();
    } else {
        updateCursor(clientX, clientY);
    }
}

// endDrag remains the same, used by mouseup, mouseleave, touchend, touchcancel
function endDrag() {
    if (isDragging) {
        isDragging = false;
        dragMode = null;
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

attachVideoHandlers();
playbackSpeedDisplay.textContent = `${parseFloat(playbackSpeedSlider.value).toFixed(2)}x`;
isPeakPitchEnabled = peakPitchToggle.checked;
isLiveUpdateEnabled = liveUpdateCheckbox.checked;
isInvertedMappingEnabled = invertMappingToggle.checked;
applyImageControlValues(brightnessValue, contrastValue, saturationValue);
setTimelineEnabled(false);
setupCamera();