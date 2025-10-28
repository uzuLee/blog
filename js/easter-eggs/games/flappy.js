// Flappy Bird Game
// Flappy bird clone with retro style

import { soundSystem } from '../soundSystem.js';

export function createFlappyGame(container, canvas, onExit) {
    const ctx = canvas.getContext('2d');
    const BIRD_SIZE = 30;
    const PIPE_WIDTH = 60;
    const PIPE_GAP = 180;
    const GRAVITY = 0.32; // 기존보다 완화 (예: 0.5 -> 0.32)
    const FLAP_STRENGTH = -10;

    const game = {
        bird: {
            x: 150,
            y: canvas.height / 2,
            dy: 0,
            rotation: 0
        },
        pipes: [],
        particles: [],
        score: 0,
        gameOver: false,
        deathAnimation: 0,
        pipeTimer: 0
    };

    function spawnPipe() {
        const minY = 100;
        const maxY = canvas.height - PIPE_GAP - 100;
        const y = Math.random() * (maxY - minY) + minY;

        game.pipes.push({
            x: canvas.width,
            topHeight: y,
            bottomY: y + PIPE_GAP,
            scored: false
        });
    }

    function createParticles(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            game.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 3,
                life: 50,
                color
            });
        }
    }

    function update() {
        if (game.gameOver) {
            if (game.deathAnimation > 0) {
                game.deathAnimation--;
                // Update particles during death
                game.particles = game.particles.filter(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.4; // Gravity
                    p.life--;
                    return p.life > 0;
                });
                draw();
                requestAnimationFrame(update);
            }
            return;
        }

        // Update bird
        game.bird.dy += GRAVITY;
        game.bird.y += game.bird.dy;
        game.bird.rotation = Math.min(Math.max(game.bird.dy * 3, -30), 90);

        // Check ground/ceiling collision
        if (game.bird.y < 0 || game.bird.y > canvas.height - BIRD_SIZE) {
            endGame();
            return;
        }

        // Spawn pipes
        game.pipeTimer++;
        if (game.pipeTimer > 90) {
            spawnPipe();
            game.pipeTimer = 0;
        }

        // Update pipes
        game.pipes.forEach((pipe, index) => {
            pipe.x -= 3;

            // Check collision
            if (game.bird.x + BIRD_SIZE > pipe.x &&
                game.bird.x < pipe.x + PIPE_WIDTH) {
                if (game.bird.y < pipe.topHeight ||
                    game.bird.y + BIRD_SIZE > pipe.bottomY) {
                    endGame();
                    return;
                }
            }

            // Score
            if (!pipe.scored && pipe.x + PIPE_WIDTH < game.bird.x) {
                pipe.scored = true;
                game.score++;
                soundSystem.collect();
                createParticles(game.bird.x, game.bird.y + BIRD_SIZE / 2, '#ff0', 15);
            }

            // Remove off-screen pipes
            if (pipe.x < -PIPE_WIDTH) {
                game.pipes.splice(index, 1);
            }
        });

        // Update particles
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.4; // Gravity
            p.life--;
            return p.life > 0;
        });

        draw();
        requestAnimationFrame(update);
    }

    function draw() {
        // Clear canvas with sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98D8E8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw pipes
        game.pipes.forEach(pipe => {
            // Top pipe
            ctx.fillStyle = '#0f0';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0a0';
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
            ctx.strokeStyle = '#0a0';
            ctx.lineWidth = 3;
            ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

            // Pipe cap
            ctx.fillStyle = '#0a0';
            ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);

            // Bottom pipe
            ctx.fillStyle = '#0f0';
            ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY);
            ctx.strokeStyle = '#0a0';
            ctx.strokeRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY);

            // Pipe cap
            ctx.fillStyle = '#0a0';
            ctx.fillRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 20);
            ctx.shadowBlur = 0;
        });

        // Draw particles
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 50;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
        });
        ctx.globalAlpha = 1;

        // Draw bird with death animation flash
        if (!game.gameOver || (game.deathAnimation > 0 && game.deathAnimation % 4 < 2)) {
            ctx.save();
            ctx.translate(game.bird.x + BIRD_SIZE / 2, game.bird.y + BIRD_SIZE / 2);
            ctx.rotate(game.bird.rotation * Math.PI / 180);

            // Bird body
            ctx.fillStyle = '#ff0';
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#ff0';
            ctx.fillRect(-BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);

            // Bird eye
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000';
            ctx.fillRect(BIRD_SIZE / 4, -BIRD_SIZE / 4, 6, 6);

            // Bird beak
            ctx.fillStyle = '#f80';
            ctx.fillRect(BIRD_SIZE / 2, 0, 8, 4);

            ctx.restore();
        }

        // Draw score
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.font = 'bold 48px "Press Start 2P", "Courier New"';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#000';
        ctx.strokeText(game.score.toString(), canvas.width / 2, 60);
        ctx.fillText(game.score.toString(), canvas.width / 2, 60);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';

        // Draw instructions
        if (game.pipes.length === 0) {
            ctx.fillStyle = '#000';
            ctx.font = '16px "Press Start 2P", "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText('SPACE TO FLAP', canvas.width / 2, canvas.height / 2 + 50);
            ctx.textAlign = 'left';
        }
    }

    function endGame() {
        game.gameOver = true;
        game.deathAnimation = 20; // 20 frame death animation
        soundSystem.gameOver();
        createParticles(game.bird.x + BIRD_SIZE / 2, game.bird.y + BIRD_SIZE / 2, '#ff0', 40);

        setTimeout(() => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#f00';
            ctx.font = 'bold 48px "Press Start 2P", "Courier New"';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#f00';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.font = '20px "Press Start 2P", "Courier New"';
            ctx.fillText(`SCORE: ${game.score}`, canvas.width / 2, canvas.height / 2 + 20);
            ctx.font = '14px "Press Start 2P", "Courier New"';
            ctx.fillText('ESC TO EXIT', canvas.width / 2, canvas.height / 2 + 60);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
        }, 1000);
    }

    function handleKeydown(e) {
        if (e.key === ' ' && !game.gameOver) {
            game.bird.dy = FLAP_STRENGTH;
            soundSystem.jump();
        }
        if (e.key === 'Escape') {
            cleanup();
            onExit();
        }
    }

    function cleanup() {
        document.removeEventListener('keydown', handleKeydown);
    }

    document.addEventListener('keydown', handleKeydown);

    // Start the game
    spawnPipe();
    draw();
    requestAnimationFrame(update);

    return { cleanup };
}
