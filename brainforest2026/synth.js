(() => {
  const TABLE_SIZE = 256;
  const WAVE_COUNT = 5;
  const MIN_HZ = 0.05;
  const MAX_HZ = 16000;
  const MIN_MS = 1;

  const WAVE = {
    sine: 0,
    square: 1,
    tri: 2,
    revTri: 3,
    saw: 4,
    revSaw: 5,
    flat: 6,
  };

  function makeWave(type) {
    const out = new Float32Array(TABLE_SIZE + 3);
    const mid = TABLE_SIZE / 2;
    for (let i = 0; i < TABLE_SIZE; i++) {
      const t = i / TABLE_SIZE;
      let v = 0;
      if (type === WAVE.sine) {
        v = Math.sin(t * Math.PI * 2);
      } else if (type === WAVE.square) {
        v = i < mid ? 1 : -1;
      } else if (type === WAVE.tri) {
        v = 2 * (i <= mid ? i / mid : (TABLE_SIZE - i) / (TABLE_SIZE - mid)) - 1;
      } else if (type === WAVE.revTri) {
        v = -(2 * (i <= mid ? i / mid : (TABLE_SIZE - i) / (TABLE_SIZE - mid)) - 1);
      } else if (type === WAVE.saw) {
        v = 2 * t - 1;
      } else if (type === WAVE.revSaw) {
        v = 1 - 2 * t;
      } else {
        v = 0;
      }
      out[i] = v;
    }
    out[TABLE_SIZE] = out[0];
    out[TABLE_SIZE + 1] = out[1];
    out[TABLE_SIZE + 2] = out[2];
    return out;
  }

  function wrapGuard(table) {
    table[TABLE_SIZE] = table[0];
    table[TABLE_SIZE + 1] = table[1];
    table[TABLE_SIZE + 2] = table[2];
  }

  function tabosc4(table, phase) {
    const size = TABLE_SIZE;
    let p = phase % size;
    if (p < 0) p += size;
    const i = Math.floor(p);
    const f = p - i;
    const y0 = table[i];
    const y1 = table[i + 1];
    const y2 = table[i + 2];
    const y3 = table[i + 3];
    const c0 = y1;
    const c1 = 0.5 * (y2 - y0);
    const c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
    const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
    return ((c3 * f + c2) * f + c1) * f + c0;
  }

  function mapBipolar(sample, lo, hi) {
    return lo + (sample * 0.5 + 0.5) * (hi - lo);
  }

  function periodInc(speedMs, sampleRate) {
    const ms = Math.max(MIN_MS, speedMs);
    return (TABLE_SIZE * 1000) / (ms * sampleRate);
  }

  class Voice {
    constructor() {
      this.params = {
        freqSpeed: 2000,
        freqLower: 80,
        freqUpper: 800,
        volSpeed: 1500,
        masterVol: 1,
        freqFreqSpeed: 8000,
        freqFreqLower: 0,
        freqFreqUpper: 1,
        volFreqSpeed: 10000,
        volFreqLower: 0,
        volFreqUpper: 1,
      };
      this.tables = Array.from({ length: WAVE_COUNT }, (_, i) =>
        makeWave(i === 0 ? WAVE.sine : WAVE.flat)
      );
      this.phases = new Float64Array(WAVE_COUNT);
      this.shapes = Array.from({ length: WAVE_COUNT }, (_, i) =>
        i === 0 ? WAVE.sine : WAVE.flat
      );
      this.gain = 0.35;
    }

    setParam(key, value) {
      this.params[key] = value;
    }

    setWave(index, type) {
      this.tables[index] = makeWave(type);
      this.shapes[index] = type;
    }

    getPreset() {
      return {
        params: { ...this.params },
        shapes: this.shapes.slice(),
        tables: this.tables.map((table) => Array.from(table.subarray(0, TABLE_SIZE))),
      };
    }

    applyPreset(preset) {
      if (!preset || typeof preset !== "object") return;
      if (preset.params) {
        Object.keys(this.params).forEach((key) => {
          if (typeof preset.params[key] === "number" && Number.isFinite(preset.params[key])) {
            this.params[key] = preset.params[key];
          }
        });
      }
      if (Array.isArray(preset.tables)) {
        let tables = preset.tables;
        let shapes = Array.isArray(preset.shapes) ? preset.shapes : [];
        if (tables.length === 7) {
          tables = [tables[0], tables[1], tables[2], tables[5], tables[6]];
          if (shapes.length === 7) {
            shapes = [shapes[0], shapes[1], shapes[2], shapes[5], shapes[6]];
          }
        }
        tables.forEach((src, index) => {
          if (index >= WAVE_COUNT || !src) return;
          const dest = this.tables[index];
          for (let i = 0; i < TABLE_SIZE; i++) {
            const v = Number(src[i]);
            dest[i] = Number.isFinite(v) ? Math.max(-1.02, Math.min(1.02, v)) : 0;
          }
          wrapGuard(dest);
        });
        shapes.forEach((type, index) => {
          if (index < WAVE_COUNT && Number.isFinite(Number(type))) {
            this.shapes[index] = Number(type);
          }
        });
      } else if (Array.isArray(preset.shapes)) {
        preset.shapes.forEach((type, index) => {
          if (index < WAVE_COUNT && Number.isFinite(Number(type))) {
            this.shapes[index] = Number(type);
          }
        });
      }
    }

    paint(tableIndex, sampleIndex, value) {
      const table = this.tables[tableIndex];
      const i = Math.max(0, Math.min(TABLE_SIZE - 1, sampleIndex | 0));
      table[i] = Math.max(-1.02, Math.min(1.02, value));
      wrapGuard(table);
    }

    paintLine(tableIndex, i0, v0, i1, v1) {
      let a = i0 | 0;
      let b = i1 | 0;
      let va = v0;
      let vb = v1;
      if (a > b) {
        const ti = a;
        a = b;
        b = ti;
        const tv = va;
        va = vb;
        vb = tv;
      }
      a = Math.max(0, Math.min(TABLE_SIZE - 1, a));
      b = Math.max(0, Math.min(TABLE_SIZE - 1, b));
      if (a === b) {
        this.paint(tableIndex, a, va);
        return;
      }
      for (let i = a; i <= b; i++) {
        const t = (i - a) / (b - a);
        this.paint(tableIndex, i, va + (vb - va) * t);
      }
    }

    process(bufferL, bufferR, n, sampleRate) {
      const p = this.params;
      const t0 = this.tables[0];
      const t1 = this.tables[1];
      const t2 = this.tables[2];
      const t3 = this.tables[3];
      const t4 = this.tables[4];
      let ph0 = this.phases[0];
      let ph1 = this.phases[1];
      let ph2 = this.phases[2];
      let ph3 = this.phases[3];
      let ph4 = this.phases[4];
      const g = this.gain;
      const inc3 = periodInc(p.freqFreqSpeed, sampleRate);
      const inc4 = periodInc(p.volFreqSpeed, sampleRate);
      const hzScale = TABLE_SIZE / sampleRate;

      for (let i = 0; i < n; i++) {
        const freqHz = mapBipolar(tabosc4(t1, ph1), p.freqLower, p.freqUpper);
        const amp = mapBipolar(tabosc4(t2, ph2), 0, 1);
        const hz = Math.max(MIN_HZ, Math.min(MAX_HZ, Math.abs(freqHz)));
        const freqMs = p.freqSpeed * mapBipolar(tabosc4(t3, ph3), p.freqFreqLower, p.freqFreqUpper);
        const volMs = p.volSpeed * mapBipolar(tabosc4(t4, ph4), p.volFreqLower, p.volFreqUpper);

        const sample = tabosc4(t0, ph0) * amp * g * Math.max(0, p.masterVol);
        const clipped = Math.tanh(sample);
        bufferL[i] = clipped;
        bufferR[i] = clipped;

        ph0 += hz * hzScale;
        ph1 += periodInc(freqMs, sampleRate);
        ph2 += periodInc(volMs, sampleRate);
        ph3 += inc3;
        ph4 += inc4;
      }

      this.phases[0] = ph0 % TABLE_SIZE;
      this.phases[1] = ph1 % TABLE_SIZE;
      this.phases[2] = ph2 % TABLE_SIZE;
      this.phases[3] = ph3 % TABLE_SIZE;
      this.phases[4] = ph4 % TABLE_SIZE;
    }
  }

  class NewbrainEngine {
    constructor() {
      this.ctx = null;
      this.node = null;
      this.voice = new Voice();
      this.running = false;
    }

    async start() {
      if (this.running) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      await this.ctx.resume();

      const engine = this;
      const node = this.ctx.createScriptProcessor(512, 1, 2);
      node.onaudioprocess = (e) => {
        const outL = e.outputBuffer.getChannelData(0);
        const outR = e.outputBuffer.getChannelData(1);
        outL.fill(0);
        outR.fill(0);
        engine.voice.process(outL, outR, outL.length, engine.ctx.sampleRate);
      };

      const silent = this.ctx.createConstantSource();
      silent.offset.value = 0;
      silent.start();
      silent.connect(node);

      const master = this.ctx.createGain();
      master.gain.value = 0.85;
      node.connect(master);
      master.connect(this.ctx.destination);
      this.node = node;
      this.silent = silent;
      this.master = master;
      this.running = true;
    }

    stop() {
      if (!this.running) return;
      try {
        this.silent.stop();
        this.silent.disconnect();
        this.node.disconnect();
        this.master.disconnect();
      } catch (_) {}
      this.ctx.close();
      this.ctx = null;
      this.node = null;
      this.silent = null;
      this.running = false;
    }
  }

  window.NewbrainEngine = NewbrainEngine;
  window.NewbrainWaves = { makeWave, TABLE_SIZE, WAVE_COUNT };
})();
