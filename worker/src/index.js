import { CONFIG, PRODUCTS } from "./embedded.js";
import {
  makeToken, verifyToken, b64ToBytes,
  verifyUtxo, verifyEth, verifyErc20, coinUsdPrice,
} from "./lib.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (url.pathname === "/health") {
      return json({ ok: true, games: Object.keys(PRODUCTS), coins: Object.keys(CONFIG.coins || {}) });
    }

    const secret = env.DOWNLOAD_SECRET;

    if (url.pathname === "/verify" && request.method === "POST") {
      if (!secret) return json({ ok: false, reason: "Server not configured." }, 500);
      let body;
      try { body = await request.json(); } catch { return json({ ok: false, reason: "Bad request." }, 400); }

      const product = PRODUCTS[body.productId];
      if (!product) return json({ ok: false, reason: "Unknown game." }, 404);
      const coin = (CONFIG.coins || {})[body.code];
      if (!coin) return json({ ok: false, reason: "Unsupported coin." }, 400);

      let usdPrice;
      try { usdPrice = await coinUsdPrice({ type: coin.type }); } catch { return json({ ok: false, reason: "Live price unavailable, try again." }, 502); }
      if (!usdPrice) return json({ ok: false, reason: "Live price unavailable, try again." }, 502);

      const pow = 10n ** BigInt(coin.decimals);
      const minUnits = BigInt(Math.floor((product.priceUsd / usdPrice) * Number(pow) * 0.995));

      let res;
      try {
        if (coin.type === "btc" || coin.type === "ltc") {
          const apiBase = coin.type === "btc" ? (env.BTC_API || "https://mempool.space/api") : (env.LTC_API || "https://litecoinspace.org/api");
          res = await verifyUtxo({ txid: body.txid, address: coin.address, minUnits: Number(minUnits), apiBase, fetchImpl: fetch });
        } else if (coin.type === "eth") {
          res = await verifyEth({ txid: body.txid, address: coin.address, minUnits: minUnits.toString(), rpcUrl: env.ETH_RPC || "https://ethereum-rpc.publicnode.com", fetchImpl: fetch });
        } else if (coin.type === "erc20") {
          res = await verifyErc20({ txid: body.txid, address: coin.address, contract: coin.contract, minUnits: minUnits.toString(), rpcUrl: env.ETH_RPC || "https://ethereum-rpc.publicnode.com", fetchImpl: fetch });
        } else {
          return json({ ok: false, reason: "Unsupported coin." }, 400);
        }
      } catch (e) {
        return json({ ok: false, reason: "Verification error, try again." }, 502);
      }
      if (!res.ok) return json(res, 200);

      if (product.url) {
        return json({ ok: true, downloadUrl: product.url, confirmed: res.confirmed, paid: res.paid });
      }
      const token = await makeToken(secret, { p: body.productId, t: String(body.txid).toLowerCase() }, 900);
      return json({ ok: true, token, downloadUrl: "/download?token=" + encodeURIComponent(token), confirmed: res.confirmed });
    }

    if (url.pathname === "/download" && request.method === "GET") {
      if (!secret) return json({ ok: false, reason: "Server not configured." }, 500);
      const payload = await verifyToken(secret, url.searchParams.get("token"));
      if (!payload) return new Response("This link is invalid or has expired. Verify your payment again.", { status: 403, headers: CORS });
      const product = PRODUCTS[payload.p];
      if (!product) return new Response("Unknown game.", { status: 404, headers: CORS });
      if (!product.b64) return new Response("Delivery for this game isn't ready yet.", { status: 503, headers: CORS });
      return new Response(b64ToBytes(product.b64), {
        headers: {
          ...CORS,
          "content-type": product.contentType || "application/octet-stream",
          "content-disposition": `attachment; filename="${product.filename}"`,
          "cache-control": "no-store",
        },
      });
    }

    return json({ ok: false, reason: "Not found." }, 404);
  },
};
