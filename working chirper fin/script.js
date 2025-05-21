// Water Data Visualizer Code
class WaterVisualizer {
    constructor(id) {
        this.id = id;
        this.chart = null;
        this.lfo = null;
        this.currentData = [];
        this.isPlaying = false;
        this.currentValue = 0;
        this.currentDataIndex = 0;
        this.dataInterval = null;
        this.minScale = 0;
        this.maxScale = 1;
        
        // Initialize elements
        this.csvSelect = document.getElementById(`csvSelect${id}`);
        this.playbackToggle = document.getElementById(`playbackToggle${id}`);
        this.speedControl = document.getElementById(`speedControl${id}`);
        this.speedValue = document.getElementById(`speedValue${id}`);
        this.minValue = document.getElementById(`minValue${id}`);
        this.maxValue = document.getElementById(`maxValue${id}`);
        this.minValueDisplay = document.getElementById(`minValueDisplay${id}`);
        this.maxValueDisplay = document.getElementById(`maxValueDisplay${id}`);
        this.resetButton = document.getElementById(`resetButton${id}`);
        this.numberDisplay = document.getElementById(`numberDisplay${id}`);
        this.rawValueDisplay = document.getElementById(`rawValueDisplay${id}`);
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.csvSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadCSV(e.target.value);
            }
        });
        
        this.playbackToggle.addEventListener('change', () => {
            this.togglePlayback();
        });
        
        this.speedControl.addEventListener('input', (e) => {
            this.speedValue.textContent = e.target.value + 'x';
            if (this.isPlaying) {
                this.stopPlayback();
                this.startPlayback();
            }
        });
        
        this.resetButton.addEventListener('click', () => this.resetPlayback());
    }
    
    // Function to scale a value between min and max
    scaleValue(value) {
        const min = parseFloat(this.minValue.value);
        const max = parseFloat(this.maxValue.value);
        return min + (value - Math.min(...this.currentData.map(d => d.value))) * 
               (max - min) / (Math.max(...this.currentData.map(d => d.value)) - Math.min(...this.currentData.map(d => d.value)));
    }
    
    // Load and parse CSV
    async loadCSV(filePath) {
        try {
            const response = await fetch(filePath);
            const text = await response.text();
            const lines = text.split('\n');
            const headers = lines[0].split(',');
            
            this.currentData = lines.slice(1)
                .filter(line => line.trim())
                .map(line => {
                    const values = line.split(',');
                    return {
                        date: new Date(values[0]),
                        value: parseFloat(values[1])
                    };
                });
            
            // Calculate min and max values
            const minValue = Math.min(...this.currentData.map(d => d.value));
            const maxValue = Math.max(...this.currentData.map(d => d.value));
            
            // Update min/max displays
            this.minValue.value = minValue;
            this.maxValue.value = maxValue;
            this.minValueDisplay.textContent = minValue.toFixed(2);
            this.maxValueDisplay.textContent = maxValue.toFixed(2);
            
            // Update min/max scale
            this.minScale = minValue;
            this.maxScale = maxValue;
            
            this.updateChart();
        } catch (error) {
            console.error('Error loading CSV:', error);
        }
    }
    
    // Update chart with current data
    updateChart() {
        const ctx = document.getElementById(`dataChart${this.id}`).getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.currentData.map(d => d.date.toLocaleDateString()),
                datasets: [{
                    label: 'Water Level',
                    data: this.currentData.map(d => d.value),
                    borderColor: '#61dafb',
                    backgroundColor: 'rgba(97, 218, 251, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: undefined,
                        max: undefined
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });
    }
    
    // Playback controls
    togglePlayback() {
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
            this.startPlayback();
        } else {
            this.stopPlayback();
        }
    }
    
    startPlayback() {
        const speed = parseFloat(this.speedControl.value);
        const interval = 1000 / speed;
        
        this.dataInterval = setInterval(() => {
            if (this.currentDataIndex >= this.currentData.length) {
                this.currentDataIndex = 0;
            }
            
            const dataPoint = this.currentData[this.currentDataIndex];
            const rawValue = dataPoint.value;
            this.currentValue = this.scaleValue(rawValue);
            
            this.numberDisplay.textContent = this.currentValue.toFixed(2);
            this.rawValueDisplay.textContent = rawValue.toFixed(2);
            
            // If this is visualizer 1, update the test slider
            if (this.id === 1) {
                const testSlider = document.getElementById('testSlider');
                const testSliderDisplay = document.getElementById('testSliderDisplay');
                testSlider.value = this.currentValue;
                testSliderDisplay.textContent = this.currentValue.toFixed(2);
            }
            
            // If this is visualizer 2, update the test2 slider
            if (this.id === 2) {
                const test2Slider = document.getElementById('test2Slider');
                const test2SliderDisplay = document.getElementById('test2SliderDisplay');
                test2Slider.value = this.currentValue;
                test2SliderDisplay.textContent = this.currentValue.toFixed(2);
            }
            
            if (this.lfo) {
                this.lfo.min = this.currentValue;
                this.lfo.max = this.currentValue;
            }
            
            // Update chart with current position
            if (this.chart) {
                const datasets = [{
                    label: 'Water Level',
                    data: this.currentData.map(d => d.value),
                    borderColor: '#61dafb',
                    backgroundColor: 'rgba(97, 218, 251, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Current Position',
                    data: this.currentData.map((d, i) => {
                        if (i === this.currentDataIndex) {
                            return Math.min(...this.currentData.map(d => d.value));
                        }
                        if (i === this.currentDataIndex + 1) {
                            return Math.max(...this.currentData.map(d => d.value));
                        }
                        return null;
                    }),
                    borderColor: '#ff0000',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    showLine: true,
                    borderWidth: 2,
                    fill: false,
                    tension: 0,
                    spanGaps: true
                }];
                
                this.chart.data.datasets = datasets;
                this.chart.update('none');
            }
            
            this.currentDataIndex++;
        }, interval);
    }
    
    stopPlayback() {
        if (this.dataInterval) {
            clearInterval(this.dataInterval);
            this.dataInterval = null;
            
            // Clear the position line when stopping
            if (this.chart) {
                this.chart.data.datasets = [{
                    label: 'Water Level',
                    data: this.currentData.map(d => d.value),
                    borderColor: '#61dafb',
                    backgroundColor: 'rgba(97, 218, 251, 0.1)',
                    fill: true,
                    tension: 0.4
                }];
                this.chart.update('none');
            }
        }
    }
    
    resetPlayback() {
        this.stopPlayback();
        this.currentDataIndex = 0;
        this.currentValue = 0;
        this.numberDisplay.textContent = '0.00';
        this.rawValueDisplay.textContent = '0.00';
        if (this.lfo) {
            this.lfo.min = 0;
            this.lfo.max = 0;
        }
    }
}

// Initialize visualizers
let visualizer1 = null;
let visualizer2 = null;

document.addEventListener('DOMContentLoaded', () => {
    visualizer1 = new WaterVisualizer(1);
    visualizer2 = new WaterVisualizer(2);
});

// Brain Forest 2 Code
document.addEventListener('DOMContentLoaded', () => {
    let audioCtx = null;
    let carrierOsc = null;
    let masterGain = null;
    let panner = null;
    let filter = null;
    let reverb = null;
    let dryGain = null;
    let wetGain = null;
    let reverbPreDelay = null;
    let reverbFeedback = null;
    let modules = [];

    // Effect elements object
    const effectElems = {
        effectFilterType: null,
        effectFilterFrequency: null,
        effectFilterQ: null,
        effectFilterGain: null,
        effectReverbMix: null,
        effectReverbPreDelay: null,
        effectReverbDecay: null,
        effectsOutputVolume: null,
        effectFreqValue: null,
        effectQValue: null,
        effectGainValue: null,
        effectRevValue: null,
        effectPDValue: null,
        effectDecayValue: null,
        effectsVolValue: null
    };

    // Initialize effect elements
    ['effectFilterType', 'effectFilterFrequency', 'effectFilterQ', 'effectFilterGain', 
     'effectReverbMix', 'effectReverbPreDelay', 'effectReverbDecay', 'effectsOutputVolume']
        .forEach(id => {
            effectElems[id] = document.getElementById(id);
        });
    
    ['effectFreqValue', 'effectQValue', 'effectGainValue', 'effectRevValue', 
     'effectPDValue', 'effectDecayValue', 'effectsVolValue']
        .forEach(id => {
            effectElems[id] = document.getElementById(id);
        });

    // Default presets
    const defaultPresets = {
        'Basic Sine': {
            modules: [
                {
                    waveType: 'sine',
                    speed: -2,
                    depth: 0.5,
                    low: -1,
                    high: 1,
                    phase: 0,
                    logScale: 1,
                    enabled: true
                },
                {
                    waveType: 'sine',
                    speed: -1,
                    depth: 0.3,
                    low: -1,
                    high: 1,
                    phase: 90,
                    logScale: 1,
                    enabled: true
                }
            ],
            global: {
                carrierType: 'sine',
                frequency: 440,
                volume: 0.5,
                filter: {
                    type: 'lowpass',
                    frequency: 1000,
                    Q: 1,
                    gain: 0
                },
                reverb: {
                    mix: 0.3,
                    preDelay: 20,
                    decay: 0.5
                }
            }
        },
        'Modulated Square': {
            modules: [
                {
                    waveType: 'square',
                    speed: -1.5,
                    depth: 0.7,
                    low: -1,
                    high: 1,
                    phase: 0,
                    logScale: 1,
                    enabled: true
                },
                {
                    waveType: 'sine',
                    speed: -2.5,
                    depth: 0.4,
                    low: -1,
                    high: 1,
                    phase: 45,
                    logScale: 1,
                    enabled: true
                }
            ],
            global: {
                carrierType: 'square',
                frequency: 220,
                volume: 0.4,
                filter: {
                    type: 'lowpass',
                    frequency: 800,
                    Q: 2,
                    gain: 0
                },
                reverb: {
                    mix: 0.2,
                    preDelay: 30,
                    decay: 0.4
                }
            }
        },
        'Complex Modulation': {
            modules: [
                {
                    waveType: 'triangle',
                    speed: -2,
                    depth: 0.8,
                    low: -1,
                    high: 1,
                    phase: 0,
                    logScale: 1.5,
                    enabled: true
                },
                {
                    waveType: 'sawtooth',
                    speed: -3,
                    depth: 0.6,
                    low: -1,
                    high: 1,
                    phase: 180,
                    logScale: 1.2,
                    enabled: true
                }
            ],
            global: {
                carrierType: 'sine',
                frequency: 330,
                volume: 0.6,
                filter: {
                    type: 'bandpass',
                    frequency: 1200,
                    Q: 3,
                    gain: 6
                },
                reverb: {
                    mix: 0.4,
                    preDelay: 50,
                    decay: 0.6
                }
            }
        }
    };

    // Initialize audio context on first user interaction
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            carrierOsc = audioCtx.createOscillator();
            masterGain = audioCtx.createGain();
            panner = audioCtx.createStereoPanner();
            filter = audioCtx.createBiquadFilter();
            reverb = audioCtx.createConvolver();
            dryGain = audioCtx.createGain();
            wetGain = audioCtx.createGain();
            reverbPreDelay = audioCtx.createDelay(1.0); // Max 1 second pre-delay
            reverbFeedback = audioCtx.createGain();

            // Connect audio nodes
            carrierOsc.connect(masterGain);
            masterGain.connect(filter);
            
            // Connect filter to both dry and wet paths
            filter.connect(dryGain);
            filter.connect(reverbPreDelay);
            
            // Connect reverb chain
            reverbPreDelay.connect(reverb);
            reverb.connect(reverbFeedback);
            reverbFeedback.connect(reverbPreDelay); // Feedback loop
            reverb.connect(wetGain);
            
            // Connect dry and wet paths to panner
            dryGain.connect(panner);
            wetGain.connect(panner);
            
            // Connect panner to destination
            panner.connect(audioCtx.destination);

            // Generate initial impulse response for reverb
            const initialReverbDecay = parseFloat(document.getElementById('effectReverbDecay').value);
            reverb.buffer = createIR(initialReverbDecay, initialReverbDecay);

            // Start oscillators
            carrierOsc.start();
            
            // Initialize pan to center
            panner.pan.setValueAtTime(0, audioCtx.currentTime);
            
            console.log('Audio context initialized with effects chain');
        }
    }

    // Generate impulse response for reverb
    function createIR(duration, decay) {
        if (!audioCtx) return null;
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
        if (!filter || !audioCtx) return;

        // Update filter parameters
        filter.type = document.getElementById('effectFilterType').value;
        const frac = parseFloat(document.getElementById('effectFilterFrequency').value) / 100;
        const logMin = Math.log10(20), logMax = Math.log10(20000);
        const freq = Math.pow(10, logMin + (logMax - logMin) * frac);
        filter.frequency.setValueAtTime(freq, audioCtx.currentTime);
        filter.Q.setValueAtTime(parseFloat(document.getElementById('effectFilterQ').value), audioCtx.currentTime);
        filter.gain.setValueAtTime(parseFloat(document.getElementById('effectFilterGain').value), audioCtx.currentTime);

        // Update reverb parameters
        const mix = parseFloat(document.getElementById('effectReverbMix').value);
        dryGain.gain.setValueAtTime(1 - mix, audioCtx.currentTime);
        wetGain.gain.setValueAtTime(mix, audioCtx.currentTime);
        reverbPreDelay.delayTime.setValueAtTime(parseFloat(document.getElementById('effectReverbPreDelay').value) / 1000, audioCtx.currentTime);
        reverbFeedback.gain.setValueAtTime(parseFloat(document.getElementById('effectReverbDecay').value), audioCtx.currentTime);

        // Update displays
        document.getElementById('effectFreqValue').textContent = freq.toFixed(1);
        document.getElementById('effectQValue').textContent = filter.Q.value.toFixed(2);
        document.getElementById('effectGainValue').textContent = filter.gain.value;
        document.getElementById('effectRevValue').textContent = mix.toFixed(2);
        document.getElementById('effectPDValue').textContent = document.getElementById('effectReverbPreDelay').value;
        document.getElementById('effectDecayValue').textContent = document.getElementById('effectReverbDecay').value;
    }

    // Add event listeners for effects controls
    ['effectFilterType', 'effectFilterFrequency', 'effectFilterQ', 'effectFilterGain', 
     'effectReverbMix', 'effectReverbPreDelay', 'effectReverbDecay'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateGlobalEffectParams);
        }
    });

    // Special listener for reverb decay to regenerate IR
    const reverbDecaySlider = document.getElementById('effectReverbDecay');
    if (reverbDecaySlider) {
        reverbDecaySlider.addEventListener('input', () => {
            if (reverb && audioCtx) {
                const decayDuration = parseFloat(reverbDecaySlider.value) > 0.1 ? parseFloat(reverbDecaySlider.value) : 0.1;
                reverb.buffer = createIR(decayDuration, decayDuration);
            }
        });
    }

    // Add click handler to document to initialize audio
    document.addEventListener('click', initAudio, { once: true });

    // Global controls
    const carrierType = document.getElementById('carrierType');
    const carrierFreq = document.getElementById('carrierFreq');
    const carrierFreqDisplay = document.getElementById('carrierFreqDisplay');
    const masterVol = document.getElementById('masterVol');
    const masterVolDisplay = document.getElementById('masterVolDisplay');
    const presetSelector = document.getElementById('presetSelector');
    
    // Populate preset selector
    Object.keys(defaultPresets).forEach(presetName => {
        const option = document.createElement('option');
        option.value = presetName;
        option.textContent = presetName;
        presetSelector.appendChild(option);
    });

    // Add preset selection handler
    presetSelector.addEventListener('change', async (e) => {
        const selectedPreset = e.target.value;
        if (!selectedPreset) return;

        try {
            if (defaultPresets[selectedPreset]) {
                // Handle built-in presets
                applyImportedSettings(defaultPresets[selectedPreset]);
            } else {
                // Handle file-based presets
                const encodedPreset = encodeURIComponent(selectedPreset);
                const response = await fetch(`presets/${encodedPreset}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const settings = await response.json();
                applyImportedSettings(settings);
            }
        } catch (error) {
            console.error('Error loading preset:', error);
            alert(`Failed to load preset: ${selectedPreset}\nError: ${error.message}`);
        }
    });
    
    // Update carrier type
    carrierType.addEventListener('change', (e) => {
        if (carrierOsc) {
            carrierOsc.type = e.target.value;
        }
    });
    
    // Update carrier frequency
    carrierFreq.addEventListener('input', (e) => {
        if (carrierOsc) {
            const freq = parseFloat(e.target.value);
            carrierOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            carrierFreqDisplay.textContent = freq;
        }
    });
    
    // Update master volume
    masterVol.addEventListener('input', (e) => {
        if (masterGain) {
            const vol = parseFloat(e.target.value);
            masterGain.gain.setValueAtTime(vol, audioCtx.currentTime);
            masterVolDisplay.textContent = vol.toFixed(2);
        }
    });
    
    // Add pan control
    const panSlider = document.getElementById('pan');
    panSlider.addEventListener('input', (e) => {
        if (panner && audioCtx) {
            const panValue = parseFloat(e.target.value);
            panner.pan.setValueAtTime(panValue, audioCtx.currentTime);
        }
    });
    
    // Add test slider displays
    const testSlider = document.getElementById('testSlider');
    const testSliderDisplay = document.getElementById('testSliderDisplay');
    const test2Slider = document.getElementById('test2Slider');
    const test2SliderDisplay = document.getElementById('test2SliderDisplay');

    testSlider.addEventListener('input', (e) => {
        testSliderDisplay.textContent = parseFloat(e.target.value).toFixed(2);
    });

    test2Slider.addEventListener('input', (e) => {
        test2SliderDisplay.textContent = parseFloat(e.target.value).toFixed(2);
    });
    
    // Create wave modules
    const modulesContainer = document.getElementById('modulesContainer');
    const template = document.getElementById('waveModuleTemplate');
    
    for (let i = 0; i < 2; i++) {
        const module = template.content.cloneNode(true);
        const moduleElement = module.querySelector('.wave-module');
        moduleElement.dataset.id = i;
        
        // Create audio nodes for this module
        const osc = audioCtx ? audioCtx.createOscillator() : null;
        const gain = audioCtx ? audioCtx.createGain() : null;
        const lfo = audioCtx ? audioCtx.createOscillator() : null;
        const lfoGain = audioCtx ? audioCtx.createGain() : null;
        
        if (osc && gain && lfo && lfoGain) {
            // Connect nodes
            osc.connect(gain);
            lfo.connect(lfoGain);
            lfoGain.connect(gain.gain);
            gain.connect(masterGain);
            
            // Start oscillators
            osc.start();
            lfo.start();
        }
        
        // Store module data
        modules[i] = new WaveModule(moduleElement, audioCtx);
        
        modulesContainer.appendChild(module);
    }

    // Modulation loop
    function modulationLoop() {
        // Carrier Frequency: Controlled by global knob, additively modulated by modules[0]
        const carrierFreqKnobVal = parseFloat(document.getElementById('carrierFreq').value);
        let finalCarrierFreq = carrierFreqKnobVal; // Start with the knob value
        if (modules[0].isPlaying) {
            const freqModSignal = parseFloat(modules[0].outputValue.textContent);
            if (!isNaN(freqModSignal)) { // Check if output is a valid number
                finalCarrierFreq += freqModSignal; // Add module 0 output to the knob value
            }
        }
        if (carrierOsc) {
            carrierOsc.frequency.setValueAtTime(Math.max(1, finalCarrierFreq), audioCtx.currentTime); // Min 1Hz
        }

        // Master Volume: Controlled by global knob, multiplicatively modulated by modules[1]
        const masterVolKnobVal = parseFloat(document.getElementById('masterVol').value);
        let finalMasterGainMultiplier = 1.0; // Default to no modulation on gain knob value
        if (modules[1].isPlaying) {
            const ampModSignal = parseFloat(modules[1].outputValue.textContent);
            if (!isNaN(ampModSignal)) {
                finalMasterGainMultiplier = ampModSignal;
            }
        }
        if (masterGain) {
            const targetMasterGain = Math.max(0, masterVolKnobVal * finalMasterGainMultiplier);
            // Smooth gain changes to prevent clicks
            masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime); // Cancel previous automations and set current value
            masterGain.gain.linearRampToValueAtTime(targetMasterGain, audioCtx.currentTime + 0.01); // Ramp to new target in 10ms
        }

        // Get current test slider values
        const testSliderValue = parseFloat(document.getElementById('testSlider').value);
        const test2SliderValue = parseFloat(document.getElementById('test2Slider').value);

        // Module 0 Speed: "Test" slider controls it, scaled by module 0's own speed min/max settings
        const testSliderMinFixed = -7; // Fixed range of the global Test slider
        const testSliderMaxFixed = 1;  // Fixed range of the global Test slider

        // Normalize testSliderValue to a 0-1 range
        const normalizedTestValue = (testSliderValue - testSliderMinFixed) / (testSliderMaxFixed - testSliderMinFixed);

        let mod0MinLogSpeed = parseFloat(modules[0].prefs.speedMin.value);
        let mod0MaxLogSpeed = parseFloat(modules[0].prefs.speedMax.value);

        // Validate and set default for module 0's dynamic range if necessary
        if (isNaN(mod0MinLogSpeed) || isNaN(mod0MaxLogSpeed) || mod0MinLogSpeed >= mod0MaxLogSpeed) {
            mod0MinLogSpeed = -7; // Default min for module 0's effective range
            mod0MaxLogSpeed = 1;  // Default max for module 0's effective range
            // Optionally update the input fields if they were invalid
            modules[0].prefs.speedMin.value = mod0MinLogSpeed;
            modules[0].prefs.speedMax.value = mod0MaxLogSpeed;
        }

        // Update module 0's speed slider's actual min and max attributes
        modules[0].prefs.speed.min = mod0MinLogSpeed;
        modules[0].prefs.speed.max = mod0MaxLogSpeed;

        // Scale the normalizedTestValue to the new dynamic range of module 0's slider
        let targetMod0LogSpeed = mod0MinLogSpeed + (normalizedTestValue * (mod0MaxLogSpeed - mod0MinLogSpeed));
        modules[0].setSpeed(targetMod0LogSpeed);

        // Module 1 Speed: "Test2" slider controls it, scaled by module 1's own speed min/max settings
        const test2SliderMinFixed = -7; // Fixed range of the global Test2 slider
        const test2SliderMaxFixed = 1;  // Fixed range of the global Test2 slider

        // Normalize test2SliderValue to a 0-1 range
        const normalizedTest2Value = (test2SliderValue - test2SliderMinFixed) / (test2SliderMaxFixed - test2SliderMinFixed);

        let mod1MinLogSpeed = parseFloat(modules[1].prefs.speedMin.value);
        let mod1MaxLogSpeed = parseFloat(modules[1].prefs.speedMax.value);

        // Validate and set default for module 1's dynamic range if necessary
        if (isNaN(mod1MinLogSpeed) || isNaN(mod1MaxLogSpeed) || mod1MinLogSpeed >= mod1MaxLogSpeed) {
            mod1MinLogSpeed = -7; 
            mod1MaxLogSpeed = 1;  
            modules[1].prefs.speedMin.value = mod1MinLogSpeed;
            modules[1].prefs.speedMax.value = mod1MaxLogSpeed;
        }

        // Update module 1's speed slider's actual min and max attributes
        modules[1].prefs.speed.min = mod1MinLogSpeed;
        modules[1].prefs.speed.max = mod1MaxLogSpeed;

        // Scale the normalizedTest2Value to the new dynamic range of module 1's slider
        let targetMod1LogSpeed = mod1MinLogSpeed + (normalizedTest2Value * (mod1MaxLogSpeed - mod1MinLogSpeed));
        modules[1].setSpeed(targetMod1LogSpeed);

        requestAnimationFrame(modulationLoop);
    }
    modulationLoop();

    // Function to apply settings (used by both import and preset loading)
    function applyImportedSettings(settings) {
        // Initialize audio if not already done
        if (!audioCtx) {
            initAudio();
        }
        
        // Apply module settings - only use first two modules from the preset
        if (Array.isArray(settings.modules)) {
            // Take only the first two modules from the preset
            const firstTwoModules = settings.modules.slice(0, 2);
            firstTwoModules.forEach((moduleData, i) => {
                if (modules[i]) {
                    // Ensure the module data has the correct ID for our 2-module system
                    const updatedModuleData = {
                        ...moduleData,
                        id: i.toString(), // Force ID to be 0 or 1
                        enabled: moduleData.enabled !== undefined ? moduleData.enabled : true
                    };
                    modules[i].applySettings(updatedModuleData);
                }
            });
        }
        
        // Handle both old (carrier) and new (global) format
        const globalSettings = settings.global || settings.carrier;
        if (globalSettings) {
            if (carrierOsc) {
                carrierOsc.type = globalSettings.type || globalSettings.carrierType || 'sine';
                const freq = globalSettings.freq || globalSettings.frequency || 440;
                carrierOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            }
            if (masterGain) {
                const vol = globalSettings.vol || globalSettings.volume || 0.5;
                masterGain.gain.setValueAtTime(vol, audioCtx.currentTime);
            }
            
            // Update UI
            carrierType.value = globalSettings.type || globalSettings.carrierType || 'sine';
            carrierFreq.value = globalSettings.freq || globalSettings.frequency || 440;
            carrierFreqDisplay.textContent = globalSettings.freq || globalSettings.frequency || 440;
            masterVol.value = globalSettings.vol || globalSettings.volume || 0.5;
            masterVolDisplay.textContent = (globalSettings.vol || globalSettings.volume || 0.5).toFixed(2);
        }
        
        // Apply effects settings if they exist
        const fx = settings.effects;
        if (fx) {
            effectElems.effectFilterType.value = fx.filterType || 'lowpass';
            effectElems.effectFilterFrequency.value = fx.filterFrequency !== undefined ? fx.filterFrequency : 50;
            effectElems.effectFilterQ.value = fx.filterQ !== undefined ? fx.filterQ : 1;
            effectElems.effectFilterGain.value = fx.filterGain !== undefined ? fx.filterGain : 0;
            effectElems.effectReverbMix.value = fx.reverbMix !== undefined ? fx.reverbMix : 0.5;
            effectElems.effectReverbPreDelay.value = fx.reverbPreDelay !== undefined ? fx.reverbPreDelay : 20;
            effectElems.effectReverbDecay.value = fx.reverbDecay !== undefined ? fx.reverbDecay : 0.5;
            effectElems.effectsOutputVolume.value = fx.outputVolume !== undefined ? fx.outputVolume : 0.8;
            
            // Trigger input events to update displays and audio params via updateEffectsParams
            ['effectFilterType', 'effectFilterFrequency', 'effectFilterQ', 'effectFilterGain', 'effectReverbMix', 'effectReverbPreDelay', 'effectReverbDecay', 'effectsOutputVolume']
                .forEach(id => {
                    if (effectElems[id]) {
                        effectElems[id].dispatchEvent(new Event('input'));
                    }
                });
        }
        
        // Update effects parameters
        updateGlobalEffectParams();
    }

    // Export/Import functionality
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    
    exportBtn.addEventListener('click', () => {
        if (!audioCtx) return;
        
        const data = {
            modules: modules.map(module => module.getSettings()),
            global: {
                carrierType: carrierOsc ? carrierOsc.type : 'sine',
                frequency: carrierOsc ? carrierOsc.frequency.value : 440,
                volume: masterGain ? masterGain.gain.value : 0.5,
                filter: {
                    type: filter ? filter.type : 'lowpass',
                    frequency: filter ? filter.frequency.value : 1000,
                    Q: filter ? filter.Q.value : 1,
                    gain: filter ? filter.gain.value : 0
                },
                reverb: {
                    mix: wetGain ? wetGain.gain.value : 0.5,
                    preDelay: parseFloat(document.getElementById('effectReverbPreDelay').value),
                    decay: parseFloat(document.getElementById('effectReverbDecay').value)
                }
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'brain-forest-preset.json';
        a.click();
        URL.revokeObjectURL(url);
    });
    
    importBtn.addEventListener('click', () => {
        importFile.click();
    });
    
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    applyImportedSettings(data);
                } catch (error) {
                    console.error('Error loading preset:', error);
                    alert('Error loading preset file');
                }
            };
            reader.readAsText(file);
        }
    });

    // Load preset files when the page loads
    loadPresetFiles().then(() => {
        // Get all preset options (excluding the default empty option)
        const presetOptions = Array.from(presetSelector.options).filter(option => option.value !== '');
        
        if (presetOptions.length > 0) {
            // Randomly select a preset
            const randomIndex = Math.floor(Math.random() * presetOptions.length);
            const randomPreset = presetOptions[randomIndex].value;
            
            // Set the preset selector to the random preset
            presetSelector.value = randomPreset;
            
            // Trigger the change event to load the preset
            presetSelector.dispatchEvent(new Event('change'));
        }
    });

    // Load preset files from the presets folder
    async function loadPresetFiles() {
        try {
            const response = await fetch('presets/');
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const files = Array.from(doc.querySelectorAll('a'))
                .map(a => a.href)
                .filter(href => href.endsWith('.json'))
                .map(href => {
                    const fileName = href.split('/').pop();
                    return decodeURIComponent(fileName);
                });

            // Add file-based presets to the dropdown
            files.forEach(fileName => {
                const option = document.createElement('option');
                option.value = fileName;
                option.textContent = fileName.replace('.json', '');
                presetSelector.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading preset files:', error);
        }
    }
});

class WaveModule {
    constructor(root, audioCtx) {
        this.root = root;
        this.audioCtx = audioCtx;
        this.customPoints = [];
        this.history = [];
        this.isPlaying = false;
        this.startTime = 0;
        this.lastSpeed = 1;
        this.outputValue = root.querySelector('.output-value');
        this.outputCanvas = root.querySelector('.output-canvas');
        this.outputCanvas.width = 200;
        this.outputCanvas.height = 50;
        this.outputCtx = this.outputCanvas.getContext('2d');
        this.trigger = root.querySelector('.wave-trigger');
        this.settings = root.querySelector('.settings');
        this.prefs = {
            waveType: root.querySelector('.wave-type'),
            customContainer: root.querySelector('.custom-container'),
            drawCanvas: root.querySelector('.draw-canvas'),
            drawCtx: root.querySelector('.draw-canvas') ? root.querySelector('.draw-canvas').getContext('2d') : null,
            clearDraw: root.querySelector('.clear-draw'),
            speed: root.querySelector('.speed'),
            speedDisplay: root.querySelector('.speed-display'),
            speedMin: root.querySelector('.speed-min'),
            speedMax: root.querySelector('.speed-max'),
            speedRangeControls: root.querySelector('.speed-range-controls'),
            depth: root.querySelector('.depth'),
            depthDisplay: root.querySelector('.depth-display'),
            low: root.querySelector('.low'),
            high: root.querySelector('.high'),
            phase: root.querySelector('.phase'),
            phaseDisplay: root.querySelector('.phase-display'),
            log: root.querySelector('.log-scale'),
            logDisplay: root.querySelector('.log-display'),
            enable: root.querySelector('.enable')
        };
        this.bind();
        // Hide speed range controls if not module 0 or module 1
        if (this.root.dataset.id !== '0' && this.root.dataset.id !== '1' && this.prefs.speedRangeControls) {
            this.prefs.speedRangeControls.style.display = 'none';
        }
    }

    bind() {
        const p = this.prefs;
        this.trigger.addEventListener('click', () => this.settings.style.display = this.settings.style.display === 'block' ? 'none' : 'block');
        p.enable.addEventListener('change', () => {
            this.isPlaying = p.enable.checked;
            if (this.audioCtx) this.audioCtx.resume();
            if (this.isPlaying) {
                this.startTime = Date.now();
                this.history = [];
                this.update();
            }
        });
        p.waveType.addEventListener('change', () => {
            p.customContainer.style.display = p.waveType.value === 'custom' ? 'block' : 'none';
            this.redrawDrawCanvas();
        });
        if (p.drawCanvas) {
            let drawing = false;
            p.drawCanvas.addEventListener('mousedown', e => {
                if (p.waveType.value !== 'custom') return;
                drawing = true;
                this.customPoints = [];
                p.drawCtx.clearRect(0, 0, p.drawCanvas.width, p.drawCanvas.height);
                p.drawCtx.beginPath();
                const r = p.drawCanvas.getBoundingClientRect();
                const pt = { x: e.clientX - r.left, y: e.clientY - r.top };
                p.drawCtx.moveTo(pt.x, pt.y);
                this.customPoints.push(pt);
            });
            p.drawCanvas.addEventListener('mousemove', e => {
                if (!drawing) return;
                const r = p.drawCanvas.getBoundingClientRect();
                const pt = { x: e.clientX - r.left, y: e.clientY - r.top };
                this.customPoints.push(pt);
                p.drawCtx.lineTo(pt.x, pt.y);
                p.drawCtx.strokeStyle = '#61dafb';
                p.drawCtx.lineWidth = 2;
                p.drawCtx.stroke();
            });
            ['mouseup', 'mouseleave'].forEach(evt => p.drawCanvas.addEventListener(evt, () => drawing = false));
            p.clearDraw.addEventListener('click', () => {
                p.drawCtx.clearRect(0, 0, p.drawCanvas.width, p.drawCanvas.height);
                this.customPoints = [];
            });
        }
        p.speed.addEventListener('input', () => this.setSpeed(this.prefs.speed.value));
        p.depth.addEventListener('input', () => p.depthDisplay.textContent = parseFloat(p.depth.value).toFixed(2));
        p.phase.addEventListener('input', () => p.phaseDisplay.textContent = p.phase.value + '°');
        p.log.addEventListener('input', () => p.logDisplay.textContent = parseFloat(p.log.value).toFixed(2));
    }

    setSpeed(newLogSpeed) {
        // Ensure newLogSpeed is a number
        newLogSpeed = parseFloat(newLogSpeed);
        if (isNaN(newLogSpeed)) return;

        // Update the slider's visual position if it's not already there
        if (parseFloat(this.prefs.speed.value) !== newLogSpeed) {
            this.prefs.speed.value = newLogSpeed;
        }

        const newSpeedHz = Math.pow(10, newLogSpeed);
        const now = Date.now();

        // Phase correction logic
        const elapsedSinceLastStartTime = (now - this.startTime) / 1000;
        const currentPhaseProgress = (elapsedSinceLastStartTime * this.lastSpeed) % 1;

        this.lastSpeed = newSpeedHz;
        this.startTime = now - (currentPhaseProgress / newSpeedHz) * 1000;
        if (newSpeedHz === 0) {
            this.startTime = now;
        }

        this.prefs.speedDisplay.textContent = newSpeedHz.toFixed(7) + ' Hz';
    }

    calculate(t) {
        const p = this.prefs;
        const dep = parseFloat(p.depth.value);
        let raw = t;
        const logS = parseFloat(p.log.value);
        raw = logS === 1 ? raw : (Math.log(raw * (logS - 1) + 1) / Math.log(logS));
        const phase = (raw * 2 * Math.PI + parseFloat(p.phase.value) * Math.PI / 180);
        let v = 0;
        switch (p.waveType.value) {
            case 'sine': v = Math.sin(phase); break;
            case 'square': v = Math.sign(Math.sin(phase)); break;
            case 'sawtooth': v = 2 * (raw - 0.5); break;
            case 'reverse-sawtooth': v = 2 * (0.5 - raw); break;
            case 'triangle': v = 2 * Math.abs(2 * (raw - 0.5)) - 1; break;
            case 'reverse-triangle': v = 1 - 2 * Math.abs(2 * (raw - 0.5)); break;
            case 'custom':
                if (this.customPoints.length > 1) {
                    const pts = this.customPoints;
                    const idx = raw * (pts.length - 1);
                    const i = Math.floor(idx);
                    const ni = (i + 1) % pts.length;
                    const f = idx - i;
                    const y = pts[i].y * (1 - f) + pts[ni].y * f;
                    v = 1 - 2 * (y / this.prefs.drawCanvas.height);
                }
                break;
        }
        return v * dep;
    }

    update() {
        if (!this.isPlaying) return;
        const t = ((Date.now() - this.startTime) / 1000 * this.lastSpeed) % 1;
        const val = this.calculate(t);
        const low = parseFloat(this.prefs.low.value);
        const high = parseFloat(this.prefs.high.value);
        const sc = low + (val + 1) * (high - low) / 2;
        this.outputValue.textContent = sc.toFixed(3);
        this.history.push(sc);
        if (this.history.length > this.outputCanvas.width) this.history.shift();
        const c = this.outputCtx;
        c.fillStyle = '#282c34';
        c.fillRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
        c.beginPath();
        c.strokeStyle = '#61dafb';
        c.lineWidth = 2;
        this.history.forEach((v, i) => {
            const y = this.outputCanvas.height - ((v - low) / (high - low)) * this.outputCanvas.height;
            i === 0 ? c.moveTo(i, y) : c.lineTo(i, y);
        });
        c.stroke();
        requestAnimationFrame(() => this.update());
    }

    getSettings() {
        const p = this.prefs;
        return {
            id: this.root.dataset.id,
            waveType: p.waveType.value,
            customPoints: this.customPoints,
            speed: parseFloat(p.speed.value),
            speedMin: p.speedMin ? parseFloat(p.speedMin.value) : -7,
            speedMax: p.speedMax ? parseFloat(p.speedMax.value) : 1,
            depth: parseFloat(p.depth.value),
            low: parseFloat(p.low.value),
            high: parseFloat(p.high.value),
            phase: parseInt(p.phase.value),
            logScale: parseFloat(p.log.value),
            enabled: p.enable.checked
        };
    }

    applySettings(s) {
        if (!s) return;
        const p = this.prefs;

        p.waveType.value = s.waveType || 'sine';
        this.customPoints = s.customPoints || [];
        p.customContainer.style.display = p.waveType.value === 'custom' ? 'block' : 'none';
        this.redrawDrawCanvas();

        if (p.speedMin) {
            p.speedMin.value = s.speedMin !== undefined ? s.speedMin : -7;
        }
        if (p.speedMax) {
            p.speedMax.value = s.speedMax !== undefined ? s.speedMax : 1;
        }

        p.depth.value = s.depth !== undefined ? s.depth : 0.5;
        p.depthDisplay.textContent = parseFloat(p.depth.value).toFixed(2);

        p.low.value = s.low !== undefined ? s.low : -1;
        p.high.value = s.high !== undefined ? s.high : 1;

        p.phase.value = s.phase !== undefined ? s.phase : 0;
        p.phaseDisplay.textContent = p.phase.value + '°';

        p.log.value = s.logScale !== undefined ? s.logScale : 1;
        p.logDisplay.textContent = parseFloat(p.log.value).toFixed(2);
        
        p.enable.checked = s.enabled || false;
        this.isPlaying = p.enable.checked;
        if (this.isPlaying) {
            this.startTime = Date.now();
            this.history = [];
            this.update();
        } else {
            this.outputValue.textContent = (0).toFixed(3);
            const c = this.outputCtx;
            c.fillStyle = '#282c34';
            c.fillRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
        }
    }
    
    redrawDrawCanvas() {
        if (this.prefs.waveType.value === 'custom' && this.prefs.drawCtx) {
            const ctx = this.prefs.drawCtx;
            const canvas = this.prefs.drawCanvas;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (this.customPoints && this.customPoints.length > 1) {
                ctx.beginPath();
                ctx.moveTo(this.customPoints[0].x, this.customPoints[0].y);
                for (let i = 1; i < this.customPoints.length; i++) {
                    ctx.lineTo(this.customPoints[i].x, this.customPoints[i].y);
                }
                ctx.strokeStyle = '#61dafb';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }
} 