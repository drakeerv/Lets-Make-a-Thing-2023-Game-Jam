"use strict";

class CanvasHandler {
    constructor(canvas, updateRate = 60) {
        this.canvas = canvas;
        this.updateRate = updateRate;

        this.resizeListeners = [];
        this.animateListeners = [];
        this.updateListeners = [];
        this.updatesps = 0;
        this.fps = 0;

        this.#addListeners();
        this.#addLoops();
    }

    #onResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.resizeListeners.forEach(callback => callback());
    }

    changeCursor(cursor) {
        this.canvas.style.cursor = cursor;
    }

    addResizeListener(callback) {
        this.resizeListeners.push(callback);
        callback();
    }

    addAnimateListener(callback) {
        this.animateListeners.push(callback);
    }

    addUpdateListener(callback) {
        this.updateListeners.push(callback);
    }

    #addListeners() {
        window.addEventListener("resize", this.#onResize.bind(this));
        this.#onResize();
    }

    #addLoops() {
        let lastAnimate = performance.now();
        function animateLoop() {
            const now = performance.now();
            const dt = (now - lastAnimate) / 1000;
            this.fps = 1000 / (now - lastAnimate);
            lastAnimate = now;
            window.requestAnimationFrame(animateLoop.bind(this));
            this.animateListeners.forEach(callback => callback());
        }
        window.requestAnimationFrame(animateLoop.bind(this));

        let lastUpdate = performance.now();
        window.setInterval(() => {
            const now = performance.now();
            const dt = (now - lastUpdate) / 1000;
            this.updatesps = 1000 / (now - lastUpdate);
            lastUpdate = now;
            this.updateListeners.forEach(callback => callback(dt));
        }, 1000 / this.updateRate);
    }
}

export default CanvasHandler;