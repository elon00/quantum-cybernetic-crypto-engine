const crypto = require('crypto');

/**
 * Chain-Specific Adapter: Internet Computer (ICP)
 * Handles Canister ID routing, Principal conversion, and Candid call serialization.
 */
class IcpAdapter {
    constructor() {
        this.network = 'ic0.app';
    }

    /**
     * Derives a deterministic principal string from a public key buffer
     */
    derivePrincipal(publicKeyBuffer) {
        const hash = crypto.createHash('sha224').update(publicKeyBuffer).digest();
        const withType = Buffer.concat([hash, Buffer.from([0x02])]); // self-authenticating type
        return withType.toString('hex').slice(0, 27) + '-cai';
    }

    /**
     * Serializes a Candid query/update canister call
     */
    buildCanisterCall(canisterId, methodName, candidArgsHex) {
        const callId = 'icp_call_' + crypto.randomBytes(8).toString('hex');
        return {
            callId,
            canisterId,
            methodName,
            argHex: candidArgsHex || '4449444c0000', // Empty Candid IDL
            ingressExpiryNs: (Date.now() + 300000) * 1000000,
            status: 'PREPARED_FOR_INGRESS'
        };
    }
}

module.exports = IcpAdapter;
