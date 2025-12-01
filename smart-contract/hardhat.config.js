require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("ts-node/register"); 

module.exports = {
  solidity: "0.8.18",
  networks: {
    amoy: {
      url: process.env.AMOY_RPC,
      accounts: [process.env.PRIVATE_KEY],
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
};
