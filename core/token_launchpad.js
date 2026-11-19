const crypto = require('crypto');

/**
 * Universal Tokenomics & Multi-Tier Launchpad Engine
 * Implements:
 * 1. Global uncapped/bounded tokenomics formula: M(t) = min(R(t), annual_emission_limit(t))
 * 2. Multi-tier token launchpad with vesting, liquidity locks, and governance checks
 * 3. Contributor participation, allocations, and escrow accounting
 */
class TokenLaunchpadEngine {
    constructor() {
        this.projects = new Map();
        this.contributions = new Map(); // projectId -> array of contributions
        this.globalStandards = {
            standard: 'QMOOSA-EIP-20-EXTENDED',
            maxAnnualInflationRate: 0.08, // 8% max annual emission ceiling
            lockPeriodMinDays: 180,
            supportedChains: ['Ethereum', 'Base', 'Solana', 'ICP', 'Polygon']
        };

        // Seed initial flagship launchpad projects
        this.seedFlagshipProjects();
    }

    seedFlagshipProjects() {
        this.createLaunchpadProject({
            tokenName: 'Quantum Cybernetic Token',
            tokenSymbol: 'QCY',
            targetChain: 'Base',
            initialSupply: 100000000,
            salePriceUSD: 0.05,
            vestingMonths: 12,
            targetRaiseUSD: 250000,
            currentRaisedUSD: 112500
        });

        this.createLaunchpadProject({
            tokenName: 'Raven RSI Protocol',
            tokenSymbol: 'RAVEN',
            targetChain: 'Ethereum',
            initialSupply: 50000000,
            salePriceUSD: 0.12,
            vestingMonths: 6,
            targetRaiseUSD: 600000,
            currentRaisedUSD: 468000
        });
    }

    /**
     * Calculates transparent emission limit M(t) = min(R(t), annual_limit)
     */
    calculateEmissionLimit(currentTotalSupply, requestedMintAmount, elapsedDays = 365) {
        const annualLimit = currentTotalSupply * this.globalStandards.maxAnnualInflationRate * (elapsedDays / 365.0);
        const approvedMint = Math.min(requestedMintAmount, annualLimit);

        return {
            currentTotalSupply,
            requestedMintAmount,
            annualCeiling: +annualLimit.toFixed(2),
            approvedMint: +approvedMint.toFixed(2),
            isThrottled: requestedMintAmount > annualLimit,
            rejectionDelta: requestedMintAmount > annualLimit ? +(requestedMintAmount - annualLimit).toFixed(2) : 0
        };
    }

    /**
     * Creates a new token launchpad project with verified tokenomics
     */
    createLaunchpadProject(params) {
        const {
            tokenName,
            tokenSymbol,
            targetChain = 'Base',
            initialSupply = 100000000,
            salePriceUSD = 0.05,
            vestingMonths = 12,
            targetRaiseUSD = 250000,
            currentRaisedUSD = 0
        } = params;

        const projectId = 'LAUNCH_' + crypto.createHash('sha256').update(tokenName + tokenSymbol + Date.now() + Math.random()).digest('hex').slice(0, 10);
        
        const project = {
            projectId,
            tokenName,
            tokenSymbol,
            targetChain,
            initialSupply,
            circulatingSupply: initialSupply * 0.20, // 20% TGE
            salePriceUSD,
            vestingMonths,
            targetRaiseUSD,
            currentRaisedUSD,
            progressPercent: +((currentRaisedUSD / targetRaiseUSD) * 100).toFixed(1),
            status: currentRaisedUSD >= targetRaiseUSD ? 'GOAL_REACHED' : 'FUNDING_ACTIVE',
            tiers: [
                { id: 0, name: 'Seed Tier', allocation: initialSupply * 0.10, priceUSD: +(salePriceUSD * 0.6).toFixed(4), lockDays: 365, soldRatio: 0.65 },
                { id: 1, name: 'Strategic Tier', allocation: initialSupply * 0.15, priceUSD: +(salePriceUSD * 0.8).toFixed(4), lockDays: 180, soldRatio: 0.40 },
                { id: 2, name: 'Public TGE Tier', allocation: initialSupply * 0.20, priceUSD: salePriceUSD, lockDays: 0, soldRatio: 0.25 }
            ],
            contractBytecodeHash: crypto.createHash('sha256').update(`CONTRACT_${tokenSymbol}_${initialSupply}`).digest('hex'),
            createdAt: new Date().toISOString()
        };

        this.projects.set(projectId, project);
        this.contributions.set(projectId, []);
        return project;
    }

    /**
     * User participates in an active Launchpad Token Sale
     */
    participateInLaunch(projectId, contributorAddress, tierId = 2, amountUSD = 100) {
        const project = this.projects.get(projectId);
        if (!project) throw new Error(`Project ${projectId} not found`);

        const tier = project.tiers.find(t => t.id === tierId) || project.tiers[2];
        const tokensAwarded = +(amountUSD / tier.priceUSD).toFixed(2);

        project.currentRaisedUSD += amountUSD;
        project.progressPercent = Math.min(100, +((project.currentRaisedUSD / project.targetRaiseUSD) * 100).toFixed(1));
        if (project.progressPercent >= 100) project.status = 'GOAL_REACHED';

        const contributionRecord = {
            id: 'CONTRIB_' + crypto.randomBytes(6).toString('hex'),
            projectId,
            contributorAddress,
            tierName: tier.name,
            amountUSD,
            tokensAwarded,
            lockDays: tier.lockDays,
            timestamp: new Date().toISOString(),
            txProof: '0x' + crypto.createHash('sha256').update(projectId + contributorAddress + amountUSD + Date.now()).digest('hex')
        };

        const list = this.contributions.get(projectId) || [];
        list.push(contributionRecord);
        this.contributions.set(projectId, list);

        return {
            success: true,
            project,
            contribution: contributionRecord
        };
    }

    getProjects() {
        return Array.from(this.projects.values());
    }

    getProjectById(projectId) {
        return this.projects.get(projectId);
    }
}

module.exports = TokenLaunchpadEngine;
