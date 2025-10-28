// Game Index
// Imports and exports all available games

import { createSnakeGame } from './snake.js';
import { createPongGame } from './pong.js';
import { createBreakoutGame } from './breakout.js';
import { createFlappyGame } from './flappy.js';
import { createTetrisGame } from './tetris.js';
import { createAsteroidsGame } from './asteroids.js';
import { createPacmanGame } from './pacman.js';
import { createSpaceDefenderGame } from './spacedefender.js';
import { createRacingGame } from './racing.js';

export const GAMES = {
    spacedefender: {
        name: '🚀 FLIGHT',
        description: 'Hardcore retro space shooter!',
        create: (container, canvas, exitCallback) => createSpaceDefenderGame(container, canvas, exitCallback),
        keys: null, // Menu only (still activated through konami code)
        menuOnly: false
    },
    snake: {
        name: '🐍 SNAKE',
        description: 'Classic snake game - eat food and grow!',
        create: createSnakeGame,
        keys: ['ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'a', 'b']
    },
    pong: {
        name: '🏓 PONG',
        description: 'Classic table tennis - beat the AI!',
        create: createPongGame,
        keys: ['ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'b']
    },
    breakout: {
        name: '🧱 BREAKOUT',
        description: 'Break all the bricks!',
        create: createBreakoutGame,
        keys: ['a', 'b', 'a', 'b', 'ArrowUp', 'ArrowDown', 'ArrowUp', 'ArrowDown']
    },
    flappy: {
        name: '🐦 FLAPPY',
        description: 'Flap through the pipes!',
        create: createFlappyGame,
        keys: ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft']
    },
    tetris: {
        name: '🟦 TETRIS',
        description: 'Stack the blocks!',
        create: createTetrisGame,
        keys: ['b', 'a', 'b', 'a', 'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown']
    },
    asteroids: {
        name: '☄️ ASTEROIDS',
        description: 'Destroy the space rocks!',
        create: createAsteroidsGame,
        keys: ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'a', 'b']
    },
    pacman: {
        name: '👻 PAC-MAN',
        description: 'Eat all the dots!',
        create: createPacmanGame,
        keys: ['a', 'ArrowUp', 'b', 'ArrowDown', 'a', 'ArrowLeft', 'b', 'ArrowRight']
    },
    racing: {
        name: '🏎️ TURBO RACER',
        description: 'High-speed racing! Dodge obstacles and collect power-ups!',
        create: createRacingGame,
        keys: ['r', 'a', 'c', 'e']
    }
};

let activeGameCleanup = null;

// 전역 ESC 처리: 화면만 닫히는 문제 해결을 위해 cleanup 호출 보장
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (activeGameCleanup) {
            activeGameCleanup();
            activeGameCleanup = null;
        }
    }
});

// Export game names for selection menu
export function getGameList() {
    return Object.entries(GAMES).map(([id, game]) => ({
        id,
        name: game.name,
        description: game.description
    }));
}
