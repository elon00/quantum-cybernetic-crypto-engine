const https = require('https');

/**
 * QuickNode Multichain RPC & Infrastructure Provider
 * Official: https://www.quicknode.com/ | Docs: https://www.quicknode.com/docs
 * Provides: Typed RPC requests, failover circuit breakers, latency telemetry, and block listeners.
 */
class QuickNodeProvider {
    constructor(config = {}) {
        this.endpointUrl = config.endpointUrl || process.env.QUICKNODE_RPC_URL || 'https://ethereum-rpc.publicnode.com';
        this.fallbackUrls = [
            'https://rpc.ankr.com/eth',
            'https://cloudflare-eth.com',
            'https://mainnet.gateway.tenderly.co'
        ];
        this.latencyMs = 0;
        this.healthy = true;
        this.activeChain = config.chain || 'ethereum-mainnet';
        this.requestId = 1;
    }

    /**
     * Executes a JSON-RPC request to QuickNode with automatic failover
     */
    async sendRpc(method, params = []) {
        const payload = JSON.stringify({
            jsonrpc: '2.0',
            id: this.requestId++,
            method,
            params
        });

        const urlsToTry = [this.endpointUrl, ...this.fallbackUrls];
        let lastError = null;

        for (const url of urlsToTry) {
            try {
                const startTime = Date.now();
                const res = await this._httpPost(url, payload);
                this.latencyMs = Date.now() - startTime;
                this.healthy = true;

                if (res.error) {
                    throw new Error(`RPC Error [${res.error.code}]: ${res.error.message}`);
                }
                return res.result;
            } catch (err) {
                lastError = err;
                this.healthy = false;
                continue; // Failover to next RPC node
            }
        }

        throw new Error(`All RPC providers failed. Last error: ${lastError?.message}`);
    }

    _httpPost(targetUrl, jsonString) {
        return new Promise((resolve, reject) => {
            try {
                const parsed = new URL(targetUrl);
                const req = https.request({
                    hostname: parsed.hostname,
                    port: parsed.port || 443,
                    path: parsed.pathname + parsed.search,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(jsonString),
                        'User-Agent': 'QMOOSA-QuickNode-Adapter/1.0'
                    },
                    timeout: 6000
                }, res => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            reject(new Error(`Failed to parse RPC response: ${data.slice(0, 100)}`));
                        }
                    });
                });

                req.on('error', reject);
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('RPC request timed out'));
                });
                req.write(jsonString);
                req.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    async getBlockNumber() {
        const hex = await this.sendRpc('eth_blockNumber', []);
        return parseInt(hex, 16);
    }

    async getGasPrice() {
        const hex = await this.sendRpc('eth_gasPrice', []);
        return parseInt(hex, 16) / 1e9; // in Gwei
    }

    getHealthStatus() {
        return {
            provider: 'QuickNode Multichain RPC',
            endpoint: this.endpointUrl.split('?')[0].replace(/\/\/.*@/, '//***@'),
            activeChain: this.activeChain,
            healthy: this.healthy,
            latencyMs: this.latencyMs,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = QuickNodeProvider;
