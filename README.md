# Eth-Layer2-Scaling-Framework

This repository serves as a testing suite to perform tests using a [Hardhat](https://hardhat.org/) deployed Ethereum blockchain network. It's purpose is to test and demonstrate the performance and efficiency of different transaction types in the Ethereum network, with a focus on Layer 2 scaling solutions.

## Setup and Configuration

1. Create a `.env` file in the root directory of the project with the following keys:
    ```
    INFURA_API_KEY=your_infura_api_key
    POLYGON_API_KEY=your_polygon_api_key
    METAMASK_PRIVATE_KEY=your_metamask_private_key
    ```
2. Update `hardhat.config.js` to read these keys from `.env` file and connect to the required networks.

## Repository Structure

- `deploy` - Contains deploy scripts for the smart contracts.
- `scripts/transfers` - Contains scripts to test off-chain, on-chain and state transfers.
- `contracts` - Contains the smart contracts that these scripts interact with. Contracts with the `Fx` prefix in their names refer to the usage of the Polygon Fx portal ([Documentation here](https://wiki.polygon.technology/docs/develop/l1-l2-communication/fx-portal/)).
- `sideChainHasher.js` - A script that simulates a rapidly executed action on the sidechain by computing a random hash and storing it on the blockchain at regular intervals.

## Running the Test Suite

1. Deploy the contracts using:
    ```
    npx hardhat run ./scripts/deploy/<CHOOSE_CONTRACT_SCRIPT_TO_DEPLOY> --network <DESIRED_BLOCKCHAIN_NETWORK>
    ```
    Example for deploying the sidechain network on Polygon:
    ```
    npx hardhat run ./scripts/deploy/deploySideChain.js --network polygon_mumbai
    ```

2. Run the tests using:
    ```
    npx hardhat run ./test/<DESIRED_TEST_FILE> --network <DESIRED_BLOCKCHAIN_NETWORK>
    ```
    Example for testing `SideChainHasher.js`:
    ```
    npx hardhat run ./test/SingleChainPerformance.js --network polygon_mumbai
    ```

## Development Status

Please note that this test suite is currently under active development and some functionalities may not be fully operational as of now. Feedback and contributions are always welcome!
