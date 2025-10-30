# FDFIToken Test Suite

This folder contains the Hardhat / Mocha tests for `FDFIToken` (upgradeable fixed-supply governance token).

## Structure & Purpose
- `FDFIToken.test.ts` – Consolidated behavioral coverage:
  1. Initialization: Ensures total supply = 1B * 10^18, owner receives all, transfers disabled initially.
  2. Transfer Gating: Verifies peer transfers revert before `enableTransfers()`, succeed after, and the enable switch is one-way (second call reverts).
  3. Burn Logic: Burning reduces both holder balance and `totalSupply` (emits `Transfer` to zero address).
  4. Permit (EIP-2612): Signs typed data, sets allowance, and prevents signature replay via nonce consumption.
  5. Delegation & Votes: Self-delegation grants voting power; transfers move voting weight; recipient gets votes only after delegating; snapshots recorded.
  6. Past Votes Snapshot: Demonstrates historical vote query (`getPastVotes`) pre/post transfer.
  7. Ownership Two-Step: Tests `transferOwnership` and `acceptOwnership` flow (only pending owner can accept).
  8. Upgrade Path: Deploys V1, enables transfers, attempts (and fails) non-owner upgrade, then performs owner upgrade to mock V2 preserving state & supply.

## Running Tests
Ensure dependencies installed (from project root):
```
npm install
npm run test
```

## Adding New Tests
- Create additional `*.test.ts` files alongside `FDFIToken.test.ts`.
- Prefer isolated, small tests over enlarging the monolithic file further if adding new feature areas.
- If adding storage variables in an upgrade test, append above the storage gap and adjust its size accordingly.

## Common Patterns
- Deployment helper uses `upgrades.deployProxy` with `initialize(owner)`.
- Typed data for permit uses domain fields: `{ name: "FDFI Token", version: "1", chainId, verifyingContract }`.
- Event assertions use Chai's `to.emit(...).withArgs(...)` where practical.

## Extending Coverage Ideas
- Add explicit test for second `enableTransfers()` revert (already present but could be separated for clarity).
- Test failed permit (expired deadline / invalid signer).
- Test vote change after burn while delegated.
- Test upgrade adding a new storage variable to confirm layout safety.

## Troubleshooting
- Missing type definitions: run `npm install` to pull Hardhat & types.
- Non-deterministic block numbers for `getPastVotes`: ensure you await each transaction; Hardhat auto-mines sequentially.

---
Maintainers: Keep this README updated when adding new test categories or structural changes.
