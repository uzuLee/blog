/**
 * ============================================
 * MIDNIGHT VISITOR EASTER EGG
 * ============================================
 *
 * A mystical nighttime animation that only appears during the witching hours.
 *
 * Features:
 * - Time-restricted activation (00:00-03:00)
 * - Once-per-day trigger
 * - Rising moon with realistic shadows
 * - Shooting stars with sound effects
 * - Interactive owl character
 * - Flying bats
 * - Mysterious message
 *
 * Activation:
 * - Time: Between midnight and 3 AM
 * - Keyword: "when the moon rises"
 * - Limit: Once per day (resets at 4 AM)
 *
 * Technical:
 * - CSS animations and transitions
 * - Web Animations API for shooting stars
 * - Event listeners for owl interaction
 * - Gradual fade-in/out effects
 *
 * @module midnightVisitor
 */

import { soundSystem } from '../soundSystem.js';

/**
 * ============================================
 * CONFIGURATION
 * ============================================
 */

/**
 * Time window configuration.
 * @const {Object}
 */
const TIME_CONFIG = {
    ACTIVATION_START: 0,     // Midnight (00:00)
    ACTIVATION_END: 3,       // 3 AM
    RESET_HOUR: 4           // Reset trigger flag at 4 AM
};

/**
 * Trigger keyword for activation.
 * Must be typed in search box during witching hours.
 * @const {string}
 */
const TRIGGER_KEYWORD = 'when the moon rises';

/**
 * Animation timing configuration (ms).
 * @const {Object}
 */
const TIMING = {
    DARKEN_DELAY: 100,          // When screen starts darkening
    MOON_APPEARS: 2000,         // When moon element is created
    MOON_RISES: 100,            // Delay before moon rises (after creation)
    STARS_START: 2000,          // When shooting stars begin
    STAR_INTERVAL: 800,         // Delay between each shooting star
    OWL_APPEARS: 4000,          // When owl appears
    BATS_START: 6000,           // When bats start flying
    BAT_INTERVAL: 1000,         // Delay between each bat
    MESSAGE_APPEARS: 8000,      // When message appears
    MESSAGE_DURATION: 8000,     // How long message stays
    FADEOUT_DURATION: 3000      // Fadeout animation duration
};

/**
 * ============================================
 * MIDNIGHT VISITOR EASTER EGG OBJECT
 * ============================================
 */

/**
 * Midnight visitor easter egg.
 * Mystical nighttime animation during witching hours.
 *
 * @type {Object}
 * @property {string} name - Display name for this easter egg
 * @property {string} description - What this easter egg does
 * @property {boolean} hasTriggeredToday - Tracks if already triggered today
 * @property {string} triggerKeyword - Search keyword to activate
 * @property {Function} init - Initialize search listener
 * @property {Function} activate - Trigger the midnight animation
 * @property {Function} createShootingStar - Create single shooting star
 * @property {Function} createOwl - Create interactive owl
 * @property {Function} createBat - Create flying bat
 * @property {Function} cleanup - Remove event listeners
 */
export const midnightVisitor = {
    name: 'Midnight Visitor',
    description: 'Something special happens during the witching hours...',

    hasTriggeredToday: false,
    triggerKeyword: TRIGGER_KEYWORD,

    /**
     * Initialize midnight visitor easter egg.
     * Monitors search input for trigger keyword during valid time window.
     *
     * How it works:
     * 1. Check current time (must be 00:00-03:00)
     * 2. Check if already triggered today
     * 3. Match keyword in search input
     * 4. Trigger animation once
     * 5. Reset flag at 4 AM
     *
     * @returns {void}
     */
    init() {
        const searchInput = document.getElementById('command-input');
        if (!searchInput) return;

        /**
         * Handle search input changes.
         * Checks time window and keyword match.
         *
         * @param {Event} e - Input event
         */
        const handleInput = (e) => {
            const value = e.target.value.trim().toLowerCase();
            const now = new Date();
            const hours = now.getHours();

            // Reset trigger at 4 AM
            if (hours === TIME_CONFIG.RESET_HOUR) {
                this.hasTriggeredToday = false;
            }

            // Only trigger during witching hours and once per day
            const isWithinTimeWindow = hours >= TIME_CONFIG.ACTIVATION_START && hours < TIME_CONFIG.ACTIVATION_END;
            const canTrigger = isWithinTimeWindow && !this.hasTriggeredToday && value === this.triggerKeyword;

            if (canTrigger) {
                this.hasTriggeredToday = true;
                this.activate();
                searchInput.value = ''; // Clear input
            }
        };

        searchInput.addEventListener('input', handleInput);
        this.cleanup = () => searchInput.removeEventListener('input', handleInput);
    },

    /**
     * ============================================
     * ACTIVATE MIDNIGHT ANIMATION
     * ============================================
     *
     * Create complete nighttime sequence:
     * 1. Darken screen gradually
     * 2. Moon rises from top
     * 3. Shooting stars streak across sky
     * 4. Owl appears and hoots
     * 5. Bats fly across screen
     * 6. Message appears
     * 7. Everything fades away
     *
     * @returns {void}
     */
    activate() {
        console.log('🌙 A midnight visitor appears...');
        soundSystem.victory();

        // ============================================
        // CREATE DARK OVERLAY
        // ============================================

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0);
            z-index: 999998;
            pointer-events: none;
            transition: background 3s ease-in;
        `;
        document.body.appendChild(overlay);

        // Darken screen gradually
        setTimeout(() => {
            overlay.style.background = 'rgba(0, 0, 20, 0.7)';
        }, TIMING.DARKEN_DELAY);

        // ============================================
        // MOON RISES
        // ============================================

        setTimeout(() => {
            /**
             * Create realistic moon with:
             * - Radial gradient (lighter at top-left)
             * - Inner shadow for craters
             * - Soft glow effect
             */
            const moon = document.createElement('div');
            moon.style.cssText = `
                position: fixed;
                top: -100px;
                right: 100px;
                width: 120px;
                height: 120px;
                background: radial-gradient(circle at 30% 30%, #fff, #ddd);
                border-radius: 50%;
                box-shadow: 0 0 60px rgba(255, 255, 255, 0.8),
                           inset -10px -10px 20px rgba(0, 0, 0, 0.2),
                           0 0 80px rgba(255, 255, 220, 0.3);
                z-index: 999999;
                transition: top 4s ease-out, opacity 3s ease-in-out;
                pointer-events: none;
            `;
            document.body.appendChild(moon);

            // Moon rises into view
            setTimeout(() => {
                moon.style.top = '80px';
            }, TIMING.MOON_RISES);

            // ============================================
            // SHOOTING STARS
            // ============================================

            setTimeout(() => {
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        this.createShootingStar();
                    }, i * TIMING.STAR_INTERVAL);
                }
            }, TIMING.STARS_START);

            // ============================================
            // OWL APPEARS
            // ============================================

            setTimeout(() => {
                this.createOwl();
            }, TIMING.OWL_APPEARS);

            // ============================================
            // BATS FLY ACROSS
            // ============================================

            setTimeout(() => {
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        this.createBat();
                    }, i * TIMING.BAT_INTERVAL);
                }
            }, TIMING.BATS_START);

            // ============================================
            // MYSTICAL MESSAGE
            // ============================================

            setTimeout(() => {
                const message = document.createElement('div');
                message.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(0);
                    background: rgba(20, 20, 40, 0.95);
                    border: 2px solid #8b7dd8;
                    border-radius: 20px;
                    padding: 40px 60px;
                    color: #d4c5f9;
                    font-size: 28px;
                    text-align: center;
                    z-index: 999999;
                    box-shadow: 0 0 40px rgba(139, 125, 216, 0.5);
                    pointer-events: none;
                    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                    font-family: 'Georgia', serif;
                `;
                message.innerHTML = `
                    🌙<br>
                    <div style="margin-top: 20px; font-size: 20px; line-height: 1.6;">
                        Good night, night owl...<br>
                        <span style="opacity: 0.7; font-size: 16px;">The stars shine brighter for those who seek them.</span>
                    </div>
                `;
                document.body.appendChild(message);

                // Bounce-in animation
                setTimeout(() => {
                    message.style.transform = 'translate(-50%, -50%) scale(1)';
                }, 100);

                // ============================================
                // FADE OUT EVERYTHING
                // ============================================

                setTimeout(() => {
                    message.style.transition = 'opacity 2s ease-out';
                    message.style.opacity = '0';
                    moon.style.opacity = '0';
                    overlay.style.transition = 'opacity 3s ease-out';
                    overlay.style.opacity = '0';

                    // Cleanup
                    setTimeout(() => {
                        message.remove();
                        moon.remove();
                        overlay.remove();
                    }, TIMING.FADEOUT_DURATION);
                }, TIMING.MESSAGE_DURATION);
            }, TIMING.MESSAGE_APPEARS);
        }, TIMING.MOON_APPEARS);
    },

    /**
     * Create a single shooting star.
     * Stars fall diagonally from top of screen with tail effect.
     *
     * Uses Web Animations API for smooth animation.
     * Random starting position, angle, and speed.
     *
     * @returns {void}
     */
    createShootingStar() {
        soundSystem.collect();

        const star = document.createElement('div');
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * 200;

        star.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            width: 2px;
            height: 2px;
            background: #fff;
            border-radius: 50%;
            box-shadow: 0 0 10px #fff, 0 0 20px #fff;
            z-index: 999999;
            pointer-events: none;
        `;
        document.body.appendChild(star);

        // Calculate trajectory (diagonal fall)
        const angle = Math.PI / 4;
        const distance = 300 + Math.random() * 200;
        const endX = startX - distance * Math.cos(angle);
        const endY = startY + distance * Math.sin(angle);

        /**
         * Animate star falling diagonally.
         * - Fades in quickly (10% keyframe)
         * - Falls with tail effect
         * - Fades out at end
         */
        star.animate([
            {
                transform: 'translateX(0) translateY(0)',
                opacity: 0
            },
            {
                opacity: 1,
                offset: 0.1  // Fade in quickly
            },
            {
                transform: `translateX(-${distance}px) translateY(${distance}px)`,
                opacity: 0
            }
        ], {
            duration: 800 + Math.random() * 500,
            easing: 'ease-out'
        });

        setTimeout(() => star.remove(), 1300);
    },

    /**
     * Create interactive owl that flies in, hoots, and flies away.
     *
     * Features:
     * - Flies in from right
     * - Hovers in place
     * - Scales on hover (blink effect)
     * - Shows "Hoot!" speech bubble
     * - Flies away after delay
     *
     * @returns {void}
     */
    createOwl() {
        const owl = document.createElement('div');
        owl.style.cssText = `
            position: fixed;
            top: 100px;
            right: -100px;
            font-size: 48px;
            z-index: 999999;
            pointer-events: auto;
            transition: right 3s ease-in-out;
            filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
            cursor: pointer;
        `;
        owl.textContent = '🦉';
        document.body.appendChild(owl);

        // Fly in
        setTimeout(() => {
            owl.style.right = '150px';
        }, 100);

        /**
         * Blink effect on hover.
         * Scales up briefly when mouse enters.
         */
        let hasBlinked = false;
        const blink = () => {
            if (hasBlinked) return;
            hasBlinked = true;
            owl.style.transform = 'scale(1.1)';
            setTimeout(() => owl.style.transform = 'scale(1)', 200);
        };

        owl.addEventListener('mouseenter', blink);

        // ============================================
        // HOOT SPEECH BUBBLE
        // ============================================

        setTimeout(() => {
            const hoot = document.createElement('div');
            hoot.style.cssText = `
                position: fixed;
                top: 90px;
                right: 100px;
                color: #fff;
                font-size: 20px;
                opacity: 0;
                z-index: 999999;
                pointer-events: none;
                transition: all 1s ease-out;
            `;
            hoot.textContent = 'Hoot!';
            document.body.appendChild(hoot);

            // Float up and fade in
            setTimeout(() => {
                hoot.style.opacity = '1';
                hoot.style.top = '70px';
            }, 100);

            // Fade out
            setTimeout(() => {
                hoot.style.opacity = '0';
                setTimeout(() => hoot.remove(), 1000);
            }, 2000);
        }, 3500);

        // ============================================
        // FLY AWAY
        // ============================================

        setTimeout(() => {
            owl.style.transition = 'right 2s ease-in, opacity 1s ease-out';
            owl.style.right = '-100px';
            owl.style.opacity = '0';
            setTimeout(() => {
                owl.removeEventListener('mouseenter', blink);
                owl.remove();
            }, 2000);
        }, 10000);
    },

    /**
     * Create bat that flies across screen.
     * Bats fly from right to left with slight wobble.
     *
     * @returns {void}
     */
    createBat() {
        const bat = document.createElement('div');
        const startY = 50 + Math.random() * 200;

        bat.style.cssText = `
            position: fixed;
            top: ${startY}px;
            right: -50px;
            font-size: 24px;
            z-index: 999999;
            pointer-events: none;
            transition: right 4s linear, transform 4s ease-in-out;
            filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));
        `;
        bat.textContent = '🦇';
        document.body.appendChild(bat);

        // Fly across screen
        setTimeout(() => {
            bat.style.right = `${window.innerWidth + 50}px`;
            bat.style.transform = `rotate(${Math.random() * 60 - 30}deg)`; // Slight wobble
        }, 100);

        setTimeout(() => bat.remove(), 4100);
    },

    /**
     * Cleanup function for midnight visitor.
     * Removes event listener created in init().
     * Actual cleanup function is set during init().
     *
     * @returns {void}
     */
    cleanup() {
        // Cleanup is set in init()
    }
};