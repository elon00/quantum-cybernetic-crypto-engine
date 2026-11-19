const crypto = require('crypto');

/**
 * Chain-Specific Adapter: Solana (SVM Architecture)
 * Handles instruction serialization, recent blockhashes, and Base58 conversion.
 */
class SolanaAdapter {
    constructor(network = 'mainnet-beta') {
        this.network = network;
        this.systemProgramId = '11111111111111111111111111111111';
    }

    /**
     * Serializes a native SOL transfer instruction
     */
    buildTransferInstruction(fromPubkey, toPubkey, lamports) {
        // System Program Transfer Instruction Index = 2
        const data = Buffer.alloc(12);
        data.writeUInt32LE(2, 0); // Instruction enum 2 = Transfer
        data.writeBigUInt64LE(BigInt(lamports), 4);

        return {
            programId: this.systemProgramId,
            keys: [
                { pubkey: fromPubkey, isSigner: true, isWritable: true },
                { pubkey: toPubkey, isSigner: false, isWritable: true }
            ],
            dataHex: data.toString('hex')
        };
    }

    /**
     * Builds a simulated Solana transaction payload
     */
    buildTransaction(instructions, feePayer, recentBlockhash) {
        const blockhash = recentBlockhash || crypto.createHash('sha256').update(Date.now().toString()).digest('hex').slice(0, 44);
        return {
            version: 'legacy',
            feePayer,
            recentBlockhash: blockhash,
            instructions,
            signatures: []
        };
    }
}

module.exports = SolanaAdapter;
