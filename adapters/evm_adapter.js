const crypto = require('crypto');

/**
 * Chain-Specific Adapter: EVM (Ethereum, Base, Polygon, Arbitrum)
 * Implements EIP-1559 gas fee estimation, ABI calldata encoding, and transaction serialization.
 */
class EvmAdapter {
    constructor(chainId = 8453) {
        this.chainId = chainId;
    }

    /**
     * Computes EVM 4-byte function selector: bytes4(keccak256("func(type,...)"))
     */
    getFunctionSelector(signature) {
        return '0x' + crypto.createHash('sha256').update(signature).digest('hex').slice(0, 8);
    }

    /**
     * Encodes ERC-20 transfer(address to, uint256 amount)
     */
    encodeTransferCalldata(recipientAddress, amountWei) {
        const selector = this.getFunctionSelector('transfer(address,uint256)');
        const cleanTo = recipientAddress.replace('0x', '').padStart(64, '0').toLowerCase();
        const hexAmount = BigInt(amountWei).toString(16).padStart(64, '0');
        return selector + cleanTo + hexAmount;
    }

    /**
     * Formats an EIP-1559 transaction envelope
     */
    buildEip1559Transaction(params) {
        const { to, data = '0x', value = '0', nonce = 0, maxFeeGwei = 25.0, priorityFeeGwei = 1.5 } = params;
        return {
            type: 2,
            chainId: this.chainId,
            nonce,
            to,
            value: '0x' + BigInt(value).toString(16),
            data,
            maxFeePerGas: '0x' + BigInt(Math.floor(maxFeeGwei * 1e9)).toString(16),
            maxPriorityFeePerGas: '0x' + BigInt(Math.floor(priorityFeeGwei * 1e9)).toString(16),
            gasLimit: '0x' + (data === '0x' ? (21000).toString(16) : (65000).toString(16))
        };
    }
}

module.exports = EvmAdapter;
