require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/env-enc").config();
require("dotenv").config();

const INFURA_API_KEY = process.env.INFURA_API_KEY;
const METAMASK_PRIVATE_KEY = process.env.METAMASK_PRIVATE_KEY;
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [METAMASK_PRIVATE_KEY],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [METAMASK_PRIVATE_KEY],
    },
    polygon_mumbai: {
      url: `https://rpc-mumbai.maticvigil.com/v1/${POLYGON_API_KEY}`,
      accounts: [METAMASK_PRIVATE_KEY],
    },
    optimism_goerli: {
      url: "https://goerli.optimism.io",
      accounts: [METAMASK_PRIVATE_KEY],
    },
  },
};
