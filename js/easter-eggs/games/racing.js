// Racing Game
// Top-down retro racing with obstacles and power-ups

import { soundSystem } from '../soundSystem.js';
import { multiGame } from '../multi-game.js';

export function createRacingGame(container, canvas, onExit) {
    const ctx = canvas.getContext('2d');
    const ROAD_WIDTH = 300;
    const ROAD_X = (canvas.width - ROAD_WIDTH) / 2;

    const game = {
        player: {
            x: canvas.width / 2,
            y: canvas.height - 100,
            width: 30,
            height: 50,
            speed: 0,
            maxSpeed: 15,
            acceleration: 0.3,
            friction: 0.95,
            turnSpeed: 5
        },
        roadScroll: 0,
        scrollSpeed: 5,
        obstacles: [],
        powerUps: [],
        particles: [],
        score: 0,
        distance: 0,
        gameOver: false,
        spawnTimer: 0,
        spawnInterval: 60,
        keys: {},
        boost: false,
        boostTimer: 0
    };

    const OBSTACLE_TYPES = [
        { type: 'cone', width: 20, height: 20, color: '#f80', points: 10 },
        { type: 'car', width: 30, height: 50, color: '#f00', points: 20 },
        { type: 'truck', width: 40, height: 70, color: '#00f', points: 30 },
        { type: 'oil', width: 25, height: 25, color: '#222', points: 15 }
    ];

    const POWERUP_TYPES = [
        { type: 'boost', color: '#ff0', icon: '⚡' },
        { type: 'shield', color: '#0ff', icon: '🛡️' },
        { type: 'coin', color: '#fd0', icon: '●' }
    ];

    function spawnObstacle() {
        const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
        const laneWidth = ROAD_WIDTH / 3;
        const lane = Math.floor(Math.random() * 3);
        const x = ROAD_X + laneWidth / 2 + lane * laneWidth - type.width / 2;

        game.obstacles.push({
            x,
            y: -type.height,
            width: type.width,
            height: type.height,
            color: type.color,
            type: type.type,
            points: type.points
        });
    }

    function spawnPowerUp() {
        if (Math.random() < 0.3) { // 30% chance
            const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
            const x = ROAD_X + Math.random() * (ROAD_WIDTH - 20) + 10;

            game.powerUps.push({
                x,
                y: -20,
                width: 20,
                height: 20,
                type: type.type,
                color: type.color,
                icon: type.icon
            });
        }
    }

    function createExplosion(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            game.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30,
                color: color || '#f80',
                size: 2 + Math.random() * 3
            });
        }
    }

    function checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    function update() {
        if (game.gameOver) return;

        // Player movement
        if (game.keys['ArrowLeft'] || game.keys['a']) {
            game.player.x -= game.player.turnSpeed;
            if (game.player.x < ROAD_X) game.player.x = ROAD_X;
        }
        if (game.keys['ArrowRight'] || game.keys['d']) {
            game.player.x += game.player.turnSpeed;
            if (game.player.x + game.player.width > ROAD_X + ROAD_WIDTH) {
                game.player.x = ROAD_X + ROAD_WIDTH - game.player.width;
            }
        }

        // Acceleration
        if (game.keys['ArrowUp'] || game.keys['w']) {
            game.player.speed += game.player.acceleration;
            if (game.player.speed > game.player.maxSpeed) {
                game.player.speed = game.player.maxSpeed;
            }
        } else {
            game.player.speed *= game.player.friction;
        }

        // Boost effect
        if (game.boost) {
            game.boostTimer--;
            game.scrollSpeed = 12;
            if (game.boostTimer <= 0) {
                game.boost = false;
                game.scrollSpeed = 5 + game.player.speed * 0.5;
            }
        } else {
            game.scrollSpeed = 5 + game.player.speed * 0.5;
        }

        // Update road scroll
        game.roadScroll += game.scrollSpeed;
        game.distance += game.scrollSpeed;
        game.score += Math.floor(game.scrollSpeed / 5);

        // Spawn obstacles
        game.spawnTimer++;
        if (game.spawnTimer > game.spawnInterval) {
            game.spawnTimer = 0;
            game.spawnInterval = Math.max(30, 60 - Math.floor(game.distance / 1000));
            spawnObstacle();
            spawnPowerUp();
        }

        // Update obstacles
        game.obstacles = game.obstacles.filter(obs => {
            obs.y += game.scrollSpeed;

            // Check collision with player
            if (checkCollision(game.player, obs)) {
                createExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.color);
                soundSystem.explosion();
                game.gameOver = true;
                showGameOver();
                return false;
            }

            return obs.y < canvas.height + obs.height;
        });

        // Update power-ups
        game.powerUps = game.powerUps.filter(pu => {
            pu.y += game.scrollSpeed;

            // Check collision with player
            if (checkCollision(game.player, pu)) {
                createExplosion(pu.x, pu.y, pu.color);
                soundSystem.collect();

                switch (pu.type) {
                    case 'boost':
                        game.boost = true;
                        game.boostTimer = 120;
                        soundSystem.powerUp();
                        break;
                    case 'shield':
                        game.score += 100;
                        break;
                    case 'coin':
                        game.score += 50;
                        break;
                }
                return false;
            }

            return pu.y < canvas.height;
        });

        // Update particles
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });

        draw();
        requestAnimationFrame(update);
    }

    function draw() {
        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grass on sides
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(0, 0, ROAD_X, canvas.height);
        ctx.fillRect(ROAD_X + ROAD_WIDTH, 0, ROAD_X, canvas.height);

        // Draw road
        ctx.fillStyle = '#333';
        ctx.fillRect(ROAD_X, 0, ROAD_WIDTH, canvas.height);

        // Draw road lines
        ctx.fillStyle = '#fff';
        const lineHeight = 40;
        const lineGap = 20;
        for (let i = -1; i < canvas.height / (lineHeight + lineGap) + 1; i++) {
            const y = (i * (lineHeight + lineGap) - (game.roadScroll % (lineHeight + lineGap)));

            // Center line
            ctx.fillRect(canvas.width / 2 - 2, y, 4, lineHeight);

            // Lane markers
            const laneWidth = ROAD_WIDTH / 3;
            ctx.fillRect(ROAD_X + laneWidth - 2, y, 4, lineHeight / 2);
            ctx.fillRect(ROAD_X + laneWidth * 2 - 2, y, 4, lineHeight / 2);
        }

        // Draw road edges
        ctx.fillStyle = '#ff0';
        ctx.fillRect(ROAD_X, 0, 3, canvas.height);
        ctx.fillRect(ROAD_X + ROAD_WIDTH - 3, 0, 3, canvas.height);

        // Draw obstacles
        game.obstacles.forEach(obs => {
            ctx.save();
            ctx.fillStyle = obs.color;

            if (obs.type === 'cone') {
                // Draw cone
                ctx.shadowBlur = 8;
                ctx.shadowColor = obs.color;
                ctx.beginPath();
                ctx.moveTo(obs.x + obs.width / 2, obs.y);
                ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                ctx.lineTo(obs.x, obs.y + obs.height);
                ctx.closePath();
                ctx.fill();
            } else if (obs.type === 'oil') {
                // Draw oil spill
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Draw car/truck
                ctx.shadowBlur = 10;
                ctx.shadowColor = obs.color;
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

                // Windows
                ctx.fillStyle = '#0af';
                ctx.fillRect(obs.x + 5, obs.y + 10, obs.width - 10, obs.height / 3);
            }
            ctx.restore();
        });

        // Draw power-ups
        game.powerUps.forEach(pu => {
            ctx.save();
            const pulse = Math.sin(Date.now() / 100) * 3;
            ctx.fillStyle = pu.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = pu.color;
            ctx.beginPath();
            ctx.arc(pu.x + 10, pu.y + 10, 10 + pulse, 0, Math.PI * 2);
            ctx.fill();

            // Draw icon
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pu.icon, pu.x + 10, pu.y + 10);
            ctx.restore();
        });

        // Draw player car
        ctx.save();
        const wobble = game.boost ? Math.sin(Date.now() / 50) * 2 : 0;
        ctx.fillStyle = game.boost ? '#ff0' : '#0f0';
        ctx.shadowBlur = game.boost ? 20 : 10;
        ctx.shadowColor = game.boost ? '#ff0' : '#0f0';

        // Car body
        ctx.fillRect(game.player.x + wobble, game.player.y, game.player.width, game.player.height);

        // Windows
        ctx.fillStyle = '#0af';
        ctx.fillRect(game.player.x + 5 + wobble, game.player.y + 10, game.player.width - 10, 15);

        // Wheels
        ctx.fillStyle = '#222';
        ctx.fillRect(game.player.x - 3 + wobble, game.player.y + 10, 5, 10);
        ctx.fillRect(game.player.x + game.player.width - 2 + wobble, game.player.y + 10, 5, 10);
        ctx.fillRect(game.player.x - 3 + wobble, game.player.y + game.player.height - 20, 5, 10);
        ctx.fillRect(game.player.x + game.player.width - 2 + wobble, game.player.y + game.player.height - 20, 5, 10);

        // Boost flames
        if (game.boost) {
            const flameLength = 15 + Math.random() * 10;
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.moveTo(game.player.x + game.player.width / 2, game.player.y + game.player.height);
            ctx.lineTo(game.player.x + game.player.width / 2 - 8, game.player.y + game.player.height + flameLength);
            ctx.lineTo(game.player.x + game.player.width / 2 + 8, game.player.y + game.player.height + flameLength);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#f80';
            ctx.beginPath();
            ctx.moveTo(game.player.x + game.player.width / 2, game.player.y + game.player.height + 5);
            ctx.lineTo(game.player.x + game.player.width / 2 - 5, game.player.y + game.player.height + flameLength - 5);
            ctx.lineTo(game.player.x + game.player.width / 2 + 5, game.player.y + game.player.height + flameLength - 5);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Draw particles
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1;

        // Draw HUD
        ctx.fillStyle = '#0f0';
        ctx.font = '16px "Press Start 2P", "Courier New"';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#0f0';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${game.score}`, 10, 30);
        ctx.fillText(`DIST: ${Math.floor(game.distance / 10)}m`, 10, 55);
        ctx.fillText(`SPEED: ${Math.floor(game.scrollSpeed * 10)}`, 10, 80);

        if (game.boost) {
            ctx.fillStyle = '#ff0';
            ctx.shadowColor = '#ff0';
            ctx.fillText('BOOST!', 10, 105);
        }
        ctx.shadowBlur = 0;

        // Draw controls
        ctx.fillStyle = '#0f0';
        ctx.font = '10px "Press Start 2P", "Courier New"';
        ctx.fillText('ARROWS/WASD: STEER', 10, canvas.height - 25);
        ctx.fillText('UP/W: ACCELERATE', 10, canvas.height - 10);
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
            ctx.fillText('CRASH!', canvas.width / 2, canvas.height / 2 - 60);

            ctx.fillStyle = '#0f0';
            ctx.shadowColor = '#0f0';
            ctx.font = '16px "Press Start 2P", "Courier New"';
            ctx.fillText(`SCORE: ${game.score}`, canvas.width / 2, canvas.height / 2);
            ctx.fillText(`DISTANCE: ${Math.floor(game.distance / 10)}m`, canvas.width / 2, canvas.height / 2 + 30);
            ctx.font = '12px "Press Start 2P", "Courier New"';
            ctx.fillText('ESC TO EXIT', canvas.width / 2, canvas.height / 2 + 70);
            ctx.fillText('R TO RESTART', canvas.width / 2, canvas.height / 2 + 100);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
        }, 300);
    }

    function resetGame() {
        game.player = {
            x: canvas.width / 2,
            y: canvas.height - 100,
            width: 30,
            height: 50,
            speed: 0,
            maxSpeed: 15,
            acceleration: 0.3,
            friction: 0.95,
            turnSpeed: 5
        };
        game.roadScroll = 0;
        game.scrollSpeed = 5;
        game.obstacles = [];
        game.powerUps = [];
        game.particles = [];
        game.score = 0;
        game.distance = 0;
        game.gameOver = false;
        game.spawnTimer = 0;
        game.spawnInterval = 60;
        game.keys = {};
        game.boost = false;
        game.boostTimer = 0;
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
            game.gameOver = true; // Trigger game over
            showGameOver(); // Show game over screen
            return;
        }

        game.keys[e.key] = true;
    }

    function handleKeyup(e) {
        game.keys[e.key] = false;
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
