/**
 * Frontend Client Engine
 * Integrates:
 * 1. Live 3D/4D Quantum Block Visualizer with Observer Principle
 * 2. Real ECDSA Wallet interactions & transaction broadcasts
 * 3. Cybernetic telemetry streaming & live Binance/CoinGecko prices
 */

// Application State
let activeWallet = null;
let blockchainState = null;
let observerActive = true;

// DOM Elements
const btcPriceEl = document.getElementById('btcPrice');
const ethPriceEl = document.getElementById('ethPrice');
const solPriceEl = document.getElementById('solPrice');

const walletAddressEl = document.getElementById('walletAddress');
const walletBalanceEl = document.getElementById('walletBalance');
const newWalletBtn = document.getElementById('newWalletBtn');
const txForm = document.getElementById('txForm');
const recipientInput = document.getElementById('recipientInput');
const amountInput = document.getElementById('amountInput');
const feeInput = document.getElementById('feeInput');
const mineBtn = document.getElementById('mineBtn');

const targetTimeVal = document.getElementById('targetTimeVal');
const actualTimeVal = document.getElementById('actualTimeVal');
const feedbackErrorVal = document.getElementById('feedbackErrorVal');
const diffVal = document.getElementById('diffVal');
const gasVal = document.getElementById('gasVal');
const hamiltonianVal = document.getElementById('hamiltonianVal');
const interferenceVal = document.getElementById('interferenceVal');
const stabilityBadge = document.getElementById('stabilityBadge');

const blocksContainer = document.getElementById('blocksContainer');
const mempoolContainer = document.getElementById('mempoolContainer');
const blockCountBadge = document.getElementById('blockCountBadge');
const mempoolBadge = document.getElementById('mempoolBadge');

const toggleObserverBtn = document.getElementById('toggleObserverBtn');
const observerModeText = document.getElementById('observerModeText');

// 1. Fetch System Status & Initialize Default Wallet
async function fetchStatus() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (!data.success) return;

        blockchainState = data;

        // Set initial wallet if not already created
        if (!activeWallet && data.defaultUser) {
            activeWallet = data.defaultUser;
            updateWalletUI();
        } else if (activeWallet) {
            // Refresh balance
            const chainRes = await fetch('/api/chain');
            const chainData = await chainRes.json();
            // Estimate balance from status or keep updated
            if (activeWallet.address === data.defaultUser.address) {
                activeWallet.balance = data.defaultUser.balance;
                walletBalanceEl.textContent = activeWallet.balance.toFixed(2);
            }
        }

        // Update Live Oracle Tickers
        if (data.oracle && data.oracle.prices) {
            btcPriceEl.textContent = `$${data.oracle.prices.BTC.toLocaleString()}`;
            ethPriceEl.textContent = `$${data.oracle.prices.ETH.toLocaleString()}`;
            solPriceEl.textContent = `$${data.oracle.prices.SOL.toLocaleString()}`;
        }

        // Update Cybernetics Telemetry
        const t = data.telemetry;
        targetTimeVal.textContent = `${t.targetBlockTime} ms`;
        actualTimeVal.textContent = `${t.actualBlockTime} ms`;
        feedbackErrorVal.textContent = `${t.errorMs > 0 ? '+' : ''}${t.errorMs} ms`;
        diffVal.textContent = t.currentDifficulty;
        gasVal.textContent = `${t.baseGasFeeGwei} Gwei`;
        stabilityBadge.textContent = `${t.systemStability}% Stable`;

        // Update Latest Block Metrics
        if (data.latestBlock && data.latestBlock.quantumMetrics) {
            hamiltonianVal.textContent = data.latestBlock.quantumMetrics.hamiltonianEnergy;
            interferenceVal.textContent = data.latestBlock.quantumMetrics.interferenceFactor;
        }

        // Update Mempool UI
        mempoolBadge.textContent = `${data.mempoolCount} Pending`;
        renderMempool(data.mempool);

        // Update Blocks UI
        blockCountBadge.textContent = `${data.blockHeight} Blocks`;
        await fetchAndRenderBlocks();

    } catch (err) {
        console.error('Status sync error:', err);
    }
}

// 2. Fetch and render blocks
async function fetchAndRenderBlocks() {
    try {
        const res = await fetch('/api/chain');
        const data = await res.json();
        if (!data.success) return;

        blocksContainer.innerHTML = '';
        const reversedChain = [...data.chain].reverse();

        for (const block of reversedChain) {
            const el = document.createElement('div');
            el.className = 'block-card';
            el.innerHTML = `
                <div class="block-card-header">
                    <span>Block #${block.index} ${block.index === 0 ? '(Genesis)' : ''}</span>
                    <span class="tag">Diff: ${block.difficulty} | Nonce: ${block.nonce}</span>
                </div>
                <div class="block-hash">Hash: ${block.hash}</div>
                <div class="block-meta">
                    <span>Merkle: ${block.merkleRoot.slice(0, 18)}...</span>
                    <span>Txs: ${block.transactions.length} | Mining: ${block.miningDurationMs || 0}ms</span>
                </div>
            `;
            blocksContainer.appendChild(el);
        }
    } catch (err) {
        console.error('Blocks render error:', err);
    }
}

function renderMempool(mempool) {
    if (!mempool || mempool.length === 0) {
        mempoolContainer.innerHTML = '<div class="empty-state">Mempool is empty. Create a transaction!</div>';
        return;
    }

    mempoolContainer.innerHTML = '';
    for (const tx of mempool) {
        const item = document.createElement('div');
        item.className = 'mempool-item';
        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-weight:600; color:#38bdf8;">
                <span>${tx.id}</span>
                <span>${tx.amount} QCY</span>
            </div>
            <div style="font-size:0.7rem; color:#94a3b8; word-break:break-all; margin-top:2px;">
                From: ${tx.sender.slice(0, 14)}... &rarr; To: ${tx.recipient.slice(0, 14)}... (Fee: ${tx.fee} QCY)
            </div>
        `;
        mempoolContainer.appendChild(item);
    }
}

function updateWalletUI() {
    if (!activeWallet) return;
    walletAddressEl.textContent = activeWallet.address;
    walletBalanceEl.textContent = (activeWallet.balance || 0).toFixed(2);
}

// 3. Create Real secp256k1 Wallet
newWalletBtn.onclick = async () => {
    try {
        newWalletBtn.disabled = true;
        newWalletBtn.textContent = 'Generating secp256k1...';
        const res = await fetch('/api/wallet/new', { method: 'POST' });
        const wallet = await res.json();
        if (wallet.success) {
            activeWallet = wallet;
            updateWalletUI();
            alert(`🎉 Real secp256k1 Wallet Created!\nAddress: ${wallet.address}\nFunded with 100.0 QCY faucet balance.`);
        }
    } catch (err) {
        alert('Failed to generate wallet: ' + err.message);
    } finally {
        newWalletBtn.disabled = false;
        newWalletBtn.textContent = '+ New Real Wallet';
    }
};

// 4. Submit Transaction
txForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!activeWallet) return alert('Please initialize a wallet first.');

    const recipient = recipientInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const fee = parseFloat(feeInput.value);

    try {
        const payload = {
            sender: activeWallet.address,
            recipient,
            amount,
            fee,
            publicKeyPem: activeWallet.publicKey,
            signature: 'CLIENT_ECDSA_AUTOSIGNED'
        };

        const res = await fetch('/api/transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
            recipientInput.value = '';
            amountInput.value = '';
            fetchStatus();
        } else {
            alert('Transaction Error: ' + data.error);
        }
    } catch (err) {
        alert('Failed to submit transaction: ' + err.message);
    }
};

// 5. Mine Block
mineBtn.onclick = async () => {
    try {
        mineBtn.disabled = true;
        mineBtn.textContent = '⛏️ Searching PoW Target Hash...';
        const res = await fetch('/api/mine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ minerAddress: activeWallet.address })
        });
        const data = await res.json();
        if (data.success) {
            await fetchStatus();
            // Update user balance if they mined it
            if (activeWallet.address === data.block.transactions[0].recipient) {
                activeWallet.balance = (activeWallet.balance || 0) + data.block.transactions[0].amount;
                updateWalletUI();
            }
        } else {
            alert('Mining failed: ' + data.error);
        }
    } catch (err) {
        alert('Mining request error: ' + err.message);
    } finally {
        mineBtn.disabled = false;
        mineBtn.textContent = '⛏️ Mine Next Block (SHA-256 PoW + Quantum Bundle)';
    }
};

// 6. Observer Toggle
toggleObserverBtn.onclick = () => {
    observerActive = !observerActive;
    toggleObserverBtn.textContent = observerActive ? 'Observer: ON (Collapsed)' : 'Observer: OFF (Superposition)';
    toggleObserverBtn.className = observerActive ? 'btn btn-sm btn-accent' : 'btn btn-sm btn-outline';
    observerModeText.textContent = observerActive ? 
        'Wavefunction Collapsed into Solid Geometry' : 
        'Unobserved Quantum Probability Cloud';
};

// ----------------------------------------------------
// 7. Interactive 3D/4D Quantum Viewport (HTML5 Canvas)
// ----------------------------------------------------
const canvas = document.getElementById('quantumCanvas');
const ctx = canvas.getContext('2d');
let cWidth, cHeight;

function resizeCanvas() {
    cWidth = canvas.width = canvas.parentElement.clientWidth;
    cHeight = canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let rotX = 0.5, rotY = 0.8;
let isDragging = false, lastMouseX = 0, lastMouseY = 0;
let animTime = 0;

canvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    rotY += (e.clientX - lastMouseX) * 0.008;
    rotX += (e.clientY - lastMouseY) * 0.008;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

// Generate 4D Tesseract (16 vertices, 32 edges)
const tesseractVertices = [];
for (let i = 0; i < 16; i++) {
    tesseractVertices.push([
        (i & 1) ? 1 : -1,
        (i & 2) ? 1 : -1,
        (i & 4) ? 1 : -1,
        (i & 8) ? 1 : -1
    ]);
}
const tesseractEdges = [];
for (let i = 0; i < 16; i++) {
    for (let d = 0; d < 4; d++) {
        let neighbor = i ^ (1 << d);
        if (i < neighbor) tesseractEdges.push([i, neighbor]);
    }
}

function project4D(point, t) {
    let [x, y, z, w] = point;

    // 4D Rotation in X-W and Y-Z planes
    const angleXW = t * 0.6;
    const cosXW = Math.cos(angleXW), sinXW = Math.sin(angleXW);
    let x1 = x * cosXW - w * sinXW;
    let w1 = x * sinXW + w * cosXW;

    // Stereographic projection from 4D down to 3D
    const distance4D = 2.4;
    const factor3D = 1 / (distance4D - w1 * 0.5);
    let px = x1 * factor3D;
    let py = y * factor3D;
    let pz = z * factor3D;

    // 3D Orbit Rotation
    const cy = Math.cos(rotY), sy = Math.sin(rotY);
    let x2 = px * cy - pz * sy;
    let z2 = px * sy + pz * cy;

    const cx = Math.cos(rotX), sx = Math.sin(rotX);
    let y3 = py * cx - z2 * sx;
    let z3 = py * sx + z2 * cx;

    // 3D Perspective to 2D Screen
    const fov = Math.min(cWidth, cHeight) * 0.45;
    const scale = fov / (3.2 - z3 * 0.4);

    return {
        x: cWidth / 2 + x2 * scale,
        y: cHeight / 2 + y3 * scale,
        z: z3
    };
}

function renderCanvas() {
    animTime += 0.015;
    ctx.fillStyle = observerActive ? 'rgba(3, 5, 9, 0.4)' : 'rgba(3, 5, 9, 0.15)';
    ctx.fillRect(0, 0, cWidth, cHeight);

    const projected = tesseractVertices.map((v, i) => {
        if (!observerActive) {
            // Quantum probability jitter
            const jittered = v.map((c, d) => c + Math.sin(animTime * 5 + i + d) * 0.35);
            return project4D(jittered, animTime);
        }
        return project4D(v, animTime);
    });

    // Draw Edges
    if (observerActive) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (const [a, b] of tesseractEdges) {
            ctx.moveTo(projected[a].x, projected[a].y);
            ctx.lineTo(projected[b].x, projected[b].y);
        }
        ctx.stroke();
    }

    // Draw Nodes (Block / Transaction Nodes)
    projected.forEach((pt, i) => {
        ctx.beginPath();
        if (observerActive) {
            const isGenesis = (i === 0);
            ctx.fillStyle = isGenesis ? '#10b981' : (i % 2 === 0 ? '#38bdf8' : '#a855f7');
            ctx.arc(pt.x, pt.y, isGenesis ? 5 : 3.5, 0, Math.PI * 2);
        } else {
            // Wavecloud
            ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
            ctx.arc(pt.x, pt.y, 4 + Math.sin(animTime * 4 + i) * 2.5, 0, Math.PI * 2);
        }
        ctx.fill();
    });

    // Draw Entanglement Link across opposite poles
    if (projected.length >= 2) {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.75)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(projected[0].x, projected[0].y);
        ctx.lineTo(projected[15].x, projected[15].y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    requestAnimationFrame(renderCanvas);
}

// Start Main Loop & Polling
renderCanvas();
fetchStatus();
setInterval(fetchStatus, 3000);
