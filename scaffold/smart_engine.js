const IpfsStorageEngine = require('../core/ipfs_storage');
const FleekDeployer = require('../core/fleek_deployer');
const QuickNodeProvider = require('../core/quicknode_provider');
const deployEvmContract = require('../scripts/deploy_evm');
const EvmAdapter = require('../adapters/evm_adapter');
const SolanaAdapter = require('../adapters/solana_adapter');
const IcpAdapter = require('../adapters/icp_adapter');

/**
 * QMOOSA Universal Smart Scaffold Engine
 * Unified orchestrator binding:
 * 1. Storage: IPFS Content-Addressed CIDs
 * 2. Deployment: Fleek Global Edge CDN
 * 3. Nodes: QuickNode Multichain RPC & Streams
 * 4. Smart Contracts: Multi-chain automated deployment
 * 5. Adapters: Chain-specific protocol normalization (EVM, Solana, ICP)
 */
class SmartScaffoldEngine {
    constructor(baseDir) {
        this.baseDir = baseDir || process.cwd();
        this.ipfs = new IpfsStorageEngine();
        this.fleek = new FleekDeployer(this.baseDir);
        this.quicknode = new QuickNodeProvider();
        this.adapters = {
            evm: new EvmAdapter(),
            solana: new SolanaAdapter(),
            icp: new IcpAdapter()
        };
    }

    /**
     * Storage Pillar: Pin files or manifests to IPFS
     */
    async storeOnIpfs(name, data) {
        return await this.ipfs.pinData(name, data);
    }

    /**
     * Deployment Pillar: Release frontend and bundle to Fleek Edge
     */
    async deployToFleek() {
        return await this.fleek.prepareDeployment();
    }

    /**
     * Nodes Pillar: Fetch health and live state from QuickNode
     */
    async getQuickNodeStatus(chain = 'base') {
        const block = await this.quicknode.getBlockNumber(chain);
        const gas = await this.quicknode.getGasPrice(chain);
        return {
            chain,
            blockNumber: block,
            gasPriceGwei: gas,
            telemetry: this.quicknode.getHealthStatus()
        };
    }

    /**
     * Smart Contract Pillar: Deploy contracts to target blockchain
     */
    async deployContract(chain = 'base', initialSupply = '100000000') {
        return await deployEvmContract(chain, initialSupply);
    }

    /**
     * Adapter Pillar: Get chain-specific adapter for protocol execution
     */
    getAdapter(chainType = 'evm') {
        const adapter = this.adapters[chainType.toLowerCase()];
        if (!adapter) throw new Error(`Adapter for ${chainType} not found`);
        return adapter;
    }
}

module.exports = SmartScaffoldEngine;
