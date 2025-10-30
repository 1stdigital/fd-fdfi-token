import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.27",
        settings: {
            optimizer: { enabled: true, runs: 200 }
        }
    },
    networks: {
        localhost: {},
        sepolia: {
            url: process.env.SEPOLIA_RPC || "",
            accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : []
        }
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY || ""
    }
};

export default config;
