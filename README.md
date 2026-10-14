# One Dollar Game

A dependency-free static storefront that sells browser games for **$1 each**,
paid in **Bitcoin, Litecoin, Ethereum, USDT or USDC**. No framework, no build
step, no payment processor — payments are verified on-chain.

- Home: `index.html` — 25-game catalog
- Game page: `game.html?id=<game>` — free playable demo + crypto checkout
- Free page: `free.html` — one full game, free
- Delivery: a Cloudflare Worker verifies the payment and returns the download

## Files

```
index.html              Store home + game grid
game.html               Game page: free demo + checkout (reads ?id=<game>)
free.html               A free playable game
assets/coins.js         YOUR wallet addresses + which coins to accept  <- edit
assets/games.js         YOUR catalog + store config                    <- edit
assets/app.js           Price, QR, multi-crypto checkout logic
assets/qrcode.js        Vendored QR generator
assets/style.css        Theme
games/*.html            Free playable demos (linked from game.html)
downloads/*.zip         Paid files (HTML + Python source) — gitignored
worker/                 Cloudflare Worker: payment verification + secure delivery
```

## Configure (`assets/coins.js`)

Put your **public receive addresses** here (never a seed/private key):

- `BTC` — your Bitcoin address
- `LTC` — your Litecoin address
- `ETH` — your Ethereum address (0x…). Also used to receive **USDT** and **USDC**
  (ERC-20), which share the same address.

Any coin left blank is hidden from checkout automatically. Then set
`workerUrl` in `assets/games.js` to your deployed Worker URL.

## Add games (`assets/games.js`)

Each entry: `id`, `name`, `tagline`, `emoji`, `cat`, `demo` (path to the free
playable HTML), and `desc`. The price is the global `priceUsd` (currently 1).

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy (GitHub Pages)

```bash
git init
git add .
git commit -m "One Dollar Game"
git branch -M main
git remote add origin https://github.com/SatoshiShelf/one-dollar-game.git
git push -u origin main
```

GitHub → **Settings → Pages → Source: Deploy from a branch → main / (root)**.
Live at `https://satoshishelf.github.io/one-dollar-game/`.

## How checkout works

1. Buyer plays the free demo, then clicks **Show payment details**.
2. The page shows the live amount (converted from USD) + a QR for the chosen coin.
3. Buyer pays on-chain to your address.
4. Buyer pastes the **transaction ID**.
5. The Worker verifies the payment for that chain and returns a short-lived
   signed download link (or the paid file directly).

See `worker/README.md` to deploy the Worker.

## Safety

- **Never** commit a seed phrase or private key. Only public addresses go here.
- Sell only games/content you own the rights to.
- Income from sales may be taxable where you live — keep records.
