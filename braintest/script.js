// Water Data Visualizer Code
let chart = null;
let lfo = null;
let currentData = [];
let isPlaying = false;
let currentValue = 0;
let currentDataIndex = 0;
let dataInterval = null;
let minScale = 0;
let maxScale = 1;

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

// Function to scale a value between min and max
function scaleValue(value) {
    const min = parseFloat(document.getElementById('minValue').value);
    const max = parseFloat(document.getElementById('maxValue').value);
    return min + (value - Math.min(...currentData.map(d => d.value))) * 
           (max - min) / (Math.max(...currentData.map(d => d.value)) - Math.min(...currentData.map(d => d.value)));
}

// Initialize Tone.js
async function initAudio() {
    try {
        await Tone.start();
        lfo = new Tone.LFO({
            frequency: 1,
            min: 0,
            max: 1,
            type: "triangle"
        });
        
        const dummyNode = new Tone.Gain(0);
        lfo.connect(dummyNode);
        dummyNode.toDestination();
        
        console.log('LFO initialized successfully');
    } catch (error) {
        console.error('Error initializing audio:', error);
    }
}

// Load and parse CSV
async function loadCSV(filePath) {
    try {
        const response = await fetch(filePath);
        const text = await response.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        currentData = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
                const values = line.split(',');
                return {
                    date: new Date(values[0]),
                    value: parseFloat(values[1])
                };
            });
        
        // Calculate min and max values
        const minValue = Math.min(...currentData.map(d => d.value));
        const maxValue = Math.max(...currentData.map(d => d.value));
        
        // Update min/max displays
        document.getElementById('minValue').value = minValue;
        document.getElementById('maxValue').value = maxValue;
        document.getElementById('minValueDisplay').textContent = minValue.toFixed(2);
        document.getElementById('maxValueDisplay').textContent = maxValue.toFixed(2);
        
        // Update min/max scale
        minScale = minValue;
        maxScale = maxValue;
        
        updateChart();
    } catch (error) {
        console.error('Error loading CSV:', error);
    }
}

// Update chart with current data
function updateChart() {
    const ctx = document.getElementById('dataChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: currentData.map(d => d.date.toLocaleDateString()),
            datasets: [{
                label: 'Water Level',
                data: currentData.map(d => d.value),
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
                    // Remove any min/max scaling from the chart
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
function togglePlayback() {
    isPlaying = !isPlaying;
    if (isPlaying) {
        startPlayback();
    } else {
        stopPlayback();
    }
}

function startPlayback() {
    const speed = parseFloat(document.getElementById('speedControl').value);
    const interval = 1000 / speed;
    
    dataInterval = setInterval(() => {
        if (currentDataIndex >= currentData.length) {
            currentDataIndex = 0;
        }
        
        const dataPoint = currentData[currentDataIndex];
        const rawValue = dataPoint.value;
        currentValue = scaleValue(rawValue);
        
        // Display both raw and scaled values
        document.getElementById('numberDisplay').textContent = currentValue.toFixed(2);
        document.getElementById('rawValueDisplay').textContent = rawValue.toFixed(2);
        
        // Update both test and test2 sliders with the current value
        const testSlider = document.getElementById('testSlider');
        const test2Slider = document.getElementById('test2Slider');
        
        if (testSlider) {
            testSlider.value = currentValue;
            // Update the display value for test slider
            const testSliderDisplay = document.getElementById('testSliderDisplay');
            if (testSliderDisplay) {
                testSliderDisplay.textContent = currentValue.toFixed(2);
            }
        }
        
        if (test2Slider) {
            test2Slider.value = currentValue;
            // Update the display value for test2 slider
            const test2SliderDisplay = document.getElementById('test2SliderDisplay');
            if (test2SliderDisplay) {
                test2SliderDisplay.textContent = currentValue.toFixed(2);
            }
        }
        
        if (lfo) {
            lfo.min = currentValue;
            lfo.max = currentValue;
        }
        
        // Update chart with current position - using raw values
        if (chart) {
            const datasets = [{
                label: 'Water Level',
                data: currentData.map(d => d.value),
                borderColor: '#61dafb',
                backgroundColor: 'rgba(97, 218, 251, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Current Position',
                data: currentData.map((d, i) => {
                    if (i === currentDataIndex) {
                        return Math.min(...currentData.map(d => d.value));
                    }
                    if (i === currentDataIndex + 1) {
                        return Math.max(...currentData.map(d => d.value));
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
            
            chart.data.datasets = datasets;
            chart.update('none');
        }
        
        currentDataIndex++;
    }, interval);
}

function stopPlayback() {
    if (dataInterval) {
        clearInterval(dataInterval);
        dataInterval = null;
        
        // Clear the position line when stopping
        if (chart) {
            chart.data.datasets = [{
                label: 'Water Level',
                data: currentData.map(d => d.value),
                borderColor: '#61dafb',
                backgroundColor: 'rgba(97, 218, 251, 0.1)',
                fill: true,
                tension: 0.4
            }];
            chart.update('none');
        }
    }
}

function resetPlayback() {
    stopPlayback();
    currentDataIndex = 0;
    currentValue = 0;
    document.getElementById('numberDisplay').textContent = '0.00';
    document.getElementById('rawValueDisplay').textContent = '0.00';
    if (lfo) {
        lfo.min = 0;
        lfo.max = 0;
    }
}

// Event Listeners for Water Data Visualizer
document.addEventListener('DOMContentLoaded', () => {
    // Initialize audio
    initAudio();
    
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
    
    // CSV selection
    document.getElementById('csvSelect').addEventListener('change', (e) => {
        if (e.target.value) {
            loadCSV(e.target.value);
        }
    });
    
    // Playback toggle
    document.getElementById('playbackToggle').addEventListener('change', (e) => {
        togglePlayback();
    });
    
    // Speed control
    document.getElementById('speedControl').addEventListener('input', (e) => {
        document.getElementById('speedValue').textContent = e.target.value + 'x';
        if (isPlaying) {
            stopPlayback();
            startPlayback();
        }
    });
    
    // Reset button
    document.getElementById('resetButton').addEventListener('click', resetPlayback);
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

    // Default presets
    const defaultPresets = {
        'scraper': {
            modules: [
                {
                    "id": "0",
                    "waveType": "reverse-sawtooth",
                    "customPoints": [],
                    "speed": 0.66,
                    "speedMin": -2,
                    "speedMax": 1,
                    "depth": 1,
                    "low": -1,
                    "high": 1,
                    "phase": 291,
                    "logScale": 0.12,
                    "enabled": true
                },
                {
                    "id": "1",
                    "waveType": "reverse-sawtooth",
                    "customPoints": [
                        {
                            "x": 0.30981841710502883,
                            "y": 6.364198441002971
                        },
                        {
                            "x": 0.30981841710502883,
                            "y": 6.364198441002971
                        },
                        {
                            "x": 0.30981841710502883,
                            "y": 6.364198441002971
                        },
                        {
                            "x": 1.2393304013293087,
                            "y": 6.364198441002971
                        },
                        {
                            "x": 1.7040863934414487,
                            "y": 6.364198441002971
                        },
                        {
                            "x": 2.1688423855535888,
                            "y": 6.364198441002971
                        },
                        {
                            "x": 2.6335983776657286,
                            "y": 6.364198441002971
                        },
                        {
                            "x": 3.5631103618900086,
                            "y": 6.364198441002971
                        },
                        {
                            "x": 4.492622346114288,
                            "y": 6.364198441002971
                        },
                        {
                            "x": 4.9573783382264285,
                            "y": 6.364198441002971
                        },
                        {
                            "x": 5.886890322450708,
                            "y": 6.563533984123205
                        },
                        {
                            "x": 5.886890322450708,
                            "y": 6.563533984123205
                        },
                        {
                            "x": 6.816402306674989,
                            "y": 6.962205070363674
                        },
                        {
                            "x": 7.281158298787129,
                            "y": 6.962205070363674
                        },
                        {
                            "x": 7.281158298787129,
                            "y": 7.161540613483908
                        },
                        {
                            "x": 7.281158298787129,
                            "y": 7.360876156604142
                        },
                        {
                            "x": 7.281158298787129,
                            "y": 7.759547242844611
                        },
                        {
                            "x": 7.281158298787129,
                            "y": 8.556889415325548
                        },
                        {
                            "x": 7.281158298787129,
                            "y": 8.955560501566016
                        },
                        {
                            "x": 6.816402306674989,
                            "y": 9.354231587806485
                        },
                        {
                            "x": 6.351646314562848,
                            "y": 11.148251475888593
                        },
                        {
                            "x": 6.816402306674989,
                            "y": 14.138284622692105
                        },
                        {
                            "x": 8.210670283011408,
                            "y": 16.72964668325515
                        },
                        {
                            "x": 9.604938259347827,
                            "y": 19.919015373178897
                        },
                        {
                            "x": 10.534450243572108,
                            "y": 23.108384063102644
                        },
                        {
                            "x": 12.393474212020669,
                            "y": 27.294430468627564
                        },
                        {
                            "x": 14.252498180469228,
                            "y": 30.88247024479178
                        },
                        {
                            "x": 17.041034133142066,
                            "y": 36.66320099527857
                        },
                        {
                            "x": 17.970546117366347,
                            "y": 38.058549797120214
                        },
                        {
                            "x": 19.36481409370277,
                            "y": 41.048582943923726
                        },
                        {
                            "x": 21.223838062151327,
                            "y": 44.23795163384747
                        },
                        {
                            "x": 23.082862030599888,
                            "y": 47.42732032377122
                        },
                        {
                            "x": 24.012374014824168,
                            "y": 49.022004668733096
                        },
                        {
                            "x": 24.94188599904845,
                            "y": 50.01868238433426
                        },
                        {
                            "x": 25.406641991160587,
                            "y": 51.21469564305567
                        },
                        {
                            "x": 26.800909967497006,
                            "y": 53.40738661737824
                        },
                        {
                            "x": 27.730421951721286,
                            "y": 55.00207096234012
                        },
                        {
                            "x": 28.19517794383343,
                            "y": 55.600077591700824
                        },
                        {
                            "x": 28.659933935945567,
                            "y": 56.39741976418176
                        },
                        {
                            "x": 29.124689928057705,
                            "y": 56.796090850422225
                        },
                        {
                            "x": 29.589445920169847,
                            "y": 57.99210410914363
                        },
                        {
                            "x": 30.518957904394128,
                            "y": 59.387452910985274
                        },
                        {
                            "x": 31.44846988861841,
                            "y": 60.583466169706675
                        },
                        {
                            "x": 32.37798187284269,
                            "y": 61.58014388530785
                        },
                        {
                            "x": 33.307493857066966,
                            "y": 62.377486057788786
                        },
                        {
                            "x": 34.23700584129125,
                            "y": 62.97549268714949
                        },
                        {
                            "x": 36.096029809739804,
                            "y": 63.77283485963042
                        },
                        {
                            "x": 36.56078580185195,
                            "y": 63.972170402750656
                        },
                        {
                            "x": 37.02554179396409,
                            "y": 64.37084148899113
                        },
                        {
                            "x": 37.490297786076226,
                            "y": 64.37084148899113
                        },
                        {
                            "x": 38.88456576241265,
                            "y": 64.57017703211136
                        },
                        {
                            "x": 42.137857707197625,
                            "y": 65.16818366147207
                        },
                        {
                            "x": 43.06736969142191,
                            "y": 65.3675192045923
                        },
                        {
                            "x": 44.92639365987046,
                            "y": 65.76619029083277
                        },
                        {
                            "x": 48.17968560465545,
                            "y": 66.5635324633137
                        },
                        {
                            "x": 52.36248953366471,
                            "y": 67.56021017891487
                        },
                        {
                            "x": 59.333829415346806,
                            "y": 68.95555898075652
                        },
                        {
                            "x": 65.84041330491677,
                            "y": 69.95223669635769
                        },
                        {
                            "x": 74.20602116293529,
                            "y": 71.34758549819932
                        },
                        {
                            "x": 77.92406909983241,
                            "y": 71.94559212756003
                        },
                        {
                            "x": 83.03638501306594,
                            "y": 72.74293430004097
                        },
                        {
                            "x": 91.8667488631966,
                            "y": 74.33761864500283
                        },
                        {
                            "x": 101.1618687054394,
                            "y": 75.33429636060401
                        },
                        {
                            "x": 103.4856486660001,
                            "y": 75.53363190372424
                        },
                        {
                            "x": 107.66845259500936,
                            "y": 75.33429636060401
                        },
                        {
                            "x": 108.59796457923365,
                            "y": 74.33761864500283
                        },
                        {
                            "x": 109.52747656345792,
                            "y": 72.9422698431612
                        },
                        {
                            "x": 110.4569885476822,
                            "y": 70.94891441195885
                        },
                        {
                            "x": 110.92174453979435,
                            "y": 69.75290115323745
                        },
                        {
                            "x": 111.38650053190648,
                            "y": 68.15821680827558
                        },
                        {
                            "x": 112.31601251613075,
                            "y": 64.7695125752316
                        },
                        {
                            "x": 112.7807685082429,
                            "y": 61.38080834218761
                        },
                        {
                            "x": 113.71028049246718,
                            "y": 57.194761936662694
                        },
                        {
                            "x": 114.63979247669147,
                            "y": 51.812702272416374
                        },
                        {
                            "x": 115.56930446091575,
                            "y": 47.42732032377122
                        },
                        {
                            "x": 116.96357243725217,
                            "y": 44.23795163384747
                        },
                        {
                            "x": 118.35784041358858,
                            "y": 40.64991185768326
                        },
                        {
                            "x": 119.28735239781287,
                            "y": 38.058549797120214
                        },
                        {
                            "x": 120.21686438203714,
                            "y": 37.06187208151904
                        },
                        {
                            "x": 122.0758883504857,
                            "y": 37.06187208151904
                        },
                        {
                            "x": 124.86442430315854,
                            "y": 38.855891969601146
                        },
                        {
                            "x": 130.44149620850422,
                            "y": 46.43064260817005
                        },
                        {
                            "x": 137.87759208229846,
                            "y": 56.39741976418176
                        },
                        {
                            "x": 141.59564001919557,
                            "y": 62.17815051466855
                        },
                        {
                            "x": 145.3136879560927,
                            "y": 68.15821680827558
                        },
                        {
                            "x": 147.6374679166534,
                            "y": 71.94559212756003
                        },
                        {
                            "x": 149.03173589298981,
                            "y": 74.7362897312433
                        },
                        {
                            "x": 150.42600386932625,
                            "y": 76.72964516244565
                        },
                        {
                            "x": 151.35551585355051,
                            "y": 77.52698733492659
                        },
                        {
                            "x": 152.2850278377748,
                            "y": 77.92565842116706
                        },
                        {
                            "x": 153.21453982199907,
                            "y": 78.52366505052775
                        },
                        {
                            "x": 156.0030757746719,
                            "y": 79.52034276612893
                        },
                        {
                            "x": 164.36868363269045,
                            "y": 78.723000593648
                        },
                        {
                            "x": 166.69246359325115,
                            "y": 78.12499396428728
                        },
                        {
                            "x": 170.41051153014826,
                            "y": 77.32765179180635
                        },
                        {
                            "x": 175.05807145126965,
                            "y": 76.33097407620518
                        },
                        {
                            "x": 178.7761193881668,
                            "y": 75.73296744684448
                        },
                        {
                            "x": 182.4941673250639,
                            "y": 75.13496081748377
                        },
                        {
                            "x": 183.8884353014003,
                            "y": 74.93562527436355
                        },
                        {
                            "x": 186.67697125407315,
                            "y": 74.53695418812308
                        },
                        {
                            "x": 189.465507206746,
                            "y": 74.33761864500283
                        },
                        {
                            "x": 190.8597751830824,
                            "y": 74.1382831018826
                        },
                        {
                            "x": 193.64831113575525,
                            "y": 73.34094092940167
                        },
                        {
                            "x": 195.5073351042038,
                            "y": 72.74293430004097
                        },
                        {
                            "x": 195.97209109631595,
                            "y": 72.3442632138005
                        },
                        {
                            "x": 196.90160308054024,
                            "y": 72.14492767068026
                        },
                        {
                            "x": 196.90160308054024,
                            "y": 71.34758549819932
                        },
                        {
                            "x": 197.3663590726524,
                            "y": 70.55024332571838
                        },
                        {
                            "x": 197.3663590726524,
                            "y": 70.15157223947791
                        },
                        {
                            "x": 197.8311150647645,
                            "y": 69.75290115323745
                        },
                        {
                            "x": 198.29587105687665,
                            "y": 69.35423006699698
                        },
                        {
                            "x": 198.7606270489888,
                            "y": 69.15489452387675
                        },
                        {
                            "x": 199.6901390332131,
                            "y": 68.95555898075652
                        }
                    ],
                    "speed": 1.07,
                    "speedMin": -6.06,
                    "speedMax": 2,
                    "depth": 0.91,
                    "low": -1,
                    "high": 1,
                    "phase": 0,
                    "logScale": 0.1,
                    "enabled": true
                }
            ],
            "global": {
                "carrierType": "sawtooth",
                "frequency": 20.569000244140625,
                "volume": 0.07,
                "filter": {
                    "type": "lowpass",
                    "frequency": 514.0791625976562,
                    "Q": 26.50040054321289,
                    "gain": -40
                },
                "reverb": {
                    "mix": 0.28999999165534973,
                    "preDelay": 0,
                    "decay": 0.5
                }
            }
        },

 'scraper2': {
  "modules": [
    {
      "id": "0",
      "waveType": "reverse-sawtooth",
      "customPoints": [],
      "speed": 0.5,
      "speedMin": -2,
      "speedMax": 1,
      "depth": 1,
      "low": -1,
      "high": 64,
      "phase": 278,
      "logScale": 1.25,
      "enabled": true
    },
    {
      "id": "1",
      "waveType": "custom",
      "customPoints": [
        {
          "x": 0.30981841710502883,
          "y": 6.364198441002971
        },
        {
          "x": 0.30981841710502883,
          "y": 6.364198441002971
        },
        {
          "x": 0.30981841710502883,
          "y": 6.364198441002971
        },
        {
          "x": 1.2393304013293087,
          "y": 6.364198441002971
        },
        {
          "x": 1.7040863934414487,
          "y": 6.364198441002971
        },
        {
          "x": 2.1688423855535888,
          "y": 6.364198441002971
        },
        {
          "x": 2.6335983776657286,
          "y": 6.364198441002971
        },
        {
          "x": 3.5631103618900086,
          "y": 6.364198441002971
        },
        {
          "x": 4.492622346114288,
          "y": 6.364198441002971
        },
        {
          "x": 4.9573783382264285,
          "y": 6.364198441002971
        },
        {
          "x": 5.886890322450708,
          "y": 6.563533984123205
        },
        {
          "x": 5.886890322450708,
          "y": 6.563533984123205
        },
        {
          "x": 6.816402306674989,
          "y": 6.962205070363674
        },
        {
          "x": 7.281158298787129,
          "y": 6.962205070363674
        },
        {
          "x": 7.281158298787129,
          "y": 7.161540613483908
        },
        {
          "x": 7.281158298787129,
          "y": 7.360876156604142
        },
        {
          "x": 7.281158298787129,
          "y": 7.759547242844611
        },
        {
          "x": 7.281158298787129,
          "y": 8.556889415325548
        },
        {
          "x": 7.281158298787129,
          "y": 8.955560501566016
        },
        {
          "x": 6.816402306674989,
          "y": 9.354231587806485
        },
        {
          "x": 6.351646314562848,
          "y": 11.148251475888593
        },
        {
          "x": 6.816402306674989,
          "y": 14.138284622692105
        },
        {
          "x": 8.210670283011408,
          "y": 16.72964668325515
        },
        {
          "x": 9.604938259347827,
          "y": 19.919015373178897
        },
        {
          "x": 10.534450243572108,
          "y": 23.108384063102644
        },
        {
          "x": 12.393474212020669,
          "y": 27.294430468627564
        },
        {
          "x": 14.252498180469228,
          "y": 30.88247024479178
        },
        {
          "x": 17.041034133142066,
          "y": 36.66320099527857
        },
        {
          "x": 17.970546117366347,
          "y": 38.058549797120214
        },
        {
          "x": 19.36481409370277,
          "y": 41.048582943923726
        },
        {
          "x": 21.223838062151327,
          "y": 44.23795163384747
        },
        {
          "x": 23.082862030599888,
          "y": 47.42732032377122
        },
        {
          "x": 24.012374014824168,
          "y": 49.022004668733096
        },
        {
          "x": 24.94188599904845,
          "y": 50.01868238433426
        },
        {
          "x": 25.406641991160587,
          "y": 51.21469564305567
        },
        {
          "x": 26.800909967497006,
          "y": 53.40738661737824
        },
        {
          "x": 27.730421951721286,
          "y": 55.00207096234012
        },
        {
          "x": 28.19517794383343,
          "y": 55.600077591700824
        },
        {
          "x": 28.659933935945567,
          "y": 56.39741976418176
        },
        {
          "x": 29.124689928057705,
          "y": 56.796090850422225
        },
        {
          "x": 29.589445920169847,
          "y": 57.99210410914363
        },
        {
          "x": 30.518957904394128,
          "y": 59.387452910985274
        },
        {
          "x": 31.44846988861841,
          "y": 60.583466169706675
        },
        {
          "x": 32.37798187284269,
          "y": 61.58014388530785
        },
        {
          "x": 33.307493857066966,
          "y": 62.377486057788786
        },
        {
          "x": 34.23700584129125,
          "y": 62.97549268714949
        },
        {
          "x": 36.096029809739804,
          "y": 63.77283485963042
        },
        {
          "x": 36.56078580185195,
          "y": 63.972170402750656
        },
        {
          "x": 37.02554179396409,
          "y": 64.37084148899113
        },
        {
          "x": 37.490297786076226,
          "y": 64.37084148899113
        },
        {
          "x": 38.88456576241265,
          "y": 64.57017703211136
        },
        {
          "x": 42.137857707197625,
          "y": 65.16818366147207
        },
        {
          "x": 43.06736969142191,
          "y": 65.3675192045923
        },
        {
          "x": 44.92639365987046,
          "y": 65.76619029083277
        },
        {
          "x": 48.17968560465545,
          "y": 66.5635324633137
        },
        {
          "x": 52.36248953366471,
          "y": 67.56021017891487
        },
        {
          "x": 59.333829415346806,
          "y": 68.95555898075652
        },
        {
          "x": 65.84041330491677,
          "y": 69.95223669635769
        },
        {
          "x": 74.20602116293529,
          "y": 71.34758549819932
        },
        {
          "x": 77.92406909983241,
          "y": 71.94559212756003
        },
        {
          "x": 83.03638501306594,
          "y": 72.74293430004097
        },
        {
          "x": 91.8667488631966,
          "y": 74.33761864500283
        },
        {
          "x": 101.1618687054394,
          "y": 75.33429636060401
        },
        {
          "x": 103.4856486660001,
          "y": 75.53363190372424
        },
        {
          "x": 107.66845259500936,
          "y": 75.33429636060401
        },
        {
          "x": 108.59796457923365,
          "y": 74.33761864500283
        },
        {
          "x": 109.52747656345792,
          "y": 72.9422698431612
        },
        {
          "x": 110.4569885476822,
          "y": 70.94891441195885
        },
        {
          "x": 110.92174453979435,
          "y": 69.75290115323745
        },
        {
          "x": 111.38650053190648,
          "y": 68.15821680827558
        },
        {
          "x": 112.31601251613075,
          "y": 64.7695125752316
        },
        {
          "x": 112.7807685082429,
          "y": 61.38080834218761
        },
        {
          "x": 113.71028049246718,
          "y": 57.194761936662694
        },
        {
          "x": 114.63979247669147,
          "y": 51.812702272416374
        },
        {
          "x": 115.56930446091575,
          "y": 47.42732032377122
        },
        {
          "x": 116.96357243725217,
          "y": 44.23795163384747
        },
        {
          "x": 118.35784041358858,
          "y": 40.64991185768326
        },
        {
          "x": 119.28735239781287,
          "y": 38.058549797120214
        },
        {
          "x": 120.21686438203714,
          "y": 37.06187208151904
        },
        {
          "x": 122.0758883504857,
          "y": 37.06187208151904
        },
        {
          "x": 124.86442430315854,
          "y": 38.855891969601146
        },
        {
          "x": 130.44149620850422,
          "y": 46.43064260817005
        },
        {
          "x": 137.87759208229846,
          "y": 56.39741976418176
        },
        {
          "x": 141.59564001919557,
          "y": 62.17815051466855
        },
        {
          "x": 145.3136879560927,
          "y": 68.15821680827558
        },
        {
          "x": 147.6374679166534,
          "y": 71.94559212756003
        },
        {
          "x": 149.03173589298981,
          "y": 74.7362897312433
        },
        {
          "x": 150.42600386932625,
          "y": 76.72964516244565
        },
        {
          "x": 151.35551585355051,
          "y": 77.52698733492659
        },
        {
          "x": 152.2850278377748,
          "y": 77.92565842116706
        },
        {
          "x": 153.21453982199907,
          "y": 78.52366505052775
        },
        {
          "x": 156.0030757746719,
          "y": 79.52034276612893
        },
        {
          "x": 164.36868363269045,
          "y": 78.723000593648
        },
        {
          "x": 166.69246359325115,
          "y": 78.12499396428728
        },
        {
          "x": 170.41051153014826,
          "y": 77.32765179180635
        },
        {
          "x": 175.05807145126965,
          "y": 76.33097407620518
        },
        {
          "x": 178.7761193881668,
          "y": 75.73296744684448
        },
        {
          "x": 182.4941673250639,
          "y": 75.13496081748377
        },
        {
          "x": 183.8884353014003,
          "y": 74.93562527436355
        },
        {
          "x": 186.67697125407315,
          "y": 74.53695418812308
        },
        {
          "x": 189.465507206746,
          "y": 74.33761864500283
        },
        {
          "x": 190.8597751830824,
          "y": 74.1382831018826
        },
        {
          "x": 193.64831113575525,
          "y": 73.34094092940167
        },
        {
          "x": 195.5073351042038,
          "y": 72.74293430004097
        },
        {
          "x": 195.97209109631595,
          "y": 72.3442632138005
        },
        {
          "x": 196.90160308054024,
          "y": 72.14492767068026
        },
        {
          "x": 196.90160308054024,
          "y": 71.34758549819932
        },
        {
          "x": 197.3663590726524,
          "y": 70.55024332571838
        },
        {
          "x": 197.3663590726524,
          "y": 70.15157223947791
        },
        {
          "x": 197.8311150647645,
          "y": 69.75290115323745
        },
        {
          "x": 198.29587105687665,
          "y": 69.35423006699698
        },
        {
          "x": 198.7606270489888,
          "y": 69.15489452387675
        },
        {
          "x": 199.6901390332131,
          "y": 68.95555898075652
        }
      ],
      "speed": -0.24,
      "speedMin": -6.06,
      "speedMax": 0.91,
      "depth": 1,
      "low": -1,
      "high": 1,
      "phase": 0,
      "logScale": 1.76,
      "enabled": true
    }
  ],
  "global": {
    "carrierType": "sawtooth",
    "frequency": 96.63300323486328,
    "volume": 0.13,
    "filter": {
      "type": "lowpass",
      "frequency": 1177.687255859375,
      "Q": 30,
      "gain": 40
    },
    "reverb": {
      "mix": 0.2800000011920929,
      "preDelay": 810,
      "decay": 0.12
    }
  }
},
 'scraper3': {
  "modules": [
    {
      "id": "0",
      "waveType": "reverse-sawtooth",
      "customPoints": [],
      "speed": 0.66,
      "speedMin": -2,
      "speedMax": 1,
      "depth": 1,
      "low": -1,
      "high": -5,
      "phase": 291,
      "logScale": 0.12,
      "enabled": true
    },
    {
      "id": "1",
      "waveType": "reverse-sawtooth",
      "customPoints": [
        {
          "x": 0.30981841710502883,
          "y": 6.364198441002971
        },
        {
          "x": 0.30981841710502883,
          "y": 6.364198441002971
        },
        {
          "x": 0.30981841710502883,
          "y": 6.364198441002971
        },
        {
          "x": 1.2393304013293087,
          "y": 6.364198441002971
        },
        {
          "x": 1.7040863934414487,
          "y": 6.364198441002971
        },
        {
          "x": 2.1688423855535888,
          "y": 6.364198441002971
        },
        {
          "x": 2.6335983776657286,
          "y": 6.364198441002971
        },
        {
          "x": 3.5631103618900086,
          "y": 6.364198441002971
        },
        {
          "x": 4.492622346114288,
          "y": 6.364198441002971
        },
        {
          "x": 4.9573783382264285,
          "y": 6.364198441002971
        },
        {
          "x": 5.886890322450708,
          "y": 6.563533984123205
        },
        {
          "x": 5.886890322450708,
          "y": 6.563533984123205
        },
        {
          "x": 6.816402306674989,
          "y": 6.962205070363674
        },
        {
          "x": 7.281158298787129,
          "y": 6.962205070363674
        },
        {
          "x": 7.281158298787129,
          "y": 7.161540613483908
        },
        {
          "x": 7.281158298787129,
          "y": 7.360876156604142
        },
        {
          "x": 7.281158298787129,
          "y": 7.759547242844611
        },
        {
          "x": 7.281158298787129,
          "y": 8.556889415325548
        },
        {
          "x": 7.281158298787129,
          "y": 8.955560501566016
        },
        {
          "x": 6.816402306674989,
          "y": 9.354231587806485
        },
        {
          "x": 6.351646314562848,
          "y": 11.148251475888593
        },
        {
          "x": 6.816402306674989,
          "y": 14.138284622692105
        },
        {
          "x": 8.210670283011408,
          "y": 16.72964668325515
        },
        {
          "x": 9.604938259347827,
          "y": 19.919015373178897
        },
        {
          "x": 10.534450243572108,
          "y": 23.108384063102644
        },
        {
          "x": 12.393474212020669,
          "y": 27.294430468627564
        },
        {
          "x": 14.252498180469228,
          "y": 30.88247024479178
        },
        {
          "x": 17.041034133142066,
          "y": 36.66320099527857
        },
        {
          "x": 17.970546117366347,
          "y": 38.058549797120214
        },
        {
          "x": 19.36481409370277,
          "y": 41.048582943923726
        },
        {
          "x": 21.223838062151327,
          "y": 44.23795163384747
        },
        {
          "x": 23.082862030599888,
          "y": 47.42732032377122
        },
        {
          "x": 24.012374014824168,
          "y": 49.022004668733096
        },
        {
          "x": 24.94188599904845,
          "y": 50.01868238433426
        },
        {
          "x": 25.406641991160587,
          "y": 51.21469564305567
        },
        {
          "x": 26.800909967497006,
          "y": 53.40738661737824
        },
        {
          "x": 27.730421951721286,
          "y": 55.00207096234012
        },
        {
          "x": 28.19517794383343,
          "y": 55.600077591700824
        },
        {
          "x": 28.659933935945567,
          "y": 56.39741976418176
        },
        {
          "x": 29.124689928057705,
          "y": 56.796090850422225
        },
        {
          "x": 29.589445920169847,
          "y": 57.99210410914363
        },
        {
          "x": 30.518957904394128,
          "y": 59.387452910985274
        },
        {
          "x": 31.44846988861841,
          "y": 60.583466169706675
        },
        {
          "x": 32.37798187284269,
          "y": 61.58014388530785
        },
        {
          "x": 33.307493857066966,
          "y": 62.377486057788786
        },
        {
          "x": 34.23700584129125,
          "y": 62.97549268714949
        },
        {
          "x": 36.096029809739804,
          "y": 63.77283485963042
        },
        {
          "x": 36.56078580185195,
          "y": 63.972170402750656
        },
        {
          "x": 37.02554179396409,
          "y": 64.37084148899113
        },
        {
          "x": 37.490297786076226,
          "y": 64.37084148899113
        },
        {
          "x": 38.88456576241265,
          "y": 64.57017703211136
        },
        {
          "x": 42.137857707197625,
          "y": 65.16818366147207
        },
        {
          "x": 43.06736969142191,
          "y": 65.3675192045923
        },
        {
          "x": 44.92639365987046,
          "y": 65.76619029083277
        },
        {
          "x": 48.17968560465545,
          "y": 66.5635324633137
        },
        {
          "x": 52.36248953366471,
          "y": 67.56021017891487
        },
        {
          "x": 59.333829415346806,
          "y": 68.95555898075652
        },
        {
          "x": 65.84041330491677,
          "y": 69.95223669635769
        },
        {
          "x": 74.20602116293529,
          "y": 71.34758549819932
        },
        {
          "x": 77.92406909983241,
          "y": 71.94559212756003
        },
        {
          "x": 83.03638501306594,
          "y": 72.74293430004097
        },
        {
          "x": 91.8667488631966,
          "y": 74.33761864500283
        },
        {
          "x": 101.1618687054394,
          "y": 75.33429636060401
        },
        {
          "x": 103.4856486660001,
          "y": 75.53363190372424
        },
        {
          "x": 107.66845259500936,
          "y": 75.33429636060401
        },
        {
          "x": 108.59796457923365,
          "y": 74.33761864500283
        },
        {
          "x": 109.52747656345792,
          "y": 72.9422698431612
        },
        {
          "x": 110.4569885476822,
          "y": 70.94891441195885
        },
        {
          "x": 110.92174453979435,
          "y": 69.75290115323745
        },
        {
          "x": 111.38650053190648,
          "y": 68.15821680827558
        },
        {
          "x": 112.31601251613075,
          "y": 64.7695125752316
        },
        {
          "x": 112.7807685082429,
          "y": 61.38080834218761
        },
        {
          "x": 113.71028049246718,
          "y": 57.194761936662694
        },
        {
          "x": 114.63979247669147,
          "y": 51.812702272416374
        },
        {
          "x": 115.56930446091575,
          "y": 47.42732032377122
        },
        {
          "x": 116.96357243725217,
          "y": 44.23795163384747
        },
        {
          "x": 118.35784041358858,
          "y": 40.64991185768326
        },
        {
          "x": 119.28735239781287,
          "y": 38.058549797120214
        },
        {
          "x": 120.21686438203714,
          "y": 37.06187208151904
        },
        {
          "x": 122.0758883504857,
          "y": 37.06187208151904
        },
        {
          "x": 124.86442430315854,
          "y": 38.855891969601146
        },
        {
          "x": 130.44149620850422,
          "y": 46.43064260817005
        },
        {
          "x": 137.87759208229846,
          "y": 56.39741976418176
        },
        {
          "x": 141.59564001919557,
          "y": 62.17815051466855
        },
        {
          "x": 145.3136879560927,
          "y": 68.15821680827558
        },
        {
          "x": 147.6374679166534,
          "y": 71.94559212756003
        },
        {
          "x": 149.03173589298981,
          "y": 74.7362897312433
        },
        {
          "x": 150.42600386932625,
          "y": 76.72964516244565
        },
        {
          "x": 151.35551585355051,
          "y": 77.52698733492659
        },
        {
          "x": 152.2850278377748,
          "y": 77.92565842116706
        },
        {
          "x": 153.21453982199907,
          "y": 78.52366505052775
        },
        {
          "x": 156.0030757746719,
          "y": 79.52034276612893
        },
        {
          "x": 164.36868363269045,
          "y": 78.723000593648
        },
        {
          "x": 166.69246359325115,
          "y": 78.12499396428728
        },
        {
          "x": 170.41051153014826,
          "y": 77.32765179180635
        },
        {
          "x": 175.05807145126965,
          "y": 76.33097407620518
        },
        {
          "x": 178.7761193881668,
          "y": 75.73296744684448
        },
        {
          "x": 182.4941673250639,
          "y": 75.13496081748377
        },
        {
          "x": 183.8884353014003,
          "y": 74.93562527436355
        },
        {
          "x": 186.67697125407315,
          "y": 74.53695418812308
        },
        {
          "x": 189.465507206746,
          "y": 74.33761864500283
        },
        {
          "x": 190.8597751830824,
          "y": 74.1382831018826
        },
        {
          "x": 193.64831113575525,
          "y": 73.34094092940167
        },
        {
          "x": 195.5073351042038,
          "y": 72.74293430004097
        },
        {
          "x": 195.97209109631595,
          "y": 72.3442632138005
        },
        {
          "x": 196.90160308054024,
          "y": 72.14492767068026
        },
        {
          "x": 196.90160308054024,
          "y": 71.34758549819932
        },
        {
          "x": 197.3663590726524,
          "y": 70.55024332571838
        },
        {
          "x": 197.3663590726524,
          "y": 70.15157223947791
        },
        {
          "x": 197.8311150647645,
          "y": 69.75290115323745
        },
        {
          "x": 198.29587105687665,
          "y": 69.35423006699698
        },
        {
          "x": 198.7606270489888,
          "y": 69.15489452387675
        },
        {
          "x": 199.6901390332131,
          "y": 68.95555898075652
        }
      ],
      "speed": 0.66,
      "speedMin": -2,
      "speedMax": 1,
      "depth": 0.91,
      "low": -1,
      "high": 1,
      "phase": 0,
      "logScale": 0.1,
      "enabled": true
    }
  ],
  "global": {
    "carrierType": "sawtooth",
    "frequency": 15.607000350952148,
    "volume": 1.0,
    "filter": {
      "type": "lowpass",
      "frequency": 833.73876953125,
      "Q": 26.50040054321289,
      "gain": -40
    },
    "reverb": {
      "mix": 0.28999999165534973,
      "preDelay": 20,
      "decay": 0.5
    }
  }
},
 'scraper4': {
  "modules": [
    {
      "id": "0",
      "waveType": "square",
      "customPoints": [],
      "speed": -0.13,
      "speedMin": -7,
      "speedMax": 1,
      "depth": 1,
      "low": -1,
      "high": 20,
      "phase": 0,
      "logScale": 2,
      "enabled": true
    },
    {
      "id": "1",
      "waveType": "square",
      "customPoints": [],
      "speed": 0.78,
      "speedMin": -6.06,
      "speedMax": 1.91,
      "depth": 1,
      "low": -1,
      "high": 1,
      "phase": 0,
      "logScale": 1.76,
      "enabled": true
    }
  ],
  "global": {
    "carrierType": "square",
    "frequency": 40,
    "volume": 0,
    "filter": {
      "type": "bandpass",
      "frequency": 3319.173828125,
      "Q": 27.02400016784668,
      "gain": 16.5
    },
    "reverb": {
      "mix": 0.3700000047683716,
      "preDelay": 20,
      "decay": 0.5
    }
  }
},
        'chirper': {
            modules: [
                {
                    id: "0",
                    waveType: "triangle",
                    customPoints: [],
                    speed: 1,
                    speedMin: -7,
                    speedMax: 1,
                    depth: 1,
                    low: -1,
                    high: 570,
                    phase: 0,
                    logScale: 2,
                    enabled: true
                },
                {
                    id: "1",
                    waveType: "reverse-triangle",
                    customPoints: [],
                    speed: 0.98,
                    speedMin: -6.06,
                    speedMax: 1.91,
                    depth: 1,
                    low: -1,
                    high: 1,
                    phase: 0,
                    logScale: 1.76,
                    enabled: true
                }
            ],
            global: {
                carrierType: 'square',
                frequency: 20,
                volume: 0.83,
                filter: {
                    type: 'bandpass',
                    frequency: 6180.6,
                    Q: 18.3043,
                    gain: 0
                },
                reverb: {
                    mix: 0.5,
                    preDelay: 20,
                    decay: 0.5
                }
            }
        },
 'chirper1': {
  "modules": [
    {
      "id": "0",
      "waveType": "square",
      "customPoints": [],
      "speed": 0.79,
      "speedMin": -7,
      "speedMax": 1.97,
      "depth": 1,
      "low": -1,
      "high": 5,
      "phase": 0,
      "logScale": 2,
      "enabled": true
    },
    {
      "id": "1",
      "waveType": "reverse-triangle",
      "customPoints": [],
      "speed": 0.86,
      "speedMin": -6.06,
      "speedMax": 1.91,
      "depth": 1,
      "low": -1,
      "high": 1,
      "phase": 0,
      "logScale": 1.76,
      "enabled": true
    }
  ],
  "global": {
    "carrierType": "square",
    "frequency": 27,
    "volume": 0.14579999446868896,
    "filter": {
      "type": "highpass",
      "frequency": 3319.173828125,
      "Q": 30,
      "gain": -8.199999809265137
    },
    "reverb": {
      "mix": 0.4699999988079071,
      "preDelay": 1000,
      "decay": 0.42
    }
  }
},
 'chirper2': {
  "modules": [
    {
      "id": "0",
      "waveType": "custom",
      "customPoints": [
        {
          "x": 234.5,
          "y": 40.421875
        },
        {
          "x": 234.5,
          "y": 40.421875
        },
        {
          "x": 234.5,
          "y": 40.421875
        },
        {
          "x": 234.5,
          "y": 42.421875
        },
        {
          "x": 234.5,
          "y": 57.421875
        },
        {
          "x": 235.5,
          "y": 99.421875
        },
        {
          "x": 236.5,
          "y": 109.421875
        },
        {
          "x": 238.5,
          "y": 118.421875
        },
        {
          "x": 239.5,
          "y": 124.421875
        },
        {
          "x": 241.5,
          "y": 128.421875
        },
        {
          "x": 242.5,
          "y": 133.421875
        },
        {
          "x": 245.5,
          "y": 140.421875
        },
        {
          "x": 249.5,
          "y": 148.421875
        },
        {
          "x": 254.5,
          "y": 155.421875
        },
        {
          "x": 258.5,
          "y": 160.421875
        },
        {
          "x": 265.5,
          "y": 169.421875
        },
        {
          "x": 271.5,
          "y": 177.421875
        },
        {
          "x": 275.5,
          "y": 181.421875
        },
        {
          "x": 276.5,
          "y": 182.421875
        },
        {
          "x": 277.5,
          "y": 181.421875
        }
      ],
      "speed": -0.3,
      "speedMin": -7,
      "speedMax": 1.33,
      "depth": 0.5,
      "low": 5000,
      "high": 95,
      "phase": 0,
      "logScale": 1,
      "enabled": true
    },
    {
      "id": "1",
      "waveType": "reverse-sawtooth",
      "customPoints": [],
      "speed": -0.57,
      "speedMin": -7,
      "speedMax": 1,
      "depth": 1,
      "low": -1,
      "high": 1,
      "phase": 90,
      "logScale": 1,
      "enabled": true
    }
  ],
  "global": {
    "carrierType": "sine",
    "frequency": 6427.05517578125,
    "volume": 0.2283799946308136,
    "filter": {
      "type": "lowpass",
      "frequency": 2517.850830078125,
      "Q": 5.259500026702881,
      "gain": 0
    },
    "reverb": {
      "mix": 0.3100000023841858,
      "preDelay": 20,
      "decay": 0.5
    }
  }
},
 'Chirper3': {
  "modules": [
    {
      "id": "0",
      "waveType": "reverse-sawtooth",
      "customPoints": [],
      "speed": -0.17,
      "speedMin": -7,
      "speedMax": 1,
      "depth": 0.5,
      "low": -1,
      "high": 242,
      "phase": 0,
      "logScale": 0.22,
      "enabled": true
    },
    {
      "id": "1",
      "waveType": "sawtooth",
      "customPoints": [],
      "speed": 1.31,
      "speedMin": -7.75,
      "speedMax": 2.86,
      "depth": 0.5,
      "low": -1,
      "high": 1,
      "phase": 0,
      "logScale": 1,
      "enabled": true
    }
  ],
  "global": {
    "carrierType": "sine",
    "frequency": 822.1339721679688,
    "volume": 0.22,
    "filter": {
      "type": "lowpass",
      "frequency": 1352.1658935546875,
      "Q": 30,
      "gain": 0
    },
    "reverb": {
      "mix": 0.27000001072883606,
      "preDelay": 20,
      "decay": 0.5
    }
  }
},

        'bubbler': {
            modules: [
                {
                    id: "0",
                    waveType: "sawtooth",
                    customPoints: [],
                    speed: -0.5,
                    speedMin: -7,
                    speedMax: 1,
                    depth: 0.5,
                    low: -1,
                    high: 242,
                    phase: 0,
                    logScale: 0.22,
                    enabled: true
                },
                {
                    id: "1",
                    waveType: "sawtooth",
                    customPoints: [],
                    speed: 2.16,
                    speedMin: -7.75,
                    speedMax: 2.86,
                    depth: 0.5,
                    low: -1,
                    high: 1,
                    phase: 0,
                    logScale: 1,
                    enabled: true
                }
            ],
            global: {
                carrierType: 'sine',
                frequency: 726,
                volume: 0.13,
                filter: {
                    type: 'lowpass',
                    frequency:  1339.6,
                    Q: 98.8674,
                    gain: 0
                },
                reverb: {
                    mix: 0.27,
                    preDelay: 20,
                    decay: 0.5
                }
            }
        },
 'bubbler2': {
  "modules": [
    {
      "id": "0",
      "waveType": "custom",
      "customPoints": [
        {
          "x": 326.5,
          "y": 78.421875
        },
        {
          "x": 326.5,
          "y": 78.421875
        },
        {
          "x": 325.5,
          "y": 78.421875
        },
        {
          "x": 323.5,
          "y": 77.421875
        },
        {
          "x": 320.5,
          "y": 75.421875
        },
        {
          "x": 316.5,
          "y": 74.421875
        },
        {
          "x": 314.5,
          "y": 72.421875
        },
        {
          "x": 313.5,
          "y": 72.421875
        },
        {
          "x": 312.5,
          "y": 72.421875
        },
        {
          "x": 312.5,
          "y": 72.421875
        },
        {
          "x": 311.5,
          "y": 74.421875
        },
        {
          "x": 311.5,
          "y": 75.421875
        },
        {
          "x": 310.5,
          "y": 76.421875
        },
        {
          "x": 309.5,
          "y": 78.421875
        },
        {
          "x": 308.5,
          "y": 79.421875
        },
        {
          "x": 306.5,
          "y": 82.421875
        },
        {
          "x": 305.5,
          "y": 83.421875
        },
        {
          "x": 303.5,
          "y": 84.421875
        },
        {
          "x": 302.5,
          "y": 84.421875
        },
        {
          "x": 302.5,
          "y": 84.421875
        },
        {
          "x": 299.5,
          "y": 84.421875
        },
        {
          "x": 298.5,
          "y": 83.421875
        },
        {
          "x": 296.5,
          "y": 82.421875
        },
        {
          "x": 292.5,
          "y": 79.421875
        },
        {
          "x": 291.5,
          "y": 77.421875
        },
        {
          "x": 286.5,
          "y": 73.421875
        },
        {
          "x": 283.5,
          "y": 70.421875
        },
        {
          "x": 280.5,
          "y": 68.421875
        },
        {
          "x": 278.5,
          "y": 67.421875
        },
        {
          "x": 278.5,
          "y": 67.421875
        },
        {
          "x": 277.5,
          "y": 67.421875
        },
        {
          "x": 277.5,
          "y": 68.421875
        },
        {
          "x": 277.5,
          "y": 68.421875
        },
        {
          "x": 277.5,
          "y": 71.421875
        },
        {
          "x": 277.5,
          "y": 73.421875
        },
        {
          "x": 277.5,
          "y": 75.421875
        },
        {
          "x": 275.5,
          "y": 79.421875
        },
        {
          "x": 274.5,
          "y": 81.421875
        },
        {
          "x": 273.5,
          "y": 84.421875
        },
        {
          "x": 271.5,
          "y": 87.421875
        },
        {
          "x": 271.5,
          "y": 87.421875
        },
        {
          "x": 271.5,
          "y": 88.421875
        },
        {
          "x": 271.5,
          "y": 88.421875
        },
        {
          "x": 271.5,
          "y": 88.421875
        },
        {
          "x": 270.5,
          "y": 86.421875
        },
        {
          "x": 269.5,
          "y": 85.421875
        },
        {
          "x": 267.5,
          "y": 83.421875
        },
        {
          "x": 262.5,
          "y": 80.421875
        },
        {
          "x": 258.5,
          "y": 77.421875
        },
        {
          "x": 251.5,
          "y": 72.421875
        },
        {
          "x": 245.5,
          "y": 67.421875
        },
        {
          "x": 241.5,
          "y": 65.421875
        },
        {
          "x": 239.5,
          "y": 64.421875
        },
        {
          "x": 238.5,
          "y": 63.421875
        },
        {
          "x": 238.5,
          "y": 63.421875
        },
        {
          "x": 238.5,
          "y": 64.421875
        },
        {
          "x": 238.5,
          "y": 65.421875
        },
        {
          "x": 237.5,
          "y": 66.421875
        },
        {
          "x": 237.5,
          "y": 67.421875
        },
        {
          "x": 235.5,
          "y": 69.421875
        },
        {
          "x": 235.5,
          "y": 70.421875
        },
        {
          "x": 234.5,
          "y": 72.421875
        },
        {
          "x": 233.5,
          "y": 74.421875
        },
        {
          "x": 232.5,
          "y": 76.421875
        },
        {
          "x": 232.5,
          "y": 79.421875
        },
        {
          "x": 232.5,
          "y": 82.421875
        },
        {
          "x": 232.5,
          "y": 83.421875
        },
        {
          "x": 232.5,
          "y": 85.421875
        },
        {
          "x": 232.5,
          "y": 89.421875
        },
        {
          "x": 232.5,
          "y": 91.421875
        },
        {
          "x": 232.5,
          "y": 96.421875
        },
        {
          "x": 232.5,
          "y": 100.421875
        },
        {
          "x": 233.5,
          "y": 103.421875
        },
        {
          "x": 233.5,
          "y": 106.421875
        },
        {
          "x": 234.5,
          "y": 110.421875
        },
        {
          "x": 234.5,
          "y": 112.421875
        },
        {
          "x": 235.5,
          "y": 114.421875
        },
        {
          "x": 235.5,
          "y": 117.421875
        },
        {
          "x": 235.5,
          "y": 118.421875
        },
        {
          "x": 235.5,
          "y": 120.421875
        },
        {
          "x": 235.5,
          "y": 122.421875
        },
        {
          "x": 235.5,
          "y": 125.421875
        },
        {
          "x": 235.5,
          "y": 127.421875
        },
        {
          "x": 235.5,
          "y": 130.421875
        },
        {
          "x": 235.5,
          "y": 133.421875
        },
        {
          "x": 235.5,
          "y": 137.421875
        },
        {
          "x": 234.5,
          "y": 138.421875
        },
        {
          "x": 234.5,
          "y": 139.421875
        },
        {
          "x": 234.5,
          "y": 142.421875
        },
        {
          "x": 233.5,
          "y": 143.421875
        },
        {
          "x": 233.5,
          "y": 146.421875
        },
        {
          "x": 232.5,
          "y": 148.421875
        },
        {
          "x": 231.5,
          "y": 153.421875
        },
        {
          "x": 229.5,
          "y": 158.421875
        },
        {
          "x": 228.5,
          "y": 162.421875
        },
        {
          "x": 227.5,
          "y": 166.421875
        },
        {
          "x": 226.5,
          "y": 169.421875
        },
        {
          "x": 225.5,
          "y": 170.421875
        },
        {
          "x": 225.5,
          "y": 172.421875
        },
        {
          "x": 224.5,
          "y": 174.421875
        },
        {
          "x": 223.5,
          "y": 174.421875
        },
        {
          "x": 223.5,
          "y": 175.421875
        },
        {
          "x": 221.5,
          "y": 176.421875
        },
        {
          "x": 219.5,
          "y": 177.421875
        },
        {
          "x": 217.5,
          "y": 178.421875
        },
        {
          "x": 215.5,
          "y": 178.421875
        },
        {
          "x": 214.5,
          "y": 178.421875
        },
        {
          "x": 212.5,
          "y": 179.421875
        },
        {
          "x": 207.5,
          "y": 179.421875
        },
        {
          "x": 204.5,
          "y": 179.421875
        },
        {
          "x": 197.5,
          "y": 179.421875
        },
        {
          "x": 189.5,
          "y": 179.421875
        },
        {
          "x": 178.5,
          "y": 177.421875
        },
        {
          "x": 166.5,
          "y": 172.421875
        },
        {
          "x": 160.5,
          "y": 170.421875
        },
        {
          "x": 154.5,
          "y": 167.421875
        },
        {
          "x": 149.5,
          "y": 164.421875
        },
        {
          "x": 143.5,
          "y": 162.421875
        },
        {
          "x": 134.5,
          "y": 157.421875
        },
        {
          "x": 130.5,
          "y": 155.421875
        },
        {
          "x": 126.5,
          "y": 153.421875
        },
        {
          "x": 119.5,
          "y": 149.421875
        },
        {
          "x": 115.5,
          "y": 146.421875
        },
        {
          "x": 105.5,
          "y": 139.421875
        },
        {
          "x": 94.5,
          "y": 132.421875
        },
        {
          "x": 84.5,
          "y": 125.421875
        },
        {
          "x": 75.5,
          "y": 118.421875
        },
        {
          "x": 71.5,
          "y": 115.421875
        },
        {
          "x": 67.5,
          "y": 112.421875
        },
        {
          "x": 63.5,
          "y": 108.421875
        },
        {
          "x": 59.5,
          "y": 105.421875
        },
        {
          "x": 54.5,
          "y": 101.421875
        },
        {
          "x": 52.5,
          "y": 99.421875
        },
        {
          "x": 50.5,
          "y": 97.421875
        },
        {
          "x": 47.5,
          "y": 94.421875
        },
        {
          "x": 45.5,
          "y": 93.421875
        },
        {
          "x": 41.5,
          "y": 89.421875
        },
        {
          "x": 35.5,
          "y": 85.421875
        },
        {
          "x": 29.5,
          "y": 81.421875
        },
        {
          "x": 25.5,
          "y": 78.421875
        },
        {
          "x": 21.5,
          "y": 74.421875
        },
        {
          "x": 19.5,
          "y": 73.421875
        },
        {
          "x": 17.5,
          "y": 71.421875
        },
        {
          "x": 14.5,
          "y": 69.421875
        },
        {
          "x": 12.5,
          "y": 68.421875
        },
        {
          "x": 8.5,
          "y": 65.421875
        },
        {
          "x": 2.5,
          "y": 61.421875
        }
      ],
      "speed": 0.06,
      "speedMin": -7,
      "speedMax": 1,
      "depth": 1,
      "low": 800,
      "high": 200,
      "phase": 166,
      "logScale": 0.21,
      "enabled": true
    },
    {
      "id": "1",
      "waveType": "square",
      "customPoints": [],
      "speed": 0.97,
      "speedMin": -6.06,
      "speedMax": 1.91,
      "depth": 0.34,
      "low": -1,
      "high": 1,
      "phase": 0,
      "logScale": 1.76,
      "enabled": true
    }
  ],
  "global": {
    "carrierType": "sawtooth",
    "frequency": 1871.362060546875,
    "volume": 0.18019999563694,
    "filter": {
      "type": "lowpass",
      "frequency": 1352.1658935546875,
      "Q": 21.174800872802734,
      "gain": 0
    },
    "reverb": {
      "mix": 0.41999998688697815,
      "preDelay": 300,
      "decay": 0.5
    }
  }
},
 'bubbler2': {
  "modules": [
    {
      "id": "0",
      "waveType": "reverse-sawtooth",
      "customPoints": [],
      "speed": 0.42,
      "speedMin": -2,
      "speedMax": 0.72,
      "depth": 1,
      "low": -21,
      "high": 116,
      "phase": 278,
      "logScale": 1.25,
      "enabled": true
    },
    {
      "id": "1",
      "waveType": "triangle",
      "customPoints": [
        {
          "x": 0.30981841710502883,
          "y": 6.364198441002971
        },
        {
          "x": 0.30981841710502883,
          "y": 6.364198441002971
        },
        {
          "x": 0.30981841710502883,
          "y": 6.364198441002971
        },
        {
          "x": 1.2393304013293087,
          "y": 6.364198441002971
        },
        {
          "x": 1.7040863934414487,
          "y": 6.364198441002971
        },
        {
          "x": 2.1688423855535888,
          "y": 6.364198441002971
        },
        {
          "x": 2.6335983776657286,
          "y": 6.364198441002971
        },
        {
          "x": 3.5631103618900086,
          "y": 6.364198441002971
        },
        {
          "x": 4.492622346114288,
          "y": 6.364198441002971
        },
        {
          "x": 4.9573783382264285,
          "y": 6.364198441002971
        },
        {
          "x": 5.886890322450708,
          "y": 6.563533984123205
        },
        {
          "x": 5.886890322450708,
          "y": 6.563533984123205
        },
        {
          "x": 6.816402306674989,
          "y": 6.962205070363674
        },
        {
          "x": 7.281158298787129,
          "y": 6.962205070363674
        },
        {
          "x": 7.281158298787129,
          "y": 7.161540613483908
        },
        {
          "x": 7.281158298787129,
          "y": 7.360876156604142
        },
        {
          "x": 7.281158298787129,
          "y": 7.759547242844611
        },
        {
          "x": 7.281158298787129,
          "y": 8.556889415325548
        },
        {
          "x": 7.281158298787129,
          "y": 8.955560501566016
        },
        {
          "x": 6.816402306674989,
          "y": 9.354231587806485
        },
        {
          "x": 6.351646314562848,
          "y": 11.148251475888593
        },
        {
          "x": 6.816402306674989,
          "y": 14.138284622692105
        },
        {
          "x": 8.210670283011408,
          "y": 16.72964668325515
        },
        {
          "x": 9.604938259347827,
          "y": 19.919015373178897
        },
        {
          "x": 10.534450243572108,
          "y": 23.108384063102644
        },
        {
          "x": 12.393474212020669,
          "y": 27.294430468627564
        },
        {
          "x": 14.252498180469228,
          "y": 30.88247024479178
        },
        {
          "x": 17.041034133142066,
          "y": 36.66320099527857
        },
        {
          "x": 17.970546117366347,
          "y": 38.058549797120214
        },
        {
          "x": 19.36481409370277,
          "y": 41.048582943923726
        },
        {
          "x": 21.223838062151327,
          "y": 44.23795163384747
        },
        {
          "x": 23.082862030599888,
          "y": 47.42732032377122
        },
        {
          "x": 24.012374014824168,
          "y": 49.022004668733096
        },
        {
          "x": 24.94188599904845,
          "y": 50.01868238433426
        },
        {
          "x": 25.406641991160587,
          "y": 51.21469564305567
        },
        {
          "x": 26.800909967497006,
          "y": 53.40738661737824
        },
        {
          "x": 27.730421951721286,
          "y": 55.00207096234012
        },
        {
          "x": 28.19517794383343,
          "y": 55.600077591700824
        },
        {
          "x": 28.659933935945567,
          "y": 56.39741976418176
        },
        {
          "x": 29.124689928057705,
          "y": 56.796090850422225
        },
        {
          "x": 29.589445920169847,
          "y": 57.99210410914363
        },
        {
          "x": 30.518957904394128,
          "y": 59.387452910985274
        },
        {
          "x": 31.44846988861841,
          "y": 60.583466169706675
        },
        {
          "x": 32.37798187284269,
          "y": 61.58014388530785
        },
        {
          "x": 33.307493857066966,
          "y": 62.377486057788786
        },
        {
          "x": 34.23700584129125,
          "y": 62.97549268714949
        },
        {
          "x": 36.096029809739804,
          "y": 63.77283485963042
        },
        {
          "x": 36.56078580185195,
          "y": 63.972170402750656
        },
        {
          "x": 37.02554179396409,
          "y": 64.37084148899113
        },
        {
          "x": 37.490297786076226,
          "y": 64.37084148899113
        },
        {
          "x": 38.88456576241265,
          "y": 64.57017703211136
        },
        {
          "x": 42.137857707197625,
          "y": 65.16818366147207
        },
        {
          "x": 43.06736969142191,
          "y": 65.3675192045923
        },
        {
          "x": 44.92639365987046,
          "y": 65.76619029083277
        },
        {
          "x": 48.17968560465545,
          "y": 66.5635324633137
        },
        {
          "x": 52.36248953366471,
          "y": 67.56021017891487
        },
        {
          "x": 59.333829415346806,
          "y": 68.95555898075652
        },
        {
          "x": 65.84041330491677,
          "y": 69.95223669635769
        },
        {
          "x": 74.20602116293529,
          "y": 71.34758549819932
        },
        {
          "x": 77.92406909983241,
          "y": 71.94559212756003
        },
        {
          "x": 83.03638501306594,
          "y": 72.74293430004097
        },
        {
          "x": 91.8667488631966,
          "y": 74.33761864500283
        },
        {
          "x": 101.1618687054394,
          "y": 75.33429636060401
        },
        {
          "x": 103.4856486660001,
          "y": 75.53363190372424
        },
        {
          "x": 107.66845259500936,
          "y": 75.33429636060401
        },
        {
          "x": 108.59796457923365,
          "y": 74.33761864500283
        },
        {
          "x": 109.52747656345792,
          "y": 72.9422698431612
        },
        {
          "x": 110.4569885476822,
          "y": 70.94891441195885
        },
        {
          "x": 110.92174453979435,
          "y": 69.75290115323745
        },
        {
          "x": 111.38650053190648,
          "y": 68.15821680827558
        },
        {
          "x": 112.31601251613075,
          "y": 64.7695125752316
        },
        {
          "x": 112.7807685082429,
          "y": 61.38080834218761
        },
        {
          "x": 113.71028049246718,
          "y": 57.194761936662694
        },
        {
          "x": 114.63979247669147,
          "y": 51.812702272416374
        },
        {
          "x": 115.56930446091575,
          "y": 47.42732032377122
        },
        {
          "x": 116.96357243725217,
          "y": 44.23795163384747
        },
        {
          "x": 118.35784041358858,
          "y": 40.64991185768326
        },
        {
          "x": 119.28735239781287,
          "y": 38.058549797120214
        },
        {
          "x": 120.21686438203714,
          "y": 37.06187208151904
        },
        {
          "x": 122.0758883504857,
          "y": 37.06187208151904
        },
        {
          "x": 124.86442430315854,
          "y": 38.855891969601146
        },
        {
          "x": 130.44149620850422,
          "y": 46.43064260817005
        },
        {
          "x": 137.87759208229846,
          "y": 56.39741976418176
        },
        {
          "x": 141.59564001919557,
          "y": 62.17815051466855
        },
        {
          "x": 145.3136879560927,
          "y": 68.15821680827558
        },
        {
          "x": 147.6374679166534,
          "y": 71.94559212756003
        },
        {
          "x": 149.03173589298981,
          "y": 74.7362897312433
        },
        {
          "x": 150.42600386932625,
          "y": 76.72964516244565
        },
        {
          "x": 151.35551585355051,
          "y": 77.52698733492659
        },
        {
          "x": 152.2850278377748,
          "y": 77.92565842116706
        },
        {
          "x": 153.21453982199907,
          "y": 78.52366505052775
        },
        {
          "x": 156.0030757746719,
          "y": 79.52034276612893
        },
        {
          "x": 164.36868363269045,
          "y": 78.723000593648
        },
        {
          "x": 166.69246359325115,
          "y": 78.12499396428728
        },
        {
          "x": 170.41051153014826,
          "y": 77.32765179180635
        },
        {
          "x": 175.05807145126965,
          "y": 76.33097407620518
        },
        {
          "x": 178.7761193881668,
          "y": 75.73296744684448
        },
        {
          "x": 182.4941673250639,
          "y": 75.13496081748377
        },
        {
          "x": 183.8884353014003,
          "y": 74.93562527436355
        },
        {
          "x": 186.67697125407315,
          "y": 74.53695418812308
        },
        {
          "x": 189.465507206746,
          "y": 74.33761864500283
        },
        {
          "x": 190.8597751830824,
          "y": 74.1382831018826
        },
        {
          "x": 193.64831113575525,
          "y": 73.34094092940167
        },
        {
          "x": 195.5073351042038,
          "y": 72.74293430004097
        },
        {
          "x": 195.97209109631595,
          "y": 72.3442632138005
        },
        {
          "x": 196.90160308054024,
          "y": 72.14492767068026
        },
        {
          "x": 196.90160308054024,
          "y": 71.34758549819932
        },
        {
          "x": 197.3663590726524,
          "y": 70.55024332571838
        },
        {
          "x": 197.3663590726524,
          "y": 70.15157223947791
        },
        {
          "x": 197.8311150647645,
          "y": 69.75290115323745
        },
        {
          "x": 198.29587105687665,
          "y": 69.35423006699698
        },
        {
          "x": 198.7606270489888,
          "y": 69.15489452387675
        },
        {
          "x": 199.6901390332131,
          "y": 68.95555898075652
        }
      ],
      "speed": 0.59,
      "speedMin": -6.06,
      "speedMax": 1.4,
      "depth": 1,
      "low": -1,
      "high": 1,
      "phase": 0,
      "logScale": 1.76,
      "enabled": true
    }
  ],
  "global": {
    "carrierType": "sawtooth",
    "frequency": 112.26499938964844,
    "volume": 0,
    "filter": {
      "type": "highpass",
      "frequency": 833.73876953125,
      "Q": 15.362700462341309,
      "gain": 40
    },
    "reverb": {
      "mix": 0.12999999523162842,
      "preDelay": 810,
      "decay": 0.78
    }
  }
},

 'bubbler3': {
  "modules": [
    {
      "id": "0",
      "waveType": "sine",
      "customPoints": [],
      "speed": 0.42,
      "speedMin": -2,
      "speedMax": 0.72,
      "depth": 1,
      "low": -21,
      "high": 116,
      "phase": 278,
      "logScale": 1.25,
      "enabled": true
    },
    {
      "id": "1",
      "waveType": "sine",
      "customPoints": [
        {
          "x": 0.30981841710502883,
          "y": 6.364198441002971
        },
        {
          "x": 0.30981841710502883,
          "y": 6.364198441002971
        },
        {
          "x": 0.30981841710502883,
          "y": 6.364198441002971
        },
        {
          "x": 1.2393304013293087,
          "y": 6.364198441002971
        },
        {
          "x": 1.7040863934414487,
          "y": 6.364198441002971
        },
        {
          "x": 2.1688423855535888,
          "y": 6.364198441002971
        },
        {
          "x": 2.6335983776657286,
          "y": 6.364198441002971
        },
        {
          "x": 3.5631103618900086,
          "y": 6.364198441002971
        },
        {
          "x": 4.492622346114288,
          "y": 6.364198441002971
        },
        {
          "x": 4.9573783382264285,
          "y": 6.364198441002971
        },
        {
          "x": 5.886890322450708,
          "y": 6.563533984123205
        },
        {
          "x": 5.886890322450708,
          "y": 6.563533984123205
        },
        {
          "x": 6.816402306674989,
          "y": 6.962205070363674
        },
        {
          "x": 7.281158298787129,
          "y": 6.962205070363674
        },
        {
          "x": 7.281158298787129,
          "y": 7.161540613483908
        },
        {
          "x": 7.281158298787129,
          "y": 7.360876156604142
        },
        {
          "x": 7.281158298787129,
          "y": 7.759547242844611
        },
        {
          "x": 7.281158298787129,
          "y": 8.556889415325548
        },
        {
          "x": 7.281158298787129,
          "y": 8.955560501566016
        },
        {
          "x": 6.816402306674989,
          "y": 9.354231587806485
        },
        {
          "x": 6.351646314562848,
          "y": 11.148251475888593
        },
        {
          "x": 6.816402306674989,
          "y": 14.138284622692105
        },
        {
          "x": 8.210670283011408,
          "y": 16.72964668325515
        },
        {
          "x": 9.604938259347827,
          "y": 19.919015373178897
        },
        {
          "x": 10.534450243572108,
          "y": 23.108384063102644
        },
        {
          "x": 12.393474212020669,
          "y": 27.294430468627564
        },
        {
          "x": 14.252498180469228,
          "y": 30.88247024479178
        },
        {
          "x": 17.041034133142066,
          "y": 36.66320099527857
        },
        {
          "x": 17.970546117366347,
          "y": 38.058549797120214
        },
        {
          "x": 19.36481409370277,
          "y": 41.048582943923726
        },
        {
          "x": 21.223838062151327,
          "y": 44.23795163384747
        },
        {
          "x": 23.082862030599888,
          "y": 47.42732032377122
        },
        {
          "x": 24.012374014824168,
          "y": 49.022004668733096
        },
        {
          "x": 24.94188599904845,
          "y": 50.01868238433426
        },
        {
          "x": 25.406641991160587,
          "y": 51.21469564305567
        },
        {
          "x": 26.800909967497006,
          "y": 53.40738661737824
        },
        {
          "x": 27.730421951721286,
          "y": 55.00207096234012
        },
        {
          "x": 28.19517794383343,
          "y": 55.600077591700824
        },
        {
          "x": 28.659933935945567,
          "y": 56.39741976418176
        },
        {
          "x": 29.124689928057705,
          "y": 56.796090850422225
        },
        {
          "x": 29.589445920169847,
          "y": 57.99210410914363
        },
        {
          "x": 30.518957904394128,
          "y": 59.387452910985274
        },
        {
          "x": 31.44846988861841,
          "y": 60.583466169706675
        },
        {
          "x": 32.37798187284269,
          "y": 61.58014388530785
        },
        {
          "x": 33.307493857066966,
          "y": 62.377486057788786
        },
        {
          "x": 34.23700584129125,
          "y": 62.97549268714949
        },
        {
          "x": 36.096029809739804,
          "y": 63.77283485963042
        },
        {
          "x": 36.56078580185195,
          "y": 63.972170402750656
        },
        {
          "x": 37.02554179396409,
          "y": 64.37084148899113
        },
        {
          "x": 37.490297786076226,
          "y": 64.37084148899113
        },
        {
          "x": 38.88456576241265,
          "y": 64.57017703211136
        },
        {
          "x": 42.137857707197625,
          "y": 65.16818366147207
        },
        {
          "x": 43.06736969142191,
          "y": 65.3675192045923
        },
        {
          "x": 44.92639365987046,
          "y": 65.76619029083277
        },
        {
          "x": 48.17968560465545,
          "y": 66.5635324633137
        },
        {
          "x": 52.36248953366471,
          "y": 67.56021017891487
        },
        {
          "x": 59.333829415346806,
          "y": 68.95555898075652
        },
        {
          "x": 65.84041330491677,
          "y": 69.95223669635769
        },
        {
          "x": 74.20602116293529,
          "y": 71.34758549819932
        },
        {
          "x": 77.92406909983241,
          "y": 71.94559212756003
        },
        {
          "x": 83.03638501306594,
          "y": 72.74293430004097
        },
        {
          "x": 91.8667488631966,
          "y": 74.33761864500283
        },
        {
          "x": 101.1618687054394,
          "y": 75.33429636060401
        },
        {
          "x": 103.4856486660001,
          "y": 75.53363190372424
        },
        {
          "x": 107.66845259500936,
          "y": 75.33429636060401
        },
        {
          "x": 108.59796457923365,
          "y": 74.33761864500283
        },
        {
          "x": 109.52747656345792,
          "y": 72.9422698431612
        },
        {
          "x": 110.4569885476822,
          "y": 70.94891441195885
        },
        {
          "x": 110.92174453979435,
          "y": 69.75290115323745
        },
        {
          "x": 111.38650053190648,
          "y": 68.15821680827558
        },
        {
          "x": 112.31601251613075,
          "y": 64.7695125752316
        },
        {
          "x": 112.7807685082429,
          "y": 61.38080834218761
        },
        {
          "x": 113.71028049246718,
          "y": 57.194761936662694
        },
        {
          "x": 114.63979247669147,
          "y": 51.812702272416374
        },
        {
          "x": 115.56930446091575,
          "y": 47.42732032377122
        },
        {
          "x": 116.96357243725217,
          "y": 44.23795163384747
        },
        {
          "x": 118.35784041358858,
          "y": 40.64991185768326
        },
        {
          "x": 119.28735239781287,
          "y": 38.058549797120214
        },
        {
          "x": 120.21686438203714,
          "y": 37.06187208151904
        },
        {
          "x": 122.0758883504857,
          "y": 37.06187208151904
        },
        {
          "x": 124.86442430315854,
          "y": 38.855891969601146
        },
        {
          "x": 130.44149620850422,
          "y": 46.43064260817005
        },
        {
          "x": 137.87759208229846,
          "y": 56.39741976418176
        },
        {
          "x": 141.59564001919557,
          "y": 62.17815051466855
        },
        {
          "x": 145.3136879560927,
          "y": 68.15821680827558
        },
        {
          "x": 147.6374679166534,
          "y": 71.94559212756003
        },
        {
          "x": 149.03173589298981,
          "y": 74.7362897312433
        },
        {
          "x": 150.42600386932625,
          "y": 76.72964516244565
        },
        {
          "x": 151.35551585355051,
          "y": 77.52698733492659
        },
        {
          "x": 152.2850278377748,
          "y": 77.92565842116706
        },
        {
          "x": 153.21453982199907,
          "y": 78.52366505052775
        },
        {
          "x": 156.0030757746719,
          "y": 79.52034276612893
        },
        {
          "x": 164.36868363269045,
          "y": 78.723000593648
        },
        {
          "x": 166.69246359325115,
          "y": 78.12499396428728
        },
        {
          "x": 170.41051153014826,
          "y": 77.32765179180635
        },
        {
          "x": 175.05807145126965,
          "y": 76.33097407620518
        },
        {
          "x": 178.7761193881668,
          "y": 75.73296744684448
        },
        {
          "x": 182.4941673250639,
          "y": 75.13496081748377
        },
        {
          "x": 183.8884353014003,
          "y": 74.93562527436355
        },
        {
          "x": 186.67697125407315,
          "y": 74.53695418812308
        },
        {
          "x": 189.465507206746,
          "y": 74.33761864500283
        },
        {
          "x": 190.8597751830824,
          "y": 74.1382831018826
        },
        {
          "x": 193.64831113575525,
          "y": 73.34094092940167
        },
        {
          "x": 195.5073351042038,
          "y": 72.74293430004097
        },
        {
          "x": 195.97209109631595,
          "y": 72.3442632138005
        },
        {
          "x": 196.90160308054024,
          "y": 72.14492767068026
        },
        {
          "x": 196.90160308054024,
          "y": 71.34758549819932
        },
        {
          "x": 197.3663590726524,
          "y": 70.55024332571838
        },
        {
          "x": 197.3663590726524,
          "y": 70.15157223947791
        },
        {
          "x": 197.8311150647645,
          "y": 69.75290115323745
        },
        {
          "x": 198.29587105687665,
          "y": 69.35423006699698
        },
        {
          "x": 198.7606270489888,
          "y": 69.15489452387675
        },
        {
          "x": 199.6901390332131,
          "y": 68.95555898075652
        }
      ],
      "speed": 0.58,
      "speedMin": -6.06,
      "speedMax": 1.4,
      "depth": 1,
      "low": -1,
      "high": 1,
      "phase": 0,
      "logScale": 1.76,
      "enabled": true
    }
  ],
  "global": {
    "carrierType": "sawtooth",
    "frequency": 927.6710205078125,
    "volume": 0,
    "filter": {
      "type": "lowpass",
      "frequency": 1025.7227783203125,
      "Q": 21.2406005859375,
      "gain": 40
    },
    "reverb": {
      "mix": 0.3499999940395355,
      "preDelay": 810,
      "decay": 0.78
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

            // Start oscillator
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
    
    // Set master volume to 0 by default
    if (masterVol) {
        masterVol.value = 0;
        if (masterVolDisplay) {
            masterVolDisplay.textContent = '0.00';
        }
        if (masterGain) {
            masterGain.gain.setValueAtTime(0, audioCtx ? audioCtx.currentTime : 0);
        }
    }

    // Load preset files from the presets folder
    async function loadPresetFiles() {
        try {
            // First add built-in presets
            Object.keys(defaultPresets).forEach(presetName => {
                const option = document.createElement('option');
                option.value = presetName;
                option.textContent = presetName;
                presetSelector.appendChild(option);
            });

            // Then try to load file-based presets
            try {
                const response = await fetch('presets/');
                if (response.ok) {
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
                }
            } catch (error) {
                console.log('No file-based presets found, using built-in presets only');
            }
        } catch (error) {
            console.error('Error loading presets:', error);
        }
    }

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

            // Apply filter settings from global settings
            if (globalSettings.filter) {
                effectElems.effectFilterType.value = globalSettings.filter.type || 'lowpass';
                // Convert frequency to slider value (0-100)
                const freq = globalSettings.filter.frequency || 1000;
                const logMin = Math.log10(20), logMax = Math.log10(20000);
                const freqSliderValue = ((Math.log10(freq) - logMin) / (logMax - logMin)) * 100;
                effectElems.effectFilterFrequency.value = freqSliderValue;
                effectElems.effectFilterQ.value = globalSettings.filter.Q || 1;
                effectElems.effectFilterGain.value = globalSettings.filter.gain || 0;
            }

            // Apply reverb settings from global settings
            if (globalSettings.reverb) {
                effectElems.effectReverbMix.value = globalSettings.reverb.mix || 0.5;
                effectElems.effectReverbPreDelay.value = globalSettings.reverb.preDelay || 20;
                effectElems.effectReverbDecay.value = globalSettings.reverb.decay || 0.5;
            }
            
            // Trigger input events to update displays and audio params
            ['effectFilterType', 'effectFilterFrequency', 'effectFilterQ', 'effectFilterGain', 
             'effectReverbMix', 'effectReverbPreDelay', 'effectReverbDecay']
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
    loadPresetFiles();
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
                
                // Get canvas rect and scale
                const rect = p.drawCanvas.getBoundingClientRect();
                const scaleX = p.drawCanvas.width / rect.width;
                const scaleY = p.drawCanvas.height / rect.height;
                
                // Calculate correct canvas coordinates
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                
                p.drawCtx.moveTo(x, y);
                this.customPoints.push({ x, y });
            });
            p.drawCanvas.addEventListener('mousemove', e => {
                if (!drawing) return;
                
                // Get canvas rect and scale
                const rect = p.drawCanvas.getBoundingClientRect();
                const scaleX = p.drawCanvas.width / rect.width;
                const scaleY = p.drawCanvas.height / rect.height;
                
                // Calculate correct canvas coordinates
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                
                this.customPoints.push({ x, y });
                p.drawCtx.lineTo(x, y);
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

// === Background Soundtrack Logic ===
window.addEventListener('DOMContentLoaded', function() {
    const bgAudio = document.getElementById('bgAudio');
    const bgAudioVolume = document.getElementById('bgAudioVolume');
    const bgAudioVolumeDisplay = document.getElementById('bgAudioVolumeDisplay');
    if (bgAudio && bgAudioVolume && bgAudioVolumeDisplay) {
        // Set initial volume
        bgAudio.volume = parseFloat(bgAudioVolume.value);
        bgAudioVolumeDisplay.textContent = bgAudioVolume.value;

        // Try to autoplay (may be blocked by browser)
        const tryPlay = () => {
            bgAudio.play().catch(() => {
                // Wait for user gesture if autoplay is blocked
                const enableAudio = () => {
                    bgAudio.play();
                    window.removeEventListener('click', enableAudio);
                    window.removeEventListener('keydown', enableAudio);
                };
                window.addEventListener('click', enableAudio);
                window.addEventListener('keydown', enableAudio);
            });
        };
        tryPlay();

        // Volume control
        bgAudioVolume.addEventListener('input', function() {
            bgAudio.volume = parseFloat(this.value);
            bgAudioVolumeDisplay.textContent = parseFloat(this.value).toFixed(2);
        });
    }
});
