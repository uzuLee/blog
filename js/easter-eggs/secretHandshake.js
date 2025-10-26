// Secret Handshake Easter Egg
// Click UI elements in a specific sequence

export const secretHandshake = {
    name: 'Secret Handshake',
    description: 'The secret handshake known only to insiders',

    clickSequence: [],
    requiredSequence: ['logo', 'settings', 'logo', 'search', 'logo'],
    sequenceTimeout: null,
    resetDelay: 3000, // Reset sequence after 3 seconds of inactivity

    init() {
        // Set up click listeners on key UI elements
        const logo = document.querySelector('.brand-link');
        const settings = document.querySelector('#btn-settings');
        const search = document.querySelector('#command-input');

        if (!logo || !settings || !search) {
            console.warn('Secret Handshake: Required elements not found');
            return;
        }

        // Create click handlers
        const createClickHandler = (elementName) => (e) => {
            // Don't prevent default for search input
            if (elementName !== 'search') {
                e.preventDefault();
            }

            this.addToSequence(elementName);
        };

        const logoHandler = createClickHandler('logo');
        const settingsHandler = createClickHandler('settings');
        const searchHandler = createClickHandler('search');

        logo.addEventListener('click', logoHandler);
        settings.addEventListener('click', settingsHandler);
        search.addEventListener('focus', searchHandler);

        this.cleanup = () => {
            logo.removeEventListener('click', logoHandler);
            settings.removeEventListener('click', settingsHandler);
            search.removeEventListener('focus', searchHandler);
            if (this.sequenceTimeout) {
                clearTimeout(this.sequenceTimeout);
            }
        };
    },

    addToSequence(elementName) {
        // Add to sequence
        this.clickSequence.push(elementName);

        // No visual feedback - keep it secret!

        // Keep only last N clicks
        if (this.clickSequence.length > this.requiredSequence.length) {
            this.clickSequence.shift();
        }

        // Check if sequence matches
        if (this.checkSequence()) {
            this.activate();
            this.clickSequence = [];
            if (this.sequenceTimeout) {
                clearTimeout(this.sequenceTimeout);
            }
            return;
        }

        // Reset sequence after delay
        if (this.sequenceTimeout) {
            clearTimeout(this.sequenceTimeout);
        }
        this.sequenceTimeout = setTimeout(() => {
            this.clickSequence = [];
        }, this.resetDelay);
    },

    checkSequence() {
        if (this.clickSequence.length !== this.requiredSequence.length) {
            return false;
        }

        for (let i = 0; i < this.requiredSequence.length; i++) {
            if (this.clickSequence[i] !== this.requiredSequence[i]) {
                return false;
            }
        }

        return true;
    },

    activate() {
        console.log('🤝 Secret handshake recognized!');

        // Create mystical portal effect
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

        // Expand portal
        setTimeout(() => {
            portal.style.width = '600px';
            portal.style.height = '600px';
        }, 100);

        // Create swirling particles
        const particles = [];
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                const angle = (Math.PI * 2 * i) / 50;
                const radius = 300;

                particle.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    width: 10px;
                    height: 10px;
                    background: ${['#8a2be2', '#9370db', '#ba55d3', '#da70d6'][i % 4]};
                    border-radius: 50%;
                    z-index: 999999;
                    pointer-events: none;
                    box-shadow: 0 0 10px currentColor;
                `;
                document.body.appendChild(particle);
                particles.push(particle);

                // Animate particle in spiral
                const startX = Math.cos(angle) * radius;
                const startY = Math.sin(angle) * radius;

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
                    delay: i * 20,
                    easing: 'ease-in-out'
                });

                setTimeout(() => particle.remove(), 3000 + i * 20);
            }, i * 20);
        }

        // Show secret message
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

            setTimeout(() => {
                message.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 100);

            // Floating symbols around message
            const symbols = ['🔮', '✨', '🌟', '💫', '⭐'];
            for (let i = 0; i < 12; i++) {
                setTimeout(() => {
                    const symbol = document.createElement('div');
                    const angle = (Math.PI * 2 * i) / 12;
                    const distance = 200;

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
                        --distance: ${distance}px;
                    `;
                    symbol.textContent = symbols[i % symbols.length];
                    document.body.appendChild(symbol);

                    setTimeout(() => {
                        symbol.style.transition = 'opacity 1s ease-out';
                        symbol.style.opacity = '0';
                        setTimeout(() => symbol.remove(), 1000);
                    }, 8000);
                }, i * 100);
            }

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
            if (!document.querySelector('#secrethandshake-orbit-animation')) {
                orbitStyle.id = 'secrethandshake-orbit-animation';
                document.head.appendChild(orbitStyle);
            }

            // Fade out everything
            setTimeout(() => {
                message.style.transition = 'opacity 2s ease-out, transform 2s ease-out';
                message.style.opacity = '0';
                message.style.transform = 'translate(-50%, -50%) scale(0) rotate(180deg)';

                portal.style.transition = 'opacity 2s ease-out, width 2s ease-out, height 2s ease-out';
                portal.style.opacity = '0';
                portal.style.width = '0';
                portal.style.height = '0';

                setTimeout(() => {
                    message.remove();
                    portal.remove();
                }, 2000);
            }, 7000);
        }, 2000);
    },

    cleanup() {
        // Cleanup is set in init()
    }
};
