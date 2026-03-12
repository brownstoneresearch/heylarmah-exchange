var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/unenv/dist/runtime/_internal/utils.mjs
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now
  ? globalThis.performance.now.bind(globalThis.performance)
  : () => Date.now() - _timeOrigin;

var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0,
  },
  detail: void 0,
  toJSON() {
    return this;
  },
};

var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail,
    };
  }
};

var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};

var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};

var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};

var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(_type) {
    return [];
  }
};

var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName
      ? this._entries.filter((e) => e.name !== markName)
      : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName
      ? this._entries.filter((e) => e.name !== measureName)
      : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter(
      (e) => e.entryType !== "resource" || e.entryType !== "navigation"
    );
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: { start, end },
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(_type, _listener, _options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(_type, _listener, _options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(_event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};

var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(_options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};

var performance =
  globalThis.performance && "addEventListener" in globalThis.performance
    ? globalThis.performance
    : new Performance();

globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// src/worker.js
function getSupabase(env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return { url, key };
}
__name(getSupabase, "getSupabase");

var VERSION = "4.1.0";
var ADMIN_EMAIL = "heylarmahtech@outlook.com";

var CURRENCIES = {
  NGN: { decimals: 2, scale: 100n },
  BTC: { decimals: 8, scale: 100000000n },
  ETH: { decimals: 8, scale: 100000000n },
  BNB: { decimals: 8, scale: 100000000n },
  USDT: { decimals: 6, scale: 1000000n },
  TRX: { decimals: 6, scale: 1000000n },
};

var NETWORKS = {
  BTC: ["BTC"],
  ETH: ["ERC20", "Arbitrum", "Optimism", "Base"],
  USDT: ["ERC20", "TRC20", "BEP20", "Polygon"],
  BNB: ["BEP20", "BEP2"],
  TRX: ["TRC20"],
};

var PAIRS = ["BTCNGN", "ETHNGN", "USDTNGN", "BNBNGN", "TRXNGN"];

function parseToAtomic(currency, input) {
  const cfg = CURRENCIES[currency];
  if (!cfg) throw new Error("Unsupported currency: " + currency);
  const s = String(input ?? "").trim();
  if (!s || !/^\d+(\.\d+)?$/.test(s)) throw new Error("Invalid amount");
  const [iPart, fPartRaw = ""] = s.split(".");
  if (fPartRaw.length > cfg.decimals) throw new Error(`Max ${cfg.decimals} decimals for ${currency}`);
  const fPart = (fPartRaw + "0".repeat(cfg.decimals)).slice(0, cfg.decimals);
  return BigInt(iPart) * cfg.scale + BigInt(fPart || "0");
}
__name(parseToAtomic, "parseToAtomic");

function formatAtomic(currency, atomic) {
  const cfg = CURRENCIES[currency];
  if (!cfg) return String(atomic);
  const a = BigInt(atomic);
  const sign = a < 0n ? "-" : "";
  const v = a < 0n ? -a : a;
  const i = v / cfg.scale;
  const f = v % cfg.scale;
  const fStr = f.toString().padStart(cfg.decimals, "0").replace(/0+$/, "");
  return fStr ? `${sign}${i}.${fStr}` : `${sign}${i}`;
}
__name(formatAtomic, "formatAtomic");

var H = __name((env) => {
  const { key } = getSupabase(env);
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}, "H");

async function dbSelect(env, table, query = "") {
  const { url } = getSupabase(env);
  const r = await fetch(`${url}/rest/v1/${table}?${query}`, { headers: H(env) });
  if (!r.ok) throw new Error(`SELECT ${table}: ${await r.text()}`);
  return r.json();
}
__name(dbSelect, "dbSelect");

async function dbInsert(env, table, data, ret = true) {
  const { url } = getSupabase(env);
  const r = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...H(env), Prefer: ret ? "return=representation" : "return=minimal" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`INSERT ${table}: ${await r.text()}`);
  return ret ? r.json() : null;
}
__name(dbInsert, "dbInsert");

async function dbUpdate(env, table, query, data) {
  const { url } = getSupabase(env);
  const r = await fetch(`${url}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: { ...H(env), Prefer: "return=minimal" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`UPDATE ${table}: ${await r.text()}`);
}
__name(dbUpdate, "dbUpdate");

async function dbUpsert(env, table, data) {
  const { url } = getSupabase(env);
  const r = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...H(env), Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`UPSERT ${table}: ${await r.text()}`);
  return r.json();
}
__name(dbUpsert, "dbUpsert");

async function dbRpc(env, fn, args) {
  const { url } = getSupabase(env);
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { ...H(env), Prefer: "return=representation" },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`RPC ${fn}: ${await r.text()}`);
  return r.json();
}
__name(dbRpc, "dbRpc");

async function dbDelete(env, table, query) {
  const { url } = getSupabase(env);
  const r = await fetch(`${url}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: H(env),
  });
  if (!r.ok) throw new Error(`DELETE ${table}: ${await r.text()}`);
}
__name(dbDelete, "dbDelete");

async function signJwt(payload, secret) {
  const enc = __name(
    (o) =>
      btoa(JSON.stringify(o))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_"),
    "enc"
  );
  const data = `${enc({ alg: "HS256", typ: "JWT" })}.${enc(payload)}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${data}.${b64}`;
}
__name(signJwt, "signJwt");

async function verifyJwt(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const [h, p, s] = parts;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sig = Uint8Array.from(
    atob(s.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sig,
    new TextEncoder().encode(`${h}.${p}`)
  );
  if (!ok) throw new Error("Invalid signature");
  const payload = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) {
    throw new Error("Token expired");
  }
  return payload;
}
__name(verifyJwt, "verifyJwt");

async function hashPwd(pwd) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const sHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pwd),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  const hHex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `pbkdf2:${sHex}:${hHex}`;
}
__name(hashPwd, "hashPwd");

async function verifyPwd(pwd, stored) {
  if (!stored || stored.startsWith("$2")) return false;
  const [, sHex, hHex] = stored.split(":");
  const salt = Uint8Array.from(sHex.match(/.{2}/g).map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pwd),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  const comp = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return comp === hHex;
}
__name(verifyPwd, "verifyPwd");

var DEFAULT_ALLOWED_ORIGINS = [
  "https://heylarmah-exchange.pages.dev",
  "https://heylarmah-exchange.brownstonetberesearch.workers.dev",
];

function normalizeOrigin(value = "") {
  return String(value || "").trim().replace(/\/+$/, "");
}
__name(normalizeOrigin, "normalizeOrigin");

function getAllowedOrigins(env) {
  const raw = env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(",");
  return raw.split(",").map(normalizeOrigin).filter(Boolean);
}
__name(getAllowedOrigins, "getAllowedOrigins");

function getRequestOrigin(request) {
  return normalizeOrigin(request.headers.get("Origin") || "");
}
__name(getRequestOrigin, "getRequestOrigin");

function isOriginAllowed(request, env) {
  const origin = getRequestOrigin(request);
  if (!origin) return true;
  return getAllowedOrigins(env).includes(origin);
}
__name(isOriginAllowed, "isOriginAllowed");

function getCorsOrigin(request, env) {
  const origin = getRequestOrigin(request);
  if (!origin) return null;
  return getAllowedOrigins(env).includes(origin) ? origin : null;
}
__name(getCorsOrigin, "getCorsOrigin");

function buildResponseHeaders(request, env, extra = {}) {
  const allowOrigin = getCorsOrigin(request, env);
  return {
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Paystack-Signature",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    Vary: "Origin",
    ...(allowOrigin ? { "Access-Control-Allow-Origin": allowOrigin } : {}),
    ...extra,
  };
}
__name(buildResponseHeaders, "buildResponseHeaders");

async function getUserRecord(env, userId) {
  const rows = await dbSelect(
    env,
    "users",
    `id=eq.${userId}&select=id,email,role,full_name,phone,is_suspended,created_at,last_login_at`
  );
  return rows[0] || null;
}
__name(getUserRecord, "getUserRecord");

function isAdminRecord(userRow) {
  return (
    !!userRow &&
    userRow.role === "admin" &&
    String(userRow.email || "").toLowerCase() === ADMIN_EMAIL
  );
}
__name(isAdminRecord, "isAdminRecord");

async function getAuthContext(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;

  try {
    const p = await verifyJwt(m[1], env.JWT_SECRET);
    const userRow = await getUserRecord(env, Number(p.sub));
    if (!userRow) return null;
    if (userRow.is_suspended) return null;

    if (String(userRow.email || "").toLowerCase() === ADMIN_EMAIL && userRow.role !== "admin") {
      await dbUpdate(env, "users", `id=eq.${userRow.id}`, { role: "admin" });
      userRow.role = "admin";
    }

    return {
      id: Number(userRow.id),
      email: userRow.email,
      role: userRow.role,
      isAdmin: isAdminRecord(userRow),
      user: userRow,
    };
  } catch {
    return null;
  }
}
__name(getAuthContext, "getAuthContext");

async function getUser(request, env) {
  return await getAuthContext(request, env);
}
__name(getUser, "getUser");

async function ensureWallets(env, userId) {
  const rows = Object.keys(CURRENCIES).map((c) => ({
    user_id: userId,
    currency: c,
    available: "0",
    locked: "0",
  }));
  await dbUpsert(env, "wallets", rows);
}
__name(ensureWallets, "ensureWallets");

function fmtWallets(rows) {
  return rows.map((w) => ({
    currency: w.currency,
    available: formatAtomic(w.currency, BigInt(w.available)),
    locked: formatAtomic(w.currency, BigInt(w.locked)),
  }));
}
__name(fmtWallets, "fmtWallets");

function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
__name(randomToken, "randomToken");

var safeJson = __name((s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}, "safeJson");

var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const PUBLIC_URL = env.PUBLIC_URL || "https://heylarmah-exchange.pages.dev";
    const WORKER_URL =
      env.WORKER_URL || "https://heylarmah-exchange.brownstonetberesearch.workers.dev";
    const PAYSTACK_SECRET = env.PAYSTACK_SECRET_KEY || "";
    const PAYSTACK_PUBLIC = env.PAYSTACK_PUBLIC_KEY || "";
    const SWAP_FEE = parseInt(env.SWAP_FEE_BPS || "50", 10);
    const TRADE_FEE = parseInt(env.TRADE_FEE_BPS || "20", 10);

    if (!isOriginAllowed(request, env)) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: buildResponseHeaders(request, env, {
          "Content-Type": "application/json; charset=utf-8",
        }),
      });
    }

    const J = __name(
      (d, s = 200) =>
        new Response(JSON.stringify(d), {
          status: s,
          headers: buildResponseHeaders(request, env, {
            "Content-Type": "application/json; charset=utf-8",
          }),
        }),
      "J"
    );

    const E = __name((m, s = 400) => J({ error: m }, s), "E");

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: buildResponseHeaders(request, env) });
    }

    if (!path.startsWith("/api/")) {
      if (env.ASSETS?.fetch) return env.ASSETS.fetch(request);
      if (path === "/" || path === "") {
        return J({
          ok: true,
          name: "Hey Larmah Exchange API",
          v: VERSION,
          appUrl: PUBLIC_URL,
          apiUrl: WORKER_URL,
          health: `${WORKER_URL}/api/health`,
        });
      }
      return E("Not found", 404);
    }

    let rawBody = "";
    let body = {};
    if (["POST", "PATCH", "PUT"].includes(method)) {
      try {
        rawBody = await request.text();
      } catch {}
      if (rawBody && path !== "/api/paystack/webhook") {
        try {
          body = JSON.parse(rawBody);
        } catch {}
      }
    }

    if (path === "/api/health") {
      return J({
        ok: true,
        v: VERSION,
        time: new Date().toISOString(),
        appUrl: PUBLIC_URL,
        apiUrl: WORKER_URL,
      });
    }

    if (path === "/api/prices" && method === "GET") {
      try {
        const r = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,tron&vs_currencies=usd",
          { headers: { Accept: "application/json" } }
        );
        const data = await r.json();
        return J({
          BTC: data.bitcoin?.usd || 0,
          ETH: data.ethereum?.usd || 0,
          USDT: data.tether?.usd || 1,
          BNB: data.binancecoin?.usd || 0,
          TRX: data.tron?.usd || 0,
        });
      } catch {
        return J({ BTC: 0, ETH: 0, USDT: 1, BNB: 0, TRX: 0 });
      }
    }

    if (path === "/api/auth/register" && method === "POST") {
      try {
        const email = String(body.email || "").toLowerCase().trim();
        const password = String(body.password || "");
        const fullName = String(body.fullName || "").trim();
        const phone = String(body.phone || "").trim();

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) return E("Valid email required");
        if (password.length < 8) return E("Password must be at least 8 characters");

        const ex = await dbSelect(env, "users", `email=eq.${encodeURIComponent(email)}&select=id`);
        if (ex.length) return E("Email already registered", 409);

        const hash = await hashPwd(password);
        const role = email === ADMIN_EMAIL ? "admin" : "user";

        const users = await dbInsert(env, "users", {
          email,
          password_hash: hash,
          full_name: fullName || null,
          phone: phone || null,
          role,
        });

        const user2 = users[0];
        await ensureWallets(env, user2.id);
        await dbUpsert(env, "kyc", { user_id: user2.id, status: "not_submitted" });

        const token = await signJwt(
          {
            sub: user2.id,
            role,
            exp: Math.floor(Date.now() / 1e3) + 7 * 86400,
          },
          env.JWT_SECRET
        );

        return J({
          token,
          user: {
            id: user2.id,
            email: user2.email,
            role,
            full_name: user2.full_name,
            isAdmin: role === "admin" && email === ADMIN_EMAIL,
          },
        });
      } catch (e) {
        console.error(e);
        return E("Server error", 500);
      }
    }

    if (path === "/api/auth/login" && method === "POST") {
      try {
        const email = String(body.email || "").toLowerCase().trim();
        const password = String(body.password || "");
        const rows = await dbSelect(env, "users", `email=eq.${encodeURIComponent(email)}`);
        const user2 = rows[0];

        if (!user2) return E("Invalid email or password", 401);
        if (user2.is_suspended) return E("Account suspended. Contact support.", 403);

        const valid = await verifyPwd(password, user2.password_hash);
        if (!valid) {
          if (user2.password_hash?.startsWith("$2")) {
            return E("Please reset your password — contact support.", 401);
          }
          return E("Invalid email or password", 401);
        }

        if (String(user2.email || "").toLowerCase() === ADMIN_EMAIL && user2.role !== "admin") {
          await dbUpdate(env, "users", `id=eq.${user2.id}`, { role: "admin" });
          user2.role = "admin";
        }

        await dbUpdate(env, "users", `id=eq.${user2.id}`, {
          last_login_at: new Date().toISOString(),
        });

        await ensureWallets(env, user2.id);

        const token = await signJwt(
          {
            sub: user2.id,
            role: user2.role,
            exp: Math.floor(Date.now() / 1e3) + 7 * 86400,
          },
          env.JWT_SECRET
        );

        return J({
          token,
          user: {
            id: user2.id,
            email: user2.email,
            role: user2.role,
            full_name: user2.full_name,
            phone: user2.phone,
            created_at: user2.created_at,
            isAdmin: isAdminRecord(user2),
          },
          paystackPublicKey: PAYSTACK_PUBLIC || null,
        });
      } catch (e) {
        console.error(e);
        return E("Server error", 500);
      }
    }

    if (path === "/api/auth/forgot-password" && method === "POST") {
      try {
        const email = String(body.email || "").toLowerCase().trim();
        const rows = await dbSelect(env, "users", `email=eq.${encodeURIComponent(email)}&select=id`);
        if (rows.length) {
          const token = randomToken();
          const exp = new Date(Date.now() + 3600000).toISOString();
          await dbDelete(env, "password_resets", `user_id=eq.${rows[0].id}`);
          await dbInsert(env, "password_resets", { user_id: rows[0].id, token, expires_at: exp }, false);
          console.log(`Password reset token for ${email}: ${token}`);

          if (env.RESEND_API_KEY) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: env.RESEND_FROM || "Hey Larmah Exchange <onboarding@resend.dev>",
                to: [email],
                subject: "Reset your Hey Larmah Exchange password",
                html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p>
                       <p><a href="${PUBLIC_URL}/reset-password.html?token=${token}">Reset Password</a></p>
                       <p>If you did not request this, ignore this email.</p>`,
              }),
            });
          }
        }
        return J({ ok: true, message: "If that email exists, a reset link has been sent." });
      } catch (e) {
        console.error(e);
        return E("Server error", 500);
      }
    }

    if (path === "/api/auth/reset-password" && method === "POST") {
      try {
        const token = String(body.token || "").trim();
        const password = String(body.password || "");
        if (!token) return E("Token required");
        if (password.length < 8) return E("Password must be at least 8 characters");

        const rows = await dbSelect(
          env,
          "password_resets",
          `token=eq.${encodeURIComponent(token)}&used=eq.false`
        );
        const reset = rows[0];

        if (!reset) return E("Invalid or expired reset token", 400);
        if (new Date(reset.expires_at) < new Date()) return E("Reset token expired", 400);

        const hash = await hashPwd(password);
        await dbUpdate(env, "users", `id=eq.${reset.user_id}`, { password_hash: hash });
        await dbUpdate(env, "password_resets", `token=eq.${encodeURIComponent(token)}`, {
          used: true,
        });

        return J({ ok: true, message: "Password updated. You can now sign in." });
      } catch (e) {
        console.error(e);
        return E("Server error", 500);
      }
    }

    const user = await getUser(request, env);

    if (path === "/api/me" && method === "GET") {
      if (!user) return E("Unauthorized", 401);

      const [u, k] = await Promise.all([
        dbSelect(
          env,
          "users",
          `id=eq.${user.id}&select=id,email,role,full_name,phone,created_at,last_login_at`
        ),
        dbSelect(env, "kyc", `user_id=eq.${user.id}&select=status`),
      ]);

      return J({
        user: {
          ...u[0],
          isAdmin: isAdminRecord(u[0]),
        },
        kyc: { status: k[0]?.status || "not_submitted" },
      });
    }

    if (path === "/api/me" && method === "PATCH") {
      if (!user) return E("Unauthorized", 401);
      const upd = {};
      if (body.fullName !== void 0) upd.full_name = body.fullName || null;
      if (body.phone !== void 0) upd.phone = body.phone || null;
      await dbUpdate(env, "users", `id=eq.${user.id}`, upd);
      return J({ ok: true });
    }

    if (path === "/api/wallets" && method === "GET") {
      if (!user) return E("Unauthorized", 401);
      await ensureWallets(env, user.id);
      const rows = await dbSelect(env, "wallets", `user_id=eq.${user.id}`);
      return J({ wallets: fmtWallets(rows) });
    }

    if (path === "/api/rates" && method === "GET") {
      const rows = await dbSelect(env, "rates", "");
      const fmt = rows.map((r) => {
        const base = r.pair.replace("NGN", "");
        return {
          pair: r.pair,
          currency: base,
          rate_ngn_per_unit: formatAtomic("NGN", BigInt(r.rate)),
          updated_at: r.updated_at,
        };
      });
      return J({ rates: fmt, fees: { swap_bps: SWAP_FEE, trade_bps: TRADE_FEE } });
    }

    if (path === "/api/announcements" && method === "GET") {
      const rows = await dbSelect(env, "announcements", "active=eq.true&order=id.desc&limit=10");
      return J({
        announcements: rows.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          type: a.type,
          created_at: a.created_at,
        })),
      });
    }

    if (path === "/api/market/orderbook" && method === "GET") {
      const pair = (url.searchParams.get("pair") || "BTCNGN").toUpperCase();
      if (!PAIRS.includes(pair)) return E("Unsupported pair");
      const base = pair.replace("NGN", "");
      const [asks, bids] = await Promise.all([
        dbSelect(
          env,
          "orders",
          `pair=eq.${pair}&side=eq.sell&status=eq.open&select=price,remaining&order=price.asc&limit=20`
        ),
        dbSelect(
          env,
          "orders",
          `pair=eq.${pair}&side=eq.buy&status=eq.open&select=price,remaining&order=price.desc&limit=20`
        ),
      ]);

      return J({
        pair,
        asks: asks.map((a) => ({
          price_ngn: formatAtomic("NGN", BigInt(a.price)),
          amount: formatAtomic(base, BigInt(a.remaining)),
        })),
        bids: bids.map((b) => ({
          price_ngn: formatAtomic("NGN", BigInt(b.price)),
          amount: formatAtomic(base, BigInt(b.remaining)),
        })),
      });
    }

    if (path === "/api/market/trades" && method === "GET") {
      const pair = (url.searchParams.get("pair") || "BTCNGN").toUpperCase();
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
      const base = pair.replace("NGN", "");
      const rows = await dbSelect(env, "trades", `pair=eq.${pair}&order=id.desc&limit=${limit}`);
      return J({
        trades: rows.map((t) => ({
          id: t.id,
          price_ngn: formatAtomic("NGN", BigInt(t.price)),
          amount: formatAtomic(base, BigInt(t.amount)),
          created_at: t.created_at,
        })),
      });
    }

    if (path === "/api/ledger" && method === "GET") {
      if (!user) return E("Unauthorized", 401);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
      const rows = await dbSelect(
        env,
        "ledger",
        `user_id=eq.${user.id}&order=id.desc&limit=${limit}`
      );
      return J({
        entries: rows.map((r) => ({
          id: r.id,
          type: r.type,
          currency: r.currency,
          amount: formatAtomic(r.currency, BigInt(r.amount)),
          reference: r.reference,
          created_at: r.created_at,
        })),
      });
    }

    if (path === "/api/orders" && method === "GET") {
      if (!user) return E("Unauthorized", 401);
      const pair = url.searchParams.get("pair");
      let q = `user_id=eq.${user.id}&order=id.desc&limit=100`;
      if (pair) q += `&pair=eq.${pair.toUpperCase()}`;
      const rows = await dbSelect(env, "orders", q);
      return J({
        orders: rows.map((o) => {
          const base = o.pair.replace("NGN", "");
          return {
            id: o.id,
            pair: o.pair,
            side: o.side,
            status: o.status,
            price_ngn: formatAtomic("NGN", BigInt(o.price)),
            amount: formatAtomic(base, BigInt(o.amount)),
            remaining: formatAtomic(base, BigInt(o.remaining)),
            created_at: o.created_at,
          };
        }),
      });
    }

    if (path === "/api/orders" && method === "POST") {
      if (!user) return E("Unauthorized", 401);
      try {
        const pair = String(body.pair || "").toUpperCase();
        const side = String(body.side || "").toLowerCase();
        const priceStr = String(body.price || "");
        const amountStr = String(body.amount || "");

        if (!PAIRS.includes(pair)) return E("Unsupported pair");
        if (!["buy", "sell"].includes(side)) return E("side must be buy or sell");

        const base = pair.replace("NGN", "");
        const priceAtomic = parseToAtomic("NGN", priceStr);
        const amountAtomic = parseToAtomic(base, amountStr);

        if (priceAtomic <= 0n || amountAtomic <= 0n) {
          return E("price and amount must be > 0");
        }

        const result = await dbRpc(env, "place_order", {
          p_user_id: user.id,
          p_pair: pair,
          p_side: side,
          p_price: priceAtomic.toString(),
          p_amount: amountAtomic.toString(),
          p_fee_bps: TRADE_FEE,
        });

        return J({ ok: true, orderId: result.order_id });
      } catch (e) {
        return E(String(e.message || e));
      }
    }

    if (path.match(/^\/api\/orders\/(\d+)\/cancel$/) && method === "POST") {
      if (!user) return E("Unauthorized", 401);
      const orderId = Number(path.match(/^\/api\/orders\/(\d+)\/cancel$/)[1]);
      try {
        await dbRpc(env, "cancel_order", { p_order_id: orderId, p_user_id: user.id });
        return J({ ok: true });
      } catch (e) {
        return E(String(e.message || e));
      }
    }

    if (path === "/api/swap" && method === "POST") {
      if (!user) return E("Unauthorized", 401);
      try {
        const fromCur = String(body.fromCurrency || "").toUpperCase();
        const toCur = String(body.toCurrency || "").toUpperCase();
        const amtStr = String(body.amount || "");

        if (!CURRENCIES[fromCur] || !CURRENCIES[toCur]) return E("Unsupported currency");
        if (fromCur === toCur) return E("Currencies must differ");

        const pair = fromCur === "NGN" ? `${toCur}NGN` : `${fromCur}NGN`;
        if (!PAIRS.includes(pair)) return E("No rate for this pair");

        const rates = await dbSelect(env, "rates", `pair=eq.${pair}`);
        if (!rates.length) return E("Rate not available");

        const rateKobo = BigInt(rates[0].rate);
        const amtAtomic = parseToAtomic(fromCur, amtStr);
        if (amtAtomic <= 0n) return E("Amount must be > 0");

        const result = await dbRpc(env, "perform_swap", {
          p_user_id: user.id,
          p_from_currency: fromCur,
          p_to_currency: toCur,
          p_amount: amtAtomic.toString(),
          p_rate: rateKobo.toString(),
          p_fee_bps: SWAP_FEE,
        });

        return J({
          ok: true,
          from: {
            currency: fromCur,
            amount: formatAtomic(fromCur, BigInt(result.from_amount)),
          },
          to: {
            currency: toCur,
            amount: formatAtomic(toCur, BigInt(result.to_amount)),
          },
          fee: result.fee_amount,
        });
      } catch (e) {
        return E(String(e.message || e));
      }
    }

    if (path === "/api/deposit/address" && method === "GET") {
      if (!user) return E("Unauthorized", 401);
      const currency = (url.searchParams.get("currency") || "").toUpperCase();
      const network = url.searchParams.get("network") || "";
      if (!NETWORKS[currency]) return E("Unsupported currency");

      const rows = await dbSelect(
        env,
        "deposit_addresses",
        `user_id=eq.${user.id}&currency=eq.${currency}&network=eq.${encodeURIComponent(network)}`
      );

      return J({ address: rows[0]?.address || null, currency, network });
    }

    if (path === "/api/deposit/address" && method === "POST") {
      if (!user) return E("Unauthorized", 401);

      const targetUserId = user.isAdmin && body.userId ? Number(body.userId) : user.id;
      const currency = String(body.currency || "").toUpperCase();
      const network = String(body.network || "").trim();
      const address = String(body.address || "").trim();

      if (!NETWORKS[currency]) return E("Unsupported currency");
      if (!address) return E("Address required");

      await dbUpsert(env, "deposit_addresses", {
        user_id: targetUserId,
        currency,
        network,
        address,
      });

      return J({ ok: true });
    }

    if (path === "/api/withdrawals" && method === "GET") {
      if (!user) return E("Unauthorized", 401);
      const rows = await dbSelect(env, "withdrawals", `user_id=eq.${user.id}&order=id.desc&limit=100`);
      return J({
        withdrawals: rows.map((w) => ({
          id: w.id,
          currency: w.currency,
          network: w.network,
          amount: formatAtomic(w.currency, BigInt(w.amount)),
          status: w.status,
          destination: safeJson(w.destination_json),
          created_at: w.created_at,
          processed_at: w.processed_at,
        })),
      });
    }

    if (path === "/api/withdraw/naira" && method === "POST") {
      if (!user) return E("Unauthorized", 401);
      try {
        const kycs = await dbSelect(env, "kyc", `user_id=eq.${user.id}&select=status`);
        if (kycs[0]?.status !== "approved") return E("KYC approval required", 403);

        const amtKobo = parseToAtomic("NGN", String(body.amountNgn || ""));
        const bankCode = String(body.bankCode || "").trim();
        const acctNum = String(body.accountNumber || "").trim();
        const acctName = String(body.accountName || "").trim();

        if (!bankCode || !acctNum || !acctName) {
          return E("bankCode, accountNumber, accountName required");
        }
        if (amtKobo <= 0n) return E("Amount must be > 0");

        const result = await dbRpc(env, "request_withdrawal", {
          p_user_id: user.id,
          p_currency: "NGN",
          p_amount: amtKobo.toString(),
          p_destination: JSON.stringify({
            bankCode,
            accountNumber: acctNum,
            accountName: acctName,
          }),
        });

        return J({ ok: true, withdrawalId: result.withdrawal_id });
      } catch (e) {
        return E(String(e.message || e));
      }
    }

    if (path === "/api/withdraw/crypto" && method === "POST") {
      if (!user) return E("Unauthorized", 401);
      try {
        const kycs = await dbSelect(env, "kyc", `user_id=eq.${user.id}&select=status`);
        if (kycs[0]?.status !== "approved") return E("KYC approval required", 403);

        const currency = String(body.currency || "BTC").toUpperCase();
        const network = String(body.network || "").trim();
        const address = String(body.address || "").trim();

        if (!NETWORKS[currency]) return E("Unsupported currency");
        if (!address) return E("Wallet address required");

        const amtAtomic = parseToAtomic(currency, String(body.amount || ""));
        if (amtAtomic <= 0n) return E("Amount must be > 0");

        const result = await dbRpc(env, "request_withdrawal", {
          p_user_id: user.id,
          p_currency: currency,
          p_amount: amtAtomic.toString(),
          p_destination: JSON.stringify({ address, network }),
          p_network: network,
        });

        return J({ ok: true, withdrawalId: result.withdrawal_id });
      } catch (e) {
        return E(String(e.message || e));
      }
    }

    if (path === "/api/kyc/status" && method === "GET") {
      if (!user) return E("Unauthorized", 401);
      const k = await dbSelect(env, "kyc", `user_id=eq.${user.id}&select=status,submitted_at,reviewed_at`);
      return J({
        status: k[0]?.status || "not_submitted",
        submitted_at: k[0]?.submitted_at,
        reviewed_at: k[0]?.reviewed_at,
      });
    }

    if (path === "/api/kyc/submit" && method === "POST") {
      if (!user) return E("Unauthorized", 401);
      const docType = String(body.documentType || "").trim();
      const docNum = String(body.documentNumber || "").trim();

      if (!docType || !docNum) return E("Document type and number required");

      await dbUpsert(env, "kyc", {
        user_id: user.id,
        status: "pending",
        document_type: docType,
        document_number: docNum,
        submitted_at: new Date().toISOString(),
      });

      return J({ ok: true });
    }

    if (path === "/api/paystack/init" && method === "POST") {
      if (!user) return E("Unauthorized", 401);
      try {
        if (!PAYSTACK_SECRET) return E("Payment gateway not configured");

        const amtKobo = parseToAtomic("NGN", String(body.amountNgn || ""));
        if (amtKobo < 10000n) return E("Minimum deposit is ₦100");

        const u = await dbSelect(env, "users", `id=eq.${user.id}&select=email`);
        const ref = `LRM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const r = await fetch("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: u[0].email,
            amount: Number(amtKobo),
            reference: ref,
            callback_url: `${PUBLIC_URL}/paystack_callback.html?reference=${ref}`,
            metadata: { user_id: user.id },
          }),
        });

        const data = await r.json();
        if (!data.status) return E(data.message || "Paystack init failed");

        await dbInsert(
          env,
          "paystack_transactions",
          {
            reference: ref,
            user_id: user.id,
            amount: amtKobo.toString(),
            status: "initialized",
          },
          false
        );

        return J({
          authorization_url: data.data.authorization_url,
          reference: ref,
        });
      } catch (e) {
        console.error(e);
        return E("Server error", 500);
      }
    }

    if (path === "/api/paystack/verify" && method === "GET") {
      if (!user) return E("Unauthorized", 401);
      try {
        if (!PAYSTACK_SECRET) return E("Payment gateway not configured");

        const ref = url.searchParams.get("reference") || "";
        const txs = await dbSelect(env, "paystack_transactions", `reference=eq.${encodeURIComponent(ref)}`);
        const tx = txs[0];

        if (!tx) return E("Transaction not found", 404);
        if (Number(tx.user_id) !== user.id) return E("Forbidden", 403);

        if (tx.status === "success") {
          const credited2 = formatAtomic("NGN", BigInt(tx.amount));
          return J({
            ok: true,
            message: "Already credited",
            amountNgn: credited2,
            creditedNgn: credited2,
          });
        }

        const r = await fetch(`https://api.paystack.co/transaction/verify/${ref}`, {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
        });

        const data = await r.json();
        if (!data.status || data.data.status !== "success") return E("Payment not successful");

        const amt = BigInt(data.data.amount);
        const result = await dbRpc(env, "finalize_paystack_deposit", {
          p_reference: ref,
          p_amount: amt.toString(),
          p_credit_type: "paystack_deposit",
        });

        const credited = formatAtomic("NGN", BigInt(result.amount || amt.toString()));
        return J({
          ok: true,
          amountNgn: credited,
          creditedNgn: credited,
          alreadyProcessed: !!result.already_processed,
        });
      } catch (e) {
        console.error(e);
        return E("Server error", 500);
      }
    }

    if (path === "/api/paystack/webhook" && method === "POST") {
      try {
        if (!PAYSTACK_SECRET) {
          return new Response("ok", { status: 200, headers: buildResponseHeaders(request, env) });
        }

        const sig = request.headers.get("x-paystack-signature") || "";
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(PAYSTACK_SECRET),
          { name: "HMAC", hash: "SHA-512" },
          false,
          ["sign"]
        );
        const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
        const exp = Array.from(new Uint8Array(mac))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        if (sig !== exp) {
          return new Response("Unauthorized", {
            status: 401,
            headers: buildResponseHeaders(request, env),
          });
        }

        const ev = JSON.parse(rawBody || "{}");
        if (ev.event !== "charge.success") {
          return new Response("ok", { status: 200, headers: buildResponseHeaders(request, env) });
        }

        const txs = await dbSelect(
          env,
          "paystack_transactions",
          `reference=eq.${encodeURIComponent(ev.data.reference)}`
        );
        const tx = txs[0];
        if (!tx) {
          return new Response("ok", { status: 200, headers: buildResponseHeaders(request, env) });
        }

        const amt = BigInt(ev.data.amount || tx.amount || 0);
        const result = await dbRpc(env, "finalize_paystack_deposit", {
          p_reference: ev.data.reference,
          p_amount: amt.toString(),
          p_credit_type: "paystack_deposit_webhook",
        });

        await dbUpdate(
          env,
          "paystack_transactions",
          `reference=eq.${encodeURIComponent(ev.data.reference)}`,
          {
            raw_json: rawBody,
            processed_at: result.already_processed ? tx.processed_at : new Date().toISOString(),
          }
        );

        return new Response("ok", { status: 200, headers: buildResponseHeaders(request, env) });
      } catch (e) {
        console.error(e);
        return new Response("error", { status: 500, headers: buildResponseHeaders(request, env) });
      }
    }

    if (path === "/api/admin/stats" && method === "GET") {
      if (!user || !user.isAdmin) return E("Admin only", 403);

      const [stats, rate] = await Promise.all([
        dbRpc(env, "get_admin_stats", {}),
        dbSelect(env, "rates", ""),
      ]);

      const rateMap = {};
      rate.forEach((r) => {
        rateMap[r.pair] = formatAtomic("NGN", BigInt(r.rate));
      });

      return J({ ...stats, rates: rateMap });
    }

    if (path === "/api/admin/users" && method === "GET") {
      if (!user || !user.isAdmin) return E("Admin only", 403);

      const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);
      const offset = parseInt(url.searchParams.get("offset") || "0", 10);
      const search = url.searchParams.get("search") || "";

      let q = `select=id,email,role,full_name,phone,is_suspended,created_at,last_login_at&order=id.desc&limit=${limit}&offset=${offset}`;
      if (search) {
        q += `&or=(email.ilike.*${encodeURIComponent(search)}*,full_name.ilike.*${encodeURIComponent(search)}*)`;
      }

      const rows = await dbSelect(env, "users", q);
      return J({ users: rows.map((r) => ({ ...r, isAdmin: isAdminRecord(r) })) });
    }

    if (path.match(/^\/api\/admin\/users\/(\d+)$/) && method === "GET") {
      if (!user || !user.isAdmin) return E("Admin only", 403);

      const uid = Number(path.match(/\/(\d+)$/)[1]);
      const [u, k, w] = await Promise.all([
        dbSelect(
          env,
          "users",
          `id=eq.${uid}&select=id,email,role,full_name,phone,is_suspended,created_at,last_login_at`
        ),
        dbSelect(env, "kyc", `user_id=eq.${uid}`),
        dbSelect(env, "wallets", `user_id=eq.${uid}`),
      ]);

      if (!u.length) return E("User not found", 404);
      return J({
        user: { ...u[0], isAdmin: isAdminRecord(u[0]) },
        kyc: k[0] || { status: "not_submitted" },
        wallets: fmtWallets(w),
      });
    }

    if (path.match(/^\/api\/admin\/users\/(\d+)\/suspend$/) && method === "POST") {
      if (!user || !user.isAdmin) return E("Admin only", 403);
      const uid = Number(path.match(/\/(\d+)\/suspend$/)[1]);
      await dbUpdate(env, "users", `id=eq.${uid}`, { is_suspended: body.suspend !== false });
      return J({ ok: true });
    }

    if (path.match(/^\/api\/admin\/users\/(\d+)\/kyc-force-approve$/) && method === "POST") {
      if (!user || !user.isAdmin) return E("Admin only", 403);
      const uid = Number(path.match(/\/(\d+)\/kyc-force-approve$/)[1]);
      await dbUpsert(env, "kyc", {
        user_id: uid,
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewer_id: user.id,
        notes: body.notes || "Admin approved",
      });
      return J({ ok: true });
    }

    if (path === "/api/admin/kyc/pending" && method === "GET") {
      if (!user || !user.isAdmin) return E("Admin only", 403);
      const rows = await dbSelect(env, "kyc", "status=eq.pending&order=submitted_at.asc");
      const enriched = await Promise.all(
        rows.map(async (k) => {
          const u = await dbSelect(env, "users", `id=eq.${k.user_id}&select=email,full_name`);
          return { ...k, email: u[0]?.email, full_name: u[0]?.full_name };
        })
      );
      return J({ pending: enriched });
    }

    if (path.match(/^\/api\/admin\/kyc\/(\d+)\/(approve|reject)$/) && method === "POST") {
      if (!user || !user.isAdmin) return E("Admin only", 403);
      const [, uid, action] = path.match(/^\/api\/admin\/kyc\/(\d+)\/(approve|reject)$/);
      await dbUpdate(env, "kyc", `user_id=eq.${uid}`, {
        status: action === "approve" ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
        reviewer_id: user.id,
        notes: body.notes || null,
      });
      return J({ ok: true });
    }

    if (path === "/api/admin/rates" && method === "POST") {
      if (!user || !user.isAdmin) return E("Admin only", 403);
      try {
        const pair = String(body.pair || "").toUpperCase();
        if (!PAIRS.includes(pair)) return E("Unsupported pair");

        const rateKobo = parseToAtomic("NGN", String(body.rateNgnPerUnit || ""));
        if (rateKobo <= 0n) return E("Rate must be > 0");

        await dbUpsert(env, "rates", {
          pair,
          rate: rateKobo.toString(),
          updated_at: new Date().toISOString(),
        });

        return J({ ok: true });
      } catch (e) {
        return E(String(e.message || e));
      }
    }

    if (path === "/api/admin/wallet/credit" && method === "POST") {
      if (!user || !user.isAdmin) return E("Admin only", 403);
      try {
        const uid = Number(body.userId);
        const cur = String(body.currency || "").toUpperCase();
        const amt = parseToAtomic(cur, String(body.amount || ""));
        if (amt <= 0n) return E("Amount must be > 0");
        await dbRpc(env, "credit_wallet", {
          p_user_id: uid,
          p_currency: cur,
          p_amount: amt.toString(),
          p_type: "admin_credit",
          p_reference: null,
        });
        return J({ ok: true });
      } catch (e) {
        return E(String(e.message || e));
      }
    }

    if (path === "/api/admin/wallet/debit" && method === "POST") {
      if (!user || !user.isAdmin) return E("Admin only", 403);
      try {
        const uid = Number(body.userId);
        const cur = String(body.currency || "").toUpperCase();
        const amt = parseToAtomic(cur, String(body.amount || ""));
        if (amt <= 0n) return E("Amount must be > 0");
        await dbRpc(env, "debit_wallet", {
          p_user_id: uid,
          p_currency: cur,
          p_amount: amt.toString(),
          p_type: "admin_debit",
          p_reference: null,
        });
        return J({ ok: true });
      } catch (e) {
        return E(String(e.message || e));
      }
    }

    if (path === "/api/admin/ledger" && method === "GET") {
      if (!user || !user.isAdmin) return E("Admin only", 403);
      const uid = url.searchParams.get("userId");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);
      const q = uid ? `user_id=eq.${uid}&order=id.desc&limit=${limit}` : `order=id.desc&limit=${limit}`;
      const rows = await dbSelect(env, "ledger", q);
      return J({
        entries: rows.map((r) => ({
          id: r.id,
          user_id: r.user_id,
          type: r.type,
          currency: r.currency,
          amount: formatAtomic(r.currency, BigInt(r.amount)),
          reference: r.reference,
          created_at: r.created_at,
        })),
      });
    }

    if (path === "/api/admin/withdrawals/pending" && method === "GET") {
      if (!user || !user.isAdmin) return E("Admin only", 403);
      const rows = await dbSelect(env, "withdrawals", "status=eq.pending&order=created_at.asc&limit=200");
      return J({
        pending: rows.map((w) => ({
          id: w.id,
          user_id: w.user_id,
          currency: w.currency,
          network: w.network,
          amount: formatAtomic(w.currency, BigInt(w.amount)),
          destination: safeJson(w.destination_json),
          created_at: w.created_at,
        })),
      });
    }

    if (path.match(/^\/api\/admin\/withdrawals\/(\d+)\/(mark-processed|reject)$/) && method === "POST") {
      if (!user || !user.isAdmin) return E("Admin only", 403);
      const [, wid, action] = path.match(/^\/api\/admin\/withdrawals\/(\d+)\/(mark-processed|reject)$/);
      try {
        await dbRpc(env, action === "mark-processed" ? "process_withdrawal" : "reject_withdrawal", {
          p_withdrawal_id: Number(wid),
          p_admin_id: user.id,
          p_notes: body.notes || null,
        });
        return J({ ok: true });
      } catch (e) {
        return E(String(e.message || e));
      }
    }

    if (path === "/api/admin/announcements" && method === "POST") {
      if (!user || !user.isAdmin) return E("Admin only", 403);
      const title = String(body.title || "").trim();
      const btext = String(body.body || "").trim();
      if (!title || !btext) return E("title and body required");
      const rows = await dbInsert(env, "announcements", {
        title,
        body: btext,
        type: body.type || "info",
        created_by: user.id,
        expires_at: body.expiresAt || null,
      });
      return J({ ok: true, id: rows[0].id });
    }

    if (path.match(/^\/api\/admin\/announcements\/(\d+)$/) && method === "DELETE") {
      if (!user || !user.isAdmin) return E("Admin only", 403);
      const id = Number(path.match(/\/(\d+)$/)[1]);
      await dbUpdate(env, "announcements", `id=eq.${id}`, { active: false });
      return J({ ok: true });
    }

    if (path === "/api/admin/deposit-address" && method === "POST") {
      if (!user || !user.isAdmin) return E("Admin only", 403);
      const targetUid = Number(body.userId);
      const currency = String(body.currency || "").toUpperCase();
      const network = String(body.network || "").trim();
      const address = String(body.address || "").trim();

      if (!NETWORKS[currency]) return E("Unsupported currency");
      if (!address) return E("Address required");

      await dbUpsert(env, "deposit_addresses", {
        user_id: targetUid,
        currency,
        network,
        address,
      });

      return J({ ok: true });
    }

    return E("Not found", 404);
  },
};

export {
  worker_default as default,
};
