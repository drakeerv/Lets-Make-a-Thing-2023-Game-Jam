// maze generator that outputs a 2d array of {right: bool, bottom: bool} if it has a right or bottom is indicated if it has a side. in the size of 
function generateMaze(width, height) {
    const maze = [];
    for (let i = 0; i < height; i++) {
        maze.push([]);
        for (let j = 0; j < width; j++) {
            maze[i].push({right: false, bottom: false, visited: false});
        }
    }

    const stack = [];
    let current = {x: 0, y: 0};
    maze[0][0].visited = true;

    // top is either row 0 or if the cell above's bottom is true
    // left is either column 0 or if the cell to the left's right is true
    // bottom is current cell's bottom or if the row is the last row
    // right is current cell's right or if the column is the last column

    function removeWall(cell1, cell2) {
        if (cell1.x === cell2.x) {
            if (cell1.y < cell2.y) {
                maze[cell1.y][cell1.x].bottom = false;
            } else {
                maze[cell2.y][cell2.x].bottom = false;
            }
        } else {
            if (cell1.x < cell2.x) {
                maze[cell1.y][cell1.x].right = false;
            } else {
                maze[cell2.y][cell2.x].right = false;
            }
        }
    }

    return maze;
}

export default generateMaze;