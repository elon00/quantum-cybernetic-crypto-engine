const http = require('http');
const fs = require('fs');
const path = require('path');

// Core Cryptographic & Quantum Engines
const Blockchain = require('./core/blockchain');
const CryptoWallet = require('./core/crypto_wallet');
const LiveOracle = require('./core/live_oracle');

// QMOOSA Universal Framework Modules
const QuickNodeProvider = require('./core/quicknode_provider');
const X402BazaarEngine = require('./core/x402_bazaar');
const ConwayAutomatonEngine = require('./core/conway_engine');
const PqcHybridEngine = require('./core/pqc_engine');
const RavenRsiEngine = require('./core/raven_rsi');
const ReaEngine = require('./core/rea_engine');
const TokenLaunchpadEngine = require('./core/token_launchpad');
const MultiwalletQrEngine = require('./core/multiwallet_qr');
const IpfsFleekAdapter = require('./core/ipfs_fleek_adapter');
const UniversalChainScaffold = require('./core/chain_scaffold');
const MultimodelAgentOrchestrator = require('./core/multimodel_agents');

const PORT = process.env.PORT || 3000;

// Initialize System Engines
const blockchain = new Blockchain();
const oracle = new LiveOracle();
const quickNode = new QuickNodeProvider();
const x402Bazaar = new X402BazaarEngine();
const conwayEngine = new ConwayAutomatonEngine();
const pqcEngine = new PqcHybridEngine();
const ravenRsi = new RavenRsiEngine();
const reaEngine = new ReaEngine(__dirname);
const tokenLaunchpad = new TokenLaunchpadEngine();
const multiwalletQr = new MultiwalletQrEngine();
const ipfsFleek = new IpfsFleekAdapter(__dirname);
const chainScaffold = new UniversalChainScaffold();
const agentOrchestrator = new MultimodelAgentOrchestrator();

// Start Live Background Streams
oracle.start();
conwayEngine.seedPattern('glider', 2, 2);
ipfsFleek.generateFleekConfig();
ipfsFleek.pinReleaseArtifact('QMOOSA_GENESIS_CORE', { version: '2.0.0', status: 'PRODUCTION_VERIFIED' });

// Seed initial token launchpad project
tokenLaunchpad.createLaunchpadProject({
    tokenName: 'Quantum Cybernetic Token',
    tokenSymbol: 'QCY',
    targetChain: 'Base',
    initialSupply: 100000000,
    salePriceUSD: 0.05
});

// Seed default funded wallet
const defaultUserWallet = new CryptoWallet();
blockchain.balances.set(defaultUserWallet.address, 500.0);

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-402-Payment-Proof'
    });
    res.end(JSON.stringify(data));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(err);
            }
        });
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-402-Payment-Proof'
        });
        return res.end();
    }

    // 1. Core Blockchain & Network Status
    if (pathname === '/api/status' && req.method === 'GET') {
        const telemetry = blockchain.cybernetics.getLatestTelemetry();
        const oracleData = oracle.getPrices();
        const latestBlock = blockchain.getLatestBlock();
        const qnStatus = quickNode.getHealthStatus();

        return sendJson(res, 200, {
            success: true,
            network: 'QMOOSA-UNIVERSAL-MAINNET',
            blockHeight: blockchain.chain.length,
            latestBlock,
            mempoolCount: blockchain.mempool.length,
            mempool: blockchain.mempool,
            telemetry,
            oracle: oracleData,
            quickNode: qnStatus,
            defaultUser: {
                address: defaultUserWallet.address,
                publicKey: defaultUserWallet.publicKey,
                balance: blockchain.getBalance(defaultUserWallet.address)
            }
        });
    }

    if (pathname === '/api/chain' && req.method === 'GET') {
        return sendJson(res, 200, {
            success: true,
            length: blockchain.chain.length,
            chain: blockchain.chain
        });
    }

    // 2. Wallets & Transactions
    if (pathname === '/api/wallet/new' && req.method === 'POST') {
        const wallet = new CryptoWallet();
        const faucetAmount = 100.0;
        const genesisVaultBal = blockchain.getBalance(blockchain.systemWallet.address);
        if (genesisVaultBal >= faucetAmount) {
            blockchain.balances.set(blockchain.systemWallet.address, genesisVaultBal - faucetAmount);
            blockchain.balances.set(wallet.address, faucetAmount);
        }

        return sendJson(res, 200, {
            success: true,
            address: wallet.address,
            publicKey: wallet.publicKey,
            privateKey: wallet.privateKey,
            balance: blockchain.getBalance(wallet.address)
        });
    }

    if (pathname === '/api/transaction' && req.method === 'POST') {
        try {
            const body = await parseBody(req);
            const tx = blockchain.addTransaction({
                sender: body.sender,
                recipient: body.recipient,
                amount: parseFloat(body.amount),
                fee: parseFloat(body.fee || 1.0),
                gasLimit: 21000,
                timestamp: Date.now(),
                publicKeyPem: body.publicKeyPem,
                signature: body.signature
            });

            return sendJson(res, 200, {
                success: true,
                message: 'Transaction verified and placed into quantum mempool',
                transaction: tx
            });
        } catch (err) {
            return sendJson(res, 400, { success: false, error: err.message });
        }
    }

    if (pathname === '/api/mine' && req.method === 'POST') {
        try {
            const body = await parseBody(req);
            const minerAddress = body.minerAddress || defaultUserWallet.address;
            const newBlock = blockchain.mineNextBlock(minerAddress);

            return sendJson(res, 200, {
                success: true,
                message: 'New block mined successfully with real SHA-256 Proof-of-Work!',
                block: newBlock
            });
        } catch (err) {
            return sendJson(res, 500, { success: false, error: err.message });
        }
    }

    // 3. QuickNode Multichain RPC API
    if (pathname === '/api/quicknode/health' && req.method === 'GET') {
        return sendJson(res, 200, quickNode.getHealthStatus());
    }

    // 4. x402 Bazaar Protocol Routes
    if (pathname === '/api/x402/resources' && req.method === 'GET') {
        return sendJson(res, 200, {
            success: true,
            protocol: 'x402/v2',
            bazaarCatalog: x402Bazaar.getBazaarCatalog()
        });
    }

    if (pathname === '/api/x402/challenge' && req.method === 'POST') {
        try {
            const body = await parseBody(req);
            const challenge = x402Bazaar.createPaymentChallenge(body.serviceId, body.clientAddress);
            return sendJson(res, 402, {
                success: false,
                status: 402,
                error: 'Payment Required',
                x402Challenge: challenge
            });
        } catch (err) {
            return sendJson(res, 400, { success: false, error: err.message });
        }
    }

    if (pathname === '/api/x402/verify' && req.method === 'POST') {
        const body = await parseBody(req);
        const verification = x402Bazaar.verifyPaymentProof(body);
        return sendJson(res, verification.valid ? 200 : 400, verification);
    }

    // 5. Conway Automaton Engine Routes
    if (pathname === '/api/conway/step' && req.method === 'POST') {
        const result = conwayEngine.step();
        return sendJson(res, 200, { success: true, ...result });
    }

    if (pathname === '/api/conway/snapshot' && req.method === 'GET') {
        return sendJson(res, 200, { success: true, ...conwayEngine.exportSnapshot() });
    }

    // 6. Post-Quantum Cryptography (PQC) Routes
    if (pathname === '/api/pqc/keypair' && req.method === 'POST') {
        const keypair = pqcEngine.generateHybridKeyPair();
        return sendJson(res, 200, { success: true, keypair });
    }

    // 7. Raven RSI & REA Introspection Routes
    if (pathname === '/api/rsi/cycle' && req.method === 'POST') {
        const telemetry = blockchain.cybernetics.getLatestTelemetry();
        const cycle = ravenRsi.runOptimizationCycle(telemetry, { healthy: true });
        return sendJson(res, 200, { success: true, cycle });
    }

    if (pathname === '/api/rea/audit' && req.method === 'GET') {
        const audit = reaEngine.inspectProject();
        return sendJson(res, 200, { success: true, audit });
    }

    // 8. Token Launchpad & Emission Economics
    if (pathname === '/api/launchpad/projects' && req.method === 'GET') {
        return sendJson(res, 200, { success: true, projects: tokenLaunchpad.getProjects() });
    }

    if (pathname === '/api/launchpad/emission' && req.method === 'POST') {
        const body = await parseBody(req);
        const calc = tokenLaunchpad.calculateEmissionLimit(body.currentSupply || 1000000, body.requestedMint || 50000);
        return sendJson(res, 200, { success: true, emission: calc });
    }

    // 9. Multiwallet & Cross-Chain QR Payments
    if (pathname === '/api/wallets/qr' && req.method === 'POST') {
        const body = await parseBody(req);
        const qr = multiwalletQr.generatePaymentUri(body);
        return sendJson(res, 200, { success: true, qr });
    }

    if (pathname === '/api/wallets/supported' && req.method === 'GET') {
        return sendJson(res, 200, { success: true, wallets: multiwalletQr.getSupportedWallets() });
    }

    // 10. IPFS & Fleek Edge Storage Registry
    if (pathname === '/api/ipfs/artifacts' && req.method === 'GET') {
        return sendJson(res, 200, { success: true, artifacts: ipfsFleek.getPinnedArtifacts() });
    }

    // 11. Multimodel AI Agentic Chatbot Dispatch
    if (pathname === '/api/agent/chat' && req.method === 'POST') {
        const body = await parseBody(req);
        const chatRes = await agentOrchestrator.dispatchQuery(body.message, body.agentId);
        return sendJson(res, 200, { success: true, message: chatRes });
    }

    // Static Asset Serving
    let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, 'public', 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.svg': 'image/svg+xml'
    };
    const contentType = mimeTypes[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end('File read error');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(` 🚀 QMOOSA UNIVERSAL AI–WEB4–BLOCKCHAIN ENGINE ONLINE!`);
    console.log(` 📡 Local Dashboard: http://localhost:${PORT}`);
    console.log(` ⛓️  Consensus: SHA-256 PoW + Quantum Hamiltonian Optimizer`);
    console.log(` 🌐 QuickNode Multichain RPC: Active with Failover`);
    console.log(` 💰 x402 Bazaar Protocol: Agent Monetization Active`);
    console.log(` 🧬 Conway Cellular Automaton: B3/S23 Deterministic Engine`);
    console.log(` 🛡️  Post-Quantum Cryptography: NIST FIPS 204 Hybrid ML-DSA`);
    console.log(` 🔄 Raven RSI: Governed Recursive Self-Improvement Loop Active`);
    console.log(` 🤖 Multimodel AI Agentics: Architecture, Security, QA Online`);
    console.log(` 📦 Storage & Edge Deploy: IPFS CID + Fleek Config Ready`);
    console.log(`================================================================`);
});
