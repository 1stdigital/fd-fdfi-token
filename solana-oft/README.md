# 🪙 Solana OFT (Omnichain Fungible Token)

This repository contains the **Solana implementation** of a LayerZero **Omnichain Fungible Token (OFT)**.  
It’s configured for Solana-only deployment and testing, aligned with LayerZero’s reference implementation.

---

## ⚙️ Prerequisites

Before deploying, ensure your local environment is set up with:

- **Anchor CLI** `v0.29.0`
- **Rust** (as defined in `rust-toolchain.toml`)
- **Solana CLI** `v1.18+`
- Access to a funded Solana wallet (for deployment fees)
- Correct environment variables configured (see below)

> 🧩 *Anchor v0.29.0 does not support `anchor keys sync` or `.anchor` IDL auto-sync features introduced later.  
> You’ll use `anchor build` → `anchor deploy` → manual IDL updates.*

---

## 📁 Project Structure (Trimmed)

```
Anchor.toml          # Anchor configuration (currently [programs.localnet])
Cargo.toml           # Workspace manifest
Cargo.lock           # Locked dependency versions
rust-toolchain.toml  # Pinned Rust toolchain
programs/oft/        # Solana OFT program source (instructions, state, codecs)
docs/                # Upstream reference docs retained (optional)
.env.example         # Environment variable template for OFT_ID, metadata
junk-id.json         # Placeholder wallet key (local use only)
```

All TypeScript automation tasks were removed; deployment and configuration are now purely manual (Anchor CLI + Solana CLI). You can reintroduce scripts later if desired.

---

## 🧩 Configuration Steps (Before Deployment)

### 1. **Set up environment variables**

Copy `.env.example` → `.env`, then edit:

```env
OFT_ID=YourProgramPubkeyHere   # Leave empty until first deploy; then populate
TOKEN_NAME=MyToken             # (Optional) if you will create a mint & metadata externally
TOKEN_SYMBOL=MYT               # Must mirror canonical branding
TOKEN_DECIMALS=18              # 9 on Solana is typical; keep 18 only if deliberate parity
RPC_URL=https://api.devnet.solana.com
WALLET_PATH=~/.config/solana/id.json
```

Notes:
- `OFT_ID` is the program’s public key (populate after first successful deploy unless you pre-generate).
- `TOKEN_DECIMALS` should match your EVM representation if you want 1:1 nominal UX; otherwise prefer 9.
- This trimmed repo no longer ships a mint creation script—metadata initialization is up to your external flow.

### 2. Sync the Program ID

Ensure consistency in three locations:

| Location                  | What to set                                                                          | Notes                                                           |
| ------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `programs/oft/src/lib.rs` | `declare_id!(Pubkey::new_from_array(program_id_from_env!("OFT_ID", "<fallback>")));` | Leave macro unless switching to fixed ID.                       |
| `.env`                    | `OFT_ID=<final_program_pubkey>`                                                      | Add after deployment or pre-generate.                           |
| `Anchor.toml`             | `[programs.localnet].oft = "<final_program_pubkey>"`                                 | Currently using `localnet`; change section if targeting devnet. |

🔹 After first deploy copy the printed program id into `.env` and `Anchor.toml`, then rebuild for deterministic artifacts.

### 3. Select Cluster

In `Anchor.toml` you currently have:

```toml
[provider]
cluster = "Localnet"
wallet = "./junk-id.json"
```

For devnet:
```toml
[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```
Switch to mainnet only after governance & security hardening.

### 4. (Optional) Token Metadata
This trimmed repository does not include automated mint/metadata scripts. If you need a synthetic mint:
1. Create mint via SPL CLI or a small Anchor client script.
2. (Optional) Create Metaplex metadata account aligning `name`, `symbol`, `decimals`.
3. Ensure decimals align with your bridging normalization logic.

## 🚀 Deployment (Anchor v0.29.0)

Build:
```bash
anchor build -e OFT_ID=$OFT_ID
```
If you have not pre-generated a keypair, you can instead:
```bash
solana-keygen new -o target/deploy/oft-keypair.json
export OFT_ID=$(solana-keygen pubkey target/deploy/oft-keypair.json)
anchor build -e OFT_ID=$OFT_ID
```

Deploy:
```bash
anchor deploy
```
Copy the new program ID printed by Anchor.

Update configs

bash
Copy code
# .env
OFT_ID=<your_new_program_id>

# Anchor.toml
[programs.devnet]
oft = "<your_new_program_id>"
If creating a mint, perform that separately (not included here).

## ✅ Verification

Suggested checks:
1. `anchor keys list` (confirm program matches `OFT_ID`).
2. `solana program show <program_id>` (verify deployment slot & upgrade authority).
3. (If mint created) `spl-token account-info` and metadata via Solana Explorer.
4. Run any custom integration test harness (add later if needed).

## 📘 Reference

- LayerZero Docs: https://docs.layerzero.network
- Anchor Docs: https://www.anchor-lang.com/
- Solana CLI: https://docs.solana.com/cli
- SPL Token CLI: https://spl.solana.com/token
- Metaplex Metadata: https://docs.metaplex.com/

---

Maintainers: Minimal Solana-only OFT scaffold; multi-chain scripts removed for clarity. Reintroduce scripting or Node tooling only if operational automation is required later.

---

> (Optional) A condensed `README_TESTERS.md` can be added on request for CI / QA handoff.