// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title MockLayerZeroEndpoint
 * @notice Minimal mock of LayerZero endpoint for testing OFT/Adapter contracts
 * @dev This is a simplified mock that implements just enough to allow contract deployment
 */
contract MockLayerZeroEndpoint {
    uint32 public immutable eid;
    
    constructor() {
        eid = 1; // Mock endpoint ID
    }
    
    function send(
        bytes calldata,
        bytes calldata,
        address
    ) external payable returns (bytes32) {
        return bytes32(0);
    }
    
    function quote(
        bytes calldata,
        bytes calldata
    ) external view returns (uint256, uint256) {
        return (0, 0);
    }
    
    function setDelegate(address) external {}
}
