/**
 * ============================================
 * SECRET HANDSHAKE EASTER EGG
 * ============================================
 *
 * Activates when user clicks UI elements in a specific secret sequence.
 *
 * Features:
 * - Hidden sequence detection (no visual feedback)
 * - Multi-element click tracking
 * - Auto-reset on timeout or wrong click
 * - Mystical portal animation
 * - Swirling particle effect
 * - Orbiting symbols around message
 *
 * Secret Sequence:
 * 1. Logo (brand link)
 * 2. Settings button
 * 3. Logo
 * 4. Search input (focus)
 * 5. Logo
 *
 * Technical:
 * - Event listeners on multiple elements
 * - Rolling buffer with timeout
 * - Web Animations API for particles
 * - CSS custom properties for orbit animation
 * - No visual progress indicator (keeps it secret!)
 *
 * @module secretHandshake
 */

import { soundSystem } from '../soundSystem.js';

/**
 * ============================================
 * CONFIGURATION
 * ============================================
 */

/**
 * Required click sequence to activate easter egg.
 * Elements must be clicked/focused in this exact order.
 * @const {string[]}
 */
const REQUIRED_SEQUENCE = ['logo', 'settings', 'logo', 'search', 'logo'];

/**
 * Time before sequence resets (ms).
 * Prevents partial sequences from staying active forever.
 * @const {number}
 */
const RESET_DELAY = 3000;  // 3 seconds

/**
 * Portal animation configuration.
 * @const {Object}
 */
const PORTAL_CONFIG = {
    MAX_SIZE: 600,              // Maximum portal diameter (px)
    PARTICLE_COUNT: 50,         // Number of swirling particles
    PARTICLE_DELAY: 20,         // Delay between particle spawns (ms)
    ORBIT_SYMBOL_COUNT: 12,     // Number of orbiting symbols
    ORBIT_DISTANCE: 200         // Distance from center (px)
};

/**
 * Particle colors for portal effect.
 * @const {string[]}
 */
const PARTICLE_COLORS = ['#8a2be2', '#9370db', '#ba55d3', '#da70d6'];

/**
 * Symbols that orbit around message.
 * @const {string[]}
 */
const ORBIT_SYMBOLS = ['🔮', '✨', '🌟', '💫', '⭐'];

/**
 * ============================================
 * SECRET HANDSHAKE EASTER EGG OBJECT
 * ============================================
 */

/**
 * Secret handshake easter egg.
 * Detects specific click sequence on UI elements.
 *
 * @type {Object}
 * @property {string} name - Display name for this easter egg
 * @property {string} description - What this easter egg does
 * @property {string[]} clickSequence - Current sequence of clicks
 * @property {string[]} requiredSequence - Required sequence to activate
 * @property {number|null} sequenceTimeout - Timeout ID for sequence reset
 * @property {number} resetDelay - How long before sequence resets (ms)
 * @property {Function} init - Initialize click listeners
 * @property {Function} addToSequence - Add element to click sequence
 * @property {Function} checkSequence - Check if sequence matches
 * @property {Function} activate - Trigger portal animation
 * @property {Function} cleanup - Remove event listeners
 */
export const secretHandshake = {
    name: 'Secret Handshake',
    description: 'The secret handshake known only to insiders',

    clickSequence: [],
    requiredSequence: REQUIRED_SEQUENCE,
    sequenceTimeout: null,
    resetDelay: RESET_DELAY,

    /**
     * Initialize secret handshake easter egg.
     * Sets up click/focus listeners on key UI elements.
     *
     * How it works:
     * 1. Find logo, settings button, and search input
     * 2. Add click/focus event listeners
     * 3. Track sequence in rolling buffer
     * 4. Reset on timeout or wrong sequence
     * 5. Activate when sequence matches
     *
     * Important: NO visual feedback during sequence!
     * This keeps the secret truly secret.
     *
     * @returns {void}
     */
    init() {
        // Get UI elements
        const logo = document.querySelector('.brand-link');
        const settings = document.querySelector('#btn-settings');
        const search = document.querySelector('#command-input');

        if (!logo || !settings || !search) {
            console.warn('Secret Handshake: Required elements not found');
            return;
        }

        /**
         * Create click handler for specific element.
         * Prevents default for non-search elements.
         *
         * @param {string} elementName - Name of element ('logo', 'settings', 'search')
         * @returns {Function} Event handler function
         */
        const createClickHandler = (elementName) => (e) => {
            // Allow search input to function normally
            if (elementName !== 'search') {
                e.preventDefault();
            }

            this.addToSequence(elementName);
        };

        // Create handlers
        const logoHandler = createClickHandler('logo');
        const settingsHandler = createClickHandler('settings');
        const searchHandler = createClickHandler('search');

        // Register listeners
        logo.addEventListener('click', logoHandler);
        settings.addEventListener('click', settingsHandler);
        search.addEventListener('focus', searchHandler);  // Focus, not click

        // Store cleanup function
        this.cleanup = () => {
            logo.removeEventListener('click', logoHandler);
            settings.removeEventListener('click', settingsHandler);
            search.removeEventListener('focus', searchHandler);
            if (this.sequenceTimeout) {
                clearTimeout(this.sequenceTimeout);
            }
        };
    },

    /**
     * Add element to click sequence and check for match.
     *
     * How it works:
     * 1. Add element name to sequence array
     * 2. Keep only last N clicks (rolling buffer)
     * 3. Check if sequence matches required
     * 4. Activate if match, otherwise set timeout
     *
     * No visual feedback is given to keep sequence secret!
     *
     * @param {string} elementName - Name of clicked element
     * @returns {void}
     */
    addToSequence(elementName) {
        // Add to sequence
        this.clickSequence.push(elementName);

        // No visual feedback - keep it secret!

        // Trim to required length (rolling buffer)
        if (this.clickSequence.length > this.requiredSequence.length) {
            this.clickSequence.shift();
        }

        // Check for match
        if (this.checkSequence()) {
            this.activate();
            this.clickSequence = [];
            if (this.sequenceTimeout) {
                clearTimeout(this.sequenceTimeout);
            }
            return;
        }

        // Reset sequence after delay of inactivity
        if (this.sequenceTimeout) {
            clearTimeout(this.sequenceTimeout);
        }
        this.sequenceTimeout = setTimeout(() => {
            this.clickSequence = [];
        }, this.resetDelay);
    },

    /**
     * Check if current sequence matches required sequence.
     *
     * @returns {boolean} True if sequences match exactly
     */
    checkSequence() {
        // Must be exact length
        if (this.clickSequence.length !== this.requiredSequence.length) {
            return false;
        }

        // Check each element
        for (let i = 0; i < this.requiredSequence.length; i++) {
            if (this.clickSequence[i] !== this.requiredSequence[i]) {
                return false;
            }
        }

        return true;
    },

    /**
     * ============================================
     * ACTIVATE PORTAL ANIMATION
     * ============================================
     *
     * Create mystical portal effect:
     * 1. Expanding purple portal
     * 2. Swirling particles in spiral
     * 3. Secret message with gradient
     * 4. Orbiting symbols
     * 5. Fade out and cleanup
     *
     * @returns {void}
     */
    activate() {
        console.log('🤝 Secret handshake recognized!');
        soundSystem.powerUp();

        // ============================================
        // CREATE MYSTICAL PORTAL
        // ============================================

        /**
         * Portal element with radial gradient.
         * Starts at 0 size and expands to 600px.
         */
        const portal = document.createElement('div');
        portal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 0;
            height: 0;
            border-radius: 50%;
            background: radial-gradient(circle,
                rgba(138, 43, 226, 0.8) 0%,
                rgba(75, 0, 130, 0.6) 50%,
                rgba(0, 0, 0, 0) 100%);
            z-index: 999998;
            pointer-events: none;
            transition: all 2s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 0 100px rgba(138, 43, 226, 0.8),
                        inset 0 0 100px rgba(138, 43, 226, 0.5);
        `;
        document.body.appendChild(portal);

        // Expand portal with bounce easing
        setTimeout(() => {
            portal.style.width = PORTAL_CONFIG.MAX_SIZE + 'px';
            portal.style.height = PORTAL_CONFIG.MAX_SIZE + 'px';
        }, 100);

        // ============================================
        // SWIRLING PARTICLES
        // ============================================

        /**
         * Create particles that spiral out from center.
         * Each particle:
         * - Starts at center
         * - Moves to position on circle
         * - Returns to center
         * - Has staggered animation delay
         */
        const particles = [];
        for (let i = 0; i < PORTAL_CONFIG.PARTICLE_COUNT; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                const angle = (Math.PI * 2 * i) / PORTAL_CONFIG.PARTICLE_COUNT;
                const radius = 300;

                particle.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    width: 10px;
                    height: 10px;
                    background: ${PARTICLE_COLORS[i % PARTICLE_COLORS.length]};
                    border-radius: 50%;
                    z-index: 999999;
                    pointer-events: none;
                    box-shadow: 0 0 10px currentColor;
                `;
                document.body.appendChild(particle);
                particles.push(particle);

                // Calculate position on circle
                const startX = Math.cos(angle) * radius;
                const startY = Math.sin(angle) * radius;

                /**
                 * Particle animation:
                 * - Start: Center, invisible
                 * - Middle: Position on circle, visible
                 * - End: Back to center, invisible
                 */
                particle.animate([
                    {
                        transform: `translate(-50%, -50%)`,
                        opacity: 0
                    },
                    {
                        transform: `translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px)) scale(1)`,
                        opacity: 1,
                        offset: 0.5
                    },
                    {
                        transform: `translate(-50%, -50%) scale(0)`,
                        opacity: 0
                    }
                ], {
                    duration: 3000,
                    delay: i * PORTAL_CONFIG.PARTICLE_DELAY,
                    easing: 'ease-in-out'
                });

                setTimeout(() => particle.remove(), 3000 + i * PORTAL_CONFIG.PARTICLE_DELAY);
            }, i * PORTAL_CONFIG.PARTICLE_DELAY);
        }

        // ============================================
        // SECRET MESSAGE
        // ============================================

        setTimeout(() => {
            const message = document.createElement('div');
            message.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 50px 70px;
                border-radius: 30px;
                color: white;
                text-align: center;
                z-index: 99999999;
                box-shadow: 0 30px 90px rgba(0, 0, 0, 0.7);
                pointer-events: none;
                transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            `;
            message.innerHTML = `
                <div style="font-size: 60px; margin-bottom: 20px;">🤝</div>
                <div style="font-size: 36px; font-weight: bold; margin-bottom: 15px;">
                    SECRET HANDSHAKE
                </div>
                <div style="font-size: 20px; opacity: 0.9; line-height: 1.6;">
                    Welcome, insider.<br>
                    You've discovered the secret path.
                </div>
            `;
            document.body.appendChild(message);

            // Bounce in
            setTimeout(() => {
                message.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 100);

            // ============================================
            // ORBITING SYMBOLS
            // ============================================

            /**
             * Create symbols that orbit around message.
             * Uses CSS animation with custom properties for orbit.
             */
            for (let i = 0; i < PORTAL_CONFIG.ORBIT_SYMBOL_COUNT; i++) {
                setTimeout(() => {
                    const symbol = document.createElement('div');
                    const angle = (Math.PI * 2 * i) / PORTAL_CONFIG.ORBIT_SYMBOL_COUNT;

                    symbol.style.cssText = `
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        font-size: 32px;
                        z-index: 9999999;
                        pointer-events: none;
                        animation: secrethandshake-orbit 4s linear infinite;
                        animation-delay: ${i * 0.1}s;
                        --angle: ${angle}rad;
                        --distance: ${PORTAL_CONFIG.ORBIT_DISTANCE}px;
                    `;
                    symbol.textContent = ORBIT_SYMBOLS[i % ORBIT_SYMBOLS.length];
                    document.body.appendChild(symbol);

                    // Fade out after delay
                    setTimeout(() => {
                        symbol.style.transition = 'opacity 1s ease-out';
                        symbol.style.opacity = '0';
                        setTimeout(() => symbol.remove(), 1000);
                    }, 8000);
                }, i * 100);
            }

            /**
             * CSS orbit animation.
             * Uses CSS custom properties for angle and distance.
             * Rotates element while keeping symbol upright.
             */
            const orbitStyle = document.createElement('style');
            orbitStyle.textContent = `
                @keyframes secrethandshake-orbit {
                    from {
                        transform: translate(-50%, -50%)
                                   rotate(0deg)
                                   translateX(var(--distance))
                                   rotate(0deg);
                    }
                    to {
                        transform: translate(-50%, -50%)
                                   rotate(360deg)
                                   translateX(var(--distance))
                                   rotate(-360deg);
                    }
                }
            `;
            // Only add style once
            if (!document.querySelector('#secrethandshake-orbit-animation')) {
                orbitStyle.id = 'secrethandshake-orbit-animation';
                document.head.appendChild(orbitStyle);
            }

            // ============================================
            // FADE OUT EVERYTHING
            // ============================================

            setTimeout(() => {
                // Fade and spin message
                message.style.transition = 'opacity 2s ease-out, transform 2s ease-out';
                message.style.opacity = '0';
                message.style.transform = 'translate(-50%, -50%) scale(0) rotate(180deg)';

                // Shrink portal
                portal.style.transition = 'opacity 2s ease-out, width 2s ease-out, height 2s ease-out';
                portal.style.opacity = '0';
                portal.style.width = '0';
                portal.style.height = '0';

                // Cleanup
                setTimeout(() => {
                    message.remove();
                    portal.remove();
                }, 2000);
            }, 7000);
        }, 2000);
    },

    /**
     * Cleanup function for secret handshake.
     * Removes event listeners and clears timeout.
     * Actual cleanup function is set during init().
     *
     * @returns {void}
     */
    cleanup() {
        // Cleanup is set in init()
    }
};