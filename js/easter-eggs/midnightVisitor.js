// Midnight Visitor Easter Egg
// During midnight hours (00:00-03:00), type "goodnight" in search to trigger

export const midnightVisitor = {
    name: 'Midnight Visitor',
    description: 'Something special happens during the witching hours...',

    hasTriggeredToday: false,
    triggerKeyword: 'when the moon rises',

    init() {
        const searchInput = document.getElementById('command-input');
        if (!searchInput) return;

        const handleInput = (e) => {
            const value = e.target.value.trim().toLowerCase();
            const now = new Date();
            const hours = now.getHours();

            // Reset trigger at 4 AM
            if (hours === 4) {
                this.hasTriggeredToday = false;
            }

            // Only trigger between midnight and 3 AM, and only once per day
            if (hours >= 0 && hours < 3 && !this.hasTriggeredToday && value === this.triggerKeyword) {
                this.hasTriggeredToday = true;
                this.activate();
                // Clear search input
                searchInput.value = '';
            }
        };

        searchInput.addEventListener('input', handleInput);
        this.cleanup = () => searchInput.removeEventListener('input', handleInput);
    },

    activate() {
        console.log('🌙 A midnight visitor appears...');

        // Create dark overlay
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
        }, 100);

        // Moon appears
        setTimeout(() => {
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
                           0 0 80px rgba(255, 255, 220, 0.3); /* Added soft glow */
                z-index: 999999;
                transition: top 4s ease-out, opacity 3s ease-in-out;
                pointer-events: none;
            `;
            document.body.appendChild(moon);

            // Moon rises
            setTimeout(() => {
                moon.style.top = '80px';
            }, 100);

            // Shooting stars
            setTimeout(() => {
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        this.createShootingStar();
                    }, i * 800);
                }
            }, 2000);

            // Owl appears
            setTimeout(() => {
                this.createOwl();
            }, 4000);

            // Bats fly across
            setTimeout(() => {
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        this.createBat();
                    }, i * 1000);
                }
            }, 6000);

            // Message appears
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

                setTimeout(() => {
                    message.style.transform = 'translate(-50%, -50%) scale(1)';
                }, 100);

                // Fade out everything
                setTimeout(() => {
                    message.style.transition = 'opacity 2s ease-out';
                    message.style.opacity = '0';
                    moon.style.opacity = '0';
                    overlay.style.transition = 'opacity 3s ease-out';
                    overlay.style.opacity = '0';

                    setTimeout(() => {
                        message.remove();
                        moon.remove();
                        overlay.remove();
                    }, 3000);
                }, 8000);
            }, 8000);
        }, 2000);
    },

    createShootingStar() {
        const star = document.createElement('div');
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * 200;
        const trailLength = 100 + Math.random() * 150;

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

        const angle = Math.PI / 4;
        const distance = 300 + Math.random() * 200;
        const endX = startX - distance * Math.cos(angle);
        const endY = startY + distance * Math.sin(angle);

        star.animate([
            {
                transform: 'translateX(0) translateY(0)',
                opacity: 0
            },
            {
                opacity: 1,
                offset: 0.1
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

    createOwl() {
        const owl = document.createElement('div');
        owl.style.cssText = `
            position: fixed;
            top: 100px;
            right: -100px;
            font-size: 48px;
            z-index: 999999;
            pointer-events: none;
            transition: right 3s ease-in-out;
            filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
            cursor: pointer; /* Add cursor to indicate interactivity */
        `;
        owl.textContent = '🦉';
        document.body.appendChild(owl);

        setTimeout(() => {
            owl.style.right = '150px';
        }, 100);
        
        let hasBlinked = false;
        const blink = () => {
            if(hasBlinked) return;
            hasBlinked = true;
            owl.style.transform = 'scale(1.1)';
            setTimeout(() => owl.style.transform = 'scale(1)', 200);
        };

        owl.addEventListener('mouseenter', blink);


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

            setTimeout(() => {
                hoot.style.opacity = '1';
                hoot.style.top = '70px';
            }, 100);

            setTimeout(() => {
                hoot.style.opacity = '0';
                setTimeout(() => hoot.remove(), 1000);
            }, 2000);
        }, 3500);

        setTimeout(() => {
            owl.style.transition = 'right 2s ease-in, opacity 1s ease-out';
            owl.style.right = '-100px';
            owl.style.opacity = '0';
            setTimeout(() => {
                owl.removeEventListener('mouseenter', blink);
                owl.remove()
            }, 2000);
        }, 10000);
    }
};
