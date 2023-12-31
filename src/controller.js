"use strict";

class InputSystem {
    constructor(inputMap, canvas) {
        this.inputMap = inputMap;
        this.canvas = canvas;

        this.heldKeys = [];
        this.keyPressListeners = {};
        this.mouseClickListeners = {
            left: [],
            right: [],
            middle: []
        };
        this.mouse = { x: 0, y: 0, left: false, right: false, middle: false };
        this.touches = [];
        this.currentId = 0;

        this.#setupListeners();
    }

    #onKeyDown(event) {
        const key = event.key;
        if (!this.heldKeys.includes(key)) {
            this.heldKeys.push(key);
        }

        if (event.repeat) return;
        this.#onKeyPress(event);
    }

    #onKeyUp(event) {
        const key = event.key;
        const index = this.heldKeys.indexOf(key);
        if (index > -1) {
            this.heldKeys.splice(index, 1);
        }
    }

    #onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
    }

    #onMouseDown(event) {
        if (event.button === 0) {
            this.mouse.left = true;
            if (!event.repeat) this.mouseClickListeners.left.forEach(data => data.callback());
        } else if (event.button === 1) {
            this.mouse.middle = true;
            if (!event.repeat) this.mouseClickListeners.middle.forEach(data => data.callback());
        } else if (event.button === 2) {
            this.mouse.right = true;
            if (!event.repeat) this.mouseClickListeners.right.forEach(data => data.callback());
        }
    }

    #onMouseUp(event) {
        if (event.button === 0) {
            this.mouse.left = false;
        } else if (event.button === 1) {
            this.mouse.middle = false;
        } else if (event.button === 2) {
            this.mouse.right = false;
        }
    }

    #onTouchStart(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.touches.push({
                id: touch.identifier,
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            });
        }

        this.mouse.x = this.touches[0].x;
        this.mouse.y = this.touches[0].y;
        this.mouse.left = true;

        this.mouseClickListeners.left.forEach(data => data.callback());
    }

    #onTouchMove(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const index = this.touches.findIndex(t => t.id === touch.identifier);
            if (index > -1) {
                this.touches[index].x = touch.clientX - rect.left;
                this.touches[index].y = touch.clientY - rect.top;
            }
        }

        this.mouse.x = this.touches[0].x;
        this.mouse.y = this.touches[0].y;
        this.mouse.left = true;
    }

    #onTouchEnd(event) {
        event.preventDefault();
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const index = this.touches.findIndex(t => t.id === touch.identifier);
            if (index > -1) {
                this.touches.splice(index, 1);
            }
        }

        if (this.touches.length > 0) {
            this.mouse.x = this.touches[0].x;
            this.mouse.y = this.touches[0].y;
            this.mouse.left = true;
        } else {
            this.mouse.x = 0;
            this.mouse.y = 0;
            this.mouse.left = false;
        }
    }

    getActionFromKey(key) {
        for (const action in this.inputMap) {
            if (this.inputMap[action].includes(key)) {
                return action;
            }
        }
    }

    #onKeyPress(event) {
        const key = event.key;
        const action = this.getActionFromKey(key);
        if (action && this.keyPressListeners[action]) {
            this.keyPressListeners[action].forEach(data => data.callback());
        }
    }

    addKeyPressListener(callback, action) {
        if (!this.keyPressListeners[action]) {
            this.keyPressListeners[action] = [];
        }

        this.keyPressListeners[action].push({
            id: this.currentId++,
            callback: callback
        });

        return this.currentId - 1;
    }

    removeKeyPressListener(id, action) {
        if (!this.keyPressListeners[action]) return;
        const index = this.keyPressListeners[action].findIndex(listener => listener.id === id);
        if (index > -1) {
            this.keyPressListeners[action].splice(index, 1);
        }
    }

    addClickListener(callback, button) {
        this.mouseClickListeners[button].push({
            id: this.currentId++,
            callback: callback
        });

        return this.currentId - 1;
    }

    removeClickListener(id, button) {
        const index = this.mouseClickListeners[button].findIndex(listener => listener.id === id);
        if (index > -1) {
            this.mouseClickListeners[button].splice(index, 1);
        }
    }

    #setupListeners() {
        this.canvas.addEventListener("keydown", this.#onKeyDown.bind(this));
        window.addEventListener("keyup", this.#onKeyUp.bind(this));

        this.canvas.addEventListener("mousemove", this.#onMouseMove.bind(this));
        this.canvas.addEventListener("mousedown", this.#onMouseDown.bind(this));
        window.addEventListener("mouseup", this.#onMouseUp.bind(this));

        this.canvas.addEventListener("touchstart", this.#onTouchStart.bind(this));
        this.canvas.addEventListener("touchmove", this.#onTouchMove.bind(this));
        this.canvas.addEventListener("touchend", this.#onTouchEnd.bind(this));
    }

    isActionHeld(action) {
        return this.heldKeys.some(key => this.inputMap[action].includes(key));
    }
}

export default InputSystem;