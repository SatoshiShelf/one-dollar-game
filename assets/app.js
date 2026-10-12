// One Dollar Game — shared client logic (multi-crypto).
(function () {
  const CFG = window.STORE_CONFIG;
  const COINS = window.COINS;

  const fmtUsd = (n) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));

  // ----- coin availability -----
  function ethAddress() {
    const e = COINS.find((c) => c.type === "eth");
    return e && e.address ? e.address : "";
  }
  function isAvailable(c) {
    if (c.type === "erc20") return !!ethAddress();
    return !!c.address;
  }
  function availableCoins() {
    return COINS.filter(isAvailable);
  }
  function coin(code) {
    return COINS.find((c) => c.code === code);
  }
  // receiving address for a coin (erc20 -> the shared ETH address)
  function receiveAddress(c) {
    return c.type === "erc20" ? ethAddress() : c.address;
  }

  // ----- live prices -----
  let _rates = null;
  async function getRates() {
    if (_rates) return _rates;
    const r = await fetch(CFG.priceApi);
    if (!r.ok) throw new Error("Could not fetch live prices");
    const d = await r.json();
    _rates = {
      BTC: d.bitcoin && d.bitcoin.usd,
      LTC: d.litecoin && d.litecoin.usd,
      ETH: d.ethereum && d.ethereum.usd,
      USDT: 1,
      USDC: 1,
    };
    return _rates;
  }

  async function usdToUnits(code, usd) {
    const c = coin(code);
    if (c.type === "erc20") return usd; // stablecoin, 1:1
    const rates = await getRates();
    const p = rates[code];
    if (!p) throw new Error("No live price for " + code);
    return usd / p;
  }

  // ----- formatting -----
  function trimZeros(s) {
    return s.indexOf(".") >= 0 ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
  }
  function fmtUnits(c, amount) {
    if (c.type === "erc20") return amount.toFixed(2);
    // native coins: enough precision for a ~$1 payment
    const dp = c.code === "ETH" ? 8 : 8;
    return trimZeros(amount.toFixed(dp));
  }
  function toBaseUnits(c, amount) {
    // convert a decimal amount to the coin's smallest integer unit (string)
    const s = amount.toFixed(c.decimals);
    const [i, f = ""] = s.split(".");
    const digits = (i + f.padEnd(c.decimals, "0")).replace(/^0+/, "") || "0";
    return digits;
  }

  // ----- payment URIs -----
  function coinUri(c, amount, label) {
    const to = receiveAddress(c);
    if (c.type === "btc" || c.type === "ltc") {
      let uri = c.scheme + ":" + to;
      const q = [];
      if (amount) q.push("amount=" + amount.toFixed(c.decimals));
      if (label) q.push("label=" + encodeURIComponent(label));
      return uri + (q.length ? "?" + q.join("&") : "");
    }
    if (c.type === "eth") {
      const wei = toBaseUnits(c, amount);
      return "ethereum:" + to + "@1?value=" + wei;
    }
    if (c.type === "erc20") {
      const units = toBaseUnits(c, amount);
      return (
        "ethereum:" + c.contract + "@1/transfer?address=" + to + "&uint256=" + units
      );
    }
    return "";
  }

  function renderQR(el, text) {
    el.innerHTML = "";
    try {
      const qr = qrcode(0, "M");
      qr.addData(text);
      qr.make();
      el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    } catch (e) {
      el.textContent = "QR error: " + e.message;
    }
  }

  // ----- secure delivery via the Worker -----
  function workerBase() {
    return (CFG.workerUrl || "").replace(/\/+$/, "");
  }
  async function verify(gameId, code, txid) {
    const base = workerBase();
    if (!base) return { ok: false, reason: "Secure delivery not configured yet." };
    const r = await fetch(base + "/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: gameId, code, txid: (txid || "").trim() }),
    });
    let d = {};
    try { d = await r.json(); } catch {}
    if (!r.ok) return { ok: false, reason: d.reason || "Server error (" + r.status + ")." };
    if (!d.ok) return { ok: false, reason: d.reason || "Payment could not be verified." };
    const u = d.downloadUrl || "";
    const downloadUrl = /^https?:\/\//i.test(u) ? u : base + u;
    return { ok: true, downloadUrl, confirmed: !!d.confirmed };
  }

  window.Store = {
    fmtUsd, fmtUnits, getRates, usdToUnits, coinUri, toBaseUnits,
    renderQR, verify, isSecure: () => !!workerBase(), CFG, COINS,
    availableCoins, coin, receiveAddress, ethAddress,
  };
})();
