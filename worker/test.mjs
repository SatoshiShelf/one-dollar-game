// Minimal unit tests for the worker's pure logic. Run: node test.mjs
import assert from "node:assert";
import {
  makeToken, verifyToken, b64ToBytes, b64url, ub64url,
  verifyUtxo, verifyEth, verifyErc20, coinUsdPrice,
} from "./src/lib.js";

let pass = 0;
function ok(name, cond) { assert.ok(cond, name); pass++; console.log("  ok -", name); }

// base64url roundtrip
{
  const bytes = new Uint8Array([0, 1, 2, 253, 254, 255, 62, 63]);
  const back = ub64url(b64url(bytes));
  ok("b64url roundtrip", back.every((v, i) => v === bytes[i]));
}

// token sign / verify
{
  const secret = "test-secret";
  const tok = await makeToken(secret, { p: "snake", t: "abc" }, 900);
  ok("token parts", tok.split(".").length === 2);
  const p = await verifyToken(secret, tok);
  ok("token validates", p && p.p === "snake" && p.t === "abc");
  ok("wrong secret rejected", (await verifyToken("other", tok)) === null);
  ok("tampered rejected", (await verifyToken(secret, tok.replace(/.$/, "x"))) === null);
  ok("expired rejected", (await verifyToken(secret, await makeToken(secret, { p: "x" }, -10))) === null);
}

// ---- BTC / LTC (utxo) ----
{
  const addr = "bc1qtestaddress";
  const mk = (vouts, status) => async () => ({ ok: true, status: 200, json: async () => ({ vout: vouts, status }) });
  const good = await verifyUtxo({ txid: "a".repeat(64), address: addr, minUnits: 1000,
    apiBase: "https://mempool.space/api", fetchImpl: mk([{ scriptpubkey_address: addr, value: 1500 }], { confirmed: true, block_height: 900000 }) });
  ok("utxo valid accepted", good.ok && good.paid === 1500 && good.confirmed);
  const under = await verifyUtxo({ txid: "a".repeat(64), address: addr, minUnits: 1000,
    apiBase: "x", fetchImpl: mk([{ scriptpubkey_address: addr, value: 400 }], {}) });
  ok("utxo underpay rejected", !under.ok);
  const wrong = await verifyUtxo({ txid: "a".repeat(64), address: addr, minUnits: 1000,
    apiBase: "x", fetchImpl: mk([{ scriptpubkey_address: "nope", value: 9e9 }], {}) });
  ok("utxo wrong address rejected", !wrong.ok);
  const bad = await verifyUtxo({ txid: "nope", address: addr, minUnits: 1, apiBase: "x", fetchImpl: mk([], {}) });
  ok("utxo bad txid rejected", !bad.ok);
}

// ---- Ethereum native ----
{
  const addr = "0x1111111111111111111111111111111111111111";
  const rpc = async (url, opts) => {
    const { method } = JSON.parse(opts.body);
    if (method === "eth_getTransactionByHash") return { ok: true, status: 200, json: async () => ({ result: { to: addr, value: "0xde0b6b3a7640000" } }) }; // 1 ETH
    return { ok: true, status: 200, json: async () => ({ result: { blockNumber: "0x123", status: "0x1" } }) };
  };
  const good = await verifyEth({ txid: "0x" + "a".repeat(64), address: addr, minUnits: "1000000000000000", rpcUrl: "x", fetchImpl: rpc });
  ok("eth valid accepted", good.ok && good.confirmed);
  const small = await verifyEth({ txid: "0x" + "a".repeat(64), address: addr, minUnits: "9999999999999999999", rpcUrl: "x", fetchImpl: rpc });
  ok("eth underpay rejected", !small.ok);
  const wrongTo = await verifyEth({ txid: "0x" + "a".repeat(64), address: "0x2222222222222222222222222222222222222222", minUnits: "1", rpcUrl: "x", fetchImpl: rpc });
  ok("eth wrong recipient rejected", !wrongTo.ok);
  const bad = await verifyEth({ txid: "nope", address: addr, minUnits: "1", rpcUrl: "x", fetchImpl: rpc });
  ok("eth bad hash rejected", !bad.ok);
}

// ---- ERC-20 (USDT/USDC) ----
{
  const addr = "0x1111111111111111111111111111111111111111";
  const contract = "0xcontract";
  const topic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  const padded = "0x" + addr.toLowerCase().slice(2).padStart(64, "0");
  const rpc = async () => ({ ok: true, status: 200, json: async () => ({ result: {
    status: "0x1", blockNumber: "0x10",
    logs: [{ address: contract, topics: [topic, "0x" + "0".repeat(64), padded], data: "0x" + (1000000n).toString(16) }],
  } }) });
  const good = await verifyErc20({ txid: "0x" + "b".repeat(64), address: addr, contract, minUnits: "1000000", rpcUrl: "x", fetchImpl: rpc });
  ok("erc20 valid accepted", good.ok && good.paid === "1000000" && good.confirmed);
  const small = await verifyErc20({ txid: "0x" + "b".repeat(64), address: addr, contract, minUnits: "2000000", rpcUrl: "x", fetchImpl: rpc });
  ok("erc20 underpay rejected", !small.ok);
}

// ---- price ----
{
  const p = await coinUsdPrice({ type: "erc20", fetchImpl: async () => ({ ok: false }) });
  ok("stablecoin price is 1", p === 1);
  const btc = await coinUsdPrice({ type: "btc", fetchImpl: async () => ({ ok: true, json: async () => ({ bitcoin: { usd: 60000 } }) }) });
  ok("btc price parsed", btc === 60000);
}

ok("b64ToBytes length", b64ToBytes("aGVsbG8=").length === 5);

console.log(`\n${pass} checks passed`);
