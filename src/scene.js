"use strict";

class Scene {
    constructor(name) {
        this.name = name;
    }

    animate(ctx) {
    }

    update(dt) {
    }

    destroy() {
    }
}

class SceneManager {
    constructor(ctx, scenes = [], overlays = []) {
        this.scenes = scenes;
        this.overlays = overlays;
        this.currentScene = null;
        this.currentOverlay = null;
        this.showOverlay = false;

        this.ctx = ctx;
    }

    addScene(name, scene) {
        this.scenes[name] = scene;
    }

    addOverlay(name, scene) {
        this.overlays[name] = scene;
    }

    getScene(name) {
        return this.scenes[name];
    }

    getOverlay(name) {
        return this.overlays[name];
    }

    setCurrentScene(name) {
        if (this.currentScene) this.currentScene.destroy();
        const scene = this.getScene(name);
        if (scene) {
            this.currentScene = new scene(name);
        }
    }

    setOverlayScene(name) {
        if (this.currentOverlay) this.currentOverlay.destroy();
        const scene = this.getOverlay(name);
        if (scene) {
            this.currentOverlay = new scene(name);
        }
    }

    animate() {
        if (this.currentScene) this.currentScene.animate(this.ctx);
        if (this.currentOverlay && this.showOverlay) this.currentOverlay.animate(this.ctx);
    }

    update(dt) {
        if (this.currentScene) this.currentScene.update(dt);
        if (this.currentOverlay && this.showOverlay) this.currentOverlay.update(dt);
    }
}

export {
    Scene,
    SceneManager
};