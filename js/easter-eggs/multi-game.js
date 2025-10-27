/**
 * ============================================
 * MULTI-GAME SYSTEM
 * ============================================
 *
 * Comprehensive game menu and launcher system for retro arcade games.
 *
 * Features:
 * - Multiple key sequence detection (Konami codes)
 * - Visual game selection menu with grid layout
 * - Countdown animation before game start
 * - CRT screen effect overlay
 * - Volume control integration
 * - Font loading management (Press Start 2P)
 * - Smooth transitions and animations
 *
 * Architecture:
 * - Tracks key sequences in rolling buffer (max 10 keys)
 * - Matches sequences against registered game shortcuts
 * - Creates fullscreen overlay containers for games
 * - Provides exit callbacks for cleanup
 *
 * Activation:
 * - Original Konami Code (↑↑↓↓←→←→BA) opens main menu
 * - Individual game sequences launch games directly
 * - Click game cards in menu to launch
 *
 * @module multi-game
 */

import { GAMES } from './games/index.js';
import { soundSystem, createVolumeControl } from './soundSystem.js';
import { konamiCode } from './active/konamiCode.js';

/**
 * ============================================
 * CONFIGURATION
 * ============================================
 */

/**
 * Maximum number of keys to track in sequence buffer.
 * Prevents memory issues with long key sequences.
 * @const {number}
 */
const MAX_SEQUENCE_LENGTH = 10;

/**
 * Original Konami Code sequence for backward compatibility.
 * Opens the main game selection menu.
 * @const {string[]}
 */
const KONAMI_CODE = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
];

/**
 * ============================================
 * MULTI-GAME EASTER EGG OBJECT
 * ============================================
 */

/**
 * Multi-game system easter egg.
 * Manages game menu, key sequence detection, and game launching.
 *
 * @type {Object}
 * @property {string} name - Display name for this easter egg
 * @property {string} description - What this easter egg does
 * @property {Function} init - Initialize key sequence tracking
 * @property {Function} showGameMenu - Display the game selection menu
 * @property {Function} launchGame - Launch a specific game
 * @property {Function} showCountdown - Show 3-2-1-GO countdown
 * @property {Function} cleanup - Remove event listeners
 */
export const multiGame = {
    name: 'Multi-Game System',
    description: 'Multiple games activated by different key combinations',

    /**
     * Initialize the multi-game system.
     * Sets up key sequence tracking and detection.
     *
     * How it works:
     * 1. Tracks last 10 keys pressed in rolling buffer
     * 2. Checks if sequence matches Konami Code → opens menu
     * 3. Checks if sequence matches game shortcut → launches game
     * 4. Clears sequence buffer after successful match
     *
     * @returns {void}
     */
    init() {
        // Rolling buffer of recent key presses
        const sequences = [];

        /**
         * Build map of game sequences for quick lookup.
         * Format: "key1,key2,key3" → {id: "gameId", game: gameConfig}
         * Excludes menu-only games without direct shortcuts.
         * @type {Object.<string, {id: string, game: Object}>}
         */
        const gameSequences = {};
        Object.entries(GAMES).forEach(([id, game]) => {
            if (!game.menuOnly && game.keys) {
                gameSequences[game.keys.join(',')] = { id, game };
            }
        });

        /**
         * Handle keydown events for sequence detection.
         * Maintains rolling buffer and checks for matches.
         *
         * @param {KeyboardEvent} e - Keyboard event
         * @returns {void}
         */
        const handleKeydown = (e) => {
            const key = e.key;

            // Add to sequence buffer
            sequences.push(key);

            // Keep buffer at max length (FIFO - First In First Out)
            if (sequences.length > MAX_SEQUENCE_LENGTH) {
                sequences.shift();
            }

            // Check for original Konami code (opens menu)
            const recentKeys = sequences.slice(-KONAMI_CODE.length);
            if (recentKeys.join(',') === KONAMI_CODE.join(',')) {
                this.showGameMenu();
                sequences.length = 0; // Clear buffer
                return;
            }

            // Check for game-specific sequences
            const currentSequence = sequences.join(',');
            Object.entries(gameSequences).forEach(([seqStr, { id, game }]) => {
                if (currentSequence.endsWith(seqStr)) {
                    this.launchGame(id, game);
                    sequences.length = 0; // Clear buffer
                }
            });
        };

        // Register event listener
        document.addEventListener('keydown', handleKeydown);

        // Store cleanup function
        this.cleanup = () => document.removeEventListener('keydown', handleKeydown);
    },

    /**
     * Display the retro game selection menu.
     *
     * Creates a fullscreen overlay with:
     * - Animated title with glow effect
     * - Grid of game cards (responsive layout)
     * - Hover effects and sound feedback
     * - Volume control slider
     * - Press Start 2P font loading
     * - ESC to close functionality
     *
     * Styling:
     * - Dark gradient background
     * - Neon green (#0f0) theme
     * - Retro CRT aesthetic
     * - Smooth opacity transitions
     *
     * @returns {void}
     */
    showGameMenu() {
        console.log('🎮 Secret Game Menu activated!');
        soundSystem.victory();

        // ============================================
        // CREATE MENU CONTAINER
        // ============================================

        const menuContainer = document.createElement('div');
        menuContainer.id = 'game-menu';
        menuContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #000 0%, #1a1a2e 100%);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Courier New', monospace;
            opacity: 0;
            transition: opacity 0.3s ease-in;
        `;

        // ============================================
        // ANIMATED TITLE
        // ============================================

        const title = document.createElement('div');
        title.style.cssText = `
            color: #0f0;
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 40px;
            text-shadow: 0 0 20px #0f0;
            letter-spacing: 8px;
            animation: glow 2s ease-in-out infinite;
        `;
        title.textContent = '🎮 RETRO ARCADE 🎮';

        // ============================================
        // LOAD RETRO FONT & ANIMATIONS
        // ============================================

        const style = document.createElement('style');
        style.textContent = `
            /* Import Press Start 2P font from Google Fonts */
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

            /* Apply font to all menu elements */
            #game-menu, #game-menu * {
                font-family: 'Press Start 2P', 'Courier New', monospace !important;
            }

            /* Pulsing glow animation for title */
            @keyframes glow {
                0%, 100% { text-shadow: 0 0 20px #0f0, 0 0 30px #0f0; }
                50% { text-shadow: 0 0 30px #0f0, 0 0 50px #0f0, 0 0 70px #0f0; }
            }

            /* Scale pulse animation (unused but available) */
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            @keyframes marquee {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }

            .marquee {
                white-space: nowrap;
                overflow: hidden;
                position: relative;
                animation: marquee 10s linear infinite;
            }
        `;
        document.head.appendChild(style);

        /**
         * Preload Press Start 2P font asynchronously.
         * Ensures text renders correctly before display.
         * Falls back gracefully if loading fails.
         */
        if (document.fonts) {
            document.fonts.load('12px "Press Start 2P"').then(() => {
                console.log('✓ Press Start 2P font loaded');
            }).catch(err => {
                console.warn('Font loading failed, using fallback:', err);
            });
        }

        // ============================================
        // GAME GRID
        // ============================================

        /**
         * Responsive grid container for game cards.
         * Auto-fits columns based on screen width.
         * Minimum card width: 300px
         */
        const gameGrid = document.createElement('div');
        gameGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1200px;
            padding: 20px;
        `;

        /**
         * Create individual game cards for each registered game.
         * Each card includes:
         * - Game name with emoji
         * - Description (3-line max with ellipsis)
         * - Hover effects (glow, scale, sound)
         * - Click to launch
         */
        Object.entries(GAMES).forEach(([id, game]) => {
            const gameCard = document.createElement('div');
            gameCard.style.cssText = `
                background: rgba(0, 255, 0, 0.1);
                border: 2px solid #0f0;
                border-radius: 10px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
                height: 180px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            `;

            /**
             * Card HTML structure:
             * - Name (24px, top section)
             * - Description (14px, 3-line clamp, middle)
             * - "Click to play" hint (12px, bottom)
             */
            gameCard.innerHTML = `
                <div>
                    <div style="font-size: 24px; margin-bottom: 10px; color: #0f0; word-break: break-word;">${game.name}</div>
                    <div class="game-description" style="font-size: 14px; color: #0a0; margin-bottom: 15px; height: 60px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; word-wrap: break-word; line-height: 1.4;" title="${game.description}">${game.description}</div>
                </div>
                <div style="font-size: 12px; color: #0f0; opacity: 0.7;">Click to play</div>
            `;

            /**
             * Hover effect: Brighten, scale, glow, play sound
             */
            gameCard.addEventListener('mouseenter', () => {
                gameCard.style.background = 'rgba(0, 255, 0, 0.2)';
                gameCard.style.transform = 'scale(1.05)';
                gameCard.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.6)';
                soundSystem.select();
            });

            /**
             * Mouse leave: Reset to default state
             */
            gameCard.addEventListener('mouseleave', () => {
                gameCard.style.background = 'rgba(0, 255, 0, 0.1)';
                gameCard.style.transform = 'scale(1)';
                gameCard.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
            });

            /**
             * Click handler: Launch game or special case for Space Defender
             * Space Defender uses legacy konamiCode.activate() for compatibility
             */
            gameCard.addEventListener('click', () => {
                soundSystem.select();
                this.launchGame(id, game, menuContainer);
            });

            gameGrid.appendChild(gameCard);

            setTimeout(() => {
                const descriptionEl = gameCard.querySelector('.game-description');
                if (descriptionEl.scrollWidth > descriptionEl.clientWidth) {
                    descriptionEl.classList.add('marquee');
                }
            }, 100);
        });

        // ============================================
        // INSTRUCTIONS
        // ============================================

        const instructions = document.createElement('div');
        instructions.style.cssText = `
            color: #0f0;
            font-size: 14px;
            margin-top: 30px;
            text-shadow: 0 0 8px #0f0;
            opacity: 0.8;
        `;
        instructions.innerHTML = `
            Press ESC to close<br>
            <span style="font-size: 11px; opacity: 0.6;">Hint: Try different key combinations to launch games directly!</span>
        `;

        // ============================================
        // ASSEMBLE MENU
        // ============================================

        menuContainer.appendChild(title);
        menuContainer.appendChild(gameGrid);
        menuContainer.appendChild(instructions);
        document.body.appendChild(menuContainer);

        // Add volume control slider
        createVolumeControl(menuContainer);

        // Fade in animation
        setTimeout(() => menuContainer.style.opacity = '1', 10);

        // ============================================
        // ESC KEY HANDLER
        // ============================================

        /**
         * Close menu when ESC is pressed.
         * Fades out then removes from DOM.
         *
         * @param {KeyboardEvent} e - Keyboard event
         */
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                menuContainer.style.opacity = '0';
                setTimeout(() => menuContainer.remove(), 300);
                document.removeEventListener('keydown', handleEscape);
            }
        };

        document.addEventListener('keydown', handleEscape);
    },

    /**
     * Launch a specific game with full retro styling.
     *
     * Creates fullscreen game container with:
     * - CRT scanline overlay effect
     * - Pixelated canvas rendering
     * - Game title header
     * - Volume control
     * - 3-2-1-GO countdown animation
     * - Exit callback for cleanup
     *
     * Flow:
     * 1. Close menu if provided
     * 2. Create game container with CRT effect
     * 3. Load Press Start 2P font
     * 4. Create 800x600 canvas
     * 5. Show countdown (3-2-1-GO)
     * 6. Initialize game instance
     * 7. Provide exit callback
     *
     * @param {string} gameId - Unique game identifier
     * @param {Object} gameConfig - Game configuration object
     * @param {string} gameConfig.name - Display name of the game
     * @param {Function} gameConfig.create - Factory function to create game instance
     * @param {HTMLElement} [menuToClose=null] - Menu element to close before launching
     * @returns {void}
     */
    launchGame(gameId, gameConfig, menuToClose = null) {
        console.log(`🎮 Launching ${gameConfig.name}...`);

        // Close menu if it exists
        if (menuToClose) {
            menuToClose.style.opacity = '0';
            setTimeout(() => menuToClose.remove(), 300);
        }

        // ============================================
        // CREATE GAME CONTAINER
        // ============================================

        const gameContainer = document.createElement('div');
        gameContainer.id = 'retro-game';
        gameContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Courier New', monospace;
            opacity: 0;
            transition: opacity 0.5s ease-in;
        `;

        // ============================================
        // CRT SCANLINE OVERLAY
        // ============================================

        /**
         * Creates authentic CRT monitor effect with:
         * - Horizontal scanlines (2px repeating)
         * - Subtle flicker animation
         * - Transparent green overlay
         * - Pointer events disabled (doesn't block clicks)
         */
        const crtOverlay = document.createElement('div');
        crtOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(0deg, rgba(0, 255, 0, 0.03), rgba(0, 255, 0, 0.03) 1px, transparent 1px, transparent 2px);
            pointer-events: none;
            z-index: 999999;
            animation: crt-flicker 0.15s infinite;
        `;

        // ============================================
        // LOAD FONT & DEFINE ANIMATIONS
        // ============================================

        const style = document.createElement('style');
        style.textContent = `
            /* Import retro font */
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

            /* CRT flicker animation */
            @keyframes crt-flicker {
                0% { opacity: 0.97; }
                50% { opacity: 1; }
                100% { opacity: 0.97; }
            }

            /* Apply font to game container */
            #retro-game, #retro-game * {
                font-family: 'Press Start 2P', 'Courier New', monospace !important;
            }

            /* Pixelated rendering for retro look */
            #retro-game canvas {
                image-rendering: pixelated;
                image-rendering: crisp-edges;
            }
        `;
        document.head.appendChild(style);

        /**
         * Ensure font is fully loaded before displaying.
         * Prevents text rendering issues during countdown.
         */
        if (document.fonts) {
            document.fonts.ready.then(() => {
                console.log('✓ All fonts loaded and ready');
            });
        }

        // ============================================
        // GAME CANVAS
        // ============================================

        /**
         * Standard game canvas: 800x600 pixels
         * - Pixelated rendering (no antialiasing)
         * - Neon green border with glow
         */
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.cssText = `
            border: 4px solid #0f0;
            box-shadow: 0 0 30px #0f0;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
        `;

        // ============================================
        // GAME TITLE
        // ============================================

        const title = document.createElement('div');
        title.style.cssText = `
            color: #0f0;
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 15px;
            text-shadow: 0 0 15px #0f0, 0 0 30px #0f0;
            letter-spacing: 6px;
            text-transform: uppercase;
        `;
        title.textContent = gameConfig.name;

        // ============================================
        // ASSEMBLE GAME SCREEN
        // ============================================

        gameContainer.appendChild(crtOverlay);
        gameContainer.appendChild(title);
        gameContainer.appendChild(canvas);
        document.body.appendChild(gameContainer);

        // Add volume control
        createVolumeControl(gameContainer);

        // Fade in animation
        setTimeout(() => gameContainer.style.opacity = '1', 10);

        // ============================================
        // COUNTDOWN & LAUNCH
        // ============================================

        /**
         * Show 3-2-1-GO countdown, then initialize game.
         * Game instance receives:
         * - gameContainer: Fullscreen container
         * - canvas: Drawing surface
         * - exitCallback: Function to call on game exit
         */
        this.showCountdown(canvas, () => {
            // Launch the game
            const gameInstance = gameConfig.create(gameContainer, canvas, () => {
                // Exit callback - cleanup and remove
                gameContainer.style.opacity = '0';
                setTimeout(() => {
                    gameInstance.cleanup();
                    gameContainer.remove();
                }, 300);
            });
        });
    },

    /**
     * Display 3-2-1-GO countdown animation.
     *
     * Countdown sequence:
     * - 3 → 2 → 1 (large green numbers, select sound)
     * - GO! (large yellow text, power-up sound)
     * - Execute callback after "GO!"
     *
     * Uses Press Start 2P font for authentic retro look.
     * Each number displays for 1 second.
     *
     * @param {HTMLCanvasElement} canvas - Canvas to draw countdown on
     * @param {Function} onComplete - Callback to execute after countdown
     * @returns {void}
     */
    showCountdown(canvas, onComplete) {
        const ctx = canvas.getContext('2d');
        let count = 3; // Start at 3

        /**
         * Draw current countdown number or "GO!" on canvas.
         * Clears canvas each frame and centers text.
         */
        function drawCountdown() {
            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (count > 0) {
                // Draw number (3, 2, or 1)
                ctx.fillStyle = '#0f0';
                ctx.font = 'bold 120px "Press Start 2P", "Courier New"';
                ctx.fillText(count.toString(), canvas.width / 2, canvas.height / 2);
                soundSystem.select();
            } else {
                // Draw "GO!"
                ctx.fillStyle = '#ff0';
                ctx.font = 'bold 60px "Press Start 2P", "Courier New"';
                ctx.fillText('GO!', canvas.width / 2, canvas.height / 2);
                soundSystem.powerUp();
            }
        }

        /**
         * Countdown interval timer.
         * Updates every 1 second (1000ms).
         * Completes after "GO!" displays for 500ms.
         */
        const interval = setInterval(() => {
            drawCountdown();

            if (count === 0) {
                // Countdown finished
                clearInterval(interval);
                setTimeout(onComplete, 500); // Short delay after "GO!"
            }
            count--;
        }, 1000);

        // Draw initial "3"
        drawCountdown();
    },

    /**
     * Cleanup function for multi-game system.
     * Removes key event listener created in init().
     * Actual cleanup function is set during init().
     *
     * @returns {void}
     */
    cleanup() {
        // Cleanup handled by init() - this is a placeholder
        // The actual cleanup function is assigned in init()
    }
};
