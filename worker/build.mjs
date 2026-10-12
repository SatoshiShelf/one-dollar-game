// Generates src/embedded.js from assets/coins.js + assets/games.js + paid files.
// The generated file is gitignored — never commit it to the public repo.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, ".."); // repo root (parent of worker/)

globalThis.window = globalThis;
const coinsSrc = fs.readFileSync(path.join(root, "assets/coins.js"), "utf8");
const gamesSrc = fs.readFileSync(path.join(root, "assets/games.js"), "utf8");
const { COINS, GAMES, STORE_CONFIG } = new Function(
  coinsSrc + "\n" + gamesSrc +
  "\nreturn { COINS: window.COINS, GAMES: window.GAMES, STORE_CONFIG: window.STORE_CONFIG };"
)();

// coin config the Worker needs for verification
const coins = {};
for (const c of COINS) {
  if (c.type === "erc20" && !c.address) continue;   // erc20 share the ETH address
  if (c.type !== "erc20" && !c.address) continue;    // unconfigured -> skip
  coins[c.code] = {
    type: c.type,
    decimals: c.decimals,
    address: c.address,
    contract: c.contract || null,
    name: c.name,
  };
}

const deliverFile = path.join(here, "deliveries.local.json");
const deliveries = fs.existsSync(deliverFile)
  ? JSON.parse(fs.readFileSync(deliverFile, "utf8"))
  : {};

const out = {};
for (const g of GAMES) {
  const entry = { name: g.name, priceUsd: STORE_CONFIG.priceUsd };
  const url = deliveries[g.id];
  if (url) {
    entry.url = url; // external delivery link (e.g. MediaFire) — served only after payment
  } else {
    const zip = path.join(root, "downloads", g.id + ".zip");
    if (fs.existsSync(zip)) {
      entry.filename = g.id + ".zip";
      entry.contentType = "application/zip";
      entry.b64 = fs.readFileSync(zip).toString("base64");
    } else {
      console.warn("warn: no paid deliverable for " + g.id + " (add downloads/" + g.id + ".zip)");
    }
  }
  out[g.id] = entry;
}

const content =
  `export const CONFIG = ${JSON.stringify({ coins })}\n` +
  `export const PRODUCTS = ${JSON.stringify(out)}\n`;
fs.writeFileSync(path.join(here, "src", "embedded.js"), content);
console.log("embedded games:", Object.keys(out).length, "| coins:", Object.keys(coins).join(",") || "none");
