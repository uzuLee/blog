// Breakout Game
// Classic brick breaker

import { soundSystem } from '../soundSystem.js';

export function createBreakoutGame(container, canvas, onExit) {
    const ctx = canvas.getContext('2d');
    const PADDLE_WIDTH = 100;
    const PADDLE_HEIGHT = 15;
    const BALL_SIZE = 12;
    const BRICK_ROWS = 6;
    const BRICK_COLS = 10;
    const BRICK_WIDTH = canvas.width / BRICK_COLS - 10;
    const BRICK_HEIGHT = 25;

    const game = {
        paddle: {
            x: canvas.width / 2 - PADDLE_WIDTH / 2,
            y: canvas.height - 40,
            dx: 0
        },
        ball: {
            x: canvas.width / 2,
            y: canvas.height - 60,
            dx: 4,
            dy: -4,
            attached: true
        },
        bricks: [],
        particles: [],
        score: 0,
        lives: 3,
        gameState: 'playing' // playing, gameover, won
    };

    // Create bricks
    const colors = ['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f'];
    for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
            game.bricks.push({
                x: col * (BRICK_WIDTH + 10) + 5,
                y: row * (BRICK_HEIGHT + 5) + 50,
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                color: colors[row],
                alive: true,
                points: (BRICK_ROWS - row) * 10
            });
        }
    }

    let keysPressed = {};

    function createParticles(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            game.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 40,
                color
            });
        }
    }

    function update() {
        if (game.gameState !== 'playing') return;

        // Move paddle
        if (keysPressed['ArrowLeft']) {
            game.paddle.x = Math.max(0, game.paddle.x - 10);
        }
        if (keysPressed['ArrowRight']) {
            game.paddle.x = Math.min(canvas.width - PADDLE_WIDTH, game.paddle.x + 10);
        }

        // Launch ball
        if (game.ball.attached && keysPressed[' ']) {
            game.ball.attached = false;
            soundSystem.select();
        }

        // Move ball
        if (game.ball.attached) {
            game.ball.x = game.paddle.x + PADDLE_WIDTH / 2;
            game.ball.y = game.paddle.y - BALL_SIZE;
        } else {
            game.ball.x += game.ball.dx;
            game.ball.y += game.ball.dy;

            // Ball collision with walls
            if (game.ball.x <= 0 || game.ball.x >= canvas.width - BALL_SIZE) {
                game.ball.dx *= -1;
                soundSystem.hit();
                createParticles(game.ball.x + BALL_SIZE / 2, game.ball.y + BALL_SIZE / 2, '#fff', 10);
            }
            if (game.ball.y <= 0) {
                game.ball.dy *= -1;
                soundSystem.hit();
                createParticles(game.ball.x + BALL_SIZE / 2, game.ball.y + BALL_SIZE / 2, '#fff', 10);
            }

            // Ball collision with paddle
            if (game.ball.y + BALL_SIZE >= game.paddle.y &&
                game.ball.x + BALL_SIZE >= game.paddle.x &&
                game.ball.x <= game.paddle.x + PADDLE_WIDTH &&
                game.ball.dy > 0) {
                game.ball.dy = -Math.abs(game.ball.dy);
                // Add spin based on where ball hits paddle
                const hitPos = (game.ball.x - game.paddle.x) / PADDLE_WIDTH;
                game.ball.dx = (hitPos - 0.5) * 10;
                soundSystem.hit();
                createParticles(game.ball.x + BALL_SIZE / 2, game.ball.y + BALL_SIZE / 2, '#0f0', 15);
            }

            // Ball falls off bottom
            if (game.ball.y > canvas.height) {
                game.lives--;
                soundSystem.gameOver();
                createParticles(game.ball.x + BALL_SIZE / 2, canvas.height - 10, '#f00', 30);
                if (game.lives > 0) {
                    game.ball.attached = true;
                    game.ball.x = canvas.width / 2;
                    game.ball.y = canvas.height - 60;
                    game.ball.dx = 4;
                    game.ball.dy = -4;
                } else {
                    showGameOver();
                    return;
                }
            }

            // Ball collision with bricks
            game.bricks.forEach(brick => {
                if (!brick.alive) return;

                if (game.ball.x + BALL_SIZE > brick.x &&
                    game.ball.x < brick.x + brick.width &&
                    game.ball.y + BALL_SIZE > brick.y &&
                    game.ball.y < brick.y + brick.height) {
                    brick.alive = false;
                    game.score += brick.points;
                    game.ball.dy *= -1;
                    soundSystem.collect();
                    createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 30);
                }
            });

            // Check win
            if (game.bricks.every(b => !b.alive)) {
                showWin();
                return;
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

        // Draw bricks
        game.bricks.forEach(brick => {
            if (!brick.alive) return;

            ctx.fillStyle = brick.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = brick.color;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
            ctx.shadowBlur = 0;
        });

        // Draw paddle
        const gradient = ctx.createLinearGradient(
            game.paddle.x, 0,
            game.paddle.x + PADDLE_WIDTH, 0
        );
        gradient.addColorStop(0, '#0a0');
        gradient.addColorStop(0.5, '#0f0');
        gradient.addColorStop(1, '#0a0');
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0f0';
        ctx.fillRect(game.paddle.x, game.paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.shadowBlur = 0;

        // Draw ball
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fff';
        ctx.beginPath();
        ctx.arc(game.ball.x + BALL_SIZE / 2, game.ball.y + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

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
        ctx.fillText(`SCORE: ${game.score}`, 10, 25);
        ctx.fillText(`LIVES: ${'♥'.repeat(game.lives)}`, canvas.width - 180, 25);
        ctx.shadowBlur = 0;

        if (game.ball.attached) {
            ctx.font = '14px "Press Start 2P", "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText('SPACE TO LAUNCH', canvas.width / 2, canvas.height - 60);
            ctx.textAlign = 'left';
        }
    }

    function showGameOver() {
        game.gameState = 'gameover';
        soundSystem.gameOver();
        setTimeout(() => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#f00';
            ctx.font = 'bold 48px "Press Start 2P", "Courier New"';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#f00';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

            ctx.fillStyle = '#0f0';
            ctx.shadowColor = '#0f0';
            ctx.font = '20px "Press Start 2P", "Courier New"';
            ctx.fillText(`SCORE: ${game.score}`, canvas.width / 2, canvas.height / 2 + 20);
            ctx.font = '14px "Press Start 2P", "Courier New"';
            ctx.fillText('ESC TO EXIT', canvas.width / 2, canvas.height / 2 + 60);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
        }, 300);
    }

    function showWin() {
        game.gameState = 'won';
        soundSystem.powerUp();
        // Victory particles
        for (let i = 0; i < 100; i++) {
            createParticles(Math.random() * canvas.width, Math.random() * canvas.height,
                            ['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f'][Math.floor(Math.random() * 6)], 1);
        }

        setTimeout(() => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#ff0';
            ctx.font = 'bold 48px "Press Start 2P", "Courier New"';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff0';
            ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 30);

            ctx.fillStyle = '#0f0';
            ctx.shadowColor = '#0f0';
            ctx.font = '20px "Press Start 2P", "Courier New"';
            ctx.fillText(`SCORE: ${game.score}`, canvas.width / 2, canvas.height / 2 + 20);
            ctx.font = '14px "Press Start 2P", "Courier New"';
            ctx.fillText('ESC TO EXIT', canvas.width / 2, canvas.height / 2 + 60);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
        }, 300);
    }

    function handleKeydown(e) {
        keysPressed[e.key] = true;
        if (e.key === 'Escape') {
            cleanup();
            onExit();
        }
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
