import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    avalancheFuji: {
      url: process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
      accounts:
        process.env.AVALANCHE_PRIVATE_KEY && process.env.AVALANCHE_PRIVATE_KEY !== ""
          ? [process.env.AVALANCHE_PRIVATE_KEY]
          : [],
      chainId:
        process.env.AVALANCHE_CHAIN_ID && process.env.AVALANCHE_CHAIN_ID !== ""
          ? Number(process.env.AVALANCHE_CHAIN_ID)
          : 43113,
    },
  },
  etherscan: {
    apiKey: {
      avalancheFuji: "not-needed", // Fuji doesn't need API key for verification
    },
    customChains: [
      {
        network: "avalancheFuji",
        chainId: 43113,
        urls: {
          apiURL: "https://testnet.snowtrace.io/api",
          browserURL: "https://testnet.snowtrace.io",
        },
      },
    ],
  },
};

export default config;