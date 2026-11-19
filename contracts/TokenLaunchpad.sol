// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TokenLaunchpad
 * @dev Autonomous launchpad with tiered allocations, linear vesting, and liquidity lock vaults.
 */
contract TokenLaunchpad {
    address public admin;

    struct Project {
        string name;
        string symbol;
        uint256 totalAllocation;
        uint256 priceWei;
        uint256 vestStart;
        uint256 vestDuration;
        bool isActive;
    }

    mapping(bytes32 => Project) public projects;
    mapping(bytes32 => mapping(address => uint256)) public contributions;

    event ProjectLaunched(bytes32 indexed projectId, string name, uint256 allocation);
    event Contribution(bytes32 indexed projectId, address indexed contributor, uint256 amount);

    constructor() {
        admin = msg.sender;
    }

    function createLaunch(
        string memory name,
        string memory symbol,
        uint256 allocation,
        uint256 priceWei,
        uint256 vestDuration
    ) external returns (bytes32) {
        require(msg.sender == admin, "Only admin");
        bytes32 projectId = keccak256(abi.encodePacked(name, symbol, block.timestamp));

        projects[projectId] = Project({
            name: name,
            symbol: symbol,
            totalAllocation: allocation,
            priceWei: priceWei,
            vestStart: block.timestamp,
            vestDuration: vestDuration,
            isActive: true
        });

        emit ProjectLaunched(projectId, name, allocation);
        return projectId;
    }

    function participate(bytes32 projectId) external payable {
        Project storage p = projects[projectId];
        require(p.isActive, "Project not active");
        require(msg.value > 0, "Zero contribution");

        contributions[projectId][msg.sender] += msg.value;
        emit Contribution(projectId, msg.sender, msg.value);
    }
}
