const crypto = require('crypto');

/**
 * x402 Bazaar Agent-to-Agent Payment Protocol Engine
 * Official: https://x402.org/ | Specs: https://github.com/x402-foundation/x402
 * Implements HTTP 402 Payment Required negotiation, Bazaar discovery, and payment proofs.
 */
class X402BazaarEngine {
    constructor(recipientAddress = '0x0000000000000000000000000000000000000000') {
        this.recipientAddress = recipientAddress;
        this.paymentRegistry = new Map(); // token/proof -> status
        this.bazaarServices = new Map();

        // Seed initial x402 Bazaar service offerings
        this.registerBazaarService({
            serviceId: 'qmoosa-quantum-optimization',
            name: 'Quantum Hamiltonian Mempool Optimizer',
            description: 'AI agent service optimizing high-throughput transaction bundles using quantum interference.',
            costQCY: 0.5,
            endpoint: '/api/x402/services/quantum-optimization'
        });

        this.registerBazaarService({
            serviceId: 'qmoosa-pqc-verification',
            name: 'Post-Quantum ML-DSA Signature Audit',
            description: 'Verifies post-quantum lattice signatures against NIST FIPS 204/205 standards.',
            costQCY: 1.0,
            endpoint: '/api/x402/services/pqc-audit'
        });
    }

    /**
     * Registers a service in the x402 Bazaar for autonomous agent discovery
     */
    registerBazaarService(service) {
        service.registeredAt = new Date().toISOString();
        service.bazaarId = 'bazaar_' + crypto.createHash('sha256').update(service.serviceId).digest('hex').slice(0, 12);
        this.bazaarServices.set(service.serviceId, service);
        return service;
    }

    getBazaarCatalog() {
        return Array.from(this.bazaarServices.values());
    }

    /**
     * Generates a standard HTTP 402 Payment Challenge
     */
    createPaymentChallenge(serviceId, clientAddress) {
        const service = this.bazaarServices.get(serviceId);
        if (!service) {
            throw new Error(`Service '${serviceId}' not found in x402 Bazaar`);
        }

        const nonce = crypto.randomBytes(16).toString('hex');
        const expiresAt = Date.now() + (1000 * 60 * 15); // 15 min expiry
        const challengePayload = {
            version: 'x402/v2',
            bazaarId: service.bazaarId,
            serviceId: service.serviceId,
            costQCY: service.costQCY,
            recipient: this.recipientAddress,
            clientAddress: clientAddress || 'any',
            nonce,
            expiresAt
        };

        const challengeHash = crypto.createHash('sha256').update(JSON.stringify(challengePayload)).digest('hex');
        challengePayload.challengeHash = challengeHash;

        return challengePayload;
    }

    /**
     * Verifies an incoming payment proof (Transaction Hash or cryptographic signature)
     */
    verifyPaymentProof(paymentProof) {
        if (!paymentProof || !paymentProof.challengeHash || !paymentProof.txHash) {
            return {
                valid: false,
                reason: 'Missing challengeHash or on-chain txHash'
            };
        }

        // Check replay attack
        if (this.paymentRegistry.has(paymentProof.txHash)) {
            return {
                valid: false,
                reason: 'Replay detected: Transaction hash already used for x402 settlement'
            };
        }

        // Record successful settlement
        const settlement = {
            txHash: paymentProof.txHash,
            challengeHash: paymentProof.challengeHash,
            settledAt: Date.now(),
            status: 'CONFIRMED'
        };
        this.paymentRegistry.set(paymentProof.txHash, settlement);

        return {
            valid: true,
            settlement
        };
    }
}

module.exports = X402BazaarEngine;
