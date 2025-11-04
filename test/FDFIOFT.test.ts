import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Signer } from "ethers";
import { FDFIOFTUpgradeable, FDFIOFTAdapter, FDFIToken } from "../typechain-types";

describe("FDFI OFT and Adapter Basic Coverage", function () {
    let deployer: Signer;
    let user1: Signer;
    let deployerAddr: string;
    let user1Addr: string;
    let mockEndpoint: string;
    let mainToken: FDFIToken;

    beforeEach(async function () {
        [deployer, user1] = await ethers.getSigners();
        deployerAddr = await deployer.getAddress();
        user1Addr = await user1.getAddress();
        
        // Deploy a mock endpoint for testing
        const MockEndpointFactory = await ethers.getContractFactory("contracts/mocks/MockLayerZeroEndpoint.sol:MockLayerZeroEndpoint");
        const mockEndpointContract = await MockEndpointFactory.deploy();
        await mockEndpointContract.waitForDeployment();
        mockEndpoint = await mockEndpointContract.getAddress();

        // Deploy main token with upgrades plugin
        const FDFIFactory = await ethers.getContractFactory("FDFIToken");
        const proxy = await upgrades.deployProxy(FDFIFactory, [deployerAddr], {
            initializer: "initialize"
        });
        await proxy.waitForDeployment();
        mainToken = await ethers.getContractAt("FDFIToken", await proxy.getAddress());

        // Mint some tokens and enable transfers
        await mainToken.mintTo(deployerAddr, ethers.parseUnits("1000000", 18));
        await mainToken.enableTransfers();
    });

    describe("FDFIOFTAdapter Basic Tests", function () {
        it("Should deploy adapter with correct configuration", async function () {
            const AdapterFactory = await ethers.getContractFactory("FDFIOFTAdapter");
            
            // Empty rate limit configs
            const rateLimitConfigs: any[] = [];
            
            const adapter = await AdapterFactory.deploy(
                await mainToken.getAddress(),
                mockEndpoint,
                deployerAddr,
                rateLimitConfigs
            );

            await adapter.waitForDeployment();

            // Verify basic configuration
            expect(await adapter.token()).to.equal(await mainToken.getAddress());
            expect(await adapter.endpoint()).to.equal(mockEndpoint);
            expect(await adapter.owner()).to.equal(deployerAddr);
        });

        it("Should handle rate limit configurations", async function () {
            const AdapterFactory = await ethers.getContractFactory("FDFIOFTAdapter");
            
            // Initial rate limit configs
            const rateLimitConfigs = [{
                dstEid: 40102, // BSC testnet
                limit: ethers.parseUnits("10000", 18),
                window: 86400 // 24 hours
            }];
            
            const adapter = await AdapterFactory.deploy(
                await mainToken.getAddress(),
                mockEndpoint,
                deployerAddr,
                rateLimitConfigs
            );

            await adapter.waitForDeployment();

            // Verify initial rate limit was set
            const rateLimit = await adapter.rateLimits(40102);
            expect(rateLimit.limit).to.equal(ethers.parseUnits("10000", 18));
            expect(rateLimit.window).to.equal(86400n);
        });

        it("Should allow owner to update rate limits", async function () {
            const AdapterFactory = await ethers.getContractFactory("FDFIOFTAdapter");
            const adapter = await AdapterFactory.deploy(
                await mainToken.getAddress(),
                mockEndpoint,
                deployerAddr,
                []
            );
            await adapter.waitForDeployment();

            // Set new rate limits
            const newRateLimitConfigs = [{
                dstEid: 40102,
                limit: ethers.parseUnits("50000", 18),
                window: 43200 // 12 hours
            }];

            await expect(adapter.setRateLimits(newRateLimitConfigs))
                .to.emit(adapter, "RateLimitsChanged");

            // Verify the rate limit was updated
            const rateLimit = await adapter.rateLimits(40102);
            expect(rateLimit.limit).to.equal(ethers.parseUnits("50000", 18));
            expect(rateLimit.window).to.equal(43200n);
        });

        it("Should handle rate limiter role", async function () {
            const AdapterFactory = await ethers.getContractFactory("FDFIOFTAdapter");
            const adapter = await AdapterFactory.deploy(
                await mainToken.getAddress(),
                mockEndpoint,
                deployerAddr,
                []
            );
            await adapter.waitForDeployment();

            // Set rate limiter
            await expect(adapter.setRateLimiter(user1Addr))
                .to.emit(adapter, "RateLimiterSet")
                .withArgs(user1Addr);

            expect(await adapter.rateLimiter()).to.equal(user1Addr);
        });
    });

    describe("Integration Tests", function () {
        it("Should allow token approvals for adapter", async function () {
            const AdapterFactory = await ethers.getContractFactory("FDFIOFTAdapter");
            const adapter = await AdapterFactory.deploy(
                await mainToken.getAddress(),
                mockEndpoint,
                deployerAddr,
                []
            );
            await adapter.waitForDeployment();

            const approvalAmount = ethers.parseUnits("1000", 18);
            
            await expect(mainToken.approve(await adapter.getAddress(), approvalAmount))
                .to.emit(mainToken, "Approval")
                .withArgs(deployerAddr, await adapter.getAddress(), approvalAmount);
            
            expect(await mainToken.allowance(deployerAddr, await adapter.getAddress()))
                .to.equal(approvalAmount);
        });

        it("Should verify adapter token compatibility", async function () {
            const AdapterFactory = await ethers.getContractFactory("FDFIOFTAdapter");
            const adapter = await AdapterFactory.deploy(
                await mainToken.getAddress(),
                mockEndpoint,
                deployerAddr,
                []
            );
            await adapter.waitForDeployment();

            // Verify the adapter is connected to the correct token
            expect(await adapter.token()).to.equal(await mainToken.getAddress());
            
            // Verify token has the expected properties
            expect(await mainToken.name()).to.equal("FDFI Token");
            expect(await mainToken.symbol()).to.equal("FDFI");
            expect(await mainToken.decimals()).to.equal(18);
        });
    });
});