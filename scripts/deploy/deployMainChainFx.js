// main.js
const { ethers, network } = require("hardhat");
const fs = require("fs");

async function main() {
  // get the address of the HashToken contract
  const address = JSON.parse(
    fs.readFileSync("./scripts/deploy/addresses.json", "utf8")
  );

  // for addresses please refer to: https://wiki.polygon.technology/docs/develop/l1-l2-communication/state-transfer
  const checkPointManagerAddress = "0x2890ba17efe978480615e330ecb65333b880928e";
  const fxRootAddress = "0x3d1d3E34f7fB6D26245E6640E1c50710eFFf15bA";

  // Deploy the MainChain contract
  const MainChain = await ethers.getContractFactory("MainChainFx");
  const mainChain = await (
    await MainChain.deploy(checkPointManagerAddress, fxRootAddress)
  ).deployed();

  // Read the existing JSON file (or an empty object if the file doesn't exist yet)
  let addresses = {};
  try {
    addresses = JSON.parse(
      fs.readFileSync("./scripts/deploy/addresses.json", "utf8")
    );
  } catch (e) {
    console.log("Creating new addresses file...");
  }

  // If no object for this network exists yet in the file, create an empty object for this network
  if (!addresses.mainchain) {
    addresses.mainchain = {};
  }

  // If no object for this specific network (like "sepolia") exists yet, create an empty object for it
  if (!addresses.mainchain[network.name]) {
    addresses.mainchain[network.name] = {};
  }

  // Check if the 'fx' property exists, if not, initialize it as an empty object
  if (!addresses.mainchain[network.name].fx) {
    addresses.mainchain[network.name].fx = {};
  }

  // Add the new address to the JSON object
  addresses.mainchain[network.name].fx.contractAddress = mainChain.address;

  // Write the updated JSON object back to the file
  fs.writeFileSync(
    "./scripts/deploy/addresses.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log(`MainChain on ${network.name} deployed to:`, mainChain.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
