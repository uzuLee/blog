// Easter Eggs Module
// Manage all hidden easter eggs in the application

import { konamiCode } from './konamiCode.js';
import { secretSearch } from './secretSearch.js';
import { midnightVisitor } from './midnightVisitor.js'
import { secretHandshake } from './secretHandshake.js';

// ============================================
// CONFIGURATION
// Enable or disable easter eggs here
// ============================================
const ENABLED_EASTER_EGGS = [
    konamiCode,           // ↑↑↓↓←→←→BA sequence - Hardcore retro space shooter!
    secretSearch,         // Type special phrases (thematrix, etc.)
    midnightVisitor,      // Midnight + "when the moon rises" in search
    secretHandshake,      // Secret click sequence (no progress shown!)
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
