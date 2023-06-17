const { ethers, network } = require("hardhat");
const hre = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const { keccak256 } = require("ethereumjs-util");


async function transfer (
  mainChainNetwork,
  sideChainContractAdress,
  sideChainHashTokenAddress,
  mainChainContractAdress,
  mainChainHashTokenAddress,
  SideChainABI,
  HashTokenABI,
)  {
  // Use the network name to get the correct network configuration
  const sideChainNetworkConfig = hre.config.networks[network.name]; // Network is dynamically obtained
  const providerSidechain = new ethers.providers.JsonRpcProvider(
    sideChainNetworkConfig.url
  );
  const signerSidechain = new ethers.Wallet(
    sideChainNetworkConfig.accounts[0],
    providerSidechain
  );

  // Connect to mainchain network using custom provider
  // Using network name to get the specific network configuration from hardhat
  // Then create a provider and signer from the network configuration
  const mainChainNetworkConfig = hre.config.networks[mainChainNetwork];
  const providerMainchain = new ethers.providers.JsonRpcProvider(
    mainChainNetworkConfig.url
  );
  const signerMainchain = new ethers.Wallet(
    mainChainNetworkConfig.accounts[0],
    providerMainchain
  );

  // Create a contract instance for the sidechaincontract
  const sideChainContract = new ethers.Contract(
    sideChainContractAdress,
    SideChainABI,
    providerSidechain
  ).connect(signerSidechain);

  console.log("\n==Setup Prints=======");
  console.log("Parent Contract: ", mainChainContractAdress);
  console.log("Parent Token Contract: ", mainChainHashTokenAddress);
  console.log("Child Contract: ", sideChainContractAdress);
  console.log("Child Token Contract: ", sideChainHashTokenAddress);
  console.log("============\n");


    // Start timer
    const start = process.hrtime();
    // Total gas used
    let totalGasUsed = 0;

  // Step 1: Get the pending hashes from the side chain and create a Merkle Tree
  // Get the pending hashes
  let pendingHashes = await sideChainContract.getPendingHashes();

  // Reset the pending hashes
  let resetTx = await sideChainContract.resetPendingHashes();
  const resetReceipt = await resetTx.wait();
  totalGasUsed += parseFloat(ethers.utils.formatEther(resetReceipt.gasUsed.mul(resetReceipt.effectiveGasPrice))); 

  // Create a Merkle Tree from the pending hashes
  const leaves = pendingHashes.map(keccak256);
  const tree = new MerkleTree(leaves, keccak256);
  const root = "0x" + tree.getRoot().toString("hex");

  // Step 2: Mint a token on the side chain with the Merkle root as metadata
  const hashTokenContractSide = new ethers.Contract(
    sideChainHashTokenAddress,
    HashTokenABI,
    providerSidechain
  ).connect(signerSidechain);
  // Mint a token with the Merkle root as metadata and get its ID
  let mintTxSide = await hashTokenContractSide.mintToken(root);

  let mintTxSideReceipt = await mintTxSide.wait();
  totalGasUsed += parseFloat(ethers.utils.formatEther(mintTxSideReceipt.gasUsed.mul(mintTxSideReceipt.effectiveGasPrice))); 

  console.log("check 1")

  // Get the token ID of the minted token
  const logsSide = mintTxSideReceipt.logs;
  const tokenIdSide = logsSide[logsSide.length - 2].data;

  console.log("\n==Minting Token on Side Chain=======");
  console.log("Token: ", tokenIdSide);
  // console.log(
  //   "Token exists on sidechain: ",
  //   await hashTokenContractSide.exists(tokenIdSide)
  // );
  let rootBase64 = Buffer.from(root.substring(2), "hex").toString("base64");
  console.log("Hash (base64):", rootBase64);
  console.log("==Token Minted on Side Chain====");

  // // Step 3: Transfer the token to Ethereum using the Polygon PoS bridge
  // const transferTx = await hashTokenContract.transferToEthereum(tokenId);
  // await transferTx.wait();

  // Step 4: Mint a token on the main chain with the Merkle root as metadata
  const hashTokenContractMain = new ethers.Contract(
    mainChainHashTokenAddress,
    HashTokenABI,
    providerMainchain
  ).connect(signerMainchain);
  // Mint a token with the Merkle root as metadata and get its ID
  let mintTxMain = await hashTokenContractMain.mintToken(root);
  let mintTxMainReceipt = await mintTxMain.wait();

  totalGasUsed += parseFloat(ethers.utils.formatEther(mintTxMainReceipt.gasUsed.mul(mintTxMainReceipt.effectiveGasPrice))); 

  // Get the token ID of the minted token
  const logsMain = mintTxMainReceipt.logs;
  const tokenIdMain = logsMain[logsMain.length - 1].data;
  console.log("\n==Minting Token on Main Chain=======");
  console.log("Token: ", tokenIdMain);
  // console.log(
  //   "Token exists on mainchain: ",
  //   await hashTokenContractMain.exists(tokenIdMain)
  // );
  console.log("Hash (base64):", rootBase64);
  console.log("==Token Minting on Main Chain=======");

  // Setp 5: Transfer the token from the minting address to the main chain contract
  console.log("\n==Initiated Token Transfer=======");
  // approve the token transfer
  // await hashTokenContractMain.getTokenHash(tokenIdMain);
  const ApproveTx = await hashTokenContractMain.approve(
    mainChainHashTokenAddress,
    tokenIdMain
  );
  const approveReceipt = await ApproveTx.wait();
  totalGasUsed += parseFloat(ethers.utils.formatEther(approveReceipt.gasUsed.mul(approveReceipt.effectiveGasPrice)));
  console.log("Token approved for transfer: ", tokenIdMain);

  // transfer the token
  const TransferTx = await hashTokenContractMain.transferToken(
    signerMainchain.address,
    mainChainContractAdress,
    tokenIdMain
  );

  const transferReceipt = await TransferTx.wait();
  totalGasUsed += parseFloat(ethers.utils.formatEther(transferReceipt.gasUsed.mul(transferReceipt.effectiveGasPrice)));
  // Check if the token is transferred
  console.log(
    "Token transferred to mainchain: ",
    await hashTokenContractMain.ownerOf(tokenIdMain)
  );
  console.log("==Token Transfer Completed=======\n");
 
  const elapsed = process.hrtime(start); // [seconds, nanoseconds]
  const elapsedSeconds = elapsed[0] + elapsed[1] / 1e9;
  return {
    time: elapsedSeconds,
    gas: totalGasUsed,
  };
  
  }

async function transferTokenAndDeposit(
  mainChainNetwork,
  sideChainContractAdress,
  sideChainHashTokenAddress,
  mainChainContractAdress,
  mainChainHashTokenAddress,
  SideChainABI,
  HashTokenABI,
) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await transfer( 
        mainChainNetwork,
        sideChainContractAdress,
        sideChainHashTokenAddress,
        mainChainContractAdress,
        mainChainHashTokenAddress,
        SideChainABI,
        HashTokenABI
      );
      resolve(result);
    } catch (err) {
      reject(err);
    }
});
}



module.exports = transferTokenAndDeposit;