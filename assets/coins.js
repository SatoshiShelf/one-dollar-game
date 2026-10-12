// One Dollar Game — supported cryptocurrencies.
//
// HOW TO FILL THIS IN:
//   • BTC  -> your Bitcoin address (any wallet)
//   • LTC  -> your Litecoin address
//   • ETH  -> your Ethereum address (0x...) — used for ETH *and* for USDT/USDC
//   • USDT / USDC share the SAME Ethereum address as ETH.
// Coins with an empty `address` are hidden from checkout automatically.
window.COINS = [
  {
    code: "BTC", name: "Bitcoin", type: "btc", scheme: "bitcoin",
    address: "bc1qrs6leywqgu56d8h5ynw9ynn0e3kdduantgd2z3",
    decimals: 8, unit: "BTC", explorer: "https://mempool.space/tx/", color: "#f7931a",
  },
  {
    code: "LTC", name: "Litecoin", type: "ltc", scheme: "litecoin",
    address: "",
    decimals: 8, unit: "LTC", explorer: "https://litecoinspace.org/tx/", color: "#345d9d",
  },
  {
    code: "ETH", name: "Ethereum", type: "eth", scheme: "ethereum",
    address: "",
    decimals: 18, unit: "ETH", explorer: "https://etherscan.io/tx/", color: "#627eea",
  },
  {
    code: "USDT", name: "Tether", type: "erc20", scheme: "ethereum",
    address: "", contract: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6, unit: "USDT", explorer: "https://etherscan.io/tx/", color: "#26a17b",
  },
  {
    code: "USDC", name: "USD Coin", type: "erc20", scheme: "ethereum",
    address: "", contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6, unit: "USDC", explorer: "https://etherscan.io/tx/", color: "#2775ca",
  },
];
