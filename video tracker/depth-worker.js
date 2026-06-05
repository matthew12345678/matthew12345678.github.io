import { pipeline, env, RawImage } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3";

env.allowLocalModels = false;
env.useBrowserCache = true;

let estimator = null;

async function loadEstimator(preferWebgpu){
    const attempts = preferWebgpu
        ? [{ device: "webgpu", dtype: "fp16" }, { device: "wasm", dtype: "q8" }]
        : [{ device: "wasm", dtype: "q8" }];

    let lastErr = null;

    for(const cfg of attempts){
        try {
            estimator = await pipeline(
                "depth-estimation",
                "Xenova/depth-anything-small-hf",
                cfg
            );
            return cfg.device;
        } catch(err){
            lastErr = err;
            estimator = null;
        }
    }

    throw lastErr || new Error("Could not load depth model");
}

self.onmessage = async (e) => {
    const msg = e.data;

    if(msg.type === "init"){
        try {
            const device = await loadEstimator(msg.preferWebgpu !== false);
            self.postMessage({ type: "ready", device });
        } catch(err){
            self.postMessage({ type: "error", message: err.message });
        }
        return;
    }

    if(msg.type === "infer"){
        if(!estimator){
            self.postMessage({ type: "error", message: "Model not loaded", id: msg.id });
            return;
        }

        try {
            const pixels = new Uint8ClampedArray(msg.pixels);
            const image = new RawImage(pixels, msg.width, msg.height, 4);
            const result = await estimator(image);
            const tensor = result.predicted_depth;
            const h = tensor.dims[0];
            const w = tensor.dims[1];
            const out = new Float32Array(tensor.data.length);
            out.set(tensor.data);

            self.postMessage(
                { type: "depth", id: msg.id, width: w, height: h, buffer: out },
                [out.buffer]
            );
        } catch(err){
            self.postMessage({ type: "error", message: err.message, id: msg.id });
        }
    }
};
