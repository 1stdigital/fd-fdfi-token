// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { OFTAdapter } from "@layerzerolabs/oft-evm/contracts/OFTAdapter.sol";
import { RateLimiter } from "@layerzerolabs/oapp-evm/contracts/oapp/utils/RateLimiter.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FDFIOFTAdapter
 * @notice Adapts an existing ERC-20 token to LayerZero Omnichain Fungible Token (OFT) cross-chain capabilities.
 * @dev Based on the standard OFTAdapter and extended with optional rate limiting controls (similar to Morpho's approach).
 * @dev LOSSLESS ASSUMPTION: Default OFTAdapter assumes 1:1 token movement (no fee-on-transfer). If the underlying token
 *      charges transfer fees or rebases, a custom implementation must override balance accounting (pre/post diff).
 * @dev SINGLETON: Only deploy ONE adapter per underlying token across a global OFT mesh. Multiple adapters would
 *      fragment liquidity and break total supply invariants.
 */
contract FDFIOFTAdapter is OFTAdapter, RateLimiter {
    /// @notice Address allowed to update rate limits (operational role separate from owner)
    address public rateLimiter;

    /// @dev Emitted when rate limiter role is updated
    event RateLimiterSet(address indexed newRateLimiter);

    /// @dev Thrown when caller lacks permission to adjust limits
    error OnlyRateLimiter();
    /**
     * @param _token      Address of the existing ERC-20 token to wrap as OFT.
     * @param _lzEndpoint LayerZero endpoint address for this chain.
     * @param _owner      Admin / owner (receives Ownable privileges & can update rate limits).
     * @param _rateLimitConfigs Optional initial rate limit configs (pass empty array if not used).
     */
    constructor(
        address _token,
        address _lzEndpoint,
        address _owner,
        RateLimitConfig[] memory _rateLimitConfigs
    ) OFTAdapter(_token, _lzEndpoint, _owner) Ownable(_owner) {
        if (_rateLimitConfigs.length > 0) {
            _setRateLimits(_rateLimitConfigs);
        }
        // Initialize rateLimiter to owner by default; can be rotated to dedicated ops contract later
        rateLimiter = _owner;
    }

    /**
     * @notice Update lane-specific rate limit configurations.
     * @dev Only callable by owner. Consider timelock or multi-sig for production deployments.
     */
    /// @notice Set external rate limiter contract (owner only)
    function setRateLimiter(address _rateLimiter) external onlyOwner {
        rateLimiter = _rateLimiter;
        emit RateLimiterSet(_rateLimiter);
    }

    /// @notice Update rate limits (callable by owner or designated rateLimiter)
    function setRateLimits(RateLimitConfig[] memory _rateLimitConfigs) external {
        if (msg.sender != rateLimiter && msg.sender != owner()) revert OnlyRateLimiter();
        _setRateLimits(_rateLimitConfigs);
    }
}