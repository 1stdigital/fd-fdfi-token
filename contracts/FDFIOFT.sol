// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { ERC20PermitUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import { ERC20BurnableUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";

import { OFTUpgradeable } from "@layerzerolabs/oft-evm-upgradeable/contracts/oft/OFTUpgradeable.sol";
// Local wrapper since LayerZero does not provide an upgradeable RateLimiter
import { RateLimiterUpgradeable } from "./libs/RateLimiterUpgradeable.sol";
/**
 * @title FDFIOFTUpgradeable
 * @notice Upgradeable LayerZero OFT token for non-canonical chains
 */
contract FDFIOFTUpgradeable is
    Initializable,
    OFTUpgradeable,
    RateLimiterUpgradeable,
    ERC20PermitUpgradeable,
    ERC20BurnableUpgradeable,
    Ownable2StepUpgradeable,
    UUPSUpgradeable
{
    /// @notice Address allowed to update rate limits dynamically
    address public rateLimiter;

    /// @dev Emitted when the rate limiter contract is updated.
    event RateLimiterSet(address indexed newRateLimiter);

    /// @dev Custom error for restricted functions
    error OnlyRateLimiter();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address _lzEndpoint) OFTUpgradeable(_lzEndpoint) {
        _disableInitializers();
    }

    /**
     * @notice Initialize the upgradeable OFT token
     * @param _rateLimitConfigs Initial rate limit configs (can be empty)
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _lzEndpoint LayerZero endpoint
     * @param _owner Admin / multisig owner
     */
    function initialize(
        RateLimitConfig[] memory _rateLimitConfigs,
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _owner
    ) external initializer {
        __OFT_init(_name, _symbol, _owner);
        __ERC20Permit_init(_name);
        __ERC20Burnable_init();
        __Ownable2Step_init();
        __UUPSUpgradeable_init();
        __RateLimiter_init(_rateLimitConfigs);
        _transferOwnership(_owner);
    }

    /*//////////////////////////////////////////////////////////////
                            RATE LIMITING
    //////////////////////////////////////////////////////////////*/

    /// @notice Set external rate limiter contract (owner only)
    function setRateLimiter(address _rateLimiter) external onlyOwner {
        rateLimiter = _rateLimiter;
        emit RateLimiterSet(_rateLimiter);
    }

    /// @notice Update rate limits (callable by owner or authorized rate limiter)
    function setRateLimits(RateLimitConfig[] calldata _rateLimitConfigs) external {
        if (msg.sender != rateLimiter && msg.sender != owner()) revert OnlyRateLimiter();
        _setRateLimits(_rateLimitConfigs);
    }

    /// @dev Hook: enforce rate limit on outbound transfers
    function _debit(
        address _from,
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal virtual override returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        _outflow(_dstEid, _amountLD);
        return super._debit(_from, _amountLD, _minAmountLD, _dstEid);
    }

    /*//////////////////////////////////////////////////////////////
                           UPGRADE CONTROL
    //////////////////////////////////////////////////////////////*/

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @dev Override to resolve conflict between Ownable2Step and OFTCore
    function transferOwnership(address newOwner) public virtual override(OwnableUpgradeable, Ownable2StepUpgradeable) onlyOwner {
        Ownable2StepUpgradeable.transferOwnership(newOwner);
    }

    /// @dev Override to resolve conflict between Ownable2Step and OFTCore
    function _transferOwnership(address newOwner) internal virtual override(OwnableUpgradeable, Ownable2StepUpgradeable) {
        Ownable2StepUpgradeable._transferOwnership(newOwner);
    }

    uint256[50] private __gap;
}
