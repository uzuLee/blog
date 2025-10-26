// Konami Code Easter Egg
// Press: ↑ ↑ ↓ ↓ ← → ← → B A
// Activates a hardcore retro space shooter game!

export const konamiCode = {
    name: 'Konami Code',
    description: 'Activates a retro arcade game when the Konami Code is entered',

    init() {
        const konamiSequence = [
            'ArrowUp', 'ArrowUp',
            'ArrowDown', 'ArrowDown',
            'ArrowLeft', 'ArrowRight',
            'ArrowLeft', 'ArrowRight',
            'b', 'a'
        ];

        let konamiIndex = 0;

        const handleKeydown = (e) => {
            const key = e.key;

            if (key === konamiSequence[konamiIndex]) {
                konamiIndex++;

                if (konamiIndex === konamiSequence.length) {
                    this.activate();
                    konamiIndex = 0;
                }
            } else {
                konamiIndex = 0;
            }
        };

        document.addEventListener('keydown', handleKeydown);
        this.cleanup = () => document.removeEventListener('keydown', handleKeydown);
    },

    activate() {
        console.log('🎮 Konami Code activated! Starting hardcore retro shooter...');

        const gameContainer = document.createElement('div');
        gameContainer.id = 'konami-game';
        gameContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Courier New', 'Consolas', monospace; opacity: 0; transition: opacity 0.5s ease-in;
        `;

        const crtOverlay = document.createElement('div');
        crtOverlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: repeating-linear-gradient(0deg, rgba(0, 255, 0, 0.03), rgba(0, 255, 0, 0.03) 1px, transparent 1px, transparent 2px); pointer-events: none; z-index: 999999; animation: crt-flicker 0.15s infinite;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes crt-flicker { 0% { opacity: 0.97; } 50% { opacity: 1; } 100% { opacity: 0.97; } }
            @keyframes crt-noise { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-1px, 1px); } 20% { transform: translate(1px, -1px); } 30% { transform: translate(-1px, -1px); } 40% { transform: translate(1px, 1px); } 50% { transform: translate(0, 0); } 60% { transform: translate(-1px, 1px); } 70% { transform: translate(1px, -1px); } 80% { transform: translate(-1px, -1px); } 90% { transform: translate(1px, 1px); } }
        `;
        document.head.appendChild(style);

        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.cssText = `border: 4px solid #0f0; box-shadow: 0 0 30px #0f0, inset 0 0 30px rgba(0, 255, 0, 0.3); image-rendering: pixelated; image-rendering: crisp-edges; animation: crt-noise 0.1s infinite;`;

        const title = document.createElement('div');
        title.style.cssText = `color: #0f0; font-size: 36px; font-weight: bold; margin-bottom: 15px; text-shadow: 0 0 15px #0f0, 0 0 30px #0f0; letter-spacing: 6px; text-transform: uppercase;`;
        title.textContent = '▼ SPACE DEFENDER ▲';

        const hudContainer = document.createElement('div');
        hudContainer.style.cssText = `display: flex; justify-content: space-between; align-items: center; width: 800px; margin-top: 15px; color: #0f0; font-size: 20px; text-shadow: 0 0 10px #0f0;`;

        const scoreDisplay = document.createElement('div');
        const heartsDisplay = document.createElement('div');
        const inventoryDisplay = document.createElement('div');
        inventoryDisplay.style.cssText = `display: flex; align-items: center; gap: 10px;`;

        hudContainer.appendChild(heartsDisplay);
        hudContainer.appendChild(scoreDisplay);
        hudContainer.appendChild(inventoryDisplay);

        const instructions = document.createElement('div');
        instructions.style.cssText = `color: #0f0; font-size: 14px; margin-top: 10px; text-shadow: 0 0 8px #0f0; opacity: 0.8;`;
        instructions.textContent = '← → MOVE | SPACE SHOOT | 1-3 USE ITEM | ESC EXIT';

        gameContainer.appendChild(crtOverlay);
        gameContainer.appendChild(title);
        gameContainer.appendChild(canvas);
        gameContainer.appendChild(hudContainer);
        gameContainer.appendChild(instructions);
        document.body.appendChild(gameContainer);

        setTimeout(() => gameContainer.style.opacity = '1', 10);

        const ctx = canvas.getContext('2d');
        let animationId;
        let gameRunning = true;

        const BOSS_SPAWN_SCORE = 10000;

        const game = {
            player: {
                x: canvas.width / 2,
                y: canvas.height - 60,
                width: 20,
                height: 20,
                speed: 6,
                hearts: 5,
                invincible: false,
                invincibleTimer: 0,
                shield: false,
                shieldTimer: 0,
                canShoot: true,
                fireRateLevel: 1,
                tripleShotActive: false,
                tripleShotTimer: 0,
                laserActive: false,
                laserTimer: 0,
                ghostActive: false,
                ghostTimer: 0,
            },
            bullets: [],
            enemyBullets: [],
            enemies: [],
            powerUps: [],
            boss: null,
            score: 0,
            enemySpawnTimer: 0,
            keys: {},
            particles: [],
            inventory: [],
            startTime: Date.now(),
        };

        const powerUpTypes = [
            { type: 'shield', icon: '🛡️', duration: 600 },
            { type: 'rateOfFire', icon: '🔥', duration: 0 },
            { type: 'tripleShot', icon: '🔱', duration: 600 },
            { type: 'emp', icon: '💥', duration: 0 },
            { type: 'laser', icon: '⚡', duration: 300 },
            { type: 'ghost', icon: '👻', duration: 450 },
        ];

        function spawnEnemy() {
            if (game.boss) return;
            const type = Math.floor(Math.random() * 3);
            const hitbox = [{w: 28, h: 20}, {w: 28, h: 28}, {w: 28, h: 28}][type];
            game.enemies.push({ x: Math.random() * (canvas.width - 60) + 30, y: -30, width: hitbox.w, height: hitbox.h, speed: 1 + Math.random() * 2, type: type, shootTimer: Math.random() * 100 + 50, shootCooldown: type === 0 ? 120 : 999 });
        }

        function spawnBoss() {
            if (game.boss) return;
            console.log("A Challenger Approaches!");
            game.boss = { x: canvas.width / 2, y: -150, width: 180, height: 120, speed: 1.5, hp: 500, maxHp: 500, phase: 'enter', phaseTimer: 180, attackPattern: 0, attackTimer: 0, subPhase: 0 };
        }

        function spawnPowerUp(x, y) {
            const availablePowerUps = powerUpTypes.filter(p => p.type !== 'rateOfFire');
            const type = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
            game.powerUps.push({ x: x, y: y, width: 25, height: 25, type: type.type, icon: type.icon, life: 400 });
        }

        function enemyShoot(enemy) {
            if (enemy.type === 0) { // Standard ship
                game.enemyBullets.push({ x: enemy.x, y: enemy.y + enemy.height / 2, width: 4, height: 12, speed: 4, color: '#f00' });
                return 100 + Math.random() * 50;
            } else if (enemy.type === 1) { // Spiky ball - Laser
                if (Math.random() < 0.15) { // 15% chance to fire laser
                    enemyShootLaser(enemy);
                    return 200 + Math.random() * 100; // Longer cooldown after laser
                }
                // Did not fire laser, return default cooldown
                return 100 + Math.random() * 50;
            }
            return 999; // Default cooldown for non-shooting enemies
        }

        function enemyShootLaser(enemy) {
            console.log("Enemy laser!");
            game.enemyBullets.push({ 
                x: enemy.x, 
                y: enemy.y, 
                width: 10, 
                height: 40, 
                speed: 8, 
                color: '#f0f', 
                isLaser: true 
            });
        }

        function bossShoot() {
            const boss = game.boss;
            if (!boss || boss.phase !== 'attack') return;
            boss.attackTimer--;
            if (boss.attackTimer > 0) return;

            switch (boss.attackPattern) {
                case 0:
                    boss.subPhase = (boss.subPhase + 1) % 60;
                    const angle = Math.PI / 4 + (Math.sin(boss.subPhase * 0.1) * Math.PI / 6);
                    game.enemyBullets.push({ x: boss.x, y: boss.y + boss.height / 2, width: 6, height: 18, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, color: '#f0f' });
                    boss.attackTimer = 3;
                    break;
                case 1:
                    const dx = game.player.x - (boss.x - 60);
                    const dy = game.player.y - (boss.y + boss.height / 2);
                    const norm = Math.sqrt(dx * dx + dy * dy);
                    game.enemyBullets.push({ x: boss.x - 60, y: boss.y + boss.height / 2, width: 10, height: 10, vx: (dx / norm) * 4, vy: (dy / norm) * 4, color: '#ff0', homing: true, turnSpeed: 0.05 });
                    boss.attackTimer = 40;
                    break;
                case 2:
                    for (let i = 0; i < 12; i++) {
                        const angle = (i / 12) * Math.PI * 2 + boss.subPhase * 0.02;
                        game.enemyBullets.push({ x: boss.x, y: boss.y, width: 8, height: 8, vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3, color: '#f80' });
                    }
                    boss.subPhase++;
                    boss.attackTimer = 25;
                    break;
            }
        }

        function createExplosion(x, y, color, count = 20) {
            for (let i = 0; i < count; i++) {
                game.particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 30, color: color });
            }
        }

        function drawPlayer() {
            if (game.player.invincible && Math.floor(Date.now() / 100) % 2 === 0) return;
            
            ctx.save();
            if (game.player.ghostActive) {
                ctx.globalAlpha = 0.5;
            }

            ctx.fillStyle = '#0ff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#0ff';
            
            const x = game.player.x;
            const y = game.player.y;

            ctx.beginPath();
            ctx.moveTo(x, y - 15);
            ctx.lineTo(x - 15, y + 15);
            ctx.lineTo(x, y + 5);
            ctx.lineTo(x + 15, y + 15);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#f80';
            ctx.fillRect(x - 3, y + 10, 6, 5);
            ctx.shadowBlur = 0;

            if (game.player.shield) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        }

        function drawEnemy(enemy) {
            const colors = ['#f0f', '#aaa', '#888'];
            ctx.fillStyle = colors[enemy.type];
            ctx.shadowBlur = 12;
            ctx.shadowColor = colors[enemy.type];
            if (enemy.type === 0) {
                ctx.fillRect(enemy.x - 14, enemy.y, 28, 5);
                ctx.fillRect(enemy.x - 14, enemy.y + 5, 28, 10);
                ctx.fillRect(enemy.x - 10, enemy.y + 15, 5, 5);
                ctx.fillRect(enemy.x + 5, enemy.y + 15, 5, 5);
            } else if (enemy.type === 1) {
                ctx.beginPath();
                const points = 8;
                for (let i = 0; i < points; i++) {
                    const angle = (Math.PI * 2 * i) / points;
                    const radius = 14;
                    const x = enemy.x + Math.cos(angle) * radius;
                    const y = enemy.y + Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.beginPath();
                const points = 6;
                for (let i = 0; i < points; i++) {
                    const angle = (Math.PI * 2 * i) / points + Math.PI / 6;
                    const radius = 14;
                    const x = enemy.x + Math.cos(angle) * radius;
                    const y = enemy.y + Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        }

        function drawBoss() {
            const boss = game.boss;
            if (!boss) return;
            const hitFlash = boss.hp < boss.maxHp && (animationId % 10 < 5);
            ctx.save();
            if(hitFlash) ctx.filter = 'brightness(2)';
            ctx.fillStyle = '#2c3e50';
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#e74c3c';
            ctx.beginPath();
            ctx.moveTo(boss.x, boss.y - boss.height / 2);
            ctx.lineTo(boss.x + boss.width / 2, boss.y);
            ctx.lineTo(boss.x + boss.width / 3, boss.y + boss.height/2);
            ctx.lineTo(boss.x - boss.width / 3, boss.y + boss.height/2);
            ctx.lineTo(boss.x - boss.width / 2, boss.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#3498db';
            ctx.beginPath();
            ctx.arc(boss.x, boss.y - 10, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#566573';
            ctx.fillRect(boss.x - 80, boss.y + 10, 40, 20);
            ctx.fillRect(boss.x + 40, boss.y + 10, 40, 20);
            ctx.restore();
            const barWidth = 200;
            const barHeight = 15;
            ctx.fillStyle = '#300';
            ctx.fillRect((canvas.width - barWidth) / 2, 20, barWidth, barHeight);
            ctx.fillStyle = '#f00';
            ctx.fillRect((canvas.width - barWidth) / 2, 20, barWidth * (boss.hp / boss.maxHp), barHeight);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect((canvas.width - barWidth) / 2, 20, barWidth, barHeight);
        }

        function drawBullet(bullet) {
            ctx.fillStyle = '#0f0';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#0f0';
            ctx.fillRect(bullet.x - 2, bullet.y, 4, 15);
            ctx.shadowBlur = 0;
        }

        function drawEnemyBullet(bullet) {
            ctx.fillStyle = bullet.color || '#f00';
            ctx.shadowBlur = 8;
            ctx.shadowColor = bullet.color || '#f00';
            if (bullet.isLaser) {
                ctx.filter = 'blur(2px)';
                ctx.fillRect(bullet.x - bullet.width/2, bullet.y, bullet.width, bullet.height);
                ctx.filter = 'none';
            } else if (bullet.vx) {
                 ctx.beginPath();
                 ctx.arc(bullet.x, bullet.y, bullet.width, 0, Math.PI * 2);
                 ctx.fill();
            } else {
                 ctx.fillRect(bullet.x - bullet.width/2, bullet.y, bullet.width, bullet.height);
            }
            ctx.shadowBlur = 0;
        }

        function drawPowerUp(powerUp) {
            ctx.font = '24px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(powerUp.icon, powerUp.x, powerUp.y);
        }

        function checkCollision(a, b) {
            const aX = a.x - a.width / 2;
            const aY = a.y - a.height / 2;
            const bX = b.x - b.width / 2;
            const bY = b.y - b.height / 2;
            return aX < bX + b.width && aX + a.width > bX && aY < bY + b.height && aY + a.height > bY;
        }

        function damagePlayer() {
            if (game.player.ghostActive || game.player.invincible) return;

            if (game.player.shield) {
                game.player.shield = false;
                game.player.shieldTimer = 0;
                createExplosion(game.player.x, game.player.y, 'rgba(0, 255, 255, 0.8)', 30);
                updateHUD();
                return;
            }
            
            game.player.hearts--;
            game.player.invincible = true;
            game.player.invincibleTimer = 120;
            createExplosion(game.player.x, game.player.y, '#0ff', 20);
            updateHUD();
            if (game.player.hearts <= 0) endGame(false);
        }

        function drawParticle(particle) {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life / 30;
            ctx.fillRect(particle.x, particle.y, 3, 3);
            ctx.globalAlpha = 1.0;
        }

        function drawLaser() {
            if (!game.player.laserActive) return;

            const x = game.player.x;
            const y = game.player.y;
            const laserWidth = 10 + (Math.random() - 0.5) * 4;

            ctx.save();
            ctx.fillStyle = '#f00';
            ctx.shadowColor = '#f00';
            ctx.shadowBlur = 20;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(x - laserWidth / 2, 0, laserWidth, y - 15);
            ctx.restore();

            const laserRect = { x: x, y: 0, width: laserWidth, height: y - 15 };
            for (let i = game.enemies.length - 1; i >= 0; i--) {
                const enemy = game.enemies[i];
                if (checkCollision(laserRect, enemy)) {
                    game.enemies.splice(i, 1);
                    game.score += 10;
                    createExplosion(enemy.x, enemy.y, '#ff0', 5);
                }
            }

            if (game.boss && checkCollision(laserRect, game.boss)) {
                game.boss.hp -= 1;
                game.score += 2;
                if (game.boss.hp <= 0) {
                    createExplosion(game.boss.x, game.boss.y, '#f00', 200);
                    game.score += 10000;
                    game.boss = null;
                    endGame(true);
                }
            }
        }

        function gameLoop() {
            if (!gameRunning) return;
            if (game.score >= BOSS_SPAWN_SCORE && !game.boss) spawnBoss();
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (Math.random() < 0.15) {
                ctx.fillStyle = '#0f0';
                ctx.fillRect(Math.random() * canvas.width, 0, 1, 2);
            }
            
            if (game.keys['ArrowLeft'] && game.player.x > game.player.width / 2) game.player.x -= game.player.speed;
            if (game.keys['ArrowRight'] && game.player.x < canvas.width - game.player.width / 2) game.player.x += game.player.speed;
            
            // Timers
            if (game.player.invincibleTimer > 0) game.player.invincibleTimer--; else game.player.invincible = false;
            if (game.player.tripleShotTimer > 0) game.player.tripleShotTimer--; else game.player.tripleShotActive = false;
            if (game.player.laserTimer > 0) game.player.laserTimer--; else game.player.laserActive = false;
            if (game.player.ghostTimer > 0) game.player.ghostTimer--; else game.player.ghostActive = false;
            if (game.player.shieldTimer > 0) game.player.shieldTimer--; else if(game.player.shield) { game.player.shield = false; updateHUD(); }

            // Update positions
            game.bullets.forEach(b => b.y -= 12);
            game.bullets = game.bullets.filter(b => b.y > 0);

            game.enemyBullets.forEach(b => {
                if (b.homing) {
                    const dx = game.player.x - b.x;
                    const dy = game.player.y - b.y;
                    const angle = Math.atan2(dy, dx);
                    b.vx += Math.cos(angle) * b.turnSpeed;
                    b.vy += Math.sin(angle) * b.turnSpeed;
                    const norm = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                    if (norm > 4) { b.vx = (b.vx / norm) * 4; b.vy = (b.vy / norm) * 4; }
                }
                b.x += b.vx || 0;
                b.y += b.vy || b.speed;
            });
            game.enemyBullets = game.enemyBullets.filter(b => b.y < canvas.height && b.y > 0 && b.x > 0 && b.x < canvas.width);
            
            game.enemies.forEach(e => {
                e.y += e.speed;
                if(e.shootTimer) e.shootTimer--;
                if(e.shootTimer <= 0) {
                    e.shootTimer = enemyShoot(e);
                }
            });
            game.enemies = game.enemies.filter(e => e.y < canvas.height + 50);

            game.powerUps = game.powerUps.filter(p => { p.life--; return p.life > 0; });
            game.particles = game.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });

            if (game.boss) {
                const boss = game.boss;
                if (boss.phase === 'enter') {
                    boss.y += boss.speed;
                    if (boss.y >= 100) { boss.y = 100; boss.phase = 'attack'; }
                } else if (boss.phase === 'attack') {
                    boss.x += boss.speed;
                    if (boss.x > canvas.width - boss.width / 2 || boss.x < boss.width / 2) boss.speed *= -1;
                    boss.phaseTimer--;
                    if (boss.phaseTimer <= 0) { boss.attackPattern = (boss.attackPattern + 1) % 3; boss.phaseTimer = 300; boss.subPhase = 0; }
                    bossShoot();
                }
            }

            // Collision Detection
            for (let i = game.bullets.length - 1; i >= 0; i--) {
                const bullet = game.bullets[i];
                let hit = false;

                // Bullet vs Enemy
                for (let j = game.enemies.length - 1; j >= 0; j--) {
                    const enemy = game.enemies[j];
                    if (checkCollision(bullet, enemy)) {
                        game.bullets.splice(i, 1);
                        game.enemies.splice(j, 1);
                        game.score += 100;
                        createExplosion(enemy.x, enemy.y, '#ff0');
                        if (Math.random() < 0.1) spawnPowerUp(enemy.x, enemy.y, 'rateOfFire');
                        else if (Math.random() < 0.2) spawnPowerUp(enemy.x, enemy.y);
                        hit = true;
                        break;
                    }
                }
                if (hit) { updateHUD(); continue; }

                // Bullet vs PowerUp
                for (let j = game.powerUps.length - 1; j >= 0; j--) {
                    const p = game.powerUps[j];
                    if (checkCollision(bullet, p)) {
                        console.log('Collected item by shooting:', p.type);
                        game.bullets.splice(i, 1);
                        game.powerUps.splice(j, 1);
                        if (p.type === 'rateOfFire') {
                            game.player.fireRateLevel = Math.min(game.player.fireRateLevel + 1, 5);
                        } else {
                            if (game.inventory.length >= 3) game.inventory.shift();
                            game.inventory.push(p);
                        }
                        hit = true;
                        break;
                    }
                }
                if (hit) { updateHUD(); continue; }

                // Bullet vs Boss
                if (game.boss && checkCollision(bullet, game.boss)) {
                    game.bullets.splice(i, 1);
                    game.boss.hp -= 5;
                    game.score += 50;
                    if (game.boss.hp <= 0) {
                        createExplosion(game.boss.x, game.boss.y, '#f00', 200);
                        game.score += 10000;
                        game.boss = null;
                        endGame(true);
                    }
                }
            }
            updateHUD();

            // Player vs...
            for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
                if (checkCollision(game.enemyBullets[i], game.player)) {
                    damagePlayer();
                    game.enemyBullets.splice(i, 1);
                }
            }
            for (let i = game.enemies.length - 1; i >= 0; i--) {
                if (checkCollision(game.enemies[i], game.player)) {
                    damagePlayer();
                    createExplosion(game.enemies[i].x, game.enemies[i].y, '#f00');
                    game.enemies.splice(i, 1);
                }
            }
            
            // Enemy Spawner
            game.enemySpawnTimer++;
            if (game.enemySpawnTimer > 40 && !game.boss) {
                spawnEnemy();
                game.enemySpawnTimer = 0;
            }

            // Drawing
            game.particles.forEach(drawParticle);
            game.powerUps.forEach(drawPowerUp);
            game.bullets.forEach(drawBullet);
            game.enemyBullets.forEach(drawEnemyBullet);
            game.enemies.forEach(drawEnemy);
            if (game.boss) drawBoss();
            drawPlayer();
            drawLaser();
            
            animationId = requestAnimationFrame(gameLoop);
        }

        function updateHUD() {
            scoreDisplay.textContent = `SCORE: ${game.score.toString().padStart(6, '0')}`;
            let hearts = `❤️ × ${game.player.hearts}`;
            if (game.player.shield) hearts += ' 🛡️';
            heartsDisplay.textContent = hearts;

            inventoryDisplay.innerHTML = 'ITEMS: ';
            for (let i = 0; i < 3; i++) {
                const item = game.inventory[i];
                const slot = document.createElement('span');
                slot.style.cssText = `display: inline-block; width: 40px; height: 30px; border: 1px solid #0f0; text-align: center; line-height: 30px; margin: 0 5px; background: rgba(0, 255, 0, 0.1); font-size: 20px;`;
                if (item) {
                    slot.textContent = item.icon;
                } else {
                    slot.textContent = '-';
                }
                inventoryDisplay.appendChild(slot);
            }
        }

        function useItem(index) {
            if (index < 0 || index >= game.inventory.length) return;

            const item = game.inventory.splice(index, 1)[0];
            if (!item) return;
            
            console.log('Used item:', item.type);

            const powerUpDetails = powerUpTypes.find(p => p.type === item.type);
            if (!powerUpDetails) return;

            switch(item.type) {
                case 'shield': 
                    game.player.shield = true; 
                    game.player.shieldTimer = powerUpDetails.duration; 
                    break;
                case 'tripleShot': 
                    game.player.tripleShotActive = true; 
                    game.player.tripleShotTimer = powerUpDetails.duration; 
                    break;
                case 'emp':
                    activateEMP();
                    break;
                case 'laser':
                    game.player.laserActive = true;
                    game.player.laserTimer = powerUpDetails.duration;
                    break;
                case 'ghost':
                    game.player.ghostActive = true;
                    game.player.ghostTimer = powerUpDetails.duration;
                    break;
            }
            updateHUD();
        }

        function activateEMP() {
            createExplosion(canvas.width / 2, canvas.height / 2, '#fff', 100);
            game.enemies.forEach(enemy => {
                createExplosion(enemy.x, enemy.y, '#ff0', 15);
                game.score += 50;
            });
            game.enemies = [];
            game.enemyBullets = [];
            updateHUD();
        }

        const keydownHandler = (e) => {
            game.keys[e.key] = true;
            if (e.key === ' ' && game.player.canShoot && !game.player.laserActive) {
                e.preventDefault();
                game.player.canShoot = false;
                const fireRate = 250 - (game.player.fireRateLevel * 40);
                game.bullets.push({ x: game.player.x, y: game.player.y - 15, width: 4, height: 15 });
                if (game.player.tripleShotActive) {
                    game.bullets.push({ x: game.player.x - 15, y: game.player.y, width: 4, height: 15 });
                    game.bullets.push({ x: game.player.x + 15, y: game.player.y, width: 4, height: 15 });
                }
                setTimeout(() => game.player.canShoot = true, fireRate);
            }
            if (e.key >= '1' && e.key <= '3') {
                useItem(parseInt(e.key, 10) - 1);
            }
            if (e.key === 'Escape') endGame(false);
        };

        const keyupHandler = (e) => { game.keys[e.key] = false; };

        document.addEventListener('keydown', keydownHandler);
        document.addEventListener('keyup', keyupHandler);

        updateHUD();
        gameLoop();

        function endGame(survived) {
            gameRunning = false;
            cancelAnimationFrame(animationId);
            document.removeEventListener('keydown', keydownHandler);
            document.removeEventListener('keyup', keyupHandler);

            const finalScore = document.createElement('div');
            finalScore.style.cssText = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #0f0; font-size: 48px; text-align: center; text-shadow: 0 0 25px #0f0; animation: score-pulse 1s ease-in-out infinite; z-index: 2;`;

            let resultText = survived ? 'YOU WIN!' : 'GAME OVER';
            if (survived && !game.boss) {
                resultText = 'BOSS DEFEATED!';
            } else if (survived) {
                resultText = 'YOU SURVIVED!';
            }

            finalScore.innerHTML = `${resultText}<br><span style="font-size: 32px;">SCORE: ${game.score.toString().padStart(6, '0')}</span>`;
            gameContainer.appendChild(finalScore);

            const pulseStyle = document.createElement('style');
            pulseStyle.textContent = `@keyframes score-pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.05); } }`;
            document.head.appendChild(pulseStyle);

            setTimeout(() => {
                gameContainer.style.transition = 'opacity 2s ease-out';
                gameContainer.style.opacity = '0';
                setTimeout(() => { gameContainer.remove(); style.remove(); pulseStyle.remove(); }, 2000);
            }, 5000);
        }
    },

    cleanup() {
        // Cleanup is set in init()
    }
};