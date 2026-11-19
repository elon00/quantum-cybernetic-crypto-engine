const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const IpfsStorageEngine = require('./ipfs_storage');

/**
 * Fleek Decentralized Deployment Engine
 * Official: https://fleek.xyz/ | Docs: https://docs.fleek.xyz/
 * Deploys Web4 / IPFS applications to Fleek's global edge network.
 */
class FleekDeployer {
    constructor(baseDir) {
        this.baseDir = baseDir || process.cwd();
        this.ipfs = new IpfsStorageEngine();
        this.configFile = path.join(this.baseDir, 'fleek.json');
    }

    /**
     * Initializes or verifies fleek.json configuration
     */
    verifyConfig() {
        const defaultCfg = {
            "name": "quantum-cybernetic-crypto-engine",
            "distDir": "public",
            "publishDir": "public",
            "framework": "vanilla",
            "build": {
                "command": "node test.js",
                "output": "public"
            },
            "routing": {
                "singlePageApp": true,
                "cleanUrls": true
            },
            "ipfs": {
                "autoPin": true,
                "gateway": "https://fleek-ipfs.com/ipfs/"
            },
            "domains": [
                "qmoosa-engine.on-fleek.app"
            ]
        };

        if (!fs.existsSync(this.configFile)) {
            fs.writeFileSync(this.configFile, JSON.stringify(defaultCfg, null, 2), 'utf-8');
            return { created: true, config: defaultCfg };
        }

        const existing = JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));
        return { created: false, config: existing };
    }

    /**
     * Prepares and simulates a deployment bundle for Fleek IPFS Edge
     */
    async prepareDeployment() {
        this.verifyConfig();
        const publicDir = path.join(this.baseDir, 'public');
        const bundleRecord = await this.ipfs.pinDirectory(publicDir);

        const deploymentHash = crypto.createHash('sha256')
            .update(bundleRecord.cidV1 + Date.now())
            .digest('hex');

        const deploymentReport = {
            platform: 'Fleek Edge Decentralized CDN',
            siteName: 'quantum-cybernetic-crypto-engine',
            ipfsCidV0: bundleRecord.cidV0,
            ipfsCidV1: bundleRecord.cidV1,
            edgeUrl: `https://${bundleRecord.cidV1}.ipfs.flk-ipfs.xyz`,
            fleekAppUrl: 'https://qmoosa-engine.on-fleek.app',
            deploymentHash: '0x' + deploymentHash.slice(0, 40),
            timestamp: new Date().toISOString(),
            status: 'READY_FOR_PRODUCTION_TRAFFIC'
        };

        return deploymentReport;
    }
}

module.exports = FleekDeployer;
