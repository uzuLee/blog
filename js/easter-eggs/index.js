// Easter Eggs Module
// Manage all hidden easter eggs in the application

import { multiGame } from './multi-game.js';
import { secretSearch } from './active/secretSearch.js';
import { midnightVisitor } from './active/midnightVisitor.js'
import { secretHandshake } from './active/secretHandshake.js';
import { footerExplosion } from './active/footerExplosion.js';

// ============================================
// CONFIGURATION
// Enable or disable easter eggs here
// ============================================
const ENABLED_EASTER_EGGS = [
    multiGame,            // Multiple key combinations for different games!
    secretSearch,         // Type special phrases (thematrix, etc.)
    midnightVisitor,      // Midnight + "when the moon rises" in search
    secretHandshake,      // Secret click sequence (no progress shown!)
    footerExplosion,      // Scroll hard at the bottom to explode the footer!
]

// ============================================
// Easter Egg Manager
// ============================================
class EasterEggManager {
    constructor() {
        this.activeEggs = [];
    }

    /**
     * Initialize all enabled easter eggs
     */
    init() {
        console.log('🥚 Initializing Easter Eggs...');

        ENABLED_EASTER_EGGS.forEach(egg => {
            try {
                egg.init();
                this.activeEggs.push(egg);
                console.log(`  ✓ ${egg.name} initialized`);
            } catch (error) {
                console.error(`  ✗ Failed to initialize ${egg.name}:`, error);
            }
        });

        console.log(`🎉 ${this.activeEggs.length} Easter Egg(s) active`);
    }

    /**
     * Cleanup all active easter eggs
     */
    cleanup() {
        this.activeEggs.forEach(egg => {
            try {
                if (egg.cleanup) {
                    egg.cleanup();
                }
            } catch (error) {
                console.error(`Failed to cleanup ${egg.name}:`, error);
            }
        });

        this.activeEggs = [];
        console.log('Easter Eggs cleaned up');
    }

    /**
     * Get list of all available easter eggs
     */
    getAvailableEggs() {
        return ENABLED_EASTER_EGGS.map(egg => ({
            name: egg.name,
            description: egg.description,
            enabled: this.activeEggs.includes(egg)
        }));
    }
}

// Create singleton instance
const easterEggManager = new EasterEggManager();

// Export for use in app.js
export default easterEggManager;
