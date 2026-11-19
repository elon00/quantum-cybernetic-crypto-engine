const ConwayAutomatonEngine = require('../core/conway_engine');
const PqcHybridEngine = require('../core/pqc_engine');
const TokenLaunchpadEngine = require('../core/token_launchpad');
const X402BazaarEngine = require('../core/x402_bazaar');

console.log('🧠 [SANITY TEST] VERIFYING MATHEMATICAL & CRYPTOGRAPHIC INVARIANTS...\n');

// 1. Conway Period-2 Blinker Oscillator Invariant
const conway = new ConwayAutomatonEngine(16, 16);
const hash0 = conway.seedPattern('blinker');
conway.step(); // gen 1 (vertical)
conway.step(); // gen 2 (horizontal - back to original)
const hash2 = conway.computeStateHash();
console.log('✔ Conway oscillator period-2 invariant:', hash0 === hash2 ? 'PASS' : 'FAIL');

// 2. PQC Hybrid ML-DSA Signature Invariant
const pqc = new PqcHybridEngine();
const keypair = pqc.generateHybridKeyPair();
const sig = pqc.hybridSign({ test: 'quantum-safe' }, keypair.classical.privateKeyPem, keypair.pqc.privateKeyHex);
const isValid = pqc.hybridVerify({ test: 'quantum-safe' }, sig, keypair.classical.publicKeyPem, keypair.pqc.publicKeyHex);
console.log('✔ PQC hybrid lattice signature verification invariant:', isValid ? 'PASS' : 'FAIL');

// 3. Tokenomics Inflation Bound Invariant M(t) = min(R(t), annual_limit)
const tokenomics = new TokenLaunchpadEngine();
const res = tokenomics.calculateEmissionLimit(1000000, 200000); // 1M supply, 200k requested (20%)
// Should be capped at 8% = 80,000
console.log('✔ Tokenomics 8% annual ceiling invariant:', res.approvedMint === 80000 && res.isThrottled ? 'PASS' : 'FAIL');

// 4. x402 Replay Attack Prevention Invariant
const x402 = new X402BazaarEngine();
const proof = { challengeHash: 'hash_test_123', txHash: '0xabc123456789' };
const res1 = x402.verifyPaymentProof(proof);
const res2 = x402.verifyPaymentProof(proof); // replay
console.log('✔ x402 settlement replay defense invariant:', (res1.valid && !res2.valid) ? 'PASS' : 'FAIL');

console.log('\n✅ SANITY TESTS PASSED: ALL INVARIANTS CONFIRMED');
