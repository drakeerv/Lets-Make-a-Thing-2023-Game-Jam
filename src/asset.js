"use strict";

class BaseAsset {
    constructor(src) {
        this.src = src;

        this.loaded = false;
        this.loadAsset();

        this.loadEvents = [];
    }

    _callLoadEvents() {
        this.loadEvents.forEach(callback => callback());
    }

    onLoad(callback) {
        if (this.loaded) {
            callback();
        } else {
            this.loadEvents.push(callback);
        }
    }
}

class ImageAsset extends BaseAsset {
    constructor(src) {
        super(src);
    }

    loadAsset() {
        this.isGif = this.src.endsWith(".gif");

        if (this.isGif) {
            this.isPlaying = true;
            this.playbackRate = 0.1;
            this.currentPlayback = 0;

            fetch(this.src)
                .then(response => response.arrayBuffer())
                .then(buffer => {
                    this.byteArray = new Uint8Array(buffer);
                    this.gif = new GIF(this.byteArray);
                    this.rawFrames = this.gif.decompressFrames(true);
                    this.totalFrames = this.rawFrames.length;

                    this.offscreenCanvas = new OffscreenCanvas(this.rawFrames[0].dims.width, this.rawFrames[0].dims.height);
                    this.offscreenCtx = this.offscreenCanvas.getContext("2d", {
                        desynchronized: true,
                        willReadFrequently: true
                    });
                    
                    this.frames = this.rawFrames.map(rawFrame => {
                        const imageData = this.offscreenCtx.createImageData(rawFrame.dims.width, rawFrame.dims.height);
                        imageData.data.set(rawFrame.patch);
                        this.offscreenCtx.putImageData(imageData, 0, 0);
                        return this.offscreenCanvas.transferToImageBitmap();
                    });



                    this.loaded = true;
                    this._callLoadEvents();
                });
        } else {
            this.image = new Image();
            this.image.addEventListener("load", () => {
                this.loaded = true;
                this._callLoadEvents();
            });
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

class AudioAsset extends BaseAsset {
    constructor(src) {
        super(src);
    }

    loadAsset() {
        this.audio = new Audio();
        this.audio.addEventListener("canplaythrough", () => {
            this.loaded = true;
            this._callLoadEvents();
        });
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

function resolveAsset(src) {
    if (src.endsWith(".mp3") || src.endsWith(".wav") || src.endsWith(".ogg")) {
        return new AudioAsset(src);
    } else if (src.endsWith(".gif") || src.endsWith(".png") || src.endsWith(".jpg") || src.endsWith(".jpeg")) {
        return new ImageAsset(src);
    } else {
        throw new Error(`Cannot resolve asset ${src}`);
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

    startLoadAssets() {
        for (const name in this.sources) {
            const src = this.sources[name];
            const asset = resolveAsset(src);
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
    AssetLoader,
    resolveAsset
}