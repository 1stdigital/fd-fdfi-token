import { ethers, upgrades } from "hardhat";

// UPGRADE_ADDRESS should be the existing proxy address
async function main() {
    const proxyAddress = process.env.PROXY_ADDRESS;
    if (!proxyAddress) throw new Error("PROXY_ADDRESS env var required");

    const FDFIToken = await ethers.getContractFactory("FDFIToken");
    const upgraded = await upgrades.upgradeProxy(proxyAddress, FDFIToken);
    console.log("Upgraded implementation, proxy still at:", await upgraded.getAddress());
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
