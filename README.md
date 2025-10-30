# FDFI Token

FDFI is an upgradeable ERC20 governance token with a maximum supply cap of 2 billion tokens.

## Contracts

### FDFIToken.sol
Main token contract implementing:
- ERC20 standard (transfer, approve, allowance)
- ERC20Burnable (holders can burn their tokens)
- ERC20Permit (EIP-2612 gasless approvals)
- ERC20Votes (governance voting power with delegation)
- Ownable2Step (two-step ownership transfer)
- UUPSUpgradeable (upgradeable via proxy pattern)

**Key Features:**
- Maximum supply: 2,000,000,000 FDFI (2 billion tokens)
- Initial supply: 0 (owner mints as needed via `mintTo()`)
- Transfers disabled by default, enabled once via `enableTransfers()`
- Governance delegation and voting power snapshots

### FDFIOFTUpgradeable (FDFIOFT.sol)
LayerZero OFT (Omnichain Fungible Token) implementation for cross-chain FDFI on destination chains. Includes rate limiting and upgradeability.

### FDFIOFTAdapter (FDFIAdapter.sol)
LayerZero adapter for the canonical FDFI token on the source chain (Ethereum). Wraps the existing ERC20 token for cross-chain transfers.

### Solana OFT (solana-oft/)
Solana implementation of LayerZero OFT for cross-chain FDFI transfers to/from Solana. Built with Anchor framework and compatible with LayerZero's Solana endpoint.

## Deployment

### Prerequisites
```bash
npm install
cp .env.example .env
# Configure environment variables in .env
```

### Environment Variables
```
PRIVATE_KEY=              # Deployer private key
SEPOLIA_RPC=              # Ethereum Sepolia RPC URL
BSC_TESTNET_RPC=          # BSC Testnet RPC URL
FDFI_TOKEN_ADDRESS=       # Deployed token address
ETHERSCAN_API_KEY=        # For contract verification
BSCSCAN_API_KEY=          # For contract verification
SEPOLIA_ENDPOINT=         # LayerZero Sepolia endpoint
BSC_ENDPOINT=             # LayerZero BSC endpoint
```

### Deploy FDFI Token
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### Upgrade Contract
```bash
npx hardhat run scripts/upgrade.ts --network sepolia
```

### Deploy Solana OFT
```bash
cd solana-oft
anchor build
anchor deploy --provider.cluster devnet
# Update OFT_ID in .env with deployed program ID
```

## Testing

### EVM Contracts
```bash
npx hardhat test                         # Run all tests
npx hardhat test test/FDFIToken.test.ts  # Run specific test file
```

### Solana OFT
```bash
cd solana-oft
anchor test
```

## Key Functions

### Owner Functions
- `mintTo(address to, uint256 amount)` - Mint tokens up to MAX_SUPPLY
- `enableTransfers()` - Permanently enable token transfers (one-time only)
- `upgradeToAndCall(address newImplementation, bytes data)` - Upgrade contract implementation

### User Functions
- `transfer(address to, uint256 amount)` - Transfer tokens
- `approve(address spender, uint256 amount)` - Approve spending allowance
- `permit(...)` - Gasless approval via EIP-2612
- `delegate(address delegatee)` - Delegate voting power
- `burn(uint256 amount)` - Burn tokens to reduce supply

## License
MIT
