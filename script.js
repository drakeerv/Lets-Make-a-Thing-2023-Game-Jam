"use strict";

import { AssetLoader } from "./src/asset.js";
import InputSystem from "./src/controller.js";
import CanvasHandler from "./src/canvas.js";
import generateMaze from "./src/maze.js";
import { Scene, SceneManager } from "./src/scene.js";

// Canvas

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", {
    alpha: false,
    desynchronized: true
});
const canvasHandler = new CanvasHandler(canvas);

// Constants

const MAZE_GRID_SIZE = 50;
const MAZE_COLS = 10;
const MAZE_ROWS = 20;

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
    "track1": "assets/music/track1.ogg"
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

let showKeys = true;

// Scenes

const sceneManager = new SceneManager(ctx);

sceneManager.addScene("game", class extends Scene {
    constructor(name) {
        super(name);

        this.camera = {
            x: 0,
            y: 0
        }

        this.player = {
            x: MAZE_GRID_SIZE / 2,
            y: MAZE_GRID_SIZE / 2,
            velx: 0,
            vely: 0
        }

        this.enemy = {
            x: 0,
            y: 0,
            velx: 0,
            vely: 0
        }

        this.particles = [];
        this.maze = generateMaze(MAZE_COLS, MAZE_ROWS);
        this.lightOn = false;

        this.escapeKeyListener = inputSystem.addKeyPressListener(() => {
            sceneManager.setCurrentScene("menu");
        }, "quit");

        this.showKeysKeyListener = inputSystem.addKeyPressListener(() => {
            console.log("toggle keys");
            showKeys = !showKeys;
        }, "keys");

        assetsLoader.assets.track1.fadeInAndLoop(10);
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
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.maze.length * MAZE_GRID_SIZE);
        ctx.lineTo(this.maze[0].length * MAZE_GRID_SIZE, this.maze.length * MAZE_GRID_SIZE);
        ctx.lineTo(this.maze[0].length * MAZE_GRID_SIZE, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();

        ctx.beginPath();
        for (let i = 0; i < this.maze.length; i++) {
            for (let j = 0; j < this.maze[i].length; j++) {
                const cell = this.maze[i][j];
                if (cell.right && j != this.maze[i].length - 1) {
                    ctx.moveTo((i + 1) * 50, j * 50);
                    ctx.lineTo((i + 1) * 50, (j + 1) * 50);
                }
                if (cell.bottom && i != this.maze.length - 1) {
                    ctx.moveTo(i * 50, (j + 1) * 50);
                    ctx.lineTo((i + 1) * 50, (j + 1) * 50);
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

    update(dt) {
        this.updateParticles(dt);

        // Light switch
        if (inputSystem.isActionHeld("light") != this.lightOn) {
            this.lightOn = !this.lightOn;

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

        // Player
        if (!this.lightOn) {
            if (inputSystem.isActionHeld("forward")) {
                this.player.vely = -100;
            }
            if (inputSystem.isActionHeld("backward")) {
                this.player.vely = 100;
            }

            if (inputSystem.isActionHeld("left")) {
                this.player.velx = -100;
            }
            if (inputSystem.isActionHeld("right")) {
                this.player.velx = 100;
            }

            if (!inputSystem.isActionHeld("forward") && !inputSystem.isActionHeld("backward")) {
                this.player.vely = 0;
            }
            if (!inputSystem.isActionHeld("left") && !inputSystem.isActionHeld("right")) {
                this.player.velx = 0;
            }

            if (inputSystem.isActionHeld("forward") && inputSystem.isActionHeld("backward")) {
                this.player.vely = 0;
            }
            if (inputSystem.isActionHeld("left") && inputSystem.isActionHeld("right")) {
                this.player.velx = 0;
            }

            if (this.player.velx > 0 || this.player.vely > 0) {
                const cellX = (this.player.x / MAZE_GRID_SIZE) | 0;
                const cellY = (this.player.y / MAZE_GRID_SIZE) | 0;
                const mazeCell = this.maze[cellY][cellX];

                const futureX = this.player.x + (this.player.velx * dt);
                const futureY = this.player.y + (this.player.vely * dt);
                
                const futureCellX = (futureX / MAZE_GRID_SIZE) | 0;
                const futureCellY = (futureY / MAZE_GRID_SIZE) | 0;
                const futureMazeCell = this.maze[futureCellY][futureCellX];

                if (mazeCell) {
                    const xPositionInCell = (this.player.x % MAZE_GRID_SIZE) + (this.player.velx * dt);
                    const yPositionInCell = (this.player.y % MAZE_GRID_SIZE) + (this.player.vely * dt);

                    const hasTopFace = (cellY == 0) || (this.maze[cellY - 1] && this.maze[cellY - 1][cellX].bottom);
                    const hasLeftFace = (cellX == 0) || (this.maze[cellY][cellX - 1] && this.maze[cellY][cellX - 1].right);
                    const hasBottomFace = mazeCell.bottom;
                    const hasRightFace = mazeCell.right;

                    if (xPositionInCell < 5) {
                        console.log(xPositionInCell);
                        this.player.velx = 0;
                        this.player.x = 5;
                    } else if (xPositionInCell > MAZE_GRID_SIZE - 5) {
                        this.player.velx = 0;
                        this.player.x = MAZE_GRID_SIZE - 5;
                    }

                    if (yPositionInCell < 5) {

                    } else if (yPositionInCell > MAZE_GRID_SIZE - 5) {

                    }
                }
            }
        } else {
            this.player.velx = 0;
            this.player.vely = 0;
        }

        this.player.x += this.player.velx * dt;
        this.player.y += this.player.vely * dt;

        // Enemy
        this.enemy.x += this.enemy.velx * dt;
        this.enemy.y += this.enemy.vely * dt;

        // Camera
        this.camera.x = this.player.x;
        this.camera.y = this.player.y;
    }

    destroy() {
        inputSystem.removeKeyPressListener(this.escapeKeyListener, "quit");
        inputSystem.removeKeyPressListener(this.showKeysKeyListener, "keys");
        assetsLoader.assets.track1.fadeOutAndStop(10);
    }
});

sceneManager.addScene("options", class extends Scene {
    constructor(name) {
        super(name);

        this.escapeKeyListener = inputSystem.addKeyPressListener(() => {
            sceneManager.setCurrentScene("menu");
        }, "quit");
    }

    animate(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();

        // draw text
        ctx.fillStyle = "white";
        ctx.font = "30px Retro";
        ctx.textAlign = "center";
        ctx.fillText("Options", ctx.canvas.width / 2, ctx.canvas.height / 2);

        // draw back buttton and title

        // draw back button
        ctx.fillStyle = "white";
        ctx.fillRect(ctx.canvas.width / 2 - 100, ctx.canvas.height / 2 + 150, 200, 20);

        // draw back text
        ctx.fillStyle = "black";
        ctx.font = "15px Retro";
        ctx.fillText("Back", ctx.canvas.width / 2, ctx.canvas.height / 2 + 165);

        ctx.restore();
    }

    update(dt) {
        if (inputSystem.mouse.x > ctx.canvas.width / 2 - 100 && inputSystem.mouse.x < ctx.canvas.width / 2 + 100 && inputSystem.mouse.y > ctx.canvas.height / 2 + 150 && inputSystem.mouse.y < ctx.canvas.height / 2 + 170) {
            canvasHandler.changeCursor("pointer");

            if (inputSystem.mouse.left) {
                canvasHandler.changeCursor("default");
                sceneManager.setCurrentScene("menu");
            }
        } else {
            canvasHandler.changeCursor("default");
        }
    }

    destroy() {
        inputSystem.removeKeyPressListener(this.escapeKeyListener, "quit");
    }
});

sceneManager.addScene("menu", class extends Scene {
    constructor(name) {
        super(name);
    }

    animate(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();

        // draw text
        ctx.fillStyle = "white";
        ctx.font = "30px Retro";
        ctx.textAlign = "center";
        ctx.fillText("Maze Game", ctx.canvas.width / 2, ctx.canvas.height / 2);

        // draw play buttton and title

        // draw play button
        ctx.fillStyle = "white";
        ctx.fillRect(ctx.canvas.width / 2 - 100, ctx.canvas.height / 2 + 50, 200, 20);

        // draw play text
        ctx.fillStyle = "black";
        ctx.font = "15px Retro";
        ctx.fillText("Play", ctx.canvas.width / 2, ctx.canvas.height / 2 + 65);

        // draw options button
        ctx.fillStyle = "white";
        ctx.fillRect(ctx.canvas.width / 2 - 100, ctx.canvas.height / 2 + 100, 200, 20);

        // draw options text
        ctx.fillStyle = "black";
        ctx.font = "15px Retro";
        ctx.fillText("Options", ctx.canvas.width / 2, ctx.canvas.height / 2 + 115);

        ctx.restore();
    }

    update(dt) {
        if (inputSystem.mouse.x > ctx.canvas.width / 2 - 100 && inputSystem.mouse.x < ctx.canvas.width / 2 + 100) {
            if (inputSystem.mouse.y > ctx.canvas.height / 2 + 50 && inputSystem.mouse.y < ctx.canvas.height / 2 + 70) {
                // Play
                canvasHandler.changeCursor("pointer");

                if (inputSystem.mouse.left) {
                    canvasHandler.changeCursor("default");
                    sceneManager.setCurrentScene("game");
                }
            } else if (inputSystem.mouse.y > ctx.canvas.height / 2 + 100 && inputSystem.mouse.y < ctx.canvas.height / 2 + 120) {
                // Options
                canvasHandler.changeCursor("pointer");

                if (inputSystem.mouse.left) {
                    sceneManager.setCurrentScene("options");
                    canvasHandler.changeCursor("default");
                }
            } else {
                canvasHandler.changeCursor("default");
            }
        } else {
            canvasHandler.changeCursor("default");
        }
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
const filterCtx = filterCanvas.getContext("2d", {
    alpha: true,
    desynchronized: true
});
const filterCanvasHandler = new CanvasHandler(filterCanvas);
let cachedImageBuffer = null;
let frame = 0;

function colorToHex(r, g, b, a) {
    return (a << 24) | (b << 16) | (g << 8) | r;
}

function generateRandomSnow() {
    return ((75 * Math.random()) | 0) << 24;
}

filterCanvasHandler.addResizeListener(() => {
    const buffer = new Uint32Array(filterCanvas.width * filterCanvas.height);

    for (let x = 0; x < filterCanvas.width; x += 10) {
        for (let y = 0; y < filterCanvas.height; y++) {
            buffer[x + y * filterCanvas.width] = colorToHex(0, 0, 0, 50);
        }
    }
    cachedImageBuffer = buffer;
});

// filterCanvasHandler.addAnimateListener(() => {
//     if (frame % 10 == 0) {
//         const buffer = cachedImageBuffer.slice();

//         for (let i = 0; i < buffer.length; i++) {
//             buffer[i] += generateRandomSnow();
//         }

//         const imageData = new ImageData(new Uint8ClampedArray(buffer.buffer), filterCanvas.width, filterCanvas.height);
//         filterCtx.putImageData(imageData, 0, 0);
//     }

//     frame++;
// });

canvasHandler.addAnimateListener(sceneManager.animate.bind(sceneManager));
canvasHandler.addUpdateListener(sceneManager.update.bind(sceneManager));

sceneManager.setCurrentScene("loading");
sceneManager.setOverlayScene("debug");