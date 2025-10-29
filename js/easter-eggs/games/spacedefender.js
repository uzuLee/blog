// Space Defender Game
// Hardcore retro space shooter with unique boss battles!

import { soundSystem } from '../soundSystem.js';
import { multiGame } from '../multi-game.js';

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
    const ELITE_SPAWN_SCORE = 3000; // Elite spawns every 3000 points

    const eliteTypes = [
        {
            id: 'battlecruiser',
            name: 'Battlecruiser',
            color: '#e74c3c',
            accentColor: '#c0392b',
            hp: 300,
            size: { width: 120, height: 80 }
        },
        {
            id: 'destroyer',
            name: 'Destroyer',
            color: '#3498db',
            accentColor: '#2980b9',
            hp: 250,
            size: { width: 100, height: 70 }
        },
        {
            id: 'mothership',
            name: 'Mothership',
            color: '#9b59b6',
            accentColor: '#8e44ad',
            hp: 400,
            size: { width: 140, height: 90 }
        },
        {
            id: 'dreadnought_mini',
            name: 'Heavy Frigate',
            color: '#f39c12',
            accentColor: '#e67e22',
            hp: 350,
            size: { width: 110, height: 75 }
        }
    ];

    const bossTypes = [
        {
            id: 'dreadnought',
            name: 'Dreadnought — Titan Aegis',
            base: '#d64a3a',
            mid: '#1a2a3a',
            accent: '#86fff2',
            color: '#d64a3a',
            secondaryColor: '#1a2a3a',
            accentColor: '#86fff2',
            hp: 1500,
            size: { width: 220, height: 150 }
        },
        {
            id: 'voidcrusher',
            name: 'Void Crusher — Graviton Lens',
            base: '#9b59b6',
            mid: '#0b0f2a',
            accent: '#d8b4ff',
            color: '#9b59b6',
            secondaryColor: '#0b0f2a',
            accentColor: '#d8b4ff',
            hp: 1800,
            size: { width: 240, height: 130 }
        },
        {
            id: 'plasmaemperor',
            name: 'Plasma Emperor — Prismatic Rex',
            base: '#ffb84d',
            mid: '#15223f',
            accent: '#ffeaa7',
            color: '#ffb84d',
            secondaryColor: '#15223f',
            accentColor: '#ffeaa7',
            hp: 1650,
            size: { width: 230, height: 140 }
        },
        {
            id: 'cyberleviathan',
            name: 'Cyber Leviathan — Vector-Snake',
            base: '#0fd0c5',
            mid: '#0a1f22',
            accent: '#7cfbff',
            color: '#0fd0c5',
            secondaryColor: '#0a1f22',
            accentColor: '#7cfbff',
            hp: 2100,
            size: { width: 260, height: 160 }
        },
        {
            id: 'darksovereign',
            name: 'Dark Sovereign — Eclipse King',
            base: '#2c3e50',
            mid: '#0b0f16',
            accent: '#ff477e',
            color: '#2c3e50',
            secondaryColor: '#0b0f16',
            accentColor: '#ff477e',
            hp: 1950,
            size: { width: 250, height: 145 }
        },
        {
            id: 'crimsonwarlord',
            name: 'Crimson Warlord — Chrono Halberd',
            base: '#ff3b2f',
            mid: '#23121a',
            accent: '#ff8fa3',
            color: '#ff3b2f',
            secondaryColor: '#23121a',
            accentColor: '#ff8fa3',
            hp: 1740,
            size: { width: 225, height: 135 }
        },
        {
            id: 'azuredestroyer',
            name: 'Azure Destroyer — Abyss Cyclone',
            base: '#2f9be4',
            mid: '#0d1f33',
            accent: '#b3e5ff',
            color: '#2f9be4',
            secondaryColor: '#0d1f33',
            accentColor: '#b3e5ff',
            hp: 1860,
            size: { width: 235, height: 150 }
        },
        {
            id: 'emeraldtyrant',
            name: 'Emerald Tyrant — Bio-Terrarium',
            base: '#27ae60',
            mid: '#0d241a',
            accent: '#9bffc7',
            color: '#27ae60',
            secondaryColor: '#0d241a',
            accentColor: '#9bffc7',
            hp: 1770,
            size: { width: 230, height: 140 }
        },
        {
            id: 'shadowbehemoth',
            name: 'Shadow Behemoth — Abyssal IX',
            base: '#0c111b',
            mid: '#04070c',
            accent: '#b9fff5',
            color: '#0c111b',
            secondaryColor: '#04070c',
            accentColor: '#b9fff5',
            hp: 2250,
            size: { width: 280, height: 170 }
        },
        {
            id: 'solarannihilator',
            name: 'Solar Annihilator — CME Crown',
            base: '#f39c12',
            mid: '#1a0c03',
            accent: '#ffd166',
            color: '#f39c12',
            secondaryColor: '#1a0c03',
            accentColor: '#ffd166',
            hp: 1920,
            size: { width: 240, height: 155 }
        },
        {
            id: 'frostmonarch',
            name: 'Frost Monarch — Glacio-Spire',
            base: '#5dade2',
            mid: '#0a1a2a',
            accent: '#d6eaf8',
            color: '#5dade2',
            secondaryColor: '#0a1a2a',
            accentColor: '#d6eaf8',
            hp: 1830,
            size: { width: 230, height: 145 }
        },
        {
            id: 'infernooverlord',
            name: 'Inferno Overlord — Magma Tyr',
            base: '#ff7a2a',
            mid: '#2a0e07',
            accent: '#ff9b71',
            color: '#ff7a2a',
            secondaryColor: '#2a0e07',
            accentColor: '#ff9b71',
            hp: 2040,
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
        elite: null, // Mid-tier elite enemy
        score: 0,
        enemySpawnTimer: 0,
        lastEliteScore: 0, // Track when last elite was spawned
        keys: {},
        particles: [],
        inventory: [],
        startTime: Date.now(),
        // Screen effects
        screenShake: 0,
        screenShakeX: 0,
        screenShakeY: 0,
        // Boss defeat animation
        bossDefeatAnimation: {
            active: false,
            timer: 0,
            boss: null,
            explosions: []
        }
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
        { type: 'heart', icon: '❤️', duration: 0 },
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

    function spawnElite() {
        if (game.elite || game.boss) return;
        const eliteType = eliteTypes[Math.floor(Math.random() * eliteTypes.length)];
        console.log(`⚠️ Elite ${eliteType.name} Approaches!`);
        soundSystem.powerUp();

        game.elite = {
            x: canvas.width / 2,
            y: -100,
            width: eliteType.size.width,
            height: eliteType.size.height,
            speed: 2,
            hp: eliteType.hp,
            maxHp: eliteType.hp,
            phase: 'enter',
            attackTimer: 0,
            attackPattern: 0,
            type: eliteType
        };
    }

    function eliteShoot() {
        const elite = game.elite;
        if (!elite || elite.phase !== 'attack') return;

        elite.attackTimer--;
        if (elite.attackTimer > 0) return;

        const bulletColor = elite.type.accentColor;

        switch (elite.type.id) {
            case 'battlecruiser': // Triple spread shot
                for (let i = -1; i <= 1; i++) {
                    game.enemyBullets.push({
                        x: elite.x + i * 30,
                        y: elite.y + 20,
                        width: 8,
                        height: 16,
                        speed: 5 + Math.abs(i),
                        color: bulletColor
                    });
                }
                elite.attackTimer = 30;
                break;

            case 'destroyer': // Fast burst
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        if (game.elite) {
                            game.enemyBullets.push({
                                x: game.elite.x,
                                y: game.elite.y + 20,
                                width: 6,
                                height: 12,
                                speed: 7,
                                color: bulletColor
                            });
                        }
                    }, i * 80);
                }
                elite.attackTimer = 50;
                break;

            case 'mothership': // Spawn mini enemies
                if (game.enemies.length < 8) {
                    for (let i = 0; i < 2; i++) {
                        game.enemies.push({
                            x: elite.x + (i === 0 ? -40 : 40),
                            y: elite.y,
                            width: 25,
                            height: 25,
                            speed: 2,
                            type: 3,
                            shootCooldown: 60
                        });
                    }
                }
                elite.attackTimer = 120;
                break;

            case 'dreadnought_mini': // Heavy cannon
                game.enemyBullets.push({
                    x: elite.x,
                    y: elite.y + 20,
                    width: 20,
                    height: 20,
                    speed: 4,
                    color: '#ff4444',
                    heavy: true
                });
                createExplosion(elite.x, elite.y + 30, bulletColor, 15);
                elite.attackTimer = 45;
                break;
        }
    }

    function spawnBoss() {
        if (game.boss) return;
        const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
        console.log(`${bossType.name} Approaches!`);
        soundSystem.powerUp(); // Sound effect for boss appearance
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
            },
            smokeParticles: [], // For Inferno Overlord's smoke effect
            ultimateUsed: false, // Track if ultimate has been used
            ultimateActive: false, // Track if ultimate is currently active
            ultimateTimer: 0, // Timer for ultimate duration
            skillCooldown: 0 // Cooldown for special skills
        };
    }

    function spawnPowerUp(x, y, forceType = null) {
        let type;
        if (forceType) {
            type = powerUpTypes.find(p => p.type === forceType);
        } else {
            const availablePowerUps = powerUpTypes.filter(p => p.type !== 'rateOfFire');
            type = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
        }
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
            game.enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                width: 6,
                height: 12,
                vx: 0,
                vy: 2.8, // Initial forward speed
                color: '#0ff',
                homing: true, // Enable homing behavior
                turnSpeed: 0.04 // Slow turn speed to make it dodgeable
            });
            return 140 + Math.random() * 60;
        }
        return 999; // Default cooldown for non-shooting enemies (Type 1: Asteroid, Type 2: Hexagon)
    }

    function bossShoot() {
        const boss = game.boss;
        if (!boss || boss.phase !== 'attack') return;

        // Check if ultimate should be triggered (HP < 30% and not used yet)
        const hpPercent = (boss.hp / boss.maxHp) * 100;
        if (hpPercent <= 30 && !boss.ultimateUsed) {
            boss.ultimateUsed = true;
            boss.ultimateActive = true;
            boss.ultimateTimer = 180; // 3 seconds
            activateBossUltimate(boss);
            soundSystem.powerUp(); // Ultimate activation sound
            createExplosion(boss.x, boss.y, boss.type.accent, 80);
            return;
        }

        // Update ultimate timer
        if (boss.ultimateActive) {
            boss.ultimateTimer--;
            if (boss.ultimateTimer <= 0) {
                boss.ultimateActive = false;
            }
        }

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

            case 'crimsonwarlord': // Temporal Distortion - time-based attacks
                if (boss.subPhase % 4 === 0) {
                    // Time Spiral: bullets that slow down and speed up
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2;
                        game.enemyBullets.push({
                            x: boss.x,
                            y: boss.y,
                            width: 8,
                            height: 8,
                            vx: Math.cos(angle) * 3,
                            vy: Math.sin(angle) * 3,
                            color: bulletColor,
                            timeDistortion: true,
                            age: 0,
                            baseSpeed: 3
                        });
                    }
                } else if (boss.subPhase % 4 === 2) {
                    // Temporal Echo: bullets leave after-images
                    for (let i = 0; i < 4; i++) {
                        game.enemyBullets.push({
                            x: boss.x - 60 + i * 40,
                            y: boss.y,
                            width: 10,
                            height: 10,
                            vx: 0,
                            vy: 5,
                            color: '#ff6b6b',
                            echo: true,
                            echoTimer: 0
                        });
                    }
                }
                boss.attackTimer = 18;
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

    function startBossDefeatAnimation(boss) {
        console.log(`💀 ${boss.type.name} DEFEATED!`);

        // Stop normal gameplay
        game.bossDefeatAnimation.active = true;
        game.bossDefeatAnimation.timer = 240; // 4 seconds
        game.bossDefeatAnimation.boss = { ...boss }; // Save boss state
        game.bossDefeatAnimation.explosions = [];

        // Screen shake
        game.screenShake = 30;

        // Create initial massive explosion
        createExplosion(boss.x, boss.y, boss.type.accent, 100);

        // Play sound
        soundSystem.explosion();

        // Award points
        game.score += 10000;

        // Spawn rewards
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = 100;
            setTimeout(() => {
                spawnPowerUp(
                    boss.x + Math.cos(angle) * dist,
                    boss.y + Math.sin(angle) * dist
                );
            }, i * 100);
        }
    }

    function activateBossUltimate(boss) {
        const cx = boss.x;
        const cy = boss.y;
        const bulletColor = boss.type.accentColor;

        switch (boss.type.id) {
            case 'dreadnought': // ULTIMATE: Orbital Strike - massive missile barrage
                console.log('🚀 DREADNOUGHT ULTIMATE: ORBITAL STRIKE!');
                for (let wave = 0; wave < 5; wave++) {
                    setTimeout(() => {
                        for (let i = 0; i < 12; i++) {
                            game.enemyBullets.push({
                                x: Math.random() * canvas.width,
                                y: -20,
                                width: 10,
                                height: 20,
                                vx: 0,
                                vy: 8 + Math.random() * 2,
                                color: '#ff4444',
                                isUltimate: true
                            });
                        }
                        createExplosion(canvas.width / 2, 50, bulletColor, 30);
                    }, wave * 200);
                }
                break;

            case 'voidcrusher': // ULTIMATE: Singularity - super gravity well
                console.log('🌌 VOID CRUSHER ULTIMATE: SINGULARITY!');
                game.enemyBullets.push({
                    x: cx,
                    y: cy,
                    width: 40,
                    height: 40,
                    vx: 0,
                    vy: 0.5,
                    color: '#8b00ff',
                    gravity: true,
                    singularity: true,
                    life: 180,
                    age: 0
                });
                break;

            case 'plasmaemperor': // ULTIMATE: Prism Beam - rotating laser beams
                console.log('⚡ PLASMA EMPEROR ULTIMATE: PRISM BEAM!');
                boss.prismBeams = [];
                for (let i = 0; i < 6; i++) {
                    boss.prismBeams.push({
                        angle: (Math.PI * 2 / 6) * i,
                        length: 500,
                        active: true
                    });
                }
                break;

            case 'cyberleviathan': // ULTIMATE: System Override - reverse controls
                console.log('💻 CYBER LEVIATHAN ULTIMATE: SYSTEM OVERRIDE!');
                boss.controlsReversed = true;
                setTimeout(() => {
                    boss.controlsReversed = false;
                }, 3000);
                break;

            case 'darksovereign': // ULTIMATE: Eclipse - darkness
                console.log('🌑 DARK SOVEREIGN ULTIMATE: ECLIPSE!');
                boss.eclipseActive = true;
                setTimeout(() => {
                    boss.eclipseActive = false;
                }, 3000);
                break;

            case 'crimsonwarlord': // ULTIMATE: Temporal Rupture - time manipulation
                console.log('⏰ CRIMSON WARLORD ULTIMATE: TEMPORAL RUPTURE!');
                boss.temporalRuptureActive = true;
                boss.temporalRuptureTimer = 180;
                boss.timePhase = 0;
                // Save current bullet positions for time reversal
                boss.savedBulletStates = game.enemyBullets.map(b => ({x: b.x, y: b.y, vx: b.vx, vy: b.vy}));
                break;

            case 'azuredestroyer': // ULTIMATE: Maelstrom - water vortex
                console.log('🌊 AZURE DESTROYER ULTIMATE: MAELSTROM!');
                boss.maelstromActive = true;
                boss.maelstromAngle = 0;
                break;

            case 'emeraldtyrant': // ULTIMATE: Overgrowth - vine prison
                console.log('🌿 EMERALD TYRANT ULTIMATE: OVERGROWTH!');
                for (let side = 0; side < 2; side++) {
                    for (let i = 0; i < 8; i++) {
                        setTimeout(() => {
                            const x = side === 0 ? 0 : canvas.width;
                            game.enemyBullets.push({
                                x: x,
                                y: Math.random() * canvas.height,
                                width: 15,
                                height: 15,
                                vx: (side === 0 ? 3 : -3) + (Math.random() - 0.5),
                                vy: (Math.random() - 0.5) * 2,
                                color: '#27ae60',
                                vine: true
                            });
                        }, i * 200);
                    }
                }
                break;

            case 'shadowbehemoth': // ULTIMATE: Void Rift - dimension tears
                console.log('👁️ SHADOW BEHEMOTH ULTIMATE: VOID RIFT!');
                boss.voidRifts = [];
                for (let i = 0; i < 4; i++) {
                    boss.voidRifts.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * 300 + 100,
                        life: 180,
                        spawnTimer: 0
                    });
                }
                break;

            case 'solarannihilator': // ULTIMATE: Coronal Mass Ejection
                console.log('☀️ SOLAR ANNIHILATOR ULTIMATE: CME!');
                for (let wave = 0; wave < 8; wave++) {
                    setTimeout(() => {
                        const count = 24;
                        for (let i = 0; i < count; i++) {
                            const angle = (i / count) * Math.PI * 2 + wave * 0.3;
                            const speed = 4 + wave * 0.5;
                            game.enemyBullets.push({
                                x: cx,
                                y: cy,
                                width: 12,
                                height: 12,
                                vx: Math.cos(angle) * speed,
                                vy: Math.sin(angle) * speed,
                                color: '#ffa500'
                            });
                        }
                    }, wave * 150);
                }
                break;

            case 'frostmonarch': // ULTIMATE: Blizzard - ice storm
                console.log('❄️ FROST MONARCH ULTIMATE: BLIZZARD!');
                boss.blizzardActive = true;
                boss.blizzardTimer = 180;
                break;

            case 'infernooverlord': // ULTIMATE: Magma Eruption
                console.log('🔥 INFERNO OVERLORD ULTIMATE: MAGMA ERUPTION!');
                boss.magmaEruptionActive = true;
                boss.magmaEruptionTimer = 180;
                break;
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

    // Helper functions for boss rendering
    function clamp(n, a, b) {
        return Math.max(a, Math.min(b, n));
    }

    function gradCircle(x, y, r, inner, outer) {
        const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
        g.addColorStop(0, inner);
        g.addColorStop(0.55, inner);
        g.addColorStop(1, outer);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    function glowRing(x, y, r, color, thickness = 4, pulse = 0) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 26 + pulse * 8;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    function drawElite() {
        const elite = game.elite;
        if (!elite) return;

        const hitFlash = animationId % 10 < 5;

        ctx.save();
        if (hitFlash) ctx.filter = 'brightness(1.3)';

        // Draw elite body
        ctx.fillStyle = elite.type.color;
        ctx.strokeStyle = elite.type.accentColor;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = elite.type.accentColor;

        // Main body shape (hexagon)
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const x = elite.x + Math.cos(angle) * elite.width / 2;
            const y = elite.y + Math.sin(angle) * elite.height / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Weapons
        ctx.fillStyle = elite.type.accentColor;
        ctx.fillRect(elite.x - elite.width / 2 - 10, elite.y, 10, 30);
        ctx.fillRect(elite.x + elite.width / 2, elite.y, 10, 30);

        // Core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(elite.x, elite.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();

        // Health bar
        const barWidth = elite.width;
        const barHeight = 8;
        const barX = elite.x - barWidth / 2;
        const barY = elite.y - elite.height / 2 - 20;

        // Name
        ctx.save();
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = elite.type.accentColor;
        ctx.shadowBlur = 8;
        ctx.shadowColor = elite.type.accentColor;
        ctx.textAlign = 'center';
        ctx.fillText(elite.type.name, elite.x, barY - 8);
        ctx.shadowBlur = 0;

        // Bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Bar fill
        const hpPercent = elite.hp / elite.maxHp;
        const fillColor = hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#f44336';
        ctx.fillStyle = fillColor;
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        // Bar border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        ctx.restore();
    }

    function drawBoss() {
        const boss = game.boss;
        if (!boss) return;
        const hitFlash = boss.hp < boss.maxHp && (animationId % 10 < 5);

        // Time-based animation
        const t = (performance.now() - game.startTime) / 1000;
        const pulse = (Math.sin(t * 2) + 1) / 2;
        const wob = Math.sin(t * 1.4) * 4;

        const cx = boss.x;
        const cy = boss.y;
        const baseR = Math.min(boss.width, boss.height) * 0.5;

        ctx.save();
        if(hitFlash) ctx.filter = 'brightness(1.5)';

        ctx.shadowBlur = 30;
        ctx.shadowColor = boss.type.accentColor;

        // Outer rotating ellipse and glow ring
        glowRing(cx, cy, baseR * 1.22 + pulse * 2.0, boss.type.accent, 3, pulse);

        switch (boss.type.id) {
            case 'dreadnought': { // Titan Aegis
                ctx.save();
                ctx.strokeStyle = boss.type.accent;
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.8;
                for (let i = 0; i < 6; i++) {
                    ctx.beginPath();
                    const a0 = i * Math.PI / 3 + t * 0.2;
                    ctx.arc(cx, cy, baseR * 1.0, a0 + 0.1, a0 + 0.7);
                    ctx.stroke();
                }
                ctx.fillStyle = boss.type.mid;
                ctx.shadowBlur = 18;
                ctx.shadowColor = boss.type.accent;
                ctx.beginPath();
                ctx.moveTo(cx - baseR * 0.9, cy);
                ctx.bezierCurveTo(cx - baseR * 0.4, cy - 60, cx + baseR * 0.4, cy - 60, cx + baseR * 0.9, cy);
                ctx.bezierCurveTo(cx + baseR * 0.4, cy + 60, cx - baseR * 0.4, cy + 60, cx - baseR * 0.9, cy);
                ctx.closePath();
                ctx.fill();
                ctx.translate(cx, cy);
                ctx.rotate(t * 0.6);
                for (let k = 0; k < 4; k++) {
                    ctx.rotate(Math.PI / 2);
                    ctx.fillStyle = boss.type.base;
                    ctx.beginPath();
                    ctx.rect(baseR * 0.55, -8, 26, 16);
                    ctx.fill();
                    ctx.fillStyle = boss.type.accent;
                    ctx.fillRect(baseR * 0.55 + 26, -3, 24, 6);
                }
                gradCircle(0, 0, 22 + 4 * pulse, '#fff', boss.type.accent);
                ctx.restore();
                break;
            }

            case 'voidcrusher': { // Graviton Lens
                ctx.save();
                const rings = 6;
                for (let i = 0; i < rings; i++) {
                    const r = baseR * 0.4 + i * 10;
                    ctx.strokeStyle = `rgba(216,180,255,${0.25 + 0.1 * i})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, r, r * (0.9 + 0.05 * Math.sin(t + i)), (i % 2 ? -t : t) * 0.7, 0, Math.PI * 2);
                    ctx.stroke();
                }
                gradCircle(cx, cy, 30 + 4 * pulse, '#ffffff', boss.type.base);
                for (let i = 0; i < 28; i++) {
                    const ang = t * 0.9 + i * 0.3;
                    const r = baseR * 1.1 - (i % 14) * 8;
                    ctx.globalAlpha = 0.35;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 2, 2);
                }
                ctx.restore();
                break;
            }

            case 'plasmaemperor': { // Prismatic Rex
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(t * 0.5);
                function tri(R) {
                    ctx.beginPath();
                    for (let i = 0; i < 3; i++) {
                        const a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
                        const x = Math.cos(a) * R, y = Math.sin(a) * R;
                        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
                    }
                    ctx.closePath();
                }
                const g1 = ctx.createLinearGradient(-baseR, 0, baseR, 0);
                g1.addColorStop(0, boss.type.accent);
                g1.addColorStop(1, boss.type.base);
                ctx.fillStyle = g1;
                ctx.shadowBlur = 16;
                ctx.shadowColor = boss.type.accent;
                tri(baseR * 0.95);
                ctx.fill();
                ctx.rotate(Math.PI / 3);
                const g2 = ctx.createLinearGradient(0, -baseR, 0, baseR);
                g2.addColorStop(0, boss.type.base);
                g2.addColorStop(1, boss.type.accent);
                ctx.fillStyle = g2;
                tri(baseR * 0.75);
                ctx.fill();
                ctx.strokeStyle = boss.type.accent;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.9;
                for (let i = 0; i < 6; i++) {
                    ctx.rotate(Math.PI / 3);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(baseR * 1.1, 0);
                    ctx.stroke();
                }
                gradCircle(0, 0, 26 + 5 * pulse, '#fff', boss.type.accent);
                ctx.restore();
                break;
            }

            case 'cyberleviathan': { // Vector-Snake
                ctx.save();
                const nodes = 12;
                const pts = [];
                for (let i = 0; i < nodes; i++) {
                    const a = i * (Math.PI * 2 / nodes) + Math.sin(t * 0.7 + i * 0.4) * 0.25;
                    const R = baseR * 0.5 + 20 * Math.sin(t * 1.3 + i);
                    pts.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R * 0.9 });
                }
                ctx.strokeStyle = boss.type.accent;
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                for (let i = 0; i < pts.length; i++) {
                    const p = pts[i];
                    i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
                }
                ctx.closePath();
                ctx.stroke();
                for (let i = 0; i < pts.length; i++) {
                    const p = pts[i];
                    gradCircle(p.x, p.y, 6 + 2 * Math.sin(t * 2 + i), '#fff', boss.type.accent);
                    ctx.globalAlpha = 0.35;
                    ctx.beginPath();
                    ctx.ellipse(p.x, p.y, 18, 8, i * 0.6 + t, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(124,251,255,.5)';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
                const head = pts[Math.floor(t * 4) % pts.length];
                gradCircle(head.x, head.y, 12 + 4 * Math.sin(t * 3), '#fff', boss.type.accent);
                ctx.restore();
                break;
            }

            case 'darksovereign': { // Eclipse King
                ctx.save();
                ctx.strokeStyle = boss.type.accent;
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.ellipse(cx, cy, baseR * 1.05, baseR * 0.75, t * 0.4, 0, Math.PI * 2);
                ctx.stroke();
                const N = 6;
                for (let i = 0; i < N; i++) {
                    const a = i * (Math.PI * 2 / N) + t * 0.3;
                    const R = baseR * 0.8;
                    const ox = cx + Math.cos(a) * R;
                    const oy = cy + Math.sin(a) * R * 0.85;
                    ctx.save();
                    ctx.translate(ox, oy);
                    ctx.rotate(a + Math.sin(t + i) * 0.2);
                    const grd = ctx.createLinearGradient(0, -28, 0, 28);
                    grd.addColorStop(0, boss.type.mid);
                    grd.addColorStop(1, '#000');
                    ctx.fillStyle = grd;
                    ctx.shadowBlur = 14;
                    ctx.shadowColor = boss.type.accent;
                    ctx.beginPath();
                    ctx.moveTo(0, -28);
                    ctx.lineTo(12, 0);
                    ctx.lineTo(0, 28);
                    ctx.lineTo(-12, 0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                gradCircle(cx, cy, 16 + 4 * Math.sin(t * 2), '#fff', boss.type.accent);
                ctx.restore();
                break;
            }

            case 'crimsonwarlord': { // Blood Halberd
                ctx.save();
                // rotating blood sigil
                ctx.strokeStyle = 'rgba(255,80,80,.7)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(cx, cy, baseR * 1.0, baseR * 0.85, t * 0.4, 0, Math.PI * 2);
                ctx.stroke();

                // crossed halberd heads (X shape)
                ctx.translate(cx, cy);
                ctx.rotate(0.25 * Math.sin(t * 0.8));
                function halberd(angle, len) {
                    ctx.save();
                    ctx.rotate(angle);
                    const g = ctx.createLinearGradient(0, 0, len, 0);
                    g.addColorStop(0, '#23121a');
                    g.addColorStop(1, '#ff3b2f');
                    ctx.fillStyle = g;
                    ctx.shadowBlur = 18;
                    ctx.shadowColor = '#ff8fa3';
                    // shaft
                    ctx.fillRect(-10, -4, len * 0.8, 8);
                    // blade
                    ctx.beginPath();
                    ctx.moveTo(len * 0.8, -14);
                    ctx.lineTo(len, 0);
                    ctx.lineTo(len * 0.8, 14);
                    ctx.closePath();
                    ctx.fill();
                    // spike
                    ctx.fillRect(-10, -3, 16, 6);
                    ctx.restore();
                }
                halberd(Math.PI / 4, baseR * 1.15);
                halberd(-Math.PI / 4, baseR * 1.15);

                // shard burst ring
                for (let i = 0; i < 16; i++) {
                    const a = i * (Math.PI * 2 / 16) + t * 0.6;
                    const r = baseR * 0.9 + 6 * Math.sin(t * 2 + i);
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                    ctx.lineTo(Math.cos(a) * (r + 12), Math.sin(a) * (r + 12));
                    ctx.strokeStyle = 'rgba(255,120,120,.7)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // core pulse
                gradCircle(0, 0, 24 + 6 * pulse, '#fff', '#ff8fa3');
                ctx.restore();
                break;
            }

            case 'azuredestroyer': { // Abyss Cyclone
                ctx.save();
                // central hydrofoil spine
                ctx.beginPath();
                ctx.moveTo(cx - baseR * 0.95, cy);
                ctx.bezierCurveTo(cx - baseR * 0.25, cy - baseR * 0.75, cx + baseR * 0.25, cy - baseR * 0.75, cx + baseR * 0.95, cy);
                ctx.bezierCurveTo(cx + baseR * 0.25, cy + baseR * 0.75, cx - baseR * 0.25, cy + baseR * 0.75, cx - baseR * 0.95, cy);
                const gBody = ctx.createLinearGradient(cx - baseR, cy, cx + baseR, cy);
                gBody.addColorStop(0, boss.type.mid);
                gBody.addColorStop(1, boss.type.base);
                ctx.fillStyle = gBody;
                ctx.shadowBlur = 18;
                ctx.shadowColor = boss.type.accent;
                ctx.fill();

                // abyss cyclone (triple spiral underbody)
                ctx.globalAlpha = 0.85;
                for (let s = 0; s < 3; s++) {
                    ctx.strokeStyle = `rgba(179,229,255,${0.35 - s * 0.08})`;
                    ctx.lineWidth = 2 - s * 0.3;
                    ctx.beginPath();
                    for (let a = 0; a < Math.PI * 2.5; a += 0.18) {
                        const r = baseR * 0.15 + a * 6 + s * 8 + 4 * Math.sin(t * 1.3 + a * 2);
                        const x = cx + Math.cos(a + t * 0.8 + s * 0.6) * r;
                        const y = cy + Math.sin(a + t * 0.8 + s * 0.6) * r * 0.9 + 8 * s;
                        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }

                // dorsal fins (distinct V-shape)
                ctx.fillStyle = boss.type.accent;
                for (const sign of [-1, 1]) {
                    ctx.beginPath();
                    ctx.moveTo(cx + sign * baseR * 0.55, cy - 12);
                    ctx.lineTo(cx + sign * baseR * 0.80, cy - 38);
                    ctx.lineTo(cx + sign * baseR * 0.70, cy + 6);
                    ctx.closePath();
                    ctx.globalAlpha = 0.9;
                    ctx.fill();
                }

                // twin gyro impellers (ringed, counter-rotating)
                const rot = t * 1.3;
                function ringGyro(cx0, cy0, R, blades, dir) {
                    ctx.save();
                    ctx.translate(cx0, cy0);
                    ctx.rotate(rot * dir);
                    ctx.strokeStyle = 'rgba(179,229,255,.55)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, R, 0, Math.PI * 2);
                    ctx.stroke();
                    for (let i = 0; i < blades; i++) {
                        ctx.rotate(Math.PI * 2 / blades);
                        ctx.beginPath();
                        ctx.moveTo(R * 0.3, -5);
                        ctx.lineTo(R * 0.92, 0);
                        ctx.lineTo(R * 0.3, 5);
                        ctx.closePath();
                        ctx.fillStyle = boss.type.accent;
                        ctx.globalAlpha = 0.85;
                        ctx.fill();
                    }
                    ctx.restore();
                }
                ringGyro(cx - baseR * 0.42, cy + 6, baseR * 0.34, 7, 1);
                ringGyro(cx + baseR * 0.42, cy - 6, baseR * 0.28, 9, -1);

                // caustic highlights along spine
                ctx.strokeStyle = 'rgba(255,255,255,.32)';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 1;
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.moveTo(cx - baseR * 0.6 + i * 42, cy - 22 - i * 6);
                    ctx.bezierCurveTo(cx - baseR * 0.2, cy - 46, cx - 10, cy - 8, cx + baseR * 0.1, cy - 6 + i * 2);
                    ctx.stroke();
                }
                ctx.restore();
                break;
            }

            case 'emeraldtyrant': { // Bio-Terrarium
                ctx.save();
                const layers = 4;
                for (let L = 0; L < layers; L++) {
                    const R = baseR * 0.5 + L * 18;
                    ctx.strokeStyle = `rgba(155,255,199,${0.25 + 0.12 * L})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const a = -Math.PI / 2 + i * Math.PI / 3 + L * 0.08 + Math.sin(t * 0.6 + L) * 0.02;
                        const x = cx + Math.cos(a) * R;
                        const y = cy + Math.sin(a) * R;
                        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
                    }
                    ctx.closePath();
                    ctx.shadowColor = '#9bffc7';
                    ctx.shadowBlur = 10;
                    ctx.stroke();
                }
                for (let i = 0; i < 7; i++) {
                    ctx.beginPath();
                    const a0 = i * (Math.PI * 2 / 7) + t * 0.2;
                    ctx.moveTo(cx, cy);
                    for (let k = 1; k <= 8; k++) {
                        const r = 18 * k + 6 * Math.sin(t * 0.9 + i + k * 0.3);
                        ctx.lineTo(cx + Math.cos(a0 + 0.2 * k) * r, cy + Math.sin(a0 + 0.2 * k) * r);
                    }
                    ctx.strokeStyle = `rgba(39,174,96,${0.6})`;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
                gradCircle(cx, cy, 34 + 6 * pulse, '#ffffff', '#9bffc7');
                ctx.restore();
                break;
            }

            case 'shadowbehemoth': { // Abyssal IX
                ctx.save();
                ctx.fillStyle = '#04070c';
                ctx.shadowBlur = 18;
                ctx.shadowColor = '#b9fff5';
                const shards = 18;
                for (let i = 0; i < shards; i++) {
                    const a = t * 0.2 + i * (Math.PI * 2 / shards);
                    const r = baseR * 0.6 + 40 * Math.sin(t * 0.7 + i);
                    const x1 = cx + Math.cos(a) * r;
                    const y1 = cy + Math.sin(a) * r;
                    const x2 = cx + Math.cos(a + 0.2) * (r * 0.9);
                    const y2 = cy + Math.sin(a + 0.2) * (r * 0.9);
                    const x3 = cx + Math.cos(a + 0.05) * (r * 1.2);
                    const y3 = cy + Math.sin(a + 0.05) * (r * 1.2);
                    ctx.globalAlpha = 0.65;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x3, y3);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.ellipse(cx, cy, baseR * 0.6, baseR * 0.95, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
                gradCircle(cx - 28, cy - 18, 12 + 3 * ((Math.sin(t * 2) + 1) / 2), '#fff', '#b9fff5');
                gradCircle(cx + 28, cy - 18, 12 + 3 * ((Math.sin(t * 2) + 1) / 2), '#fff', '#b9fff5');
                for (let i = 0; i < 22; i++) {
                    const ang = t * 0.3 + i * 0.28;
                    const r2 = baseR * 1.1 + Math.sin(t + i) * 10;
                    ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 2 + i);
                    ctx.fillStyle = '#b9fff5';
                    ctx.fillRect(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2, 2, 2);
                }
                ctx.restore();
                break;
            }

            case 'solarannihilator': { // CME Crown
                gradCircle(cx, cy, baseR * 0.82 + 2 * wob, '#fff', '#f39c12');
                ctx.save();
                for (let L = 0; L < 3; L++) {
                    ctx.strokeStyle = `rgba(255,209,102,${0.45 - 0.1 * L})`;
                    ctx.lineWidth = 3 - L * 0.5;
                    const R = baseR * (1.0 + 0.12 * L + 0.02 * Math.sin(t * 1.4 + L));
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, R, R * (0.85 + 0.08 * Math.sin(t + L)), (L % 2 ? -t : t) * 0.5, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.translate(cx, cy);
                ctx.rotate(t * 0.8);
                ctx.fillStyle = '#ffd166';
                ctx.globalAlpha = 0.85;
                for (let i = 0; i < 14; i++) {
                    ctx.rotate(Math.PI * 2 / 14);
                    ctx.beginPath();
                    ctx.moveTo(baseR * 0.7, -6);
                    ctx.lineTo(baseR * 1.05, 0);
                    ctx.lineTo(baseR * 0.7, 6);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
                break;
            }

            case 'frostmonarch': { // Glacio-Spire
                ctx.save();
                // Aurora ribbons
                for (let L = 0; L < 3; L++) {
                    const rot = (L % 2 ? -t : t) * 0.45;
                    const rx = baseR * (1.05 + 0.08 * L);
                    const ry = rx * (0.78 + 0.06 * Math.sin(t + L));
                    ctx.strokeStyle = `rgba(214,234,248,${0.42 - 0.1 * L})`;
                    ctx.lineWidth = 3 - L * 0.6;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();

                // Central core
                gradCircle(cx, cy, baseR * 0.28 + 4 * pulse, '#ffffff', boss.type.accent);

                // Hexagonal snowflake crystal arms
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(t * 0.35);
                const arms = 6;
                for (let i = 0; i < arms; i++) {
                    ctx.save();
                    ctx.rotate((Math.PI * 2 / arms) * i);
                    ctx.strokeStyle = `rgba(150, 210, 255, ${0.55})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, -baseR * 0.92);
                    ctx.stroke();

                    for (let k = 1; k <= 3; k++) {
                        const r = baseR * (0.28 + 0.18 * k) + Math.sin(t * 1.4 + k) * 2;
                        const g = ctx.createLinearGradient(0, -r - 14, 0, -r + 14);
                        g.addColorStop(0, boss.type.mid);
                        g.addColorStop(1, boss.type.base);
                        ctx.fillStyle = g;
                        ctx.shadowBlur = 12;
                        ctx.shadowColor = boss.type.accent;

                        ctx.beginPath();
                        ctx.moveTo(0, -r - 16);
                        ctx.lineTo(12, -r);
                        ctx.lineTo(0, -r + 16);
                        ctx.lineTo(-12, -r);
                        ctx.closePath();
                        ctx.fill();

                        ctx.beginPath();
                        ctx.moveTo(18, -r);
                        ctx.lineTo(30, -r - 6);
                        ctx.lineTo(30, -r + 6);
                        ctx.closePath();
                        ctx.fill();

                        ctx.beginPath();
                        ctx.moveTo(-18, -r);
                        ctx.lineTo(-30, -r - 6);
                        ctx.lineTo(-30, -r + 6);
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.restore();
                }
                ctx.restore();

                // Runic ice ring
                ctx.save();
                ctx.translate(cx, cy);
                ctx.strokeStyle = `rgba(214,234,248,0.9)`;
                ctx.lineWidth = 2;
                const Rr = baseR * 1.04;
                ctx.beginPath();
                ctx.arc(0, 0, Rr, 0, Math.PI * 2);
                ctx.stroke();

                const ticks = 36;
                for (let i = 0; i < ticks; i++) {
                    const a = i * (Math.PI * 2 / ticks) + t * 0.3;
                    const len = (i % 6 === 0) ? 14 : (i % 3 === 0) ? 9 : 6;
                    const x1 = Math.cos(a) * (Rr - 4);
                    const y1 = Math.sin(a) * (Rr - 4);
                    const x2 = Math.cos(a) * (Rr - 4 - len);
                    const y2 = Math.sin(a) * (Rr - 4 - len);
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
                ctx.restore();

                // Frost sparkles
                ctx.save();
                const sparkleCount = 28;
                for (let i = 0; i < sparkleCount; i++) {
                    const a = t * 0.6 + i * (Math.PI * 2 / sparkleCount);
                    const r = baseR * 1.12 + Math.sin(t * 1.7 + i) * 6;
                    const sx = cx + Math.cos(a) * r;
                    const sy = cy + Math.sin(a) * r;
                    ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 2 + i);
                    ctx.fillStyle = '#d6eaf8';
                    ctx.fillRect(sx, sy, 2, 2);
                }
                ctx.restore();
                break;
            }

            case 'infernooverlord': { // Magma Tyr
                ctx.save();
                ctx.strokeStyle = 'rgba(255,140,90,.6)';
                ctx.lineWidth = 4;
                for (let i = 0; i < 8; i++) {
                    ctx.beginPath();
                    const a0 = i * (Math.PI * 2 / 8) + Math.sin(t + i) * 0.1;
                    ctx.arc(cx, cy, baseR * 0.95, a0 + 0.05, a0 + 0.25);
                    ctx.stroke();
                }
                const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, baseR * 0.85);
                g.addColorStop(0, '#ff7a2a');
                g.addColorStop(0.55, '#ff7a2a');
                g.addColorStop(1, '#2a0e07');
                ctx.fillStyle = g;
                ctx.shadowBlur = 18;
                ctx.shadowColor = '#ff9b71';
                ctx.beginPath();
                ctx.moveTo(cx, cy - baseR * 0.8);
                ctx.bezierCurveTo(cx + baseR * 0.6, cy - baseR * 0.5, cx + baseR * 0.7, cy, cx, cy + baseR * 0.8);
                ctx.bezierCurveTo(cx - baseR * 0.7, cy, cx - baseR * 0.6, cy - baseR * 0.5, cx, cy - baseR * 0.8);
                ctx.fill();

                // Draw smoke particles
                if (boss.smokeParticles) {
                    boss.smokeParticles.forEach(p => {
                        ctx.globalAlpha = p.life / p.maxLife;
                        ctx.fillStyle = p.color;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    ctx.globalAlpha = 1;
                }
                ctx.restore();
                break;
            }
            default: // Default pentagon shape
                ctx.fillStyle = boss.type.secondaryColor;
                ctx.strokeStyle = boss.type.color;
                ctx.lineWidth = 5;

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
                break;
        }

        // Common outer rotating ellipse for all bosses
        ctx.save();
        ctx.strokeStyle = `rgba(124,251,255,${0.35 + 0.35 * pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, baseR * 1.25, baseR * 1.25 * (1 + 0.06 * Math.sin(t)), t * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

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
            soundSystem.shieldDown(); // Use the new shield down sound
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

        const laserRect = {
            x: x,
            y: (y - 15) / 2, // Center of the laser
            width: laserWidth,
            height: y - 15
        };
        for (let i = game.enemies.length - 1; i >= 0; i--) {
            const enemy = game.enemies[i];
            if (checkCollision(laserRect, enemy)) {
                game.enemies.splice(i, 1);
                game.score += 10;
                createExplosion(enemy.x, enemy.y, '#ff0', 5);
                soundSystem.shoot(); // Add sound for laser hit
            }
        }

        if (game.elite && checkCollision(laserRect, game.elite)) {
            game.elite.hp -= 1;
            game.score += 2;

            if (game.elite.hp <= 0) {
                createExplosion(game.elite.x, game.elite.y, game.elite.type.accentColor, 60);
                game.score += 2000;
                game.screenShake = 10;
                soundSystem.explosion();

                // Spawn rewards
                for (let r = 0; r < 3; r++) {
                    spawnPowerUp(game.elite.x + (r - 1) * 40, game.elite.y + 30);
                }

                game.elite = null;
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

            if (game.boss.hp <= 0 && !game.bossDefeatAnimation.active) {
                startBossDefeatAnimation(game.boss);
            }
        }
    }

    // 유도탄 회전 제한 적용 (turn-rate smoothing)
    function updateHomingMissile(b, dt) {
        const target = player;
        if (!target) return;
        const dx = target.x - b.x;
        const dy = target.y - b.y;
        const dist = Math.max(1, Math.sqrt(dx*dx + dy*dy));
        const desiredVx = (dx / dist) * (b.speed || 4);
        const desiredVy = (dy / dist) * (b.speed || 4);

        const turnRate = 0.12; // 0..1, 값 조정 가능
        b.vx = (b.vx || 0) + (desiredVx - (b.vx || 0)) * turnRate;
        b.vy = (b.vy || 0) + (desiredVy - (b.vy || 0)) * turnRate;

        const maxS = b.maxSpeed || (b.speed || 4);
        const curS = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
        if (curS > maxS) { b.vx = (b.vx/curS)*maxS; b.vy = (b.vy/curS)*maxS; }

        b.x += b.vx * dt;
        b.y += b.vy * dt;
    }

    // 방패 파괴시 사운드 호출
    function handleShieldDamage(shield) {
        if (shield.hp <= 0 && !shield._brokenSoundPlayed) {
            shield._brokenSoundPlayed = true;
            soundSystem.shieldBreak && soundSystem.shieldBreak();
        }
    }

    function gameLoop() {
        if (!gameRunning) return;
        if (game.score >= BOSS_SPAWN_SCORE && !game.boss) spawnBoss();

        // Spawn elite enemy every 3000 points (if not already present)
        if (game.score - game.lastEliteScore >= ELITE_SPAWN_SCORE && !game.elite && !game.boss) {
            spawnElite();
            game.lastEliteScore = game.score;
        }

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
        let speedMultiplier = game.player.slowmoActive ? 0.5 : 1;

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

            // Singularity (Void Crusher Ultimate) - super strong gravity
            if (b.singularity) {
                b.age = (b.age || 0) + 1;
                b.life = (b.life || 180) - 1;
                // Pull all nearby bullets towards it
                game.enemyBullets.forEach(other => {
                    if (other !== b && !other.singularity) {
                        const dx = b.x - other.x;
                        const dy = b.y - other.y;
                        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                        if (dist < 200) {
                            const pull = 0.3 / dist;
                            other.vx = (other.vx || 0) + (dx / dist) * pull;
                            other.vy = (other.vy || 0) + (dy / dist) * pull;
                        }
                    }
                });
                if (b.life <= 0) b.vy = 999; // Mark for removal
            }

            // Gravity bullets (Void Crusher)
            if (b.gravity && !b.singularity) {
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

            // Time Distortion (Crimson Warlord)
            if (b.timeDistortion) {
                b.age = (b.age || 0) + 1;
                const pulseSpeed = Math.sin(b.age * 0.1) * 0.5 + 1; // 0.5x to 1.5x speed
                const magnitude = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                if (magnitude > 0) {
                    const targetMag = b.baseSpeed * pulseSpeed;
                    b.vx = (b.vx / magnitude) * targetMag;
                    b.vy = (b.vy / magnitude) * targetMag;
                }
            }

            // Echo bullets (Crimson Warlord) - leave after-images
            if (b.echo) {
                b.echoTimer = (b.echoTimer || 0) + 1;
                if (b.echoTimer % 10 === 0) {
                    game.particles.push({
                        x: b.x, y: b.y,
                        vx: 0, vy: 0,
                        life: 20,
                        color: b.color,
                        size: b.width
                    });
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

        // Elite enemy movement and attack
        if (game.elite) {
            const elite = game.elite;
            if (elite.phase === 'enter') {
                elite.y += elite.speed * speedMultiplier;
                if (elite.y >= 80) {
                    elite.y = 80;
                    elite.phase = 'attack';
                }
            } else if (elite.phase === 'attack') {
                elite.x += elite.speed * speedMultiplier;
                if (elite.x > canvas.width - elite.width / 2 || elite.x < elite.width / 2) {
                    elite.speed *= -1;
                }
                eliteShoot();
            }
        }

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

        if (game.boss && game.boss.type.id === 'infernooverlord') {
            // Spawn new smoke particles
            if (Math.random() < 0.3) { // Adjust spawn rate
                game.boss.smokeParticles.push({
                    x: game.boss.x + (Math.random() - 0.5) * 40,
                    y: game.boss.y + game.boss.height / 2 + 10,
                    vx: (Math.random() - 0.5) * 1,
                    vy: 0.5 + Math.random() * 1.5, // Float upwards
                    life: 60 + Math.random() * 60,
                    maxLife: 120,
                    size: 5 + Math.random() * 10,
                    color: 'rgba(255, 100, 0, 0.8)' // Fiery smoke color
                });
            }
            // Update smoke particles
            game.boss.smokeParticles = game.boss.smokeParticles.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                return p.life > 0;
            });
        }

        // Boss Ultimate Effects Processing
        // Boss Defeat Animation Processing
        if (game.bossDefeatAnimation.active) {
            game.bossDefeatAnimation.timer--;

            const anim = game.bossDefeatAnimation;
            const boss = anim.boss;

            // Create continuous explosions
            if (anim.timer % 8 === 0) {
                const offsetX = (Math.random() - 0.5) * boss.width;
                const offsetY = (Math.random() - 0.5) * boss.height;
                createExplosion(
                    boss.x + offsetX,
                    boss.y + offsetY,
                    [boss.type.base, boss.type.accent, '#fff'][Math.floor(Math.random() * 3)],
                    40
                );
                soundSystem.shoot();
            }

            // Large bursts at intervals
            if (anim.timer % 40 === 0) {
                createExplosion(boss.x, boss.y, boss.type.accent, 80);
                game.screenShake = 15;
                soundSystem.explosion();
            }

            // Flash effect
            if (anim.timer % 15 < 8) {
                ctx.save();
                ctx.globalAlpha = 0.1;
                ctx.fillStyle = boss.type.accent;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            }

            // End animation
            if (anim.timer <= 0) {
                game.bossDefeatAnimation.active = false;
                game.boss = null;

                // Final massive explosion
                createExplosion(boss.x, boss.y, '#fff', 200);
                game.screenShake = 40;

                // Victory!
                setTimeout(() => {
                    endGame(true);
                }, 1000);
            }

            // Slow motion during defeat
            speedMultiplier *= 0.3;
        }

        // Screen shake processing
        if (game.screenShake > 0) {
            game.screenShake--;
            const intensity = game.screenShake * 0.5;
            game.screenShakeX = (Math.random() - 0.5) * intensity;
            game.screenShakeY = (Math.random() - 0.5) * intensity;
        } else {
            game.screenShakeX = 0;
            game.screenShakeY = 0;
        }

        if (game.boss && game.boss.ultimateActive) {
            const boss = game.boss;

            // Crimson Warlord - Temporal Rupture
            if (boss.temporalRuptureActive && boss.temporalRuptureTimer > 0) {
                boss.temporalRuptureTimer--;
                boss.timePhase = (boss.timePhase || 0) + 1;

                // Phase 1: Slow time (bullets move slower)
                if (boss.timePhase < 60) {
                    game.enemyBullets.forEach(b => {
                        if (b.originalVx === undefined) {
                            b.originalVx = b.vx || 0;
                            b.originalVy = b.vy || b.speed || 0;
                        }
                        b.vx = (b.originalVx || 0) * 0.3;
                        b.vy = (b.originalVy || 0) * 0.3;
                    });
                }
                // Phase 2: Reverse time (bullets go backwards)
                else if (boss.timePhase < 120) {
                    game.enemyBullets.forEach(b => {
                        b.vx = -(b.originalVx || 0) * 0.5;
                        b.vy = -(b.originalVy || 0) * 0.5;
                    });
                }
                // Phase 3: Accelerate time (bullets move very fast)
                else {
                    game.enemyBullets.forEach(b => {
                        b.vx = (b.originalVx || 0) * 2.5;
                        b.vy = (b.originalVy || 0) * 2.5;
                    });
                }

                // Spawn temporal distortions
                if (boss.timePhase % 20 === 0) {
                    createExplosion(Math.random() * canvas.width, Math.random() * canvas.height, '#ff6b9d', 15);
                }

                if (boss.temporalRuptureTimer <= 0) {
                    boss.temporalRuptureActive = false;
                    // Restore normal speeds
                    game.enemyBullets.forEach(b => {
                        if (b.originalVx !== undefined) {
                            b.vx = b.originalVx;
                            b.vy = b.originalVy;
                            delete b.originalVx;
                            delete b.originalVy;
                        }
                    });
                }
            }

            // Frost Monarch - Blizzard
            if (boss.blizzardActive && boss.blizzardTimer > 0) {
                boss.blizzardTimer--;
                if (boss.blizzardTimer % 5 === 0) {
                    for (let i = 0; i < 3; i++) {
                        game.enemyBullets.push({
                            x: Math.random() * canvas.width,
                            y: -10,
                            width: 6,
                            height: 12,
                            vx: (Math.random() - 0.5) * 3,
                            vy: 3 + Math.random() * 2,
                            color: '#b3d9ff',
                            ice: true
                        });
                    }
                }
                if (boss.blizzardTimer <= 0) boss.blizzardActive = false;
            }

            // Inferno Overlord - Magma Eruption
            if (boss.magmaEruptionActive && boss.magmaEruptionTimer > 0) {
                boss.magmaEruptionTimer--;
                if (boss.magmaEruptionTimer % 8 === 0) {
                    for (let i = 0; i < 2; i++) {
                        game.enemyBullets.push({
                            x: Math.random() * canvas.width,
                            y: canvas.height + 10,
                            width: 14,
                            height: 14,
                            vx: (Math.random() - 0.5) * 2,
                            vy: -(5 + Math.random() * 3),
                            color: '#ff4500',
                            magma: true
                        });
                    }
                }
                if (boss.magmaEruptionTimer <= 0) boss.magmaEruptionActive = false;
            }

            // Azure Destroyer - Maelstrom
            if (boss.maelstromActive) {
                boss.maelstromAngle = (boss.maelstromAngle || 0) + 0.1;
                if (animationId % 5 === 0) {
                    const radius = 80 + Math.sin(boss.maelstromAngle) * 40;
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2 + boss.maelstromAngle;
                        game.enemyBullets.push({
                            x: boss.x + Math.cos(angle) * radius,
                            y: boss.y + Math.sin(angle) * radius * 0.7,
                            width: 10,
                            height: 10,
                            vx: Math.cos(angle + Math.PI/2) * 4,
                            vy: Math.sin(angle + Math.PI/2) * 4 + 2,
                            color: '#2f9be4'
                        });
                    }
                }
            }

            // Shadow Behemoth - Void Rifts
            if (boss.voidRifts && boss.voidRifts.length > 0) {
                boss.voidRifts = boss.voidRifts.filter(rift => {
                    rift.life--;
                    rift.spawnTimer++;
                    if (rift.spawnTimer % 20 === 0) {
                        game.enemyBullets.push({
                            x: rift.x,
                            y: rift.y,
                            width: 12,
                            height: 12,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            color: '#8b00ff',
                            void: true
                        });
                    }
                    return rift.life > 0;
                });
            }

            // Plasma Emperor - Prism Beams
            if (boss.prismBeams && boss.prismBeams.length > 0) {
                boss.prismBeams.forEach(beam => {
                    beam.angle += 0.02;
                });
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
                    // Power-up drops
                    const rand = Math.random();
                    if (rand < 0.08 && game.player.hearts < 5) {
                        spawnPowerUp(enemy.x, enemy.y, 'heart'); // 8% chance for heart if not at max HP
                    } else if (rand < 0.15) {
                        spawnPowerUp(enemy.x, enemy.y, 'rateOfFire'); // 7% chance for fire rate
                    } else if (rand < 0.30) {
                        spawnPowerUp(enemy.x, enemy.y); // 15% chance for other items
                    }
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

            // Bullet vs Elite
            if (game.elite && checkCollision(bullet, game.elite)) {
                game.bullets.splice(i, 1);
                game.elite.hp -= 5;
                game.score += 20;
                createExplosion(bullet.x, bullet.y, game.elite.type.accentColor, 5);

                if (game.elite.hp <= 0) {
                    createExplosion(game.elite.x, game.elite.y, game.elite.type.accentColor, 60);
                    game.score += 2000;
                    game.screenShake = 10;
                    soundSystem.explosion();

                    // Spawn rewards
                    for (let r = 0; r < 3; r++) {
                        spawnPowerUp(game.elite.x + (r - 1) * 40, game.elite.y + 30);
                    }

                    game.elite = null;
                }
                updateHUD();
                continue;
            }

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

                if (game.boss.hp <= 0 && !game.bossDefeatAnimation.active) {
                    startBossDefeatAnimation(game.boss);
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
        // Player vs fragments (asteroid debris)
        for (let i = game.fragments.length - 1; i >= 0; i--) {
            const fragment = game.fragments[i];
            const fragmentHitbox = {
                x: fragment.x,
                y: fragment.y,
                width: fragment.size * 2,
                height: fragment.size * 2
            };
            if (checkCollision(fragmentHitbox, game.player)) {
                damagePlayer();
                createExplosion(fragment.x, fragment.y, '#aaa', 10);
                game.fragments.splice(i, 1);
            }
        }

        // Enemy Spawner
        game.enemySpawnTimer++;
        if (game.enemySpawnTimer > 40 && !game.boss) {
            spawnEnemy();
            game.enemySpawnTimer = 0;
        }

        // Drawing
        ctx.save();
        ctx.translate(game.screenShakeX, game.screenShakeY);

        game.particles.forEach(drawParticle);
        game.fragments.forEach(drawFragment);
        game.powerUps.forEach(drawPowerUp);
        game.bullets.forEach(drawBullet);
        game.enemyBullets.forEach(drawEnemyBullet);
        game.enemies.forEach(drawEnemy);
        if (game.elite) drawElite();
        if (game.boss && !game.bossDefeatAnimation.active) drawBoss();
        game.sidekicks.forEach(drawSidekick);
        drawPlayer();
        drawLaser();

        ctx.restore();

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
                soundSystem.powerUp(); // Add sound effect for laser activation
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
            case 'heart':
                game.player.hearts = Math.min(game.player.hearts + 1, 5); // Max 5 hearts
                soundSystem.powerUp();
                createExplosion(game.player.x, game.player.y, '#ff69b4', 30);
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

    function resetGame() {
        game.player = {
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
        };
        game.bullets = [];
        game.enemyBullets = [];
        game.sidekicks = [];
        game.enemies = [];
        game.fragments = [];
        game.powerUps = [];
        game.boss = null;
        game.score = 0;
        game.enemySpawnTimer = 0;
        game.keys = {};
        game.particles = [];
        game.inventory = [];
        game.startTime = Date.now();
        gameRunning = true;
        updateHUD();
        // Call showCountdown before starting the game loop
        multiGame.showCountdown(canvas, () => {
            gameLoop();
        });
    }

    const keydownHandler = (e) => {
        if (!gameRunning) {
            if (e.key === 'Escape') {
                cleanup();
                onExit();
            } else if (e.key === 'r' || e.key === 'R') {
                resetGame();
            }
            return;
        }

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
            ctx.fillText('R TO RESTART', canvas.width / 2, canvas.height / 2 + 120);
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
