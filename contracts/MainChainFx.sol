//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@maticnetwork/fx-portal/contracts/tunnel/FxBaseRootTunnel.sol";
import "hardhat/console.sol";
import "./HashToken.sol";

contract MainChainFx is FxBaseRootTunnel {
    mapping(bytes32 => bool) public hashes;

    constructor(
        address _checkpointManager,
        address _fxRoot
    ) FxBaseRootTunnel(_checkpointManager, _fxRoot) {}

    event HashStored(bytes32 indexed _hash);
    event MessageReceived(bytes32 indexed _hash);

    function storeHash(bytes32 hash) public {
        // Note that storeHash is now internal
        // require(!hashes[hash], "Hash already stored");
        hashes[hash] = true;
        emit HashStored(hash);
    }

    // This function will be called when a message is received from the child chain
    function _processMessageFromChild(bytes memory data) internal override {
        // Extract hashes from data and store them
        console.log("MainChainFx: _processMessageFromChild");
        bytes32 hash = abi.decode(data, (bytes32));

        emit MessageReceived(hash);
        storeHash(hash);
    }

    function sendMessageToChild(bytes memory message) public {
        _sendMessageToChild(message);
    }

    function receiveMessageFromChild(bytes memory inputData) public {
        bytes memory message = _validateAndExtractMessage(inputData);

        _processMessageFromChild(message);
    }
}
