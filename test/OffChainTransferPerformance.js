const transferTokenAndDeposit = require("../scripts/transfer/tokenTransferOffChain.js");

// Importing the necessary variables from the setup file
const {
    sideChainContractAdress,
    sideChainHashTokenAddress,
    mainChainContractAdress,
    mainChainHashTokenAddress,
    SideChainABI,
    HashTokenABI,
  } = require("../scripts/transfer/tokenTransferSetup.js");
  
  const mainChainNetwork = "sepolia"; // Change this to the network you want to deploy to




async function runTests(
    numberOfTests
) {
    const finalResult = [];
    for (let i = 0; i < numberOfTests; i++) {
    const result = await transferTokenAndDeposit(
        mainChainNetwork,
        sideChainContractAdress,
        sideChainHashTokenAddress,
        mainChainContractAdress,
        mainChainHashTokenAddress,
        SideChainABI,
        HashTokenABI,
      );
      finalResult.push(result);
    }
    return finalResult;
}
  
(async () => {
 try {
    const result = await runTests(1);
    console.log(result);
 }
    catch (e) {
        console.log(e);
    }
})();