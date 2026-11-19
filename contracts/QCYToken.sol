// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QCY Quantum-Cybernetic Utility Token
 * @dev ERC-20 Token with transparent, governed unbounded emission schedule:
 * Formula: M(t) = min(R(t), annual_emission_limit(t))
 */
contract QCYToken {
    string public constant name = "Quantum Cybernetic";
    string public constant symbol = "QCY";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    address public owner;
    address public governanceTimelock;

    uint256 public constant MAX_ANNUAL_EMISSION_BPS = 800; // 8% per year maximum ceiling
    uint256 public lastMintTimestamp;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event GovernedMint(address indexed to, uint256 requestedAmount, uint256 approvedAmount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    modifier onlyGovernance() {
        require(msg.sender == governanceTimelock || msg.sender == owner, "Only governance can mint");
        _;
    }

    constructor(uint256 initialSupply) {
        owner = msg.sender;
        governanceTimelock = msg.sender;
        lastMintTimestamp = block.timestamp;
        _mint(msg.sender, initialSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "Cannot transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");

        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    /**
     * @notice Governed unbounded emission function enforcing M(t) = min(R(t), annual_limit)
     */
    function governedMint(address to, uint256 requestedAmount) external onlyGovernance returns (uint256) {
        uint256 elapsed = block.timestamp - lastMintTimestamp;
        require(elapsed > 0, "Minting cooldown active");

        // Calculate annual ceiling: totalSupply * 8% * (elapsed / 365 days)
        uint256 annualCeiling = (totalSupply * MAX_ANNUAL_EMISSION_BPS * elapsed) / (10000 * 365 days);
        uint256 approvedAmount = requestedAmount < annualCeiling ? requestedAmount : annualCeiling;

        lastMintTimestamp = block.timestamp;
        _mint(to, approvedAmount);

        emit GovernedMint(to, requestedAmount, approvedAmount);
        return approvedAmount;
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "Mint to zero address");
        totalSupply += amount;
        balanceOf[account] += amount;
        emit Transfer(address(0), account, amount);
    }
}
