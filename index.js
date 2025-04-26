let maze = [];
let generationInterval = null;
let playerElement;
let playerRow = 0, playerCol = 0;
let mazeSize = null;
let mazeRevealSpeed = null;
let gameStarted = false;
let startTime = null;
let timerInterval = null;
let elapsedTime = 0;
let mazeSolved = false;
let isGenerated = false;
let solutionPath = [];
let isAutoSolving = false;

const timerDisplay = document.getElementById("timer");
const winTimeDisplay = document.getElementById("win-time");

// Scroll to level selection
function scrollToLevels() {
    let levelsSection = document.getElementById('levels');
    levelsSection.style.display = 'flex';
    levelsSection.scrollIntoView({ behavior: "smooth" });
}
// Level selection handler
function selectLevel(size, revealSpeed) {
    mazeSize = size;
    mazeRevealSpeed = revealSpeed;
    let mazeSection = document.getElementById("maze-section");
    mazeSection.style.display = 'flex';
    mazeSection.scrollIntoView({ behavior: "smooth" });
    resetTimer();
    generateMaze(size, revealSpeed);
}
// Maze generation
function generateMaze(size, revealSpeed) {
    document.removeEventListener("keydown", handleKeydown);
    document.getElementById('win-overlay').style.display = 'none';
    if (generationInterval) clearInterval(generationInterval);
    const container = document.querySelector(".maze-container");
    container.innerHTML = "";
    container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    maze = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => ({
            visited: false,
            walls: { top: true, right: true, bottom: true, left: true }
        }))
    );
    const directions = [
        { dx: 0, dy: -1, wall: "top", opposite: "bottom" },
        { dx: 1, dy: 0, wall: "right", opposite: "left" },
        { dx: 0, dy: 1, wall: "bottom", opposite: "top" },
        { dx: -1, dy: 0, wall: "left", opposite: "right" }
    ];
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
    function carve(x, y) {
        maze[y][x].visited = true;
        shuffle(directions).forEach(({ dx, dy, wall, opposite }) => {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && ny >= 0 && nx < size && ny < size && !maze[ny][nx].visited) {
                maze[y][x].walls[wall] = false;
                maze[ny][nx].walls[opposite] = false;
                carve(nx, ny);
            }
        });
    }
    carve(0, 0);
    let index = 0;
    const totalCells = size * size;
    generationInterval = setInterval(() => {
        for (let i = 0; i < revealSpeed; i++) {
            if (index >= totalCells) {
                clearInterval(generationInterval);
                generationInterval = null;
                placePlayer();
                return;
            }
            const y = Math.floor(index / size);
            const x = index % size;
            const cell = document.createElement("div");
            cell.className = `cell cell-${y}-${x}`;
            const walls = maze[y][x].walls;
            if (walls.top) cell.style.borderTop = "1px solid white";
            if (walls.right) cell.style.borderRight = "1px solid white";
            if (walls.bottom) cell.style.borderBottom = "1px solid white";
            if (walls.left) cell.style.borderLeft = "1px solid white";
            if (index === totalCells - 1) {
                cell.classList.add("ending-cell");
            }
            container.appendChild(cell);
            index++;
        }
    }, 20);
    isGenerated = true;
    solutionPath = getSolutionPath(0, 0, mazeSize - 1, mazeSize - 1, maze, mazeSize);

    document.getElementById("solve-btn").addEventListener("click", () => {
        document.removeEventListener("keydown", handleKeydown);
        animateSolution(solutionPath);
    });
}
function getSolutionPath(startRow, startCol, endRow, endCol, maze, size) {
    const visited = Array.from({ length: size }, () => Array(size).fill(false));
    const path = [];

    function dfs(row, col) {
        if (row < 0 || col < 0 || row >= size || col >= size || visited[row][col]) return false;

        visited[row][col] = true;
        path.push([row, col]);

        if (row === endRow && col === endCol) return true;

        const cell = maze[row][col];

        // Try moving in directions ONLY if there's no wall
        // Top
        if (!cell.walls.top && dfs(row - 1, col)) return true;
        // Right
        if (!cell.walls.right && dfs(row, col + 1)) return true;
        // Bottom
        if (!cell.walls.bottom && dfs(row + 1, col)) return true;
        // Left
        if (!cell.walls.left && dfs(row, col - 1)) return true;

        path.pop(); // backtrack if none worked
        return false;
    }

    dfs(startRow, startCol);
    return path;
}
function animateSolution(solutionPath, speed = 100) {
    let index = 0;
    isAutoSolving = true;

    const interval = setInterval(() => {
        if (index >= solutionPath.length) {
            clearInterval(interval);
            isAutoSolving = false;
            return;
        }

        const [row, col] = solutionPath[index];

        const cellDiv = document.querySelector(`.cell-${row}-${col}`);
        if (cellDiv && !cellDiv.classList.contains("solution-path")) {
            cellDiv.classList.add("solution-path");
        }

        movePlayerTo(row, col);
        index++;
    }, speed);
}


function movePlayerTo(row, col) {
    playerRow = row;
    playerCol = col;
    const nextCell = document.querySelector(`.cell-${row}-${col}`);
    if (nextCell && playerElement) {
        nextCell.appendChild(playerElement);
    }
    checkForWin();
}

// Player handling
function placePlayer() {
    playerElement = document.createElement("div");
    playerElement.className = "player";
    const startCell = document.querySelector(".cell-0-0");
    if (startCell) {
        startCell.appendChild(playerElement);
    } else {
        console.error("Start cell not found. Maze generation might have failed.");
    }
    playerRow = 0;
    playerCol = 0;
}
// Movement
function movePlayer(key) {
    const current = maze[playerRow][playerCol].walls;
    if (gameStarted){
        if ((key === "ArrowUp" || key === "w") && !current.top && playerRow > 0) playerRow--;
        else if ((key === "ArrowDown" || key === "s") && !current.bottom && playerRow < maze.length - 1) playerRow++;
        else if ((key === "ArrowLeft" || key === "a") && !current.left && playerCol > 0) playerCol--;
        else if ((key === "ArrowRight" || key === "d") && !current.right && playerCol < maze[0].length - 1) playerCol++;
        const nextCell = document.querySelector(`.cell-${playerRow}-${playerCol}`);
        if (nextCell) nextCell.appendChild(playerElement);
        checkForWin();
    }
}
function handleKeydown(e) {
    movePlayer(e.key);
}
// Start the game
function startPlayer() {
    if (gameStarted) return;
    if (!isGenerated) {
        window.alert("Please select a level.");
    } else {
        document.addEventListener("keydown", handleKeydown);
        gameStarted = true;
        startTimer();
    }
}
// Win check
function checkForWin() {
    if (isAutoSolving) return;

    if (playerRow === maze.length - 1 && playerCol === maze[0].length - 1) {
        mazeSolved = true;
        showWinScreen();
        stopTimer();
    }
}

function showWinScreen() {
    document.getElementById('win-overlay').style.display = 'flex';
}
// Timer
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    if (!startTime && !mazeSolved) {
        startTime = Date.now();
        timerInterval = setInterval(() => {
            elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            timerDisplay.textContent = elapsedTime;
            winTimeDisplay.textContent = elapsedTime;
        }, 1000);
    }
}
function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}
function resetTimer() {
    startTime = null;
    elapsedTime = 0;
    timerDisplay.textContent = 0;
    if (timerInterval) clearInterval(timerInterval);
}
// Reset / Restart
function resetGameState() {
    document.removeEventListener("keydown", handleKeydown);
    gameStarted = false;
    stopTimer();
    resetTimer();
}
function restartGame() {
    document.getElementById('win-overlay').style.display = 'none';
    resetGameState();
    mazeSolved = false;
    document.querySelector(".maze-container").innerHTML = "";
    scrollToLevels();
}
function restartMaze() {
    document.querySelectorAll(".solution-path").forEach(cell => {
        cell.classList.remove("solution-path");
    });
    resetGameState();
    mazeSolved = false;
    playerRow = 0;
    playerCol = 0;
    const player = document.querySelector('.player');
    if (player) player.remove();
    placePlayer();
}
function regenerateMaze() {
    resetGameState();
    mazeSolved = false;
    document.querySelector(".maze-container").innerHTML = "";
    generateMaze(mazeSize, mazeRevealSpeed);
}