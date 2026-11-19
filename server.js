const http = require('http');
const fs = require('fs');
const path = require('path');
const Blockchain = require('./core/blockchain');
const CryptoWallet = require('./core/crypto_wallet');
const LiveOracle = require('./core/live_oracle');

const PORT = process.env.PORT || 3000;
const blockchain = new Blockchain();
const oracle = new LiveOracle();

// Start live oracle price streaming
oracle.start();

// Seed initial test funds to a default demo wallet so user can immediately transact
const defaultUserWallet = new CryptoWallet();
blockchain.balances.set(defaultUserWallet.address, 500.0);

// Helper to serve JSON
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

// Helper to read POST body
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

    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        return res.end();
    }

    // API Routes
    if (pathname === '/api/status' && req.method === 'GET') {
        const telemetry = blockchain.cybernetics.getLatestTelemetry();
        const oracleData = oracle.getPrices();
        const latestBlock = blockchain.getLatestBlock();

        return sendJson(res, 200, {
            success: true,
            network: 'QUANTUM-CYBERNETIC-MAINNET',
            blockHeight: blockchain.chain.length,
            latestBlock,
            mempoolCount: blockchain.mempool.length,
            mempool: blockchain.mempool,
            telemetry,
            oracle: oracleData,
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

    if (pathname === '/api/wallet/new' && req.method === 'POST') {
        const wallet = new CryptoWallet();
        // Give 100 QCY starting faucet balance from system vault
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
            const { sender, recipient, amount, fee, publicKeyPem, signature } = body;

            const tx = blockchain.addTransaction({
                sender,
                recipient,
                amount: parseFloat(amount),
                fee: parseFloat(fee || 1.0),
                gasLimit: 21000,
                timestamp: Date.now(),
                publicKeyPem,
                signature
            });

            return sendJson(res, 200, {
                success: true,
                message: 'Transaction successfully verified and added to quantum mempool.',
                transaction: tx
            });
        } catch (err) {
            return sendJson(res, 400, {
                success: false,
                error: err.message
            });
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
            return sendJson(res, 500, {
                success: false,
                error: err.message
            });
        }
    }

    // Static Assets
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
    console.log(` 🚀 QUANTUM-CYBERNETIC CRYPTO ENGINE IS ONLINE!`);
    console.log(` 📡 Local Dashboard: http://localhost:${PORT}`);
    console.log(` ⛓️  Consensus: SHA-256 PoW + Quantum Hamiltonian Optimizer`);
    console.log(` 🔄 Cybernetics: Norbert Wiener PID Homeostasis Loop Active`);
    console.log(` 🌐 Live Oracle: Connected to Binance / CoinGecko feeds`);
    console.log(`================================================================`);
});
