// deploy.js
const { ethers, network } = require("hardhat");
const fs = require("fs");

async function main() {
  // Interval time of 24 hours for the main chain operations (bridge)
  const mainchainInterval = 24 * 60 * 60;

  // Interval time of 15 minutes for the side chain operations (hasher)
  const sidechainInterval = 12 * 60 * 60;

  // for addresses please refer to: https://wiki.polygon.technology/docs/develop/l1-l2-communication/state-transfer
  const fxChildAddress = "0xCf73231F28B7331BBe3124B907840A94851f9f11 ";

  // Deploy the side chain contract
  const HashStorage = await ethers.getContractFactory("SideChainFx");
  const hashStorage = await (
    await HashStorage.deploy(
      sidechainInterval,
      mainchainInterval,
      fxChildAddress
    )
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

  // Check if the 'fx' property exists, if not, initialize it as an empty object
  if (!addresses.sidechain[network.name].fx) {
    addresses.sidechain[network.name].fx = {};
  }

  // Add the new address to the JSON object
  addresses.sidechain[network.name].fx.contractAddress = hashStorage.address;

  // Write the updated JSON object back to the file
  fs.writeFileSync(
    "./scripts/deploy/addresses.json",
    JSON.stringify(addresses, null, 2)
  );

  console.log(
    `HashStorage on ${network.name}  deployed to:`,
    hashStorage.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
