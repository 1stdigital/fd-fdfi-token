// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { RateLimiter } from "@layerzerolabs/oapp-evm/contracts/oapp/utils/RateLimiter.sol";

/**
 * @title RateLimiterUpgradeable
 * @notice Upgradeable wrapper around LayerZero's RateLimiter utility.
 * @dev LayerZero's RateLimiter has no constructor mutating storage, so this is a thin initializer facade.
 *      Provides an initializer for setting initial rate limit configs in proxy deployments.
 */
abstract contract RateLimiterUpgradeable is Initializable, RateLimiter {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize rate limiter with initial config set.
     * @param _rateLimitConfigs Array of RateLimitConfig entries to set (can be empty).
     */
    function __RateLimiter_init(RateLimitConfig[] memory _rateLimitConfigs) internal onlyInitializing {
        if (_rateLimitConfigs.length > 0) {
            _setRateLimits(_rateLimitConfigs);
        }
    }

    // Storage gap for future upgradeable additions
    uint256[50] private __rateLimiterGap;
}
