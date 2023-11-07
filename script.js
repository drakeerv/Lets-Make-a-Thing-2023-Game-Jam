"use strict";

import { AssetLoader } from "./src/asset.js";
import InputSystem from "./src/controller.js";
import CanvasHandler from "./src/canvas.js";
import generateMaze from "./src/maze.js";
import { Scene, SceneManager } from "./src/scene.js";
import { lerp, isInside, isTouchInside } from "./src/math.js";
import { isMobile } from "./src/checks.js";

// Canvas

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", {
    alpha: false,
    desynchronized: true
});
const canvasHandler = new CanvasHandler(canvas);

// Constants

const MAZE_GRID_SIZE = 100;
const MAZE_LINE_WIDTH = 5;
const IS_MOBILE = isMobile();

// Assets

const assetsSources = {
    "switch": "assets/switch.png",
    "switch_sound": "assets/switch.ogg",
    "table": "assets/table.png",
    "key_w": "assets/keys/w.png",
    "key_a": "assets/keys/a.png",
    "key_s": "assets/keys/s.png",
    "key_d": "assets/keys/d.png",
    "key_space": "assets/keys/space.png",
    "key_q": "assets/keys/q.png",
    "key_k": "assets/keys/k.png",
    "key_escape": "assets/keys/escape.png",
    "track1": "assets/music/track1.ogg",
    "button_sound": "assets/button.ogg"
}
const assetsLoader = new AssetLoader(assetsSources);
assetsLoader.startLoadAssets();

// Input Sytem
const inputSystem = new InputSystem({
    "forward": ["w", "ArrowUp"],
    "backward": ["s", "ArrowDown"],
    "left": ["a", "ArrowLeft"],
    "right": ["d", "ArrowRight"],
    "light": [" "],
    "debug": ["q"],
    "keys": ["k"],
    "quit": ["Escape"]
}, canvas);

// Global Variables

let mazeCols = 5;
let mazeRows = 5;
let passedLevels = 0;
let redirectedFromMenu = false;
let showKeys = IS_MOBILE ? false : true;
let hasSeenTutorial = false;
let highScore = 0;

// Functions

function setHighScore(score) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
}

function readLocalStorage() {
    showKeys = localStorage.getItem("showKeys") == null ? showKeys : localStorage.getItem("showKeys") == "true";
    hasSeenTutorial = localStorage.getItem("hasSeenTutorial") == "true";
    highScore = parseInt(localStorage.getItem("highScore")) || 0;
}

function resetLocalStorage() {
    localStorage.clear();
    readLocalStorage();
}

// Local Storage

readLocalStorage();

// Scenes

const sceneManager = new SceneManager(ctx);

sceneManager.addScene("tutorial", class extends Scene {
    constructor(name) {
        super(name);

        this.redirectedFromMenu = redirectedFromMenu;

        redirectedFromMenu = false;
        hasSeenTutorial = true;
        localStorage.setItem("hasSeenTutorial", "true");

        this.escapeKeyListener = inputSystem.addKeyPressListener(() => {
            sceneManager.setCurrentScene("menu");
        }, "quit");
        this.leftClickListener = inputSystem.addClickListener(this.onClick.bind(this), "left");
    }

    animate(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();

        // draw text
        ctx.fillStyle = "white";
        ctx.font = "30px Retro";
        ctx.textAlign = "center";
        ctx.fillText("Tutorial", ctx.canvas.width / 2, ctx.canvas.height / 4);

        // draw tutorial keys (w, a, s, d)
        ctx.drawImage(assetsLoader.assets.key_w.img, ctx.canvas.width / 2 - 25, ctx.canvas.height / 4 + 25, 50, 50);
        ctx.drawImage(assetsLoader.assets.key_a.img, ctx.canvas.width / 2 - 75, ctx.canvas.height / 4 + 75, 50, 50);
        ctx.drawImage(assetsLoader.assets.key_s.img, ctx.canvas.width / 2 - 25, ctx.canvas.height / 4 + 75, 50, 50);
        ctx.drawImage(assetsLoader.assets.key_d.img, ctx.canvas.width / 2 + 25, ctx.canvas.height / 4 + 75, 50, 50);

        // draw tutorial text
        ctx.fillStyle = "white";
        ctx.font = "15px Retro";
        ctx.fillText("Move with these keys", ctx.canvas.width / 2, ctx.canvas.height / 4 + 150);

        // draw tutorial key (space)
        ctx.drawImage(assetsLoader.assets.key_space.img, ctx.canvas.width / 2 - 25, ctx.canvas.height / 4 + 175, 50, 50);

        // draw tutorial text
        ctx.fillStyle = "white";
        ctx.font = "15px Retro";
        ctx.fillText("Toggle Light with this key", ctx.canvas.width / 2, ctx.canvas.height / 4 + 250);

        // draw horizontal line to break
        ctx.fillStyle = "white";
        ctx.fillRect(ctx.canvas.width / 2 - 100, ctx.canvas.height / 4 + 275, 200, 5);

        // draw the goal of the game
        ctx.fillStyle = "white";
        ctx.font = "15px Retro";
        ctx.fillText("The goal of the game is to get to the end of the maze (Bottom Right).", ctx.canvas.width / 2, ctx.canvas.height / 4 + 300);
        ctx.fillText("without being caught by the enemy (Red Square).", ctx.canvas.width / 2, ctx.canvas.height / 4 + 325);
        ctx.fillText("You can only move with the lights off and the enemy can only move with the lights on.", ctx.canvas.width / 2, ctx.canvas.height / 4 + 350);
        ctx.fillText("If the enemy catches you, you die and have to restart.", ctx.canvas.width / 2, ctx.canvas.height / 4 + 375);

        // draw back button
        ctx.fillStyle = "white";
        ctx.fillRect(ctx.canvas.width / 2 - 100, ctx.canvas.height / 4 + 400, 200, 20);

        // draw back text
        ctx.fillStyle = "black";
        ctx.font = "15px Retro";
        ctx.fillText(this.redirectedFromMenu ? "Back" : "Play", ctx.canvas.width / 2, ctx.canvas.height / 4 + 415);

        ctx.restore();
    }

    onClick() {
        if (isInside(inputSystem.mouse, {x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 4 + 400, width: 200, height: 20})) {
            assetsLoader.assets.button_sound.playFromStart();
            if (this.redirectedFromMenu) {
                sceneManager.setCurrentScene("menu");
            } else {
                sceneManager.setCurrentScene("game");
            }
        }
    }

    update(dt) {
        if (isInside(inputSystem.mouse, {x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 4 + 400, width: 200, height: 20})) {
            canvasHandler.changeCursor("pointer");
        } else {
            canvasHandler.changeCursor("default");
        }
    }

    destroy() {
        inputSystem.removeKeyPressListener(this.escapeKeyListener, "quit");
        inputSystem.removeClickListener(this.leftClickListener, "left");
        canvasHandler.changeCursor("default");
    }
});

sceneManager.addScene("hasNotSeenTutorial", class extends Scene {
    constructor(name) {
        super(name);

        this.escapeKeyListener = inputSystem.addKeyPressListener(() => {
            sceneManager.setCurrentScene("menu");
        }, "quit");
        this.leftClickListener = inputSystem.addClickListener(this.onClick.bind(this), "left");
    }

    animate(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();

        // draw text
        ctx.fillStyle = "white";
        ctx.font = "30px Retro";
        ctx.textAlign = "center";
        ctx.fillText("You have not seen the tutorial", ctx.canvas.width / 2, ctx.canvas.height / 2);

        // draw back buttton and title
        // draw see tutorial buttton and title
        ctx.fillStyle = "white";
        ctx.fillRect(ctx.canvas.width / 2 - 100, ctx.canvas.height / 2 + 100, 200, 20);

        // draw back text
        ctx.fillStyle = "black";
        ctx.font = "15px Retro";
        ctx.fillText("See Tutorial", ctx.canvas.width / 2, ctx.canvas.height / 2 + 115);

        // draw continue button
        ctx.fillStyle = "white";
        ctx.fillRect(ctx.canvas.width / 2 - 100, ctx.canvas.height / 2 + 150, 200, 20);

        // draw back text
        ctx.fillStyle = "black";
        ctx.font = "15px Retro";
        ctx.fillText("Continue", ctx.canvas.width / 2, ctx.canvas.height / 2 + 165);

        ctx.restore();
    }

    onClick() {
        if (isInside(inputSystem.mouse, {x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 100, width: 200, height: 20})) {
            assetsLoader.assets.button_sound.playFromStart();
            sceneManager.setCurrentScene("tutorial");
        } else if (isInside(inputSystem.mouse, {x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 150, width: 200, height: 20})) {
            assetsLoader.assets.button_sound.playFromStart();

            hasSeenTutorial = true;
            localStorage.setItem("hasSeenTutorial", "true");

            sceneManager.setCurrentScene("game");
        }
    }

    update(dt) {
        if (isInside(inputSystem.mouse, {x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 100, width: 200, height: 20})) {
            canvasHandler.changeCursor("pointer");
        } else if (isInside(inputSystem.mouse, {x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 150, width: 200, height: 20})) {
            canvasHandler.changeCursor("pointer");
        } else {
            canvasHandler.changeCursor("default");
        }
    }

    destroy() {
        inputSystem.removeKeyPressListener(this.escapeKeyListener, "quit");
        inputSystem.removeClickListener(this.leftClickListener, "left");
        canvasHandler.changeCursor("default");
    }
});

sceneManager.addScene("game", class extends Scene {
    constructor(name) {
        super(name);

        this.player = {
            x: MAZE_GRID_SIZE / 2,
            y: MAZE_GRID_SIZE / 2,
            velx: 0,
            vely: 0
        }

        this.camera = {
            x: this.player.x,
            y: this.player.y
        }

        this.enemy = {
            x: MAZE_GRID_SIZE * (mazeCols - 1) + MAZE_GRID_SIZE / 2,
            y: MAZE_GRID_SIZE * (mazeRows - 1) + MAZE_GRID_SIZE / 2,
            velx: 0,
            vely: 0
        }

        this.particles = [];
        this.maze = generateMaze(mazeCols, mazeRows);
        this.lightOn = false;
        this.touchingSides = {
            left: false,
            right: false,
            top: false,
            bottom: false
        }

        this.escapeKeyListener = inputSystem.addKeyPressListener(() => {
            sceneManager.setCurrentScene("gameOver");
        }, "quit");

        this.showKeysKeyListener = inputSystem.addKeyPressListener(() => {
            showKeys = !showKeys;
            localStorage.setItem("showKeys", showKeys);
        }, "keys");

        this.lightOnTime = 0;

        assetsLoader.assets.track1.fadeInAndLoop(10, 0.4);
    }

    drawParticles(ctx) {
        ctx.save();

        this.particles.forEach((particle) => {
            if (!particle.relative) {
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // draw particles
        ctx.translate(-this.camera.x, -this.camera.y);
        this.particles.forEach((particle) => {
            if (particle.relative) {
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.restore();
    }

    drawMaze(ctx) {
        ctx.save();

        // draw maze
        ctx.strokeStyle = "white";
        ctx.lineWidth = MAZE_LINE_WIDTH;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.maze.length * MAZE_GRID_SIZE);
        ctx.lineTo(this.maze[0].length * MAZE_GRID_SIZE, this.maze.length * MAZE_GRID_SIZE);
        ctx.lineTo(this.maze[0].length * MAZE_GRID_SIZE, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();

        ctx.beginPath();
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                const cell = this.maze[y][x];

                if (cell.right && x != this.maze[y].length - 1) {
                    ctx.moveTo((x + 1) * MAZE_GRID_SIZE, y * MAZE_GRID_SIZE);
                    ctx.lineTo((x + 1) * MAZE_GRID_SIZE, (y + 1) * MAZE_GRID_SIZE);
                }

                if (cell.bottom && y != this.maze.length - 1) {
                    ctx.moveTo(x * MAZE_GRID_SIZE, (y + 1) * MAZE_GRID_SIZE);
                    ctx.lineTo((x + 1) * MAZE_GRID_SIZE, (y + 1) * MAZE_GRID_SIZE);
                }
            }
        }
        ctx.stroke();

        ctx.restore();
    }

    drawGame(ctx) {
        // save ctx
        // everything is relative to the player as the camera is fixed onto the player
        ctx.save();
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);

        // translate to the cameras's position
        ctx.translate(-this.camera.x, -this.camera.y);

        // draw the maze
        if (this.lightOn) {
            this.drawMaze(ctx);
            ctx.fillStyle = "red";
            ctx.fillRect(this.enemy.x - 10, this.enemy.y - 10, 20, 20);
        }

        // draw the player
        ctx.fillStyle = "green";
        ctx.fillRect(this.player.x - 10, this.player.y - 10, 20, 20);

        // finish drawing
        ctx.restore();
    }

    drawUI(ctx) {
        ctx.save();

        // make a grey box on theright side of the screen that takes 25% of the screen width and 100% height
        ctx.drawImage(assetsLoader.assets.table.img, 0, 0, 150, ctx.canvas.height);

        // draw black and red wires from the top left of the switch to the top of the table
        ctx.strokeStyle = "black";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(25, 0);
        ctx.lineTo(25, ctx.canvas.height / 2);
        ctx.stroke();

        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(30, ctx.canvas.height / 2);
        ctx.stroke();

        // draw a rectangle int the middle of the box that takes up 75% width and 50% height
        ctx.drawImage(assetsLoader.assets.switch.img, 20, (ctx.canvas.height / 2) - 100, 110, 200);

        // draw a circle in the middle that is black
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(75, ctx.canvas.height / 2, 25, 0, Math.PI * 2);
        ctx.fill();

        // if light on then draw a cirle int he down positon, else in the up position
        if (this.lightOn) {
            ctx.fillStyle = "grey";
            ctx.fillRect(65, ctx.canvas.height / 2, 20, 110);

            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(75, (ctx.canvas.height / 2) + 110, 25, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = "grey";
            ctx.fillRect(65, ctx.canvas.height / 2, 20, -110);

            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(75, (ctx.canvas.height / 2) - 110, 25, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw the keys in the bottomleft corner of the screen and use a faint black background
        if (showKeys) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.fillRect(ctx.canvas.width - 150, 0, 150, 400);

            ctx.fillStyle = "white";
            ctx.font = "13px Retro";

            ctx.drawImage(assetsLoader.assets.key_w.img, ctx.canvas.width - 150, 0, 50, 50);
            ctx.fillText("Move Forward", ctx.canvas.width - 90, 30);

            ctx.drawImage(assetsLoader.assets.key_a.img, ctx.canvas.width - 150, 50, 50, 50);
            ctx.fillText("Move Left", ctx.canvas.width - 90, 80);

            ctx.drawImage(assetsLoader.assets.key_s.img, ctx.canvas.width - 150, 100, 50, 50);
            ctx.fillText("Move Backward", ctx.canvas.width - 90, 130);

            ctx.drawImage(assetsLoader.assets.key_d.img, ctx.canvas.width - 150, 150, 50, 50);
            ctx.fillText("Move Right", ctx.canvas.width - 90, 180);

            ctx.drawImage(assetsLoader.assets.key_space.img, ctx.canvas.width - 150, 200, 50, 50);
            ctx.fillText("Toggle Light", ctx.canvas.width - 90, 230);

            ctx.drawImage(assetsLoader.assets.key_q.img, ctx.canvas.width - 150, 250, 50, 50);
            ctx.fillText("Toggle Debug", ctx.canvas.width - 90, 280);

            ctx.drawImage(assetsLoader.assets.key_k.img, ctx.canvas.width - 150, 300, 50, 50);
            ctx.fillText("Toggle Keys", ctx.canvas.width - 90, 330);

            ctx.drawImage(assetsLoader.assets.key_escape.img, ctx.canvas.width - 150, 350, 50, 50);
            ctx.fillText("Quit", ctx.canvas.width - 90, 380);
        }

        // draw 4 mobile buttons using arrows as text at the bottom left in 
        if (IS_MOBILE) {
            if (this.lightOn) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
            } else {
                ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            }
        
            ctx.fillRect(ctx.canvas.width - 160, ctx.canvas.height - 240, 80, 80);
            ctx.fillRect(ctx.canvas.width - 240, ctx.canvas.height - 160, 80, 80);
            ctx.fillRect(ctx.canvas.width - 80, ctx.canvas.height - 160, 80, 80);
            ctx.fillRect(ctx.canvas.width - 160, ctx.canvas.height - 80, 80, 80);

            ctx.fillStyle = "white";
            ctx.font = "40px Retro";
            ctx.textAlign = "center";

            ctx.fillText("↑", ctx.canvas.width - 120, ctx.canvas.height - 190);
            ctx.fillText("←", ctx.canvas.width - 200, ctx.canvas.height - 110);
            ctx.fillText("→", ctx.canvas.width - 40, ctx.canvas.height - 110);
            ctx.fillText("↓", ctx.canvas.width - 120, ctx.canvas.height - 35);
        }

        ctx.restore();
    }

    animate(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.drawGame(ctx);
        this.drawUI(ctx);
        this.drawParticles(ctx);
    }

    updateParticles(dt) {
        this.particles.forEach((particle) => {
            if (particle.lifetime > 0) {
                particle.lifetime -= dt;
            } else {
                this.particles.splice(this.particles.indexOf(particle), 1);
                return;
            }

            particle.vely -= particle.gravity * dt;
            particle.x += particle.velx * dt;
            particle.y += particle.vely * dt;
        });
    }

    triggerSwitch() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                gravity: 9.8,
                x: 75,
                y: canvas.height / 2,
                velx: Math.random() * 100 - 50,
                vely: Math.random() * 100 - 50,
                color: "rgba(211, 211, 211, 0.25)",
                size: Math.random() * 5 + 5,
                relative: false,
                lifetime: 2
            })
        }
        assetsLoader.assets.switch_sound.playFromStart();
    }

    update(dt) {
        this.updateParticles(dt);

        // Light switch
        const hoverOverLight = isInside(inputSystem.mouse, {x: 20, y: ctx.canvas.height / 2 - 100, width: 110, height: 200});
        const userLightOn = inputSystem.isActionHeld("light") || (hoverOverLight && inputSystem.mouse.left);
        if (userLightOn != this.lightOn) {
            if (!userLightOn && this.lightOn && Date.now() - this.lightOnTime > 1000) {
                this.lightOn = false;
                this.triggerSwitch();
            } else if (userLightOn && !this.lightOn) {
                this.lightOn = true;
                this.lightOnTime = Date.now();
                this.triggerSwitch();
            }
        }

        let cursor = "default";

        if (hoverOverLight) {
            cursor = "pointer";
        }

        // Player
        if (!this.lightOn) {
            const forwardButton = {x: ctx.canvas.width - 160, y: ctx.canvas.height - 240, width: 80, height: 80};
            const leftButton = {x: ctx.canvas.width - 240, y: ctx.canvas.height - 160, width: 80, height: 80};
            const backwardButton = {x: ctx.canvas.width - 160, y: ctx.canvas.height - 80, width: 80, height: 80};
            const rightButton = {x: ctx.canvas.width - 80, y: ctx.canvas.height - 160, width: 80, height: 80};

            const hoverOverForward = isInside(inputSystem.mouse, forwardButton);
            const hoverOverLeft = isInside(inputSystem.mouse, leftButton);
            const hoverOverBackward = isInside(inputSystem.mouse, backwardButton);
            const hoverOverRight = isInside(inputSystem.mouse, rightButton);

            const userForward = inputSystem.isActionHeld("forward") || (hoverOverForward && inputSystem.mouse.left) || isTouchInside(inputSystem.touches, forwardButton);
            const userBackward = inputSystem.isActionHeld("backward") || (hoverOverBackward && inputSystem.mouse.left) || isTouchInside(inputSystem.touches, backwardButton);
            const userLeft = inputSystem.isActionHeld("left") || (hoverOverLeft && inputSystem.mouse.left) || isTouchInside(inputSystem.touches, leftButton);
            const userRight = inputSystem.isActionHeld("right") || (hoverOverRight && inputSystem.mouse.left) || isTouchInside(inputSystem.touches, rightButton);

            if (hoverOverForward || hoverOverLeft || hoverOverBackward || hoverOverRight) {
                cursor = "pointer";
            }

            if (userForward) {
                this.player.vely = -100;
            }
            if (userBackward) {
                this.player.vely = 100;
            }

            if (userLeft) {
                this.player.velx = -100;
            }
            if (userRight) {
                this.player.velx = 100;
            }

            if (!userForward && !userBackward) {
                this.player.vely = 0;
            }
            if (!userLeft && !userRight) {
                this.player.velx = 0;
            }

            if (userForward && userBackward) {
                this.player.vely = 0;
            }
            if (userLeft && userRight) {
                this.player.velx = 0;
            }

            const cellX = Math.floor(this.player.x / MAZE_GRID_SIZE);
            const cellY = Math.floor(this.player.y / MAZE_GRID_SIZE);
            const mazeCell = this.maze[cellY] != undefined && this.maze[cellY][cellX];

            const futureX = this.player.x + (this.player.velx * dt);
            const futureY = this.player.y + (this.player.vely * dt);

            const futureCellX = Math.floor(futureX / MAZE_GRID_SIZE);
            const futureCellY = Math.floor(futureY / MAZE_GRID_SIZE);

            const enterFutureRight = futureX > this.player.x && futureCellX != cellX;
            const enterFutureLeft = futureX < this.player.x && futureCellX != cellX;
            const enterFutureBottom = futureY > this.player.y && futureCellY != cellY;
            const enterFutureTop = futureY < this.player.y && futureCellY != cellY;

            if (mazeCell) {
                const hasTopFace = (cellY == 0) || (this.maze[cellY - 1] && this.maze[cellY - 1][cellX].bottom);
                const hasLeftFace = (cellX == 0) || (this.maze[cellY][cellX - 1] && this.maze[cellY][cellX - 1].right);
                const hasBottomFace = mazeCell.bottom;
                const hasRightFace = mazeCell.right;

                if (enterFutureRight && hasRightFace) {
                    this.player.velx = 0;
                    this.touchingSides.right = true;
                    this.touchingSides.left = false;
                } else if (enterFutureLeft && hasLeftFace) {
                    this.player.velx = 0;
                    this.touchingSides.left = true;
                    this.touchingSides.right = false;
                } else {
                    this.touchingSides.right = false;
                    this.touchingSides.left = false;
                }

                if (enterFutureBottom && hasBottomFace) {
                    this.player.vely = 0;
                    this.touchingSides.bottom = true;
                    this.touchingSides.top = false;
                } else if (enterFutureTop && hasTopFace) {
                    this.player.vely = 0;
                    this.touchingSides.top = true;
                    this.touchingSides.bottom = false;
                } else {
                    this.touchingSides.bottom = false;
                    this.touchingSides.top = false;
                }

                if (cellX == this.maze[cellY].length - 1 && cellY == this.maze.length - 1) {
                    mazeCols += Math.round(Math.pow(mazeCols, 0.25));
                    mazeRows += Math.round(Math.pow(mazeRows, 0.25));
                    passedLevels++;
                    sceneManager.setCurrentScene("nextLevel");
                }
            }

            this.enemy.velx = 0;
            this.enemy.vely = 0;
        } else {
            this.player.velx = 0;
            this.player.vely = 0;

            // move enemy towards player
            const dx = this.player.x - this.enemy.x;
            const dy = this.player.y - this.enemy.y;
            const angle = Math.atan2(dy, dx);
            const speed = 100;
            this.enemy.velx = Math.cos(angle) * speed;
            this.enemy.vely = Math.sin(angle) * speed;

            // check if enemy is touching player
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 20) {
                sceneManager.setCurrentScene("gameOver");
            }
        }

        this.player.x += this.player.velx * dt;
        this.player.y += this.player.vely * dt;

        // Enemy
        this.enemy.x += this.enemy.velx * dt;
        this.enemy.y += this.enemy.vely * dt;

        // Camera
        this.camera.x = lerp(this.camera.x, this.player.x, 0.5 + Math.sin(Date.now() / 100) * 0.1);
        this.camera.y = lerp(this.camera.y, this.player.y, 0.5 + Math.sin(Date.now() / 100) * 0.1);

        // Cursor
        canvasHandler.changeCursor(cursor);
    }

    destroy() {
        inputSystem.removeKeyPressListener(this.escapeKeyListener, "quit");
        inputSystem.removeKeyPressListener(this.showKeysKeyListener, "keys");
        canvasHandler.changeCursor("default");
        assetsLoader.assets.track1.fadeOutAndStop(10);
    }
});

sceneManager.addScene("gameOver", class extends Scene {
    constructor(name) {
        super(name);

        this.gotHighScore = passedLevels > highScore;
        setHighScore(Math.max(highScore, passedLevels));

        this.particles = [];

        if (this.gotHighScore) {
            for (let i = 0; i < 100; i++) {
                // draw confetti from top of screen with random colors. y is above the screen, x is a random point
                this.particles.push({
                    gravity: 9.8,
                    x: Math.random() * ctx.canvas.width,
                    y: -10,
                    velx: Math.random() * 100 - 50,
                    vely: Math.random() * 100 - 50,
                    color: "hsl(" + Math.random() * 360 + ", 100%, 50%)",
                    size: Math.random() * 5 + 5,
                    lifetime: 100
                })
            }
        }

        this.escapeKeyListener = inputSystem.addKeyPressListener(() => {
            sceneManager.setCurrentScene("menu");
        }, "quit");

        this.leftClickListener = inputSystem.addClickListener(this.onClick.bind(this), "left");
    }

    drawParticles(ctx) {
        ctx.save();

        this.particles.forEach((particle) => {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    animate(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();

        // draw text
        ctx.fillStyle = "white";
        ctx.font = "30px Retro";
        ctx.textAlign = "center";
        ctx.fillText("You Died", ctx.canvas.width / 2, ctx.canvas.height / 2);

        // draw how many levels passed
        ctx.fillStyle = "white";
        ctx.font = "15px Retro";
        ctx.fillText("You Passed " + passedLevels + " Levels", ctx.canvas.width / 2, ctx.canvas.height / 2 + 30);

        // draw high score
        ctx.fillStyle = "white";
        ctx.font = "15px Retro";
        ctx.fillText((this.gotHighScore ? "New " : "") + "High Score: " + highScore, ctx.canvas.width / 2, ctx.canvas.height / 2 + 60);

        // Draw the menu button
        ctx.fillStyle = "white";
        ctx.fillRect(ctx.canvas.width / 2 - 100, ctx.canvas.height / 2 + 150, 200, 20);

        ctx.fillStyle = "black";
        ctx.font = "15px Retro";
        ctx.fillText("Menu", ctx.canvas.width / 2, ctx.canvas.height / 2 + 165);

        ctx.restore();

        this.drawParticles(ctx);
    }

    onClick() {
        if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 150, width: 200, height: 20 })) {
            // Menu
            assetsLoader.assets.button_sound.playFromStart();
            sceneManager.setCurrentScene("menu");
        }
    }

    update(dt) {
        if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 150, width: 200, height: 20 })) {
            canvasHandler.changeCursor("pointer");
        } else {
            canvasHandler.changeCursor("default");
        }

        this.particles.forEach((particle) => {
            if (particle.lifetime > 0) {
                particle.lifetime -= dt;
            } else {
                this.particles.splice(this.particles.indexOf(particle), 1);
                return;
            }

            particle.vely -= particle.gravity * dt;
            particle.x += particle.velx * dt;
            particle.y += particle.vely * dt;
        });
    }

    destroy() {
        inputSystem.removeKeyPressListener(this.escapeKeyListener, "quit");
        inputSystem.removeClickListener(this.leftClickListener, "left");
        canvasHandler.changeCursor("default");
    }
});

sceneManager.addScene("nextLevel", class extends Scene {
    constructor(name) {
        super(name);

        this.timeUntilNextLevel = 3;
        this.currentTimeUntilNextLevel = this.timeUntilNextLevel;

        this.escapeKeyListener = inputSystem.addKeyPressListener(() => {
            sceneManager.setCurrentScene("gameOver");
        }, "quit");
    }

    animate(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();

        // draw text
        ctx.fillStyle = "white";
        ctx.font = "30px Retro";
        ctx.textAlign = "center";
        ctx.fillText("You Passed. For now...", ctx.canvas.width / 2, ctx.canvas.height / 2);

        // draw progress bar below text
        ctx.fillStyle = "transparent";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - 100, canvas.height / 2 + 50, 200, 20);

        ctx.fillStyle = "white";
        ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 50, 200 * (this.currentTimeUntilNextLevel / this.timeUntilNextLevel), 20);
        ctx.restore();


        ctx.restore();
    }

    update(dt) {
        this.currentTimeUntilNextLevel -= dt;

        if (this.currentTimeUntilNextLevel <= 0) {
            sceneManager.setCurrentScene("game");
        }
    }

    destroy() {
        inputSystem.removeKeyPressListener(this.escapeKeyListener, "quit");
    }
});

sceneManager.addScene("credits", class extends Scene {
    constructor(name) {
        super(name);

        this.escapeKeyListener = inputSystem.addKeyPressListener(() => {
            sceneManager.setCurrentScene("menu");
        }, "quit");

        this.leftClickListener = inputSystem.addClickListener(this.onClick.bind(this), "left");

        this.credits = fetch("credits.txt").then((response) => {
            return response.text();
        }).then((text) => {
            this.credits = text.split("\n");
        });

        this.confirmResetScreen = false;
    }

    animate(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();

        // draw text
        ctx.fillStyle = "white";
        ctx.font = "30px Retro";
        ctx.textAlign = "center";
        ctx.fillText("Credits", ctx.canvas.width / 2, ctx.canvas.height / 4);

        // draw credits
        ctx.fillStyle = "white";
        ctx.font = "15px Retro";
        ctx.textAlign = "center";

        if (this.credits) {
            for (let i = 0; i < this.credits.length; i++) {
                ctx.fillText(this.credits[i], ctx.canvas.width / 2, ctx.canvas.height / 4 + 50 + (i * 20));
            }
        }

        // draw back button
        ctx.fillStyle = "white";
        ctx.fillRect(ctx.canvas.width / 2 - 100, ctx.canvas.height / 2 + 150, 200, 20);

        // draw back text
        ctx.fillStyle = "black";
        ctx.font = "15px Retro";
        ctx.fillText("Back", ctx.canvas.width / 2, ctx.canvas.height / 2 + 165);

        // draw reset button
        ctx.fillStyle = "red";
        ctx.fillRect(ctx.canvas.width / 2 - 100, ctx.canvas.height / 2 + 200, 200, 20);

        // draw reset text
        ctx.fillStyle = "black";
        ctx.font = "15px Retro";
        ctx.fillText("Reset Game", ctx.canvas.width / 2, ctx.canvas.height / 2 + 215);

        // draw modal
        if (this.confirmResetScreen) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            ctx.fillStyle = "grey";
            ctx.fillRect(ctx.canvas.width / 2 - 150, ctx.canvas.height / 2 - 100, 300, 300);

            ctx.fillStyle = "white";
            ctx.font = "30px Retro";
            ctx.textAlign = "center";
            ctx.fillText("Are you sure?", ctx.canvas.width / 2, ctx.canvas.height / 2);

            // draw yes button
            ctx.fillStyle = "green";
            ctx.fillRect(ctx.canvas.width / 2 - 100, ctx.canvas.height / 2 + 50, 200, 20);

            // draw yes text
            ctx.fillStyle = "black";
            ctx.font = "15px Retro";
            ctx.fillText("Yes", ctx.canvas.width / 2, ctx.canvas.height / 2 + 65);

            // draw no button
            ctx.fillStyle = "red";
            ctx.fillRect(ctx.canvas.width / 2 - 100, ctx.canvas.height / 2 + 100, 200, 20);

            // draw no text
            ctx.fillStyle = "black";
            ctx.font = "15px Retro";
            ctx.fillText("No", ctx.canvas.width / 2, ctx.canvas.height / 2 + 115);
        }

        ctx.restore();
    }

    onClick() {
        if (this.confirmResetScreen) {
            if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 50, width: 200, height: 20 })) {
                // Yes
                assetsLoader.assets.button_sound.playFromStart();
                resetLocalStorage();
                this.confirmResetScreen = false;
            } else if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 100, width: 200, height: 20 })) {
                // No
                assetsLoader.assets.button_sound.playFromStart();
                this.confirmResetScreen = false;
            }
        } else {
            if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 150, width: 200, height: 20 })) {
                // Back
                assetsLoader.assets.button_sound.playFromStart();
                sceneManager.setCurrentScene("menu");
            } else if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 200, width: 200, height: 20 })) {
                // Reset Game
                assetsLoader.assets.button_sound.playFromStart();
                this.confirmResetScreen = true;
            }
        }
    }

    update(dt) {
        if (this.confirmResetScreen) {
            if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 50, width: 200, height: 20 })) {
                canvasHandler.changeCursor("pointer");
            } else if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 100, width: 200, height: 20 })) {
                canvasHandler.changeCursor("pointer");
            } else {
                canvasHandler.changeCursor("default");
            }
        } else {
            if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 150, width: 200, height: 20 })) {
                canvasHandler.changeCursor("pointer");
            } else if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 200, width: 200, height: 20 })) {
                canvasHandler.changeCursor("pointer");
            } else {
                canvasHandler.changeCursor("default");
            }
        }
    }

    destroy() {
        inputSystem.removeKeyPressListener(this.escapeKeyListener, "quit");
        inputSystem.removeClickListener(this.leftClickListener, "left");
        canvasHandler.changeCursor("default");
    }
});

sceneManager.addScene("menu", class extends Scene {
    constructor(name) {
        super(name);

        mazeCols = 5;
        mazeRows = 5;
        passedLevels = 0;

        this.leftClickListener = inputSystem.addClickListener(this.onClick.bind(this), "left");
    }

    animate(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();

        // draw text
        ctx.fillStyle = "white";
        ctx.font = "30px Retro";
        ctx.textAlign = "center";
        ctx.fillText("Maze Game", ctx.canvas.width / 2, ctx.canvas.height / 2);

        // make play buton in the middle, options button to the left, and tutorial button to the right
        ctx.fillStyle = "white";
        ctx.fillRect(ctx.canvas.width / 2 - 225, ctx.canvas.height / 2 + 50, 100, 20);
        ctx.fillRect(ctx.canvas.width / 2 - 100, ctx.canvas.height / 2 + 50, 200, 20);
        ctx.fillRect(ctx.canvas.width / 2 + 125, ctx.canvas.height / 2 + 50, 100, 20);

        // draw play text
        ctx.fillStyle = "black";
        ctx.font = "15px Retro";
        ctx.fillText("Play", ctx.canvas.width / 2, ctx.canvas.height / 2 + 65);

        // draw options text
        ctx.fillStyle = "black";
        ctx.font = "15px Retro";
        ctx.fillText("Credits", ctx.canvas.width / 2 - 175, ctx.canvas.height / 2 + 65);

        // draw tutorial text
        ctx.fillStyle = "black";
        ctx.font = "15px Retro";
        ctx.fillText("Tutorial", ctx.canvas.width / 2 + 175, ctx.canvas.height / 2 + 65);

        ctx.restore();
    }

    onClick() {
        if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 50, width: 200, height: 20 })) {
            // Play
            assetsLoader.assets.button_sound.playFromStart();
            if (hasSeenTutorial) {
                sceneManager.setCurrentScene("game");
            } else {
                sceneManager.setCurrentScene("hasNotSeenTutorial");
            }
        } else if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 - 225, y: ctx.canvas.height / 2 + 50, width: 100, height: 20 })) {
            // Options
            assetsLoader.assets.button_sound.playFromStart();
            sceneManager.setCurrentScene("credits");
        } else if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 + 125, y: ctx.canvas.height / 2 + 50, width: 100, height: 20 })) {
            // Tutorial
            assetsLoader.assets.button_sound.playFromStart();
            redirectedFromMenu = true;
            sceneManager.setCurrentScene("tutorial");
        }
    }

    update(dt) {
        if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 - 100, y: ctx.canvas.height / 2 + 50, width: 200, height: 20 })) {
            // Play
            canvasHandler.changeCursor("pointer");
        } else if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 - 225, y: ctx.canvas.height / 2 + 50, width: 100, height: 20 })) {
            // Options
            canvasHandler.changeCursor("pointer");
        } else if (isInside(inputSystem.mouse, { x: ctx.canvas.width / 2 + 125, y: ctx.canvas.height / 2 + 50, width: 100, height: 20 })) {
            // Tutorial
            canvasHandler.changeCursor("pointer");
        } else {
            canvasHandler.changeCursor("default");
        }
    }

    destroy() {
        inputSystem.removeClickListener(this.leftClickListener, "left");
        canvasHandler.changeCursor("default");
    }
});

sceneManager.addScene("loading", class extends Scene {
    constructor(name) {
        super(name);
    }

    animate(ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        // draw text
        ctx.fillStyle = "white";
        ctx.font = "30px Retro";
        ctx.textAlign = "center";
        ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2);

        // between the two draw the current asset loading
        ctx.fillText(assetsLoader.currentAssetLoading, canvas.width / 2, canvas.height / 2 + 30);

        // draw progress bar below text
        ctx.fillStyle = "transparent";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - 100, canvas.height / 2 + 50, 200, 20);

        ctx.fillStyle = "white";
        ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 50, 200 * assetsLoader.getLoadedPercentage(), 20);
        ctx.restore();
    }

    update(dt) {
        if (!assetsLoader.loading) {
            sceneManager.setCurrentScene("menu");
        }
    }
});

sceneManager.addOverlay("debug", class extends Scene {
    constructor(name) {
        super(name);

        this.debugStats = {
            fps: 0,
            updatesps: 0,
            canvasSize: "0x0"
        }

        this.debugKeyListener = inputSystem.addKeyPressListener(() => {
            sceneManager.showOverlay = !sceneManager.showOverlay;
        }, "debug");
    }

    animate(ctx) {
        ctx.save();

        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.fillRect(0, 0, 150, 120);
        ctx.fillStyle = "white";
        ctx.fillText("Updatesps: " + Math.round(canvasHandler.updatesps), 10, 20);
        ctx.fillText("FPS: " + Math.round(canvasHandler.fps), 10, 40);
        ctx.fillText("Canvas Size: " + ctx.canvas.width + "x" + ctx.canvas.height, 10, 60);
        ctx.fillText("Mouse: " + inputSystem.mouse.x + ", " + inputSystem.mouse.y, 10, 80);
        ctx.fillText("Current Scene: " + sceneManager.currentScene.name, 10, 100);

        ctx.restore();
    }

    destroy() {
        inputSystem.removeKeyPressListener(this.debugKeyListener, "debug");
    }
});

// Filter

const filterCanvas = document.getElementById("filter");
const filterCanvasHandler = new CanvasHandler(filterCanvas);
const filterGl = filterCanvas.getContext("webgl2", {
    desynchronized: true
});

const filterProgram = filterGl.createProgram();
const filterVertShader = filterGl.createShader(filterGl.VERTEX_SHADER);
const filterFragShader = filterGl.createShader(filterGl.FRAGMENT_SHADER);

filterGl.shaderSource(filterVertShader, `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;

    varying vec2 v_texCoord;

    void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = a_texCoord;
    }
`);

filterGl.shaderSource(filterFragShader, `
    precision mediump float;

    uniform sampler2D u_image;
    uniform vec2 u_resolution;
    uniform float u_time;

    varying vec2 v_texCoord;

    const float SCANLINE_STRENGTH = 0.1;
    const float SCANLINE_WIDTH = 3.0;
    const float SNOW_STRENGTH = 0.3;
    const float VIGNETTE_STRENGTH = 0.3;
    const float VIGNETTE_SIZE = 2.0;

    float randomizer = 0.0;

    float rand(vec2 co){
        float r = fract(sin(dot(co + randomizer, vec2(12.9898, 78.233))) * 43758.5453);
        randomizer = mod(sin(randomizer + r + 0.1), 1.0);
        return r;
    }
    
    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        float r = rand(v_texCoord + u_time);

        // setup
        float x = v_texCoord.x * u_resolution.x;
        float y = v_texCoord.y * u_resolution.y;
        color.a = 0.0;

        // scanlines
        if (mod(x, 10.0) <= SCANLINE_WIDTH) {
            color.a = SCANLINE_STRENGTH;
        }

        // snow
        color.a += r * SNOW_STRENGTH;

        // vignette
        vec2 center = u_resolution / 2.0;
        vec2 pos = vec2(x, y);
        vec2 halfSize = u_resolution.xy / 2.0;
        float distance = length((pos - center) / halfSize);
        float alpha = pow(distance, VIGNETTE_SIZE);
        color.a += alpha * VIGNETTE_STRENGTH;

        // clamp
        color.a = clamp(color.a, 0.0, 1.0);
        
        // color
        gl_FragColor = color;
    }
`);

filterGl.compileShader(filterVertShader);
filterGl.compileShader(filterFragShader);

filterGl.attachShader(filterProgram, filterVertShader);
filterGl.attachShader(filterProgram, filterFragShader);

filterGl.linkProgram(filterProgram);
filterGl.useProgram(filterProgram);

const filterPositionLocation = filterGl.getAttribLocation(filterProgram, "a_position");
const filterTexCoordLocation = filterGl.getAttribLocation(filterProgram, "a_texCoord");
const filterResolutionLocation = filterGl.getUniformLocation(filterProgram, "u_resolution");
const filterTimeLocation = filterGl.getUniformLocation(filterProgram, "u_time");

const filterPositionBuffer = filterGl.createBuffer();
filterGl.bindBuffer(filterGl.ARRAY_BUFFER, filterPositionBuffer);
filterGl.bufferData(filterGl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1
]), filterGl.STATIC_DRAW);

const filterTexCoordBuffer = filterGl.createBuffer();
filterGl.bindBuffer(filterGl.ARRAY_BUFFER, filterTexCoordBuffer);
filterGl.bufferData(filterGl.ARRAY_BUFFER, new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1
]), filterGl.STATIC_DRAW);

const filterTexture = filterGl.createTexture();
filterGl.bindTexture(filterGl.TEXTURE_2D, filterTexture);
filterGl.texParameteri(filterGl.TEXTURE_2D, filterGl.TEXTURE_WRAP_S, filterGl.CLAMP_TO_EDGE);
filterGl.texParameteri(filterGl.TEXTURE_2D, filterGl.TEXTURE_WRAP_T, filterGl.CLAMP_TO_EDGE);
filterGl.texParameteri(filterGl.TEXTURE_2D, filterGl.TEXTURE_MIN_FILTER, filterGl.NEAREST);
filterGl.texParameteri(filterGl.TEXTURE_2D, filterGl.TEXTURE_MAG_FILTER, filterGl.NEAREST);

filterCanvasHandler.addResizeListener(() => {
    filterGl.viewport(0, 0, filterCanvas.width, filterCanvas.height);
});

filterCanvasHandler.addAnimateListener(() => {
    filterGl.clearColor(1, 1, 1, 1);
    filterGl.colorMask(true, true, true, true);
    filterGl.clear(filterGl.COLOR_BUFFER_BIT);

    filterGl.useProgram(filterProgram);

    filterGl.enableVertexAttribArray(filterPositionLocation);
    filterGl.bindBuffer(filterGl.ARRAY_BUFFER, filterPositionBuffer);
    filterGl.vertexAttribPointer(filterPositionLocation, 2, filterGl.FLOAT, false, 0, 0);

    filterGl.enableVertexAttribArray(filterTexCoordLocation);
    filterGl.bindBuffer(filterGl.ARRAY_BUFFER, filterTexCoordBuffer);
    filterGl.vertexAttribPointer(filterTexCoordLocation, 2, filterGl.FLOAT, false, 0, 0);

    filterGl.uniform2f(filterResolutionLocation, filterCanvas.width, filterCanvas.height);
    filterGl.uniform1f(filterTimeLocation, performance.now() / 1000);

    filterGl.drawArrays(filterGl.TRIANGLES, 0, 6);
});

canvasHandler.addAnimateListener(sceneManager.animate.bind(sceneManager));
canvasHandler.addUpdateListener(sceneManager.update.bind(sceneManager));

sceneManager.setCurrentScene("loading");
sceneManager.setOverlayScene("debug");