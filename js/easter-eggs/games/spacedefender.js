// Space Defender Game
// Hardcore retro space shooter with unique boss battles!

import { soundSystem } from '../soundSystem.js';

export function createSpaceDefenderGame(container, canvas, onExit) {
    const ctx = canvas.getContext('2d');
    let animationId;
    let gameRunning = true;

    // Create HUD elements
    const scoreDisplay = container.querySelector('#score-display') || createHUDElement('score-display');
    const heartsDisplay = container.querySelector('#hearts-display') || createHUDElement('hearts-display');
    const inventoryDisplay = container.querySelector('#inventory-display') || createHUDElement('inventory-display');

    const hudContainer = document.createElement('div');
    hudContainer.style.cssText = `display: flex; justify-content: space-between; align-items: center; width: 800px; margin-top: 15px; color: #0f0; font-size: 20px; text-shadow: 0 0 10px #0f0;`;

    const instructions = document.createElement('div');
    instructions.style.cssText = `color: #0f0; font-size: 14px; margin-top: 10px; text-shadow: 0 0 8px #0f0; opacity: 0.8;`;
    instructions.textContent = '← → MOVE | SPACE SHOOT | 1-3 USE ITEM | ESC EXIT';

    hudContainer.appendChild(heartsDisplay);
    hudContainer.appendChild(scoreDisplay);
    hudContainer.appendChild(inventoryDisplay);

    container.appendChild(hudContainer);
    container.appendChild(instructions);


    function createHUDElement(id) {
        const elem = document.createElement('div');
        elem.id = id;
        return elem;
    }

    const BOSS_SPAWN_SCORE = 10000;

    const bossTypes = [
        {
            id: 'dreadnought',
            name: "The Dreadnought",
            color: '#c0392b',
            secondaryColor: '#2c3e50',
            accentColor: '#3498db',
            hp: 500,
            size: { width: 220, height: 150 }
        },
        {
            id: 'voidcrusher',
            name: "Void Crusher",
            color: '#8e44ad',
            secondaryColor: '#34495e',
            accentColor: '#9b59b6',
            hp: 600,
            size: { width: 240, height: 130 }
        },
        {
            id: 'plasmaemperor',
            name: "Plasma Emperor",
            color: '#e67e22',
            secondaryColor: '#d35400',
            accentColor: '#f39c12',
            hp: 550,
            size: { width: 230, height: 140 }
        },
        {
            id: 'cyberleviathan',
            name: "Cyber Leviathan",
            color: '#16a085',
            secondaryColor: '#1abc9c',
            accentColor: '#00ffff',
            hp: 700,
            size: { width: 260, height: 160 }
        },
        {
            id: 'darksovereign',
            name: "Dark Sovereign",
            color: '#2c3e50',
            secondaryColor: '#34495e',
            accentColor: '#e74c3c',
            hp: 650,
            size: { width: 250, height: 145 }
        },
        {
            id: 'crimsonwarlord',
            name: "Crimson Warlord",
            color: '#e74c3c',
            secondaryColor: '#c0392b',
            accentColor: '#ff6b6b',
            hp: 580,
            size: { width: 225, height: 135 }
        },
        {
            id: 'azuredestroyer',
            name: "Azure Destroyer",
            color: '#3498db',
            secondaryColor: '#2980b9',
            accentColor: '#5dade2',
            hp: 620,
            size: { width: 235, height: 150 }
        },
        {
            id: 'emeraldtyrant',
            name: "Emerald Tyrant",
            color: '#27ae60',
            secondaryColor: '#229954',
            accentColor: '#58d68d',
            hp: 590,
            size: { width: 230, height: 140 }
        },
        {
            id: 'shadowbehemoth',
            name: "Shadow Behemoth",
            color: '#17202a',
            secondaryColor: '#212f3c',
            accentColor: '#7f8c8d',
            hp: 750,
            size: { width: 280, height: 170 }
        },
        {
            id: 'solarannihilator',
            name: "Solar Annihilator",
            color: '#f39c12',
            secondaryColor: '#f1c40f',
            accentColor: '#ffeaa7',
            hp: 640,
            size: { width: 240, height: 155 }
        },
        {
            id: 'frostmonarch',
            name: "Frost Monarch",
            color: '#5dade2',
            secondaryColor: '#85c1e9',
            accentColor: '#d6eaf8',
            hp: 610,
            size: { width: 230, height: 145 }
        },
        {
            id: 'infernooverlord',
            name: "Inferno Overlord",
            color: '#d35400',
            secondaryColor: '#e67e22',
            accentColor: '#fd79a8',
            hp: 680,
            size: { width: 245, height: 160 }
        }
    ];

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
            sidekickActive: false,
            sidekickTimer: 0,
            slowmoActive: false,
            slowmoTimer: 0,
        },
        bullets: [],
        enemyBullets: [],
        sidekicks: [], // Mini airplane sidekicks
        enemies: [],
        fragments: [], // Asteroid fragments
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
        { type: 'sidekick', icon: '✈️', duration: 900 },
        { type: 'slowmo', icon: '⏱️', duration: 450 },
    ];

    function spawnEnemy() {
        if (game.boss) return;
        const type = Math.floor(Math.random() * 7); // 7 enemy types now
        const hitboxes = [
            {w: 28, h: 20},  // Type 0: Standard ship
            {w: 28, h: 28},  // Type 1: Asteroid
            {w: 28, h: 28},  // Type 2: Hexagon
            {w: 32, h: 24},  // Type 3: Heavy cruiser
            {w: 24, h: 24},  // Type 4: Fast interceptor
            {w: 30, h: 30},  // Type 5: Diamond ship
            {w: 26, h: 22}   // Type 6: Scout
        ];
        const hitbox = hitboxes[type];
        const speeds = [1 + Math.random() * 2, 1 + Math.random(), 0.8 + Math.random() * 1.5, 0.8 + Math.random(), 2 + Math.random() * 2, 1.2 + Math.random() * 1.5, 1.5 + Math.random() * 2];
        const shootCooldowns = [120, 999, 999, 100, 80, 150, 90]; // Type 1 (asteroid) no longer shoots

        game.enemies.push({
            x: Math.random() * (canvas.width - 60) + 30,
            y: -30,
            width: hitbox.w,
            height: hitbox.h,
            speed: speeds[type],
            type: type,
            shootTimer: Math.random() * 100 + 50,
            shootCooldown: shootCooldowns[type]
        });
    }

    function spawnBoss() {
        if (game.boss) return;
        const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
        console.log(`${bossType.name} Approaches!`);
        game.boss = {
            x: canvas.width / 2,
            y: -150,
            width: bossType.size.width,
            height: bossType.size.height,
            speed: 1.5,
            hp: bossType.hp,
            maxHp: bossType.hp,
            phase: 'enter',
            phaseTimer: 180,
            attackTimer: 0,
            subPhase: 0,
            type: bossType,
            itemDropsSpawned: { // Track which item drops have been spawned
                hp75: false,
                hp50: false,
                hp25: false
            }
        };
    }

    function spawnPowerUp(x, y) {
        const availablePowerUps = powerUpTypes.filter(p => p.type !== 'rateOfFire');
        const type = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
        game.powerUps.push({ x: x, y: y, width: 25, height: 25, type: type.type, icon: type.icon, life: 400 });
    }

    function enemyShoot(enemy) {
        // Play enemy shoot sound
        soundSystem.shoot();

        if (enemy.type === 0) { // Standard ship
            game.enemyBullets.push({ x: enemy.x, y: enemy.y + enemy.height / 2, width: 4, height: 12, speed: 4, color: '#f00' });
            return 100 + Math.random() * 50;
        } else if (enemy.type === 3) { // Heavy cruiser - dual shots
            game.enemyBullets.push({ x: enemy.x - 10, y: enemy.y + enemy.height / 2, width: 4, height: 12, speed: 3.5, color: '#f44' });
            game.enemyBullets.push({ x: enemy.x + 10, y: enemy.y + enemy.height / 2, width: 4, height: 12, speed: 3.5, color: '#f44' });
            return 150 + Math.random() * 50;
        } else if (enemy.type === 4) { // Fast interceptor - rapid fire
            game.enemyBullets.push({ x: enemy.x, y: enemy.y + enemy.height / 2, width: 3, height: 10, speed: 5, color: '#ff0' });
            return 60 + Math.random() * 30;
        } else if (enemy.type === 5) { // Diamond ship - spread shot
            for (let i = -1; i <= 1; i++) {
                game.enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    width: 4,
                    height: 10,
                    speed: 4,
                    vx: i * 1.5,
                    vy: 4,
                    color: '#f0f'
                });
            }
            return 180 + Math.random() * 70;
        } else if (enemy.type === 6) { // Scout - tracking shot
            const dx = game.player.x - enemy.x;
            const dy = game.player.y - enemy.y;
            const norm = Math.sqrt(dx * dx + dy * dy);
            game.enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                width: 4,
                height: 10,
                vx: (dx / norm) * 3.5,
                vy: (dy / norm) * 3.5,
                color: '#0ff'
            });
            return 120 + Math.random() * 60;
        }
        return 999; // Default cooldown for non-shooting enemies (Type 1: Asteroid, Type 2: Hexagon)
    }

    function bossShoot() {
        const boss = game.boss;
        if (!boss || boss.phase !== 'attack') return;
        boss.attackTimer--;
        if (boss.attackTimer > 0) return;

        const bulletColor = boss.type.accentColor;
        boss.subPhase++;

        // Unique attack patterns for each boss
        switch (boss.type.id) {
            case 'dreadnought': // Triple cannon volleys
                const cannonPositions = [-50, 0, 50];
                const cannonIndex = boss.subPhase % 3;
                for (let i = 0; i < 3; i++) {
                    game.enemyBullets.push({
                        x: boss.x + cannonPositions[cannonIndex],
                        y: boss.y + boss.height / 2,
                        width: 8,
                        height: 16,
                        vx: 0,
                        vy: 5 + i * 0.5,
                        color: bulletColor
                    });
                }
                boss.attackTimer = 12;
                break;

            case 'voidcrusher': // Black hole gravity bullets
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    game.enemyBullets.push({
                        x: boss.x,
                        y: boss.y,
                        width: 10,
                        height: 10,
                        vx: Math.cos(angle) * 2,
                        vy: Math.sin(angle) * 2,
                        color: bulletColor,
                        gravity: true, // Special flag for gravity effect
                        age: 0
                    });
                }
                boss.attackTimer = 50;
                break;

            case 'plasmaemperor': // Energy sine waves
                const waveY = boss.y + boss.height / 2;
                const waveSpeed = 4;
                for (let i = 0; i < 5; i++) {
                    const phase = (boss.subPhase + i * 20) * 0.1;
                    game.enemyBullets.push({
                        x: boss.x - 80 + i * 40,
                        y: waveY,
                        width: 7,
                        height: 7,
                        vx: 0,
                        vy: waveSpeed,
                        wavePhase: phase,
                        waveAmplitude: 3,
                        color: bulletColor
                    });
                }
                boss.attackTimer = 18;
                break;

            case 'cyberleviathan': // Digital grid pattern
                const gridSpacing = 60;
                const startX = boss.x - 90;
                for (let i = 0; i < 4; i++) {
                    game.enemyBullets.push({
                        x: startX + i * gridSpacing,
                        y: boss.y + boss.height / 2,
                        width: 6,
                        height: 12,
                        vx: (Math.random() - 0.5) * 2, // Glitchy movement
                        vy: 4.5,
                        color: bulletColor,
                        glitch: true
                    });
                }
                boss.attackTimer = 22;
                break;

            case 'darksovereign': // Shadow blade slashes
                const slashAngle = (boss.subPhase * 0.3) % (Math.PI * 2);
                for (let i = 0; i < 5; i++) {
                    game.enemyBullets.push({
                        x: boss.x,
                        y: boss.y,
                        width: 12,
                        height: 4,
                        vx: Math.cos(slashAngle + i * 0.15) * 6,
                        vy: Math.sin(slashAngle + i * 0.15) * 6,
                        color: bulletColor
                    });
                }
                boss.attackTimer = 15;
                break;

            case 'crimsonwarlord': // Blood rain barrage
                if (boss.subPhase % 3 === 0) {
                    for (let i = 0; i < 8; i++) {
                        game.enemyBullets.push({
                            x: boss.x - 100 + i * 25 + (Math.random() - 0.5) * 20,
                            y: boss.y - 30,
                            width: 6,
                            height: 14,
                            vx: 0,
                            vy: 6 + Math.random() * 2,
                            color: bulletColor
                        });
                    }
                }
                boss.attackTimer = 8;
                break;

            case 'azuredestroyer': // Tidal wave sweep
                const waveRow = Math.floor(boss.subPhase / 10) % 3;
                const waveX = boss.x - 120 + (boss.subPhase % 10) * 30;
                game.enemyBullets.push({
                    x: waveX,
                    y: boss.y + boss.height / 2 + waveRow * 25,
                    width: 8,
                    height: 8,
                    vx: 4,
                    vy: 2,
                    color: bulletColor
                });
                game.enemyBullets.push({
                    x: boss.x * 2 - waveX,
                    y: boss.y + boss.height / 2 + waveRow * 25,
                    width: 8,
                    height: 8,
                    vx: -4,
                    vy: 2,
                    color: bulletColor
                });
                boss.attackTimer = 5;
                break;

            case 'emeraldtyrant': // Vine spirals
                const vineCount = 4;
                for (let i = 0; i < vineCount; i++) {
                    const spiralAngle = (boss.subPhase * 0.2) + (i * Math.PI * 2 / vineCount);
                    const radius = 40 + (boss.subPhase % 30) * 2;
                    game.enemyBullets.push({
                        x: boss.x + Math.cos(spiralAngle) * radius,
                        y: boss.y + Math.sin(spiralAngle) * radius * 0.5,
                        width: 7,
                        height: 7,
                        vx: Math.cos(spiralAngle) * 1.5,
                        vy: 4,
                        color: bulletColor
                    });
                }
                boss.attackTimer = 10;
                break;

            case 'shadowbehemoth': // Teleporting chaos bullets
                for (let i = 0; i < 3; i++) {
                    const teleportX = Math.random() * canvas.width;
                    const teleportY = boss.y + Math.random() * 100;
                    game.enemyBullets.push({
                        x: teleportX,
                        y: teleportY,
                        width: 10,
                        height: 10,
                        vx: (Math.random() - 0.5) * 4,
                        vy: 3 + Math.random() * 2,
                        color: bulletColor,
                        teleport: true,
                        teleportTimer: 60 + Math.random() * 60
                    });
                }
                boss.attackTimer = 25;
                break;

            case 'solarannihilator': // Solar flare bursts
                const flareCount = 16;
                for (let i = 0; i < flareCount; i++) {
                    const flareAngle = (i / flareCount) * Math.PI * 2 + boss.subPhase * 0.05;
                    const speed = 3 + (i % 2) * 1.5;
                    game.enemyBullets.push({
                        x: boss.x,
                        y: boss.y,
                        width: 9,
                        height: 9,
                        vx: Math.cos(flareAngle) * speed,
                        vy: Math.sin(flareAngle) * speed,
                        color: bulletColor
                    });
                }
                boss.attackTimer = 45;
                break;

            case 'frostmonarch': // Ice shard angles
                const shardAngles = [
                    Math.PI / 2,
                    Math.PI / 2 + Math.PI / 6,
                    Math.PI / 2 - Math.PI / 6,
                    Math.PI / 2 + Math.PI / 3,
                    Math.PI / 2 - Math.PI / 3
                ];
                const selectedAngle = shardAngles[boss.subPhase % shardAngles.length];
                for (let i = 0; i < 3; i++) {
                    game.enemyBullets.push({
                        x: boss.x,
                        y: boss.y + boss.height / 2,
                        width: 5,
                        height: 15,
                        vx: Math.cos(selectedAngle) * (5 + i * 0.5),
                        vy: Math.sin(selectedAngle) * (5 + i * 0.5),
                        color: bulletColor
                    });
                }
                boss.attackTimer = 20;
                break;

            case 'infernooverlord': // Chaotic hellfire spread
                const fireballCount = 6 + Math.floor(Math.random() * 4);
                for (let i = 0; i < fireballCount; i++) {
                    const spreadAngle = Math.PI / 3 + (Math.random() - 0.5) * Math.PI / 2;
                    const spreadSpeed = 3 + Math.random() * 3;
                    game.enemyBullets.push({
                        x: boss.x + (Math.random() - 0.5) * 60,
                        y: boss.y + boss.height / 2,
                        width: 8,
                        height: 8,
                        vx: Math.cos(spreadAngle) * spreadSpeed * (Math.random() < 0.5 ? -1 : 1),
                        vy: Math.sin(spreadAngle) * spreadSpeed,
                        color: bulletColor
                    });
                }
                boss.attackTimer = 15;
                break;
        }
    }

    function createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            game.particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 30, color: color });
        }
    }

    function spawnAsteroidFragments(x, y) {
        // 30% chance to break into fragments
        if (Math.random() > 0.3) return;

        const fragmentCount = 3 + Math.floor(Math.random() * 4); // 3-6 fragments
        for (let i = 0; i < fragmentCount; i++) {
            const angle = (Math.PI * 2 * i) / fragmentCount + Math.random() * 0.5;
            const speed = 2 + Math.random() * 3;
            game.fragments.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                life: 120 + Math.random() * 60
            });
        }
    }

    function drawPlayer() {
        if (game.player.invincible && Math.floor(Date.now() / 100) % 2 === 0) return;

        ctx.save();
        if (game.player.ghostActive) {
            // Pulsing ghost effect - more visible
            const pulse = 0.6 + Math.sin(Date.now() / 100) * 0.2;
            ctx.globalAlpha = pulse;
            // Purple ghost glow
            ctx.shadowColor = '#8b2be2';
            ctx.shadowBlur = 25;
        } else {
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = 15;
        }

        ctx.fillStyle = game.player.ghostActive ? '#b19cd9' : '#0ff';

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
        const colors = ['#f0f', '#aaa', '#888', '#c44', '#ff0', '#0cf', '#4f4'];
        ctx.fillStyle = colors[enemy.type];
        ctx.shadowBlur = 12;
        ctx.shadowColor = colors[enemy.type];

        if (enemy.type === 0) { // Standard ship
            ctx.fillRect(enemy.x - 14, enemy.y, 28, 5);
            ctx.fillRect(enemy.x - 14, enemy.y + 5, 28, 10);
            ctx.fillRect(enemy.x - 10, enemy.y + 15, 5, 5);
            ctx.fillRect(enemy.x + 5, enemy.y + 15, 5, 5);
        } else if (enemy.type === 1) { // Asteroid (irregular star shape)
            ctx.beginPath();
            const points = 8;
            for (let i = 0; i < points; i++) {
                const angle = (Math.PI * 2 * i) / points;
                const radius = (i % 2 === 0) ? 14 : 9; // Irregular
                const x = enemy.x + Math.cos(angle) * radius;
                const y = enemy.y + Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        } else if (enemy.type === 2) { // Hexagon
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
        } else if (enemy.type === 3) { // Heavy cruiser (large rectangle with wings)
            ctx.fillRect(enemy.x - 16, enemy.y, 32, 20);
            ctx.fillRect(enemy.x - 20, enemy.y + 5, 8, 10);
            ctx.fillRect(enemy.x + 12, enemy.y + 5, 8, 10);
            ctx.fillStyle = '#600';
            ctx.fillRect(enemy.x - 8, enemy.y + 5, 16, 8);
        } else if (enemy.type === 4) { // Fast interceptor (sleek triangle)
            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y - 12);
            ctx.lineTo(enemy.x - 12, enemy.y + 12);
            ctx.lineTo(enemy.x, enemy.y + 6);
            ctx.lineTo(enemy.x + 12, enemy.y + 12);
            ctx.closePath();
            ctx.fill();
        } else if (enemy.type === 5) { // Diamond ship
            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y - 15);
            ctx.lineTo(enemy.x + 15, enemy.y);
            ctx.lineTo(enemy.x, enemy.y + 15);
            ctx.lineTo(enemy.x - 15, enemy.y);
            ctx.closePath();
            ctx.fill();
        } else if (enemy.type === 6) { // Scout (small cross shape)
            ctx.fillRect(enemy.x - 10, enemy.y - 3, 20, 6);
            ctx.fillRect(enemy.x - 3, enemy.y - 10, 6, 20);
        }

        ctx.shadowBlur = 0;
    }

    function drawBoss() {
        const boss = game.boss;
        if (!boss) return;
        const hitFlash = boss.hp < boss.maxHp && (animationId % 10 < 5);

        ctx.save();
        if(hitFlash) ctx.filter = 'brightness(1.5)';

        // Boss body with type-specific colors
        ctx.fillStyle = boss.type.secondaryColor;
        ctx.strokeStyle = boss.type.color;
        ctx.lineWidth = 5;
        ctx.shadowBlur = 30;
        ctx.shadowColor = boss.type.accentColor;

        // Main body - pentagon shape
        ctx.beginPath();
        ctx.moveTo(boss.x, boss.y - boss.height / 2);
        ctx.lineTo(boss.x + boss.width / 2, boss.y - boss.height / 4);
        ctx.lineTo(boss.x + boss.width / 2.5, boss.y + boss.height / 2);
        ctx.lineTo(boss.x - boss.width / 2.5, boss.y + boss.height / 2);
        ctx.lineTo(boss.x - boss.width / 2, boss.y - boss.height / 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Core/cockpit with accent color
        ctx.fillStyle = boss.type.accentColor;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = boss.type.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Wings/engines
        ctx.fillStyle = boss.type.color;
        // Left wing
        ctx.beginPath();
        ctx.moveTo(boss.x - boss.width / 2.5, boss.y);
        ctx.lineTo(boss.x - boss.width / 1.8, boss.y - 30);
        ctx.lineTo(boss.x - boss.width / 2.2, boss.y + 30);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = boss.type.accentColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Right wing
        ctx.beginPath();
        ctx.moveTo(boss.x + boss.width / 2.5, boss.y);
        ctx.lineTo(boss.x + boss.width / 1.8, boss.y - 30);
        ctx.lineTo(boss.x + boss.width / 2.2, boss.y + 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Enhanced health bar with name
        const barWidth = 300;
        const barHeight = 25;
        const barX = (canvas.width - barWidth) / 2;
        const barY = 15;

        // Boss name
        ctx.save();
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = boss.type.accentColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = boss.type.accentColor;
        ctx.textAlign = 'center';
        ctx.fillText(boss.type.name, canvas.width / 2, barY - 5);
        ctx.shadowBlur = 0;

        // Health bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health bar fill with gradient
        const hpPercentage = boss.hp / boss.maxHp;
        const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);

        if (hpPercentage > 0.5) {
            gradient.addColorStop(0, boss.type.accentColor);
            gradient.addColorStop(1, boss.type.color);
        } else if (hpPercentage > 0.25) {
            gradient.addColorStop(0, '#f39c12');
            gradient.addColorStop(1, '#e67e22');
        } else {
            gradient.addColorStop(0, '#e74c3c');
            gradient.addColorStop(1, '#c0392b');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * hpPercentage, barHeight);

        // Health bar border
        ctx.strokeStyle = boss.type.accentColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // HP text
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#000';
        ctx.fillText(`${Math.ceil(boss.hp)} / ${boss.maxHp}`, canvas.width / 2, barY + 17);

        ctx.restore();
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
            soundSystem.hit();
            createExplosion(game.player.x, game.player.y, 'rgba(0, 255, 255, 0.8)', 30);
            updateHUD();
            return;
        }

        game.player.hearts--;
        game.player.invincible = true;
        game.player.invincibleTimer = 120;
        soundSystem.hit();
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

    function drawFragment(fragment) {
        ctx.save();
        ctx.translate(fragment.x, fragment.y);
        ctx.rotate(fragment.rotation);
        ctx.fillStyle = '#aaa';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#aaa';
        ctx.globalAlpha = Math.min(1, fragment.life / 60);
        ctx.beginPath();
        const sides = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i) / sides;
            const x = Math.cos(angle) * fragment.size;
            const y = Math.sin(angle) * fragment.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.restore();
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

            // Boss item drops at HP thresholds (same as bullet damage)
            const hpPercentage = (game.boss.hp / game.boss.maxHp) * 100;
            if (hpPercentage <= 75 && !game.boss.itemDropsSpawned.hp75) {
                game.boss.itemDropsSpawned.hp75 = true;
                spawnPowerUp(game.boss.x - 30, game.boss.y + 50);
                spawnPowerUp(game.boss.x + 30, game.boss.y + 50);
            }
            if (hpPercentage <= 50 && !game.boss.itemDropsSpawned.hp50) {
                game.boss.itemDropsSpawned.hp50 = true;
                spawnPowerUp(game.boss.x - 40, game.boss.y + 60);
                spawnPowerUp(game.boss.x, game.boss.y + 60);
                spawnPowerUp(game.boss.x + 40, game.boss.y + 60);
            }
            if (hpPercentage <= 25 && !game.boss.itemDropsSpawned.hp25) {
                game.boss.itemDropsSpawned.hp25 = true;
                spawnPowerUp(game.boss.x - 50, game.boss.y + 70);
                spawnPowerUp(game.boss.x - 25, game.boss.y + 70);
                spawnPowerUp(game.boss.x + 25, game.boss.y + 70);
                spawnPowerUp(game.boss.x + 50, game.boss.y + 70);
            }

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
        if (game.player.sidekickTimer > 0) {
            game.player.sidekickTimer--;
        } else if (game.player.sidekickActive) {
            game.player.sidekickActive = false;
            game.sidekicks = [];
        }
        if (game.player.slowmoTimer > 0) game.player.slowmoTimer--; else game.player.slowmoActive = false;

        // Slowmo multiplier
        const speedMultiplier = game.player.slowmoActive ? 0.5 : 1;

        // Update sidekicks
        game.sidekicks.forEach(sidekick => {
            sidekick.x = game.player.x + sidekick.offsetX;
            sidekick.y = game.player.y + sidekick.offsetY;
            sidekick.shootTimer++;
            // Sidekicks shoot every 30 frames
            if (sidekick.shootTimer >= 30) {
                game.bullets.push({ x: sidekick.x, y: sidekick.y - 10, width: 3, height: 12 });
                sidekick.shootTimer = 0;
            }
        });

        // Update positions
        game.bullets.forEach(b => b.y -= 12);
        game.bullets = game.bullets.filter(b => b.y > 0);

        game.enemyBullets.forEach(b => {
            // Homing missiles
            if (b.homing) {
                const dx = game.player.x - b.x;
                const dy = game.player.y - b.y;
                const angle = Math.atan2(dy, dx);
                b.vx += Math.cos(angle) * b.turnSpeed * speedMultiplier;
                b.vy += Math.sin(angle) * b.turnSpeed * speedMultiplier;
                const norm = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                if (norm > 4 * speedMultiplier) { b.vx = (b.vx / norm) * 4 * speedMultiplier; b.vy = (b.vy / norm) * 4 * speedMultiplier; }
            }

            // Gravity bullets (Void Crusher)
            if (b.gravity) {
                b.age = (b.age || 0) + 1;
                if (b.age > 30) { // After 30 frames, start pulling inward
                    const centerX = canvas.width / 2;
                    const centerY = canvas.height / 2;
                    const dx = centerX - b.x;
                    const dy = centerY - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 10) {
                        b.vx += (dx / dist) * 0.15 * speedMultiplier;
                        b.vy += (dy / dist) * 0.15 * speedMultiplier;
                    }
                }
            }

            // Wave phase bullets (Plasma Emperor)
            if (b.wavePhase !== undefined) {
                b.wavePhase += 0.2 * speedMultiplier;
                b.x += Math.sin(b.wavePhase) * b.waveAmplitude * speedMultiplier;
            }

            // Glitch bullets (Cyber Leviathan) - random position shifts
            if (b.glitch && Math.random() < 0.1) {
                b.x += (Math.random() - 0.5) * 5;
            }

            // Teleporting bullets (Shadow Behemoth)
            if (b.teleport) {
                b.teleportTimer = (b.teleportTimer || 0) - 1;
                if (b.teleportTimer <= 0) {
                    b.x = Math.random() * canvas.width;
                    b.y = Math.random() * 200 + 50;
                    b.teleportTimer = 60 + Math.random() * 60;
                }
            }

            b.x += (b.vx || 0) * speedMultiplier;
            b.y += (b.vy || b.speed) * speedMultiplier;
        });
        game.enemyBullets = game.enemyBullets.filter(b => b.y < canvas.height && b.y > 0 && b.x > 0 && b.x < canvas.width);

        game.enemies.forEach(e => {
            e.y += e.speed * speedMultiplier;
            if(e.shootTimer) e.shootTimer--;
            if(e.shootTimer <= 0) {
                e.shootTimer = enemyShoot(e);
            }
        });
        game.enemies = game.enemies.filter(e => e.y < canvas.height + 50);

        game.powerUps = game.powerUps.filter(p => { p.life--; return p.life > 0; });
        game.particles = game.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });
        game.fragments = game.fragments.filter(f => {
            f.x += f.vx;
            f.y += f.vy;
            f.rotation += f.rotationSpeed;
            f.life--;
            return f.life > 0 && f.y < canvas.height + 20;
        });

        if (game.boss) {
            const boss = game.boss;
            if (boss.phase === 'enter') {
                boss.y += boss.speed * speedMultiplier;
                if (boss.y >= 100) { boss.y = 100; boss.phase = 'attack'; }
            } else if (boss.phase === 'attack') {
                boss.x += boss.speed * speedMultiplier;
                if (boss.x > canvas.width - boss.width / 2 || boss.x < boss.width / 2) boss.speed *= -1;
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
                    // Spawn fragments if it's an asteroid (type 1)
                    if (enemy.type === 1) {
                        spawnAsteroidFragments(enemy.x, enemy.y);
                    }
                    game.enemies.splice(j, 1);
                    game.score += 100;
                    createExplosion(enemy.x, enemy.y, '#ff0');
                    // Play hit sound
                    soundSystem.explosion();
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
                    soundSystem.powerUp();
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

                // Boss item drops at HP thresholds
                const hpPercentage = (game.boss.hp / game.boss.maxHp) * 100;
                if (hpPercentage <= 75 && !game.boss.itemDropsSpawned.hp75) {
                    game.boss.itemDropsSpawned.hp75 = true;
                    spawnPowerUp(game.boss.x - 30, game.boss.y + 50);
                    spawnPowerUp(game.boss.x + 30, game.boss.y + 50);
                }
                if (hpPercentage <= 50 && !game.boss.itemDropsSpawned.hp50) {
                    game.boss.itemDropsSpawned.hp50 = true;
                    spawnPowerUp(game.boss.x - 40, game.boss.y + 60);
                    spawnPowerUp(game.boss.x, game.boss.y + 60);
                    spawnPowerUp(game.boss.x + 40, game.boss.y + 60);
                }
                if (hpPercentage <= 25 && !game.boss.itemDropsSpawned.hp25) {
                    game.boss.itemDropsSpawned.hp25 = true;
                    spawnPowerUp(game.boss.x - 50, game.boss.y + 70);
                    spawnPowerUp(game.boss.x - 25, game.boss.y + 70);
                    spawnPowerUp(game.boss.x + 25, game.boss.y + 70);
                    spawnPowerUp(game.boss.x + 50, game.boss.y + 70);
                }

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
        game.fragments.forEach(drawFragment);
        game.powerUps.forEach(drawPowerUp);
        game.bullets.forEach(drawBullet);
        game.enemyBullets.forEach(drawEnemyBullet);
        game.enemies.forEach(drawEnemy);
        if (game.boss) drawBoss();
        game.sidekicks.forEach(drawSidekick);
        drawPlayer();
        drawLaser();
        drawActiveEffectsBar();

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

    function drawActiveEffectsBar() {
        const barY = canvas.height - 30;
        const barHeight = 20;
        const barSpacing = 5;
        let currentX = 10;

        ctx.save();
        ctx.font = '12px monospace';
        ctx.shadowBlur = 8;

        // Ghost effect
        if (game.player.ghostActive) {
            const maxDuration = 450;
            const percentage = game.player.ghostTimer / maxDuration;
            const barWidth = 100;

            ctx.fillStyle = 'rgba(138, 43, 226, 0.3)';
            ctx.fillRect(currentX, barY, barWidth, barHeight);
            ctx.fillStyle = '#8b2be2';
            ctx.shadowColor = '#8b2be2';
            ctx.fillRect(currentX, barY, barWidth * percentage, barHeight);
            ctx.strokeStyle = '#8b2be2';
            ctx.lineWidth = 2;
            ctx.strokeRect(currentX, barY, barWidth, barHeight);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('👻 ' + Math.ceil(game.player.ghostTimer / 60), currentX + barWidth / 2, barY + 14);
            currentX += barWidth + barSpacing;
        }

        // Slow motion effect
        if (game.player.slowmoActive) {
            const maxDuration = 450;
            const percentage = game.player.slowmoTimer / maxDuration;
            const barWidth = 100;

            ctx.fillStyle = 'rgba(70, 130, 180, 0.3)';
            ctx.fillRect(currentX, barY, barWidth, barHeight);
            ctx.fillStyle = '#4682b4';
            ctx.shadowColor = '#4682b4';
            ctx.fillRect(currentX, barY, barWidth * percentage, barHeight);
            ctx.strokeStyle = '#4682b4';
            ctx.lineWidth = 2;
            ctx.strokeRect(currentX, barY, barWidth, barHeight);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('⏱️ ' + Math.ceil(game.player.slowmoTimer / 60), currentX + barWidth / 2, barY + 14);
            currentX += barWidth + barSpacing;
        }

        // Sidekick effect
        if (game.player.sidekickActive) {
            const maxDuration = 900;
            const percentage = game.player.sidekickTimer / maxDuration;
            const barWidth = 100;

            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.fillRect(currentX, barY, barWidth, barHeight);
            ctx.fillStyle = '#0f0';
            ctx.shadowColor = '#0f0';
            ctx.fillRect(currentX, barY, barWidth * percentage, barHeight);
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.strokeRect(currentX, barY, barWidth, barHeight);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('✈️ ' + Math.ceil(game.player.sidekickTimer / 60), currentX + barWidth / 2, barY + 14);
            currentX += barWidth + barSpacing;
        }

        ctx.shadowBlur = 0;
        ctx.restore();
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
            case 'sidekick':
                spawnSidekick();
                game.player.sidekickActive = true;
                game.player.sidekickTimer = powerUpDetails.duration;
                break;
            case 'slowmo':
                game.player.slowmoActive = true;
                game.player.slowmoTimer = powerUpDetails.duration;
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

    function spawnSidekick() {
        // Spawn two sidekicks on either side of the player
        game.sidekicks.push({
            x: game.player.x - 40,
            y: game.player.y,
            offsetX: -40,
            offsetY: 0,
            shootTimer: 0
        });
        game.sidekicks.push({
            x: game.player.x + 40,
            y: game.player.y,
            offsetX: 40,
            offsetY: 0,
            shootTimer: 0
        });
    }

    function drawSidekick(sidekick) {
        ctx.save();
        ctx.fillStyle = '#0f0';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0f0';

        // Small triangle pointing up
        ctx.beginPath();
        ctx.moveTo(sidekick.x, sidekick.y - 8);
        ctx.lineTo(sidekick.x - 8, sidekick.y + 8);
        ctx.lineTo(sidekick.x, sidekick.y + 4);
        ctx.lineTo(sidekick.x + 8, sidekick.y + 8);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
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
            // Play shoot sound
            soundSystem.shoot();
            setTimeout(() => game.player.canShoot = true, fireRate);
        }
        if (e.key >= '1' && e.key <= '3') {
            useItem(parseInt(e.key, 10) - 1);
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            endGame(false);
        }
    };

    const keyupHandler = (e) => { game.keys[e.key] = false; };

    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keyup', keyupHandler);

    updateHUD();
    gameLoop();

    function endGame(survived) {
        gameRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        // Play end game sound
        if (survived) {
            soundSystem.victory();
        } else {
            soundSystem.gameOver();
        }

        // Clean up all event listeners immediately
        document.removeEventListener('keydown', keydownHandler);
        document.removeEventListener('keyup', keyupHandler);

        // Keep ESC handler to allow exit
        const exitHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                document.removeEventListener('keydown', exitHandler);
                if (onExit) {
                    onExit();
                }
            }
        };

        document.addEventListener('keydown', exitHandler);

        setTimeout(() => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let resultText = survived ? 'YOU WIN!' : 'GAME OVER';
            let resultColor = survived ? '#ff0' : '#f00';
            if (survived && !game.boss) {
                resultText = 'BOSS DEFEATED!';
            }

            ctx.fillStyle = resultColor;
            ctx.font = 'bold 48px "Press Start 2P", "Courier New"';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 20;
            ctx.shadowColor = resultColor;
            ctx.fillText(resultText, canvas.width / 2, canvas.height / 2 - 50);

            ctx.fillStyle = '#0f0';
            ctx.shadowColor = '#0f0';
            ctx.font = '24px "Press Start 2P", "Courier New"';
            ctx.fillText(`SCORE: ${game.score.toString().padStart(6, '0')}`, canvas.width / 2, canvas.height / 2 + 10);

            const minutes = Math.floor((Date.now() - game.startTime) / 60000);
            const seconds = Math.floor(((Date.now() - game.startTime) % 60000) / 1000);
            ctx.font = '16px "Press Start 2P", "Courier New"';
            ctx.fillText(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`, canvas.width / 2, canvas.height / 2 + 50);

            ctx.font = '14px "Press Start 2P", "Courier New"';
            ctx.fillText('ESC TO EXIT', canvas.width / 2, canvas.height / 2 + 90);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
        }, 500);
    }

    function cleanup() {
        gameRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        document.removeEventListener('keydown', keydownHandler);
        document.removeEventListener('keyup', keyupHandler);
    }

    return { cleanup };
}
