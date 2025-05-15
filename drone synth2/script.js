// Web Audio API code will go here
// console.log("Drone synth script loaded."); // We can remove this now

let audioCtx;
let isPlaying = false;
// Store all active audio nodes for an oscillator: { osc, gainNode, detuneLfo, detuneLfoDepth, volumeLfo, volumeLfoDepth }
const activeAudioNodes = [];

const startStopButton = document.getElementById('startStopButton');

// Global controls
const masterFrequencySlider = document.getElementById('masterFrequency');
const masterFrequencyValueDisplay = document.getElementById('masterFrequencyValue');
const masterFrequencyNumber = document.getElementById('masterFrequencyNumber');

// Oscillator 1 controls
const osc1DetuneSlider = document.getElementById('osc1Detune');
const osc1DetuneValueDisplay = document.getElementById('osc1DetuneValue');
const osc1WaveformSelect = document.getElementById('osc1Waveform');
const osc1VolumeSlider = document.getElementById('osc1Volume');
const osc1VolumeValueDisplay = document.getElementById('osc1VolumeValue');

// Oscillator 1 Detune LFO Controls
const osc1DetuneLfoWaveformSelect = document.getElementById('osc1DetuneLfoWaveform');
const osc1DetuneLfoSpeedSlider = document.getElementById('osc1DetuneLfoSpeed');
const osc1DetuneLfoSpeedNumber = document.getElementById('osc1DetuneLfoSpeedNumber');
const osc1DetuneLfoSpeedValueDisplay = document.getElementById('osc1DetuneLfoSpeedValue');
const osc1DetuneLfoDepthSlider = document.getElementById('osc1DetuneLfoDepth');
const osc1DetuneLfoDepthValueDisplay = document.getElementById('osc1DetuneLfoDepthValue');
const osc1DetuneLfoCustomWaveContainer = document.getElementById('osc1DetuneLfoCustomWaveContainer');
const osc1DetuneLfoCanvas = document.getElementById('osc1DetuneLfoCanvas');
const osc1DetuneLfoApplyCustomWaveButton = document.getElementById('osc1DetuneLfoApplyCustomWave');

// Oscillator 1 Volume LFO Controls
const osc1VolumeLfoWaveformSelect = document.getElementById('osc1VolumeLfoWaveform');
const osc1VolumeLfoSpeedSlider = document.getElementById('osc1VolumeLfoSpeed');
const osc1VolumeLfoSpeedNumber = document.getElementById('osc1VolumeLfoSpeedNumber');
const osc1VolumeLfoSpeedValueDisplay = document.getElementById('osc1VolumeLfoSpeedValue');
const osc1VolumeLfoDepthSlider = document.getElementById('osc1VolumeLfoDepth');
const osc1VolumeLfoDepthValueDisplay = document.getElementById('osc1VolumeLfoDepthValue');
const osc1VolumeLfoCustomWaveContainer = document.getElementById('osc1VolumeLfoCustomWaveContainer');
const osc1VolumeLfoCanvas = document.getElementById('osc1VolumeLfoCanvas');
const osc1VolumeLfoApplyCustomWaveButton = document.getElementById('osc1VolumeLfoApplyCustomWave');

// Store custom wave data
let osc1DetuneLfoPeriodicWave = null;
let osc1DetuneLfoCustomCurve = null; // This will store the Float32Array for the WaveShaper
const OSC1_DETUNE_LFO_CURVE_SIZE = 256; // Number of points in our custom LFO wave
const OSC1_LFO_CURVE_SIZE = 256; // Shared curve size

// Oscillator 2 DOM Elements
const osc2WaveformSelect = document.getElementById('osc2Waveform');
const osc2DetuneSlider = document.getElementById('osc2Detune');
const osc2DetuneValueDisplay = document.getElementById('osc2DetuneValue');
const osc2VolumeSlider = document.getElementById('osc2Volume');
const osc2VolumeValueDisplay = document.getElementById('osc2VolumeValue');
// Osc2 Detune LFO
const osc2DetuneLfoWaveformSelect = document.getElementById('osc2DetuneLfoWaveform');
const osc2DetuneLfoSpeedSlider = document.getElementById('osc2DetuneLfoSpeed');
const osc2DetuneLfoSpeedNumber = document.getElementById('osc2DetuneLfoSpeedNumber');
const osc2DetuneLfoSpeedValueDisplay = document.getElementById('osc2DetuneLfoSpeedValue');
const osc2DetuneLfoDepthSlider = document.getElementById('osc2DetuneLfoDepth');
const osc2DetuneLfoDepthValueDisplay = document.getElementById('osc2DetuneLfoDepthValue');
const osc2DetuneLfoCustomWaveContainer = document.getElementById('osc2DetuneLfoCustomWaveContainer');
const osc2DetuneLfoCanvas = document.getElementById('osc2DetuneLfoCanvas');
const osc2DetuneLfoApplyCustomWaveButton = document.getElementById('osc2DetuneLfoApplyCustomWave');
// Osc2 Volume LFO
const osc2VolumeLfoWaveformSelect = document.getElementById('osc2VolumeLfoWaveform');
const osc2VolumeLfoSpeedSlider = document.getElementById('osc2VolumeLfoSpeed');
const osc2VolumeLfoSpeedNumber = document.getElementById('osc2VolumeLfoSpeedNumber');
const osc2VolumeLfoSpeedValueDisplay = document.getElementById('osc2VolumeLfoSpeedValue');
const osc2VolumeLfoDepthSlider = document.getElementById('osc2VolumeLfoDepth');
const osc2VolumeLfoDepthValueDisplay = document.getElementById('osc2VolumeLfoDepthValue');
const osc2VolumeLfoCustomWaveContainer = document.getElementById('osc2VolumeLfoCustomWaveContainer');
const osc2VolumeLfoCanvas = document.getElementById('osc2VolumeLfoCanvas');
const osc2VolumeLfoApplyCustomWaveButton = document.getElementById('osc2VolumeLfoApplyCustomWave');

// Oscillator 3 DOM Elements
const osc3WaveformSelect = document.getElementById('osc3Waveform');
const osc3DetuneSlider = document.getElementById('osc3Detune');
const osc3DetuneValueDisplay = document.getElementById('osc3DetuneValue');
const osc3VolumeSlider = document.getElementById('osc3Volume');
const osc3VolumeValueDisplay = document.getElementById('osc3VolumeValue');
// Osc3 Detune LFO
const osc3DetuneLfoWaveformSelect = document.getElementById('osc3DetuneLfoWaveform');
const osc3DetuneLfoSpeedSlider = document.getElementById('osc3DetuneLfoSpeed');
const osc3DetuneLfoSpeedNumber = document.getElementById('osc3DetuneLfoSpeedNumber');
const osc3DetuneLfoSpeedValueDisplay = document.getElementById('osc3DetuneLfoSpeedValue');
const osc3DetuneLfoDepthSlider = document.getElementById('osc3DetuneLfoDepth');
const osc3DetuneLfoDepthValueDisplay = document.getElementById('osc3DetuneLfoDepthValue');
const osc3DetuneLfoCustomWaveContainer = document.getElementById('osc3DetuneLfoCustomWaveContainer');
const osc3DetuneLfoCanvas = document.getElementById('osc3DetuneLfoCanvas');
const osc3DetuneLfoApplyCustomWaveButton = document.getElementById('osc3DetuneLfoApplyCustomWave');
// Osc3 Volume LFO
const osc3VolumeLfoWaveformSelect = document.getElementById('osc3VolumeLfoWaveform');
const osc3VolumeLfoSpeedSlider = document.getElementById('osc3VolumeLfoSpeed');
const osc3VolumeLfoSpeedNumber = document.getElementById('osc3VolumeLfoSpeedNumber');
const osc3VolumeLfoSpeedValueDisplay = document.getElementById('osc3VolumeLfoSpeedValue');
const osc3VolumeLfoDepthSlider = document.getElementById('osc3VolumeLfoDepth');
const osc3VolumeLfoDepthValueDisplay = document.getElementById('osc3VolumeLfoDepthValue');
const osc3VolumeLfoCustomWaveContainer = document.getElementById('osc3VolumeLfoCustomWaveContainer');
const osc3VolumeLfoCanvas = document.getElementById('osc3VolumeLfoCanvas');
const osc3VolumeLfoApplyCustomWaveButton = document.getElementById('osc3VolumeLfoApplyCustomWave');

// Global Effects DOM Elements
const filterTypeSelect = document.getElementById('filterType');
const filterFrequencySlider = document.getElementById('filterFrequency');
const filterFreqValueDisplay = document.getElementById('filterFreqValue');
const filterQSlider = document.getElementById('filterQ');
const filterQValueDisplay = document.getElementById('filterQValue');
const filterGainGroup = document.getElementById('filterGainGroup');
const filterGainSlider = document.getElementById('filterGain');
const filterGainValueDisplay = document.getElementById('filterGainValue');
const filterFrequencyMidiLearnButton = document.getElementById('filterFrequencyMidiLearn'); // New
const filterQMidiLearnButton = document.getElementById('filterQMidiLearn'); // New
const filterGainMidiLearnButton = document.getElementById('filterGainMidiLearn'); // New

const reverbMixSlider = document.getElementById('reverbMix');
const reverbMixValueDisplay = document.getElementById('reverbMixValue');
const reverbPreDelaySlider = document.getElementById('reverbPreDelay');
const reverbPreDelayValueDisplay = document.getElementById('reverbPreDelayValue');
const reverbDecaySlider = document.getElementById('reverbDecay'); // For IR generation
const reverbDecayValueDisplay = document.getElementById('reverbDecayValue');
const reverbFeedbackGainSlider = document.getElementById('reverbFeedbackGain'); // For feedback loop gain
const reverbFeedbackGainValueDisplay = document.getElementById('reverbFeedbackGainValue');

const masterVolumeSlider = document.getElementById('masterVolume');
const masterVolumeValueDisplay = document.getElementById('masterVolumeValue');
const masterVolumeMidiLearnButton = document.getElementById('masterVolumeMidiLearn');
const midiInputSelector = document.getElementById('midiInput');

// Global Audio Nodes for Effects
let globalFilter, dryGain, wetGain, reverbPreDelayNode, reverbConvolver, reverbFeedback, masterOutputVolume;

// Initial display updates
masterFrequencyValueDisplay.textContent = masterFrequencySlider.value + " Hz";
osc1DetuneValueDisplay.textContent = osc1DetuneSlider.value + " cents";
osc1VolumeValueDisplay.textContent = parseFloat(osc1VolumeSlider.value).toFixed(2);
updateLfoSpeedDisplay(osc1DetuneLfoSpeedSlider.value, osc1DetuneLfoSpeedValueDisplay);
osc1DetuneLfoSpeedNumber.value = osc1DetuneLfoSpeedSlider.value;
osc1DetuneLfoDepthValueDisplay.textContent = osc1DetuneLfoDepthSlider.value + " cents";
updateLfoSpeedDisplay(osc1VolumeLfoSpeedSlider.value, osc1VolumeLfoSpeedValueDisplay);
osc1VolumeLfoSpeedNumber.value = osc1VolumeLfoSpeedSlider.value;
osc1VolumeLfoDepthValueDisplay.textContent = parseFloat(osc1VolumeLfoDepthSlider.value).toFixed(2);

// MIDI Specific Variables
let midiAccess = null;
let activeMidiInput = null;
let masterVolumeMidiMap = null; // { channel: X, controller: Y }
let isLearningMasterVolume = false;
let filterFrequencyMidiMap = null; // New
let isLearningFilterFrequency = false; // New
let filterQMidiMap = null; // New
let isLearningFilterQ = false; // New
let filterGainMidiMap = null; // New
let isLearningFilterGain = false; // New

// Preset DOM Elements
const exportPresetButton = document.getElementById('exportPresetButton');
const importPresetButton = document.getElementById('importPresetButton');
const presetSelector = document.getElementById('presetSelector');

// Function to populate the preset dropdown
async function populatePresetDropdown() {
    if (!presetSelector) return;

    const presetFiles = ['wobble.json', 'thisone.json']; // Manually listing for now
    // In a real scenario, you might fetch this list from the server or a config file
    // For example: const response = await fetch('/api/presets');
    // const presetFiles = await response.json();

    presetSelector.innerHTML = '<option value="">-- Select Preset --</option>'; // Clear existing options

    presetFiles.forEach(fileName => {
        const option = document.createElement('option');
        option.value = fileName;
        option.textContent = fileName.replace('.json', ''); // Display without .json
        presetSelector.appendChild(option);
    });
}

// Function to load the selected preset
async function loadSelectedPreset() {
    if (!presetSelector || !presetSelector.value) return;

    const fileName = presetSelector.value;
    const filePath = `preset/${fileName}`;

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            console.error(`Error loading preset file: ${response.statusText}`);
            alert(`Error loading preset: ${fileName}. Check console for details.`);
            return;
        }
        const presetData = await response.json();
        applyPresetData(presetData);
        console.log(`Preset loaded: ${fileName}`);
        // Optionally, provide feedback to the user
        // alert(`Preset '${fileName.replace('.json', '')}' loaded.`);
    } catch (error) {
        console.error(`Error fetching or parsing preset file ${fileName}:`, error);
        alert(`Error loading preset: ${fileName}. Check console for details.`);
    }
}

function setupEventListeners() {
    // This function can be populated with other event listeners if needed later.
    // For now, it prevents an error in initializeSynth.
    // console.log("Setting up event listeners (placeholder)"); // Original comment

    // == Ensure existing event listeners are preserved ==
    // Example: if (startStopButton) startStopButton.addEventListener('click', toggleSound);
    // (The actual existing listeners need to be kept here from the original file)

    if (exportPresetButton) {
        exportPresetButton.addEventListener('click', exportPreset);
    }
    if (importPresetButton) {
        importPresetButton.addEventListener('click', importPreset);
    }
    if (presetSelector) {
        presetSelector.addEventListener('change', loadSelectedPreset);
    }
}

function initializeSynth() {
    initAudio();
    setupEventListeners();
    populatePresetDropdown(); // Call the new function here
    initializeUIDisplays();
    requestMidiAccess();
    if (typeof loadMidiMappings === "function") { // Check if loadMidiMappings exists
        loadMidiMappings();
    }
}

function requestMidiAccess() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess()
            .then(onMIDISuccess, onMIDIFailure);
    } else {
        console.warn("Web MIDI API is not supported in this browser.");
        midiInputSelector.innerHTML = '<option value="">MIDI not supported</option>';
        midiInputSelector.disabled = true;
    }
}

function onMIDISuccess(ma) {
    midiAccess = ma;
    populateMidiInputSelector();
    midiAccess.onstatechange = populateMidiInputSelector; // Handle connections/disconnections
    // Initially, select the first available input if any
    if (midiAccess.inputs.size > 0) {
        const firstInput = midiAccess.inputs.values().next().value;
        if (firstInput) {
            selectMidiInput(firstInput.id);
            midiInputSelector.value = firstInput.id;
        }
    }
}

function onMIDIFailure(msg) {
    console.error(`Failed to get MIDI access - ${msg}`);
    midiInputSelector.innerHTML = '<option value="">MIDI access failed</option>';
    midiInputSelector.disabled = true;
}

function populateMidiInputSelector() {
    if (!midiAccess) return;
    midiInputSelector.innerHTML = '<option value="">-- Select MIDI Input --</option>';
    if (midiAccess.inputs.size === 0) {
        midiInputSelector.innerHTML = '<option value="">No MIDI devices found</option>';
        if (activeMidiInput) {
            activeMidiInput.onmidimessage = null; // Clear listener from old input
            activeMidiInput = null;
        }
        return;
    }
    midiAccess.inputs.forEach(input => {
        const option = document.createElement('option');
        option.value = input.id;
        option.textContent = input.name;
        midiInputSelector.appendChild(option);
    });
}

function selectMidiInput(inputId) {
    if (!midiAccess) return;
    if (activeMidiInput) {
        activeMidiInput.onmidimessage = null; // Clear listener from previous input
    }
    activeMidiInput = midiAccess.inputs.get(inputId);
    if (activeMidiInput) {
        console.log(`MIDI Input selected: ${activeMidiInput.name}`);
        activeMidiInput.onmidimessage = onMIDIMessage;
    } else {
        console.log("Selected MIDI input not found or disconnected.");
    }
}

function onMIDIMessage(event) {
    const [status, data1, data2] = event.data;
    const command = status >> 4;
    const channel = (status & 0xf) + 1; // MIDI channels 1-16

    // Check for Control Change (CC) messages
    if (command === 11) { // 11 means CC
        const controller = data1;
        const value = data2; // MIDI CC value (0-127)

        if (isLearningMasterVolume) {
            masterVolumeMidiMap = { channel, controller };
            isLearningMasterVolume = false;
            masterVolumeMidiLearnButton.textContent = "Learn";
            masterVolumeMidiLearnButton.classList.remove('learning');
            console.log(`Master Volume learned: Ch ${channel}, CC ${controller}`);
            localStorage.setItem('masterVolumeMidiMap', JSON.stringify(masterVolumeMidiMap));
            return;
        } else if (isLearningFilterFrequency) {
            filterFrequencyMidiMap = { channel, controller };
            isLearningFilterFrequency = false;
            filterFrequencyMidiLearnButton.textContent = "Learn";
            filterFrequencyMidiLearnButton.classList.remove('learning');
            console.log(`Filter Frequency learned: Ch ${channel}, CC ${controller}`);
            localStorage.setItem('filterFrequencyMidiMap', JSON.stringify(filterFrequencyMidiMap));
            return;
        } else if (isLearningFilterQ) {
            filterQMidiMap = { channel, controller };
            isLearningFilterQ = false;
            filterQMidiLearnButton.textContent = "Learn";
            filterQMidiLearnButton.classList.remove('learning');
            console.log(`Filter Q learned: Ch ${channel}, CC ${controller}`);
            localStorage.setItem('filterQMidiMap', JSON.stringify(filterQMidiMap));
            return;
        } else if (isLearningFilterGain) {
            filterGainMidiMap = { channel, controller };
            isLearningFilterGain = false;
            filterGainMidiLearnButton.textContent = "Learn";
            filterGainMidiLearnButton.classList.remove('learning');
            console.log(`Filter Gain learned: Ch ${channel}, CC ${controller}`);
            localStorage.setItem('filterGainMidiMap', JSON.stringify(filterGainMidiMap));
            return;
        }

        // Apply learned MIDI mappings
        if (masterVolumeMidiMap && masterVolumeMidiMap.channel === channel && masterVolumeMidiMap.controller === controller) {
            const newVolume = value / 127;
            masterVolumeSlider.value = newVolume;
            // masterVolumeValueDisplay.textContent = newVolume.toFixed(2); // updateGlobalEffectParams will do this
            // if (masterOutputVolume && audioCtx) { // smoothSet is now inside updateGlobalEffectParams
            //     smoothSet(masterOutputVolume.gain, newVolume);
            // }
            updateGlobalEffectParams();
        } else if (filterFrequencyMidiMap && filterFrequencyMidiMap.channel === channel && filterFrequencyMidiMap.controller === controller) {
            // Filter frequency slider is 0-100, MIDI is 0-127. Direct mapping.
            const newSliderValue = Math.round((value / 127) * 100);
            filterFrequencySlider.value = newSliderValue;
            // filterFreqValueDisplay will be updated by updateGlobalEffectParams
            updateGlobalEffectParams();
        } else if (filterQMidiMap && filterQMidiMap.channel === channel && filterQMidiMap.controller === controller) {
            // Filter Q slider has min 0.0001, max 30. MIDI is 0-127.
            const minQ = parseFloat(filterQSlider.min);
            const maxQ = parseFloat(filterQSlider.max);
            // Simple linear mapping for Q, can be refined if non-linear feel is desired
            const newQValue = minQ + (value / 127) * (maxQ - minQ);
            filterQSlider.value = newQValue;
            // filterQValueDisplay will be updated by updateGlobalEffectParams
            updateGlobalEffectParams();
        } else if (filterGainMidiMap && filterGainMidiMap.channel === channel && filterGainMidiMap.controller === controller) {
            // Filter Gain slider has min -40, max 40. MIDI is 0-127.
            const minGain = parseFloat(filterGainSlider.min);
            const maxGain = parseFloat(filterGainSlider.max);
            const newGainValue = minGain + (value / 127) * (maxGain - minGain);
            filterGainSlider.value = newGainValue;
            // filterGainValueDisplay will be updated by updateGlobalEffectParams
            updateGlobalEffectParams();
        }
    }
}

function updateLfoSpeedDisplay(value, displayElement) {
    const numValue = parseFloat(value);
    displayElement.textContent = numValue.toFixed(Math.max(1, Math.min(8, (numValue.toString().split('.')[1] || '').length))) + " Hz";
}

// --- Event Listeners for UI controls ---
masterFrequencySlider.addEventListener('input', (event) => {
    const newFreq = parseFloat(event.target.value);
    masterFrequencyValueDisplay.textContent = newFreq.toFixed(0) + " Hz";
    masterFrequencyNumber.value = newFreq.toFixed(0);

    if (isPlaying && audioCtx) {
        activeAudioNodes.forEach((nodes, index) => {
            if (nodes && nodes.osc) {
                nodes.osc.frequency.setValueAtTime(newFreq, audioCtx.currentTime);
                // Re-apply detune for this specific oscillator
                // We need to get the detune slider value for the current oscillator
                let detuneValue = 0;
                if (index === 0) detuneValue = parseFloat(osc1DetuneSlider.value);
                else if (index === 1) detuneValue = parseFloat(osc2DetuneSlider.value);
                else if (index === 2) detuneValue = parseFloat(osc3DetuneSlider.value);
                nodes.osc.detune.setTargetAtTime(detuneValue, audioCtx.currentTime, 0.01); // Smooth change
            }
        });
    }
});

masterFrequencyNumber.addEventListener('input', (event) => {
    let newFreq = parseFloat(event.target.value);
    if (isNaN(newFreq)) {
        // If input is not a number (e.g., empty or invalid text), 
        // try to use the slider's current value or a default if synth isn't playing.
        // Or simply return and do nothing if that's preferred.
        // For now, let's just prevent NaN from propagating.
        if (isPlaying && audioCtx) {
            // Optionally reset to slider's current value or do nothing
        } else {
            // Optionally reset to slider's current value or do nothing
        }
        return; // Exit if not a valid number to avoid errors
    }
    
    // No longer clamp to slider range for the audio output
    // const minFreq = parseFloat(masterFrequencySlider.min);
    // const maxFreq = parseFloat(masterFrequencySlider.max);
    // newFreq = Math.max(minFreq, Math.min(maxFreq, newFreq)); // Clamping removed for audio

    // Slider will still try to represent this value, clamping visually at its own limits
    masterFrequencySlider.value = newFreq;
    masterFrequencyValueDisplay.textContent = newFreq.toFixed(0) + " Hz";
    // event.target.value = newFreq.toFixed(0); // Keep the typed value, even if outside slider range

    if (isPlaying && audioCtx) {
        activeAudioNodes.forEach((nodes, index) => {
            if (nodes && nodes.osc) {
                nodes.osc.frequency.setValueAtTime(newFreq, audioCtx.currentTime);
                let detuneValue = 0;
                if (index === 0) detuneValue = parseFloat(osc1DetuneSlider.value);
                else if (index === 1) detuneValue = parseFloat(osc2DetuneSlider.value);
                else if (index === 2) detuneValue = parseFloat(osc3DetuneSlider.value);
                nodes.osc.detune.setTargetAtTime(detuneValue, audioCtx.currentTime, 0.01);
            }
        });
    }
});

osc1DetuneSlider.addEventListener('input', (event) => {
    const detuneValue = event.target.value;
    osc1DetuneValueDisplay.textContent = detuneValue + " cents";
    if (isPlaying && activeAudioNodes[0] && activeAudioNodes[0].osc) {
        // This becomes the new center for the LFO modulation
        activeAudioNodes[0].osc.detune.setTargetAtTime(parseFloat(detuneValue), audioCtx.currentTime, 0.01);
    }
});

osc1WaveformSelect.addEventListener('input', (event) => {
    if (isPlaying && activeAudioNodes[0] && activeAudioNodes[0].osc) {
        activeAudioNodes[0].osc.type = event.target.value;
    }
});

osc1VolumeSlider.addEventListener('input', (event) => {
    const newMainVolume = parseFloat(event.target.value);
    osc1VolumeValueDisplay.textContent = newMainVolume.toFixed(2);

    if (isPlaying && activeAudioNodes[0] && activeAudioNodes[0].gainNode) {
        activeAudioNodes[0].gainNode.gain.setTargetAtTime(newMainVolume, audioCtx.currentTime, 0.01);

        if (activeAudioNodes[0].volumeLfoDepth) {
            const currentVolLfoDepthSetting = parseFloat(osc1VolumeLfoDepthSlider.value);
            activeAudioNodes[0].volumeLfoDepth.gain.setValueAtTime(currentVolLfoDepthSetting * newMainVolume, audioCtx.currentTime);
        }
    }
});

// Oscillator 1 Detune LFO Listeners
osc1DetuneLfoWaveformSelect.addEventListener('input', (event) => {
    const selectedWaveform = event.target.value;
    const osc1AudioNodes = activeAudioNodes[0]; // Assuming osc1 is always at index 0

    if (selectedWaveform === 'custom') {
        osc1DetuneLfoCustomWaveContainer.style.display = 'block';
        if (isPlaying && osc1AudioNodes && osc1AudioNodes.detuneLfo && osc1AudioNodes.detuneLfoWaveShaper) {
            osc1AudioNodes.detuneLfo.type = 'sawtooth';
            osc1AudioNodes.detuneLfoWaveShaper.curve = osc1DetuneLfoCustomWaveData.curve;
            // Disconnect LFO from depth, connect LFO to shaper, shaper to depth
            try { osc1AudioNodes.detuneLfo.disconnect(osc1AudioNodes.detuneLfoDepth); } catch (e) { /* ignore if not connected */ }
            osc1AudioNodes.detuneLfo.connect(osc1AudioNodes.detuneLfoWaveShaper);
            osc1AudioNodes.detuneLfoWaveShaper.connect(osc1AudioNodes.detuneLfoDepth);
        }
    } else {
        osc1DetuneLfoCustomWaveContainer.style.display = 'none';
        if (isPlaying && osc1AudioNodes && osc1AudioNodes.detuneLfo) {
            osc1AudioNodes.detuneLfo.type = selectedWaveform;
            if (osc1AudioNodes.detuneLfoWaveShaper) {
                // Disconnect LFO from shaper, shaper from depth, connect LFO to depth
                try { osc1AudioNodes.detuneLfo.disconnect(osc1AudioNodes.detuneLfoWaveShaper); } catch (e) { /* ignore */ }
                try { osc1AudioNodes.detuneLfoWaveShaper.disconnect(osc1AudioNodes.detuneLfoDepth); } catch (e) { /* ignore */ }
            }
            osc1AudioNodes.detuneLfo.connect(osc1AudioNodes.detuneLfoDepth);
        }
    }
});

osc1DetuneLfoSpeedSlider.addEventListener('input', (event) => {
    const speed = parseFloat(event.target.value);
    osc1DetuneLfoSpeedNumber.value = speed;
    updateLfoSpeedDisplay(speed, osc1DetuneLfoSpeedValueDisplay);
    if (isPlaying && activeAudioNodes[0] && activeAudioNodes[0].detuneLfo) {
        activeAudioNodes[0].detuneLfo.frequency.setValueAtTime(speed, audioCtx.currentTime);
    }
});

osc1DetuneLfoSpeedNumber.addEventListener('input', (event) => {
    let speed = parseFloat(event.target.value);
    if (isNaN(speed)) return;
    // Clamp value for the slider if it's out of slider's specific range
    const sliderMin = parseFloat(osc1DetuneLfoSpeedSlider.min);
    const sliderMax = parseFloat(osc1DetuneLfoSpeedSlider.max);
    osc1DetuneLfoSpeedSlider.value = Math.max(sliderMin, Math.min(sliderMax, speed));

    updateLfoSpeedDisplay(speed, osc1DetuneLfoSpeedValueDisplay);
    if (isPlaying && activeAudioNodes[0] && activeAudioNodes[0].detuneLfo) {
        activeAudioNodes[0].detuneLfo.frequency.setValueAtTime(speed, audioCtx.currentTime);
    }
});

osc1DetuneLfoDepthSlider.addEventListener('input', (event) => {
    const depth = event.target.value;
    osc1DetuneLfoDepthValueDisplay.textContent = depth + " cents";
    if (isPlaying && activeAudioNodes[0] && activeAudioNodes[0].detuneLfoDepth) {
        activeAudioNodes[0].detuneLfoDepth.gain.setValueAtTime(parseFloat(depth), audioCtx.currentTime);
    }
});

// Oscillator 1 Volume LFO Listeners
osc1VolumeLfoWaveformSelect.addEventListener('input', (event) => {
    const selectedWaveform = event.target.value;
    const osc1AudioNodes = activeAudioNodes[0];

    if (selectedWaveform === 'custom') {
        osc1VolumeLfoCustomWaveContainer.style.display = 'block';
        if (isPlaying && osc1AudioNodes && osc1AudioNodes.volumeLfo && osc1AudioNodes.volumeLfoWaveShaper) {
            osc1AudioNodes.volumeLfo.type = 'sawtooth';
            osc1AudioNodes.volumeLfoWaveShaper.curve = osc1VolumeLfoCustomWaveData.curve;
            try { osc1AudioNodes.volumeLfo.disconnect(osc1AudioNodes.volumeLfoDepth); } catch (e) { /* ignore */ }
            osc1AudioNodes.volumeLfo.connect(osc1AudioNodes.volumeLfoWaveShaper);
            osc1AudioNodes.volumeLfoWaveShaper.connect(osc1AudioNodes.volumeLfoDepth);
        }
    } else {
        osc1VolumeLfoCustomWaveContainer.style.display = 'none';
        if (isPlaying && osc1AudioNodes && osc1AudioNodes.volumeLfo) {
            osc1AudioNodes.volumeLfo.type = selectedWaveform;
            if (osc1AudioNodes.volumeLfoWaveShaper) {
                try { osc1AudioNodes.volumeLfo.disconnect(osc1AudioNodes.volumeLfoWaveShaper); } catch (e) { /* ignore */ }
                try { osc1AudioNodes.volumeLfoWaveShaper.disconnect(osc1AudioNodes.volumeLfoDepth); } catch (e) { /* ignore */ }
            }
            osc1AudioNodes.volumeLfo.connect(osc1AudioNodes.volumeLfoDepth);
        }
    }
});

osc1VolumeLfoSpeedSlider.addEventListener('input', (event) => {
    const speed = parseFloat(event.target.value);
    osc1VolumeLfoSpeedNumber.value = speed;
    updateLfoSpeedDisplay(speed, osc1VolumeLfoSpeedValueDisplay);
    if (isPlaying && activeAudioNodes[0] && activeAudioNodes[0].volumeLfo) {
        activeAudioNodes[0].volumeLfo.frequency.setValueAtTime(speed, audioCtx.currentTime);
    }
});

osc1VolumeLfoSpeedNumber.addEventListener('input', (event) => {
    let speed = parseFloat(event.target.value);
    if (isNaN(speed)) return;
    const sliderMin = parseFloat(osc1VolumeLfoSpeedSlider.min);
    const sliderMax = parseFloat(osc1VolumeLfoSpeedSlider.max);
    osc1VolumeLfoSpeedSlider.value = Math.max(sliderMin, Math.min(sliderMax, speed));

    updateLfoSpeedDisplay(speed, osc1VolumeLfoSpeedValueDisplay);
    if (isPlaying && activeAudioNodes[0] && activeAudioNodes[0].volumeLfo) {
        activeAudioNodes[0].volumeLfo.frequency.setValueAtTime(speed, audioCtx.currentTime);
    }
});

osc1VolumeLfoDepthSlider.addEventListener('input', (event) => {
    const newLfoDepthSetting = parseFloat(event.target.value);
    osc1VolumeLfoDepthValueDisplay.textContent = newLfoDepthSetting.toFixed(2);

    if (isPlaying && activeAudioNodes[0] && activeAudioNodes[0].volumeLfoDepth) {
        const currentMainVolume = parseFloat(osc1VolumeSlider.value);
        activeAudioNodes[0].volumeLfoDepth.gain.setValueAtTime(newLfoDepthSetting * currentMainVolume, audioCtx.currentTime);
    }
});

// --- Event Listeners for OSCILLATOR 2 ---
// Osc2 Main Controls
osc2WaveformSelect.addEventListener('input', (event) => {
    if (isPlaying && activeAudioNodes[1] && activeAudioNodes[1].osc) {
        activeAudioNodes[1].osc.type = event.target.value;
    }
});
osc2DetuneSlider.addEventListener('input', (event) => {
    const detuneValue = parseFloat(event.target.value);
    osc2DetuneValueDisplay.textContent = detuneValue + " cents";
    if (isPlaying && activeAudioNodes[1] && activeAudioNodes[1].osc) {
        activeAudioNodes[1].osc.detune.setTargetAtTime(detuneValue, audioCtx.currentTime, 0.01);
    }
});
osc2VolumeSlider.addEventListener('input', (event) => {
    const newMainVolume = parseFloat(event.target.value);
    osc2VolumeValueDisplay.textContent = newMainVolume.toFixed(2);
    if (isPlaying && activeAudioNodes[1] && activeAudioNodes[1].gainNode) {
        activeAudioNodes[1].gainNode.gain.setTargetAtTime(newMainVolume, audioCtx.currentTime, 0.01);
        if (activeAudioNodes[1].volumeLfoDepth) {
            const currentVolLfoDepthSetting = parseFloat(osc2VolumeLfoDepthSlider.value);
            activeAudioNodes[1].volumeLfoDepth.gain.setValueAtTime(currentVolLfoDepthSetting * newMainVolume, audioCtx.currentTime);
        }
    }
});

// Osc2 Detune LFO Listeners
osc2DetuneLfoWaveformSelect.addEventListener('input', (event) => {
    const selectedWaveform = event.target.value;
    const oscAudioNodes = activeAudioNodes[1];
    if (selectedWaveform === 'custom') {
        osc2DetuneLfoCustomWaveContainer.style.display = 'block';
        if (isPlaying && oscAudioNodes && oscAudioNodes.detuneLfo && oscAudioNodes.detuneLfoWaveShaper) {
            oscAudioNodes.detuneLfo.type = 'sawtooth';
            oscAudioNodes.detuneLfoWaveShaper.curve = osc2DetuneLfoCustomWaveData.curve;
            try { oscAudioNodes.detuneLfo.disconnect(oscAudioNodes.detuneLfoDepth); } catch (e) { /* ignore */ }
            oscAudioNodes.detuneLfo.connect(oscAudioNodes.detuneLfoWaveShaper);
            oscAudioNodes.detuneLfoWaveShaper.connect(oscAudioNodes.detuneLfoDepth);
        }
    } else {
        osc2DetuneLfoCustomWaveContainer.style.display = 'none';
        if (isPlaying && oscAudioNodes && oscAudioNodes.detuneLfo) {
            oscAudioNodes.detuneLfo.type = selectedWaveform;
            if (oscAudioNodes.detuneLfoWaveShaper) {
                try { oscAudioNodes.detuneLfo.disconnect(oscAudioNodes.detuneLfoWaveShaper); } catch (e) { /* ignore */ }
                try { oscAudioNodes.detuneLfoWaveShaper.disconnect(oscAudioNodes.detuneLfoDepth); } catch (e) { /* ignore */ }
            }
            oscAudioNodes.detuneLfo.connect(oscAudioNodes.detuneLfoDepth);
        }
    }
});
osc2DetuneLfoSpeedSlider.addEventListener('input', (event) => {
    const speed = parseFloat(event.target.value);
    osc2DetuneLfoSpeedNumber.value = speed;
    updateLfoSpeedDisplay(speed, osc2DetuneLfoSpeedValueDisplay);
    if (isPlaying && activeAudioNodes[1] && activeAudioNodes[1].detuneLfo) {
        activeAudioNodes[1].detuneLfo.frequency.setValueAtTime(speed, audioCtx.currentTime);
    }
});
osc2DetuneLfoSpeedNumber.addEventListener('input', (event) => {
    let speed = parseFloat(event.target.value);
    if (isNaN(speed)) return;
    const sliderMin = parseFloat(osc2DetuneLfoSpeedSlider.min);
    const sliderMax = parseFloat(osc2DetuneLfoSpeedSlider.max);
    osc2DetuneLfoSpeedSlider.value = Math.max(sliderMin, Math.min(sliderMax, speed));
    updateLfoSpeedDisplay(speed, osc2DetuneLfoSpeedValueDisplay);
    if (isPlaying && activeAudioNodes[1] && activeAudioNodes[1].detuneLfo) {
        activeAudioNodes[1].detuneLfo.frequency.setValueAtTime(speed, audioCtx.currentTime);
    }
});
osc2DetuneLfoDepthSlider.addEventListener('input', (event) => {
    const depth = parseFloat(event.target.value);
    osc2DetuneLfoDepthValueDisplay.textContent = depth + " cents";
    if (isPlaying && activeAudioNodes[1] && activeAudioNodes[1].detuneLfoDepth) {
        activeAudioNodes[1].detuneLfoDepth.gain.setValueAtTime(depth, audioCtx.currentTime);
    }
});

// Osc2 Volume LFO Listeners
osc2VolumeLfoWaveformSelect.addEventListener('input', (event) => {
    const selectedWaveform = event.target.value;
    const oscAudioNodes = activeAudioNodes[1];
    if (selectedWaveform === 'custom') {
        osc2VolumeLfoCustomWaveContainer.style.display = 'block';
        if (isPlaying && oscAudioNodes && oscAudioNodes.volumeLfo && oscAudioNodes.volumeLfoWaveShaper) {
            oscAudioNodes.volumeLfo.type = 'sawtooth';
            oscAudioNodes.volumeLfoWaveShaper.curve = osc2VolumeLfoCustomWaveData.curve;
            try { oscAudioNodes.volumeLfo.disconnect(oscAudioNodes.volumeLfoDepth); } catch (e) { /* ignore */ }
            oscAudioNodes.volumeLfo.connect(oscAudioNodes.volumeLfoWaveShaper);
            oscAudioNodes.volumeLfoWaveShaper.connect(oscAudioNodes.volumeLfoDepth);
        }
    } else {
        osc2VolumeLfoCustomWaveContainer.style.display = 'none';
        if (isPlaying && oscAudioNodes && oscAudioNodes.volumeLfo) {
            oscAudioNodes.volumeLfo.type = selectedWaveform;
            if (oscAudioNodes.volumeLfoWaveShaper) {
                try { oscAudioNodes.volumeLfo.disconnect(oscAudioNodes.volumeLfoWaveShaper); } catch (e) { /* ignore */ }
                try { oscAudioNodes.volumeLfoWaveShaper.disconnect(oscAudioNodes.volumeLfoDepth); } catch (e) { /* ignore */ }
            }
            oscAudioNodes.volumeLfo.connect(oscAudioNodes.volumeLfoDepth);
        }
    }
});
osc2VolumeLfoSpeedSlider.addEventListener('input', (event) => {
    const speed = parseFloat(event.target.value);
    osc2VolumeLfoSpeedNumber.value = speed;
    updateLfoSpeedDisplay(speed, osc2VolumeLfoSpeedValueDisplay);
    if (isPlaying && activeAudioNodes[1] && activeAudioNodes[1].volumeLfo) {
        activeAudioNodes[1].volumeLfo.frequency.setValueAtTime(speed, audioCtx.currentTime);
    }
});
osc2VolumeLfoSpeedNumber.addEventListener('input', (event) => {
    let speed = parseFloat(event.target.value);
    if (isNaN(speed)) return;
    const sliderMin = parseFloat(osc2VolumeLfoSpeedSlider.min);
    const sliderMax = parseFloat(osc2VolumeLfoSpeedSlider.max);
    osc2VolumeLfoSpeedSlider.value = Math.max(sliderMin, Math.min(sliderMax, speed));
    updateLfoSpeedDisplay(speed, osc2VolumeLfoSpeedValueDisplay);
    if (isPlaying && activeAudioNodes[1] && activeAudioNodes[1].volumeLfo) {
        activeAudioNodes[1].volumeLfo.frequency.setValueAtTime(speed, audioCtx.currentTime);
    }
});
osc2VolumeLfoDepthSlider.addEventListener('input', (event) => {
    const depth = parseFloat(event.target.value);
    osc2VolumeLfoDepthValueDisplay.textContent = depth.toFixed(2);
    if (isPlaying && activeAudioNodes[1] && activeAudioNodes[1].volumeLfoDepth) {
        const currentMainVolume = parseFloat(osc2VolumeSlider.value);
        activeAudioNodes[1].volumeLfoDepth.gain.setValueAtTime(depth * currentMainVolume, audioCtx.currentTime);
    }
});

// --- Event Listeners for OSCILLATOR 3 ---
// Osc3 Main Controls
osc3WaveformSelect.addEventListener('input', (event) => {
    if (isPlaying && activeAudioNodes[2] && activeAudioNodes[2].osc) {
        activeAudioNodes[2].osc.type = event.target.value;
    }
});
osc3DetuneSlider.addEventListener('input', (event) => {
    const detuneValue = parseFloat(event.target.value);
    osc3DetuneValueDisplay.textContent = detuneValue + " cents";
    if (isPlaying && activeAudioNodes[2] && activeAudioNodes[2].osc) {
        activeAudioNodes[2].osc.detune.setTargetAtTime(detuneValue, audioCtx.currentTime, 0.01);
    }
});
osc3VolumeSlider.addEventListener('input', (event) => {
    const newMainVolume = parseFloat(event.target.value);
    osc3VolumeValueDisplay.textContent = newMainVolume.toFixed(2);
    if (isPlaying && activeAudioNodes[2] && activeAudioNodes[2].gainNode) {
        activeAudioNodes[2].gainNode.gain.setTargetAtTime(newMainVolume, audioCtx.currentTime, 0.01);
        if (activeAudioNodes[2].volumeLfoDepth) {
            const currentVolLfoDepthSetting = parseFloat(osc3VolumeLfoDepthSlider.value);
            activeAudioNodes[2].volumeLfoDepth.gain.setValueAtTime(currentVolLfoDepthSetting * newMainVolume, audioCtx.currentTime);
        }
    }
});

// Osc3 Detune LFO Listeners
osc3DetuneLfoWaveformSelect.addEventListener('input', (event) => {
    const selectedWaveform = event.target.value;
    const oscAudioNodes = activeAudioNodes[2];
    if (selectedWaveform === 'custom') {
        osc3DetuneLfoCustomWaveContainer.style.display = 'block';
        if (isPlaying && oscAudioNodes && oscAudioNodes.detuneLfo && oscAudioNodes.detuneLfoWaveShaper) {
            oscAudioNodes.detuneLfo.type = 'sawtooth';
            oscAudioNodes.detuneLfoWaveShaper.curve = osc3DetuneLfoCustomWaveData.curve;
            try { oscAudioNodes.detuneLfo.disconnect(oscAudioNodes.detuneLfoDepth); } catch (e) { /* ignore */ }
            oscAudioNodes.detuneLfo.connect(oscAudioNodes.detuneLfoWaveShaper);
            oscAudioNodes.detuneLfoWaveShaper.connect(oscAudioNodes.detuneLfoDepth);
        }
    } else {
        osc3DetuneLfoCustomWaveContainer.style.display = 'none';
        if (isPlaying && oscAudioNodes && oscAudioNodes.detuneLfo) {
            oscAudioNodes.detuneLfo.type = selectedWaveform;
            if (oscAudioNodes.detuneLfoWaveShaper) {
                try { oscAudioNodes.detuneLfo.disconnect(oscAudioNodes.detuneLfoWaveShaper); } catch (e) { /* ignore */ }
                try { oscAudioNodes.detuneLfoWaveShaper.disconnect(oscAudioNodes.detuneLfoDepth); } catch (e) { /* ignore */ }
            }
            oscAudioNodes.detuneLfo.connect(oscAudioNodes.detuneLfoDepth);
        }
    }
});
osc3DetuneLfoSpeedSlider.addEventListener('input', (event) => {
    const speed = parseFloat(event.target.value);
    osc3DetuneLfoSpeedNumber.value = speed;
    updateLfoSpeedDisplay(speed, osc3DetuneLfoSpeedValueDisplay);
    if (isPlaying && activeAudioNodes[2] && activeAudioNodes[2].detuneLfo) {
        activeAudioNodes[2].detuneLfo.frequency.setValueAtTime(speed, audioCtx.currentTime);
    }
});
osc3DetuneLfoSpeedNumber.addEventListener('input', (event) => {
    let speed = parseFloat(event.target.value);
    if (isNaN(speed)) return;
    const sliderMin = parseFloat(osc3DetuneLfoSpeedSlider.min);
    const sliderMax = parseFloat(osc3DetuneLfoSpeedSlider.max);
    osc3DetuneLfoSpeedSlider.value = Math.max(sliderMin, Math.min(sliderMax, speed));
    updateLfoSpeedDisplay(speed, osc3DetuneLfoSpeedValueDisplay);
    if (isPlaying && activeAudioNodes[2] && activeAudioNodes[2].detuneLfo) {
        activeAudioNodes[2].detuneLfo.frequency.setValueAtTime(speed, audioCtx.currentTime);
    }
});
osc3DetuneLfoDepthSlider.addEventListener('input', (event) => {
    const depth = parseFloat(event.target.value);
    osc3DetuneLfoDepthValueDisplay.textContent = depth + " cents";
    if (isPlaying && activeAudioNodes[2] && activeAudioNodes[2].detuneLfoDepth) {
        activeAudioNodes[2].detuneLfoDepth.gain.setValueAtTime(depth, audioCtx.currentTime);
    }
});

// Osc3 Volume LFO Listeners
osc3VolumeLfoWaveformSelect.addEventListener('input', (event) => {
    const selectedWaveform = event.target.value;
    const oscAudioNodes = activeAudioNodes[2];
    if (selectedWaveform === 'custom') {
        osc3VolumeLfoCustomWaveContainer.style.display = 'block';
        if (isPlaying && oscAudioNodes && oscAudioNodes.volumeLfo && oscAudioNodes.volumeLfoWaveShaper) {
            oscAudioNodes.volumeLfo.type = 'sawtooth';
            oscAudioNodes.volumeLfoWaveShaper.curve = osc3VolumeLfoCustomWaveData.curve;
            try { oscAudioNodes.volumeLfo.disconnect(oscAudioNodes.volumeLfoDepth); } catch (e) { /* ignore */ }
            oscAudioNodes.volumeLfo.connect(oscAudioNodes.volumeLfoWaveShaper);
            oscAudioNodes.volumeLfoWaveShaper.connect(oscAudioNodes.volumeLfoDepth);
        }
    } else {
        osc3VolumeLfoCustomWaveContainer.style.display = 'none';
        if (isPlaying && oscAudioNodes && oscAudioNodes.volumeLfo) {
            oscAudioNodes.volumeLfo.type = selectedWaveform;
            if (oscAudioNodes.volumeLfoWaveShaper) {
                try { oscAudioNodes.volumeLfo.disconnect(oscAudioNodes.volumeLfoWaveShaper); } catch (e) { /* ignore */ }
                try { oscAudioNodes.volumeLfoWaveShaper.disconnect(oscAudioNodes.volumeLfoDepth); } catch (e) { /* ignore */ }
            }
            oscAudioNodes.volumeLfo.connect(oscAudioNodes.volumeLfoDepth);
        }
    }
});
osc3VolumeLfoSpeedSlider.addEventListener('input', (event) => {
    const speed = parseFloat(event.target.value);
    osc3VolumeLfoSpeedNumber.value = speed;
    updateLfoSpeedDisplay(speed, osc3VolumeLfoSpeedValueDisplay);
    if (isPlaying && activeAudioNodes[2] && activeAudioNodes[2].volumeLfo) {
        activeAudioNodes[2].volumeLfo.frequency.setValueAtTime(speed, audioCtx.currentTime);
    }
});
osc3VolumeLfoSpeedNumber.addEventListener('input', (event) => {
    let speed = parseFloat(event.target.value);
    if (isNaN(speed)) return;
    const sliderMin = parseFloat(osc3VolumeLfoSpeedSlider.min);
    const sliderMax = parseFloat(osc3VolumeLfoSpeedSlider.max);
    osc3VolumeLfoSpeedSlider.value = Math.max(sliderMin, Math.min(sliderMax, speed));
    updateLfoSpeedDisplay(speed, osc3VolumeLfoSpeedValueDisplay);
    if (isPlaying && activeAudioNodes[2] && activeAudioNodes[2].volumeLfo) {
        activeAudioNodes[2].volumeLfo.frequency.setValueAtTime(speed, audioCtx.currentTime);
    }
});
osc3VolumeLfoDepthSlider.addEventListener('input', (event) => {
    const depth = parseFloat(event.target.value);
    osc3VolumeLfoDepthValueDisplay.textContent = depth.toFixed(2);
    if (isPlaying && activeAudioNodes[2] && activeAudioNodes[2].volumeLfoDepth) {
        const currentMainVolume = parseFloat(osc3VolumeSlider.value);
        activeAudioNodes[2].volumeLfoDepth.gain.setValueAtTime(depth * currentMainVolume, audioCtx.currentTime);
    }
});

// --- Audio Engine ---
startStopButton.addEventListener('click', () => {
    if (!audioCtx) {
        initAudio(); // initAudio will now create global effect nodes
        updateGlobalEffectParams(); // Initialize effect params based on UI
    }
    if (audioCtx.state === 'suspended') { // Ensure context is running
        audioCtx.resume();
    }
    if (isPlaying) {
        stopSound();
        startStopButton.textContent = 'Start';
    } else {
        playSound(); // playSound will connect oscillators to the effects chain
        startStopButton.textContent = 'Stop';
    }
    isPlaying = !isPlaying;
});

function initAudio() {
    if (audioCtx) return; // Initialize only once
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    console.log("AudioContext initialized with global effects chain.");

    // Create global effect nodes
    globalFilter = audioCtx.createBiquadFilter();
    dryGain = audioCtx.createGain();
    wetGain = audioCtx.createGain();
    reverbPreDelayNode = audioCtx.createDelay(1.0); // Max 1 sec predelay
    reverbConvolver = audioCtx.createConvolver();
    reverbFeedback = audioCtx.createGain();
    masterOutputVolume = audioCtx.createGain();

    // Generate initial impulse response for reverb
    const initialReverbDecay = parseFloat(reverbDecaySlider.value);
    reverbConvolver.buffer = createIR(initialReverbDecay, initialReverbDecay);

    // Connect the static part of the effects chain (filter -> reverb components -> output volume)
    // Oscillators will connect to globalFilter when playSound() is called.
    globalFilter.connect(dryGain);
    globalFilter.connect(reverbPreDelayNode);
    reverbPreDelayNode.connect(reverbConvolver);
    reverbConvolver.connect(reverbFeedback);
    reverbFeedback.connect(reverbPreDelayNode); // Feedback loop
    reverbConvolver.connect(wetGain);
    
    dryGain.connect(masterOutputVolume);
    wetGain.connect(masterOutputVolume);
    masterOutputVolume.connect(audioCtx.destination);
    
    initializeUIDisplays(); // Ensure UI display values for effects are set after nodes are ready
    updateGlobalEffectParams(); // Apply initial UI settings to the new audio nodes
}

function playSound() {
    if (!audioCtx) { // Should be initialized by start button click now
        console.error("AudioContext not initialized for playSound");
        return;
    }
    console.log("Playing sound for 3 oscillators through effects chain...");
    activeAudioNodes.length = 0; 

    const numOscillators = 3;
    const baseFrequency = parseFloat(masterFrequencySlider.value);

    for (let i = 0; i < numOscillators; i++) {
        const oscNodes = {};
        activeAudioNodes.push(oscNodes);
        // ... (Get UI elements for current oscillator as before) ...
        const currentWaveformSelect = [osc1WaveformSelect, osc2WaveformSelect, osc3WaveformSelect][i];
        const currentDetuneSlider = [osc1DetuneSlider, osc2DetuneSlider, osc3DetuneSlider][i];
        const currentVolumeSlider = [osc1VolumeSlider, osc2VolumeSlider, osc3VolumeSlider][i];
        const currentDetuneLfoWaveformSelect = [osc1DetuneLfoWaveformSelect, osc2DetuneLfoWaveformSelect, osc3DetuneLfoWaveformSelect][i];
        const currentDetuneLfoSpeedNumber = [osc1DetuneLfoSpeedNumber, osc2DetuneLfoSpeedNumber, osc3DetuneLfoSpeedNumber][i];
        const currentDetuneLfoDepthSlider = [osc1DetuneLfoDepthSlider, osc2DetuneLfoDepthSlider, osc3DetuneLfoDepthSlider][i];
        const currentDetuneLfoCustomWaveData = [osc1DetuneLfoCustomWaveData, osc2DetuneLfoCustomWaveData, osc3DetuneLfoCustomWaveData][i];
        const currentVolumeLfoWaveformSelect = [osc1VolumeLfoWaveformSelect, osc2VolumeLfoWaveformSelect, osc3VolumeLfoWaveformSelect][i];
        const currentVolumeLfoSpeedNumber = [osc1VolumeLfoSpeedNumber, osc2VolumeLfoSpeedNumber, osc3VolumeLfoSpeedNumber][i];
        const currentVolumeLfoDepthSlider = [osc1VolumeLfoDepthSlider, osc2VolumeLfoDepthSlider, osc3VolumeLfoDepthSlider][i];
        const currentVolumeLfoCustomWaveData = [osc1VolumeLfoCustomWaveData, osc2VolumeLfoCustomWaveData, osc3VolumeLfoCustomWaveData][i];

        // ... (Setup for oscNodes.osc, gainNode, LFOs, WaveShapers for each oscillator as before) ...
        oscNodes.osc = audioCtx.createOscillator();
        oscNodes.gainNode = audioCtx.createGain();
        const detuneValue = parseFloat(currentDetuneSlider.value);
        const waveform = currentWaveformSelect.value;
        const mainOscVolume = parseFloat(currentVolumeSlider.value);
        oscNodes.osc.frequency.setValueAtTime(baseFrequency, audioCtx.currentTime);
        oscNodes.osc.detune.setValueAtTime(detuneValue, audioCtx.currentTime);
        oscNodes.osc.type = waveform;
        oscNodes.gainNode.gain.setValueAtTime(mainOscVolume, audioCtx.currentTime);
        oscNodes.detuneLfo = audioCtx.createOscillator();
        oscNodes.detuneLfoDepth = audioCtx.createGain();
        oscNodes.detuneLfoWaveShaper = audioCtx.createWaveShaper();
        const detuneLfoSelectedWaveform = currentDetuneLfoWaveformSelect.value;
        const detuneLfoSpeed = parseFloat(currentDetuneLfoSpeedNumber.value);
        const detuneLfoDepthValue = parseFloat(currentDetuneLfoDepthSlider.value);
        oscNodes.detuneLfo.frequency.setValueAtTime(detuneLfoSpeed, audioCtx.currentTime);
        oscNodes.detuneLfoDepth.gain.setValueAtTime(detuneLfoDepthValue, audioCtx.currentTime);
        if (detuneLfoSelectedWaveform === 'custom') {
            oscNodes.detuneLfo.type = 'sawtooth';
            oscNodes.detuneLfoWaveShaper.curve = currentDetuneLfoCustomWaveData.curve;
            oscNodes.detuneLfo.connect(oscNodes.detuneLfoWaveShaper);
            oscNodes.detuneLfoWaveShaper.connect(oscNodes.detuneLfoDepth);
        } else {
            oscNodes.detuneLfo.type = detuneLfoSelectedWaveform;
            oscNodes.detuneLfo.connect(oscNodes.detuneLfoDepth);
        }
        oscNodes.detuneLfoDepth.connect(oscNodes.osc.detune);
        oscNodes.volumeLfo = audioCtx.createOscillator();
        oscNodes.volumeLfoDepth = audioCtx.createGain();
        oscNodes.volumeLfoWaveShaper = audioCtx.createWaveShaper();
        const volLfoSelectedWaveform = currentVolumeLfoWaveformSelect.value;
        const volLfoSpeed = parseFloat(currentVolumeLfoSpeedNumber.value);
        const volLfoDepthSetting = parseFloat(currentVolumeLfoDepthSlider.value);
        oscNodes.volumeLfo.frequency.setValueAtTime(volLfoSpeed, audioCtx.currentTime);
        oscNodes.volumeLfoDepth.gain.setValueAtTime(volLfoDepthSetting * mainOscVolume, audioCtx.currentTime);
        if (volLfoSelectedWaveform === 'custom') {
            oscNodes.volumeLfo.type = 'sawtooth';
            oscNodes.volumeLfoWaveShaper.curve = currentVolumeLfoCustomWaveData.curve;
            oscNodes.volumeLfo.connect(oscNodes.volumeLfoWaveShaper);
            oscNodes.volumeLfoWaveShaper.connect(oscNodes.volumeLfoDepth);
        } else {
            oscNodes.volumeLfo.type = volLfoSelectedWaveform;
            oscNodes.volumeLfo.connect(oscNodes.volumeLfoDepth);
        }
        oscNodes.volumeLfoDepth.connect(oscNodes.gainNode.gain);

        // Connect oscillator's output to the GLOBAL FILTER
        oscNodes.osc.connect(oscNodes.gainNode);
        oscNodes.gainNode.connect(globalFilter); // <<< CHANGE HERE

        oscNodes.detuneLfo.start();
        oscNodes.volumeLfo.start();
        oscNodes.osc.start();
    }
    updateGlobalEffectParams(); // Ensure effects are set when sound starts
}

function stopSound() {
    if (!audioCtx) return;
    console.log("Stopping all oscillators and disconnecting from effects...");
    activeAudioNodes.forEach(nodes => {
        if (nodes.osc) { nodes.osc.stop(); nodes.osc.disconnect(); } // Disconnects from gainNode
        if (nodes.gainNode) { nodes.gainNode.disconnect(); } // Disconnects from globalFilter

        // LFOs and their components are already disconnected from their targets by osc.disconnect()
        // or gainNode.disconnect() if they were connected to .detune or .gain parameters.
        // However, explicit disconnection of LFO nodes themselves is good practice.
        if (nodes.detuneLfo) { nodes.detuneLfo.stop(); nodes.detuneLfo.disconnect(); }
        if (nodes.detuneLfoDepth) { nodes.detuneLfoDepth.disconnect(); }
        if (nodes.detuneLfoWaveShaper) { nodes.detuneLfoWaveShaper.disconnect(); }

        if (nodes.volumeLfo) { nodes.volumeLfo.stop(); nodes.volumeLfo.disconnect(); }
        if (nodes.volumeLfoDepth) { nodes.volumeLfoDepth.disconnect(); }
        if (nodes.volumeLfoWaveShaper) { nodes.volumeLfoWaveShaper.disconnect(); }
    });
    activeAudioNodes.length = 0;
    // We don't disconnect the global effects chain itself, just the oscillators from it.
}

// --- Setup Canvas Drawing (modified to accept a callback) ---
function setupLfoCanvasDrawing(canvas, applyButton, curveStorageObject, curveSize, onApplyCallback) {
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let drawnPoints = new Array(curveSize).fill(canvas.height / 2);
    let lastX = -1, lastY = -1;

    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        let firstDrawnIndex = 0;
        ctx.moveTo((firstDrawnIndex / (curveSize -1)) * canvas.width, drawnPoints[firstDrawnIndex]);
        for (let i = firstDrawnIndex + 1; i < curveSize; i++) {
            const xPos = (i / (curveSize - 1)) * canvas.width;
            ctx.lineTo(xPos, drawnPoints[i]);
        }
        ctx.stroke();
    }
    redrawCanvas();

    function drawLine(x0, y0, x1, y1) {
        x0 = Math.floor(x0); y0 = Math.floor(y0); x1 = Math.floor(x1); y1 = Math.floor(y1);
        const dx = Math.abs(x1 - x0); const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1; const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;
        while(true) {
            if (x0 >= 0 && x0 < curveSize) { drawnPoints[x0] = Math.max(0, Math.min(canvas.height, y0)); }
            if ((x0 === x1) && (y0 === y1)) break;
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true; const rect = canvas.getBoundingClientRect();
        const currentX = ((e.clientX - rect.left) / canvas.width) * curveSize;
        const currentY = e.clientY - rect.top;
        const pointX = Math.floor(currentX);
        if (pointX >=0 && pointX < curveSize) { drawnPoints[pointX] = Math.max(0, Math.min(canvas.height, currentY)); }
        lastX = currentX; lastY = currentY;
        redrawCanvas();
    });
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return; const rect = canvas.getBoundingClientRect();
        const currentX = ((e.clientX - rect.left) / canvas.width) * curveSize;
        const currentY = e.clientY - rect.top;
        if (lastX !== -1) { drawLine(lastX, lastY, currentX, currentY); }
        lastX = currentX; lastY = currentY;
        redrawCanvas();
    });
    canvas.addEventListener('mouseup', () => { isDrawing = false; lastX = -1; lastY = -1; });
    canvas.addEventListener('mouseleave', () => { /* ... (mouseleave logic as before) ... */ });

    applyButton.addEventListener('click', () => {
        const normalizedCurve = new Float32Array(curveSize);
        for (let i = 0; i < curveSize; i++) {
            normalizedCurve[i] = ((canvas.height / 2) - drawnPoints[i]) / (canvas.height / 2);
        }
        curveStorageObject.curve = normalizedCurve;
        console.log("Custom LFO curve data prepared for " + canvas.id + ":", curveStorageObject.curve);
        if (typeof onApplyCallback === 'function') {
            onApplyCallback(curveStorageObject.curve); // Pass the curve to the specific callback
        }
    });
}

// Initialize canvas drawing for Osc1 Detune LFO
const osc1DetuneLfoCustomWaveData = { curve: null }; 
setupLfoCanvasDrawing(
    osc1DetuneLfoCanvas, 
    osc1DetuneLfoApplyCustomWaveButton, 
    osc1DetuneLfoCustomWaveData, 
    OSC1_LFO_CURVE_SIZE,
    (curve) => { // onApplyCallback for Detune LFO
        if (isPlaying && activeAudioNodes[0] && activeAudioNodes[0].detuneLfoWaveShaper && osc1DetuneLfoWaveformSelect.value === 'custom') {
            activeAudioNodes[0].detuneLfoWaveShaper.curve = curve;
            console.log("Detune LFO WaveShaperNode curve updated dynamically.");
        }
    }
);
osc1DetuneLfoCustomWaveData.curve = new Float32Array(OSC1_LFO_CURVE_SIZE).fill(0);

// Initialize canvas drawing for Osc1 Volume LFO
const osc1VolumeLfoCustomWaveData = { curve: null }; 
setupLfoCanvasDrawing(
    osc1VolumeLfoCanvas, 
    osc1VolumeLfoApplyCustomWaveButton, 
    osc1VolumeLfoCustomWaveData, 
    OSC1_LFO_CURVE_SIZE,
    (curve) => { // onApplyCallback for Volume LFO
        if (isPlaying && activeAudioNodes[0] && activeAudioNodes[0].volumeLfoWaveShaper && osc1VolumeLfoWaveformSelect.value === 'custom') {
            activeAudioNodes[0].volumeLfoWaveShaper.curve = curve;
            console.log("Volume LFO WaveShaperNode curve updated dynamically.");
        }
    }
);
osc1VolumeLfoCustomWaveData.curve = new Float32Array(OSC1_LFO_CURVE_SIZE).fill(0);

// Initialize canvas drawing for Osc2 Detune LFO
const osc2DetuneLfoCustomWaveData = { curve: null }; 
setupLfoCanvasDrawing(
    osc2DetuneLfoCanvas, 
    osc2DetuneLfoApplyCustomWaveButton, 
    osc2DetuneLfoCustomWaveData, 
    OSC1_LFO_CURVE_SIZE, // Using shared curve size const
    (curve) => { 
        if (isPlaying && activeAudioNodes[1] && activeAudioNodes[1].detuneLfoWaveShaper && osc2DetuneLfoWaveformSelect.value === 'custom') {
            activeAudioNodes[1].detuneLfoWaveShaper.curve = curve;
            console.log("Osc2 Detune LFO WaveShaperNode curve updated.");
        }
    }
);
osc2DetuneLfoCustomWaveData.curve = new Float32Array(OSC1_LFO_CURVE_SIZE).fill(0);

// Initialize canvas drawing for Osc2 Volume LFO
const osc2VolumeLfoCustomWaveData = { curve: null }; 
setupLfoCanvasDrawing(
    osc2VolumeLfoCanvas, 
    osc2VolumeLfoApplyCustomWaveButton, 
    osc2VolumeLfoCustomWaveData, 
    OSC1_LFO_CURVE_SIZE,
    (curve) => { 
        if (isPlaying && activeAudioNodes[1] && activeAudioNodes[1].volumeLfoWaveShaper && osc2VolumeLfoWaveformSelect.value === 'custom') {
            activeAudioNodes[1].volumeLfoWaveShaper.curve = curve;
            console.log("Osc2 Volume LFO WaveShaperNode curve updated.");
        }
    }
);
osc2VolumeLfoCustomWaveData.curve = new Float32Array(OSC1_LFO_CURVE_SIZE).fill(0);

// Initialize canvas drawing for Osc3 Detune LFO
const osc3DetuneLfoCustomWaveData = { curve: null }; 
setupLfoCanvasDrawing(
    osc3DetuneLfoCanvas, 
    osc3DetuneLfoApplyCustomWaveButton, 
    osc3DetuneLfoCustomWaveData, 
    OSC1_LFO_CURVE_SIZE,
    (curve) => { 
        if (isPlaying && activeAudioNodes[2] && activeAudioNodes[2].detuneLfoWaveShaper && osc3DetuneLfoWaveformSelect.value === 'custom') {
            activeAudioNodes[2].detuneLfoWaveShaper.curve = curve;
            console.log("Osc3 Detune LFO WaveShaperNode curve updated.");
        }
    }
);
osc3DetuneLfoCustomWaveData.curve = new Float32Array(OSC1_LFO_CURVE_SIZE).fill(0);

// Initialize canvas drawing for Osc3 Volume LFO
const osc3VolumeLfoCustomWaveData = { curve: null }; 
setupLfoCanvasDrawing(
    osc3VolumeLfoCanvas, 
    osc3VolumeLfoApplyCustomWaveButton, 
    osc3VolumeLfoCustomWaveData, 
    OSC1_LFO_CURVE_SIZE,
    (curve) => { 
        if (isPlaying && activeAudioNodes[2] && activeAudioNodes[2].volumeLfoWaveShaper && osc3VolumeLfoWaveformSelect.value === 'custom') {
            activeAudioNodes[2].volumeLfoWaveShaper.curve = curve;
            console.log("Osc3 Volume LFO WaveShaperNode curve updated.");
        }
    }
);
osc3VolumeLfoCustomWaveData.curve = new Float32Array(OSC1_LFO_CURVE_SIZE).fill(0);

// Initial Display Updates for Osc1, Osc2, Osc3 and Global Effects
function initializeUIDisplays() {
    // Osc 1
    masterFrequencyValueDisplay.textContent = masterFrequencySlider.value + " Hz";
    osc1DetuneValueDisplay.textContent = osc1DetuneSlider.value + " cents";
    osc1VolumeValueDisplay.textContent = parseFloat(osc1VolumeSlider.value).toFixed(2);
    updateLfoSpeedDisplay(osc1DetuneLfoSpeedSlider.value, osc1DetuneLfoSpeedValueDisplay);
    osc1DetuneLfoSpeedNumber.value = osc1DetuneLfoSpeedSlider.value;
    osc1DetuneLfoDepthValueDisplay.textContent = osc1DetuneLfoDepthSlider.value + " cents";
    updateLfoSpeedDisplay(osc1VolumeLfoSpeedSlider.value, osc1VolumeLfoSpeedValueDisplay);
    osc1VolumeLfoSpeedNumber.value = osc1VolumeLfoSpeedSlider.value;
    osc1VolumeLfoDepthValueDisplay.textContent = parseFloat(osc1VolumeLfoDepthSlider.value).toFixed(2);

    // Osc 2
    osc2DetuneValueDisplay.textContent = osc2DetuneSlider.value + " cents";
    osc2VolumeValueDisplay.textContent = parseFloat(osc2VolumeSlider.value).toFixed(2);
    updateLfoSpeedDisplay(osc2DetuneLfoSpeedSlider.value, osc2DetuneLfoSpeedValueDisplay);
    osc2DetuneLfoSpeedNumber.value = osc2DetuneLfoSpeedSlider.value;
    osc2DetuneLfoDepthValueDisplay.textContent = osc2DetuneLfoDepthSlider.value + " cents";
    updateLfoSpeedDisplay(osc2VolumeLfoSpeedSlider.value, osc2VolumeLfoSpeedValueDisplay);
    osc2VolumeLfoSpeedNumber.value = osc2VolumeLfoSpeedSlider.value;
    osc2VolumeLfoDepthValueDisplay.textContent = parseFloat(osc2VolumeLfoDepthSlider.value).toFixed(2);

    // Osc 3
    osc3DetuneValueDisplay.textContent = osc3DetuneSlider.value + " cents";
    osc3VolumeValueDisplay.textContent = parseFloat(osc3VolumeSlider.value).toFixed(2);
    updateLfoSpeedDisplay(osc3DetuneLfoSpeedSlider.value, osc3DetuneLfoSpeedValueDisplay);
    osc3DetuneLfoSpeedNumber.value = osc3DetuneLfoSpeedSlider.value;
    osc3DetuneLfoDepthValueDisplay.textContent = osc3DetuneLfoDepthSlider.value + " cents";
    updateLfoSpeedDisplay(osc3VolumeLfoSpeedSlider.value, osc3VolumeLfoSpeedValueDisplay);
    osc3VolumeLfoSpeedNumber.value = osc3VolumeLfoSpeedSlider.value;
    osc3VolumeLfoDepthValueDisplay.textContent = parseFloat(osc3VolumeLfoDepthSlider.value).toFixed(2);

    // Global Effects UI Inits
    filterFreqValueDisplay.textContent = (Math.pow(10, Math.log10(20) + (Math.log10(20000) - Math.log10(20)) * (parseFloat(filterFrequencySlider.value) / 100))).toFixed(1);
    filterQValueDisplay.textContent = parseFloat(filterQSlider.value).toFixed(2);
    filterGainValueDisplay.textContent = parseFloat(filterGainSlider.value).toFixed(1);
    reverbMixValueDisplay.textContent = parseFloat(reverbMixSlider.value).toFixed(2);
    reverbPreDelayValueDisplay.textContent = reverbPreDelaySlider.value;
    reverbDecayValueDisplay.textContent = parseFloat(reverbDecaySlider.value).toFixed(1);
    reverbFeedbackGainValueDisplay.textContent = parseFloat(reverbFeedbackGainSlider.value).toFixed(2);
    masterVolumeValueDisplay.textContent = parseFloat(masterVolumeSlider.value).toFixed(2);
    filterGainGroup.style.display = ['lowshelf','highshelf','peaking'].includes(filterTypeSelect.value) ? 'block' : 'none';
}
initializeUIDisplays();

// Helper for smooth parameter changes
function smoothSet(param, value) { 
    if (param) {
        param.setTargetAtTime(value, audioCtx.currentTime, 0.01); 
    }
}

// Generate impulse response for reverb
function createIR(duration, decay) {
    if (!audioCtx) return null; // Make sure audioCtx is available
    const sr = audioCtx.sampleRate;
    const len = sr * duration;
    const buf = audioCtx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
        const data = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
    }
    return buf;
}

// Function to update global effects parameters
function updateGlobalEffectParams() {
    if (!globalFilter || !audioCtx) return; // Ensure nodes and context exist

    globalFilter.type = filterTypeSelect.value;
    const frac = parseFloat(filterFrequencySlider.value) / 100;
    const logMin = Math.log10(20), logMax = Math.log10(20000);
    const freq = Math.pow(10, logMin + (logMax - logMin) * frac);
    smoothSet(globalFilter.frequency, freq);
    smoothSet(globalFilter.Q, parseFloat(filterQSlider.value));
    smoothSet(globalFilter.gain, parseFloat(filterGainSlider.value));
    filterFreqValueDisplay.textContent = freq.toFixed(1);
    filterQValueDisplay.textContent = parseFloat(filterQSlider.value).toFixed(2);
    filterGainValueDisplay.textContent = filterGainSlider.value;
    filterGainGroup.style.display = ['lowshelf','highshelf','peaking'].includes(globalFilter.type) ? 'block' : 'none';

    // Reverb
    smoothSet(reverbPreDelayNode.delayTime, parseFloat(reverbPreDelaySlider.value) / 1000);
    smoothSet(wetGain.gain, parseFloat(reverbMixSlider.value));
    smoothSet(dryGain.gain, 1 - parseFloat(reverbMixSlider.value));
    // Note: reverbDecaySlider now influences IR generation, not feedback gain directly in this update.
    // The IR is generated once. For dynamic decay, one might need to regenerate IR or use a different reverb design.
    // We added a separate reverbFeedbackGainSlider for the feedback loop of the plate design.
    smoothSet(reverbFeedback.gain, parseFloat(reverbFeedbackGainSlider.value)); 
    reverbMixValueDisplay.textContent = parseFloat(reverbMixSlider.value).toFixed(2);
    reverbPreDelayValueDisplay.textContent = reverbPreDelaySlider.value;
    reverbDecayValueDisplay.textContent = parseFloat(reverbDecaySlider.value).toFixed(1); // Shows the IR decay setting
    reverbFeedbackGainValueDisplay.textContent = parseFloat(reverbFeedbackGainSlider.value).toFixed(2);


    // Master Volume
    smoothSet(masterOutputVolume.gain, parseFloat(masterVolumeSlider.value));
    masterVolumeValueDisplay.textContent = parseFloat(masterVolumeSlider.value).toFixed(2);
}

// Event Listeners for Global Effects
[filterTypeSelect, filterFrequencySlider, filterQSlider, filterGainSlider, 
 reverbMixSlider, reverbPreDelaySlider, reverbFeedbackGainSlider, /* reverbDecaySlider (triggers IR regen, not direct param update) */
 masterVolumeSlider].forEach(el => {
    if (el) el.addEventListener('input', updateGlobalEffectParams);
});

// Special listener for reverbDecaySlider to regenerate IR
if (reverbDecaySlider) {
    reverbDecaySlider.addEventListener('input', () => {
        if (reverbConvolver && audioCtx) {
            const decayDuration = parseFloat(reverbDecaySlider.value) > 0.1 ? parseFloat(reverbDecaySlider.value) : 0.1;
            reverbConvolver.buffer = createIR(decayDuration, decayDuration); // Simple mapping of decay slider to IR params
            console.log(`Reverb IR regenerated with duration/decay: ${decayDuration}`);
        }
        // Also update the display for the slider itself
        reverbDecayValueDisplay.textContent = parseFloat(reverbDecaySlider.value).toFixed(1);
        // No need to call updateGlobalEffectParams here unless other params depend on it directly
    });
}

// Add MIDI Input Selector Listener
if (midiInputSelector) {
    midiInputSelector.addEventListener('change', (event) => {
        if (event.target.value) {
            selectMidiInput(event.target.value);
        } else if (activeMidiInput) { // "-- Select --" chosen
            activeMidiInput.onmidimessage = null;
            activeMidiInput = null;
            console.log("MIDI Input deselected.");
        }
    });
}

// Add MIDI Learn Button Listener for Master Volume
if (masterVolumeMidiLearnButton) {
    masterVolumeMidiLearnButton.addEventListener('click', () => {
        if (!activeMidiInput) {
            alert("Please select a MIDI input first.");
            return;
        }
        // Toggle learning state for master volume
        isLearningMasterVolume = !isLearningMasterVolume;
        if (isLearningMasterVolume) {
            // Reset other learn states
            isLearningFilterFrequency = false; filterFrequencyMidiLearnButton.textContent = "Learn"; filterFrequencyMidiLearnButton.classList.remove('learning');
            isLearningFilterQ = false; filterQMidiLearnButton.textContent = "Learn"; filterQMidiLearnButton.classList.remove('learning');
            isLearningFilterGain = false; filterGainMidiLearnButton.textContent = "Learn"; filterGainMidiLearnButton.classList.remove('learning');
            
            masterVolumeMidiLearnButton.textContent = "Learning...";
            masterVolumeMidiLearnButton.classList.add('learning');
            console.log("Waiting for MIDI CC for Master Volume...");
        } else {
            masterVolumeMidiLearnButton.textContent = "Learn";
            masterVolumeMidiLearnButton.classList.remove('learning');
        }
    });
}

// New: Add MIDI Learn Button Listeners for Filter Controls
if (filterFrequencyMidiLearnButton) {
    filterFrequencyMidiLearnButton.addEventListener('click', () => {
        if (!activeMidiInput) { alert("Please select a MIDI input first."); return; }
        isLearningFilterFrequency = !isLearningFilterFrequency;
        if (isLearningFilterFrequency) {
            isLearningMasterVolume = false; masterVolumeMidiLearnButton.textContent = "Learn"; masterVolumeMidiLearnButton.classList.remove('learning');
            isLearningFilterQ = false; filterQMidiLearnButton.textContent = "Learn"; filterQMidiLearnButton.classList.remove('learning');
            isLearningFilterGain = false; filterGainMidiLearnButton.textContent = "Learn"; filterGainMidiLearnButton.classList.remove('learning');

            filterFrequencyMidiLearnButton.textContent = "Learning...";
            filterFrequencyMidiLearnButton.classList.add('learning');
            console.log("Waiting for MIDI CC for Filter Frequency...");
        } else {
            filterFrequencyMidiLearnButton.textContent = "Learn";
            filterFrequencyMidiLearnButton.classList.remove('learning');
        }
    });
}

if (filterQMidiLearnButton) {
    filterQMidiLearnButton.addEventListener('click', () => {
        if (!activeMidiInput) { alert("Please select a MIDI input first."); return; }
        isLearningFilterQ = !isLearningFilterQ;
        if (isLearningFilterQ) {
            isLearningMasterVolume = false; masterVolumeMidiLearnButton.textContent = "Learn"; masterVolumeMidiLearnButton.classList.remove('learning');
            isLearningFilterFrequency = false; filterFrequencyMidiLearnButton.textContent = "Learn"; filterFrequencyMidiLearnButton.classList.remove('learning');
            isLearningFilterGain = false; filterGainMidiLearnButton.textContent = "Learn"; filterGainMidiLearnButton.classList.remove('learning');

            filterQMidiLearnButton.textContent = "Learning...";
            filterQMidiLearnButton.classList.add('learning');
            console.log("Waiting for MIDI CC for Filter Q...");
        } else {
            filterQMidiLearnButton.textContent = "Learn";
            filterQMidiLearnButton.classList.remove('learning');
        }
    });
}

if (filterGainMidiLearnButton) {
    filterGainMidiLearnButton.addEventListener('click', () => {
        if (!activeMidiInput) { alert("Please select a MIDI input first."); return; }
        isLearningFilterGain = !isLearningFilterGain;
        if (isLearningFilterGain) {
            isLearningMasterVolume = false; masterVolumeMidiLearnButton.textContent = "Learn"; masterVolumeMidiLearnButton.classList.remove('learning');
            isLearningFilterFrequency = false; filterFrequencyMidiLearnButton.textContent = "Learn"; filterFrequencyMidiLearnButton.classList.remove('learning');
            isLearningFilterQ = false; filterQMidiLearnButton.textContent = "Learn"; filterQMidiLearnButton.classList.remove('learning');

            filterGainMidiLearnButton.textContent = "Learning...";
            filterGainMidiLearnButton.classList.add('learning');
            console.log("Waiting for MIDI CC for Filter Gain...");
        } else {
            filterGainMidiLearnButton.textContent = "Learn";
            filterGainMidiLearnButton.classList.remove('learning');
        }
    });
}

// Function to load saved MIDI mappings
function loadMidiMappings() {
    const savedMasterVolumeMap = localStorage.getItem('masterVolumeMidiMap');
    if (savedMasterVolumeMap) {
        masterVolumeMidiMap = JSON.parse(savedMasterVolumeMap);
        console.log("Loaded Master Volume MIDI map:", masterVolumeMidiMap);
    }
    const savedFilterFreqMap = localStorage.getItem('filterFrequencyMidiMap');
    if (savedFilterFreqMap) {
        filterFrequencyMidiMap = JSON.parse(savedFilterFreqMap);
        console.log("Loaded Filter Frequency MIDI map:", filterFrequencyMidiMap);
    }
    const savedFilterQMap = localStorage.getItem('filterQMidiMap');
    if (savedFilterQMap) {
        filterQMidiMap = JSON.parse(savedFilterQMap);
        console.log("Loaded Filter Q MIDI map:", filterQMidiMap);
    }
    const savedFilterGainMap = localStorage.getItem('filterGainMidiMap');
    if (savedFilterGainMap) {
        filterGainMidiMap = JSON.parse(savedFilterGainMap);
        console.log("Loaded Filter Gain MIDI map:", filterGainMidiMap);
    }
}

// Add the new preset functions here
function gatherPresetData() {
    const preset = {
        masterFrequency: parseFloat(masterFrequencySlider.value),
        masterVolume: parseFloat(masterVolumeSlider.value),

        osc1: {
            waveform: osc1WaveformSelect.value,
            detune: parseInt(osc1DetuneSlider.value),
            volume: parseFloat(osc1VolumeSlider.value),
            detuneLfo: {
                waveform: osc1DetuneLfoWaveformSelect.value,
                speed: parseFloat(osc1DetuneLfoSpeedSlider.value),
                depth: parseInt(osc1DetuneLfoDepthSlider.value),
                customCurve: osc1DetuneLfoCanvas.customCurveData ? Array.from(osc1DetuneLfoCanvas.customCurveData) : null
            },
            volumeLfo: {
                waveform: osc1VolumeLfoWaveformSelect.value,
                speed: parseFloat(osc1VolumeLfoSpeedSlider.value),
                depth: parseFloat(osc1VolumeLfoDepthSlider.value),
                customCurve: osc1VolumeLfoCanvas.customCurveData ? Array.from(osc1VolumeLfoCanvas.customCurveData) : null
            }
        },
        osc2: {
            waveform: osc2WaveformSelect.value,
            detune: parseInt(osc2DetuneSlider.value),
            volume: parseFloat(osc2VolumeSlider.value),
            detuneLfo: {
                waveform: osc2DetuneLfoWaveformSelect.value,
                speed: parseFloat(osc2DetuneLfoSpeedSlider.value),
                depth: parseInt(osc2DetuneLfoDepthSlider.value),
                customCurve: osc2DetuneLfoCanvas.customCurveData ? Array.from(osc2DetuneLfoCanvas.customCurveData) : null
            },
            volumeLfo: {
                waveform: osc2VolumeLfoWaveformSelect.value,
                speed: parseFloat(osc2VolumeLfoSpeedSlider.value),
                depth: parseFloat(osc2VolumeLfoDepthSlider.value),
                customCurve: osc2VolumeLfoCanvas.customCurveData ? Array.from(osc2VolumeLfoCanvas.customCurveData) : null
            }
        },
        osc3: {
            waveform: osc3WaveformSelect.value,
            detune: parseInt(osc3DetuneSlider.value),
            volume: parseFloat(osc3VolumeSlider.value),
            detuneLfo: {
                waveform: osc3DetuneLfoWaveformSelect.value,
                speed: parseFloat(osc3DetuneLfoSpeedSlider.value),
                depth: parseInt(osc3DetuneLfoDepthSlider.value),
                customCurve: osc3DetuneLfoCanvas.customCurveData ? Array.from(osc3DetuneLfoCanvas.customCurveData) : null
            },
            volumeLfo: {
                waveform: osc3VolumeLfoWaveformSelect.value,
                speed: parseFloat(osc3VolumeLfoSpeedSlider.value),
                depth: parseFloat(osc3VolumeLfoDepthSlider.value),
                customCurve: osc3VolumeLfoCanvas.customCurveData ? Array.from(osc3VolumeLfoCanvas.customCurveData) : null
            }
        },
        filter: {
            type: filterTypeSelect.value,
            frequency: parseFloat(filterFrequencySlider.value),
            q: parseFloat(filterQSlider.value),
            gain: filterGainGroup.style.display !== 'none' ? parseFloat(filterGainSlider.value) : 0
        },
        reverb: {
            mix: parseFloat(reverbMixSlider.value),
            preDelay: parseFloat(reverbPreDelaySlider.value),
            decay: parseFloat(reverbDecaySlider.value),
            feedbackGain: parseFloat(reverbFeedbackGainSlider.value)
        },
        midi: {
            masterVolumeMap: masterVolumeMidiMap ? { ...masterVolumeMidiMap } : null,
            filterFrequencyMidiMap: filterFrequencyMidiMap ? { ...filterFrequencyMidiMap } : null, // New
            filterQMidiMap: filterQMidiMap ? { ...filterQMidiMap } : null, // New
            filterGainMidiMap: filterGainMidiMap ? { ...filterGainMidiMap } : null // New
        }
    };
    return preset;
}

function exportPreset() {
    const presetData = gatherPresetData();
    const jsonData = JSON.stringify(presetData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = prompt("Enter preset name:", "synth_preset");
    if (fileName === null) {
        URL.revokeObjectURL(url);
        return;
    }
    a.download = (fileName.endsWith('.json') ? fileName : fileName + '.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Preset exported as " + a.download);
}

function importPreset() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = readerEvent => {
            try {
                const presetData = JSON.parse(readerEvent.target.result);
                applyPresetData(presetData); // applyPresetData will be added next
                console.log("Preset imported and applied: " + file.name);
            } catch (err) {
                console.error("Error importing preset:", err);
                alert("Failed to import preset. Make sure it's a valid JSON file.\nError: " + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Insert applyLfoCustomCurve and applyPresetData functions here
function applyLfoCustomCurve(lfoCanvas, customCurveArray, lfoNodeGroup, lfoType /* 'detune' or 'volume' */, oscIndex) {
    if (!audioCtx || !customCurveArray || !lfoNodeGroup) {
        console.warn("applyLfoCustomCurve: Missing audio context, curve data, or LFO node group.");
        return;
    }

    const curve = new Float32Array(customCurveArray);
    // Ensure canvas.customCurveData is updated, as this is used for re-exporting and by drawing logic.
    lfoCanvas.customCurveData = curve; 

    // If a redraw function exists on the canvas (presumably from setupLfoCanvasDrawing), call it.
    if (typeof lfoCanvas.redrawCanvas === 'function') {
        lfoCanvas.redrawCanvas(curve);
    } else {
        console.warn(`LFO canvas for osc ${oscIndex+1} (${lfoType}) does not have a redrawCanvas method.`);
    }
    
    // lfoNodeGroup is expected to be an object like { lfoSource, shaperNode, detuneLfoDepth/volumeLfoDepthGain }
    // These nodes are part of the activeAudioNodes[oscIndex].detuneLfo or .volumeLfo objects.
    let shaper = lfoNodeGroup.shaperNode; 
    let lfoSource = lfoNodeGroup.lfoSource;
    let lfoDepthNode = lfoType === 'detune' ? lfoNodeGroup.detuneLfoDepth : lfoNodeGroup.volumeLfoDepthGain;

    if (!lfoSource) {
        console.warn(`LFO source node not found for osc ${oscIndex+1} (${lfoType}) LFO. Cannot apply custom curve to audio graph.`);
        return; // If no LFO source, cannot proceed with audio graph changes.
    }
    if (!lfoDepthNode) {
        console.warn(`LFO depth/gain node not found for osc ${oscIndex+1} (${lfoType}) LFO. Cannot connect shaper for custom curve.`);
        return; 
    }

    if (!shaper) {
        shaper = audioCtx.createWaveShaper();
        lfoNodeGroup.shaperNode = shaper; // Store the newly created shaper back into the LFO node group.
    }
    shaper.curve = curve;
    shaper.oversample = '4x';

    // Re-wire: LFO Source -> Shaper -> LFO Depth Node
    try { lfoSource.disconnect(); } catch(e){ /* ignore if not connected */ }
    try { shaper.disconnect(); } catch(e){ /* ignore if not connected */ }
    
    lfoSource.connect(shaper);
    shaper.connect(lfoDepthNode);
    console.log(`Applied custom LFO curve for osc ${oscIndex+1} ${lfoType} LFO.`);
}

function applyPresetData(preset) {
    if (!preset) {
        console.error("applyPresetData: No preset data provided.");
        return;
    }
    console.log("Applying preset:", preset);

    // Master controls - UI update
    masterFrequencySlider.value = preset.masterFrequency;
    masterFrequencyNumber.value = preset.masterFrequency;
    masterVolumeSlider.value = preset.masterVolume;

    const oscillators = [
        { controls: { waveformSelect: osc1WaveformSelect, detuneSlider: osc1DetuneSlider, volumeSlider: osc1VolumeSlider, detuneLfoWaveformSelect: osc1DetuneLfoWaveformSelect, detuneLfoSpeedSlider: osc1DetuneLfoSpeedSlider, detuneLfoSpeedNumber: osc1DetuneLfoSpeedNumber, detuneLfoDepthSlider: osc1DetuneLfoDepthSlider, detuneLfoCustomWaveContainer: osc1DetuneLfoCustomWaveContainer, detuneLfoCanvas: osc1DetuneLfoCanvas, volumeLfoWaveformSelect: osc1VolumeLfoWaveformSelect, volumeLfoSpeedSlider: osc1VolumeLfoSpeedSlider, volumeLfoSpeedNumber: osc1VolumeLfoSpeedNumber, volumeLfoDepthSlider: osc1VolumeLfoDepthSlider, volumeLfoCustomWaveContainer: osc1VolumeLfoCustomWaveContainer, volumeLfoCanvas: osc1VolumeLfoCanvas }, data: preset.osc1, audioNodesRef: activeAudioNodes[0] }, // activeAudioNodes[0] should contain { osc, gainNode, detuneLfo: {lfoSource, detuneLfoDepth, shaperNode}, volumeLfo: {lfoSource, volumeLfoDepthGain, shaperNode} }
        { controls: { waveformSelect: osc2WaveformSelect, detuneSlider: osc2DetuneSlider, volumeSlider: osc2VolumeSlider, detuneLfoWaveformSelect: osc2DetuneLfoWaveformSelect, detuneLfoSpeedSlider: osc2DetuneLfoSpeedSlider, detuneLfoSpeedNumber: osc2DetuneLfoSpeedNumber, detuneLfoDepthSlider: osc2DetuneLfoDepthSlider, detuneLfoCustomWaveContainer: osc2DetuneLfoCustomWaveContainer, detuneLfoCanvas: osc2DetuneLfoCanvas, volumeLfoWaveformSelect: osc2VolumeLfoWaveformSelect, volumeLfoSpeedSlider: osc2VolumeLfoSpeedSlider, volumeLfoSpeedNumber: osc2VolumeLfoSpeedNumber, volumeLfoDepthSlider: osc2VolumeLfoDepthSlider, volumeLfoCustomWaveContainer: osc2VolumeLfoCustomWaveContainer, volumeLfoCanvas: osc2VolumeLfoCanvas }, data: preset.osc2, audioNodesRef: activeAudioNodes[1] },
        { controls: { waveformSelect: osc3WaveformSelect, detuneSlider: osc3DetuneSlider, volumeSlider: osc3VolumeSlider, detuneLfoWaveformSelect: osc3DetuneLfoWaveformSelect, detuneLfoSpeedSlider: osc3DetuneLfoSpeedSlider, detuneLfoSpeedNumber: osc3DetuneLfoSpeedNumber, detuneLfoDepthSlider: osc3DetuneLfoDepthSlider, detuneLfoCustomWaveContainer: osc3DetuneLfoCustomWaveContainer, detuneLfoCanvas: osc3DetuneLfoCanvas, volumeLfoWaveformSelect: osc3VolumeLfoWaveformSelect, volumeLfoSpeedSlider: osc3VolumeLfoSpeedSlider, volumeLfoSpeedNumber: osc3VolumeLfoSpeedNumber, volumeLfoDepthSlider: osc3VolumeLfoDepthSlider, volumeLfoCustomWaveContainer: osc3VolumeLfoCustomWaveContainer, volumeLfoCanvas: osc3VolumeLfoCanvas }, data: preset.osc3, audioNodesRef: activeAudioNodes[2] }
    ];

    oscillators.forEach((osc, index) => {
        if (!osc.data) return;
        const ctrls = osc.controls;
        const data = osc.data;
        const currentAudioNodes = osc.audioNodesRef; // This is activeAudioNodes[index]

        // Update UI elements first
        ctrls.waveformSelect.value = data.waveform;
        ctrls.detuneSlider.value = data.detune;
        ctrls.volumeSlider.value = data.volume;

        // Detune LFO UI and Audio
        if (data.detuneLfo) {
            ctrls.detuneLfoWaveformSelect.value = data.detuneLfo.waveform;
            ctrls.detuneLfoSpeedSlider.value = data.detuneLfo.speed;
            ctrls.detuneLfoSpeedNumber.value = data.detuneLfo.speed;
            ctrls.detuneLfoDepthSlider.value = data.detuneLfo.depth;

            if (data.detuneLfo.waveform === 'custom' && data.detuneLfo.customCurve) {
                ctrls.detuneLfoCustomWaveContainer.style.display = 'block';
                if (audioCtx && currentAudioNodes && currentAudioNodes.detuneLfo) { // .detuneLfo is the group of nodes
                    applyLfoCustomCurve(ctrls.detuneLfoCanvas, data.detuneLfo.customCurve, currentAudioNodes.detuneLfo, 'detune', index);
                } else {
                    // If audio not active or nodes not ready, just store data on canvas for drawing
                    ctrls.detuneLfoCanvas.customCurveData = new Float32Array(data.detuneLfo.customCurve);
                    if (typeof ctrls.detuneLfoCanvas.redrawCanvas === 'function') ctrls.detuneLfoCanvas.redrawCanvas();
                }
            } else {
                ctrls.detuneLfoCustomWaveContainer.style.display = 'none';
                // If switching AWAY from custom, and audio nodes exist, reconfigure LFO path
                if (audioCtx && currentAudioNodes && currentAudioNodes.detuneLfo && currentAudioNodes.detuneLfo.lfoSource && currentAudioNodes.detuneLfo.detuneLfoDepth) {
                    const lfoSrc = currentAudioNodes.detuneLfo.lfoSource;
                    const shaper = currentAudioNodes.detuneLfo.shaperNode;
                    const depthNode = currentAudioNodes.detuneLfo.detuneLfoDepth;
                    try { lfoSrc.disconnect(); } catch(e){} // Disconnect source from whatever it was connected to
                    if (shaper) { try { shaper.disconnect(); } catch(e){} } // Disconnect shaper if it exists
                    lfoSrc.connect(depthNode); // Connect LFO source directly to depth node
                    lfoSrc.type = data.detuneLfo.waveform; // Set to new standard waveform type
                }
            }
        }

        // Volume LFO UI and Audio
        if (data.volumeLfo) {
            ctrls.volumeLfoWaveformSelect.value = data.volumeLfo.waveform;
            ctrls.volumeLfoSpeedSlider.value = data.volumeLfo.speed;
            ctrls.volumeLfoSpeedNumber.value = data.volumeLfo.speed;
            ctrls.volumeLfoDepthSlider.value = data.volumeLfo.depth;

            if (data.volumeLfo.waveform === 'custom' && data.volumeLfo.customCurve) {
                ctrls.volumeLfoCustomWaveContainer.style.display = 'block';
                if (audioCtx && currentAudioNodes && currentAudioNodes.volumeLfo) { // .volumeLfo is the group of nodes
                    applyLfoCustomCurve(ctrls.volumeLfoCanvas, data.volumeLfo.customCurve, currentAudioNodes.volumeLfo, 'volume', index);
                } else {
                    ctrls.volumeLfoCanvas.customCurveData = new Float32Array(data.volumeLfo.customCurve);
                    if (typeof ctrls.volumeLfoCanvas.redrawCanvas === 'function') ctrls.volumeLfoCanvas.redrawCanvas();
                }
            } else {
                ctrls.volumeLfoCustomWaveContainer.style.display = 'none';
                if (audioCtx && currentAudioNodes && currentAudioNodes.volumeLfo && currentAudioNodes.volumeLfo.lfoSource && currentAudioNodes.volumeLfo.volumeLfoDepthGain) {
                    const lfoSrc = currentAudioNodes.volumeLfo.lfoSource;
                    const shaper = currentAudioNodes.volumeLfo.shaperNode;
                    const depthNode = currentAudioNodes.volumeLfo.volumeLfoDepthGain;
                    try { lfoSrc.disconnect(); } catch(e){} 
                    if (shaper) { try { shaper.disconnect(); } catch(e){} }
                    lfoSrc.connect(depthNode); 
                    lfoSrc.type = data.volumeLfo.waveform;
                }
            }
        }
    });

    if (preset.filter) {
        filterTypeSelect.value = preset.filter.type;
        filterFrequencySlider.value = preset.filter.frequency;
        filterQSlider.value = preset.filter.q;
        if (preset.filter.type === 'lowshelf' || preset.filter.type === 'highshelf' || preset.filter.type === 'peaking') {
            filterGainGroup.style.display = 'block';
            filterGainSlider.value = preset.filter.gain;
        } else {
            filterGainGroup.style.display = 'none';
        }
    }
    if (preset.reverb) {
        reverbMixSlider.value = preset.reverb.mix;
        reverbPreDelaySlider.value = preset.reverb.preDelay;
        reverbDecaySlider.value = preset.reverb.decay;
        reverbFeedbackGainSlider.value = preset.reverb.feedbackGain;
    }
    
    if (audioCtx) {
        updateGlobalEffectParams(); 
        const newMasterFreq = parseFloat(masterFrequencySlider.value);
        if (masterOutputVolume) masterOutputVolume.gain.setTargetAtTime(parseFloat(masterVolumeSlider.value), audioCtx.currentTime, 0.01);

        activeAudioNodes.forEach((nodes, index) => {
            if (!nodes || !nodes.osc) return;
            const currentOscData = oscillators[index] ? oscillators[index].data : null;
            if (!currentOscData) return;

            const detuneCents = parseInt(oscillators[index].controls.detuneSlider.value);
            const actualFreq = newMasterFreq * Math.pow(2, detuneCents / 1200);
            nodes.osc.frequency.setTargetAtTime(actualFreq, audioCtx.currentTime, 0.01);
            nodes.osc.type = currentOscData.waveform;
            if (nodes.gainNode) {
                nodes.gainNode.gain.setTargetAtTime(parseFloat(oscillators[index].controls.volumeSlider.value), audioCtx.currentTime, 0.01);
            }

            if (currentOscData.detuneLfo && nodes.detuneLfo && nodes.detuneLfo.lfoSource) {
                if (currentOscData.detuneLfo.waveform !== 'custom') {
                    nodes.detuneLfo.lfoSource.type = currentOscData.detuneLfo.waveform;
                }
                nodes.detuneLfo.lfoSource.frequency.setTargetAtTime(currentOscData.detuneLfo.speed, audioCtx.currentTime, 0.01);
                if(nodes.detuneLfo.detuneLfoDepth) nodes.detuneLfo.detuneLfoDepth.gain.setTargetAtTime(currentOscData.detuneLfo.depth, audioCtx.currentTime, 0.01);
            }
            if (currentOscData.volumeLfo && nodes.volumeLfo && nodes.volumeLfo.lfoSource) {
                if (currentOscData.volumeLfo.waveform !== 'custom') {
                    nodes.volumeLfo.lfoSource.type = currentOscData.volumeLfo.waveform;
                }
                nodes.volumeLfo.lfoSource.frequency.setTargetAtTime(currentOscData.volumeLfo.speed, audioCtx.currentTime, 0.01);
                if(nodes.volumeLfo.volumeLfoDepthGain) nodes.volumeLfo.volumeLfoDepthGain.gain.setTargetAtTime(currentOscData.volumeLfo.depth, audioCtx.currentTime, 0.01);
            }
        });
    }

    if (preset.midi) { // Check if midi object exists in preset
        if (preset.midi.masterVolumeMap) {
            masterVolumeMidiMap = { ...preset.midi.masterVolumeMap };
            localStorage.setItem('masterVolumeMidiMap', JSON.stringify(masterVolumeMidiMap));
        } else {
            masterVolumeMidiMap = null;
            localStorage.removeItem('masterVolumeMidiMap');
        }
        // Filter Frequency
        if (preset.midi.filterFrequencyMidiMap) {
            filterFrequencyMidiMap = { ...preset.midi.filterFrequencyMidiMap };
            localStorage.setItem('filterFrequencyMidiMap', JSON.stringify(filterFrequencyMidiMap));
        } else {
            filterFrequencyMidiMap = null;
            localStorage.removeItem('filterFrequencyMidiMap');
        }
        // Filter Q
        if (preset.midi.filterQMidiMap) {
            filterQMidiMap = { ...preset.midi.filterQMidiMap };
            localStorage.setItem('filterQMidiMap', JSON.stringify(filterQMidiMap));
        } else {
            filterQMidiMap = null;
            localStorage.removeItem('filterQMidiMap');
        }
        // Filter Gain
        if (preset.midi.filterGainMidiMap) {
            filterGainMidiMap = { ...preset.midi.filterGainMidiMap };
            localStorage.setItem('filterGainMidiMap', JSON.stringify(filterGainMidiMap));
        } else {
            filterGainMidiMap = null;
            localStorage.removeItem('filterGainMidiMap');
        }
    } else { // If no midi object in preset, clear all MIDI maps
        masterVolumeMidiMap = null; localStorage.removeItem('masterVolumeMidiMap');
        filterFrequencyMidiMap = null; localStorage.removeItem('filterFrequencyMidiMap');
        filterQMidiMap = null; localStorage.removeItem('filterQMidiMap');
        filterGainMidiMap = null; localStorage.removeItem('filterGainMidiMap');
    }
    
    initializeUIDisplays();
    if (typeof loadMidiMappings === "function") {
        loadMidiMappings(); 
    }
} // End of applyPresetData function

initializeSynth();
