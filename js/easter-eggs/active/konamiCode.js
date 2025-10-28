// Konami Code Easter Egg
// Press: ↑ ↑ ↓ ↓ ← → ← → B A
// Activates a hardcore retro space shooter game!

import { createSpaceDefenderGame } from '../games/spacedefender.js';
import { soundSystem, createVolumeControl } from '../soundSystem.js';

export const konamiCode = {
    name: 'Konami Code',
    description: 'Activates a retro arcade game when the Konami Code is entered',

    init() {
        const konamiSequence = [
            'ArrowUp', 'ArrowUp',
            'ArrowDown', 'ArrowDown',
            'ArrowLeft', 'ArrowRight',
            'ArrowLeft', 'ArrowRight',
            'b', 'a'
        ];

        let konamiIndex = 0;

        const handleKeydown = (e) => {
            const key = e.key;

            if (key === konamiSequence[konamiIndex]) {
                konamiIndex++;

                if (konamiIndex === konamiSequence.length) {
                    this.activate();
                    konamiIndex = 0;
                }
            } else {
                konamiIndex = 0;
            }
        };

        document.addEventListener('keydown', handleKeydown);
        this.cleanup = () => document.removeEventListener('keydown', handleKeydown);
    },

    activate() {
        console.log('🎮 Konami Code activated! Starting hardcore retro shooter...');
        soundSystem.victory();

        const gameContainer = document.createElement('div');
        gameContainer.id = 'konami-game';
        gameContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Courier New', 'Consolas', monospace; opacity: 0; transition: opacity 0.5s ease-in;
        `;

        const crtOverlay = document.createElement('div');
        crtOverlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: repeating-linear-gradient(0deg, rgba(0, 255, 0, 0.03), rgba(0, 255, 0, 0.03) 1px, transparent 1px, transparent 2px); pointer-events: none; z-index: 999999; animation: crt-flicker 0.15s infinite;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            #konami-game, #konami-game * {
                font-family: 'Press Start 2P', 'Courier New', monospace !important;
            }
            @keyframes crt-flicker { 0% { opacity: 0.97; } 50% { opacity: 1; } 100% { opacity: 0.97; } }
            #konami-game canvas {
                image-rendering: pixelated;
                image-rendering: crisp-edges;
            }
        `;
        document.head.appendChild(style);

        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.cssText = `border: 4px solid #0f0; box-shadow: 0 0 30px #0f0;`;

        const title = document.createElement('div');
        title.style.cssText = `color: #0f0; font-size: 36px; font-weight: bold; margin-bottom: 15px; text-shadow: 0 0 15px #0f0, 0 0 30px #0f0; letter-spacing: 6px; text-transform: uppercase;`;
        title.textContent = '▼ SPACE DEFENDER ▲';
        
        const hudContainer = document.createElement('div');
        hudContainer.style.cssText = `display: flex; justify-content: space-between; align-items: center; width: 800px; margin-top: 15px; color: #0f0; font-size: 20px; text-shadow: 0 0 10px #0f0;`;

        const scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'score-display';
        const heartsDisplay = document.createElement('div');
        heartsDisplay.id = 'hearts-display';
        const inventoryDisplay = document.createElement('div');
        inventoryDisplay.id = 'inventory-display';
        inventoryDisplay.style.cssText = `display: flex; align-items: center; gap: 10px;`;

        hudContainer.appendChild(heartsDisplay);
        hudContainer.appendChild(scoreDisplay);
        hudContainer.appendChild(inventoryDisplay);

        gameContainer.appendChild(crtOverlay);
        gameContainer.appendChild(title);
        gameContainer.appendChild(canvas);
        gameContainer.appendChild(hudContainer);
        document.body.appendChild(gameContainer);
        
        createVolumeControl(gameContainer);

        setTimeout(() => gameContainer.style.opacity = '1', 10);

        showCountdown(canvas, () => {
            const gameInstance = createSpaceDefenderGame(gameContainer, canvas, () => {
                gameContainer.style.opacity = '0';
                setTimeout(() => {
                    gameInstance.cleanup();
                    gameContainer.remove();
                    style.remove();
                }, 300);
            });
        });
    }
};

function showCountdown(canvas, onComplete) {
    const ctx = canvas.getContext('2d');
    let count = 3;

    function drawCountdown() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (count > 0) {
            ctx.fillStyle = '#0f0';
            ctx.font = 'bold 120px "Press Start 2P", "Courier New"';
            ctx.fillText(count.toString(), canvas.width / 2, canvas.height / 2);
            soundSystem.select();
        } else {
            ctx.fillStyle = '#ff0';
            ctx.font = 'bold 60px "Press Start 2P", "Courier New"';
            ctx.fillText('GO!', canvas.width / 2, canvas.height / 2);
            soundSystem.powerUp();
        }
    }

    const interval = setInterval(() => {
        drawCountdown();

        if (count === 0) {
            clearInterval(interval);
            setTimeout(onComplete, 500);
        }
        count--;
    }, 1000);

    drawCountdown();
}
