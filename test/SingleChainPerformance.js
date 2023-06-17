const sideChainHasher = require("../scripts/sideChainHasher.js");

// numberOfTests is the number of times to run the test
// networkName is the name of the network to connect to
//  "polygon_mumbai" = Polygon Mumbai Testnet
//  "sepolia" = Ethereum Sepolia Testnet
// maxTransactions is the maximum number of transactions to send
// payLoadSize is the size of the payload to send:
//   "small" = 1 random hash
//   "medium" = 10 random hashes
//   "large" = 100 random hashes

async function runTests(
  numberOfTests,
  networkName,
  maxTransactions,
  payLoadSize,
  intervalTime
) {
  const finalResult = [];

  for (let i = 0; i < numberOfTests; i++) {
    const result = await sideChainHasher(
      networkName,
      maxTransactions * 2, // we do this because we are sending 2 transactions per iteration
      payLoadSize,
      intervalTime
    );

    finalResult.push(result);
  }

  return finalResult;
}

function computeAverages(list) {
  let 
  totalTimes = 0,
    totalFirstFailures = 0,
    totalFailedTransactions = 0,
    totalTransactions = 0,
    totalGasUsed = 0;

  list.forEach((item) => {
    totalTimes += item.Time;
    totalFirstFailures += item["First Failure"];
    totalFailedTransactions += item["Failed Transactions"];
    totalTransactions += item["Total Transactions"];
    totalGasUsed += item["Total Gas Used"];
  });

  let averageTime = totalTimes / list.length;
  let averageFirstFailure = totalFirstFailures / list.length;
  let averageFailedTransactions = totalFailedTransactions / list.length;

  console.log("--Total Results---------------------------------");
  console.log("Runs: ", list.length);
  console.log("Total Time: ", totalTimes);
  console.log("Total transactions: ", totalTransactions);
  console.log("Total Failed Transactions: ", totalFailedTransactions);
  console.log("Total Gas Used: ", totalGasUsed);
  console.log("-----------------------------------------------\n");

  console.log("--Average Results-------------------------------")
  console.log("Average Time: ", averageTime.toFixed(2));
  console.log("Average First Failure: ", averageFirstFailure.toFixed(2));
  console.log("Average Failed Txns: ", averageFailedTransactions.toFixed(2));
  console.log("Average Gas Used: ", (totalGasUsed / totalTransactions));
  console.log("-----------------------------------------------\n");
}

(async () => {
  try {
    console.log("\nRunning tests...");
    console.log("small payload:");
    const results = await runTests(3, "polygon_mumbai", 5, "small", 3000);
    computeAverages(results);

    // console.log("medium payload:\n");
    // const results2 = await runTests(3, "polygon_mumbai", 5, "medium", 3000);
    // computeAverages(results2);

    // console.log("large payload:");
    // const results3 = await runTests(3, "polygon_mumbai", 5, "large", 3000);
    // computeAverages(results3);

  } catch (error) {
    console.error("An error occurred:", error);
  }
})();
