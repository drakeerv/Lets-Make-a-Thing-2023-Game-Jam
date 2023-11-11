"use strict";

class Asset {
    constructor(src) {
        this.src = src;

        this.loaded = false;
        this.loadAsset();

        this.loadEvents = [];
    }

    #callLoadEvents() {
        this.loadEvents.forEach(callback => callback());
    }

    async loadAsset() {
        this.loaded = true;
        this.#callLoadEvents();
    }

    onLoad(callback) {
        if (this.loaded) {
            callback();
        } else {
            this.loadEvents.push(callback);
        }
    }
}

class ImageAsset extends Asset {
    constructor(src) {
        super(src);
    }

    async loadAsset() {
        this.isGif = this.src.endsWith(".gif");

        if (this.isGif) {
            this.isPlaying = true;
            this.playbackRate = 0.1;
            this.currentPlayback = 0;

            const buffer = await fetch(this.src)
                .then(response => response.arrayBuffer());

            this.byteArray = new Uint8Array(buffer);
            this.gif = new GIF(this.byteArray);
            this.rawFrames = this.gif.decompressFrames(true);
            this.totalFrames = this.rawFrames.length;

            const supportsOffscreenCanvas = typeof OffscreenCanvas !== "undefined";

            if (supportsOffscreenCanvas) {
                this.offscreenCanvas = new OffscreenCanvas(this.rawFrames[0].dims.width, this.rawFrames[0].dims.height);
            } else {
                this.offscreenCanvas = document.createElement("canvas");
            }

            this.offscreenCtx = this.offscreenCanvas.getContext("2d", {
                desynchronized: true,
                willReadFrequently: true,
                alpha: true
            });


            const images = await Promise.all(this.rawFrames.map(async rawFrame => {
                const dims = rawFrame.dims;
                const imageData = new ImageData(rawFrame.patch, dims.width, dims.height);

                this.offscreenCtx.putImageData(imageData, dims.left, dims.top);
                return await createImageBitmap(this.offscreenCanvas);
            }));

            this.frames = await Promise.all(images.map(async (image, i) => {
                for (let j = 0; j < i; j++) {
                    this.offscreenCtx.drawImage(images[j], 0, 0);
                }
                this.offscreenCtx.drawImage(image, 0, 0);
                return await createImageBitmap(this.offscreenCanvas);
            }));

            super.loadAsset();
        } else {
            this.image = new Image();
            this.image.addEventListener("load", super.loadAsset.bind(this));
            this.image.src = this.src;
        }
    }

    get img() {
        if (!this.loaded) return null;

        if (this.isGif) {
            if (this.isPlaying) {
                this.currentPlayback = (this.playbackRate + this.currentPlayback) % this.totalFrames;
            }

            const index = Math.floor(this.currentPlayback);
            return this.frames[index];
        } else {
            return this.image;
        }
    }
}

class AudioAsset extends Asset {
    constructor(src) {
        super(src);
    }

    async loadAsset() {
        this.audio = new Audio();
        this.audio.addEventListener("canplaythrough", super.loadAsset.bind(this));
        this.audio.src = this.src;
    }

    play() {
        if (!this.loaded) return;
        this.audio.play();
    }

    playFromStart() {
        if (!this.loaded) return;
        this.audio.currentTime = 0;
        this.audio.play();
    }

    pause() {
        if (!this.loaded) return;
        this.audio.pause();
    }

    stop() {
        if (!this.loaded) return;
        this.audio.pause();
        this.audio.currentTime = 0;
    }

    loop() {
        if (!this.loaded) return;
        this.audio.loop = true;
        this.audio.play();
    }

    fadeOutAndStop(time) {
        if (!this.loaded) return;
        const volumeLeft = this.audio.volume;
        const volumeStep = volumeLeft / time;
        const interval = setInterval(() => {
            this.audio.volume = Math.max(0, this.audio.volume - volumeStep);
            if (this.audio.volume <= 0) {
                clearInterval(interval);
                this.stop();
            }
        }, time * 10);
    }

    fadeInAndLoop(time, maxVolume = 1) {
        if (!this.loaded) return;
        this.audio.loop = true;
        this.audio.volume = 0;
        this.audio.play();
        const volumeStep = maxVolume / time;
        const interval = setInterval(() => {
            this.audio.volume = Math.min(1, this.audio.volume + volumeStep);
            if (this.audio.volume >= maxVolume) {
                clearInterval(interval);
            }
        }, time * 10);
    }
}

class TextAsset extends Asset {
    constructor(src) {
        super(src);
    }

    async loadAsset() {
        this.text = await fetch(this.src)
            .then(response => response.text());
        super.loadAsset();
    }
}

class AssetLoader {
    constructor(sources) {
        this.sources = sources;
        this.loadingPaths = Object.values(this.sources);
        this.loading = true;
        this.totalLoaded = 0;
        this.totalAssets = this.loadingPaths.length;
        this.currentAssetLoading = this.loadingPaths[0];
        this.assets = {};
        this.loadCallbacks = [];
    }

    resolveAsset(src) {
        if (src.endsWith(".mp3") || src.endsWith(".wav") || src.endsWith(".ogg")) {
            return new AudioAsset(src);
        } else if (src.endsWith(".gif") || src.endsWith(".png") || src.endsWith(".jpg") || src.endsWith(".jpeg") || src.endsWith(".webp")) {
            return new ImageAsset(src);
        } else if (src.endsWith("txt") || src.endsWith(".glsl")) {
            return new TextAsset(src);
        } else {
            throw new Error(`Cannot resolve asset ${src}`);
        }
    }

    startLoadAssets() {
        for (const name in this.sources) {
            const src = this.sources[name];
            const asset = this.resolveAsset(src);
            asset.onLoad(() => {
                this.totalLoaded++;
                if (this.totalLoaded == this.totalAssets) {
                    this.loading = false;
                    this.loadCallbacks.forEach(callback => callback());
                } else {
                    this.loadingPaths = this.loadingPaths.filter(path => path != src);
                    this.currentAssetLoading = this.loadingPaths[0];
                }
            });
            this.assets[name] = asset;
        }
    }

    onLoad(callback) {
        if (!this.loading) {
            callback();
        } else {
            this.loadCallbacks.push(callback);
        }
    }

    getLoadedPercentage() {
        return this.totalLoaded / this.totalAssets;
    }
}

export {
    ImageAsset,
    AudioAsset,
    AssetLoader
}