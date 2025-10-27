// Snake Game
// Classic snake game with retro aesthetics

import { soundSystem } from '../soundSystem.js';

export function createSnakeGame(container, canvas, onExit) {
    const ctx = canvas.getContext('2d');
    const GRID_SIZE = 20;
    const TILE_SIZE = Math.floor(canvas.width / GRID_SIZE);

    let snake = [{ x: 10, y: 10 }];
    let direction = { x: 1, y: 0 };
    let nextDirection = { x: 1, y: 0 };
    let food = null;
    let score = 0;
    let gameOver = false;
    let gameSpeed = 120;
    let lastUpdate = 0;
    let deathAnimation = 0;

    // Generate random food position
    function spawnFood() {
        let newFood;
        let attempts = 0;
        do {
            newFood = {
                x: Math.floor(Math.random() * (GRID_SIZE - 1)),
                y: Math.floor(Math.random() * (GRID_SIZE - 1))
            };
            attempts++;
        } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) && attempts < 100);

        food = newFood;
        soundSystem.powerUp();
    }

    function update(timestamp) {
        if (gameOver) {
            drawDeathAnimation();
            return;
        }

        if (timestamp - lastUpdate < gameSpeed) {
            requestAnimationFrame(update);
            return;
        }
        lastUpdate = timestamp;

        // Update direction
        direction = nextDirection;

        // Calculate new head position
        const newHead = {
            x: (snake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
            y: (snake[0].y + direction.y + GRID_SIZE) % GRID_SIZE
        };

        // Check self collision
        if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
            gameOver = true;
            soundSystem.gameOver();
            deathAnimation = 30;
            drawDeathAnimation();
            return;
        }

        snake.unshift(newHead);

        // Check food collision
        if (food && newHead.x === food.x && newHead.y === food.y) {
            score += 10;
            gameSpeed = Math.max(50, gameSpeed - 2);
            soundSystem.collect();
            spawnFood();
        } else {
            snake.pop();
        }

        draw();
        requestAnimationFrame(update);
    }

    function draw() {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.lineWidth = 1;
        const maxWidth = GRID_SIZE * TILE_SIZE;
        const maxHeight = GRID_SIZE * TILE_SIZE;
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * TILE_SIZE, 0);
            ctx.lineTo(i * TILE_SIZE, maxHeight);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * TILE_SIZE);
            ctx.lineTo(maxWidth, i * TILE_SIZE);
            ctx.stroke();
        }

        // Draw snake
        snake.forEach((segment, index) => {
            const brightness = Math.max(50, 255 - (index * 3));
            ctx.fillStyle = index === 0 ? '#0f0' : `rgb(0, ${brightness}, 0)`;
            ctx.fillRect(
                segment.x * TILE_SIZE + 2,
                segment.y * TILE_SIZE + 2,
                TILE_SIZE - 4,
                TILE_SIZE - 4
            );

            // Draw eyes on head
            if (index === 0) {
                ctx.fillStyle = '#000';
                const eyeSize = 4;
                const eyeOffsetX = direction.x === 0 ? 8 : (direction.x > 0 ? 16 : 4);
                const eyeOffsetY = direction.y === 0 ? 8 : (direction.y > 0 ? 16 : 4);

                if (direction.x !== 0) {
                    ctx.fillRect(segment.x * TILE_SIZE + eyeOffsetX, segment.y * TILE_SIZE + 6, eyeSize, eyeSize);
                    ctx.fillRect(segment.x * TILE_SIZE + eyeOffsetX, segment.y * TILE_SIZE + 18, eyeSize, eyeSize);
                } else {
                    ctx.fillRect(segment.x * TILE_SIZE + 6, segment.y * TILE_SIZE + eyeOffsetY, eyeSize, eyeSize);
                    ctx.fillRect(segment.x * TILE_SIZE + 18, segment.y * TILE_SIZE + eyeOffsetY, eyeSize, eyeSize);
                }
            }
        });

        // Draw food with animation
        if (food) {
            const pulse = Math.sin(Date.now() / 200) * 2;
            ctx.fillStyle = '#f00';
            ctx.fillRect(
                food.x * TILE_SIZE + 4 - pulse,
                food.y * TILE_SIZE + 4 - pulse,
                TILE_SIZE - 8 + pulse * 2,
                TILE_SIZE - 8 + pulse * 2
            );
            ctx.fillStyle = '#ff0';
            ctx.fillRect(
                food.x * TILE_SIZE + 8,
                food.y * TILE_SIZE + 8,
                TILE_SIZE - 16,
                TILE_SIZE - 16
            );
        }

        // Draw score
        ctx.fillStyle = '#0f0';
        ctx.font = '16px "Press Start 2P", "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 10, 25);
        ctx.fillText(`LENGTH: ${snake.length}`, 10, 50);
    }

    function drawDeathAnimation() {
        if (deathAnimation <= 0) {
            showGameOver();
            return;
        }

        // Flash effect
        if (deathAnimation % 2 === 0) {
            draw();
        } else {
            ctx.fillStyle = '#f00';
            ctx.globalAlpha = 0.3;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;
        }

        deathAnimation--;
        setTimeout(() => requestAnimationFrame(() => drawDeathAnimation()), 50);
    }

    function showGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#f00';
        ctx.font = 'bold 36px "Press Start 2P", "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);

        ctx.fillStyle = '#0f0';
        ctx.font = '20px "Press Start 2P", "Courier New"';
        ctx.fillText(`SCORE: ${score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText(`LENGTH: ${snake.length}`, canvas.width / 2, canvas.height / 2 + 40);

        ctx.font = '12px "Press Start 2P", "Courier New"';
        ctx.fillStyle = '#fff';
        ctx.fillText('Press ESC to exit', canvas.width / 2, canvas.height / 2 + 90);
        ctx.textAlign = 'left';
    }

    function handleKeydown(e) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
                if (direction.y === 0) {
                    nextDirection = { x: 0, y: -1 };
                    soundSystem.rotate();
                }
                break;
            case 'ArrowDown':
            case 's':
                if (direction.y === 0) {
                    nextDirection = { x: 0, y: 1 };
                    soundSystem.rotate();
                }
                break;
            case 'ArrowLeft':
            case 'a':
                if (direction.x === 0) {
                    nextDirection = { x: -1, y: 0 };
                    soundSystem.rotate();
                }
                break;
            case 'ArrowRight':
            case 'd':
                if (direction.x === 0) {
                    nextDirection = { x: 1, y: 0 };
                    soundSystem.rotate();
                }
                break;
            case 'Escape':
                cleanup();
                onExit();
                break;
        }
        e.preventDefault();
    }

    function cleanup() {
        document.removeEventListener('keydown', handleKeydown);
    }

    document.addEventListener('keydown', handleKeydown);
    spawnFood();
    draw();
    requestAnimationFrame(update);

    return { cleanup };
}
