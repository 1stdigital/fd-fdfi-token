import { ethers, upgrades } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const FDFIToken = await ethers.getContractFactory("FDFIToken");
    const proxy = await upgrades.deployProxy(
        FDFIToken,
        [deployer.address],
        { initializer: "initialize" }
    );
    await proxy.waitForDeployment();

    console.log("FDFIToken proxy deployed at:", await proxy.getAddress());
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
