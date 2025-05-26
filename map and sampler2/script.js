window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed.");

    // --- Audio Context and Nodes (Global Scope within this closure) ---
    let audioContext;
    let gainNode;
    let pannerNode; // Will be null if StereoPannerNode is not supported
    
    let audioBuffer;    // Stores the decoded audio data
    let sourceNode;     // The currently playing audio source
    let isPlaying = false;
    
    // Loop selection variables
    let isSelecting = false;
    let selectionStart = 0;
    let selectionEnd = 0;
    let currentLoopStart = 0;
    let currentLoopEnd = 0;
    let isDraggingLoop = false;
    let isResizingLoop = false;
    let resizeEdge = null; // 'start' or 'end'
    let dragStartX = 0;
    let originalLoopStart = 0;
    let originalLoopEnd = 0;

    // MIDI variables
    let midiAccess = null;
    let midiInput = null;
    let isMidiLearnMode = false;
    let midiMappings = {};
    let controlToMap = null;

    // --- DOM Elements ---
    const fileInput = document.getElementById('fileInput');
    const playStopButton = document.getElementById('playStopButton');
    const speedControl = document.getElementById('speedControl');
    const speedValueDisplay = document.getElementById('speedValue');
    const volumeControl = document.getElementById('volumeControl');
    const volumeValueDisplay = document.getElementById('volumeValue');
    const panControl = document.getElementById('panControl');
    const panValueDisplay = document.getElementById('panValue');
    const loopToggle = document.getElementById('loopToggle');
    const backwardsToggle = document.getElementById('backwardsToggle');
    const waveformCanvas = document.getElementById('waveformCanvas');
    const canvasCtx = waveformCanvas.getContext('2d');
    
    // MIDI elements
    const midiInputSelect = document.getElementById('midiInput');
    const midiLearnButton = document.getElementById('midiLearn');
    const midiMappingStatus = document.getElementById('midiMappingStatus');

    console.log("DOM elements retrieved.");

    // --- Initialize Audio Context and Core Audio Nodes (Gain, Panner) ONCE ---
    function initAudioGraph() {
        if (audioContext) { // Prevent re-initialization
            console.log("Audio graph already initialized.");
            return;
        }
        try {
            console.log("Attempting to initialize AudioContext and core nodes...");
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            gainNode = audioContext.createGain();
            gainNode.gain.value = parseFloat(volumeControl.value); // Set initial volume from slider

            if (audioContext.createStereoPanner) {
                pannerNode = audioContext.createStereoPanner();
                pannerNode.pan.value = parseFloat(panControl.value); // Set initial pan from slider
                
                // Connect: gain -> panner -> destination
                gainNode.connect(pannerNode);
                pannerNode.connect(audioContext.destination);
                console.log("AudioContext, GainNode, StereoPannerNode created. Path: gain -> panner -> destination.");
            } else {
                // Panner not supported, connect gain directly to destination
                gainNode.connect(audioContext.destination);
                console.warn("StereoPannerNode not supported. Pan control will not work. Path: gain -> destination.");
            }
            console.log(`AudioContext state after init: ${audioContext.state}`);

        } catch (e) {
            alert('Web Audio API is not supported or failed to initialize in this browser.');
            console.error("Error initializing AudioContext and core nodes:", e);
        }
    }
    initAudioGraph(); // Initialize audio graph on script load

    // --- Resume AudioContext on User Interaction (if needed) ---
    async function resumeAudioContext() {
        if (audioContext && audioContext.state === 'suspended') {
            console.log("AudioContext is suspended, attempting to resume...");
            try {
                await audioContext.resume();
                console.log("AudioContext resumed successfully. State:", audioContext.state);
            } catch (e) {
                console.error("Error resuming AudioContext:", e);
            }
        }
    }

    // --- File Input Handler ---
    fileInput.addEventListener('change', async (event) => {
        console.log("File input changed.");
        await resumeAudioContext(); // Ensure context is running

        if (!audioContext) {
            alert("AudioContext not available. Cannot process audio.");
            console.error("File input: AudioContext not initialized.");
            return;
        }

        const file = event.target.files[0];
        if (file) {
            console.log(`File selected: ${file.name}`);
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log("File loaded by FileReader, decoding audio data...");
                audioContext.decodeAudioData(e.target.result)
                    .then(decodedBuffer => {
                        audioBuffer = decodedBuffer;
                        playStopButton.disabled = false;
                        console.log("Audio file decoded successfully. Duration:", audioBuffer.duration);
                        drawWaveform(audioBuffer);
                        // If a sound was playing, stop it before loading new buffer
                        if (isPlaying && sourceNode) {
                            sourceNode.stop();
                            sourceNode.disconnect();
                            sourceNode = null;
                            isPlaying = false;
                            playStopButton.textContent = 'Play';
                        }
                    })
                    .catch(err => {
                        alert("Error decoding audio file. See console for details.");
                        console.error("Error decoding audio data:", err);
                        playStopButton.disabled = true;
                    });
            };
            reader.onerror = (err) => {
                alert("Error reading file. See console for details.");
                console.error("FileReader error:", err);
            };
            reader.readAsArrayBuffer(file);
        } else {
            console.log("No file selected.");
        }
    });

    // --- Play/Stop Functionality ---
    playStopButton.addEventListener('click', async () => {
        console.log("Play/Stop button clicked.");
        await resumeAudioContext(); // Ensure context is running

        if (!audioContext || !audioBuffer) {
            console.warn("Play/Stop: AudioContext or audioBuffer not ready.");
            return;
        }
        if (!gainNode) {
            console.error("Play/Stop: GainNode is not initialized. Cannot play audio.");
            return;
        }


        if (isPlaying) {
            // Stop sound
            if (sourceNode) {
                console.log("Stopping playback.");
                sourceNode.stop();
                sourceNode.disconnect(); // Disconnect from gainNode
                sourceNode = null;
            }
            isPlaying = false;
            playStopButton.textContent = 'Play';
            console.log("Playback stopped. Button set to 'Play'.");
        } else {
            // Start sound
            console.log("Starting playback.");
            sourceNode = audioContext.createBufferSource();
            sourceNode.buffer = audioBuffer;

            // Apply current control settings
            const baseRate = parseFloat(speedControl.value);
            sourceNode.playbackRate.value = backwardsToggle.checked ? -baseRate : baseRate;
            sourceNode.loop = loopToggle.checked;
            
            // Set loop points if they exist
            if (currentLoopStart !== currentLoopEnd) {
                sourceNode.loopStart = currentLoopStart;
                sourceNode.loopEnd = currentLoopEnd;
                
                // Calculate the duration of the selected region
                const regionDuration = currentLoopEnd - currentLoopStart;
                
                // If not looping, start from the loop start point and stop after the region duration
                if (!loopToggle.checked) {
                    sourceNode.start(0, currentLoopStart, regionDuration);
                } else {
                    sourceNode.start(0);
                }
            } else {
                sourceNode.start(0);
            }
            
            console.log(`Playback settings: rate=${sourceNode.playbackRate.value}, loop=${sourceNode.loop}`);

            sourceNode.connect(gainNode); // Connect source to the main gain node
            console.log("SourceNode connected to GainNode.");

            sourceNode.onended = () => {
                console.log(`sourceNode.onended triggered. isPlaying: ${isPlaying}, loopToggle.checked: ${loopToggle.checked}, current sourceNode.loop: ${sourceNode ? sourceNode.loop : 'N/A'}`);
                // This event fires when sound.stop() is called, or when it plays to its end (if not looping).
                // If it was stopped manually (isPlaying became false before onended), or if it's looping, don't change button.
                // Only change button to 'Play' if it finished naturally and was not set to loop.
                if (isPlaying && !sourceNode.loop) { 
                    isPlaying = false;
                    playStopButton.textContent = 'Play';
                    console.log("Playback naturally finished (not looping). Button set to 'Play'.");
                }
                // If looping, isPlaying remains true and button remains 'Stop'.
                // If manually stopped, isPlaying is already false.
            };
            
            isPlaying = true;
            playStopButton.textContent = 'Stop';
            console.log("Playback started. Button set to 'Stop'.");
        }
    });

    // --- Waveform Drawing (basic) ---
    function drawWaveform(buffer) {
        if (!canvasCtx || !buffer) {
            console.warn("drawWaveform: Canvas context or buffer missing.");
            return;
        }
        console.log("Drawing waveform...");
        const width = waveformCanvas.width;
        const height = waveformCanvas.height;
        
        // Clear canvas
        canvasCtx.fillStyle = 'rgb(220, 220, 220)';
        canvasCtx.fillRect(0, 0, width, height);
        
        // Draw waveform
        canvasCtx.lineWidth = 1;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        canvasCtx.beginPath();

        const channelData = buffer.getChannelData(0);
        const sliceWidth = width * 1.0 / channelData.length;
        let x = 0;

        for (let i = 0; i < channelData.length; i++) {
            const v = (channelData[i] + 1) / 2;
            const y = (1 - v) * height;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        canvasCtx.stroke();

        // Draw loop region if it exists
        if (currentLoopStart !== currentLoopEnd) {
            const startX = (currentLoopStart / buffer.duration) * width;
            const endX = (currentLoopEnd / buffer.duration) * width;
            
            canvasCtx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            canvasCtx.fillRect(startX, 0, endX - startX, height);
            
            // Draw loop boundaries
            canvasCtx.strokeStyle = 'rgb(0, 255, 0)';
            canvasCtx.lineWidth = 2;
            canvasCtx.beginPath();
            canvasCtx.moveTo(startX, 0);
            canvasCtx.lineTo(startX, height);
            canvasCtx.moveTo(endX, 0);
            canvasCtx.lineTo(endX, height);
            canvasCtx.stroke();
        }

        // Draw current selection if selecting
        if (isSelecting) {
            const startX = Math.min(selectionStart, selectionEnd);
            const endX = Math.max(selectionStart, selectionEnd);
            
            canvasCtx.fillStyle = 'rgba(0, 0, 255, 0.2)';
            canvasCtx.fillRect(startX, 0, endX - startX, height);
        }
        
        console.log("Waveform drawing complete.");
    }

    // Add mouse event listeners for loop selection
    waveformCanvas.addEventListener('mousedown', (e) => {
        if (!audioBuffer) return;
        
        const rect = waveformCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = waveformCanvas.width;
        
        // Check if click is within existing loop region
        const loopStartX = (currentLoopStart / audioBuffer.duration) * width;
        const loopEndX = (currentLoopEnd / audioBuffer.duration) * width;
        
        // Define edge detection threshold (in pixels)
        const edgeThreshold = 5;
        
        if (currentLoopStart !== currentLoopEnd) {
            // Check if click is near the start edge
            if (Math.abs(x - loopStartX) <= edgeThreshold) {
                isResizingLoop = true;
                resizeEdge = 'start';
                dragStartX = x;
                originalLoopStart = currentLoopStart;
                originalLoopEnd = currentLoopEnd;
            }
            // Check if click is near the end edge
            else if (Math.abs(x - loopEndX) <= edgeThreshold) {
                isResizingLoop = true;
                resizeEdge = 'end';
                dragStartX = x;
                originalLoopStart = currentLoopStart;
                originalLoopEnd = currentLoopEnd;
            }
            // Check if click is within the loop region
            else if (x >= loopStartX && x <= loopEndX) {
                isDraggingLoop = true;
                dragStartX = x;
                originalLoopStart = currentLoopStart;
                originalLoopEnd = currentLoopEnd;
            }
            else {
                // Start new selection
                isSelecting = true;
                selectionStart = x;
                selectionEnd = x;
            }
        } else {
            // Start new selection
            isSelecting = true;
            selectionStart = x;
            selectionEnd = x;
        }
        
        // Redraw to show initial state
        drawWaveform(audioBuffer);
    });

    waveformCanvas.addEventListener('mousemove', (e) => {
        if (!audioBuffer) return;
        
        const rect = waveformCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = waveformCanvas.width;
        
        if (isResizingLoop) {
            // Calculate the new time position
            const newTime = (x / width) * audioBuffer.duration;
            
            if (resizeEdge === 'start') {
                // Ensure start doesn't go before 0 or after end
                currentLoopStart = Math.max(0, Math.min(newTime, currentLoopEnd - 0.01));
            } else {
                // Ensure end doesn't go before start or after duration
                currentLoopEnd = Math.max(currentLoopStart + 0.01, Math.min(newTime, audioBuffer.duration));
            }
            
            // Update source node if playing
            if (sourceNode) {
                sourceNode.loopStart = currentLoopStart;
                sourceNode.loopEnd = currentLoopEnd;
            }
        } else if (isDraggingLoop) {
            // Calculate the offset in time
            const timeOffset = ((x - dragStartX) / width) * audioBuffer.duration;
            
            // Update loop points while maintaining the loop size
            currentLoopStart = Math.max(0, Math.min(audioBuffer.duration - (originalLoopEnd - originalLoopStart), originalLoopStart + timeOffset));
            currentLoopEnd = currentLoopStart + (originalLoopEnd - originalLoopStart);
            
            // Update source node if playing
            if (sourceNode) {
                sourceNode.loopStart = currentLoopStart;
                sourceNode.loopEnd = currentLoopEnd;
            }
        } else if (isSelecting) {
            selectionEnd = x;
        }
        
        // Redraw to update display
        drawWaveform(audioBuffer);
    });

    waveformCanvas.addEventListener('mouseup', (e) => {
        if (!audioBuffer) return;
        
        const rect = waveformCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        if (isResizingLoop) {
            isResizingLoop = false;
            resizeEdge = null;
        } else if (isDraggingLoop) {
            isDraggingLoop = false;
        } else if (isSelecting) {
            selectionEnd = x;
            
            // Convert selection to time values
            const width = waveformCanvas.width;
            const startTime = (Math.min(selectionStart, selectionEnd) / width) * audioBuffer.duration;
            const endTime = (Math.max(selectionStart, selectionEnd) / width) * audioBuffer.duration;
            
            // Update loop points
            currentLoopStart = startTime;
            currentLoopEnd = endTime;
            
            // Update source node if playing
            if (sourceNode) {
                sourceNode.loopStart = currentLoopStart;
                sourceNode.loopEnd = currentLoopEnd;
            }
            
            isSelecting = false;
        }
        
        // Redraw to show final state
        drawWaveform(audioBuffer);
    });

    // Add mouseout handler to prevent stuck states
    waveformCanvas.addEventListener('mouseout', () => {
        if (isSelecting || isDraggingLoop || isResizingLoop) {
            isSelecting = false;
            isDraggingLoop = false;
            isResizingLoop = false;
            resizeEdge = null;
            drawWaveform(audioBuffer);
        }
    });

    // --- Control Event Listeners ---
    speedControl.addEventListener('input', () => {
        const rate = parseFloat(speedControl.value);
        speedValueDisplay.textContent = rate.toFixed(2);
        if (sourceNode) { // Apply to currently playing sound
            sourceNode.playbackRate.value = rate;
        }
        console.log("Speed changed to:", rate);
    });

    volumeControl.addEventListener('input', () => {
        const volume = parseFloat(volumeControl.value);
        volumeValueDisplay.textContent = volume.toFixed(2);
        if (gainNode) {
            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        } else {
            console.warn("Volume control: GainNode not initialized.");
        }
        console.log("Volume changed to:", volume);
    });

    panControl.addEventListener('input', () => {
        const pan = parseFloat(panControl.value);
        panValueDisplay.textContent = pan.toFixed(2);
        if (pannerNode) { // pannerNode might be null if not supported
            pannerNode.pan.setValueAtTime(pan, audioContext.currentTime);
        } else {
            // console.warn("Pan control: StereoPannerNode not initialized or supported.");
        }
        console.log("Pan changed to:", pan);
    });

    loopToggle.addEventListener('change', () => {
        const isLooping = loopToggle.checked;
        if (sourceNode) { // Apply to currently playing sound
            sourceNode.loop = isLooping;
            // If looping is turned on, and sound had ended, we might need to restart it.
            // For now, it affects current or next playback.
            // We also need to manage loopStart/loopEnd if using custom loop points.
        }
        console.log("Loop toggled:", isLooping);
    });

    backwardsToggle.addEventListener('change', () => {
        console.log("Backwards toggled:", backwardsToggle.checked);
        if (isPlaying && sourceNode) {
            // Store current playback position
            const currentTime = audioContext.currentTime;
            
            // Stop current playback
            sourceNode.stop();
            sourceNode.disconnect();
            
            // Create new source node
            sourceNode = audioContext.createBufferSource();
            
            // If backwards is checked, use reversed buffer, otherwise use original
            if (backwardsToggle.checked) {
                const originalBuffer = audioBuffer;
                const reversedBuffer = audioContext.createBuffer(
                    originalBuffer.numberOfChannels,
                    originalBuffer.length,
                    originalBuffer.sampleRate
                );
                
                // Reverse each channel
                for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
                    const originalData = originalBuffer.getChannelData(channel);
                    const reversedData = reversedBuffer.getChannelData(channel);
                    for (let i = 0; i < originalData.length; i++) {
                        reversedData[i] = originalData[originalData.length - 1 - i];
                    }
                }
                
                sourceNode.buffer = reversedBuffer;
            } else {
                sourceNode.buffer = audioBuffer;
            }
            
            // Apply current control settings
            const baseRate = parseFloat(speedControl.value);
            sourceNode.playbackRate.value = baseRate;
            sourceNode.loop = loopToggle.checked;
            
            // Connect and start
            sourceNode.connect(gainNode);
            
            sourceNode.onended = () => {
                if (isPlaying && !sourceNode.loop) {
                    isPlaying = false;
                    playStopButton.textContent = 'Play';
                }
            };
            
            // Start playback immediately
            sourceNode.start(0);
            
            // Keep the play button in "Stop" state
            playStopButton.textContent = 'Stop';
        }
    });

    // Initial UI state
    playStopButton.disabled = true;
    console.log("Initial UI state set. Play button disabled.");

    // Initialize MIDI
    async function initMIDI() {
        try {
            midiAccess = await navigator.requestMIDIAccess();
            updateMIDIInputs();
            
            // Listen for MIDI device changes
            midiAccess.onstatechange = updateMIDIInputs;
            
            console.log("MIDI access granted");
        } catch (error) {
            console.error("MIDI access error:", error);
        }
    }

    function updateMIDIInputs() {
        // Clear existing options
        midiInputSelect.innerHTML = '<option value="">No MIDI Input</option>';
        
        // Add available MIDI inputs
        for (const input of midiAccess.inputs.values()) {
            const option = document.createElement('option');
            option.value = input.id;
            option.textContent = input.name || `MIDI Input ${input.id}`;
            midiInputSelect.appendChild(option);
        }
    }

    // MIDI Learn mode
    midiLearnButton.addEventListener('click', () => {
        isMidiLearnMode = !isMidiLearnMode;
        midiLearnButton.textContent = isMidiLearnMode ? 'Cancel' : 'Learn';
        midiMappingStatus.style.display = isMidiLearnMode ? 'block' : 'none';
        
        if (!isMidiLearnMode) {
            controlToMap = null;
        }
    });

    // MIDI Input change handler
    midiInputSelect.addEventListener('change', () => {
        if (midiInput) {
            midiInput.onmidimessage = null;
        }
        
        const selectedInput = midiAccess.inputs.get(midiInputSelect.value);
        if (selectedInput) {
            midiInput = selectedInput;
            midiInput.onmidimessage = handleMIDIMessage;
            console.log("MIDI input connected:", midiInput.name);
        } else {
            midiInput = null;
            console.log("MIDI input disconnected");
        }
    });

    // Add trigger functionality
    triggerButton.addEventListener('click', async () => {
        console.log("Trigger button clicked.");
        await resumeAudioContext();

        if (!audioContext || !audioBuffer) {
            console.warn("Trigger: AudioContext or audioBuffer not ready.");
            return;
        }
        if (!gainNode) {
            console.error("Trigger: GainNode is not initialized. Cannot play audio.");
            return;
        }

        // Stop any existing playback
        if (sourceNode) {
            sourceNode.stop();
            sourceNode.disconnect();
        }

        // Create new source node
        sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;

        // Apply current control settings
        const baseRate = parseFloat(speedControl.value);
        sourceNode.playbackRate.value = backwardsToggle.checked ? -baseRate : baseRate;
        
        // If we have a loop region, start from there
        const startTime = currentLoopStart !== currentLoopEnd ? currentLoopStart : 0;
        
        // Connect and start
        sourceNode.connect(gainNode);
        sourceNode.start(0, startTime);
        
        // Set up onended handler
        sourceNode.onended = () => {
            if (sourceNode) {
                sourceNode.disconnect();
                sourceNode = null;
            }
        };
    });

    // Add MIDI learn to all controls
    addMIDILearnToControl('speed', speedControl);
    addMIDILearnToControl('volume', volumeControl);
    addMIDILearnToControl('pan', panControl);
    addMIDILearnToControl('loop', loopToggle);
    addMIDILearnToControl('backwards', backwardsToggle);
    addMIDILearnToControl('playStop', playStopButton);

    // MIDI message handler
    function handleMIDIMessage(message) {
        const [status, data1, data2] = message.data;
        const messageType = status >> 4;
        const channel = status & 0x0F;
        
        // Handle MIDI Learn
        if (isMidiLearnMode && controlToMap) {
            const mapping = {
                type: messageType === 0x9 ? 'note' : 'cc',
                channel: channel,
                controller: data1
            };
            midiMappings[controlToMap] = mapping;
            console.log(`Mapped ${controlToMap} to MIDI ${mapping.type} ${data1}`);
            controlToMap = null;
            isMidiLearnMode = false;
            midiLearnButton.textContent = 'Learn';
            midiMappingStatus.style.display = 'none';
            return;
        }
        
        // Handle mapped controls
        for (const [control, mapping] of Object.entries(midiMappings)) {
            if (mapping.channel === channel && mapping.controller === data1) {
                if (mapping.type === 'cc') {
                    const value = data2 / 127; // Normalize to 0-1
                    updateControlFromMIDI(control, value);
                } else if (mapping.type === 'note' && messageType === 0x9) {
                    // For play/stop, respond to note-on with velocity > 0
                    if (control === 'playStop' && data2 > 0) {
                        playStopButton.click();
                    }
                }
            }
        }
    }

    function updateControlFromMIDI(control, value) {
        switch (control) {
            case 'playStop':
                // Toggle play/stop at midpoint
                if (value > 0.5 && !isPlaying) {
                    playStopButton.click();
                } else if (value <= 0.5 && isPlaying) {
                    playStopButton.click();
                }
                break;
            case 'speed':
                // Map MIDI value (0-1) to speed range (0.1-2.0)
                const minSpeed = parseFloat(speedControl.min);
                const maxSpeed = parseFloat(speedControl.max);
                const speedValue = minSpeed + (value * (maxSpeed - minSpeed));
                speedControl.value = speedValue.toFixed(2);
                speedValueDisplay.textContent = speedValue.toFixed(2);
                if (sourceNode) {
                    sourceNode.playbackRate.value = speedValue;
                }
                break;
            case 'volume':
                volumeControl.value = value;
                volumeValueDisplay.textContent = value.toFixed(2);
                if (gainNode) {
                    gainNode.gain.setValueAtTime(value, audioContext.currentTime);
                }
                break;
            case 'pan':
                panControl.value = value * 2 - 1; // Convert 0-1 to -1 to 1
                panValueDisplay.textContent = panControl.value.toFixed(2);
                if (pannerNode) {
                    pannerNode.pan.setValueAtTime(panControl.value, audioContext.currentTime);
                }
                break;
            case 'loop':
                loopToggle.checked = value > 0.5;
                if (sourceNode) {
                    sourceNode.loop = loopToggle.checked;
                }
                break;
            case 'backwards':
                backwardsToggle.checked = value > 0.5;
                if (sourceNode) {
                    const baseRate = parseFloat(speedControl.value);
                    sourceNode.playbackRate.value = backwardsToggle.checked ? -baseRate : baseRate;
                }
                break;
        }
    }

    // Add MIDI learn to controls
    function addMIDILearnToControl(control, element) {
        element.addEventListener('click', (e) => {
            if (isMidiLearnMode) {
                e.preventDefault();
                controlToMap = control;
                midiMappingStatus.textContent = `Move a MIDI controller to map ${control}...`;
            }
        });
    }

    // Initialize MIDI
    initMIDI();
});