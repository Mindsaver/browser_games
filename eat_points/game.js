const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

const tileSize = 30;
const rows = canvas.height / tileSize;
const cols = canvas.width / tileSize;

let pacman = { x: 1, y: 1, direction: 'right' };
let points = [];
let powerPoints = [];
let enemies = [];
let walls = [];
let mouthOpen = true;
let mouthMoveCounter = 0;
let powerMode = false;
let powerModeCounter = 0;
let enemyMoveCounter = 0;

let gameOver = false;
let gameWin = false;

// Initialize the game
function initializeGame() {
    // Generate maze
    generateMaze();

    // Add shortcuts to the maze
    addShortcuts();

    // Place Pacman in an open space
    placePacman();

    // Generate points
    generatePoints();

    // Place enemies in open spaces
    placeEnemies();

    // Start the game loop
    requestAnimationFrame(gameLoop);
}

// Draw the game
function drawGame() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw walls
    context.fillStyle = 'blue';
    walls.forEach(wall => {
        context.fillRect(wall.x * tileSize, wall.y * tileSize, tileSize, tileSize);
    });

    // Draw points
    context.fillStyle = 'yellow';
    points.forEach(point => {
        context.beginPath();
        context.arc(point.x * tileSize + tileSize / 2, point.y * tileSize + tileSize / 2, tileSize / 4, 0, Math.PI * 2);
        context.fill();
    });

    // Draw power points
    context.fillStyle = 'orange';
    powerPoints.forEach(point => {
        context.beginPath();
        context.arc(point.x * tileSize + tileSize / 2, point.y * tileSize + tileSize / 2, tileSize / 2, 0, Math.PI * 2);
        context.fill();
    });

    // Draw enemies (ghosts)
    
    enemies.forEach(enemy => {
		context.fillStyle = powerMode ? 'blue' : 'red';
        drawGhost(enemy.x * tileSize, enemy.y * tileSize, tileSize, tileSize);
    });

    // Draw Pacman
    context.fillStyle = 'yellow';
    let startAngle, endAngle;
    if (mouthOpen) {
        if (pacman.direction === 'right') {
            startAngle = 0.2 * Math.PI;
            endAngle = 1.8 * Math.PI;
        } else if (pacman.direction === 'left') {
            startAngle = 1.2 * Math.PI;
            endAngle = 0.8 * Math.PI;
        } else if (pacman.direction === 'up') {
            startAngle = 1.7 * Math.PI;
            endAngle = 1.3 * Math.PI;
        } else if (pacman.direction === 'down') {
            startAngle = 0.7 * Math.PI;
            endAngle = 0.3 * Math.PI;
        }
    } else {
        startAngle = 0;
        endAngle = 2 * Math.PI;
    }

    context.beginPath();
    context.arc(pacman.x * tileSize + tileSize / 2, pacman.y * tileSize + tileSize / 2, tileSize / 2, startAngle, endAngle);
    context.lineTo(pacman.x * tileSize + tileSize / 2, pacman.y * tileSize + tileSize / 2);
    context.fill();
}

// Draw a ghost
function drawGhost(x, y, width, height) {
    context.beginPath();
    context.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI, true);
    context.lineTo(x, y + height);
    context.lineTo(x + width, y + height);
    context.lineTo(x + width, y + height / 2);
    context.closePath();
    context.fill();

    // Draw eyes
    context.fillStyle = 'white';
    context.beginPath();
    context.arc(x + width / 4, y + height / 3, width / 8, 0, Math.PI * 2);
    context.arc(x + (3 * width) / 4, y + height / 3, width / 8, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = 'black';
    context.beginPath();
    context.arc(x + width / 4, y + height / 3, width / 16, 0, Math.PI * 2);
    context.arc(x + (3 * width) / 4, y + height / 3, width / 16, 0, Math.PI * 2);
    context.fill();
}

// Game loop
function gameLoop() {
    if (gameOver) {
        alert('Game Over!');
        return;
    }

    if (gameWin) {
        alert('You Win!');
        return;
    }

    if (enemyMoveCounter % 30 === 0) { // Slows down enemy movement
        moveEnemies();
    }
    enemyMoveCounter++;

    if (mouthMoveCounter % 15 === 0) {
        mouthOpen = !mouthOpen;
    }
    mouthMoveCounter++;

    if (powerMode) {
        powerModeCounter++;
        if (powerModeCounter > 400) { // Approximately 15 seconds at 60fps
            powerMode = false;
            powerModeCounter = 0;
        }
    }

    checkCollisions();
    drawGame();

    requestAnimationFrame(gameLoop);
}

// Move Pacman
document.addEventListener('keydown', event => {
    let newX = pacman.x;
    let newY = pacman.y;

    if (event.key === 'ArrowUp') {
        newY--;
        pacman.direction = 'up';
    }
    if (event.key === 'ArrowDown') {
        newY++;
        pacman.direction = 'down';
    }
    if (event.key === 'ArrowLeft') {
        newX--;
        pacman.direction = 'left';
    }
    if (event.key === 'ArrowRight') {
        newX++;
        pacman.direction = 'right';
    }

    if (!walls.some(w => w.x === newX && w.y === newY) && newX >= 0 && newY >= 0 && newX < cols && newY < rows) {
        pacman.x = newX;
        pacman.y = newY;
        collectPoints();
    }
});

function collectPoints() {
    points = points.filter(point => !(point.x === pacman.x && point.y === pacman.y));
    powerPoints = powerPoints.filter(point => {
        if (point.x === pacman.x && point.y === pacman.y) {
            powerMode = true;
            powerModeCounter = 0;
            return false;
        }
        return true;
    });

    if (points.length === 0) {
        gameWin = true;
    }
}

// Move enemies using A* algorithm
function moveEnemies() {
    enemies.forEach(enemy => {
        let path;
        if (Math.random() < 0.8) {
            if (powerMode) {
                path = findPath(enemy, { x: cols - pacman.x, y: rows - pacman.y }); // Move away from Pacman
            } else {
                path = findPath(enemy, pacman); // Move towards Pacman
            }
        } else {
            path = findRandomPath(enemy); // Move randomly
        }
        if (path.length > 1) {
            enemy.x = path[1].x;
            enemy.y = path[1].y;
        }
    });
}

function checkCollisions() {
    enemies.forEach(enemy => {
        if (enemy.x === pacman.x && enemy.y === pacman.y) {
            if (powerMode) {
                enemies = enemies.filter(e => e !== enemy);
            } else {
                gameOver = true;
            }
        }
    });
}

// A* pathfinding algorithm
function findPath(start, goal) {
    const openSet = [start];
    const cameFrom = new Map();
    const gScore = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
    const fScore = Array.from({ length: rows }, () => Array(cols).fill(Infinity));

    gScore[start.y][start.x] = 0;
    fScore[start.y][start.x] = heuristic(start, goal);

    while (openSet.length > 0) {
        openSet.sort((a, b) => fScore[a.y][a.x] - fScore[b.y][b.x]);
        const current = openSet.shift();

        if (current.x === goal.x && current.y === goal.y) {
            return reconstructPath(cameFrom, current);
        }

        getNeighbors(current).forEach(neighbor => {
            const tentative_gScore = gScore[current.y][current.x] + 1;
            if (tentative_gScore < gScore[neighbor.y][neighbor.x]) {
                cameFrom.set(neighbor, current);
                gScore[neighbor.y][neighbor.x] = tentative_gScore;
                fScore[neighbor.y][neighbor.x] = gScore[neighbor.y][neighbor.x] + heuristic(neighbor, goal);
                if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
        });
    }

    return [];
}

function findRandomPath(start) {
    const openSet = [start];
    const randomGoal = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
    const cameFrom = new Map();
    const gScore = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
    const fScore = Array.from({ length: rows }, () => Array(cols).fill(Infinity));

    gScore[start.y][start.x] = 0;
    fScore[start.y][start.x] = heuristic(start, randomGoal);

    while (openSet.length > 0) {
        openSet.sort((a, b) => fScore[a.y][a.x] - fScore[b.y][b.x]);
        const current = openSet.shift();

        if (current.x === randomGoal.x && current.y === randomGoal.y) {
            return reconstructPath(cameFrom, current);
        }

        getNeighbors(current).forEach(neighbor => {
            const tentative_gScore = gScore[current.y][current.x] + 1;
            if (tentative_gScore < gScore[neighbor.y][neighbor.x]) {
                cameFrom.set(neighbor, current);
                gScore[neighbor.y][neighbor.x] = tentative_gScore;
                fScore[neighbor.y][neighbor.x] = gScore[neighbor.y][neighbor.x] + heuristic(neighbor, randomGoal);
                if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
        });
    }

    return [];
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function reconstructPath(cameFrom, current) {
    const totalPath = [current];
    while (cameFrom.has(current)) {
        current = cameFrom.get(current);
        totalPath.push(current);
    }
    return totalPath.reverse();
}

function getNeighbors(node) {
    const neighbors = [];
    if (node.y > 0 && !walls.some(w => w.x === node.x && w.y === node.y - 1)) neighbors.push({ x: node.x, y: node.y - 1 });
    if (node.y < rows - 1 && !walls.some(w => w.x === node.x && w.y === node.y + 1)) neighbors.push({ x: node.x, y: node.y + 1 });
    if (node.x > 0 && !walls.some(w => w.x === node.x - 1 && w.y === node.y)) neighbors.push({ x: node.x - 1, y: node.y });
    if (node.x < cols - 1 && !walls.some(w => w.x === node.x + 1 && w.y === node.y)) neighbors.push({ x: node.x + 1, y: node.y });
    return neighbors;
}

// Generate maze using Recursive Backtracking Algorithm
function generateMaze() {
    const maze = Array.from({ length: rows }, () => Array(cols).fill(true));
    const stack = [{ x: 1, y: 1 }];
    maze[1][1] = false;

    while (stack.length > 0) {
        const current = stack.pop();
        const { x, y } = current;

        const neighbors = getMazeNeighbors(x, y, maze);
        if (neighbors.length > 0) {
            stack.push(current);

            const { nx, ny, wx, wy } = neighbors[Math.floor(Math.random() * neighbors.length)];
            maze[ny][nx] = false;
            maze[wy][wx] = false;

            stack.push({ x: nx, y: ny });
        }
    }

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (maze[y][x]) {
                walls.push({ x, y });
            }
        }
    }
}

// Add shortcuts to the maze
function addShortcuts() {
    let shortcuts = Math.floor((rows * cols) / 20); // Number of shortcuts to add

    while (shortcuts > 0) {
        let x = Math.floor(Math.random() * (cols - 2)) + 1;
        let y = Math.floor(Math.random() * (rows - 2)) + 1;

        if (walls.some(w => w.x === x && w.y === y)) {
            walls = walls.filter(w => !(w.x === x && w.y === y));
            shortcuts--;
        }
    }
}

// Generate points
function generatePoints() {
    let powerPointCount = 0;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (!walls.some(w => w.x === x && w.y === y)) {
                if (Math.random() < 0.1 && powerPointCount < 4) {
                    powerPoints.push({ x, y });
                    powerPointCount++;
                } else {
                    points.push({ x, y });
                }
            }
        }
    }
}

// Place Pacman in an open space
function placePacman() {
    let openSpaces = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (!walls.some(w => w.x === x && w.y === y)) {
                openSpaces.push({ x, y });
            }
        }
    }
    const randomIndex = Math.floor(Math.random() * openSpaces.length);
    pacman.x = openSpaces[randomIndex].x;
    pacman.y = openSpaces[randomIndex].y;
}

// Place enemies in open spaces
function placeEnemies() {
    let openSpaces = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (!walls.some(w => w.x === x && w.y === y) && !(pacman.x === x && pacman.y === y)) {
                openSpaces.push({ x, y });
            }
        }
    }
    for (let i = 0; i < 2; i++) {
        const randomIndex = Math.floor(Math.random() * openSpaces.length);
        enemies.push(openSpaces[randomIndex]);
        openSpaces.splice(randomIndex, 1);
    }
}

function getMazeNeighbors(x, y, maze) {
    const neighbors = [];
    if (x > 1 && maze[y][x - 2]) neighbors.push({ nx: x - 2, ny: y, wx: x - 1, wy: y });
    if (x < cols - 2 && maze[y][x + 2]) neighbors.push({ nx: x + 2, ny: y, wx: x + 1, wy: y });
    if (y > 1 && maze[y - 2][x]) neighbors.push({ nx: x, ny: y - 2, wx: x, wy: y - 1 });
    if (y < rows - 2 && maze[y + 2][x]) neighbors.push({ nx: x, ny: y + 2, wx: x, wy: y + 1 });
    return neighbors;
}

// Initialize the game
initializeGame();
