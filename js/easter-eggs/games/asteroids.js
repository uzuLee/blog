// Asteroids Game
// Classic space shooter

import { soundSystem } from '../soundSystem.js';

export function createAsteroidsGame(container, canvas, onExit) {
    const ctx = canvas.getContext('2d');

    const game = {
        ship: {
            x: canvas.width / 2,
            y: canvas.height / 2,
            angle: 0,
            dx: 0,
            dy: 0,
            thrust: false,
            invincible: false,
            invincibleTimer: 0
        },
        bullets: [],
        asteroids: [],
        particles: [],
        score: 0,
        lives: 3,
        gameOver: false,
        deathAnimation: 0
    };

    let keysPressed = {};

    function spawnAsteroid(x, y, size = 3) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;

        game.asteroids.push({
            x: x !== undefined ? x : Math.random() * canvas.width,
            y: y !== undefined ? y : Math.random() * canvas.height,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }

    function createParticles(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            game.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 40,
                color
            });
        }
    }

    // Initialize asteroids
    for (let i = 0; i < 5; i++) {
        spawnAsteroid();
    }

    function update() {
        if (game.gameOver) {
            if (game.deathAnimation > 0) {
                game.deathAnimation--;
                // Update particles during death
                game.particles = game.particles.filter(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life--;
                    return p.life > 0;
                });
                draw();
                requestAnimationFrame(update);
            }
            return;
        }

        // Update invincibility
        if (game.ship.invincibleTimer > 0) {
            game.ship.invincibleTimer--;
            if (game.ship.invincibleTimer === 0) {
                game.ship.invincible = false;
            }
        }

        // Update ship
        if (keysPressed['ArrowLeft']) {
            game.ship.angle -= 0.1;
        }
        if (keysPressed['ArrowRight']) {
            game.ship.angle += 0.1;
        }
        if (keysPressed['ArrowUp']) {
            game.ship.thrust = true;
            game.ship.dx += Math.cos(game.ship.angle) * 0.1;
            game.ship.dy += Math.sin(game.ship.angle) * 0.1;
            // Thrust particles
            if (Math.random() < 0.3) {
                const thrustX = game.ship.x - Math.cos(game.ship.angle) * 10;
                const thrustY = game.ship.y - Math.sin(game.ship.angle) * 10;
                createParticles(thrustX, thrustY, '#ff0', 2);
            }
        } else {
            game.ship.thrust = false;
        }

        // Apply friction
        game.ship.dx *= 0.99;
        game.ship.dy *= 0.99;

        // Move ship
        game.ship.x += game.ship.dx;
        game.ship.y += game.ship.dy;

        // Wrap around screen
        if (game.ship.x < 0) game.ship.x = canvas.width;
        if (game.ship.x > canvas.width) game.ship.x = 0;
        if (game.ship.y < 0) game.ship.y = canvas.height;
        if (game.ship.y > canvas.height) game.ship.y = 0;

        // Update bullets
        game.bullets.forEach((bullet, i) => {
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;
            bullet.life--;

            if (bullet.life <= 0 ||
                bullet.x < 0 || bullet.x > canvas.width ||
                bullet.y < 0 || bullet.y > canvas.height) {
                game.bullets.splice(i, 1);
            }
        });

        // Update asteroids
        game.asteroids.forEach((asteroid) => {
            asteroid.x += asteroid.dx;
            asteroid.y += asteroid.dy;
            asteroid.rotation += asteroid.rotationSpeed;

            // Wrap around screen
            if (asteroid.x < 0) asteroid.x = canvas.width;
            if (asteroid.x > canvas.width) asteroid.x = 0;
            if (asteroid.y < 0) asteroid.y = canvas.height;
            if (asteroid.y > canvas.height) asteroid.y = 0;
        });

        // Update particles
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });

        // Check bullet-asteroid collisions
        game.bullets.forEach((bullet, bi) => {
            game.asteroids.forEach((asteroid, ai) => {
                const dx = bullet.x - asteroid.x;
                const dy = bullet.y - asteroid.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < asteroid.size * 10) {
                    game.bullets.splice(bi, 1);
                    game.asteroids.splice(ai, 1);
                    game.score += (4 - asteroid.size) * 10;

                    soundSystem.hit();
                    createParticles(asteroid.x, asteroid.y, '#888', 25);

                    // Spawn smaller asteroids
                    if (asteroid.size > 1) {
                        spawnAsteroid(asteroid.x, asteroid.y, asteroid.size - 1);
                        spawnAsteroid(asteroid.x, asteroid.y, asteroid.size - 1);
                    }

                    // Spawn new large asteroid if running low
                    if (game.asteroids.length < 3) {
                        spawnAsteroid();
                    }
                }
            });
        });

        // Check ship-asteroid collisions
        if (!game.ship.invincible) {
            game.asteroids.forEach((asteroid) => {
                const dx = game.ship.x - asteroid.x;
                const dy = game.ship.y - asteroid.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < asteroid.size * 10 + 10) {
                    game.lives--;
                    soundSystem.gameOver();
                    createParticles(game.ship.x, game.ship.y, '#0f0', 50);
                    game.asteroids = [];

                    if (game.lives > 0) {
                        // Respawn
                        game.ship.x = canvas.width / 2;
                        game.ship.y = canvas.height / 2;
                        game.ship.dx = 0;
                        game.ship.dy = 0;
                        game.ship.angle = 0;
                        game.ship.invincible = true;
                        game.ship.invincibleTimer = 120;

                        setTimeout(() => {
                            for (let i = 0; i < 5; i++) {
                                spawnAsteroid();
                            }
                        }, 1000);
                    } else {
                        game.gameOver = true;
                        game.deathAnimation = 30;
                        setTimeout(showGameOver, 1500);
                    }
                }
            });
        }

        draw();
        requestAnimationFrame(update);
    }

    function draw() {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw stars background
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 139) % canvas.width;
            const y = (i * 227) % canvas.height;
            ctx.fillRect(x, y, 1, 1);
        }

        // Draw ship (with invincibility flash)
        if (!game.gameOver && (!game.ship.invincible || Math.floor(Date.now() / 100) % 2 === 0)) {
            ctx.save();
            ctx.translate(game.ship.x, game.ship.y);
            ctx.rotate(game.ship.angle);

            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0f0';
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(-10, -10);
            ctx.lineTo(-5, 0);
            ctx.lineTo(-10, 10);
            ctx.closePath();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw thrust
            if (game.ship.thrust) {
                ctx.fillStyle = '#ff0';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ff0';
                ctx.beginPath();
                ctx.moveTo(-5, 0);
                ctx.lineTo(-15 - Math.random() * 5, -5);
                ctx.lineTo(-15 - Math.random() * 5, 5);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            ctx.restore();
        }

        // Draw bullets
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#fff';
        game.bullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.shadowBlur = 0;

        // Draw asteroids
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        game.asteroids.forEach(asteroid => {
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);

            ctx.shadowBlur = 8;
            ctx.shadowColor = '#888';
            ctx.beginPath();
            const points = 8;
            const radius = asteroid.size * 10;
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const r = radius + (Math.sin(i) * radius * 0.2);
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.restore();
        });

        // Draw particles
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 40;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 3, 3);
        });
        ctx.globalAlpha = 1;

        // Draw HUD
        ctx.fillStyle = '#0f0';
        ctx.font = '16px "Press Start 2P", "Courier New"';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#0f0';
        ctx.fillText(`SCORE: ${game.score}`, 10, 25);
        ctx.fillText(`LIVES: ${game.lives}`, 10, 50);
        ctx.shadowBlur = 0;

        // Draw controls
        ctx.font = '10px "Press Start 2P", "Courier New"';
        ctx.fillText('ARROWS: MOVE', 10, canvas.height - 40);
        ctx.fillText('SPACE: SHOOT', 10, canvas.height - 25);
        ctx.fillText('ESC: EXIT', 10, canvas.height - 10);
    }

    function showGameOver() {
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
    }

    function handleKeydown(e) {
        keysPressed[e.key] = true;

        if (e.key === ' ' && !game.gameOver) {
            e.preventDefault();
            game.bullets.push({
                x: game.ship.x + Math.cos(game.ship.angle) * 15,
                y: game.ship.y + Math.sin(game.ship.angle) * 15,
                dx: Math.cos(game.ship.angle) * 5 + game.ship.dx,
                dy: Math.sin(game.ship.angle) * 5 + game.ship.dy,
                life: 60
            });
            soundSystem.shoot();
        }

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
