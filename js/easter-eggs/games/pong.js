// Pong Game
// Classic pong with AI opponent

import { soundSystem } from '../soundSystem.js';
import { multiGame } from '../multi-game.js';

export function createPongGame(container, canvas, onExit) {
    const ctx = canvas.getContext('2d');
    const PADDLE_WIDTH = 15;
    const PADDLE_HEIGHT = 100;
    const BALL_SIZE = 15;
    const WIN_SCORE = 11;

    const game = {
        player: {
            x: 30,
            y: canvas.height / 2 - PADDLE_HEIGHT / 2,
            score: 0,
            dy: 0
        },
        ai: {
            x: canvas.width - 30 - PADDLE_WIDTH,
            y: canvas.height / 2 - PADDLE_HEIGHT / 2,
            score: 0
        },
        ball: {
            x: canvas.width / 2,
            y: canvas.height / 2,
            dx: 5,
            dy: 3,
            speed: 5,
            trail: []
        },
        particles: [],
        gameOver: false,
        waitingForServe: true
    };

    let keysPressed = {};

    function createParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            game.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                color
            });
        }
    }

    let lastTime = 0;
    function update(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const dt = (timestamp - lastTime) / (1000 / 60); // dt as a multiplier for 60fps

        if (game.gameOver) return;

        // Move player paddle
        if (keysPressed['ArrowUp']) {
            game.player.y = Math.max(0, game.player.y - 8);
        }
        if (keysPressed['ArrowDown']) {
            game.player.y = Math.min(canvas.height - PADDLE_HEIGHT, game.player.y + 8);
        }

        // AI follows ball with slight delay for challenge
        const aiCenter = game.ai.y + PADDLE_HEIGHT / 2;
        const ballCenter = game.ball.y + BALL_SIZE / 2;
        const aiSpeed = 6;
        if (aiCenter < ballCenter - 15) {
            game.ai.y = Math.min(canvas.height - PADDLE_HEIGHT, game.ai.y + aiSpeed);
        } else if (aiCenter > ballCenter + 15) {
            game.ai.y = Math.max(0, game.ai.y - aiSpeed);
        }

        // Ball trail
        game.ball.trail.push({ x: game.ball.x, y: game.ball.y });
        if (game.ball.trail.length > 5) game.ball.trail.shift();

        if (!game.waitingForServe) {
            // Move ball
            game.ball.x += game.ball.dx * dt;
            game.ball.y += game.ball.dy * dt;
        } else {
            // ball fixed at center until serve
        }

        // Ball collision with top/bottom
        if (game.ball.y <= 0 || game.ball.y >= canvas.height - BALL_SIZE) {
            game.ball.dy *= -1;
            soundSystem.hit();
            createParticles(game.ball.x + BALL_SIZE / 2, game.ball.y + BALL_SIZE / 2, '#fff', 8);
        }

        // Ball collision with player paddle
        if (game.ball.x <= game.player.x + PADDLE_WIDTH &&
            game.ball.y + BALL_SIZE >= game.player.y &&
            game.ball.y <= game.player.y + PADDLE_HEIGHT &&
            game.ball.dx < 0) {
            game.ball.dx = Math.abs(game.ball.dx);
            game.ball.dy += (game.ball.y - (game.player.y + PADDLE_HEIGHT / 2)) * 0.1;
            game.ball.speed *= 1.05;
            game.ball.dx = game.ball.speed;
            soundSystem.hit();
            createParticles(game.ball.x + BALL_SIZE / 2, game.ball.y + BALL_SIZE / 2, '#0f0', 15);
        }

        // Ball collision with AI paddle
        if (game.ball.x + BALL_SIZE >= game.ai.x &&
            game.ball.y + BALL_SIZE >= game.ai.y &&
            game.ball.y <= game.ai.y + PADDLE_HEIGHT &&
            game.ball.dx > 0) {
            game.ball.dx = -Math.abs(game.ball.dx);
            game.ball.dy += (game.ball.y - (game.ai.y + PADDLE_HEIGHT / 2)) * 0.1;
            soundSystem.hit();
            createParticles(game.ball.x + BALL_SIZE / 2, game.ball.y + BALL_SIZE / 2, '#f00', 15);
        }

        // Score
        if (game.ball.x < 0) {
            game.ai.score++;
            soundSystem.gameOver();
            resetBall();
            if (game.ai.score >= WIN_SCORE) {
                endGame(false);
                return;
            }
        } else if (game.ball.x > canvas.width) {
            game.player.score++;
            soundSystem.collect();
            resetBall();
            if (game.player.score >= WIN_SCORE) {
                endGame(true);
                return;
            }
        }

        // Update particles
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });

        draw();
        requestAnimationFrame(update);
        lastTime = timestamp;
    }

    function resetBall() {
        game.ball.x = canvas.width/2;
        game.ball.y = canvas.height/2;
        game.ball.dx = 0;
        game.ball.dy = 0;
        game.waitingForServe = true;
        game.ball.invulnerableUntil = Date.now() + 800; // 800ms 무적(시작 전)
    }

    function endGame(won) {
        draw(); // Draw one last time to update score display
        game.gameOver = true;
        setTimeout(() => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = 'bold 48px "Press Start 2P", "Courier New"';
            ctx.textAlign = 'center';
            if (won) {
                ctx.fillStyle = '#ff0';
                ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 30);
                soundSystem.powerUp();
            } else {
                ctx.fillStyle = '#f00';
                ctx.fillText('YOU LOSE!', canvas.width / 2, canvas.height / 2 - 30);
            }

            ctx.fillStyle = '#0f0';
            ctx.font = '20px "Press Start 2P", "Courier New"';
            ctx.fillText(`FINAL: ${game.player.score} - ${game.ai.score}`, canvas.width / 2, canvas.height / 2 + 20);
            ctx.font = '14px "Press Start 2P", "Courier New"';
            ctx.fillText('ESC TO EXIT', canvas.width / 2, canvas.height / 2 + 60);
            ctx.fillText('R TO RESTART', canvas.width / 2, canvas.height / 2 + 90);
        }, 100);
    }

    function draw() {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw center line
        ctx.strokeStyle = '#0f0';
        ctx.globalAlpha = 0.3;
        ctx.setLineDash([10, 10]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Draw ball trail
        game.ball.trail.forEach((pos, i) => {
            ctx.globalAlpha = (i + 1) / game.ball.trail.length * 0.5;
            ctx.fillStyle = '#fff';
            ctx.fillRect(pos.x, pos.y, BALL_SIZE, BALL_SIZE);
        });
        ctx.globalAlpha = 1;

        // Draw paddles with glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0f0';
        ctx.fillStyle = '#0f0';
        ctx.fillRect(game.player.x, game.player.y, PADDLE_WIDTH, PADDLE_HEIGHT);

        ctx.shadowColor = '#f00';
        ctx.fillStyle = '#f00';
        ctx.fillRect(game.ai.x, game.ai.y, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.shadowBlur = 0;

        // Draw ball with glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fff';
        ctx.fillStyle = '#fff';
        ctx.fillRect(game.ball.x, game.ball.y, BALL_SIZE, BALL_SIZE);
        ctx.shadowBlur = 0;

        // Draw particles
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 3, 3);
        });
        ctx.globalAlpha = 1;

        // Draw scores with Press Start 2P font
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 48px "Press Start 2P", "Courier New"';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0f0';
        ctx.fillText(game.player.score.toString(), canvas.width / 4, 60);

        ctx.fillStyle = '#f00';
        ctx.shadowColor = '#f00';
        ctx.fillText(game.ai.score.toString(), canvas.width * 3 / 4, 60);
        ctx.shadowBlur = 0;

        // Draw instructions
        ctx.fillStyle = '#0f0';
        ctx.font = '12px "Press Start 2P", "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText('ARROWS: MOVE', 10, canvas.height - 10);
        ctx.textAlign = 'right';
        ctx.fillText(`FIRST TO ${WIN_SCORE}`, canvas.width - 10, canvas.height - 10);
        ctx.textAlign = 'left';

        if (game.waitingForServe) {
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Press Start 2P", "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText('PRESS SPACE TO SERVE', canvas.width / 2, canvas.height / 2 + 50);
        }
    }

    function resetGame() {
        game.player = {
            x: 30,
            y: canvas.height / 2 - PADDLE_HEIGHT / 2,
            score: 0,
            dy: 0
        };
        game.ai = {
            x: canvas.width - 30 - PADDLE_WIDTH,
            y: canvas.height / 2 - PADDLE_HEIGHT / 2,
            score: 0
        };
        game.ball = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            dx: 5,
            dy: 3,
            speed: 5,
            trail: []
        };
        game.particles = [];
        game.gameOver = false;
        game.waitingForServe = true;
        keysPressed = {};
        lastTime = 0;
        // Call showCountdown before starting the game loop
        multiGame.showCountdown(canvas, () => {
            requestAnimationFrame(update);
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

        // Game is running
        if (e.key === 'Escape') {
            endGame(false); // Trigger game over (player loses)
            return;
        }

        if (game.waitingForServe && (e.key === ' ' || e.key === 'Enter')) {
            game.waitingForServe = false;
            const dir = Math.random() > 0.5 ? 1 : -1;
            game.ball.dx = dir * 5;
            game.ball.dy = (Math.random() - 0.5) * 6;
            soundSystem.select && soundSystem.select();
            return;
        }
        keysPressed[e.key] = true;
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
