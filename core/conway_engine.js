const crypto = require('crypto');

/**
 * Conway Automaton Simulation Engine (Game of Life B3/S23)
 * Provides: Deterministic cellular state transitions, state hashing,
 * oscillator/glider verification, and state snapshot checkpointing.
 */
class ConwayAutomatonEngine {
    constructor(width = 32, height = 32) {
        this.width = width;
        this.height = height;
        this.grid = this._createEmptyGrid();
        this.generation = 0;
        this.historyHashes = [];
    }

    _createEmptyGrid() {
        return Array.from({ length: this.height }, () => new Uint8Array(this.width));
    }

    /**
     * Seeds a pattern into the grid
     */
    seedPattern(patternName = 'glider', startX = 1, startY = 1) {
        this.grid = this._createEmptyGrid();
        this.generation = 0;
        this.historyHashes = [];

        if (patternName === 'glider') {
            // Standard Glider
            const coords = [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]];
            coords.forEach(([dx, dy]) => {
                if (startY + dy < this.height && startX + dx < this.width) {
                    this.grid[startY + dy][startX + dx] = 1;
                }
            });
        } else if (patternName === 'blinker') {
            // Period-2 Oscillator
            const coords = [[0, 1], [1, 1], [2, 1]];
            coords.forEach(([dx, dy]) => {
                this.grid[startY + dy][startX + dx] = 1;
            });
        } else if (patternName === 'block') {
            // Still Life
            const coords = [[0, 0], [0, 1], [1, 0], [1, 1]];
            coords.forEach(([dx, dy]) => {
                this.grid[startY + dy][startX + dx] = 1;
            });
        }
        return this.computeStateHash();
    }

    /**
     * Executes one B3/S23 generation step
     */
    step() {
        const nextGrid = this._createEmptyGrid();

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const neighbors = this._countLiveNeighbors(x, y);
                const isAlive = this.grid[y][x] === 1;

                // Rule B3/S23:
                // Alive: survives if 2 or 3 neighbors
                // Dead: born if exactly 3 neighbors
                if (isAlive && (neighbors === 2 || neighbors === 3)) {
                    nextGrid[y][x] = 1;
                } else if (!isAlive && neighbors === 3) {
                    nextGrid[y][x] = 1;
                }
            }
        }

        this.grid = nextGrid;
        this.generation++;
        const stateHash = this.computeStateHash();
        this.historyHashes.push(stateHash);
        if (this.historyHashes.length > 100) this.historyHashes.shift();

        return {
            generation: this.generation,
            stateHash,
            liveCells: this.countLiveCells()
        };
    }

    _countLiveNeighbors(x, y) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                // Toroidal wrap-around boundaries
                const nx = (x + dx + this.width) % this.width;
                const ny = (y + dy + this.height) % this.height;
                count += this.grid[ny][nx];
            }
        }
        return count;
    }

    countLiveCells() {
        let sum = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                sum += this.grid[y][x];
            }
        }
        return sum;
    }

    computeStateHash() {
        const buffer = Buffer.concat(this.grid.map(row => Buffer.from(row)));
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    exportSnapshot() {
        return {
            width: this.width,
            height: this.height,
            generation: this.generation,
            liveCells: this.countLiveCells(),
            stateHash: this.computeStateHash()
        };
    }
}

module.exports = ConwayAutomatonEngine;
