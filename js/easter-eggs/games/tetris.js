// Tetris Game
// Classic block stacking game

import { soundSystem } from '../soundSystem.js';

export function createTetrisGame(container, canvas, onExit) {
    const ctx = canvas.getContext('2d');
    const ROWS = 20;
    const COLS = 10;
    const TILE_SIZE = canvas.height / ROWS;
    const OFFSET_X = (canvas.width - COLS * TILE_SIZE) / 2;

    const SHAPES = {
        I: [[1,1,1,1]],
        O: [[1,1],[1,1]],
        T: [[0,1,0],[1,1,1]],
        L: [[1,0],[1,0],[1,1]],
        J: [[0,1],[0,1],[1,1]],
        S: [[0,1,1],[1,1,0]],
        Z: [[1,1,0],[0,1,1]]
    };

    const COLORS = {
        I: '#0ff',
        O: '#ff0',
        T: '#f0f',
        L: '#f80',
        J: '#00f',
        S: '#0f0',
        Z: '#f00'
    };

    const game = {
        board: Array(ROWS).fill(null).map(() => Array(COLS).fill(0)),
        current: null,
        nextPiece: null,
        score: 0,
        lines: 0,
        level: 1,
        gameOver: false,
        dropTimer: 0,
        dropInterval: 60,
        particles: [],
        flashingRows: [],
        paused: false
    };

    function newPiece() {
        const types = Object.keys(SHAPES);
        const type = types[Math.floor(Math.random() * types.length)];
        return {
            type,
            shape: SHAPES[type],
            color: COLORS[type],
            x: Math.floor(COLS / 2) - 1,
            y: 0
        };
    }

    function collision(piece, offsetX = 0, offsetY = 0) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = piece.x + x + offsetX;
                    const newY = piece.y + y + offsetY;

                    if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
                    if (newY >= 0 && game.board[newY][newX]) return true;
                }
            }
        }
        return false;
    }

    function merge() {
        game.current.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const boardY = game.current.y + y;
                    const boardX = game.current.x + x;
                    if (boardY >= 0) {
                        game.board[boardY][boardX] = game.current.color;
                    }
                }
            });
        });
        soundSystem.hit();
    }

    function rotate() {
        const rotated = game.current.shape[0].map((_, i) =>
            game.current.shape.map(row => row[i]).reverse()
        );

        const oldShape = game.current.shape;
        game.current.shape = rotated;

        if (collision(game.current)) {
            game.current.shape = oldShape;
        } else {
            soundSystem.rotate();
        }
    }

    function createParticles(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            game.particles.push({
                x: OFFSET_X + x * TILE_SIZE + TILE_SIZE / 2,
                y: y * TILE_SIZE + TILE_SIZE / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                life: 40,
                color
            });
        }
    }

    function clearLines() {
        let linesCleared = 0;
        const clearedRows = [];

        for (let y = ROWS - 1; y >= 0; y--) {
            if (game.board[y].every(cell => cell !== 0)) {
                clearedRows.push(y);
                // Create particles for cleared line
                for (let x = 0; x < COLS; x++) {
                    createParticles(x, y, game.board[y][x], 10);
                }
                game.board.splice(y, 1);
                game.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++; // Check same row again
            }
        }

        if (linesCleared > 0) {
            game.lines += linesCleared;
            game.score += [40, 100, 300, 1200][linesCleared - 1] * game.level;
            game.level = Math.floor(game.lines / 10) + 1;
            game.dropInterval = Math.max(10, 60 - (game.level - 1) * 5);

            if (linesCleared === 4) {
                soundSystem.powerUp(); // Tetris!
            } else {
                soundSystem.collect();
            }
        }
    }

    function hardDrop() {
        // Drop piece to the bottom instantly
        let dropDistance = 0;
        while (!collision(game.current, 0, 1)) {
            game.current.y++;
            dropDistance++;
        }
        game.score += dropDistance * 2; // Bonus points for hard drop
        soundSystem.hit();
        merge();
        clearLines();

        game.current = game.nextPiece;
        game.nextPiece = newPiece();

        if (collision(game.current)) {
            game.gameOver = true;
            showGameOver();
        }
    }

    function saveGame() {
        const saveData = {
            board: game.board,
            score: game.score,
            lines: game.lines,
            level: game.level,
            current: game.current,
            nextPiece: game.nextPiece,
            timestamp: Date.now()
        };
        localStorage.setItem('tetris_save', JSON.stringify(saveData));
        soundSystem.collect();
    }

    function loadGame() {
        const saved = localStorage.getItem('tetris_save');
        if (saved) {
            try {
                const saveData = JSON.parse(saved);
                game.board = saveData.board;
                game.score = saveData.score;
                game.lines = saveData.lines;
                game.level = saveData.level;
                game.current = saveData.current;
                game.nextPiece = saveData.nextPiece;
                game.dropInterval = Math.max(10, 60 - (game.level - 1) * 5);
                return true;
            } catch (e) {
                console.warn('Failed to load saved game:', e);
            }
        }
        return false;
    }

    function update() {
        if (game.gameOver || game.paused) {
            if (game.paused) draw(); // Still draw when paused
            requestAnimationFrame(update);
            return;
        }

        game.dropTimer++;
        if (game.dropTimer > game.dropInterval) {
            game.dropTimer = 0;

            if (!collision(game.current, 0, 1)) {
                game.current.y++;
            } else {
                merge();
                clearLines();

                game.current = game.nextPiece;
                game.nextPiece = newPiece();

                if (collision(game.current)) {
                    game.gameOver = true;
                    showGameOver();
                    return;
                }
            }
        }

        // Update particles
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3; // Gravity
            p.life--;
            return p.life > 0;
        });

        draw();
        requestAnimationFrame(update);
    }

    function draw() {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(OFFSET_X, y * TILE_SIZE);
            ctx.lineTo(OFFSET_X + COLS * TILE_SIZE, y * TILE_SIZE);
            ctx.stroke();
        }
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(OFFSET_X + x * TILE_SIZE, 0);
            ctx.lineTo(OFFSET_X + x * TILE_SIZE, ROWS * TILE_SIZE);
            ctx.stroke();
        }

        // Draw board
        game.board.forEach((row, y) => {
            row.forEach((color, x) => {
                if (color) {
                    ctx.fillStyle = color;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = color;
                    ctx.fillRect(
                        OFFSET_X + x * TILE_SIZE + 1,
                        y * TILE_SIZE + 1,
                        TILE_SIZE - 2,
                        TILE_SIZE - 2
                    );
                    ctx.shadowBlur = 0;
                }
            });
        });

        // Draw current piece
        if (game.current) {
            ctx.fillStyle = game.current.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = game.current.color;
            game.current.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        ctx.fillRect(
                            OFFSET_X + (game.current.x + x) * TILE_SIZE + 1,
                            (game.current.y + y) * TILE_SIZE + 1,
                            TILE_SIZE - 2,
                            TILE_SIZE - 2
                        );
                    }
                });
            });
            ctx.shadowBlur = 0;
        }

        // Draw particles
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 40;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
        });
        ctx.globalAlpha = 1;

        // Draw HUD
        ctx.fillStyle = '#0f0';
        ctx.font = '16px "Press Start 2P", "Courier New"';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#0f0';
        ctx.fillText(`SCORE: ${game.score}`, 10, 30);
        ctx.fillText(`LINES: ${game.lines}`, 10, 55);
        ctx.fillText(`LEVEL: ${game.level}`, 10, 80);
        ctx.shadowBlur = 0;

        // Draw next piece
        if (game.nextPiece) {
            ctx.fillText('NEXT:', canvas.width - 140, 30);
            ctx.fillStyle = game.nextPiece.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = game.nextPiece.color;
            game.nextPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        ctx.fillRect(
                            canvas.width - 100 + x * 20,
                            50 + y * 20,
                            18,
                            18
                        );
                    }
                });
            });
            ctx.shadowBlur = 0;
        }

        // Draw controls
        ctx.fillStyle = '#0f0';
        ctx.font = '10px "Press Start 2P", "Courier New"';
        ctx.fillText('ARROWS: MOVE', 10, canvas.height - 55);
        ctx.fillText('UP/SPACE: ROTATE', 10, canvas.height - 40);
        ctx.fillText('DOWN: DROP', 10, canvas.height - 25);
        ctx.fillText('W: HARD DROP', 10, canvas.height - 10);
        ctx.fillText('P: PAUSE/SAVE', canvas.width - 200, canvas.height - 10);

        // Draw pause indicator
        if (game.paused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ff0';
            ctx.font = '36px "Press Start 2P", "Courier New"';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0';
            ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
            ctx.font = '12px "Press Start 2P", "Courier New"';
            ctx.fillStyle = '#0f0';
            ctx.shadowColor = '#0f0';
            ctx.fillText('GAME SAVED', canvas.width / 2, canvas.height / 2 + 40);
            ctx.fillText('PRESS P TO RESUME', canvas.width / 2, canvas.height / 2 + 65);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
        }
    }

    function showGameOver() {
        soundSystem.gameOver();

        setTimeout(() => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#f00';
            ctx.font = 'bold 36px "Press Start 2P", "Courier New"';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#f00';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);

            ctx.fillStyle = '#0f0';
            ctx.shadowColor = '#0f0';
            ctx.font = '16px "Press Start 2P", "Courier New"';
            ctx.fillText(`SCORE: ${game.score}`, canvas.width / 2, canvas.height / 2);
            ctx.fillText(`LINES: ${game.lines}`, canvas.width / 2, canvas.height / 2 + 30);
            ctx.fillText(`LEVEL: ${game.level}`, canvas.width / 2, canvas.height / 2 + 60);
            ctx.font = '12px "Press Start 2P", "Courier New"';
            ctx.fillText('ESC TO EXIT', canvas.width / 2, canvas.height / 2 + 95);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
        }, 300);
    }

    function handleKeydown(e) {
        if (game.gameOver) {
            if (e.key === 'Escape') {
                cleanup();
                onExit();
            }
            return;
        }

        // Pause/unpause
        if (e.key === 'p' || e.key === 'P') {
            game.paused = !game.paused;
            if (game.paused) {
                saveGame();
            } else {
                soundSystem.select();
            }
            return;
        }

        if (game.paused) return;

        switch (e.key) {
            case 'ArrowLeft':
                if (!collision(game.current, -1, 0)) {
                    game.current.x--;
                    soundSystem.select();
                }
                break;
            case 'ArrowRight':
                if (!collision(game.current, 1, 0)) {
                    game.current.x++;
                    soundSystem.select();
                }
                break;
            case 'ArrowDown':
                if (!collision(game.current, 0, 1)) {
                    game.current.y++;
                    game.score += 1;
                }
                break;
            case 'ArrowUp':
            case ' ':
                rotate();
                break;
            case 'w':
            case 'W':
                hardDrop();
                break;
            case 'Escape':
                cleanup();
                onExit();
                break;
        }
    }

    function cleanup() {
        document.removeEventListener('keydown', handleKeydown);
    }

    document.addEventListener('keydown', handleKeydown);

    // Initialize game - try to load saved game first
    const loaded = loadGame();
    if (!loaded) {
        game.current = newPiece();
        game.nextPiece = newPiece();
    }
    draw();
    requestAnimationFrame(update);

    return { cleanup };
}
