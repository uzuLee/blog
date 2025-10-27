// Pac-Man Style Game
// Simplified maze game with proper ghost AI

import { soundSystem } from '../soundSystem.js';

export function createPacmanGame(container, canvas, onExit) {
    const ctx = canvas.getContext('2d');
    const TILE_SIZE = 40;
    const COLS = 20;
    const ROWS = 15;

    // Simple maze (0 = wall, 1 = dot, 2 = power pellet, 3 = empty)
    const maze = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0],
        [0,2,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,2,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,1,0],
        [0,1,1,1,1,0,1,1,1,0,0,1,1,1,0,1,1,1,1,0],
        [0,0,0,0,1,0,0,0,3,0,0,3,0,0,0,1,0,0,0,0],
        [0,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,0],
        [0,1,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,1,0],
        [0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0],
        [0,2,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,2,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,1,0],
        [0,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];

    const game = {
        pacman: {
            x: 1,
            y: 1,
            mouthOpen: 0,
            direction: 0,
            nextDirection: 0
        },
        ghosts: [
            { x: 9, y: 6, startX: 9, startY: 6, color: '#f00', mode: 'chase', scatterTarget: {x: 18, y: 1} },
            { x: 10, y: 6, startX: 10, startY: 6, color: '#ffc0cb', mode: 'chase', scatterTarget: {x: 1, y: 1} },
            { x: 9, y: 7, startX: 9, startY: 7, color: '#0ff', mode: 'chase', scatterTarget: {x: 18, y: 13} }
        ],
        score: 0,
        lives: 3,
        powerMode: 0,
        dotsRemaining: 0,
        gameOver: false,
        won: false,
        deathAnimation: 0
    };

    // Count dots
    maze.forEach(row => {
        row.forEach(cell => {
            if (cell === 1 || cell === 2) game.dotsRemaining++;
        });
    });

    let moveTimer = 0;
    let ghostMoveTimer = 0;
    let keysPressed = {};

    function getDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    function getDirection(fromX, fromY, toX, toY) {
        const directions = [
            { dx: 0, dy: -1, dist: 0 }, // up
            { dx: 0, dy: 1, dist: 0 },  // down
            { dx: -1, dy: 0, dist: 0 }, // left
            { dx: 1, dy: 0, dist: 0 }   // right
        ];

        directions.forEach(dir => {
            const newX = fromX + dir.dx;
            const newY = fromY + dir.dy;
            if (maze[newY] && maze[newY][newX] !== 0) {
                dir.dist = getDistance(newX, newY, toX, toY);
            } else {
                dir.dist = 999;
            }
        });

        directions.sort((a, b) => a.dist - b.dist);
        return directions[0];
    }

    function update() {
        if (game.gameOver || game.won) {
            if (game.deathAnimation > 0) {
                drawDeathAnimation();
            }
            return;
        }

        moveTimer++;
        ghostMoveTimer++;

        // Move pacman
        if (moveTimer >= 6) {
            moveTimer = 0;

            let newX = game.pacman.x;
            let newY = game.pacman.y;
            let moved = false;

            // Try next direction first
            const nextDir = game.pacman.nextDirection;
            const nextX = game.pacman.x + Math.cos(nextDir * Math.PI / 180);
            const nextY = game.pacman.y + Math.sin(nextDir * Math.PI / 180);

            if (maze[Math.round(nextY)] && maze[Math.round(nextY)][Math.round(nextX)] !== 0) {
                game.pacman.direction = game.pacman.nextDirection;
            }

            const dir = game.pacman.direction;
            newX = game.pacman.x + Math.cos(dir * Math.PI / 180);
            newY = game.pacman.y + Math.sin(dir * Math.PI / 180);

            // Check wall collision
            if (maze[Math.round(newY)] && maze[Math.round(newY)][Math.round(newX)] !== 0) {
                game.pacman.x = Math.round(newX);
                game.pacman.y = Math.round(newY);
                moved = true;

                // Eat dots
                if (maze[game.pacman.y][game.pacman.x] === 1) {
                    maze[game.pacman.y][game.pacman.x] = 3;
                    game.score += 10;
                    game.dotsRemaining--;
                    soundSystem.collect();
                } else if (maze[game.pacman.y][game.pacman.x] === 2) {
                    maze[game.pacman.y][game.pacman.x] = 3;
                    game.score += 50;
                    game.powerMode = 80;
                    game.dotsRemaining--;
                    soundSystem.powerUp();
                }

                // Check win
                if (game.dotsRemaining === 0) {
                    game.won = true;
                    soundSystem.victory();
                    showWin();
                    return;
                }
            }

            game.pacman.mouthOpen = (game.pacman.mouthOpen + 1) % 20;
        }

        // Update power mode
        if (game.powerMode > 0) game.powerMode--;

        // Move ghosts
        if (ghostMoveTimer >= 8) {
            ghostMoveTimer = 0;

            game.ghosts.forEach(ghost => {
                let targetX, targetY;

                if (game.powerMode > 0) {
                    // Run away from pacman
                    targetX = ghost.x * 2 - game.pacman.x;
                    targetY = ghost.y * 2 - game.pacman.y;
                } else {
                    // Chase pacman
                    targetX = game.pacman.x;
                    targetY = game.pacman.y;
                }

                const dir = getDirection(ghost.x, ghost.y, targetX, targetY);

                if (dir.dist < 999) {
                    ghost.x += dir.dx;
                    ghost.y += dir.dy;
                }
            });
        }

        // Check collision with ghosts
        game.ghosts.forEach((ghost, index) => {
            if (ghost.x === game.pacman.x && ghost.y === game.pacman.y) {
                if (game.powerMode > 0) {
                    game.score += 200;
                    soundSystem.explosion();
                    ghost.x = ghost.startX;
                    ghost.y = ghost.startY;
                } else {
                    game.lives--;
                    soundSystem.hit();

                    if (game.lives > 0) {
                        // Reset positions
                        game.pacman.x = 1;
                        game.pacman.y = 1;
                        game.pacman.direction = 0;
                        game.ghosts.forEach(g => {
                            g.x = g.startX;
                            g.y = g.startY;
                        });
                        game.deathAnimation = 20;
                    } else {
                        game.gameOver = true;
                        game.deathAnimation = 30;
                        soundSystem.gameOver();
                    }
                }
            }
        });

        draw();
        requestAnimationFrame(update);
    }

    function draw() {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw maze
        maze.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell === 0) {
                    ctx.fillStyle = '#00f';
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#0088ff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                } else if (cell === 1) {
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(
                        x * TILE_SIZE + TILE_SIZE / 2,
                        y * TILE_SIZE + TILE_SIZE / 2,
                        3, 0, Math.PI * 2
                    );
                    ctx.fill();
                } else if (cell === 2) {
                    const pulse = Math.sin(Date.now() / 200) * 2;
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(
                        x * TILE_SIZE + TILE_SIZE / 2,
                        y * TILE_SIZE + TILE_SIZE / 2,
                        8 + pulse, 0, Math.PI * 2
                    );
                    ctx.fill();
                }
            });
        });

        // Draw pacman
        if (game.deathAnimation === 0 || game.deathAnimation % 2 === 0) {
            ctx.save();
            ctx.translate(
                game.pacman.x * TILE_SIZE + TILE_SIZE / 2,
                game.pacman.y * TILE_SIZE + TILE_SIZE / 2
            );
            ctx.rotate(game.pacman.direction * Math.PI / 180);

            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            const mouth = game.pacman.mouthOpen < 10 ? 0.2 : 0.7;
            ctx.arc(0, 0, TILE_SIZE / 2 - 2, mouth, Math.PI * 2 - mouth);
            ctx.lineTo(0, 0);
            ctx.fill();

            ctx.restore();
        }

        // Draw ghosts
        game.ghosts.forEach(ghost => {
            const ghostColor = game.powerMode > 0 ? '#0000ff' : ghost.color;
            ctx.fillStyle = ghostColor;

            const ghostX = ghost.x * TILE_SIZE + TILE_SIZE / 2;
            const ghostY = ghost.y * TILE_SIZE + TILE_SIZE / 2;

            // Body
            ctx.beginPath();
            ctx.arc(ghostX, ghostY, TILE_SIZE / 2 - 2, Math.PI, 0);
            ctx.lineTo(ghostX + TILE_SIZE / 2 - 2, ghostY + TILE_SIZE / 2 - 2);

            // Wave bottom
            for (let i = 0; i < 3; i++) {
                const waveX = ghostX + TILE_SIZE / 2 - 2 - (i * (TILE_SIZE - 4) / 3);
                ctx.lineTo(waveX - (TILE_SIZE - 4) / 6, ghostY + TILE_SIZE / 2 - 8);
                ctx.lineTo(waveX - (TILE_SIZE - 4) / 3, ghostY + TILE_SIZE / 2 - 2);
            }

            ctx.closePath();
            ctx.fill();

            // Eyes
            if (game.powerMode === 0) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(ghostX - 6, ghostY - 4, 5, 0, Math.PI * 2);
                ctx.arc(ghostX + 6, ghostY - 4, 5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(ghostX - 6, ghostY - 4, 2, 0, Math.PI * 2);
                ctx.arc(ghostX + 6, ghostY - 4, 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = '#fff';
                ctx.font = '16px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.fillText('!', ghostX, ghostY + 4);
            }
        });

        // Draw HUD
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Press Start 2P", "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${game.score}`, 10, canvas.height - 10);
        ctx.fillText(`LIVES: ${'♥'.repeat(game.lives)}`, 250, canvas.height - 10);
        if (game.powerMode > 0) {
            ctx.fillStyle = '#0ff';
            ctx.fillText(`POWER: ${Math.ceil(game.powerMode / 10)}`, 450, canvas.height - 10);
        }
        ctx.textAlign = 'center';
    }

    function drawDeathAnimation() {
        if (game.deathAnimation <= 0) {
            if (game.gameOver) {
                showGameOver();
            }
            return;
        }

        // Flash effect
        if (game.deathAnimation % 2 === 0) {
            draw();
        } else {
            ctx.fillStyle = '#f00';
            ctx.globalAlpha = 0.3;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;
        }

        game.deathAnimation--;
        setTimeout(() => requestAnimationFrame(() => drawDeathAnimation()), 50);
    }

    function showGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#f00';
        ctx.font = 'bold 36px "Press Start 2P", "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);

        ctx.fillStyle = '#fff';
        ctx.font = '20px "Press Start 2P", "Courier New"';
        ctx.fillText(`SCORE: ${game.score}`, canvas.width / 2, canvas.height / 2);

        ctx.font = '12px "Press Start 2P", "Courier New"';
        ctx.fillText('Press ESC to exit', canvas.width / 2, canvas.height / 2 + 60);
        ctx.textAlign = 'left';
    }

    function showWin() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 36px "Press Start 2P", "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 60);

        ctx.fillStyle = '#fff';
        ctx.font = '20px "Press Start 2P", "Courier New"';
        ctx.fillText(`SCORE: ${game.score}`, canvas.width / 2, canvas.height / 2);

        ctx.font = '12px "Press Start 2P", "Courier New"';
        ctx.fillText('Press ESC to exit', canvas.width / 2, canvas.height / 2 + 60);
        ctx.textAlign = 'left';
    }

    function handleKeydown(e) {
        keysPressed[e.key] = true;

        switch(e.key) {
            case 'ArrowUp':
            case 'w':
                game.pacman.nextDirection = -90;
                break;
            case 'ArrowDown':
            case 's':
                game.pacman.nextDirection = 90;
                break;
            case 'ArrowLeft':
            case 'a':
                game.pacman.nextDirection = 180;
                break;
            case 'ArrowRight':
            case 'd':
                game.pacman.nextDirection = 0;
                break;
            case 'Escape':
                cleanup();
                onExit();
                break;
        }
        e.preventDefault();
    }

    function handleKeyup(e) {
        keysPressed[e.key] = false;
    }

    function cleanup() {
        document.removeEventListener('keydown', handleKeydown);
        document.removeEventListener('keyup', handleKeyup);
    }

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('keyup', handleKeyup);

    draw();
    requestAnimationFrame(update);

    return { cleanup };
}
