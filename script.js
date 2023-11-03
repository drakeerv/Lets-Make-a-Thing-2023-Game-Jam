"use strict";

import { AssetLoader } from "./src/asset.js";
import InputSystem from "./src/controller.js";
import CanvasHandler from "./src/canvas.js";
import generateMaze from "./src/maze.js";

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
const MAZE_ROWS = 10;

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
    "key_k": "assets/keys/k.png"
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
    "keys": ["k"]
}, canvas);

// Game

const player = {
    x: MAZE_GRID_SIZE / 2,
    y: MAZE_GRID_SIZE / 2,
    velx: 0,
    vely: 0
}

const enemy = {
    x: 0,
    y: 0,
    velx: 0,
    vely: 0
}

let particles = [];
let maze = [];
let debugStats = {
    show: false,
    fps: 0,
    updatesps: 0,
    canvasSize: "0x0"
}
let lightOn = false;
let showKeys = true;
let inMainMenu = true;

function drawUI() {
    // save ctx
    ctx.save();

    // make a grey box on theright side of the screen that takes 25% of the screen width and 100% height
    ctx.drawImage(assetsLoader.assets.table.img, 0, 0, 150, canvas.height);

    // draw black and red wires from the top left of the switch to the top of the table
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(25, canvas.height / 2);
    ctx.stroke();

    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(30, canvas.height / 2);
    ctx.stroke();

    // draw a rectangle int the middle of the box that takes up 75% width and 50% height
    ctx.drawImage(assetsLoader.assets.switch.img, 20, (canvas.height / 2) - 100, 110, 200);

    // draw a circle in the middle that is black
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(75, canvas.height / 2, 25, 0, Math.PI * 2);
    ctx.fill();

    // if light on then draw a cirle int he down positon, else in the up position
    if (lightOn) {
        ctx.fillStyle = "grey";
        ctx.fillRect(65, canvas.height / 2, 20, 110);

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(75, (canvas.height / 2) + 110, 25, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = "grey";
        ctx.fillRect(65, canvas.height / 2, 20, -110);

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(75, (canvas.height / 2) - 110, 25, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw the keys in the bottomleft corner of the screen and use a faint black background
    if (showKeys) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillRect(canvas.width - 150, 0, 150, 350);

        ctx.fillStyle = "white";
        ctx.font = "12px Arial";

        ctx.drawImage(assetsLoader.assets.key_w.img, canvas.width - 150, 0, 50, 50);
        ctx.fillText("Move Forward", canvas.width - 90, 30);

        ctx.drawImage(assetsLoader.assets.key_a.img, canvas.width - 150, 50, 50, 50);
        ctx.fillText("Move Left", canvas.width - 90, 80);

        ctx.drawImage(assetsLoader.assets.key_s.img, canvas.width - 150, 100, 50, 50);
        ctx.fillText("Move Backward", canvas.width - 90, 130);

        ctx.drawImage(assetsLoader.assets.key_d.img, canvas.width - 150, 150, 50, 50);
        ctx.fillText("Move Right", canvas.width - 90, 180);

        ctx.drawImage(assetsLoader.assets.key_space.img, canvas.width - 150, 200, 50, 50);
        ctx.fillText("Toggle Light", canvas.width - 90, 230);

        ctx.drawImage(assetsLoader.assets.key_q.img, canvas.width - 150, 250, 50, 50);
        ctx.fillText("Toggle Debug", canvas.width - 90, 280);

        ctx.drawImage(assetsLoader.assets.key_k.img, canvas.width - 150, 300, 50, 50);
        ctx.fillText("Toggle Keys", canvas.width - 90, 330);
    }

    // restore ctx
    ctx.restore();
}

maze = generateMaze(MAZE_COLS, MAZE_ROWS);
enemy.x = (MAZE_COLS * MAZE_GRID_SIZE) - MAZE_GRID_SIZE / 2;
enemy.y = (MAZE_ROWS * MAZE_GRID_SIZE) - MAZE_GRID_SIZE / 2;
console.log(maze);
function drawMaze() {
    // save ctx
    ctx.save();

    // draw maze
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, MAZE_ROWS * MAZE_GRID_SIZE);
    ctx.lineTo(MAZE_COLS * MAZE_GRID_SIZE, MAZE_ROWS * MAZE_GRID_SIZE);
    ctx.lineTo(MAZE_COLS * MAZE_GRID_SIZE, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < maze.length; i++) {
        for (let j = 0; j < maze[i].length; j++) {
            const cell = maze[i][j];
            if (cell.right && j != maze[i].length - 1) {
                ctx.moveTo((i + 1) * 50, j * 50);
                ctx.lineTo((i + 1) * 50, (j + 1) * 50);
            }
            if (cell.bottom && i != maze.length - 1) {
                ctx.moveTo(i * 50, (j + 1) * 50);
                ctx.lineTo((i + 1) * 50, (j + 1) * 50);
            }
        }
    }
    ctx.stroke();

    // restore ctx
    ctx.restore();
}

function drawLoadingScene() {
    // save ctx
    ctx.save();

    // draw text
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
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

    // restore ctx
    ctx.restore();
}

function drawMenuScene() {
    // draw play buttton and title

    // save ctx
    ctx.save();

    // draw text
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Maze Game", canvas.width / 2, canvas.height / 2);

    // draw play button
    ctx.fillStyle = "transparent";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 100, canvas.height / 2 + 50, 200, 20);

    ctx.fillStyle = "white";
    ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 50, 200, 20);

    // draw play text
    ctx.fillStyle = "black";
    ctx.font = "15px Arial";
    ctx.fillText("Play", canvas.width / 2, canvas.height / 2 + 65);

    // restore ctx
    ctx.restore();
}

function drawGameScene() {
    // save ctx
    // everything is relative to the player as the camera is fixed onto the player
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // draw the player
    ctx.fillStyle = "green";
    ctx.fillRect(-10, -10, 20, 20);

    // translate to the player's position
    ctx.translate(-player.x, -player.y);

    // draw the maze
    // if (lightOn) {
    drawMaze();
    ctx.fillStyle = "red";
    ctx.fillRect(enemy.x - 10, enemy.y - 10, 20, 20);

    // draw the enemy img
    // ctx.imageSmoothingEnabled = false;
    // ctx.drawImage(assetLoader.assets.enemy_idle.img, enemy.x - 50, enemy.y - 50, 100, 100);
    // ctx.imageSmoothingEnabled = true;
    // }

    // draw particles
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        if (particle.relative) {
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        }
        ctx.fill();
    }

    // finish drawing
    ctx.restore();

    // draw ui on top of everything
    drawUI();
}


canvasHandler.addAnimateListener(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw loading screen
    ctx.save();
    if (assetsLoader.loading) {
        drawLoadingScene();
    } else if (inMainMenu) {
        drawMenuScene();
    } else {
        drawGameScene();
    }
    ctx.restore();

    // draw debug
    ctx.fillStyle = "white";
    ctx.font = "15px Arial";

    if (debugStats.show) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, 150, 80);
        ctx.fillStyle = "white";
        ctx.fillText("Updatesps: " + debugStats.updatesps, 10, 20);
        ctx.fillText("FPS: " + debugStats.fps, 10, 40);
        ctx.fillText("Canvas Size: " + debugStats.canvasSize, 10, 60);
    }


    // draw particles
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        if (!particle.relative) {
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        }
        ctx.fill();
    }
});

function updateLoadingScene(dt) {
}

function updateMenuScene(dt) {
    // see if mouse is within the play button
    // console.log(inputSystem.mouse);
    // inputSystem.mouse is relative to the canvas
    if (inputSystem.mouse.x > canvas.width / 2 - 100 && inputSystem.mouse.x < canvas.width / 2 + 100) {
        if (inputSystem.mouse.y > canvas.height / 2 + 50 && inputSystem.mouse.y < canvas.height / 2 + 70) {
            canvasHandler.changeCursor("pointer");
        }
    }
}

function updateGameScene(dt) {
    // Light switch
    if (inputSystem.isActionHeld("light") != lightOn) {
        lightOn = !lightOn;

        for (let i = 0; i < 10; i++) {
            particles.push({
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
    if (!lightOn) {
        if (inputSystem.isActionHeld("forward")) {
            player.vely = -100;
        }
        if (inputSystem.isActionHeld("backward")) {
            player.vely = 100;
        }

        if (inputSystem.isActionHeld("left")) {
            player.velx = -100;
        }
        if (inputSystem.isActionHeld("right")) {
            player.velx = 100;
        }

        if (!inputSystem.isActionHeld("forward") && !inputSystem.isActionHeld("backward")) {
            player.vely = 0;
        }
        if (!inputSystem.isActionHeld("left") && !inputSystem.isActionHeld("right")) {
            player.velx = 0;
        }
    } else {
        player.velx = 0;
        player.vely = 0;
    }

    player.x += player.velx * dt;
    player.y += player.vely * dt;

    // Enemy
    enemy.x += enemy.velx * dt;
    enemy.y += enemy.vely * dt;
}

canvasHandler.addUpdateListener((dt) => {
    if (assetsLoader.loading) {
        updateLoadingScene(dt);
    } else if (inMainMenu) {
        updateMenuScene(dt);
    } else {
        updateGameScene(dt);
    }

    // Particles
    particles.forEach((particle) => {
        if (particle.lifetime > 0) {
            particle.lifetime -= dt;
        } else {
            particles.splice(particles.indexOf(particle), 1);
            return;
        }

        particle.vely -= particle.gravity * dt;
        particle.x += particle.velx * dt;
        particle.y += particle.vely * dt;
    });

    // Debug
    debugStats.canvasSize = canvas.width + "x" + canvas.height;
    debugStats.updatesps = Math.round(canvasHandler.updatesps);
    debugStats.fps = Math.round(canvasHandler.fps);
});

inputSystem.addKeyPressListener(() => {
    debugStats.show = !debugStats.show;
}, "debug");

inputSystem.addKeyPressListener(() => {
    showKeys = !showKeys;
}, "keys");