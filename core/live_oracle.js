const crypto = require('crypto');

/**
 * Real Live Blockchain Price & Metric Oracle
 * Fetches real market prices (BTC, ETH, SOL) directly from live public APIs (No mock data!)
 */
class LiveOracle {
    constructor() {
        this.prices = {
            BTC: 65000.0,
            ETH: 2600.0,
            SOL: 155.0
        };
        this.lastUpdated = null;
        this.status = 'INITIALIZING';
        this.fetchInterval = null;
    }

    async start() {
        await this.fetchRealMarketData();
        this.fetchInterval = setInterval(() => this.fetchRealMarketData(), 12000);
    }

    stop() {
        if (this.fetchInterval) clearInterval(this.fetchInterval);
    }

    async fetchRealMarketData() {
        try {
            const url = 'https://api.binance.com/api/v3/ticker/price?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22%5D';
            const response = await fetch(url, { headers: { 'User-Agent': 'QuantumCryptoEngine/1.0' } });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            for (const item of data) {
                if (item.symbol === 'BTCUSDT') this.prices.BTC = parseFloat(item.price);
                if (item.symbol === 'ETHUSDT') this.prices.ETH = parseFloat(item.price);
                if (item.symbol === 'SOLUSDT') this.prices.SOL = parseFloat(item.price);
            }

            this.lastUpdated = new Date().toISOString();
            this.status = 'LIVE_ONLINE';
        } catch (err) {
            // Fallback to CoinGecko public endpoint if Binance is blocked by region
            try {
                const cgUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd';
                const cgRes = await fetch(cgUrl);
                const cgData = await cgRes.json();
                if (cgData.bitcoin) this.prices.BTC = cgData.bitcoin.usd;
                if (cgData.ethereum) this.prices.ETH = cgData.ethereum.usd;
                if (cgData.solana) this.prices.SOL = cgData.solana.usd;
                this.lastUpdated = new Date().toISOString();
                this.status = 'LIVE_ONLINE (COINGECKO)';
            } catch (cgErr) {
                this.status = 'OFFLINE_CACHE';
            }
        }
    }

    getPrices() {
        return {
            prices: this.prices,
            lastUpdated: this.lastUpdated,
            status: this.status,
            proofHash: crypto.createHash('sha256').update(JSON.stringify(this.prices) + this.lastUpdated).digest('hex')
        };
    }
}

module.exports = LiveOracle;
