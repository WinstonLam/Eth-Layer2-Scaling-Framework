// deployHashToken.js
const { ethers, network } = require("hardhat");
const fs = require("fs");

async function main() {
  // Set the token name and symbol
  const tokenName = "Hash Token";
  const tokenSymbol = "HT";
  const initialSupply = 10;

  // Deploy the HashToken contract
  const HashToken = await ethers.getContractFactory("HashToken");
  const hashToken = await (
    await HashToken.deploy(tokenName, tokenSymbol, initialSupply)
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
  if (!addresses.sidechain) {
    addresses.sidechain = {};
  }

  // If no object for this specific network (like "sepolia") exists yet, create an empty object for it
  if (!addresses.sidechain[network.name]) {
    addresses.sidechain[network.name] = {};
  }

  // Add the new address to the JSON object
  addresses.sidechain[network.name].hashTokenAddress = hashToken.address;

  // Write the updated JSON object back to the file
  fs.writeFileSync(
    "./scripts/deploy/addresses.json",
    JSON.stringify(addresses, null, 2)
  );

  console.log(`HashToken on ${network.name} deployed to:`, hashToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
