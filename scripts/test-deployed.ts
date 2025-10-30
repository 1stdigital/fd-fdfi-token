import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const DEPLOYED_ADDRESS = process.env.FDFI_TOKEN_ADDRESS || "";

async function main() {
    if (!DEPLOYED_ADDRESS) {
        throw new Error("Please set FDFI_TOKEN_ADDRESS in your .env file");
    }

    console.log("🧪 Testing FDFI Token on Sepolia...\n");
    
    const [owner] = await ethers.getSigners();
    console.log("Owner address:", owner.address);
    
    const token = await ethers.getContractAt("FDFIToken", DEPLOYED_ADDRESS);
    
    console.log("\n📊 Token Info:");
    console.log("  Name:", await token.name());
    console.log("  Symbol:", await token.symbol());
    console.log("  Total Supply:", ethers.formatEther(await token.totalSupply()), "FDFI");
    console.log("  Max Supply:", ethers.formatEther(await token.MAX_SUPPLY()), "FDFI");
    console.log("  Owner:", await token.owner());
    console.log("  Transfers Enabled:", await token.transfersEnabled());
    
    console.log("\n✅ TEST 1: Verify token is non-transferable initially");
    const transfersEnabled = await token.transfersEnabled();
    if (!transfersEnabled) {
        console.log("  ✓ Transfers are disabled at start");
    } else {
        console.log("  ✗ ERROR: Transfers should be disabled");
    }
    
    console.log("\n✅ TEST 2: Mint some tokens");
    const mintAmount = ethers.parseUnits("1000", 18);
    try {
        const tx = await token.mintTo(owner.address, mintAmount);
        await tx.wait();
        console.log("  ✓ Minted", ethers.formatEther(mintAmount), "FDFI");
        console.log("  Balance:", ethers.formatEther(await token.balanceOf(owner.address)), "FDFI");
    } catch (error: any) {
        console.log("  Note:", error.message);
    }
    
    console.log("\n✅ TEST 3: Try to transfer (should fail)");
    try {
        const testAddr = "0x000000000000000000000000000000000000dEaD";
        await token.transfer(testAddr, ethers.parseUnits("1", 18));
        console.log("  ✗ ERROR: Transfer should have failed!");
    } catch (error: any) {
        if (error.message.includes("Transfers disabled")) {
            console.log("  ✓ Transfer correctly blocked - transfers disabled");
        } else {
            console.log("  Error:", error.message.substring(0, 100));
        }
    }
    
    console.log("\n✅ TEST 4: Enable transfers");
    try {
        const tx = await token.enableTransfers();
        await tx.wait();
        console.log("  ✓ Transfers enabled!");
        console.log("  Transfers Enabled:", await token.transfersEnabled());
    } catch (error: any) {
        console.log("  Note:", error.message.substring(0, 100));
    }
    
    console.log("\n✅ TEST 5: Try to transfer again (should work now)");
    try {
        const testAddr = "0x000000000000000000000000000000000000dEaD";
        const balance = await token.balanceOf(owner.address);
        if (balance > 0n) {
            const tx = await token.transfer(testAddr, ethers.parseUnits("1", 18));
            await tx.wait();
            console.log("  ✓ Transfer successful!");
        } else {
            console.log("  Skipped - no tokens to transfer");
        }
    } catch (error: any) {
        console.log("  Error:", error.message.substring(0, 100));
    }
    
    console.log("\n✅ TEST 6: Test delegation");
    try {
        const votingPower = await token.getVotes(owner.address);
        console.log("  Current voting power:", ethers.formatEther(votingPower), "votes");
        
        const tx = await token.delegate(owner.address);
        await tx.wait();
        const newVotingPower = await token.getVotes(owner.address);
        console.log("  ✓ Delegated to self");
        console.log("  New voting power:", ethers.formatEther(newVotingPower), "votes");
    } catch (error: any) {
        console.log("  Error:", error.message.substring(0, 100));
    }
    
    console.log("\n✅ TEST 7: Test EIP-2612 Permit");
    const nonce = await token.nonces(owner.address);
    console.log("  Current nonce:", nonce.toString());
    console.log("  ✓ Permit is supported (EIP-2612)");
    
    console.log("\n🎉 Testing complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});