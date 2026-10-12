// End-to-end test of the worker handler using Node's global fetch/Request/Response.
// Run: node integration.test.mjs
import assert from "node:assert";
import worker from "./src/index.js";

const ADDR = "bc1qrs6leywqgu56d8h5ynw9ynn0e3kdduantgd2z3"; // matches assets/coins.js
const TXID = "c".repeat(64);

let payValue = 2000; // sats
globalThis.fetch = async (u, opts) => {
  if (String(u).includes("coingecko")) {
    return { ok: true, status: 200, json: async () => ({ bitcoin: { usd: 60000 }, litecoin: { usd: 80 }, ethereum: { usd: 3000 } }) };
  }
  if (String(u).includes("/tx/")) {
    return { ok: true, status: 200, json: async () => ({ vout: [{ scriptpubkey_address: ADDR, value: payValue }], status: { confirmed: true, block_height: 800000 } }) };
  }
  return { ok: false, status: 404, json: async () => ({}) };
};

const env = { DOWNLOAD_SECRET: "s3cret", BTC_API: "https://mempool.space/api" };
const call = (path, opts) => worker.fetch(new Request("https://w.dev" + path, opts), env);
const post = (body) => call("/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

{
  const j = await (await call("/health")).json();
  assert.ok(j.ok && j.games.includes("snake") && j.coins.includes("BTC"));
  console.log("  ok - health lists games + configured coins");
}

let token;
{
  const j = await (await post({ txid: TXID, productId: "snake", code: "BTC" })).json();
  assert.ok(j.ok, "verify should pass: " + JSON.stringify(j));
  assert.ok(/^\/download\?token=/.test(j.downloadUrl), "should return a signed download path: " + j.downloadUrl);
  assert.ok(j.confirmed);
  token = new URLSearchParams(j.downloadUrl.split("?")[1]).get("token");
  console.log("  ok - /verify (BTC) accepts a valid payment ->", j.downloadUrl.slice(0, 32) + "...");
}

{
  const r = await post({ txid: TXID, productId: "nope", code: "BTC" });
  assert.strictEqual(r.status, 404);
  console.log("  ok - /verify rejects unknown game");
}

{
  const j = await (await post({ txid: TXID, productId: "snake", code: "USDT" })).json();
  assert.ok(!j.ok && /Unsupported coin/.test(j.reason));
  console.log("  ok - /verify rejects an unconfigured coin");
}

{
  payValue = 10;
  const j = await (await post({ txid: TXID, productId: "snake", code: "BTC" })).json();
  assert.ok(!j.ok);
  payValue = 2000;
  console.log("  ok - /verify rejects underpayment");
}

{
  const r = await call("/download?token=bogus.token");
  assert.strictEqual(r.status, 403);
  console.log("  ok - /download rejects forged token");
}

{
  const r = await call("/download?token=" + encodeURIComponent(token));
  assert.strictEqual(r.status, 200);
  assert.ok(/zip/.test(r.headers.get("content-type") || ""), "content-type should be zip");
  const buf = new Uint8Array(await r.arrayBuffer());
  assert.ok(buf.length > 1000 && buf[0] === 0x50 && buf[1] === 0x4b, 'zip should start with "PK"');
  console.log("  ok - /download with a valid token serves the paid zip");
}

{
  const h = await (await call("/health")).json();
  let ready = 0;
  for (const id of h.games) {
    const j = await (await post({ txid: TXID, productId: id, code: "BTC" })).json();
    assert.ok(j.ok, "verify should pass for " + id + ": " + JSON.stringify(j));
    const t = new URLSearchParams(j.downloadUrl.split("?")[1]).get("token");
    const r = await call("/download?token=" + encodeURIComponent(t));
    assert.ok(r.status === 200 || r.status === 503, id + " should be 200 or 503, got " + r.status);
    if (r.status === 200) {
      const buf = new Uint8Array(await r.arrayBuffer());
      assert.ok(buf[0] === 0x50 && buf[1] === 0x4b, id + " zip should start with PK");
      ready++;
    }
  }
  assert.strictEqual(ready, h.games.length, "every catalog game should now be deliverable");
  console.log("  ok - every catalog game serves a real zip (" + ready + "/" + h.games.length + ")");
}

console.log("\nintegration: all passed");
