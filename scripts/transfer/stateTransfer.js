const { ethers, network } = require("hardhat");
const hre = require("hardhat");
const fs = require("fs");
const axios = require("axios");
const {
  setProofApi,
  POSClient,
  RootChain,
  ExitUtil,
  use,
} = require("@maticnetwork/maticjs");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const { Web3ClientPlugin } = require("@maticnetwork/maticjs-web3");
require("dotenv").config();

// Import the addresses from the addresses.json file
const addresses = JSON.parse(
  fs.readFileSync("./scripts/deploy/addresses.json", "utf8")
);

const MAINCHAIN = "goerli";
const SIDECHAIN = "polygon_mumbai";
const INTERVAL = 600000; // Check every 10 minutes

const sideChainContractAdress =
  addresses.sidechain[SIDECHAIN].fx.contractAddress;
const mainChainContractAdress =
  addresses.mainchain[MAINCHAIN].fx.contractAddress;

const SideChainABI = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/SideChainFx.sol/SideChainFx.json",
    "utf8"
  )
).abi;

// check if the ABI is found
if (!SideChainABI) {
  console.error("ABI file not found");
  process.exit(1);
}

const MainChainABI = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/MainChainFx.sol/MainChainFx.json",
    "utf8"
  )
).abi;

// check if the ABI is found
if (!MainChainABI) {
  console.error("ABI file not found");
  process.exit(1);
}

// Connect to mainchain network using custom provider
// Using network name to get the specific network configuration from hardhat
// Then create a provider and signer from the network configuration
const mainChainNetworkConfig = hre.config.networks[MAINCHAIN];
const providerMainchain = new ethers.providers.JsonRpcProvider(
  mainChainNetworkConfig.url
);
const signerMainchain = new ethers.Wallet(
  mainChainNetworkConfig.accounts[0],
  providerMainchain
);

// Connect to sidechain network using custom provider
// Using network name to get the specific network configuration from hardhat
// Then create a provider and signer from the network configuration
const sideChainNetworkConfig = hre.config.networks[SIDECHAIN];
const providerSidechain = new ethers.providers.JsonRpcProvider(
  sideChainNetworkConfig.url
);
const signerSidechain = new ethers.Wallet(
  sideChainNetworkConfig.accounts[0],
  providerSidechain
);

// Create a contract instance for the sidechaincontract
const sideChainContract = new ethers.Contract(
  sideChainContractAdress,
  SideChainABI,
  providerSidechain
).connect(signerSidechain);

// Create a contract instance for the mainchaincontract
const mainChainContract = new ethers.Contract(
  mainChainContractAdress,
  MainChainABI,
  providerMainchain
).connect(signerMainchain);

const METAMASK_PRIVATE_KEY = process.env.METAMASK_PRIVATE_KEY;
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

// install web3 plugin
use(Web3ClientPlugin);
// set proof api
setProofApi("https://apis.matic.network");

const parentProvider = new HDWalletProvider(
  METAMASK_PRIVATE_KEY,
  `https://goerli.infura.io/v3/${INFURA_API_KEY}`
);
const childProvider = new HDWalletProvider(
  METAMASK_PRIVATE_KEY,
  `https://rpc-mumbai.maticvigil.com/v1/${POLYGON_API_KEY}`
);

async function transferState() {
  try {
    const from = parentProvider.getAddress(0);
    const to = childProvider.getAddress(0);
    const client = new POSClient();

    // Initialize the POSClient with the connected wallets instead of the HDWalletProvider instances
    await client.init({
      log: true,
      network: "testnet",
      version: "mumbai",
      parent: {
        provider: parentProvider,
        defaultConfig: {
          from: from,
        },
      },
      child: {
        provider: childProvider,
        defaultConfig: {
          from: to,
        },
      },
    });
    try {
      // Establish tunnel by calling setFxChildTunnel and setFxRootTunnel
      // if the tunnel is not established yet
      await mainChainContract.setFxChildTunnel(sideChainContractAdress);
      await sideChainContract.setFxRootTunnel(mainChainContractAdress);
    } catch (error) {
      // Check for the specific error message
      if (
        error.message.includes("ROOT_TUNNEL_ALREADY_SET") ||
        error.message.includes("CHILD_TUNNEL_ALREADY_SET")
      ) {
        // If tunnel is already established, log and continue
        console.log("Tunnel is already set up, continuing...");
      } else {
        // If it's a different error, rethrow it
        throw error;
      }
    }

    console.log("\n==Setup Prints=======");
    console.log("Parent Contract: ", mainChainContractAdress);
    console.log("Child Contract: ", sideChainContractAdress);
    console.log("======================\n");

    // Send test message to root
    const message = "Hello from child again!";
    const messageHash = ethers.utils.toUtf8Bytes(message);


    const tx = await sideChainContract.sendMessageToRoot(messageHash, {
      gasPrice: ethers.utils.parseUnits("10", "gwei"),
    });

    const receipt = await tx.wait();
    const txHash = receipt.transactionHash;

    console.log("Message sent to root: ", txHash);

    waitForCheckpoint(txHash, INTERVAL, client);

  } catch (error) {
    console.log("Error: ", error);
  }
}

async function waitForCheckpoint(txHash, interval, client) {
  let checkpointed = false;
  while (!checkpointed) {
    checkpointed = await client.exitUtil.isCheckPointed(txHash);
    if (!checkpointed) {
      console.log("Waiting for checkpoint...\n");
      // Wait for some time before checking again
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
  console.log("Checkpointed!");


  try {
    var exitProof = await client.exitUtil.buildPayloadForExit(
      txHash,
      "0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036", // MESSAGE_SENT_EVENT_SIG: Do not change this
      true
    );
    // create root chain instance
    const messageFromChild = await mainChainContract.receiveMessageFromChild(
      exitProof
    );

    console.log("Message from child: ", messageFromChild);
  



  } catch (error) {
    console.log("Error: ", error);
  }

  return true;
}

transferState();
