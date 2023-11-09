"use strict";

// maze generator that outputs a 2d array of {right: bool, bottom: bool} if it has a right or bottom is indicated if it has a side. in the size of 
function generateMaze(width, height) {
    const maze = [];
    for (let i = 0; i < height; i++) {
        maze.push([]);
        for (let j = 0; j < width; j++) {
            maze[i].push({ right: true, bottom: true, x: j, y: i, visited: false });
        }
    }

    const stack = [];
    let current = maze[0][0];
    maze[0][0].visited = true;

    // top is either row 0 or if the cell above's bottom is true
    // left is either column 0 or if the cell to the left's right is true
    // bottom is current cell's bottom or if the row is the last row
    // right is current cell's right or if the column is the last column

    function removeWallBetweenCells(cell1, cell2) {
        if (cell1.y === cell2.y) {
            if (cell1.x > cell2.x) {
                removeWall(cell1, "left");
            } else {
                removeWall(cell1, "right");
            }
        } else {
            if (cell1.y > cell2.y) {
                removeWall(cell1, "top");
            } else {
                removeWall(cell1, "bottom");
            }
        }
    }

    function removeWall(cell, side) {
        switch (side) {
            case "top":
                maze[cell.y - 1][cell.x].bottom = false;
                break;
            case "left":
                maze[cell.y][cell.x - 1].right = false;
                break;
            case "bottom":
                maze[cell.y][cell.x].bottom = false;
                break;
            case "right":
                maze[cell.y][cell.x].right = false;
                break;
        }
    }

    function getNeighbors(cell) {
        const neighbors = [];
        if (cell.y > 0 && !maze[cell.y - 1][cell.x].visited) {
            neighbors.push(maze[cell.y - 1][cell.x]);
        }
        if (cell.x > 0 && !maze[cell.y][cell.x - 1].visited) {
            neighbors.push(maze[cell.y][cell.x - 1]);
        }
        if (cell.y < height - 1 && !maze[cell.y + 1][cell.x].visited) {
            neighbors.push(maze[cell.y + 1][cell.x]);
        }
        if (cell.x < width - 1 && !maze[cell.y][cell.x + 1].visited) {
            neighbors.push(maze[cell.y][cell.x + 1]);
        }
        return neighbors;
    }

    function getRandomNeighbor(cell) {
        const neighbors = getNeighbors(cell);
        if (neighbors.length === 0) return null;
        return neighbors[Math.floor(Math.random() * neighbors.length)];
    }

    while (true) {
        const nextNeighbor = getRandomNeighbor(current);
        if (nextNeighbor) {
            stack.push(current);
            removeWallBetweenCells(current, nextNeighbor);
            current = nextNeighbor;
            maze[current.y][current.x].visited = true;
        } else if (stack.length > 0) {
            current = stack.pop();
        } else {
            break;
        }
    }

    return maze;
}

export default generateMaze;