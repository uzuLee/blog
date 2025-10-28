/**
 * ============================================
 * SECRET SEARCH KEYWORDS EASTER EGG
 * ============================================
 *
 * Activates stunning visual effects when special keywords are typed in the search box.
 *
 * Features:
 * - 4 unique visual effects with different themes
 * - Canvas-based particle animations
 * - Sound effects integration
 * - Fullscreen overlay effects
 * - Auto-cleanup after effect duration
 *
 * Available Keywords:
 * - "thematrix" → Matrix digital rain effect
 * - "whereisunicorn" → Rainbow unicorn particles
 * - "spacegalaxy" → Parallax star field
 * - "dothemagic" → Mystical smoke and stardust
 *
 * Technical:
 * - Prevents multiple simultaneous effects
 * - Uses requestAnimationFrame for smooth 60fps animations
 * - Automatic cleanup of event listeners and DOM elements
 *
 * @module secretSearch
 */

import { soundSystem } from '../soundSystem.js';

/**
 * ============================================
 * CONFIGURATION
 * ============================================
 */

/**
 * Map of secret keywords to their emoji representations.
 * Keys are lowercase for case-insensitive matching.
 * @const {Object.<string, string>}
 */
const SECRET_KEYWORDS = {
    'thematrix': '🟢',      // Green Matrix theme
    'whereisunicorn': '🦄', // Magical unicorn theme
    'spacegalaxy': '🌌',    // Space/galaxy theme
    'dothemagic': '✨'      // Magic/mystical theme
};

/**
 * ============================================
 * SECRET SEARCH EASTER EGG OBJECT
 * ============================================
 */

/**
 * Secret search keywords easter egg.
 * Triggers visual effects when special phrases are typed in search box.
 *
 * @type {Object}
 * @property {string} name - Display name for this easter egg
 * @property {string} description - What this easter egg does
 * @property {Object.<string, string>} secretKeywords - Map of keywords to emojis
 * @property {string|null} activeEffect - Currently running effect (prevents overlap)
 * @property {Function} init - Initialize search input listener
 * @property {Function} activate - Trigger specific effect by keyword
 * @property {Function} cleanupEffect - Reset active effect flag after duration
 * @property {Function} matrixEffect - Digital rain animation
 * @property {Function} unicornEffect - Rainbow particle explosion
 * @property {Function} galaxyEffect - Parallax star field
 * @property {Function} magicEffect - Smoke and stardust explosion
 * @property {Function} createEffectContainer - Create fullscreen overlay
 * @property {Function} screenShake - Camera shake effect
 * @property {Function} cleanup - Remove event listeners
 */
export const secretSearch = {
    name: 'Secret Search Keywords',
    description: 'Search for special keywords to discover secrets',

    secretKeywords: SECRET_KEYWORDS,
    activeEffect: null,

    /**
     * Initialize secret search keyword detection.
     * Listens to search input changes and matches against secret keywords.
     *
     * How it works:
     * 1. Get search input element
     * 2. Listen for input events
     * 3. Check if value matches any secret keyword
     * 4. Prevent new effects while one is active
     * 5. Trigger corresponding effect
     *
     * @returns {void}
     */
    init() {
        const searchInput = document.getElementById('command-input');
        if (!searchInput) return;

        /**
         * Handle search input changes.
         * Matches input against secret keywords and triggers effects.
         *
         * @param {Event} e - Input event
         */
        const handleInput = (e) => {
            const value = e.target.value.trim().toLowerCase();

            // Prevent overlapping effects
            if (this.activeEffect) return;

            // Check each keyword for match
            for (const [keyword, emoji] of Object.entries(this.secretKeywords)) {
                if (value === keyword) {
                    this.activate(keyword, emoji);
                    break;
                }
            }
        };

        searchInput.addEventListener('input', handleInput);
        this.cleanup = () => searchInput.removeEventListener('input', handleInput);
    },

    /**
     * Activate a specific effect by keyword.
     * Routes to the appropriate effect function.
     *
     * @param {string} keyword - The secret keyword that was typed
     * @param {string} emoji - Emoji associated with this keyword
     * @returns {void}
     */
    activate(keyword, emoji) {
        // Map keywords to effect functions
        const effects = {
            'thematrix': this.matrixEffect.bind(this),
            'whereisunicorn': this.unicornEffect.bind(this),
            'spacegalaxy': this.galaxyEffect.bind(this),
            'dothemagic': this.magicEffect.bind(this)
        };

        if (effects[keyword]) {
            this.activeEffect = keyword;
            effects[keyword](emoji);
        }

        console.log(`🔮 Secret phrase "${keyword}" activated!`);
    },

    /**
     * Reset active effect flag after duration.
     * Allows new effects to be triggered.
     *
     * @param {number} [duration=1000] - Delay before resetting flag (ms)
     * @returns {void}
     */
    cleanupEffect(duration = 1000) {
        setTimeout(() => {
            this.activeEffect = null;
        }, duration);
    },

    /**
     * ============================================
     * EFFECT: THE MATRIX (Digital Rain)
     * ============================================
     *
     * Classic Matrix-style falling characters effect.
     * Green cascading text with Japanese and Latin characters.
     *
     * Features:
     * - Multiple columns of falling characters
     * - Leader characters with glow effect
     * - Variable falling speeds
     * - Fade trail effect
     *
     * Duration: 10 seconds
     *
     * @param {string} emoji - Emoji for this effect (unused)
     * @returns {void}
     */
    matrixEffect(emoji) {
        soundSystem.powerUp();

        const container = this.createEffectContainer(99999);
        container.style.background = '#000';

        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        /**
         * Character set for Matrix rain.
         * Mix of Latin alphabet, numbers, and Japanese katakana.
         * @const {string}
         */
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789';
        const fontSize = 16;
        const columns = canvas.width / fontSize;

        /**
         * Array of drop objects, one per column.
         * Each drop has position, speed, and leader status.
         * @type {Array.<{y: number, speed: number, isLeader: boolean}>}
         */
        const drops = [];
        for(let i = 0; i < columns; i++) {
            drops[i] = {
                y: Math.random() * canvas.height,
                speed: 2 + Math.random() * 3,
                isLeader: Math.random() < 0.15  // 15% chance to be leader
            };
        }

        let animationFrame;

        /**
         * Draw Matrix rain animation frame.
         * Uses semi-transparent black fill for trail effect.
         */
        const draw = () => {
            // Fade previous frame (creates trail effect)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `${fontSize}px monospace`;

            // Draw each column
            for(let i = 0; i < drops.length; i++) {
                const drop = drops[i];
                const text = chars[Math.floor(Math.random() * chars.length)];

                // Leader characters are brighter with glow
                ctx.fillStyle = drop.isLeader ? '#cff0c8' : '#0f0';
                if(drop.isLeader) {
                     ctx.shadowBlur = 10;
                     ctx.shadowColor = '#0f0';
                }

                ctx.fillText(text, i * fontSize, drop.y * fontSize);
                ctx.shadowBlur = 0;

                // Move drop down
                drop.y += drop.speed / 10;

                // Reset to top when reaching bottom (with randomness)
                if (drop.y * fontSize > canvas.height && Math.random() > 0.98) {
                    drops[i].y = 0;
                }
            }
            animationFrame = requestAnimationFrame(draw);
        };

        draw();

        // Cleanup after 10 seconds
        setTimeout(() => {
            container.style.opacity = '0';
            setTimeout(() => {
                cancelAnimationFrame(animationFrame);
                container.remove();
                this.cleanupEffect();
            }, 1000);
        }, 10000);
    },

    /**
     * ============================================
     * EFFECT: UNICORN MAGIC (Rainbow Particles)
     * ============================================
     *
     * Interactive rainbow particle explosion on click.
     * Spawns unicorn emojis and colorful particles.
     *
     * Features:
     * - Click anywhere to spawn explosion
     * - Rainbow-colored particles with gravity
     * - Floating unicorn emojis
     * - Sound effect on each click
     *
     * Duration: 10 seconds
     *
     * @param {string} emoji - Unicorn emoji to display
     * @returns {void}
     */
    unicornEffect(emoji) {
        const container = this.createEffectContainer(99999);
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const emojis = [];

        /**
         * Handle click events to spawn particles and emojis.
         * Creates 100 rainbow particles and 1 unicorn emoji per click.
         *
         * @param {MouseEvent} e - Click event
         */
        const handleClick = (e) => {
            soundSystem.collect();

            const x = e.clientX;
            const y = e.clientY;

            // Create 100 particles
            for (let i = 0; i < 100; i++) {
                particles.push(this.createUnicornParticle(x, y));
            }

            // Create floating emoji
            emojis.push({
                x: x,
                y: y,
                vy: -2,         // Initial upward velocity
                alpha: 1,
                size: 48
            });
        };
        document.addEventListener('click', handleClick);

        let animationFrame;

        /**
         * Animation loop for particles and emojis.
         * Applies gravity and fades out over time.
         */
        const trailLoop = () => {
            // Fade trail
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.vy += 0.1; // Gravity
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= p.fade;

                if (p.alpha <= 0) {
                    particles.splice(i, 1);
                } else {
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Update and draw emojis
            for (let i = emojis.length - 1; i >= 0; i--) {
                const em = emojis[i];
                em.vy += 0.15; // Gravity
                em.y += em.vy;
                em.alpha -= 0.02;

                if (em.alpha <= 0) {
                    emojis.splice(i, 1);
                } else {
                    ctx.globalAlpha = em.alpha;
                    ctx.font = `${em.size}px serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(emoji, em.x, em.y);
                }
            }
            ctx.globalAlpha = 1;

            animationFrame = requestAnimationFrame(trailLoop);
        };

        trailLoop();

        // Cleanup after 10 seconds
        setTimeout(() => {
            document.removeEventListener('click', handleClick);
            container.style.opacity = '0';
            setTimeout(() => {
                 cancelAnimationFrame(animationFrame);
                 container.remove();
                 this.cleanupEffect(1000);
            }, 1000);
        }, 10000);
    },

    /**
     * Create a single rainbow particle for unicorn effect.
     * Particles explode outward with random colors and speeds.
     *
     * @param {number} x - X position to spawn from
     * @param {number} y - Y position to spawn from
     * @returns {Object} Particle object with position, velocity, color, etc.
     */
    createUnicornParticle(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 7;
        return {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,  // Initial upward bias
            alpha: 1,
            fade: 0.02 + Math.random() * 0.01,
            size: 2 + Math.random() * 2,
            color: `hsl(${Math.random() * 360}, 100%, 75%)`  // Random rainbow color
        };
    },

    /**
     * ============================================
     * EFFECT: SPACE GALAXY (Parallax Stars)
     * ============================================
     *
     * Interactive parallax star field with mouse control.
     * Three layers of stars at different depths create 3D effect.
     *
     * Features:
     * - 3 layers of stars (far, medium, near)
     * - Mouse-controlled parallax offset
     * - Gradient space background
     * - Real-time response to mouse movement
     *
     * Duration: 10 seconds
     *
     * @param {string} emoji - Galaxy emoji (unused)
     * @returns {void}
     */
    galaxyEffect(emoji) {
        soundSystem.victory();

        const container = this.createEffectContainer(99998);
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        /**
         * Star layers with different counts, sizes, and parallax speeds.
         * Farther layers move slower to create depth illusion.
         * @type {Array.<{count: number, size: number, speed: number, stars: Array}>}
         */
        const layers = [
            { count: 200, size: 1, speed: 0.1, stars: [] },  // Far layer (slow)
            { count: 100, size: 2, speed: 0.3, stars: [] },  // Medium layer
            { count: 40, size: 3, speed: 0.6, stars: [] }    // Near layer (fast)
        ];

        // Initialize star positions
        layers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                layer.stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    initialX: 0,
                    initialY: 0
                });
            }
            // Store initial positions for parallax calculation
            layer.stars.forEach(s => {
                s.initialX = s.x;
                s.initialY = s.y;
            });
        });

        /**
         * Handle mouse movement for parallax effect.
         * Stars move opposite to mouse position, creating depth.
         *
         * @param {MouseEvent} e - Mouse move event
         */
        const handleMouseMove = (e) => {
            // Calculate mouse position ratio (-0.5 to 0.5)
            const xRatio = (e.clientX - window.innerWidth / 2) / window.innerWidth;
            const yRatio = (e.clientY - window.innerHeight / 2) / window.innerHeight;

            // Draw gradient background
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
            );
            gradient.addColorStop(0, '#0d1a2f');
            gradient.addColorStop(1, '#000');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw each layer with parallax offset
            layers.forEach(layer => {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                layer.stars.forEach(star => {
                    // Apply parallax offset based on layer speed
                    const newX = star.initialX + xRatio * layer.speed * 100;
                    const newY = star.initialY + yRatio * layer.speed * 100;
                    ctx.beginPath();
                    ctx.arc(newX, newY, layer.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                });
            });
        };

        document.addEventListener('mousemove', handleMouseMove);

        // Initial draw at center
        handleMouseMove({ clientX: canvas.width / 2, clientY: canvas.height / 2});

        // Cleanup after 10 seconds
        setTimeout(() => {
            container.style.opacity = '0';
            setTimeout(() => {
                document.removeEventListener('mousemove', handleMouseMove);
                container.remove();
                this.cleanupEffect();
            }, 1000);
        }, 10000);
    },

    /**
     * ============================================
     * EFFECT: MAGIC SPELL (Smoke & Stardust)
     * ============================================
     *
     * Mystical explosion with smoke and glowing stardust.
     * Includes screen shake for dramatic effect.
     *
     * Features:
     * - Expanding smoke particles (dark, slow)
     * - Fast stardust particles (bright, glowing)
     * - Screen shake effect
     * - Additive blend mode for glow
     *
     * Duration: 8 seconds
     *
     * @param {string} emoji - Magic emoji (unused)
     * @returns {void}
     */
    magicEffect(emoji) {
        soundSystem.explosion();

        const container = this.createEffectContainer(99999);
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const smokeParticles = [];
        const stardustParticles = [];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        /**
         * Create smoke particles.
         * Large, slow-moving, semi-transparent dark particles.
         */
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2;
            smokeParticles.push({
                x: centerX + (Math.random() - 0.5) * canvas.width,
                y: centerY + (Math.random() - 0.5) * canvas.height,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 0.05 + Math.random() * 0.1,
                fade: 0.002 + Math.random() * 0.003,
                size: 30 + Math.random() * 40,
                color: `hsl(${200 + Math.random() * 60}, 40%, 20%)`  // Blue-ish dark
            });
        }

        /**
         * Create stardust particles.
         * Small, fast-moving, bright particles with additive blend.
         */
        for (let i = 0; i < 150; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            stardustParticles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 0.8 + Math.random() * 0.2,
                fade: 0.01 + Math.random() * 0.01,
                size: 1 + Math.random() * 2,
                color: `hsl(${200 + Math.random() * 60}, 100%, 85%)`  // Bright blue
            });
        }

        let animationFrame;

        /**
         * Animation loop for smoke and stardust.
         * Uses additive blend mode for glowing effect.
         */
        const loop = () => {
            // Fade trail
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Use additive blend for glow effect
            ctx.globalCompositeOperation = 'lighter';

            // Update and draw smoke
            for (let i = smokeParticles.length - 1; i >= 0; i--) {
                const p = smokeParticles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= p.fade;

                if (p.alpha <= 0) {
                    smokeParticles.splice(i, 1);
                } else {
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Update and draw stardust
            for (let i = stardustParticles.length - 1; i >= 0; i--) {
                const p = stardustParticles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= p.fade;

                if (p.alpha <= 0) {
                    stardustParticles.splice(i, 1);
                } else {
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                }
            }
            ctx.globalAlpha = 1;
            animationFrame = requestAnimationFrame(loop);
        };
        loop();

        // Trigger screen shake
        this.screenShake(200);

        // Cleanup after 8 seconds
        setTimeout(() => {
            container.style.opacity = '0';
            setTimeout(() => {
                cancelAnimationFrame(animationFrame);
                container.remove();
                this.cleanupEffect();
            }, 1000);
        }, 8000);
    },

    /**
     * ============================================
     * UTILITY FUNCTIONS
     * ============================================
     */

    /**
     * Create fullscreen effect container with fade-in animation.
     * Container has pointer-events: none to allow interaction below.
     *
     * @param {number} zIndex - Z-index for layering
     * @returns {HTMLElement} Container element
     */
    createEffectContainer(zIndex) {
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: ${zIndex};
            opacity: 0;
            transition: opacity 1s ease-in-out;
        `;
        document.body.appendChild(container);

        // Trigger fade-in animation
        requestAnimationFrame(() => {
            container.style.opacity = '1';
        });

        return container;
    },

    /**
     * Create screen shake effect by translating document body.
     * Random jitter in X and Y directions.
     *
     * @param {number} duration - How long to shake (ms)
     * @returns {void}
     */
    screenShake(duration) {
        const body = document.body;
        body.style.transition = 'transform 0.1s ease-in-out';
        let startTime = Date.now();

        /**
         * Recursive shake function.
         * Continues until duration expires.
         */
        const shake = () => {
            if (Date.now() - startTime < duration) {
                const x = (Math.random() - 0.5) * 10;
                const y = (Math.random() - 0.5) * 10;
                body.style.transform = `translate(${x}px, ${y}px)`;
                requestAnimationFrame(shake);
            } else {
                body.style.transform = 'translate(0, 0)';
            }
        };
        shake();
    },

    /**
     * Cleanup function for secret search system.
     * Removes event listener created in init().
     * Actual cleanup function is set during init().
     *
     * @returns {void}
     */
    cleanup() {
        // Cleanup is set in init()
    }
};
