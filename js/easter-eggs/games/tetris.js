// Tetris Game
// Classic block stacking game

import { soundSystem } from '../soundSystem.js';
import { multiGame } from '../multi-game.js';

export function createTetrisGame(container, canvas, onExit) {
    const ctx = canvas.getContext('2d');
    const ROWS = 20;
    const COLS = 10;
    const TILE_SIZE = canvas.height / ROWS;
    const OFFSET_X = (canvas.width - COLS * TILE_SIZE) / 2;

    // --- Game Config ---
    // gameplay tuning
    const LOCK_DOWN_DELAY = 90; // 기존보다 늘려서 T-spin 가능성 향상
    const DAS = 6; // 민감도 향상
    const ARR = 1; // 반복 지연 단축

    const SHAPES = {
        I: [[1,1,1,1]],
        O: [[1,1],[1,1]],
        T: [[0,1,0],[1,1,1]],
        L: [[1,0,0],[1,1,1]],
        J: [[0,0,1],[1,1,1]],
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

    let animationFrameId = null;

    const game = {
        board: Array(ROWS).fill(null).map(() => Array(COLS).fill(0)),
        current: null,
        nextPiece: null,
        heldPiece: null,
        canSwap: true,
        score: 0,
        lines: 0,
        level: 1,
        gameOver: false,
        dropTimer: 0,
        dropInterval: 60,
        lockTimer: 0,
        particles: [],
        paused: false,
        keys: {
            left: { pressed: false, timer: 0 },
            right: { pressed: false, timer: 0 }
        }
    };

    let holdPieceUsed = false;
    let heldPiece = null;

    function newPiece() {
        const types = Object.keys(SHAPES);
        const type = types[Math.floor(Math.random() * types.length)];
        return {
            type,
            shape: SHAPES[type],
            color: COLORS[type],
            x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
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
                    if (newY >= 0 && game.board[newY] && game.board[newY][newX]) return true;
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
        const originalShape = game.current.shape;
        const rotated = originalShape[0].map((_, i) =>
            originalShape.map(row => row[i]).reverse()
        );
        game.current.shape = rotated;

        // Wall kick logic
        let kickOffset = 0;
        if (collision(game.current)) {
            kickOffset = 1;
            if (!collision(game.current, kickOffset, 0)) {
                game.current.x += kickOffset;
            } else {
                kickOffset = -1;
                if (!collision(game.current, kickOffset, 0)) {
                    game.current.x += kickOffset;
                } else {
                    // Could not kick, revert rotation
                    game.current.shape = originalShape;
                    return;
                }
            }
        }
        soundSystem.rotate();
    }
    
    function holdPiece() {
        if (!game.canSwap) return;

        if (game.heldPiece) {
            [game.current, game.heldPiece] = [game.heldPiece, game.current];
            game.current.x = Math.floor(COLS / 2) - Math.floor(game.current.shape[0].length / 2);
            game.current.y = 0;
        } else {
            game.heldPiece = game.current;
            game.current = game.nextPiece;
            game.nextPiece = newPiece();
        }
        
        game.canSwap = false;
        soundSystem.select();
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
        
        for (let y = ROWS - 1; y >= 0; y--) {
            if (game.board[y].every(cell => cell !== 0)) {
                for (let x = 0; x < COLS; x++) {
                    createParticles(x, y, game.board[y][x], 10);
                }
                game.board.splice(y, 1);
                game.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++; 
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
        let dropDistance = 0;
        while (!collision(game.current, 0, 1)) {
            game.current.y++;
            dropDistance++;
        }
        game.score += dropDistance * 2;
        soundSystem.hit();
        mergeAndNextPiece();
    }
    
    function mergeAndNextPiece() {
        merge();
        clearLines();

        game.current = game.nextPiece;
        game.nextPiece = newPiece();
        game.canSwap = true; // Allow swap for new piece

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
            heldPiece: game.heldPiece,
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
                game.heldPiece = saveData.heldPiece || null;
                game.dropInterval = Math.max(10, 60 - (game.level - 1) * 5);
                return true;
            } catch (e) {
                console.warn('Failed to load saved game:', e);
            }
        }
        return false;
    }

    function handleMovement() {
        if (game.keys.left.pressed) {
            game.keys.left.timer++;
            if (game.keys.left.timer > DAS) {
                if ((game.keys.left.timer - DAS) % ARR === 0) {
                    if (!collision(game.current, -1, 0)) {
                        game.current.x--;
                        game.lockTimer = 0; // Reset lock timer on move
                    }
                }
            }
        }
        if (game.keys.right.pressed) {
            game.keys.right.timer++;
            if (game.keys.right.timer > DAS) {
                if ((game.keys.right.timer - DAS) % ARR === 0) {
                    if (!collision(game.current, 1, 0)) {
                        game.current.x++;
                        game.lockTimer = 0; // Reset lock timer on move
                    }
                }
            }
        }
    }

    function update() {
        if (game.gameOver || game.paused) {
            if (game.paused) draw();
            animationFrameId = requestAnimationFrame(update);
            return;
        }

        handleMovement();

        game.dropTimer++;
        if (game.dropTimer > game.dropInterval) {
            game.dropTimer = 0;

            if (!collision(game.current, 0, 1)) {
                game.current.y++;
            }
        }
        
        if (collision(game.current, 0, 1)) {
            game.lockTimer++;
            if (game.lockTimer > LOCK_DOWN_DELAY) {
                mergeAndNextPiece();
                game.lockTimer = 0;
            }
        } else {
            game.lockTimer = 0;
        }

        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3;
            p.life--;
            return p.life > 0;
        });

        draw();
        animationFrameId = requestAnimationFrame(update);
    }

    function draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

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

        if (game.current) {
            // Draw ghost piece
            ctx.globalAlpha = 0.3;
            let ghostY = game.current.y;
            while(!collision(game.current, 0, ghostY - game.current.y + 1)) {
                ghostY++;
            }
            game.current.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        ctx.fillStyle = game.current.color;
                        ctx.fillRect(
                            OFFSET_X + (game.current.x + x) * TILE_SIZE + 1,
                            (ghostY + y) * TILE_SIZE + 1,
                            TILE_SIZE - 2,
                            TILE_SIZE - 2
                        );
                    }
                });
            });
            ctx.globalAlpha = 1;

            // Draw current piece
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

        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 40;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
        });
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#0f0';
        ctx.font = '16px "Press Start 2P", "Courier New"';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#0f0';
        ctx.fillText(`SCORE: ${game.score}`, 10, 30);
        ctx.fillText(`LINES: ${game.lines}`, 10, 55);
        ctx.fillText(`LEVEL: ${game.level}`, 10, 80);
        
        // Draw Held piece
        ctx.fillText('HOLD:', 10, 120);
        if (game.heldPiece) {
            ctx.fillStyle = game.heldPiece.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = game.heldPiece.color;
            game.heldPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        ctx.fillRect(
                            20 + x * 20,
                            140 + y * 20,
                            18,
                            18
                        );
                    }
                });
            });
        }

        // Draw next piece
        ctx.fillStyle = '#0f0';
        ctx.fillText('NEXT:', canvas.width - 140, 30);
        if (game.nextPiece) {
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
        }
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#0f0';
        ctx.font = '10px "Press Start 2P", "Courier New"';
        ctx.fillText('ARROWS: MOVE', 10, canvas.height - 70);
        ctx.fillText('UP/SPACE: ROTATE', 10, canvas.height - 55);
        ctx.fillText('DOWN: SOFT DROP', 10, canvas.height - 40);
        ctx.fillText('W: HARD DROP', 10, canvas.height - 25);
        ctx.fillText('C: HOLD', 10, canvas.height - 10);
        ctx.fillText('P: PAUSE/SAVE', canvas.width - 200, canvas.height - 10);

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
        game.gameOver = true;

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
            ctx.fillText('R TO RESTART', canvas.width / 2, canvas.height / 2 + 120);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
        }, 300);
    }

    function resetGame() {
        game.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        game.current = newPiece();
        game.nextPiece = newPiece();
        game.heldPiece = null;
        game.canSwap = true;
        game.score = 0;
        game.lines = 0;
        game.level = 1;
        game.gameOver = false;
        game.dropTimer = 0;
        game.dropInterval = 60;
        game.lockTimer = 0;
        game.particles = [];
        game.paused = false;
        game.keys = {
            left: { pressed: false, timer: 0 },
            right: { pressed: false, timer: 0 }
        };
        holdPieceUsed = false;
        heldPiece = null;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        // Call showCountdown before starting the game loop
        multiGame.showCountdown(canvas, () => {
            animationFrameId = requestAnimationFrame(update);
        });
    }

    function handleKeydown(e) {
        if (game.gameOver) {
            if (e.key === 'Escape') {
                cleanup();
                onExit();
            } else if (e.key === 'r' || e.key === 'R') {
                resetGame();
            }
            return;
        }

        if (e.key === 'p' || e.key === 'P') {
            game.paused = !game.paused;
            if (game.paused) saveGame();
            else soundSystem.select();
            return;
        }

        if (game.paused) return;

        switch (e.key) {
            case 'ArrowLeft':
                if (!game.keys.left.pressed) {
                    if (!collision(game.current, -1, 0)) {
                        game.current.x--;
                        game.lockTimer = 0;
                        soundSystem.select();
                    }
                    game.keys.left.pressed = true;
                }
                break;
            case 'ArrowRight':
                if (!game.keys.right.pressed) {
                    if (!collision(game.current, 1, 0)) {
                        game.current.x++;
                        game.lockTimer = 0;
                        soundSystem.select();
                    }
                    game.keys.right.pressed = true;
                }
                break;
            case 'ArrowDown':
                game.dropTimer = game.dropInterval; // Soft drop
                break;
            case 'ArrowUp':
            case ' ':
                rotate();
                break;
            case 'w':
            case 'W':
                hardDrop();
                break;
            case 'c':
            case 'C':
                holdPiece();
                break;
            case 'Escape':
                game.gameOver = true; // Trigger game over
                showGameOver(); // Show game over screen
                return;
        }
    }
    
    function handleKeyup(e) {
        switch(e.key) {
            case 'ArrowLeft':
                game.keys.left.pressed = false;
                game.keys.left.timer = 0;
                break;
            case 'ArrowRight':
                game.keys.right.pressed = false;
                game.keys.right.timer = 0;
                break;
        }
    }

    function cleanup() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        document.removeEventListener('keydown', handleKeydown);
        document.removeEventListener('keyup', handleKeyup);
    }

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('keyup', handleKeyup);

    const loaded = loadGame();
    if (!loaded) {
        game.current = newPiece();
        game.nextPiece = newPiece();
    }
    
    animationFrameId = requestAnimationFrame(update);

    return { cleanup };
}
