const crypto = require('crypto');

/**
 * Real Cryptographic Wallet & ECDSA Signature Engine
 * Uses secp256k1 elliptic curve cryptography (same as Bitcoin & Ethereum)
 */
class CryptoWallet {
    constructor() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
            namedCurve: 'secp256k1',
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.address = this.deriveAddress(publicKey);
    }

    /**
     * Derives a deterministic cryptocurrency address from secp256k1 public key
     */
    deriveAddress(publicKeyPem) {
        const rawKey = publicKeyPem
            .replace('-----BEGIN PUBLIC KEY-----', '')
            .replace('-----END PUBLIC KEY-----', '')
            .replace(/\s+/g, '');
        const sha = crypto.createHash('sha256').update(rawKey).digest();
        const ripemd = crypto.createHash('ripemd160').update(sha).digest('hex');
        return '0x' + ripemd;
    }

    /**
     * Signs any payload string using ECDSA secp256k1 + SHA-256
     */
    sign(data) {
        const sign = crypto.createSign('SHA256');
        sign.update(typeof data === 'string' ? data : JSON.stringify(data));
        sign.end();
        return sign.sign(this.privateKey, 'hex');
    }

    /**
     * Verifies ECDSA secp256k1 digital signature against public key
     */
    static verify(data, signatureHex, publicKeyPem) {
        try {
            const verify = crypto.createVerify('SHA256');
            verify.update(typeof data === 'string' ? data : JSON.stringify(data));
            verify.end();
            return verify.verify(publicKeyPem, signatureHex, 'hex');
        } catch (err) {
            return false;
        }
    }
}

module.exports = CryptoWallet;
