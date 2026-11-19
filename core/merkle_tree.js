const crypto = require('crypto');

/**
 * Real Merkle Tree implementation with SHA-256 cryptographic hashing
 */
class MerkleTree {
    constructor(transactions = []) {
        this.leaves = transactions.map(tx => this.hash(JSON.stringify(tx)));
        this.root = this.buildRoot(this.leaves);
    }

    hash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    buildRoot(leaves) {
        if (!leaves || leaves.length === 0) {
            return this.hash('EMPTY_BLOCK');
        }
        if (leaves.length === 1) {
            return leaves[0];
        }

        let currentLevel = [...leaves];
        while (currentLevel.length > 1) {
            const nextLevel = [];
            for (let i = 0; i < currentLevel.length; i += 2) {
                if (i + 1 < currentLevel.length) {
                    nextLevel.push(this.hash(currentLevel[i] + currentLevel[i + 1]));
                } else {
                    // Duplicate last odd leaf as in Bitcoin
                    nextLevel.push(this.hash(currentLevel[i] + currentLevel[i]));
                }
            }
            currentLevel = nextLevel;
        }

        return currentLevel[0];
    }
}

module.exports = MerkleTree;
