//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// Define the interface for the rootChainManager contract
interface IRootChainManager {
    function depositERC721ForUser(
        address user,
        address rootToken,
        uint256 tokenId
    ) external;
}

contract BridgeDeposit {
    IERC721 public hashToken;
    IRootChainManager public rootChainManager;

    // Event to be emitted when a deposit occurs
    event TokenDeposited(uint256 indexed tokenId, address indexed depositor);

    constructor(IERC721 _hashToken, IRootChainManager _rootChainManager) {
        hashToken = _hashToken;
        rootChainManager = _rootChainManager;
    }

    function depositToken(uint256 tokenId) external {
        require(
            msg.sender == hashToken.ownerOf(tokenId),
            "Caller must own the token"
        );

        // Approve the bridge contract to transfer your token
        hashToken.approve(address(rootChainManager), tokenId);

        rootChainManager.depositERC721ForUser(
            msg.sender,
            address(hashToken),
            tokenId
        );

        // Emit event for the deposited token
        emit TokenDeposited(tokenId, msg.sender);
    }
}
