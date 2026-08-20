(() => {
  const engine = new NewbrainEngine();
  const voice = engine.voice;
  const startBtn = document.getElementById("startBtn");
  const status = document.getElementById("status");
  const presetName = document.getElementById("presetName");
  const presetList = document.getElementById("presetList");
  const presetFile = document.getElementById("presetFile");
  const STORE_KEY = "newbrain-presets";

  const UNITS = {
    freqSpeed: "ms",
    volSpeed: "ms",
    freqFreqSpeed: "ms",
    volFreqSpeed: "ms",
    freqLower: "Hz",
    freqUpper: "Hz",
  };

  function formatNum(key, value) {
    if (UNITS[key] === "ms") return String(Math.round(value));
    if (UNITS[key] === "Hz") return value >= 100 ? value.toFixed(0) : value.toFixed(2);
    return String(Number(value.toFixed(4)));
  }

  function sliderToValue(input) {
    if (input.dataset.scale !== "log") return Number(input.value);
    const lo = Number(input.dataset.min);
    const hi = Number(input.dataset.max);
    const t = Number(input.value) / Number(input.max || 1000);
    return lo * Math.pow(hi / lo, t);
  }

  function valueToSlider(input, value) {
    if (input.dataset.scale !== "log") return value;
    const lo = Number(input.dataset.min);
    const hi = Number(input.dataset.max);
    const max = Number(input.max || 1000);
    const v = Math.max(lo, Math.min(hi, Number(value)));
    if (v <= lo) return 0;
    return (Math.log(v / lo) / Math.log(hi / lo)) * max;
  }

  function setParam(key, value, source) {
    if (!Number.isFinite(value)) return;
    voice.setParam(key, value);
    const range = document.querySelector(`input[type=range][data-param="${key}"]`);
    const num = document.querySelector(`[data-num="${key}"]`);
    if (range && source !== range) range.value = valueToSlider(range, value);
    if (num && source !== num && document.activeElement !== num) num.value = formatNum(key, value);
  }

  function drawTable(canvas, table) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    const g = canvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    g.strokeStyle = "rgba(143, 191, 138, 0.22)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, h * 0.5);
    g.lineTo(w, h * 0.5);
    g.stroke();

    g.strokeStyle = "rgba(143, 191, 138, 0.9)";
    g.lineWidth = 1.5;
    g.beginPath();
    const n = 256;
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * w;
      const y = h * 0.5 - table[i] * h * 0.42;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }

  function pointerToSample(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    const index = Math.round((x / Math.max(rect.width, 1)) * 255);
    const value = (rect.height * 0.5 - y) / (rect.height * 0.42 || 1);
    return { index, value: Math.max(-1.02, Math.min(1.02, value)) };
  }

  function bindWaveDrawing(canvas) {
    const tableIndex = Number(canvas.dataset.table);
    let drawing = false;
    let lastIndex = null;
    let lastValue = null;

    const strokeAt = (clientX, clientY) => {
      const { index, value } = pointerToSample(canvas, clientX, clientY);
      if (lastIndex == null) {
        voice.paint(tableIndex, index, value);
      } else {
        voice.paintLine(tableIndex, lastIndex, lastValue, index, value);
      }
      lastIndex = index;
      lastValue = value;
      drawTable(canvas, voice.tables[tableIndex]);
    };

    const start = (e) => {
      e.preventDefault();
      drawing = true;
      canvas.classList.add("is-drawing");
      lastIndex = null;
      lastValue = null;
      const pt = e.touches ? e.touches[0] : e;
      strokeAt(pt.clientX, pt.clientY);
    };

    const move = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const pt = e.touches ? e.touches[0] : e;
      strokeAt(pt.clientX, pt.clientY);
    };

    const end = () => {
      if (!drawing) return;
      drawing = false;
      canvas.classList.remove("is-drawing");
      lastIndex = null;
      lastValue = null;
    };

    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      start(e);
    });
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("pointerleave", (e) => {
      if (drawing && e.buttons === 0) end();
    });
  }

  function refreshWaves() {
    document.querySelectorAll(".wave").forEach((canvas) => {
      const idx = Number(canvas.dataset.table);
      drawTable(canvas, voice.tables[idx]);
    });
  }

  function applyParamsToUI() {
    Object.entries(voice.params).forEach(([key, value]) => {
      setParam(key, value, null);
    });
    document.querySelectorAll("select[data-wave]").forEach((select) => {
      const which = Number(select.dataset.wave);
      if (voice.shapes[which] != null) select.value = String(voice.shapes[which]);
    });
    refreshWaves();
  }

  function loadStored() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  function writeStored(all) {
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
  }

  function safeName(raw) {
    const name = String(raw || "").trim().slice(0, 48);
    return name || "untitled";
  }

  function downloadPreset(name, preset) {
    const blob = new Blob([JSON.stringify({ name, ...preset }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newbrain-${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function applyNamedPreset(name, preset) {
    voice.applyPreset(preset);
    applyParamsToUI();
    presetName.value = name;
    renderPresetList(name);
  }

  function renderPresetList(active) {
    const all = loadStored();
    const names = Object.keys(all).sort();
    presetList.replaceChildren();
    names.forEach((name) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = name;
      btn.classList.toggle("active", name === active);
      btn.addEventListener("click", () => applyNamedPreset(name, all[name]));
      presetList.appendChild(btn);
    });
  }

  function saveCurrent() {
    const name = safeName(presetName.value);
    const preset = voice.getPreset();
    const all = loadStored();
    all[name] = preset;
    writeStored(all);
    presetName.value = name;
    renderPresetList(name);
    downloadPreset(name, preset);
  }

  function loadFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        const name = safeName(data.name || file.name.replace(/\.json$/i, ""));
        const preset = {
          params: data.params || {},
          shapes: data.shapes || [],
          tables: data.tables || [],
        };
        const all = loadStored();
        all[name] = preset;
        writeStored(all);
        applyNamedPreset(name, preset);
      } catch (_) {
        status.textContent = "preset load failed";
      }
    };
    reader.readAsText(file);
  }

  document.querySelectorAll("input[type=range][data-param]").forEach((input) => {
    const key = input.dataset.param;
    input.addEventListener("input", () => setParam(key, sliderToValue(input), input));
  });

  document.querySelectorAll("input[type=number][data-num]").forEach((input) => {
    const key = input.dataset.num;
    const apply = () => {
      const value = Number(input.value);
      if (!Number.isFinite(value)) return;
      setParam(key, value, input);
    };
    input.addEventListener("input", apply);
    input.addEventListener("change", apply);
  });

  document.querySelectorAll("select[data-wave]").forEach((select) => {
    select.addEventListener("change", () => {
      const which = Number(select.dataset.wave);
      voice.setWave(which, Number(select.value));
      const canvas = document.querySelector(`.wave[data-table="${which}"]`);
      if (canvas) drawTable(canvas, voice.tables[which]);
    });
  });

  document.querySelectorAll(".wave").forEach(bindWaveDrawing);

  document.getElementById("savePreset").addEventListener("click", saveCurrent);
  document.getElementById("loadPreset").addEventListener("click", () => presetFile.click());
  presetFile.addEventListener("change", () => {
    loadFromFile(presetFile.files[0]);
    presetFile.value = "";
  });

  window.addEventListener("resize", refreshWaves);
  applyParamsToUI();
  renderPresetList();

  startBtn.addEventListener("click", async () => {
    if (engine.running) {
      engine.stop();
      startBtn.textContent = "Start listening";
      startBtn.classList.remove("is-on");
      status.textContent = "audio off";
      return;
    }
    await engine.start();
    startBtn.textContent = "Stop";
    startBtn.classList.add("is-on");
    status.textContent = "dsp on";
  });
})();
