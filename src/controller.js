class InputSystem {
    constructor(inputMap, canvas) {
        this.inputMap = inputMap;
        this.canvas = canvas;

        // A input handler that can handle held keys, single use keys, and controllers
        this.heldKeys = [];
        this.keyPressListeners = {};
        this.mouse = {x: 0, y: 0, left: false, right: false, middle: false};
        this.currentId = 0;

        this._setupListeners();
    }

    _onKeyDown(event) {
        const key = event.key;
        if (!this.heldKeys.includes(key)) {
            this.heldKeys.push(key);
        }

        if (event.repeat) return;
        this._onKeyPress(event);
    }

    _onKeyUp(event) {
        const key = event.key;
        const index = this.heldKeys.indexOf(key);
        if (index > -1) {
            this.heldKeys.splice(index, 1);
        }
    }

    _onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
    }

    _onMouseDown(event) {
        if (event.button === 0) {
            this.mouse.left = true;
        } else if (event.button === 1) {
            this.mouse.middle = true;
        } else if (event.button === 2) {
            this.mouse.right = true;
        }
    }

    _onMouseUp(event) {
        if (event.button === 0) {
            this.mouse.left = false;
        } else if (event.button === 1) {
            this.mouse.middle = false;
        } else if (event.button === 2) {
            this.mouse.right = false;
        }
    }

    getActionFromKey(key) {
        for (const action in this.inputMap) {
            if (this.inputMap[action].includes(key)) {
                return action;
            }
        }
    }

    _onKeyPress(event) {
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

    _setupListeners() {
        this.canvas.addEventListener("keydown", this._onKeyDown.bind(this));
        window.addEventListener("keyup", this._onKeyUp.bind(this));

        this.canvas.addEventListener("mousemove", this._onMouseMove.bind(this));
        this.canvas.addEventListener("mousedown", this._onMouseDown.bind(this));
        window.addEventListener("mouseup", this._onMouseUp.bind(this));
    }

    isActionHeld(action) {
        return this.heldKeys.some(key => this.inputMap[action].includes(key));
    }
}

export default InputSystem;