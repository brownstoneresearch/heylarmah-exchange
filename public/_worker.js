/**
 * Hey Larmah Exchange — Production Cloudflare Worker v3.0
 * BTC · ETH · USDT · BNB · TRX × NGN
 */

const SUPABASE_URL = "https://mskbumvopqnrhddfycfd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1za2J1bXZvcHFucmhkZGZ5Y2ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjMyMDc4NiwiZXhwIjoyMDgxODk2Nzg2fQ.haI7m_b1lTULLcx5LTIJIVd7Ex44PB8wwlK0np_VhpY";

// Currency config: atomic unit scale
const CURRENCIES = {
  NGN:  { decimals: 2,  scale: 100n },
  BTC:  { decimals: 8,  scale: 100000000n },
  ETH:  { decimals: 8,  scale: 100000000n },
  BNB:  { decimals: 8,  scale: 100000000n },
  USDT: { decimals: 6,  scale: 1000000n },
  TRX:  { decimals: 6,  scale: 1000000n },
};

// Networks per coin
const NETWORKS = {
  BTC:  ["BTC"],
  ETH:  ["ERC20", "Arbitrum", "Optimism", "Base"],
  USDT: ["ERC20", "TRC20", "BEP20", "Polygon"],
  BNB:  ["BEP20", "BEP2"],
  TRX:  ["TRC20"],
};

const PAIRS = ["BTCNGN","ETHNGN","USDTNGN","BNBNGN","TRXNGN"];

// ── Currency helpers ─────────────────────────────────────────────────────────
function getScale(currency) {
  return CURRENCIES[currency]?.scale ?? 100000000n;
}

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

// ── Supabase REST ────────────────────────────────────────────────────────────
const H = () => ({ "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" });

async function dbSelect(table, query = "") {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: H() });
  if (!r.ok) throw new Error(`SELECT ${table}: ${await r.text()}`);
  return r.json();
}
async function dbInsert(table, data, ret = true) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...H(), "Prefer": ret ? "return=representation" : "return=minimal" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`INSERT ${table}: ${await r.text()}`);
  return ret ? r.json() : null;
}
async function dbUpdate(table, query, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH", headers: { ...H(), "Prefer": "return=minimal" }, body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`UPDATE ${table}: ${await r.text()}`);
}
async function dbUpsert(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...H(), "Prefer": "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`UPSERT ${table}: ${await r.text()}`);
  return r.json();
}
async function dbRpc(fn, args) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST", headers: { ...H(), "Prefer": "return=representation" }, body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`RPC ${fn}: ${await r.text()}`);
  return r.json();
}
async function dbDelete(table, query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "DELETE", headers: H(),
  });
  if (!r.ok) throw new Error(`DELETE ${table}: ${await r.text()}`);
}

// ── JWT ──────────────────────────────────────────────────────────────────────
const JWT_SECRET = "LarmahEnterpriseSecretKey2024ProMaxXzPq8vR3mN7kT1wY!";

async function signJwt(payload) {
  const enc = o => btoa(JSON.stringify(o)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const data = `${enc({alg:"HS256",typ:"JWT"})}.${enc(payload)}`;
  const key  = await crypto.subtle.importKey("raw", new TextEncoder().encode(JWT_SECRET),
    {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  const sig  = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const b64  = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  return `${data}.${b64}`;
}

async function verifyJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const [h, p, s] = parts;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(JWT_SECRET),
    {name:"HMAC",hash:"SHA-256"}, false, ["verify"]);
  const sig = Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")), c => c.charCodeAt(0));
  const ok  = await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw new Error("Invalid signature");
  const payload = JSON.parse(atob(p.replace(/-/g,"+").replace(/_/g,"/")));
  if (payload.exp && payload.exp < Math.floor(Date.now()/1000)) throw new Error("Token expired");
  return payload;
}

// ── Password (PBKDF2) ────────────────────────────────────────────────────────
async function hashPwd(pwd) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const sHex = Array.from(salt).map(b=>b.toString(16).padStart(2,"0")).join("");
  const key  = await crypto.subtle.importKey("raw", new TextEncoder().encode(pwd), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:100000,hash:"SHA-256"}, key, 256);
  const hHex = Array.from(new Uint8Array(bits)).map(b=>b.toString(16).padStart(2,"0")).join("");
  return `pbkdf2:${sHex}:${hHex}`;
}

async function verifyPwd(pwd, stored) {
  if (!stored || stored.startsWith("$2")) return false;
  const [,sHex,hHex] = stored.split(":");
  const salt = Uint8Array.from(sHex.match(/.{2}/g).map(b=>parseInt(b,16)));
  const key  = await crypto.subtle.importKey("raw", new TextEncoder().encode(pwd), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:100000,hash:"SHA-256"}, key, 256);
  const comp = Array.from(new Uint8Array(bits)).map(b=>b.toString(16).padStart(2,"0")).join("");
  return comp === hHex;
}

// ── Response helpers ─────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Paystack-Signature",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
};
const J = (d, s=200) => new Response(JSON.stringify(d), {status:s, headers:{"Content-Type":"application/json",...CORS}});
const E = (m, s=400) => J({error:m}, s);

// ── Auth middleware ──────────────────────────────────────────────────────────
async function getUser(request) {
  const auth = request.headers.get("Authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const p = await verifyJwt(m[1]);
    return { id: Number(p.sub), role: p.role };
  } catch { return null; }
}

// ── Ensure wallets exist for all currencies ──────────────────────────────────
async function ensureWallets(userId) {
  const rows = Object.keys(CURRENCIES).map(c => ({user_id:userId, currency:c, available:"0", locked:"0"}));
  await dbUpsert("wallets", rows);
}

// ── Format wallets for API response ─────────────────────────────────────────
function fmtWallets(rows) {
  return rows.map(w => ({
    currency: w.currency,
    available: formatAtomic(w.currency, BigInt(w.available)),
    locked: formatAtomic(w.currency, BigInt(w.locked)),
  }));
}

// ── Generate random token ────────────────────────────────────────────────────
function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,"0")).join("");
}

// ── Safe JSON parse ──────────────────────────────────────────────────────────
const safeJson = s => { try { return JSON.parse(s); } catch { return null; } };

// ── Main fetch handler ───────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") return new Response(null, {status:204, headers:CORS});
    if (!path.startsWith("/api/")) return env.ASSETS.fetch(request);

    let body = {};
    if (["POST","PATCH","PUT"].includes(method)) {
      try { body = await request.json(); } catch {}
    }

    const PUBLIC_URL       = env.PUBLIC_URL || "https://heylarmah-exchange.pages.dev";
    const PAYSTACK_SECRET  = env.PAYSTACK_SECRET_KEY || "";
    const PAYSTACK_PUBLIC  = env.PAYSTACK_PUBLIC_KEY || "";
    const SWAP_FEE         = parseInt(env.SWAP_FEE_BPS || "50");
    const TRADE_FEE        = parseInt(env.TRADE_FEE_BPS || "20");

    // ── Health ──────────────────────────────────────────────────────────────
    if (path === "/api/health") return J({ok:true, v:"3.0.0", time:new Date().toISOString()});

    // ── Live prices (proxy CoinGecko) ────────────────────────────────────────
    if (path === "/api/prices" && method === "GET") {
      try {
        const r = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,tron&vs_currencies=usd",
          { headers: { "Accept": "application/json" } }
        );
        const data = await r.json();
        return J({
          BTC:  data.bitcoin?.usd || 0,
          ETH:  data.ethereum?.usd || 0,
          USDT: data.tether?.usd || 1,
          BNB:  data.binancecoin?.usd || 0,
          TRX:  data.tron?.usd || 0,
        });
      } catch { return J({BTC:0,ETH:0,USDT:1,BNB:0,TRX:0}); }
    }

    // ── Register ────────────────────────────────────────────────────────────
    if (path === "/api/auth/register" && method === "POST") {
      try {
        const email    = String(body.email    ||"").toLowerCase().trim();
        const password = String(body.password ||"");
        const fullName = String(body.fullName ||"").trim();
        const phone    = String(body.phone    ||"").trim();
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) return E("Valid email required");
        if (password.length < 8) return E("Password must be at least 8 characters");
        const ex = await dbSelect("users", `email=eq.${encodeURIComponent(email)}&select=id`);
        if (ex.length) return E("Email already registered", 409);
        const hash  = await hashPwd(password);
        const users = await dbInsert("users", {email, password_hash:hash, full_name:fullName||null, phone:phone||null});
        const user  = users[0];
        await ensureWallets(user.id);
        await dbUpsert("kyc", {user_id:user.id, status:"not_submitted"});
        const token = await signJwt({sub:user.id, role:user.role, exp:Math.floor(Date.now()/1000)+7*86400});
        return J({token, user:{id:user.id, email:user.email, role:user.role, full_name:user.full_name}});
      } catch(e) { console.error(e); return E("Server error",500); }
    }

    // ── Login ───────────────────────────────────────────────────────────────
    if (path === "/api/auth/login" && method === "POST") {
      try {
        const email    = String(body.email    ||"").toLowerCase().trim();
        const password = String(body.password ||"");
        const rows = await dbSelect("users", `email=eq.${encodeURIComponent(email)}`);
        const user = rows[0];
        if (!user) return E("Invalid email or password", 401);
        if (user.is_suspended) return E("Account suspended. Contact support.", 403);
        const valid = await verifyPwd(password, user.password_hash);
        if (!valid) {
          if (user.password_hash?.startsWith("$2")) return E("Please reset your password — contact support.",401);
          return E("Invalid email or password", 401);
        }
        await dbUpdate("users", `id=eq.${user.id}`, {last_login_at:new Date().toISOString()});
        await ensureWallets(user.id);
        const token = await signJwt({sub:user.id, role:user.role, exp:Math.floor(Date.now()/1000)+7*86400});
        return J({token, user:{id:user.id, email:user.email, role:user.role, full_name:user.full_name, phone:user.phone, created_at:user.created_at}, paystackPublicKey:PAYSTACK_PUBLIC||null});
      } catch(e) { console.error(e); return E("Server error",500); }
    }

    // ── Forgot password ──────────────────────────────────────────────────────
    if (path === "/api/auth/forgot-password" && method === "POST") {
      try {
        const email = String(body.email||"").toLowerCase().trim();
        // Always return success to prevent email enumeration
        const rows = await dbSelect("users", `email=eq.${encodeURIComponent(email)}&select=id`);
        if (rows.length) {
          const token = randomToken();
          const exp   = new Date(Date.now() + 3600000).toISOString(); // 1hr
          // Delete old tokens for this user
          await dbDelete("password_resets", `user_id=eq.${rows[0].id}`);
          await dbInsert("password_resets", {user_id:rows[0].id, token, expires_at:exp}, false);
          // In production: send email via SendGrid/Mailgun/Resend
          // For now, store token and return it in dev (admin can see it in Supabase)
          console.log(`Password reset token for ${email}: ${token}`);
          // If RESEND_API_KEY is set, send email
          if (env.RESEND_API_KEY) {
            await fetch("https://api.resend.com/emails", {
              method:"POST",
              headers:{"Authorization":`Bearer ${env.RESEND_API_KEY}`, "Content-Type":"application/json"},
              body: JSON.stringify({
                from: "Hey Larmah Exchange <noreply@heylarmah.com>",
                to: [email],
                subject: "Reset your Hey Larmah Exchange password",
                html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p>
                       <p><a href="${PUBLIC_URL}/reset-password.html?token=${token}">Reset Password</a></p>
                       <p>If you did not request this, ignore this email.</p>`,
              }),
            });
          }
        }
        return J({ok:true, message:"If that email exists, a reset link has been sent."});
      } catch(e) { console.error(e); return E("Server error",500); }
    }

    // ── Reset password ───────────────────────────────────────────────────────
    if (path === "/api/auth/reset-password" && method === "POST") {
      try {
        const token    = String(body.token    ||"").trim();
        const password = String(body.password ||"");
        if (!token) return E("Token required");
        if (password.length < 8) return E("Password must be at least 8 characters");
        const rows = await dbSelect("password_resets",
          `token=eq.${encodeURIComponent(token)}&used=eq.false`);
        const reset = rows[0];
        if (!reset) return E("Invalid or expired reset token", 400);
        if (new Date(reset.expires_at) < new Date()) return E("Reset token expired", 400);
        const hash = await hashPwd(password);
        await dbUpdate("users", `id=eq.${reset.user_id}`, {password_hash:hash});
        await dbUpdate("password_resets", `token=eq.${encodeURIComponent(token)}`, {used:true});
        return J({ok:true, message:"Password updated. You can now sign in."});
      } catch(e) { console.error(e); return E("Server error",500); }
    }

    // ── Auth required from here ──────────────────────────────────────────────
    const user = await getUser(request);

    // ── Me ──────────────────────────────────────────────────────────────────
    if (path === "/api/me" && method === "GET") {
      if (!user) return E("Unauthorized",401);
      const [u, k] = await Promise.all([
        dbSelect("users", `id=eq.${user.id}&select=id,email,role,full_name,phone,created_at,last_login_at`),
        dbSelect("kyc", `user_id=eq.${user.id}&select=status`),
      ]);
      return J({user:u[0], kyc:{status:k[0]?.status||"not_submitted"}});
    }

    if (path === "/api/me" && method === "PATCH") {
      if (!user) return E("Unauthorized",401);
      const upd = {};
      if (body.fullName !== undefined) upd.full_name = body.fullName||null;
      if (body.phone    !== undefined) upd.phone     = body.phone||null;
      await dbUpdate("users", `id=eq.${user.id}`, upd);
      return J({ok:true});
    }

    // ── Wallets ─────────────────────────────────────────────────────────────
    if (path === "/api/wallets" && method === "GET") {
      if (!user) return E("Unauthorized",401);
      await ensureWallets(user.id);
      const rows = await dbSelect("wallets", `user_id=eq.${user.id}`);
      return J({wallets: fmtWallets(rows)});
    }

    // ── Rates ────────────────────────────────────────────────────────────────
    if (path === "/api/rates" && method === "GET") {
      const rows = await dbSelect("rates", "");
      const fmt  = rows.map(r => {
        const base = r.pair.replace("NGN","");
        return {pair:r.pair, currency:base, rate_ngn_per_unit:formatAtomic("NGN",BigInt(r.rate)), updated_at:r.updated_at};
      });
      return J({rates:fmt, fees:{swap_bps:SWAP_FEE, trade_bps:TRADE_FEE}});
    }

    // ── Announcements ────────────────────────────────────────────────────────
    if (path === "/api/announcements" && method === "GET") {
      const rows = await dbSelect("announcements", "active=eq.true&order=id.desc&limit=10");
      return J({announcements: rows.map(a=>({id:a.id,title:a.title,body:a.body,type:a.type,created_at:a.created_at}))});
    }

    // ── Market orderbook ─────────────────────────────────────────────────────
    if (path === "/api/market/orderbook" && method === "GET") {
      const pair = (url.searchParams.get("pair")||"BTCNGN").toUpperCase();
      if (!PAIRS.includes(pair)) return E("Unsupported pair");
      const base = pair.replace("NGN","");
      const [asks, bids] = await Promise.all([
        dbSelect("orders", `pair=eq.${pair}&side=eq.sell&status=eq.open&select=price,remaining&order=price.asc&limit=20`),
        dbSelect("orders", `pair=eq.${pair}&side=eq.buy&status=eq.open&select=price,remaining&order=price.desc&limit=20`),
      ]);
      return J({
        pair,
        asks: asks.map(a=>({price_ngn:formatAtomic("NGN",BigInt(a.price)), amount:formatAtomic(base,BigInt(a.remaining))})),
        bids: bids.map(b=>({price_ngn:formatAtomic("NGN",BigInt(b.price)), amount:formatAtomic(base,BigInt(b.remaining))})),
      });
    }

    // ── Market trades ────────────────────────────────────────────────────────
    if (path === "/api/market/trades" && method === "GET") {
      const pair  = (url.searchParams.get("pair")||"BTCNGN").toUpperCase();
      const limit = Math.min(parseInt(url.searchParams.get("limit")||"50"),200);
      const base  = pair.replace("NGN","");
      const rows  = await dbSelect("trades", `pair=eq.${pair}&order=id.desc&limit=${limit}`);
      return J({trades:rows.map(t=>({id:t.id, price_ngn:formatAtomic("NGN",BigInt(t.price)), amount:formatAtomic(base,BigInt(t.amount)), created_at:t.created_at}))});
    }

    // ── Ledger ───────────────────────────────────────────────────────────────
    if (path === "/api/ledger" && method === "GET") {
      if (!user) return E("Unauthorized",401);
      const limit = Math.min(parseInt(url.searchParams.get("limit")||"50"),200);
      const rows  = await dbSelect("ledger", `user_id=eq.${user.id}&order=id.desc&limit=${limit}`);
      return J({entries:rows.map(r=>({id:r.id,type:r.type,currency:r.currency,amount:formatAtomic(r.currency,BigInt(r.amount)),reference:r.reference,created_at:r.created_at}))});
    }

    // ── Orders ───────────────────────────────────────────────────────────────
    if (path === "/api/orders" && method === "GET") {
      if (!user) return E("Unauthorized",401);
      const pair = url.searchParams.get("pair");
      let q = `user_id=eq.${user.id}&order=id.desc&limit=100`;
      if (pair) q += `&pair=eq.${pair.toUpperCase()}`;
      const rows = await dbSelect("orders", q);
      return J({orders:rows.map(o=>{
        const base = o.pair.replace("NGN","");
        return {id:o.id,pair:o.pair,side:o.side,status:o.status,
          price_ngn:formatAtomic("NGN",BigInt(o.price)),
          amount:formatAtomic(base,BigInt(o.amount)),
          remaining:formatAtomic(base,BigInt(o.remaining)),
          created_at:o.created_at};
      })});
    }

    if (path === "/api/orders" && method === "POST") {
      if (!user) return E("Unauthorized",401);
      try {
        const pair      = String(body.pair  ||"").toUpperCase();
        const side      = String(body.side  ||"").toLowerCase();
        const priceStr  = String(body.price ||"");
        const amountStr = String(body.amount||"");
        if (!PAIRS.includes(pair)) return E("Unsupported pair");
        if (!["buy","sell"].includes(side)) return E("side must be buy or sell");
        const base = pair.replace("NGN","");
        const priceAtomic  = parseToAtomic("NGN", priceStr);
        const amountAtomic = parseToAtomic(base, amountStr);
        if (priceAtomic <= 0n || amountAtomic <= 0n) return E("price and amount must be > 0");
        const result = await dbRpc("place_order", {p_user_id:user.id, p_pair:pair, p_side:side, p_price:priceAtomic.toString(), p_amount:amountAtomic.toString(), p_fee_bps:TRADE_FEE});
        return J({ok:true, orderId:result.order_id});
      } catch(e) { return E(String(e.message||e)); }
    }

    if (path.match(/^\/api\/orders\/(\d+)\/cancel$/) && method === "POST") {
      if (!user) return E("Unauthorized",401);
      const orderId = Number(path.match(/^\/api\/orders\/(\d+)\/cancel$/)[1]);
      try {
        await dbRpc("cancel_order", {p_order_id:orderId, p_user_id:user.id});
        return J({ok:true});
      } catch(e) { return E(String(e.message||e)); }
    }

    // ── Swap ─────────────────────────────────────────────────────────────────
    if (path === "/api/swap" && method === "POST") {
      if (!user) return E("Unauthorized",401);
      try {
        const fromCur = String(body.fromCurrency||"").toUpperCase();
        const toCur   = String(body.toCurrency  ||"").toUpperCase();
        const amtStr  = String(body.amount      ||"");
        if (!CURRENCIES[fromCur] || !CURRENCIES[toCur]) return E("Unsupported currency");
        if (fromCur === toCur) return E("Currencies must differ");
        const pair = fromCur === "NGN" ? `${toCur}NGN` : `${fromCur}NGN`;
        if (!PAIRS.includes(pair)) return E("No rate for this pair");
        const rates = await dbSelect("rates", `pair=eq.${pair}`);
        if (!rates.length) return E("Rate not available");
        const rateKobo = BigInt(rates[0].rate);
        const amtAtomic = parseToAtomic(fromCur, amtStr);
        if (amtAtomic <= 0n) return E("Amount must be > 0");
        const result = await dbRpc("perform_swap", {
          p_user_id:user.id, p_from_currency:fromCur, p_to_currency:toCur,
          p_amount:amtAtomic.toString(), p_rate:rateKobo.toString(), p_fee_bps:SWAP_FEE,
        });
        return J({ok:true,
          from:{currency:fromCur, amount:formatAtomic(fromCur,BigInt(result.from_amount))},
          to:  {currency:toCur,   amount:formatAtomic(toCur,  BigInt(result.to_amount))},
          fee: result.fee_amount,
        });
      } catch(e) { return E(String(e.message||e)); }
    }

    // ── Deposit addresses ────────────────────────────────────────────────────
    if (path === "/api/deposit/address" && method === "GET") {
      if (!user) return E("Unauthorized",401);
      const currency = (url.searchParams.get("currency")||"").toUpperCase();
      const network  = url.searchParams.get("network")||"";
      if (!NETWORKS[currency]) return E("Unsupported currency");
      const rows = await dbSelect("deposit_addresses",
        `user_id=eq.${user.id}&currency=eq.${currency}&network=eq.${encodeURIComponent(network)}`);
      return J({address: rows[0]?.address || null, currency, network});
    }

    // Admin sets deposit address for user
    if (path === "/api/deposit/address" && method === "POST") {
      if (!user) return E("Unauthorized",401);
      const adminCheck = user.role === "admin";
      const targetUserId = adminCheck && body.userId ? Number(body.userId) : user.id;
      const currency = String(body.currency||"").toUpperCase();
      const network  = String(body.network ||"").trim();
      const address  = String(body.address ||"").trim();
      if (!NETWORKS[currency]) return E("Unsupported currency");
      if (!address) return E("Address required");
      await dbUpsert("deposit_addresses", {user_id:targetUserId, currency, network, address});
      return J({ok:true});
    }

    // ── Withdrawals ──────────────────────────────────────────────────────────
    if (path === "/api/withdrawals" && method === "GET") {
      if (!user) return E("Unauthorized",401);
      const rows = await dbSelect("withdrawals", `user_id=eq.${user.id}&order=id.desc&limit=100`);
      return J({withdrawals:rows.map(w=>({id:w.id,currency:w.currency,network:w.network,amount:formatAtomic(w.currency,BigInt(w.amount)),status:w.status,destination:safeJson(w.destination_json),created_at:w.created_at,processed_at:w.processed_at}))});
    }

    if (path === "/api/withdraw/naira" && method === "POST") {
      if (!user) return E("Unauthorized",401);
      try {
        const kycs = await dbSelect("kyc", `user_id=eq.${user.id}&select=status`);
        if (kycs[0]?.status !== "approved") return E("KYC approval required", 403);
        const amtKobo = parseToAtomic("NGN", String(body.amountNgn||""));
        const bankCode = String(body.bankCode||"").trim();
        const acctNum  = String(body.accountNumber||"").trim();
        const acctName = String(body.accountName||"").trim();
        if (!bankCode||!acctNum||!acctName) return E("bankCode, accountNumber, accountName required");
        if (amtKobo <= 0n) return E("Amount must be > 0");
        const result = await dbRpc("request_withdrawal", {p_user_id:user.id, p_currency:"NGN", p_amount:amtKobo.toString(), p_destination:JSON.stringify({bankCode,accountNumber:acctNum,accountName:acctName})});
        return J({ok:true, withdrawalId:result.withdrawal_id});
      } catch(e) { return E(String(e.message||e)); }
    }

    if (path === "/api/withdraw/crypto" && method === "POST") {
      if (!user) return E("Unauthorized",401);
      try {
        const kycs = await dbSelect("kyc", `user_id=eq.${user.id}&select=status`);
        if (kycs[0]?.status !== "approved") return E("KYC approval required", 403);
        const currency = String(body.currency||"BTC").toUpperCase();
        const network  = String(body.network ||"").trim();
        const address  = String(body.address ||"").trim();
        if (!NETWORKS[currency]) return E("Unsupported currency");
        if (!address) return E("Wallet address required");
        const amtAtomic = parseToAtomic(currency, String(body.amount||""));
        if (amtAtomic <= 0n) return E("Amount must be > 0");
        const result = await dbRpc("request_withdrawal", {p_user_id:user.id, p_currency:currency, p_amount:amtAtomic.toString(), p_destination:JSON.stringify({address, network}), p_network:network});
        return J({ok:true, withdrawalId:result.withdrawal_id});
      } catch(e) { return E(String(e.message||e)); }
    }

    // ── KYC ──────────────────────────────────────────────────────────────────
    if (path === "/api/kyc/status" && method === "GET") {
      if (!user) return E("Unauthorized",401);
      const k = await dbSelect("kyc", `user_id=eq.${user.id}&select=status,submitted_at,reviewed_at`);
      return J({status:k[0]?.status||"not_submitted", submitted_at:k[0]?.submitted_at, reviewed_at:k[0]?.reviewed_at});
    }

    if (path === "/api/kyc/submit" && method === "POST") {
      if (!user) return E("Unauthorized",401);
      const docType = String(body.documentType  ||"").trim();
      const docNum  = String(body.documentNumber||"").trim();
      if (!docType||!docNum) return E("Document type and number required");
      await dbUpsert("kyc", {user_id:user.id, status:"pending", document_type:docType, document_number:docNum, submitted_at:new Date().toISOString()});
      return J({ok:true});
    }

    // ── Paystack ─────────────────────────────────────────────────────────────
    if (path === "/api/paystack/init" && method === "POST") {
      if (!user) return E("Unauthorized",401);
      try {
        if (!PAYSTACK_SECRET) return E("Payment gateway not configured");
        const amtKobo = parseToAtomic("NGN", String(body.amountNgn||""));
        if (amtKobo < 10000n) return E("Minimum deposit is ₦100");
        const u = await dbSelect("users", `id=eq.${user.id}&select=email`);
        const ref = `LRM-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        const r = await fetch("https://api.paystack.co/transaction/initialize", {
          method:"POST",
          headers:{Authorization:`Bearer ${PAYSTACK_SECRET}`,"Content-Type":"application/json"},
          body:JSON.stringify({email:u[0].email, amount:Number(amtKobo), reference:ref, callback_url:`${PUBLIC_URL}/paystack_callback.html?ref=${ref}`, metadata:{user_id:user.id}}),
        });
        const data = await r.json();
        if (!data.status) return E(data.message||"Paystack init failed");
        await dbInsert("paystack_transactions", {reference:ref, user_id:user.id, amount:amtKobo.toString(), status:"initialized"}, false);
        return J({authorization_url:data.data.authorization_url, reference:ref});
      } catch(e) { console.error(e); return E("Server error",500); }
    }

    if (path === "/api/paystack/verify" && method === "GET") {
      if (!user) return E("Unauthorized",401);
      try {
        if (!PAYSTACK_SECRET) return E("Payment gateway not configured");
        const ref = url.searchParams.get("reference")||"";
        const txs = await dbSelect("paystack_transactions", `reference=eq.${encodeURIComponent(ref)}`);
        const tx  = txs[0];
        if (!tx) return E("Transaction not found",404);
        if (Number(tx.user_id) !== user.id) return E("Forbidden",403);
        if (tx.status === "success") return J({ok:true, message:"Already credited"});
        const r = await fetch(`https://api.paystack.co/transaction/verify/${ref}`, {headers:{Authorization:`Bearer ${PAYSTACK_SECRET}`}});
        const data = await r.json();
        if (!data.status || data.data.status !== "success") return E("Payment not successful");
        const amt = BigInt(data.data.amount);
        await dbRpc("credit_wallet", {p_user_id:user.id, p_currency:"NGN", p_amount:amt.toString(), p_type:"paystack_deposit", p_reference:ref});
        await dbUpdate("paystack_transactions", `reference=eq.${encodeURIComponent(ref)}`, {status:"success", processed_at:new Date().toISOString()});
        return J({ok:true, amountNgn:formatAtomic("NGN",amt)});
      } catch(e) { console.error(e); return E("Server error",500); }
    }

    if (path === "/api/paystack/webhook" && method === "POST") {
      try {
        if (!PAYSTACK_SECRET) return new Response("ok",{status:200});
        const rawBody = await request.text();
        const sig = request.headers.get("x-paystack-signature")||"";
        const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(PAYSTACK_SECRET),{name:"HMAC",hash:"SHA-512"},false,["sign"]);
        const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
        const exp = Array.from(new Uint8Array(mac)).map(b=>b.toString(16).padStart(2,"0")).join("");
        if (sig !== exp) return new Response("Unauthorized",{status:401});
        const ev = JSON.parse(rawBody);
        if (ev.event !== "charge.success") return new Response("ok",{status:200});
        const txs = await dbSelect("paystack_transactions", `reference=eq.${encodeURIComponent(ev.data.reference)}`);
        const tx  = txs[0];
        if (!tx || tx.status === "success") return new Response("ok",{status:200});
        const amt = BigInt(ev.data.amount);
        await dbRpc("credit_wallet", {p_user_id:Number(tx.user_id), p_currency:"NGN", p_amount:amt.toString(), p_type:"paystack_deposit_webhook", p_reference:ev.data.reference});
        await dbUpdate("paystack_transactions", `reference=eq.${encodeURIComponent(ev.data.reference)}`, {status:"success", processed_at:new Date().toISOString()});
        return new Response("ok",{status:200});
      } catch(e) { console.error(e); return new Response("error",{status:500}); }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN ROUTES
    // ═══════════════════════════════════════════════════════════════════════

    if (path === "/api/admin/stats" && method === "GET") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      const [stats,rate] = await Promise.all([dbRpc("get_admin_stats",{}), dbSelect("rates","")]);
      const rateMap = {};
      rate.forEach(r => { rateMap[r.pair] = formatAtomic("NGN",BigInt(r.rate)); });
      return J({...stats, rates:rateMap});
    }

    if (path === "/api/admin/users" && method === "GET") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      const limit  = Math.min(parseInt(url.searchParams.get("limit")||"100"),500);
      const offset = parseInt(url.searchParams.get("offset")||"0");
      const search = url.searchParams.get("search")||"";
      let q = `select=id,email,role,full_name,phone,is_suspended,created_at,last_login_at&order=id.desc&limit=${limit}&offset=${offset}`;
      if (search) q += `&or=(email.ilike.*${encodeURIComponent(search)}*,full_name.ilike.*${encodeURIComponent(search)}*)`;
      const rows = await dbSelect("users", q);
      return J({users:rows});
    }

    if (path.match(/^\/api\/admin\/users\/(\d+)$/) && method === "GET") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      const uid = Number(path.match(/\/(\d+)$/)[1]);
      const [u, k, w] = await Promise.all([
        dbSelect("users", `id=eq.${uid}&select=id,email,role,full_name,phone,is_suspended,created_at,last_login_at`),
        dbSelect("kyc", `user_id=eq.${uid}`),
        dbSelect("wallets", `user_id=eq.${uid}`),
      ]);
      if (!u.length) return E("User not found",404);
      return J({user:u[0], kyc:k[0]||{status:"not_submitted"}, wallets:fmtWallets(w)});
    }

    if (path.match(/^\/api\/admin\/users\/(\d+)\/suspend$/) && method === "POST") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      const uid = Number(path.match(/\/(\d+)\/suspend$/)[1]);
      await dbUpdate("users", `id=eq.${uid}`, {is_suspended:body.suspend!==false});
      return J({ok:true});
    }

    if (path.match(/^\/api\/admin\/users\/(\d+)\/kyc-force-approve$/) && method === "POST") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      const uid = Number(path.match(/\/(\d+)\/kyc-force-approve$/)[1]);
      await dbUpsert("kyc", {user_id:uid, status:"approved", reviewed_at:new Date().toISOString(), reviewer_id:user.id, notes:body.notes||"Admin approved"});
      return J({ok:true});
    }

    if (path === "/api/admin/kyc/pending" && method === "GET") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      const rows = await dbSelect("kyc", "status=eq.pending&order=submitted_at.asc");
      // Enrich with user emails
      const enriched = await Promise.all(rows.map(async k => {
        const u = await dbSelect("users", `id=eq.${k.user_id}&select=email,full_name`);
        return {...k, email:u[0]?.email, full_name:u[0]?.full_name};
      }));
      return J({pending:enriched});
    }

    if (path.match(/^\/api\/admin\/kyc\/(\d+)\/(approve|reject)$/) && method === "POST") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      const [,uid,action] = path.match(/^\/api\/admin\/kyc\/(\d+)\/(approve|reject)$/);
      await dbUpdate("kyc", `user_id=eq.${uid}`, {status:action==="approve"?"approved":"rejected", reviewed_at:new Date().toISOString(), reviewer_id:user.id, notes:body.notes||null});
      return J({ok:true});
    }

    if (path === "/api/admin/rates" && method === "POST") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      try {
        const pair = String(body.pair||"").toUpperCase();
        if (!PAIRS.includes(pair)) return E("Unsupported pair");
        const rateKobo = parseToAtomic("NGN", String(body.rateNgnPerUnit||""));
        if (rateKobo <= 0n) return E("Rate must be > 0");
        await dbUpsert("rates", {pair, rate:rateKobo.toString(), updated_at:new Date().toISOString()});
        return J({ok:true});
      } catch(e) { return E(String(e.message||e)); }
    }

    if (path === "/api/admin/wallet/credit" && method === "POST") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      try {
        const uid = Number(body.userId);
        const cur = String(body.currency||"").toUpperCase();
        const amt = parseToAtomic(cur, String(body.amount||""));
        if (amt <= 0n) return E("Amount must be > 0");
        await dbRpc("credit_wallet", {p_user_id:uid, p_currency:cur, p_amount:amt.toString(), p_type:"admin_credit", p_reference:null});
        return J({ok:true});
      } catch(e) { return E(String(e.message||e)); }
    }

    if (path === "/api/admin/wallet/debit" && method === "POST") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      try {
        const uid = Number(body.userId);
        const cur = String(body.currency||"").toUpperCase();
        const amt = parseToAtomic(cur, String(body.amount||""));
        if (amt <= 0n) return E("Amount must be > 0");
        await dbRpc("debit_wallet", {p_user_id:uid, p_currency:cur, p_amount:amt.toString(), p_type:"admin_debit", p_reference:null});
        return J({ok:true});
      } catch(e) { return E(String(e.message||e)); }
    }

    if (path === "/api/admin/ledger" && method === "GET") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      const uid   = url.searchParams.get("userId");
      const limit = Math.min(parseInt(url.searchParams.get("limit")||"100"),500);
      const q = uid ? `user_id=eq.${uid}&order=id.desc&limit=${limit}` : `order=id.desc&limit=${limit}`;
      const rows = await dbSelect("ledger", q);
      return J({entries:rows.map(r=>({id:r.id,user_id:r.user_id,type:r.type,currency:r.currency,amount:formatAtomic(r.currency,BigInt(r.amount)),reference:r.reference,created_at:r.created_at}))});
    }

    if (path === "/api/admin/withdrawals/pending" && method === "GET") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      const rows = await dbSelect("withdrawals", "status=eq.pending&order=created_at.asc&limit=200");
      return J({pending:rows.map(w=>({id:w.id,user_id:w.user_id,currency:w.currency,network:w.network,amount:formatAtomic(w.currency,BigInt(w.amount)),destination:safeJson(w.destination_json),created_at:w.created_at}))});
    }

    if (path.match(/^\/api\/admin\/withdrawals\/(\d+)\/(mark-processed|reject)$/) && method === "POST") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      const [,wid,action] = path.match(/^\/api\/admin\/withdrawals\/(\d+)\/(mark-processed|reject)$/);
      try {
        await dbRpc(action==="mark-processed"?"process_withdrawal":"reject_withdrawal", {p_withdrawal_id:Number(wid), p_admin_id:user.id, p_notes:body.notes||null});
        return J({ok:true});
      } catch(e) { return E(String(e.message||e)); }
    }

    if (path === "/api/admin/announcements" && method === "POST") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      const title = String(body.title||"").trim();
      const btext = String(body.body ||"").trim();
      if (!title||!btext) return E("title and body required");
      const rows = await dbInsert("announcements", {title, body:btext, type:body.type||"info", created_by:user.id, expires_at:body.expiresAt||null});
      return J({ok:true, id:rows[0].id});
    }

    if (path.match(/^\/api\/admin\/announcements\/(\d+)$/) && method === "DELETE") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      const id = Number(path.match(/\/(\d+)$/)[1]);
      await dbUpdate("announcements", `id=eq.${id}`, {active:false});
      return J({ok:true});
    }

    if (path === "/api/admin/deposit-address" && method === "POST") {
      if (!user||user.role!=="admin") return E("Admin only",403);
      const targetUid = Number(body.userId);
      const currency  = String(body.currency||"").toUpperCase();
      const network   = String(body.network ||"").trim();
      const address   = String(body.address ||"").trim();
      if (!NETWORKS[currency]) return E("Unsupported currency");
      if (!address) return E("Address required");
      await dbUpsert("deposit_addresses", {user_id:targetUid, currency, network, address});
      return J({ok:true});
    }

    return E("Not found",404);
  }
};
