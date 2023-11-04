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
    constructor(ctx, scenes = [], overlays = [], filters = []) {
        this.scenes = scenes;
        this.overlays = overlays;
        this.filters = filters;

        this.currentScene = null;
        this.currentOverlay = null;
        this.showOverlay = false;
        this.currentFiliter = null;

        this.ctx = ctx;
    }

    addScene(name, scene) {
        this.scenes[name] = scene;
    }

    addOverlay(name, scene) {
        this.overlays[name] = scene;
    }

    addFilter(name, scene) {
        this.filters[name] = scene;
    }

    getScene(name) {
        return this.scenes[name];
    }

    getOverlay(name) {
        return this.overlays[name];
    }

    getFilter(name) {
        return this.filters[name];
    }

    setCurrentScene(name) {
        if (this.currentScene) this.currentScene.destroy();
        const scene = this.getScene(name);
        if (scene) {
            this.currentScene = new scene(name);
        }
    }

    setOverlayScene(name) {
        if (this.overlayScene) this.overlayScene.destroy();
        const scene = this.getOverlay(name);
        if (scene) {
            this.overlayScene = new scene(name);
        }
    }

    setFilterScene(name) {
        if (this.currentFilter) this.currentFilter.destroy();
        const scene = this.getFilter(name);
        if (scene) {
            this.currentFilter = new scene(name);
        }
    }

    animate() {
        if (this.currentScene) this.currentScene.animate(this.ctx);
        if (this.currentFilter) this.currentFilter.animate(this.ctx);
        if (this.overlayScene && this.showOverlay) this.overlayScene.animate(this.ctx);
    }

    update(dt) {
        if (this.currentScene) this.currentScene.update(dt);
        if (this.currentFilter) this.currentFilter.update(dt);
        if (this.overlayScene && this.showOverlay) this.overlayScene.update(dt);
    }
}

export {
    Scene,
    SceneManager
};