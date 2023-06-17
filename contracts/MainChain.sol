// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@maticnetwork/fx-portal/contracts/examples/erc721-transfer/FxERC721RootTunnel.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

contract MainChain is FxERC721RootTunnel {
    mapping(bytes32 => bool) public hashes;
    mapping(uint256 => address) public originalOwner;

    constructor(
        address _checkpointManager,
        address _fxRoot,
        address _fxERC721Token
    ) FxERC721RootTunnel(_checkpointManager, _fxRoot, _fxERC721Token) {}

    event HashStored(bytes32 indexed _hash);
    event TokenReceived(address operator, address from);
    event Token(uint256 tokenId);

    function storeHash(bytes32 hash) internal {
        // Note that storeHash is now internal
        require(!hashes[hash], "Hash already stored");
        hashes[hash] = true;
        emit HashStored(hash);
    }
}
