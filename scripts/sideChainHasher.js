// main.js
const { ethers, network } = require("hardhat");
const fs = require("fs");
const hasher = require("../cargoLedger/hasher.js");

async function sideChainHasher(
  networkName,
  maxTransactions,
  payLoadSize,
  intervalTime
) {
  // Retrieve the deployer
  const [deployer] = await ethers.getSigners();

  // Read the addresses from the JSON file
  const addresses = JSON.parse(
    fs.readFileSync("./scripts/deploy/addresses.json", "utf8")
  );

  // Retrieve the contract address from the JSON file (use this one for side chain)
  const contractAddress = addresses.sidechain[networkName].contractAddress;

  // Attach to the existing side chain contract
  const HashStorage = await ethers.getContractFactory("SideChain");
  const hashStorage = HashStorage.attach(contractAddress);
  const balance = await ethers.provider.getBalance(String(deployer.address));

  // Start timer
  const start = process.hrtime();

  // console.log("\n--SETUP PRINTS---------------------------------");
  // console.log("Contract address:", hashStorage.address);
  // console.log("Deployer address:", deployer.address);
  // console.log("Deployer balance:", ethers.utils.formatEther(balance));
  // console.log("-----------------------------------------------\n");

  // Encapsulate the work in a Promise
  return new Promise((resolve, reject) => {
    // Keep track of how many times the function has been executed
    let executionCount = 0;
    // Keep track of how many times the replacement fee was too low and
    // how many transactions were completed up till that point
    let lowFeeCount = [];
    // Keep track of the total gas used in ether
    let totalGasUsed = 0;

    // Listen for the HasherRequired event
    hashStorage.on("HasherRequired", handleHasherRequired);

    async function handleHasherRequired() {
      // console.log("\n--HASHERREQUIRED EVENT DETECTED-----------------");
      try {
        let data = [];
        // Check payload size if it is small generate 1 random hash
        if (payLoadSize == "small") {
          data.push(ethers.utils.randomBytes(32));
        } else if (payLoadSize == "medium") {
          // Check payload size if it is medium generate 10 random hashes
          for (let i = 0; i < 10; i++) {
            data.push(ethers.utils.randomBytes(32));
          }
        } else if (payLoadSize == "large") {
          // Check payload size if it is large generate 100 random hashes
          for (let i = 0; i < 100; i++) {
            data.push(ethers.utils.randomBytes(32));
          }
        } else {
          console.log("Invalid payload size");
          exit("Invalid payload size");
        }

        // const overreachingHash = "0x" + (await hasher());
        const tx = await hashStorage.connect(deployer).storeHashes(data, {
          gasLimit: ethers.utils.parseUnits("10", "mwei"),
          maxFeePerGas: ethers.utils.parseUnits("5", "gwei"),
          maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
        });

        await tx.wait();
       
        
        executionCount += 1;

        // console.log("Payload Succesfully Stored:", tx.hash);
        // console.log("-----------------------------------------------\n");
      } catch (error) {
        if (error.message.includes("replacement transaction underpriced")) {
          lowFeeCount.push(executionCount);
          // console.log(
          //   `Transaction replacement fee too low after ${executionCount} successful transactions.`
          // );
        } else {
          console.error("Error:", error);
        }
      }
    }

    // Set an interval to keep performing manual upkeep (for testing purposes)
    const interval = setInterval(async function () {
      if (executionCount >= maxTransactions) {
        clearInterval(interval); // Stop the interval

        const elapsed = process.hrtime(start); // [seconds, nanoseconds]
        const elapsedSeconds = elapsed[0] + elapsed[1] / 1e9;

        // Remove the event listener
        hashStorage.off("HasherRequired", handleHasherRequired);

        // console.log("\n--Run Completed---------------------------------");
        // console.log("Total transactions executed: ", executionCount);
        // console.log("All executions completed in", elapsedSeconds, "seconds");
        // console.log(
        //   "Number of transaction till first low fee:",
        //   lowFeeCount[0]
        // );
        // console.log("Number of failed transactions:", lowFeeCount.length);
        // console.log("-----------------------------------------------\n");

        // Resolve the promise here when done
        resolve({
          Time: elapsedSeconds,
          "First Failure": lowFeeCount[0],
          "Failed Transactions": lowFeeCount.length,
          "Total Transactions": executionCount,
          "Total Gas Used": totalGasUsed,
        });
      }
      try {
        // Call performUpkeep manually
        // console.log("\n--UPKEEP MANUAL CALL------------------------------");
        const tx = await hashStorage.connect(deployer).performUpkeep("0x01", {
          gasLimit: ethers.utils.parseUnits("10", "mwei"), // Increase the maxPriorityFeePerGas value
          maxFeePerGas: ethers.utils.parseUnits("5", "gwei"),
          maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
        });

        // Wait for the transaction to be confirmed
        const receipt = await tx.wait();
        totalGasUsed += parseFloat(ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice))); 

        // console.log("Transaction:", tx.hash);
        // console.log("-----------------------------------------------\n");

        executionCount += 1;
      } catch (error) {
        if (error.message.includes("replacement transaction underpriced")) {
          lowFeeCount.push(executionCount);
          // console.log(
          //   `Transaction replacement fee too low after ${executionCount} successful transactions.`
          // );
        } else {
          console.error("Error:", error);
        }
      }
    }, intervalTime); // This will run the function every x seconds
  });
}

module.exports = sideChainHasher;
