// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FDFIToken} from "../FDFIToken.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @notice Mock upgrade adding a view function to verify state preservation.
contract FDFITokenV2 is FDFIToken {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function version() external pure returns (string memory) {
        return "2";
    }
}
