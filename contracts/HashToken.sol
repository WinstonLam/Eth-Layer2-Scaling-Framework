// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract HashToken is ERC721 {
    uint256 public nextTokenId = 0;
    mapping(uint256 => bytes32) public hashOfToken;

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC721(name, symbol) {
        initializeTokens(initialSupply);
    }

    event TokenMinted(uint256 tokenId);

    // store the hash as metadata of the token
    function mintToken(bytes32 hash) public {
        hashOfToken[nextTokenId] = hash;
        _mint(msg.sender, nextTokenId);
        emit TokenMinted(nextTokenId); // Emit the event here
        nextTokenId += 1;
    }

    function initializeTokens(uint256 initialSupply) internal {
        for (uint256 i = 0; i < initialSupply; i++) {
            // Replace "hash" with your chosen hash value
            mintToken(bytes32(0));
        }
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function burnToken(uint256 tokenId) public {
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "Caller is not owner nor approved"
        );
        delete hashOfToken[tokenId];
        _burn(tokenId);
    }

    function transferToken(address from, address to, uint256 tokenId) public {
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "Caller is not owner nor approved"
        );
        safeTransferFrom(from, to, tokenId);
    }

    function getTokenHash(uint256 tokenId) public view returns (bytes32) {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        return hashOfToken[tokenId];
    }
}
