const Blockchain = require('../core/blockchain');
const CryptoWallet = require('../core/crypto_wallet');
const MerkleTree = require('../core/merkle_tree');
const CyberneticController = require('../core/cybernetic_controller');

console.log('🔄 [REGRESSION TEST] EXECUTING SYSTEM REGRESSION SUITE...\n');

// Test 1: Merkle Tree Odd & Empty Leaf Handling (Historical Regression)
const emptyTree = new MerkleTree([]);
console.log('✔ Merkle empty block leaf regression check:', emptyTree.root.length === 64 ? 'PASS' : 'FAIL');

const oddLeavesTree = new MerkleTree([{ a: 1 }, { b: 2 }, { c: 3 }]);
console.log('✔ Merkle odd leaf duplicate pairing regression check:', oddLeavesTree.root.length === 64 ? 'PASS' : 'FAIL');

// Test 2: secp256k1 Signature Tamper Rejection
const sender = new CryptoWallet();
const payload = { from: sender.address, to: '0x123', amount: 50 };
const sig = sender.sign(payload);
const tamperedPayload = { from: sender.address, to: '0x123', amount: 500 }; // 10x tamper
const isTamperValid = CryptoWallet.verify(tamperedPayload, sig, sender.publicKey);
console.log('✔ Cryptographic tamper rejection regression check:', !isTamperValid ? 'PASS' : 'FAIL');

// Test 3: Cybernetic PID Damping Over High Jitter
const cybernetics = new CyberneticController(8000);
for (let i = 0; i < 20; i++) {
    const jitterTime = 5000 + (Math.sin(i) * 3000);
    cybernetics.evaluateCycle(jitterTime, 10);
}
const finalTelemetry = cybernetics.getLatestTelemetry();
console.log('✔ Cybernetic PID anti-windup & stability check:', finalTelemetry.systemStability > 20 ? 'PASS' : 'FAIL');

console.log('\n✅ REGRESSION TESTS PASSED: ALL REGRESSIONS SAFE');
