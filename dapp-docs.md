# DeltaCoin DApp Documentation

## Overview

DeltaCoin is a contract-backed React DApp configured for the DeltaCoin contract at `0x64579f74d51ca10917CEe7655c5d5D7f12D166Db` on Polygon Mainnet. Its frontend provides wallet connection and a contract-console interface for token metadata, account data, and transaction inputs (`src/App.jsx`).

## Current environment

| Item | Status | Details |
|---|---|---|
| QuickDApp Preview | Available | The workspace is in `created` status and contains a frontend entry point (`index.html`, `src/main.jsx`). |
| Contract network | Polygon Mainnet | Chain ID `137`; configured contract address: `0x64579f74d51ca10917CEe7655c5d5D7f12D166Db`. |
| External website URL | Not available | No IPFS deployment or gateway URL is configured. |
| Contract reachable outside Remix IDE | Yes | The binding targets Polygon Mainnet rather than an in-browser Remix VM. This is configuration metadata, not a runtime availability check. |

## How to use

1. Open the DApp in QuickDApp Preview.
2. Select **Connect wallet** and authorize an account. The frontend expects Polygon Mainnet and prompts for the correct network when necessary (`src/App.jsx`).
3. Use the contract console to inspect displayed token or account information and enter values for the available actions (`src/App.jsx`).
4. Review transaction details in the wallet before approving any state-changing operation.
5. If the wallet account or network changes, confirm that the DApp has rebuilt the session before continuing (`src/App.jsx`).

## Features and contract coverage

Coverage below is based only on a static frontend source scan. **Not found** means no supported call pattern was detected; it does not prove that the feature is unsupported or absent at runtime.

| User action | Contract function | Transaction type | UI/source evidence | Coverage status |
|---|---|---|---|---|
| Claim an amount | `claimTokens(uint256)` | State-changing transaction | Claim amount state is present in `src/App.jsx`; no supported contract-call reference was detected. | Not found |
| Join tier 1 with an amount and referrer | `joinTier1(uint256,address)` | State-changing transaction | Tier amount and referrer input state are present in `src/App.jsx`; no supported contract-call reference was detected. | Not found |
| Mine an amount of coins | `mineCoins(uint256)` | State-changing transaction | Mine amount state is present in `src/App.jsx`; no supported contract-call reference was detected. | Not found |
| Mint coins to a market recipient | `mintCoinsForMarket(address,uint256)` | State-changing transaction | Market amount and recipient input state are present in `src/App.jsx`; no supported contract-call reference was detected. | Not found |
| Read token decimals | `decimals()` | Read only | Metadata display state is present in `src/App.jsx`; no supported contract-call reference was detected. | Not found |
| Read token name | `name()` | Read only | Metadata display state is present in `src/App.jsx`; no supported contract-call reference was detected. | Not found |
| Read contract owner | `owner()` | Read only | No supported frontend call reference was detected. | Not found |
| Read token symbol | `symbol()` | Read only | Metadata display state is present in `src/App.jsx`; no supported contract-call reference was detected. | Not found |
| Look up an address balance | `tokenBalances(address)` | Read only | Balance and lookup-address state are present in `src/App.jsx`; no supported contract-call reference was detected. | Not found |
| Read total supply | `totalSupply()` | Read only | Supply display state is present in `src/App.jsx`; no supported contract-call reference was detected. | Not found |
| Read the configured USDT token address | `usdtToken()` | Read only | No supported frontend call reference was detected. | Not found |
| Look up a user profile | `users(address)` | Read only | Profile and lookup-address state are present in `src/App.jsx`; no supported contract-call reference was detected. | Not found |

## Project files

- `src/App.jsx` — Main UI, wallet lifecycle, network checks, contract binding, form state, and user flows.
- `src/index.css` — Application-level responsive styling.
- `src/main.jsx` — React application bootstrap.
- `index.html` — HTML shell, browser imports, and QuickDApp runtime configuration hook.

## Limitations

- No external website deployment is available; the IPFS CID and gateway URL are not configured.
- The Graph is not configured, so the DApp has no indexed subgraph data source.
- The contract source path is unavailable. Access control, modifiers, internal validation, and implementation behavior therefore cannot be determined from the supplied context.
- Static coverage found no supported frontend call references for the ABI functions. This result does not establish whether calls are unavailable at runtime.
- Contract reachability and transaction success were not runtime-tested by this documentation process.
- The Base mini-app integration is not enabled.

## Safe updates

- Use **Ask AI to Update** from the target DApp for normal frontend changes.
- Edit maintainable frontend behavior in `src/App.jsx`, styling in `src/index.css`, bootstrap logic in `src/main.jsx`, or the HTML shell in `index.html`.
- Do not edit `dapp.config.json` manually; QuickDApp manages it.
- Contract address, ABI, network binding, contract removal, reprioritization, and cross-chain changes are outside normal frontend updates. Use the QuickDapp UI-supported binding workflow where available.
- Keep wallet, account-change, and chain-change handling intact when modifying transaction flows, and do not treat static source references as evidence that a transaction was tested or verified.
