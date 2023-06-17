const { POSClient, use } = require("@maticnetwork/maticjs");
const { Web3ClientPlugin } = require("@maticnetwork/maticjs-web3");
const { ethers, network } = require("hardhat");
const HDWalletProvider = require("@truffle/hdwallet-provider");
// Importing the necessary variables from the setup file
const { HashTokenABI, SideChainABI } = require("./tokenTransferSetup.js");
const fs = require("fs");
const { hash } = require("eth-crypto");
require("dotenv").config();

const mainChainNetwork = "goerli"; // Change this to the network you want to deploy to

// Import the addresses from the addresses.json file
const addresses = JSON.parse(
  fs.readFileSync("./scripts/deploy/addresses.json", "utf8")
);
const mainChainHashTokenAddress =
  addresses.mainchain[mainChainNetwork].hashTokenAddress;

const mainChainContractAdress =
  addresses.mainchain[mainChainNetwork].contractAddress;

const sideChainContractAdress =
  addresses.sidechain[network.name].contractAddress;

const sideChainHashTokenAddress =
  addresses.sidechain[network.name].hashTokenAddress;

const METAMASK_PRIVATE_KEY = process.env.METAMASK_PRIVATE_KEY;
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

// install web3 plugin
use(Web3ClientPlugin);

const parentProvider = new HDWalletProvider(
  METAMASK_PRIVATE_KEY,
  `https://goerli.infura.io/v3/${INFURA_API_KEY}`
);
const childProvider = new HDWalletProvider(
  METAMASK_PRIVATE_KEY,
  `https://rpc-mumbai.maticvigil.com/v1/${POLYGON_API_KEY}`
);

async function executeTransfer(tokenId) {
  const NetworkConfig = hre.config.networks[network.name];

  const providerSidechain = new ethers.providers.JsonRpcProvider(
    NetworkConfig.url
  );
  const signerSidechain = new ethers.Wallet(
    NetworkConfig.accounts[0],
    providerSidechain
  );
  const sideChainContract = new ethers.Contract(
    sideChainContractAdress,
    SideChainABI,
    providerSidechain
  ).connect(signerSidechain);

  const from = parentProvider.getAddress(0);
  const to = childProvider.getAddress(0);
  const posClient = new POSClient();

  // Initialize the POSClient with the connected wallets instead of the HDWalletProvider instances
  await posClient.init({
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

  
  try{
  const token = posClient.erc721(mainChainHashTokenAddress, true);
  const approveResult = await token.approve(tokenId);

  const depositResult = await token.deposit(tokenId, from, { 
    from: from,
    gasLimit: 10000000,
    maxFeePerGas: 5000000000,
    maxPriorityFeePerGas: 5000000000,
  });
  console.log(await depositResult.getReceipt())
  console.log("Token deposited on the sidechain");
  }catch(e){
    console.log(e)
  }
}

async function getRootTokenId() {
  console.log("\n==Setup Prints=======");
  console.log("Parent Token Contract: ", mainChainHashTokenAddress);
  console.log("=======================\n");
  const NetworkConfig = hre.config.networks[mainChainNetwork];

  const providerMainchain = new ethers.providers.JsonRpcProvider(
    NetworkConfig.url
  );
  const signerMainchain = new ethers.Wallet(
    NetworkConfig.accounts[0],
    providerMainchain
  );

  const hashTokenContractMain = new ethers.Contract(
    mainChainHashTokenAddress,
    HashTokenABI,
    providerMainchain
  ).connect(signerMainchain);

  const hash = ethers.utils.formatBytes32String("");

  console.log("Minting token with hash: ", hash);
  // Mint a token with the Merkle root as metadata and get its ID
  let mintTxMain = await hashTokenContractMain.functions.mintToken(hash);
  let mintTxMainReceipt = await mintTxMain.wait();

  // Get the token ID of the minted token
  const logsMain = mintTxMainReceipt.logs;
  const tokenIdMain = logsMain[logsMain.length - 1].data;

  console.log("Token minted TokenID: ", tokenIdMain);

  executeTransfer(tokenIdMain)
    .then(() => console.log("Token transferred"))
    .catch((error) => console.error("An error occurred", error));
}

getRootTokenId();
