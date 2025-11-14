// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20PermitUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import {ERC20BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import {ERC20VotesUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import {NoncesUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";

/**
 * @title FDFIToken
 * @notice A governance token with minting, burning, voting, upgradeability, and transfer gating.
 */
contract FDFIToken is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    Ownable2StepUpgradeable,
    UUPSUpgradeable
{
    // Fixed token metadata & capped total supply (2B FDFI, 18 decimals)
    string internal constant _NAME = "FDFI Token";
    string internal constant _SYMBOL = "FDFI";
    uint256 public constant MAX_SUPPLY = 2_000_000_000e18; // 2,000,000,000 * 10^18
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // Transfer gating: initially false; only owner can enable after distribution readiness.
    bool public transfersEnabled;

    event TransfersEnabled();

    function initialize(address owner_) external initializer {
        __ERC20_init(_NAME, _SYMBOL);
        __ERC20Permit_init(_NAME);
        __ERC20Burnable_init();
        __Ownable_init(owner_);
        __Ownable2Step_init();
        __UUPSUpgradeable_init();
        // Votes depends on ERC20 + EIP712 init
        __ERC20Votes_init();
        // No initial mint: supply starts at zero. Owner can mint vesting / distribution tranches via mintTo within cap.
        transfersEnabled = false; // transfers gated until explicitly enabled
    }

    /// @notice Mint tokens to an address respecting the immutable MAX_SUPPLY cap.
    /// @dev Only callable by owner. Reverts if cap exceeded.
    /// @param to Recipient address (e.g. vesting contract or treasury multisig).
    /// @param amount Amount of tokens to mint (18 decimals).
    function mintTo(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Cap exceeded");
        _mint(to, amount);
    }

    /// @notice Permanently enable transfers for all holders. One-way switch.
    function enableTransfers() external onlyOwner {
        require(!transfersEnabled, "Transfers already enabled");
        transfersEnabled = true;
        emit TransfersEnabled();
    }

    // Authorize upgrades (owner only)
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Intentionally empty - only owner can upgrade
        newImplementation;
    }

    // Resolve multiple inheritance overrides
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        // Allow mint (from=0) and burn (to=0) always; restrict peer transfers until enabled.
        if (from != address(0) && to != address(0)) {
            require(transfersEnabled, "Transfers disabled");
        }
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20PermitUpgradeable, NoncesUpgradeable) returns (uint256) {
        return super.nonces(owner);
    }

    // Minting is restricted to owner via mintTo and permanently bounded by MAX_SUPPLY.

    // Storage gap for future variable additions (upgrade safety)
    uint256[50] private __gap;
}
