import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Signer } from "ethers";
import { FDFIOFTUpgradeable, FDFIOFTAdapter, FDFIToken } from "../typechain-types";

describe("FDFI OFT and Adapter", function () {
    let deployer: Signer;
    let user1: Signer;
    let user2: Signer;
    let deployerAddr: string;
    let user1Addr: string;
    let user2Addr: string;

    // LayerZero endpoint addresses from environment
    const SEPOLIA_ENDPOINT = process.env.SEPOLIA_ENDPOINT;
    const BSC_ENDPOINT = process.env.BSC_ENDPOINT;

    beforeEach(async function () {
        [deployer, user1, user2] = await ethers.getSigners();
        deployerAddr = await deployer.getAddress();
        user1Addr = await user1.getAddress();
        user2Addr = await user2.getAddress();
    });

    describe("FDFIOFTUpgradeable Deployment", function () {
        it("Should deploy upgradeable OFT with correct initialization", async function () {
            // Deploy OFT on a "remote" chain
            const OFTFactory = await ethers.getContractFactory("FDFIOFTUpgradeable");
            
            // Empty rate limit configs for initial deployment
            const rateLimitConfigs: any[] = [];
            
            const proxy = await upgrades.deployProxy(
                OFTFactory,
                [rateLimitConfigs, "FDFI OFT Token", "fdfiOFT", SEPOLIA_ENDPOINT, deployerAddr],
                {
                    initializer: "initialize",
                    constructorArgs: [SEPOLIA_ENDPOINT]
                }
            );
            
            await proxy.waitForDeployment();
            const oft = await ethers.getContractAt("FDFIOFTUpgradeable", await proxy.getAddress());

            // Verify basic properties
            expect(await oft.name()).to.equal("FDFI OFT Token");
            expect(await oft.symbol()).to.equal("fdfiOFT");
            expect(await oft.owner()).to.equal(deployerAddr);
            expect(await oft.totalSupply()).to.equal(0n);
        });

        it("Should allow owner to set rate limiter", async function () {
            const OFTFactory = await ethers.getContractFactory("FDFIOFTUpgradeable");
            const rateLimitConfigs: any[] = [];
            
            const proxy = await upgrades.deployProxy(
                OFTFactory,
                [rateLimitConfigs, "FDFI OFT Token", "fdfiOFT", SEPOLIA_ENDPOINT, deployerAddr],
                {
                    initializer: "initialize",
                    constructorArgs: [SEPOLIA_ENDPOINT]
                }
            );
            
            const oft = await ethers.getContractAt("FDFIOFTUpgradeable", await proxy.getAddress());

            await expect(oft.setRateLimiter(user1Addr))
                .to.emit(oft, "RateLimiterSet")
                .withArgs(user1Addr);

            expect(await oft.rateLimiter()).to.equal(user1Addr);
        });

        it("Should revert when non-owner tries to set rate limiter", async function () {
            const OFTFactory = await ethers.getContractFactory("FDFIOFTUpgradeable");
            const rateLimitConfigs: any[] = [];
            
            const proxy = await upgrades.deployProxy(
                OFTFactory,
                [rateLimitConfigs, "FDFI OFT Token", "fdfiOFT", SEPOLIA_ENDPOINT, deployerAddr],
                {
                    initializer: "initialize",
                    constructorArgs: [SEPOLIA_ENDPOINT]
                }
            );
            
            const oft = await ethers.getContractAt("FDFIOFTUpgradeable", await proxy.getAddress());

            await expect(oft.connect(user1).setRateLimiter(user1Addr)).to.be.reverted;
        });
    });

    describe("FDFIOFTAdapter Deployment", function () {
        let mainToken: FDFIToken;

        beforeEach(async function () {
            // Deploy the main FDFI token first
            const FDFIFactory = await ethers.getContractFactory("FDFIToken");
            const proxy = await upgrades.deployProxy(FDFIFactory, [deployerAddr], {
                initializer: "initialize"
            });
            await proxy.waitForDeployment();
            mainToken = await ethers.getContractAt("FDFIToken", await proxy.getAddress());

            // Mint some tokens
            await mainToken.mintTo(deployerAddr, ethers.parseUnits("1000000", 18));
            await mainToken.enableTransfers();
        });

        it("Should deploy adapter with correct configuration", async function () {
            const AdapterFactory = await ethers.getContractFactory("FDFIOFTAdapter");
            
            // Empty rate limit configs
            const rateLimitConfigs: any[] = [];
            
            const adapter = await AdapterFactory.deploy(
                await mainToken.getAddress(),
                SEPOLIA_ENDPOINT,
                deployerAddr,
                rateLimitConfigs
            );

            await adapter.waitForDeployment();

            // Verify adapter properties
            expect(await adapter.token()).to.equal(await mainToken.getAddress());
            expect(await adapter.owner()).to.equal(deployerAddr);
            expect(await adapter.rateLimiter()).to.equal(deployerAddr);
        });

        it("Should allow owner to update rate limits", async function () {
            const AdapterFactory = await ethers.getContractFactory("FDFIOFTAdapter");
            const rateLimitConfigs: any[] = [];
            
            const adapter = await AdapterFactory.deploy(
                await mainToken.getAddress(),
                SEPOLIA_ENDPOINT,
                deployerAddr,
                rateLimitConfigs
            );

            await adapter.waitForDeployment();

            // Set rate limits
            const newRateLimitConfigs = [{
                dstEid: 40102, // Binance Smart Chain testnet EID
                limit: ethers.parseUnits("100000", 18),
                window: 86400 // 24 hours
            }];

            await expect(adapter.setRateLimits(newRateLimitConfigs))
                .to.emit(adapter, "RateLimitsChanged");

            // Verify rate limit was set
            const rateLimit = await adapter.rateLimits(40102);
            expect(rateLimit.limit).to.equal(ethers.parseUnits("100000", 18));
            expect(rateLimit.window).to.equal(86400n);
        });

        it("Should allow rate limiter role to update limits", async function () {
            const AdapterFactory = await ethers.getContractFactory("FDFIOFTAdapter");
            const rateLimitConfigs: any[] = [];
            
            const adapter = await AdapterFactory.deploy(
                await mainToken.getAddress(),
                SEPOLIA_ENDPOINT,
                deployerAddr,
                rateLimitConfigs
            );

            await adapter.waitForDeployment();

            // Set user1 as rate limiter
            await adapter.setRateLimiter(user1Addr);

            // User1 should be able to set rate limits
            const newRateLimitConfigs = [{
                dstEid: 40102,
                limit: ethers.parseUnits("50000", 18),
                window: 3600
            }];

            await expect(adapter.connect(user1).setRateLimits(newRateLimitConfigs))
                .to.emit(adapter, "RateLimitsChanged");
        });

        it("Should revert when non-authorized user tries to update rate limits", async function () {
            const AdapterFactory = await ethers.getContractFactory("FDFIOFTAdapter");
            const rateLimitConfigs: any[] = [];
            
            const adapter = await AdapterFactory.deploy(
                await mainToken.getAddress(),
                SEPOLIA_ENDPOINT,
                deployerAddr,
                rateLimitConfigs
            );

            await adapter.waitForDeployment();

            const newRateLimitConfigs = [{
                dstEid: 40102,
                limit: ethers.parseUnits("50000", 18),
                window: 3600
            }];

            await expect(adapter.connect(user1).setRateLimits(newRateLimitConfigs))
                .to.be.revertedWithCustomError(adapter, "OnlyRateLimiter");
        });
    });

    describe("Integration: Adapter + Main Token", function () {
        let mainToken: FDFIToken;
        let adapter: FDFIOFTAdapter;

        beforeEach(async function () {
            // Deploy main token
            const FDFIFactory = await ethers.getContractFactory("FDFIToken");
            const proxy = await upgrades.deployProxy(FDFIFactory, [deployerAddr], {
                initializer: "initialize"
            });
            await proxy.waitForDeployment();
            mainToken = await ethers.getContractAt("FDFIToken", await proxy.getAddress());

            await mainToken.mintTo(deployerAddr, ethers.parseUnits("1000000", 18));
            await mainToken.enableTransfers();

            // Deploy adapter
            const AdapterFactory = await ethers.getContractFactory("FDFIOFTAdapter");
            adapter = await AdapterFactory.deploy(
                await mainToken.getAddress(),
                SEPOLIA_ENDPOINT,
                deployerAddr,
                []
            );
            await adapter.waitForDeployment();
        });

        it("Should correctly identify token address", async function () {
            expect(await adapter.token()).to.equal(await mainToken.getAddress());
            expect(await adapter.approvalRequired()).to.equal(true);
        });

        it("Should allow token holder to approve adapter", async function () {
            const approvalAmount = ethers.parseUnits("10000", 18);
            
            await expect(mainToken.approve(await adapter.getAddress(), approvalAmount))
                .to.emit(mainToken, "Approval")
                .withArgs(deployerAddr, await adapter.getAddress(), approvalAmount);

            expect(await mainToken.allowance(deployerAddr, await adapter.getAddress()))
                .to.equal(approvalAmount);
        });
    });
});
