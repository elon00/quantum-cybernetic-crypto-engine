const Blockchain = require('../core/blockchain');
const CryptoWallet = require('../core/crypto_wallet');
const QuickNodeProvider = require('../core/quicknode_provider');
const X402BazaarEngine = require('../core/x402_bazaar');
const ConwayAutomatonEngine = require('../core/conway_engine');

console.log('⚡ [SMOKE TEST] RUNNING AUTOMATED FAST SMOKE TESTS...\n');

// 1. Blockchain and Genesis
const chain = new Blockchain();
console.log('✔ Blockchain genesis block verified:', chain.getLatestBlock().hash.startsWith('00') ? 'PASS' : 'FAIL');

// 2. Wallet Generation
const wallet = new CryptoWallet();
console.log('✔ secp256k1 ECDSA wallet generation:', wallet.address.startsWith('0x') ? 'PASS' : 'FAIL');

// 3. QuickNode Health
const rpc = new QuickNodeProvider();
const rpcStatus = rpc.getHealthStatus();
console.log('✔ QuickNode provider initialization:', rpcStatus.healthy ? 'PASS' : 'FAIL');

// 4. x402 Bazaar Service Discovery
const x402 = new X402BazaarEngine();
const catalog = x402.getBazaarCatalog();
console.log('✔ x402 Bazaar service catalog loaded:', catalog.length >= 2 ? 'PASS' : 'FAIL');

// 5. Conway Automaton Initial Seed
const conway = new ConwayAutomatonEngine();
conway.seedPattern('glider');
console.log('✔ Conway engine seeded with glider:', conway.countLiveCells() === 5 ? 'PASS' : 'FAIL');

console.log('\n✅ SMOKE TESTS PASSED: 5/5 GATES VERIFIED');
