// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";
import "@maticnetwork/fx-portal/contracts/examples/erc721-transfer/FxERC721ChildTunnel.sol";
import "hardhat/console.sol";

contract SideChain is AutomationCompatibleInterface, FxERC721ChildTunnel {
    mapping(bytes32 => bool) public hashes;

    // Global variables
    bytes32[] public pendingHashes; // Hashes that are pending to be stored on the main chain

    uint256 public mainchainTimeStamp; // Last time the contract was called
    uint256 public mainchainInterval; // Interval between calls to the contract

    uint256 public sidechainTimeStamp; // Last time the contract was called
    uint256 public sidechainInterval; // Interval between calls to the contract

    event HashesStored(bytes32[] indexed _hash);
    event HasherRequired();
    event BridingRequired();

    constructor(
        uint256 _sideChainInterval,
        uint256 _mainChainInterval,
        address _fxChild,
        address _fxERC721Token
    ) FxERC721ChildTunnel(_fxChild, _fxERC721Token) {
        sidechainInterval = _sideChainInterval;
        mainchainInterval = _mainChainInterval;
        sidechainTimeStamp = block.timestamp;
        mainchainTimeStamp = block.timestamp;
    }

    function storeHashes(bytes32[] calldata _hashes) external {
        for (uint i = 0; i < _hashes.length; i++) {
            bytes32 hash = _hashes[i];
            require(!hashes[hash], "Hash already stored");
            hashes[hash] = true;
            pendingHashes.push(hash);
        }
        emit HashesStored(_hashes);
    }

    // This function is called to get the hashes that are pending to be stored on the main chain
    function getPendingHashes() public view returns (bytes32[] memory) {
        return pendingHashes;
    }

    // This function resets the pending hashes array
    function resetPendingHashes() external {
        // Reset the pending hashes array
        pendingHashes = new bytes32[](0);
    }

    // This function is used by the Chainlink node to check if the contract needs to be called
    // It returns true if the contract needs to be called
    function checkUpkeep(
        bytes calldata
    ) external view override returns (bool upkeepNeeded, bytes memory) {
        bool upkeepNeeded1 = (block.timestamp - sidechainTimeStamp) >
            sidechainInterval;
        bool upkeepNeeded2 = (block.timestamp - mainchainTimeStamp) >
            mainchainInterval;

        upkeepNeeded = upkeepNeeded1 || upkeepNeeded2;
        return (upkeepNeeded, "");
    }

    // This function is called to perform the upkeep of the contract
    // meaning the automated periodic tasks of storing hashes on the sidechain
    // or bridging hashes to the main chain
    function performUpkeep(bytes calldata input) external override {
        uint8 action = uint8(input[0]);
        console.log(action);
        // If sidechainInterval has passed since the last time the contract was called
        // or if the action is 1 (force check)
        if (
            action == 1 ||
            (block.timestamp - sidechainTimeStamp) > sidechainInterval
        ) {
            // Emit the sidechain event
            emit HasherRequired();
            sidechainTimeStamp = block.timestamp;
        }
        // If mainchainInterval has passed since the last time the contract was called
        // or if the action is 2 (force check)
        if (
            action == 2 ||
            (block.timestamp - mainchainTimeStamp) > mainchainInterval
        ) {
            // Emit the mainchain event
            emit BridingRequired();
            // Reset the pending hashes array
            delete pendingHashes;
            mainchainTimeStamp = block.timestamp;
        }
    }
}
