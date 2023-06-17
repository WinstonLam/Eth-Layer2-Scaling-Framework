// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";
import "@maticnetwork/fx-portal/contracts/tunnel/FxBaseChildTunnel.sol";

import "hardhat/console.sol";

contract SideChainFx is AutomationCompatibleInterface, FxBaseChildTunnel {
    mapping(bytes32 => bool) public hashes;

    // Global variables
    uint256 public latestStateId;
    address public latestRootMessageSender;
    bytes public latestData;

    bytes32[] public pendingHashes; // Hashes that are pending to be stored on the main chain

    uint256 public mainchainTimeStamp; // Last time the contract was called
    uint256 public mainchainInterval; // Interval between calls to the contract

    uint256 public sidechainTimeStamp; // Last time the contract was called
    uint256 public sidechainInterval; // Interval between calls to the contract

    event HashStored(bytes32 indexed _hash);
    event HasherRequired();
    event BridingRequired();
    event BridgeSuccessful(bytes32[] _hashes);

    constructor(
        uint256 _sideChainInterval,
        uint256 _mainChainInterval,
        address _fxChild
    ) FxBaseChildTunnel(_fxChild) {
        sidechainInterval = _sideChainInterval;
        mainchainInterval = _mainChainInterval;
        sidechainTimeStamp = block.timestamp;
        mainchainTimeStamp = block.timestamp;
    }

    function _processMessageFromRoot(
        uint256 stateId,
        address sender,
        bytes memory data
    ) internal override validateSender(sender) {
        latestStateId = stateId;
        latestRootMessageSender = sender;
        latestData = data;
    }

    function sendMessageToRoot(bytes memory message) public {
        _sendMessageToRoot(message);
    }

    function storeHash(bytes32 hash) external {
        // Check wether the hash is already stored
        require(!hashes[hash], "Hash already stored");

        hashes[hash] = true;
        // Store the hash in the pending hashes array to be processed later to the main chain
        pendingHashes.push(hash);

        // Emit the event
        emit HashStored(hash);
    }

    // This function is called to get the hashes that are pending to be stored on the main chain
    function getPendingHashes() public view returns (bytes32[] memory) {
        return pendingHashes;
    }

    // This function resets the pending hashes array
    function resetPendingHashes() public {
        // Reset the pending hashes array
        pendingHashes = new bytes32[](0);
    }

    function bridgeHashesToMainchain(bytes32[] memory _hashes) private {
        // Convert hashes array to bytes
        bytes memory hashesBytes;
        for (uint i = 0; i < _hashes.length; i++) {
            hashesBytes = abi.encodePacked(hashesBytes, _hashes[i]);
        }

        // Send message to FxRoot through FxChild
        _sendMessageToRoot(hashesBytes);
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
            // Bridge the hashes to the main chain
            bridgeHashesToMainchain(pendingHashes);
            emit BridgeSuccessful(pendingHashes);
            // Reset the pending hashes array
            resetPendingHashes();
        }
    }
}
