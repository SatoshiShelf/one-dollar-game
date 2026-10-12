// One Dollar Game worker — pure helpers (testable in Node >=20)

// ---------- signed download tokens (HMAC-SHA256) ----------
const enc = new TextEncoder();

export function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function ub64url(str) {
  str = String(str).replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
export function b64ToBytes(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(new Uint8Array(sig));
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
export async function makeToken(secret, payload, ttlSec, nowSec) {
  const now = nowSec || Math.floor(Date.now() / 1000);
  const body = { ...payload, e: now + ttlSec };
  const p = b64url(enc.encode(JSON.stringify(body)));
  const s = await hmac(secret, p);
  return p + "." + s;
}
export async function verifyToken(secret, token, nowSec) {
  const [p, s] = String(token || "").split(".");
  if (!p || !s) return null;
  const expect = await hmac(secret, p);
  if (!safeEqual(expect, s)) return null;
  let body;
  try { body = JSON.parse(new TextDecoder().decode(ub64url(p))); } catch { return null; }
  const now = nowSec || Math.floor(Date.now() / 1000);
  if (!body.e || body.e < now) return null;
  return body;
}

// ---------- payment verification ----------
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// Bitcoin / Litecoin (mempool.space-style API)
export async function verifyUtxo({ txid, address, minUnits, apiBase, fetchImpl }) {
  const f = fetchImpl || fetch;
  if (!/^[0-9a-fA-F]{64}$/.test(String(txid || ""))) {
    return { ok: false, reason: "That doesn't look like a valid transaction ID." };
  }
  const r = await f(apiBase + "/tx/" + txid);
  if (r.status === 404) return { ok: false, reason: "Transaction not found yet — wait a moment and retry." };
  if (!r.ok) return { ok: false, reason: "Block explorer unavailable. Try again." };
  const tx = await r.json();
  let paid = 0;
  for (const v of (tx.vout || [])) {
    if (v.scriptpubkey_address === address) paid += v.value || 0;
  }
  if (paid < minUnits) {
    return { ok: false, reason: `Payment was ${paid} sats; ${minUnits} required.`, paid };
  }
  const confirmed = !!(tx.status && tx.status.confirmed);
  return { ok: true, paid, confirmed, block: confirmed ? tx.status.block_height : null };
}

async function rpc(url, method, params, f) {
  const r = await f(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!r.ok) throw new Error("rpc " + r.status);
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || "rpc error");
  return d.result;
}
function hexBig(h) { return BigInt(h || "0x0"); }
function eq(addr, target) {
  return String(addr || "").toLowerCase() === String(target || "").toLowerCase();
}

// Ethereum native (ETH)
export async function verifyEth({ txid, address, minUnits, rpcUrl, fetchImpl }) {
  const f = fetchImpl || fetch;
  if (!/^0x[0-9a-fA-F]{64}$/.test(String(txid || ""))) {
    return { ok: false, reason: "That doesn't look like a valid Ethereum transaction hash." };
  }
  let tx, rc;
  try {
    tx = await rpc(rpcUrl, "eth_getTransactionByHash", [txid], f);
    rc = await rpc(rpcUrl, "eth_getTransactionReceipt", [txid], f);
  } catch {
    return { ok: false, reason: "Ethereum node unavailable. Try again." };
  }
  if (!tx) return { ok: false, reason: "Transaction not found yet — wait a moment and retry." };
  if (!eq(tx.to, address)) return { ok: false, reason: "That transaction wasn't sent to our address." };
  const value = hexBig(tx.value);
  if (value < BigInt(minUnits)) {
    return { ok: false, reason: "Payment amount was too small for this game." };
  }
  const confirmed = !!(rc && rc.blockNumber);
  const failed = rc && rc.status && hexBig(rc.status) === 0n;
  if (failed) return { ok: false, reason: "That transaction failed on-chain." };
  return { ok: true, paid: value.toString(), confirmed, block: confirmed ? Number(hexBig(rc.blockNumber)) : null };
}

// ERC-20 (USDT / USDC)
export async function verifyErc20({ txid, address, contract, minUnits, rpcUrl, fetchImpl }) {
  const f = fetchImpl || fetch;
  if (!/^0x[0-9a-fA-F]{64}$/.test(String(txid || ""))) {
    return { ok: false, reason: "That doesn't look like a valid Ethereum transaction hash." };
  }
  let rc;
  try {
    rc = await rpc(rpcUrl, "eth_getTransactionReceipt", [txid], f);
  } catch {
    return { ok: false, reason: "Ethereum node unavailable. Try again." };
  }
  if (!rc) return { ok: false, reason: "Transaction not found yet — wait a moment and retry." };
  if (rc.status && hexBig(rc.status) === 0n) return { ok: false, reason: "That transaction failed on-chain." };

  const want = "0x" + String(address).toLowerCase().replace(/^0x/, "").padStart(64, "0");
  let paid = 0n;
  for (const log of (rc.logs || [])) {
    if (!eq(log.address, contract)) continue;
    const topics = log.topics || [];
    if (topics[0] !== TRANSFER_TOPIC) continue;
    const to = "0x" + String(topics[2] || "").toLowerCase().replace(/^0x/, "");
    if (to !== want) continue;
    paid += hexBig(log.data);
  }
  if (paid < BigInt(minUnits)) {
    return { ok: false, reason: "No matching token transfer of the right amount found in that transaction." };
  }
  const confirmed = !!rc.blockNumber;
  return { ok: true, paid: paid.toString(), confirmed, block: confirmed ? Number(hexBig(rc.blockNumber)) : null };
}

// Live USD price for a coin (stablecoins are 1).
export async function coinUsdPrice({ type, fetchImpl }) {
  const f = fetchImpl || fetch;
  if (type === "erc20") return 1;
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,litecoin,ethereum&vs_currencies=usd";
  const r = await f(url);
  if (!r.ok) throw new Error("price");
  const d = await r.json();
  if (type === "btc") return d.bitcoin && d.bitcoin.usd;
  if (type === "ltc") return d.litecoin && d.litecoin.usd;
  if (type === "eth") return d.ethereum && d.ethereum.usd;
  throw new Error("price");
}
