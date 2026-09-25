# Delta Coin (DLC) — Portal Documentation

- Name: Delta Coin
- Symbol: DLC
- Total supply: 1,000,000,000 DLC
- Network: Polygon PoS (chain ID 137)
- Contract: `0xB0cea145750E76Ccb24a0007206f2485dd5bf21a`
- Tally: https://tally.so/r/J97gqJ
- QuickSwap: configured in `index.html` and `dapp.config.json`

## Support / donations

Ethereum / Polygon / BNB Chain: `0xDdC03Ca5d7A644547e720851F3999dF2a2145292`

USDT (ERC-20 / TRC-20): `0xdAC17F958D2ee523a2206206994597C13D831ec7`

Verify the address and network in the wallet before sending funds.

## GitHub Pages

The repository root contains `index.html`, so GitHub Pages can serve it directly from `/(root)`. The included `.nojekyll` keeps this as a plain static site.

1. Upload the ZIP contents to the repository root.
2. Commit the files.
3. GitHub → Settings → Pages.
4. Choose **Deploy from a branch**, select your branch and `/(root)`.
5. Save.

## Countdown

Edit `assets/app.js` and replace `LAUNCH_DATE` with the official launch timestamp.

## Safety

This is a static portal. It does not custody funds or request private keys/seed phrases. Verify all token, network, DEX and donation details independently before publishing.
