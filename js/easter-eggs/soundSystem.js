/**
 * ============================================
 * RETRO GAME SOUND SYSTEM
 * ============================================
 *
 * 8-bit style sound effects using Web Audio API.
 * Provides a comprehensive set of retro game sounds with volume control.
 *
 * Features:
 * - Multiple oscillator types (sine, square, triangle, sawtooth)
 * - Frequency ramping for dynamic sound effects
 * - Volume control with master volume setting
 * - Enable/disable toggle
 * - Singleton pattern for global access
 *
 * Audio Specifications:
 * - Sample Rate: Browser default (usually 48kHz)
 * - Default Volume: 0.3 (30%)
 * - Sound Duration: 0.03s - 0.5s depending on effect
 *
 * @class SoundSystem
 */

// ============================================
// CONSTANTS
// ============================================

/** @const {number} Default master volume (0.0 - 1.0) */
const DEFAULT_MASTER_VOLUME = 0.3;

/** @const {Object} Sound effect configurations */
const SOUND_CONFIGS = {
    shoot: {
        type: 'square',
        startFreq: 200,
        endFreq: 50,
        duration: 0.1,
        volume: 0.1,
        description: 'Laser shot sound - descending pitch'
    },
    explosion: {
        type: 'sawtooth',
        startFreq: 100,
        endFreq: 20,
        duration: 0.3,
        volume: 0.2,
        description: 'Explosion rumble - low descending noise'
    },
    powerUp: {
        type: 'sine',
        startFreq: 200,
        endFreq: 800,
        duration: 0.2,
        volume: 0.15,
        description: 'Power-up collect - ascending pitch'
    },
    hit: {
        type: 'triangle',
        startFreq: 150,
        endFreq: 50,
        duration: 0.15,
        volume: 0.2,
        description: 'Damage/impact sound'
    },
    jump: {
        type: 'sine',
        startFreq: 300,
        endFreq: 150,
        duration: 0.1,
        volume: 0.12,
        description: 'Jump/flap sound'
    },
    gameOver: {
        type: 'square',
        oscillators: 2,
        startFreqs: [200, 150],
        endFreqs: [50, 40],
        duration: 0.5,
        volume: 0.15,
        description: 'Sad descending dual-tone'
    },
    victory: {
        type: 'sine',
        notes: [261.63, 329.63, 392, 523.25], // C4, E4, G4, C5
        noteDuration: 0.2,
        noteGap: 0.15,
        volume: 0.1,
        description: 'Victory melody (C major arpeggio)'
    },
    bounce: {
        type: 'sine',
        frequency: 150,
        duration: 0.05,
        volume: 0.1,
        description: 'Quick collision blip'
    },
    collect: {
        type: 'sine',
        startFreq: 400,
        endFreq: 600,
        duration: 0.08,
        volume: 0.08,
        description: 'Item collection - ascending'
    },
    select: {
        type: 'sine',
        frequency: 600,
        duration: 0.05,
        volume: 0.1,
        description: 'Menu selection beep'
    },
    rotate: {
        type: 'square',
        frequency: 250,
        duration: 0.03,
        volume: 0.05,
        description: 'Subtle rotation/move sound'
    },
    lineClear: {
        type: 'sine',
        startFreq: 500,
        endFreq: 800,
        duration: 0.15,
        volume: 0.12,
        description: 'Line clear in Tetris'
    }
};

// ============================================
// SOUND SYSTEM CLASS
// ============================================

class SoundSystem {
    /**
     * Creates a new SoundSystem instance.
     * Initializes Web Audio API context and sets default values.
     */
    constructor() {
        /** @type {AudioContext|null} Web Audio API context */
        this.audioContext = null;

        /** @type {number} Master volume (0.0 - 1.0) */
        this.masterVolume = DEFAULT_MASTER_VOLUME;

        /** @type {boolean} Whether sound is enabled */
        this.enabled = true;

        // Initialize audio context
        this.init();
    }

    /**
     * Initialize Web Audio API context.
     * Falls back gracefully if Web Audio API is not supported.
     *
     * @private
     */
    init() {
        try {
            // Try modern AudioContext, fallback to webkit prefix
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Sound System initialized');
        } catch (e) {
            console.warn('⚠️ Web Audio API not supported - sounds disabled');
            this.enabled = false;
        }
    }

    /**
     * Set master volume for all sounds.
     *
     * @param {number} volume - Volume level (0.0 - 1.0)
     */
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Get current master volume.
     *
     * @returns {number} Current volume (0.0 - 1.0)
     */
    getVolume() {
        return this.masterVolume;
    }

    /**
     * Enable or disable all sounds.
     *
     * @param {boolean} enabled - Whether to enable sounds
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Create an oscillator node with specified frequency and waveform.
     *
     * @private
     * @param {number} frequency - Frequency in Hz
     * @param {string} type - Waveform type: 'sine', 'square', 'triangle', 'sawtooth'
     * @returns {OscillatorNode|null} Configured oscillator or null if disabled
     */
    createOscillator(frequency, type = 'square') {
        if (!this.enabled || !this.audioContext) return null;

        const oscillator = this.audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        return oscillator;
    }

    /**
     * Create a gain node for volume control.
     * Automatically applies master volume.
     *
     * @private
     * @param {number} initialValue - Initial gain value (0.0 - 1.0)
     * @returns {GainNode|null} Configured gain node or null if disabled
     */
    createGain(initialValue = 1) {
        if (!this.enabled || !this.audioContext) return null;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = initialValue * this.masterVolume;
        return gainNode;
    }

    // ============================================
    // SOUND EFFECTS
    // ============================================

    /**
     * Play shoot/laser sound effect.
     * Descending pitch from 200Hz to 50Hz.
     * Used for: Player shooting, enemy shooting
     */
    shoot() {
        if (!this.enabled || !this.audioContext) return;

        const config = SOUND_CONFIGS.shoot;
        const oscillator = this.createOscillator(config.startFreq, config.type);
        const gainNode = this.createGain(config.volume);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        // Descending pitch creates "pew pew" laser effect
        oscillator.frequency.setValueAtTime(config.startFreq, now);
        oscillator.frequency.exponentialRampToValueAtTime(config.endFreq, now + config.duration);

        oscillator.start(now);
        oscillator.stop(now + config.duration);
    }

    /**
     * Play explosion sound effect.
     * Low rumbling descending noise.
     * Used for: Explosions, enemy destruction, collisions
     */
    explosion() {
        if (!this.enabled || !this.audioContext) return;

        const config = SOUND_CONFIGS.explosion;
        const oscillator = this.createOscillator(config.startFreq, config.type);
        const gainNode = this.createGain(config.volume);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        // Low rumbling with volume fade creates explosion effect
        oscillator.frequency.setValueAtTime(config.startFreq, now);
        oscillator.frequency.exponentialRampToValueAtTime(config.endFreq, now + config.duration);

        // Volume fade out
        gainNode.gain.setValueAtTime(config.volume * this.masterVolume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);

        oscillator.start(now);
        oscillator.stop(now + config.duration);
    }

    /**
     * Play power-up collect sound effect.
     * Ascending pitch for positive feedback.
     * Used for: Collecting power-ups, gaining abilities
     */
    powerUp() {
        if (!this.enabled || !this.audioContext) return;

        const config = SOUND_CONFIGS.powerUp;
        const oscillator = this.createOscillator(config.startFreq, config.type);
        const gainNode = this.createGain(config.volume);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        // Rising pitch creates satisfying collect sound
        oscillator.frequency.setValueAtTime(config.startFreq, now);
        oscillator.frequency.exponentialRampToValueAtTime(config.endFreq, now + config.duration);

        oscillator.start(now);
        oscillator.stop(now + config.duration);
    }

    /**
     * Play hit/damage sound effect.
     * Short harsh sound for negative feedback.
     * Used for: Taking damage, collisions
     */
    hit() {
        if (!this.enabled || !this.audioContext) return;

        const config = SOUND_CONFIGS.hit;
        const oscillator = this.createOscillator(config.startFreq, config.type);
        const gainNode = this.createGain(config.volume);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        // Quick descending pitch for impact
        oscillator.frequency.setValueAtTime(config.startFreq, now);
        oscillator.frequency.exponentialRampToValueAtTime(config.endFreq, now + config.duration);

        oscillator.start(now);
        oscillator.stop(now + config.duration);
    }

    /**
     * Play jump/flap sound effect.
     * Quick ascending then descending pitch.
     * Used for: Jumping, flapping wings
     */
    jump() {
        if (!this.enabled || !this.audioContext) return;

        const config = SOUND_CONFIGS.jump;
        const oscillator = this.createOscillator(config.startFreq, config.type);
        const gainNode = this.createGain(config.volume);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        // Descending pitch for jump arc
        oscillator.frequency.setValueAtTime(config.startFreq, now);
        oscillator.frequency.exponentialRampToValueAtTime(config.endFreq, now + config.duration);

        oscillator.start(now);
        oscillator.stop(now + config.duration);
    }

    /**
     * Play game over sound effect.
     * Sad dual-tone descending melody.
     * Used for: Defeat, death, game over
     */
    gameOver() {
        if (!this.enabled || !this.audioContext) return;

        const config = SOUND_CONFIGS.gameOver;

        // Create two oscillators for dissonant chord
        const oscillator1 = this.createOscillator(config.startFreqs[0], config.type);
        const oscillator2 = this.createOscillator(config.startFreqs[1], config.type);
        const gainNode = this.createGain(config.volume);

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        // Both oscillators descend creating sad dissonance
        oscillator1.frequency.setValueAtTime(config.startFreqs[0], now);
        oscillator1.frequency.exponentialRampToValueAtTime(config.endFreqs[0], now + config.duration);

        oscillator2.frequency.setValueAtTime(config.startFreqs[1], now);
        oscillator2.frequency.exponentialRampToValueAtTime(config.endFreqs[1], now + config.duration);

        // Fade out volume
        gainNode.gain.setValueAtTime(config.volume * this.masterVolume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);

        oscillator1.start(now);
        oscillator2.start(now);
        oscillator1.stop(now + config.duration);
        oscillator2.stop(now + config.duration);
    }

    /**
     * Play victory sound effect.
     * Ascending melodic arpeggio (C-E-G-C).
     * Used for: Winning, level complete, success
     */
    victory() {
        if (!this.enabled || !this.audioContext) return;

        const config = SOUND_CONFIGS.victory;
        const now = this.audioContext.currentTime;

        // Play C major arpeggio (C4-E4-G4-C5)
        config.notes.forEach((freq, i) => {
            const oscillator = this.createOscillator(freq, config.type);
            const gainNode = this.createGain(config.volume);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Stagger notes for melody effect
            const startTime = now + (i * config.noteGap);
            oscillator.start(startTime);
            oscillator.stop(startTime + config.noteDuration);
        });
    }

    /**
     * Play bounce/collision sound effect.
     * Very short beep for physical collisions.
     * Used for: Ball bouncing, paddle hits, wall collisions
     */
    bounce() {
        if (!this.enabled || !this.audioContext) return;

        const config = SOUND_CONFIGS.bounce;
        const oscillator = this.createOscillator(config.frequency, config.type);
        const gainNode = this.createGain(config.volume);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        // Very short blip
        oscillator.start(now);
        oscillator.stop(now + config.duration);
    }

    /**
     * Play collect/eat sound effect.
     * Quick ascending chirp for item collection.
     * Used for: Eating pellets, collecting coins, picking up items
     */
    collect() {
        if (!this.enabled || !this.audioContext) return;

        const config = SOUND_CONFIGS.collect;
        const oscillator = this.createOscillator(config.startFreq, config.type);
        const gainNode = this.createGain(config.volume);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        // Quick ascending chirp
        oscillator.frequency.setValueAtTime(config.startFreq, now);
        oscillator.frequency.exponentialRampToValueAtTime(config.endFreq, now + config.duration);

        oscillator.start(now);
        oscillator.stop(now + config.duration);
    }

    /**
     * Play menu selection sound effect.
     * Quick high-pitched beep for UI feedback.
     * Used for: Menu navigation, button clicks
     */
    select() {
        if (!this.enabled || !this.audioContext) return;

        const config = SOUND_CONFIGS.select;
        const oscillator = this.createOscillator(config.frequency, config.type);
        const gainNode = this.createGain(config.volume);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        // Quick blip
        oscillator.start(now);
        oscillator.stop(now + config.duration);
    }

    /**
     * Play rotate/move sound effect.
     * Very subtle blip for piece movement.
     * Used for: Tetris piece rotation, movement
     */
    rotate() {
        if (!this.enabled || !this.audioContext) return;

        const config = SOUND_CONFIGS.rotate;
        const oscillator = this.createOscillator(config.frequency, config.type);
        const gainNode = this.createGain(config.volume);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        // Very short, subtle blip
        oscillator.start(now);
        oscillator.stop(now + config.duration);
    }

    /**
     * Play line clear sound effect.
     * Satisfying ascending tone for completing a line.
     * Used for: Tetris line clears
     */
    lineClear() {
        if (!this.enabled || !this.audioContext) return;

        const config = SOUND_CONFIGS.lineClear;
        const oscillator = this.createOscillator(config.startFreq, config.type);
        const gainNode = this.createGain(config.volume);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        // Ascending pitch for satisfaction
        oscillator.frequency.setValueAtTime(config.startFreq, now);
        oscillator.frequency.exponentialRampToValueAtTime(config.endFreq, now + config.duration);

        oscillator.start(now);
        oscillator.stop(now + config.duration);
    }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

/**
 * Global sound system instance.
 * Import this to play sounds from anywhere in the application.
 *
 * @example
 * import { soundSystem } from './soundSystem.js';
 * soundSystem.shoot();
 * soundSystem.setVolume(0.5);
 */
export const soundSystem = new SoundSystem();

// ============================================
// VOLUME CONTROL UI
// ============================================

/**
 * Create a volume control UI component.
 * Includes mute button, volume slider, and percentage display.
 *
 * @param {HTMLElement} container - Parent element to append control to
 * @returns {HTMLElement} The volume control element
 *
 * @example
 * const volumeControl = createVolumeControl(document.body);
 */
export function createVolumeControl(container) {
    // Main container
    const volumeContainer = document.createElement('div');
    volumeContainer.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px 15px;
        border-radius: 8px;
        border: 1px solid #0f0;
        z-index: 1000;
    `;

    // Mute/unmute button
    const muteBtn = document.createElement('button');
    muteBtn.textContent = soundSystem.enabled ? '🔊' : '🔇';
    muteBtn.title = 'Toggle sound';
    muteBtn.style.cssText = `
        background: transparent;
        border: none;
        color: #0f0;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
    `;

    muteBtn.addEventListener('click', () => {
        soundSystem.setEnabled(!soundSystem.enabled);
        muteBtn.textContent = soundSystem.enabled ? '🔊' : '🔇';
        soundSystem.select(); // Play feedback sound
    });

    // Volume slider
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = '0';
    volumeSlider.max = '100';
    volumeSlider.value = soundSystem.getVolume() * 100;
    volumeSlider.title = 'Volume';
    volumeSlider.style.cssText = `
        width: 100px;
        accent-color: #0f0;
        cursor: pointer;
    `;

    // Volume percentage label
    const volumeLabel = document.createElement('span');
    volumeLabel.style.cssText = `
        color: #0f0;
        font-size: 12px;
        font-family: 'Courier New', monospace;
        min-width: 35px;
        text-align: right;
    `;
    volumeLabel.textContent = `${Math.round(soundSystem.getVolume() * 100)}%`;

    // Update volume and label on slider change
    volumeSlider.addEventListener('input', (e) => {
        const vol = e.target.value / 100;
        soundSystem.setVolume(vol);
        volumeLabel.textContent = `${Math.round(vol * 100)}%`;
    });

    // Assemble UI
    volumeContainer.appendChild(muteBtn);
    volumeContainer.appendChild(volumeSlider);
    volumeContainer.appendChild(volumeLabel);
    container.appendChild(volumeContainer);

    return volumeContainer;
}
