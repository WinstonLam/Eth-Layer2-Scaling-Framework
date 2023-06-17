const { ethers, network } = require("hardhat"); // Destructure network from hardhat
const fs = require("fs");

const mainChainNetwork = "sepolia"; // Change this to the network you want to deploy to

// Import the addresses from the addresses.json file
const addresses = JSON.parse(
  fs.readFileSync("./scripts/deploy/addresses.json", "utf8")
);
const sideChainContractAdress =
  addresses.sidechain[network.name].contractAddress;
const sideChainHashTokenAddress =
  addresses.sidechain[network.name].hashTokenAddress;
const mainChainContractAdress =
  addresses.mainchain[mainChainNetwork].contractAddress;
const mainChainHashTokenAddress =
  addresses.mainchain[mainChainNetwork].hashTokenAddress;

// Import the ABI files
// Read the addresses from the JSON file
const SideChainABI = JSON.parse(
  fs.readFileSync("./artifacts/contracts/SideChain.sol/SideChain.json", "utf8")
).abi;

// check if the ABI is found
if (!SideChainABI) {
  console.error("ABI file not found");
  process.exit(1);
}

const HashTokenABI = JSON.parse(
  fs.readFileSync("./artifacts/contracts/HashToken.sol/HashToken.json", "utf8")
).abi;

// check if the ABI is found
if (!HashTokenABI) {
  console.error("ABI file not found");
  process.exit(1);
}

const MainChainABI = JSON.parse(
  fs.readFileSync("./artifacts/contracts/MainChain.sol/MainChain.json", "utf8")
).abi;

// check if the ABI is found
if (!MainChainABI) {
  console.error("ABI file not found");
  process.exit(1);
}

// Exporting the necessary variables
module.exports = {
  sideChainContractAdress,
  sideChainHashTokenAddress,
  mainChainContractAdress,
  mainChainHashTokenAddress,
  SideChainABI,
  HashTokenABI,
  MainChainABI,
};
