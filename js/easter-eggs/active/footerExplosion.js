/**
 * ============================================
 * FOOTER EXPLOSION EASTER EGG
 * ============================================
 *
 * Destroys the footer with a spectacular explosion when user scrolls too much at the bottom.
 *
 * Features:
 * - Progressive warning system (shake intensity increases)
 * - Visual effects (color shift, brightness)
 * - Particle explosion with physics
 * - Explosion flash and shockwave
 * - Permanent footer destruction (until page refresh)
 *
 * Activation Sequence:
 * - 10 scrolls: Footer starts shaking
 * - 20 scrolls: Warning effects (color shift, brightness)
 * - 40 scrolls: Danger shake intensifies
 * - 50 scrolls: EXPLOSION! 💥
 *
 * Technical:
 * - Scroll detection at bottom of page
 * - Exponential intensity curve for gradual buildup
 * - Gravity physics for particles
 * - requestAnimationFrame for smooth animation
 *
 * @module footerExplosion
 */

import { soundSystem } from '../soundSystem.js';

/**
 * ============================================
 * CONFIGURATION
 * ============================================
 */

/**
 * Number of scroll attempts before different effects trigger.
 * @const {Object.<string, number>}
 */
const SCROLL_THRESHOLDS = {
    SHAKE_START: 10,      // When footer starts shaking
    WARNING_START: 20,    // When warning effects appear
    DANGER_START: 40,     // When shake intensifies
    EXPLOSION: 50         // When footer explodes
};

/**
 * Particle explosion configuration.
 * @const {Object}
 */
const EXPLOSION_CONFIG = {
    PARTICLE_COUNT: 150,              // Number of particles
    PARTICLE_SIZE_MIN: 5,             // Minimum particle size (px)
    PARTICLE_SIZE_MAX: 20,            // Maximum particle size (px)
    VELOCITY_X_MAX: 50,               // Maximum horizontal velocity
    VELOCITY_Y_MIN: -55,              // Minimum vertical velocity (upward)
    VELOCITY_Y_MAX: -15,              // Maximum vertical velocity (upward)
    GRAVITY: 0.8,                     // Gravity force
    FRICTION: 0.99,                   // Air friction multiplier
    ANIMATION_FRAMES: 180             // Max animation frames
};

/**
 * Particle color palette.
 * @const {string[]}
 */
const PARTICLE_COLORS = [
    '#e74c3c',  // Red
    '#f39c12',  // Orange
    '#3498db',  // Blue
    '#2ecc71',  // Green
    '#9b59b6',  // Purple
    '#1abc9c',  // Turquoise
    '#e67e22',  // Dark orange
    '#f1c40f'   // Yellow
];

/**
 * ============================================
 * FOOTER EXPLOSION EASTER EGG OBJECT
 * ============================================
 */

/**
 * Footer explosion easter egg.
 * Progressively destroys footer when user scrolls too much at bottom.
 *
 * @type {Object}
 * @property {string} name - Display name for this easter egg
 * @property {string} description - What this easter egg does
 * @property {Function} init - Initialize scroll detection
 * @property {Function} cleanup - Remove event listeners
 */
export const footerExplosion = {
    name: 'Footer Explosion',
    description: 'Keep scrolling at the bottom to break the footer!',

    /**
     * Initialize footer explosion easter egg.
     * Sets up scroll detection and progressive effects.
     *
     * How it works:
     * 1. Detect when user is at bottom of page
     * 2. Count scroll attempts while at bottom
     * 3. Progressively increase shake intensity
     * 4. Add warning visual effects
     * 5. Explode at threshold with particle physics
     *
     * @returns {void}
     */
    init() {
        const contentArea = document.getElementById('content-area');
        const footer = document.querySelector('.footer');

        if (!contentArea || !footer) return;

        // State tracking
        let scrollAttempts = 0;
        let shakeIntensity = 0;
        let isExploded = false;
        let shakeInterval = null;

        /**
         * Check if user is at the bottom of the page.
         * Includes 5px threshold for better detection.
         *
         * @returns {boolean} True if at bottom
         */
        const isAtBottom = () => {
            return contentArea.scrollTop + contentArea.clientHeight >= contentArea.scrollHeight - 5;
        };

        /**
         * Apply shake transform to footer.
         * Random X/Y translation and rotation based on intensity.
         *
         * @param {number} intensity - Shake intensity (0 = no shake, higher = more shake)
         * @returns {void}
         */
        const shakeFooter = (intensity) => {
            const x = (Math.random() - 0.5) * intensity;
            const y = (Math.random() - 0.5) * intensity;
            const rotate = (Math.random() - 0.5) * intensity * 0.3;
            footer.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg)`;
        };

        /**
         * ============================================
         * EXPLODE FOOTER
         * ============================================
         *
         * Create spectacular explosion effect with:
         * - Explosion flash (radial gradient)
         * - Shockwave ring (expanding circle)
         * - 150 particles with gravity physics
         * - Sound effect
         * - Permanent footer removal
         *
         * @returns {void}
         */
        const explodeFooter = () => {
            if (isExploded) return;
            isExploded = true;

            // Play explosion sound
            soundSystem.explosion();

            // Stop shake animation
            if (shakeInterval) clearInterval(shakeInterval);

            const rect = footer.getBoundingClientRect();
            const particles = [];

            // Hide original footer permanently
            footer.style.display = 'none';

            // ============================================
            // CREATE EFFECT CONTAINER
            // ============================================

            const container = document.createElement('div');
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10000;
            `;
            document.body.appendChild(container);

            // ============================================
            // EXPLOSION FLASH
            // ============================================

            /**
             * Bright radial gradient flash at explosion epicenter.
             * Fades out over 0.8s.
             */
            const flash = document.createElement('div');
            flash.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 400px;
                background: radial-gradient(ellipse at center bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 100, 0, 0.9) 20%, rgba(255, 0, 0, 0.6) 40%, transparent 80%);
                animation: flash-fade 0.8s ease-out forwards;
                pointer-events: none;
            `;
            container.appendChild(flash);

            // ============================================
            // SHOCKWAVE RING
            // ============================================

            /**
             * Expanding circular shockwave from explosion center.
             * Grows from 100px to 800px over 1s.
             */
            const shockwave = document.createElement('div');
            shockwave.style.cssText = `
                position: fixed;
                bottom: ${rect.top + rect.height / 2}px;
                left: 50%;
                transform: translateX(-50%);
                width: 100px;
                height: 100px;
                border: 3px solid rgba(255, 150, 0, 0.8);
                border-radius: 50%;
                animation: shockwave-expand 1s ease-out forwards;
                pointer-events: none;
            `;
            container.appendChild(shockwave);

            // ============================================
            // CREATE PARTICLES
            // ============================================

            /**
             * Generate explosion particles.
             * Each particle has random:
             * - Size (5-20px)
             * - Color (from palette)
             * - Velocity (outward burst)
             * - Rotation speed
             * - Shape (circle or square)
             */
            for (let i = 0; i < EXPLOSION_CONFIG.PARTICLE_COUNT; i++) {
                const particle = document.createElement('div');
                const size = Math.random() * (EXPLOSION_CONFIG.PARTICLE_SIZE_MAX - EXPLOSION_CONFIG.PARTICLE_SIZE_MIN) + EXPLOSION_CONFIG.PARTICLE_SIZE_MIN;

                // Spawn from center of footer
                const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * rect.width;
                const y = rect.top + rect.height / 2;

                const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];

                // Velocity: outward burst with upward bias
                const velocityX = (Math.random() - 0.5) * EXPLOSION_CONFIG.VELOCITY_X_MAX;
                const velocityY = -Math.random() * (EXPLOSION_CONFIG.VELOCITY_Y_MIN - EXPLOSION_CONFIG.VELOCITY_Y_MAX) + EXPLOSION_CONFIG.VELOCITY_Y_MAX;

                const rotation = Math.random() * 360;
                const rotationSpeed = (Math.random() - 0.5) * 30;

                particle.style.cssText = `
                    position: fixed;
                    left: ${x}px;
                    top: ${y}px;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                    transform: rotate(${rotation}deg);
                    box-shadow: 0 0 10px ${color};
                    pointer-events: none;
                `;

                // Store physics data in dataset
                particle.dataset.vx = velocityX;
                particle.dataset.vy = velocityY;
                particle.dataset.rotation = rotation;
                particle.dataset.rotationSpeed = rotationSpeed;

                particles.push(particle);
                container.appendChild(particle);
            }

            // ============================================
            // ANIMATION KEYFRAMES
            // ============================================

            const style = document.createElement('style');
            style.textContent = `
                /* Flash fade-out animation */
                @keyframes flash-fade {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }

                /* Shockwave expansion animation */
                @keyframes shockwave-expand {
                    0% {
                        width: 100px;
                        height: 100px;
                        opacity: 1;
                        border-width: 3px;
                    }
                    100% {
                        width: 800px;
                        height: 800px;
                        opacity: 0;
                        border-width: 0px;
                    }
                }
            `;
            document.head.appendChild(style);

            // ============================================
            // PARTICLE PHYSICS ANIMATION
            // ============================================

            let frame = 0;

            /**
             * Animate particles with gravity and friction.
             *
             * Physics:
             * - Gravity pulls particles down (+Y)
             * - Friction slows particles over time
             * - Rotation continues at constant speed
             * - Opacity fades based on frame count
             *
             * Cleanup:
             * - Stops after 180 frames or all particles off-screen
             * - Removes container and styles
             */
            const animate = () => {
                frame++;
                let allOffScreen = true;

                particles.forEach(particle => {
                    // Read current physics state
                    let vx = parseFloat(particle.dataset.vx);
                    let vy = parseFloat(particle.dataset.vy);
                    let rotation = parseFloat(particle.dataset.rotation);
                    const rotationSpeed = parseFloat(particle.dataset.rotationSpeed);

                    // Apply physics
                    vy += EXPLOSION_CONFIG.GRAVITY;    // Gravity
                    vx *= EXPLOSION_CONFIG.FRICTION;   // Air friction
                    vy *= EXPLOSION_CONFIG.FRICTION;
                    rotation += rotationSpeed;         // Rotation

                    // Update position
                    const x = parseFloat(particle.style.left) + vx;
                    const y = parseFloat(particle.style.top) + vy;

                    particle.style.left = x + 'px';
                    particle.style.top = y + 'px';
                    particle.style.transform = `rotate(${rotation}deg)`;
                    particle.style.opacity = Math.max(0, 1 - frame / 120);

                    // Save state
                    particle.dataset.vx = vx;
                    particle.dataset.vy = vy;
                    particle.dataset.rotation = rotation;

                    // Check if still on screen
                    if (y < window.innerHeight + 100) {
                        allOffScreen = false;
                    }
                });

                // Continue animation or cleanup
                if (frame < EXPLOSION_CONFIG.ANIMATION_FRAMES && !allOffScreen) {
                    requestAnimationFrame(animate);
                } else {
                    // Cleanup after animation completes
                    setTimeout(() => {
                        container.remove();
                        style.remove();
                    }, 500);
                }
            };

            animate();
        };

        /**
         * ============================================
         * WHEEL EVENT HANDLER
         * ============================================
         *
         * Detect scroll attempts and trigger progressive effects.
         *
         * Progression:
         * - 0-10 scrolls: No effect, reset if not at bottom
         * - 10+ scrolls: Footer starts shaking (exponential intensity)
         * - 20+ scrolls: Warning effects (color shift, brightness)
         * - 40+ scrolls: Danger shake (1.5x intensity multiplier)
         * - 50+ scrolls: EXPLOSION!
         *
         * @param {WheelEvent} e - Wheel event
         * @returns {void}
         */
        const handleWheel = (e) => {
            // Reset if not at bottom
            if (!isAtBottom()) {
                scrollAttempts = 0;
                shakeIntensity = 0;
                footer.style.transform = 'none';
                footer.style.filter = 'none';
                if (shakeInterval) {
                    clearInterval(shakeInterval);
                    shakeInterval = null;
                }
                return;
            }

            // At bottom and trying to scroll down
            if (e.deltaY > 0 && !isExploded) {
                scrollAttempts++;

                // Calculate shake intensity (exponential growth after 10 scrolls)
                if (scrollAttempts > SCROLL_THRESHOLDS.SHAKE_START) {
                    shakeIntensity = Math.pow((scrollAttempts - SCROLL_THRESHOLDS.SHAKE_START) / 5, 2) * 0.5;
                }

                // Start shaking interval
                if (!shakeInterval && scrollAttempts > SCROLL_THRESHOLDS.SHAKE_START) {
                    shakeInterval = setInterval(() => {
                        if (!isExploded) {
                            shakeFooter(shakeIntensity);
                        }
                    }, 50);
                }

                // Add warning visual effects
                if (scrollAttempts > SCROLL_THRESHOLDS.WARNING_START) {
                    const warningIntensity = (scrollAttempts - SCROLL_THRESHOLDS.WARNING_START) / 30;
                    footer.style.filter = `hue-rotate(${(scrollAttempts - SCROLL_THRESHOLDS.WARNING_START) * 15}deg) brightness(${1 + warningIntensity * 0.5}) saturate(${1 + warningIntensity})`;
                }

                // Danger level: intensify shake
                if (scrollAttempts > SCROLL_THRESHOLDS.DANGER_START) {
                    shakeIntensity = Math.min(shakeIntensity * 1.5, 30);
                }

                // EXPLOSION THRESHOLD
                if (scrollAttempts > SCROLL_THRESHOLDS.EXPLOSION) {
                    explodeFooter();
                }
            }
        };

        // Register scroll listener
        contentArea.addEventListener('wheel', handleWheel, { passive: true });

        console.log('🧨 Footer Explosion Easter Egg activated! Try scrolling hard at the bottom...');
    },

    /**
     * Cleanup function for footer explosion.
     * Event listener would be removed here if needed.
     *
     * @returns {void}
     */
    cleanup() {
        // Cleanup would go here if needed
    }
};