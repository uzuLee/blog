// Secret Search Keyword Easter Egg
// Search for special keywords to unlock secrets

export const secretSearch = {
    name: 'Secret Search Keywords',
    description: 'Search for special keywords to discover secrets',

    secretKeywords: {
        'thematrix': '🟢',
        'whereisunicorn': '🦄',
        'spacegalaxy': '🌌',
        'dothemagic': '✨'
    },

    init() {
        const searchInput = document.getElementById('command-input');
        if (!searchInput) return;

        const handleInput = (e) => {
            const value = e.target.value.trim().toLowerCase();
            if (this.activeEffect) return; // Prevent new effects while one is running

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

    activate(keyword, emoji) {
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

    cleanupEffect(duration = 1000) {
        setTimeout(() => {
            this.activeEffect = null;
        }, duration);
    },

    matrixEffect(emoji) {
        const container = this.createEffectContainer(99999);
        container.style.background = '#000';

        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789';
        const fontSize = 16;
        const columns = canvas.width / fontSize;
        
        const drops = [];
        for(let i = 0; i < columns; i++) {
            drops[i] = {
                y: Math.random() * canvas.height,
                speed: 2 + Math.random() * 3,
                isLeader: Math.random() < 0.15
            };
        }

        let animationFrame;
        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `${fontSize}px monospace`;

            for(let i = 0; i < drops.length; i++) {
                const drop = drops[i];
                const text = chars[Math.floor(Math.random() * chars.length)];
                
                ctx.fillStyle = drop.isLeader ? '#cff0c8' : '#0f0';
                if(drop.isLeader) {
                     ctx.shadowBlur = 10;
                     ctx.shadowColor = '#0f0';
                }

                ctx.fillText(text, i * fontSize, drop.y * fontSize);
                ctx.shadowBlur = 0;

                drop.y += drop.speed / 10;
                if (drop.y * fontSize > canvas.height && Math.random() > 0.98) {
                    drops[i].y = 0;
                }
            }
            animationFrame = requestAnimationFrame(draw);
        };

        draw();

        setTimeout(() => {
            container.style.opacity = '0';
            setTimeout(() => {
                cancelAnimationFrame(animationFrame);
                container.remove();
                this.cleanupEffect();
            }, 1000);
        }, 10000);
    },

    unicornEffect(emoji) {
        const container = this.createEffectContainer(99999);
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const emojis = [];

        const handleClick = (e) => {
            const x = e.clientX;
            const y = e.clientY;
            for (let i = 0; i < 100; i++) {
                particles.push(this.createUnicornParticle(x, y));
            }
            emojis.push({
                x: x,
                y: y,
                vy: -2,
                alpha: 1,
                size: 48
            });
        };
        document.addEventListener('click', handleClick);

        let animationFrame;
        const trailLoop = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw and update particles
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

            // Draw and update emojis
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

    createUnicornParticle(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 7;
        return {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            alpha: 1,
            fade: 0.02 + Math.random() * 0.01,
            size: 2 + Math.random() * 2,
            color: `hsl(${Math.random() * 360}, 100%, 75%)`
        };
    },

    galaxyEffect(emoji) {
        const container = this.createEffectContainer(99998);
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const layers = [
            { count: 200, size: 1, speed: 0.1, stars: [] },
            { count: 100, size: 2, speed: 0.3, stars: [] },
            { count: 40, size: 3, speed: 0.6, stars: [] }
        ];

        layers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                layer.stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    initialX: 0, initialY: 0 // Will be set later
                });
            }
            layer.stars.forEach(s => { s.initialX = s.x; s.initialY = s.y; });
        });

        const handleMouseMove = (e) => {
            const xRatio = (e.clientX - window.innerWidth / 2) / window.innerWidth;
            const yRatio = (e.clientY - window.innerHeight / 2) / window.innerHeight;

            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
            );
            gradient.addColorStop(0, '#0d1a2f');
            gradient.addColorStop(1, '#000');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            layers.forEach(layer => {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                layer.stars.forEach(star => {
                    const newX = star.initialX + xRatio * layer.speed * 100;
                    const newY = star.initialY + yRatio * layer.speed * 100;
                    ctx.beginPath();
                    ctx.arc(newX, newY, layer.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                });
            });
        };
        document.addEventListener('mousemove', handleMouseMove);
        handleMouseMove({ clientX: canvas.width / 2, clientY: canvas.height / 2}); // Initial draw

        setTimeout(() => {
            container.style.opacity = '0';
            setTimeout(() => {
                document.removeEventListener('mousemove', handleMouseMove);
                container.remove();
                this.cleanupEffect();
            }, 1000);
        }, 10000);
    },

    magicEffect(emoji) {
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

        // Create smoke particles
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
                color: `hsl(${200 + Math.random() * 60}, 40%, 20%)`
            });
        }

        // Create stardust particles
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
                color: `hsl(${200 + Math.random() * 60}, 100%, 85%)`
            });
        }

        let animationFrame;
        const loop = () => {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
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

        this.screenShake(200);

        setTimeout(() => {
            container.style.opacity = '0';
            setTimeout(() => {
                cancelAnimationFrame(animationFrame);
                container.remove();
                this.cleanupEffect();
            }, 1000);
        }, 8000);
    },

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
        requestAnimationFrame(() => {
            container.style.opacity = '1';
        });
        return container;
    },

    screenShake(duration) {
        const body = document.body;
        body.style.transition = 'transform 0.1s ease-in-out';
        let startTime = Date.now();
        
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

    cleanup() {
        // Cleanup is set in init()
    }
};

