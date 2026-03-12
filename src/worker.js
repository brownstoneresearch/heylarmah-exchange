export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  }
};

async function handleRequest(request, env) {
  try {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "heylarmah-exchange", time: new Date().toISOString() }, 200, request, env);
    }

    // ---------------- Auth ----------------
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      const body = await readJson(request);
      return await registerUser(body, request, env);
    }

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const body = await readJson(request);
      return await loginUser(body, request, env);
    }

    if (url.pathname === "/api/auth/forgot-password" && request.method === "POST") {
      const body = await readJson(request);
      return await forgotPassword(body, request, env);
    }

    if (url.pathname === "/api/auth/reset-password" && request.method === "POST") {
      const body = await readJson(request);
      return await resetPassword(body, request, env);
    }

    if (url.pathname === "/api/me" && request.method === "GET") {
      const auth = await requireAuth(request, env);
      return await getMe(auth, request, env);
    }

    // ---------------- User ----------------
    if (url.pathname === "/api/wallets" && request.method === "GET") {
      const auth = await requireAuth(request, env);
      return await getWallets(auth, request, env);
    }

    if (url.pathname === "/api/rates" && request.method === "GET") {
      return await getRates(request, env);
    }

    if (url.pathname === "/api/announcements" && request.method === "GET") {
      return await getAnnouncements(request, env);
    }

    if (url.pathname === "/api/swap" && request.method === "POST") {
      const auth = await requireAuth(request, env);
      const body = await readJson(request);
      return await executeSwap(auth, body, request, env);
    }

    if (url.pathname === "/api/orders" && request.method === "POST") {
      const auth = await requireAuth(request, env);
      const body = await readJson(request);
      return await placeOrder(auth, body, request, env);
    }

    if (url.pathname === "/api/orders" && request.method === "GET") {
      const auth = await requireAuth(request, env);
      return await getOrders(auth, request, env);
    }

    if (url.pathname.startsWith("/api/orders/") && request.method === "DELETE") {
      const auth = await requireAuth(request, env);
      const id = Number(url.pathname.split("/").pop());
      return await cancelOrder(auth, id, request, env);
    }

    if (url.pathname === "/api/trades" && request.method === "GET") {
      const auth = await requireAuth(request, env);
      return await getTrades(auth, url, request, env);
    }

    if (url.pathname === "/api/ledger" && request.method === "GET") {
      const auth = await requireAuth(request, env);
      return await getLedger(auth, request, env);
    }

    if (url.pathname === "/api/kyc" && request.method === "POST") {
      const auth = await requireAuth(request, env);
      const body = await readJson(request);
      return await submitKyc(auth, body, request, env);
    }

    if (url.pathname === "/api/withdrawals" && request.method === "GET") {
      const auth = await requireAuth(request, env);
      return await getWithdrawals(auth, request, env);
    }

    if (url.pathname === "/api/withdrawals/ngn" && request.method === "POST") {
      const auth = await requireAuth(request, env);
      const body = await readJson(request);
      return await requestWithdrawalNgn(auth, body, request, env);
    }

    if (url.pathname === "/api/withdrawals/crypto" && request.method === "POST") {
      const auth = await requireAuth(request, env);
      const body = await readJson(request);
      return await requestWithdrawalCrypto(auth, body, request, env);
    }

    if (url.pathname === "/api/deposit-addresses" && request.method === "GET") {
      const auth = await requireAuth(request, env);
      const coin = url.searchParams.get("coin");
      const network = url.searchParams.get("network");
      return await getDepositAddress(auth, coin, network, request, env);
    }

    // ---------------- Paystack ----------------
    if (url.pathname === "/api/paystack/init" && request.method === "POST") {
      const auth = await requireAuth(request, env);
      const body = await readJson(request);
      return await paystackInit(auth, body, request, env);
    }

    if (url.pathname === "/api/paystack/verify" && request.method === "GET") {
      const auth = await requireAuth(request, env);
      const reference = url.searchParams.get("reference");
      return await paystackVerify(auth, reference, request, env);
    }

    if (url.pathname === "/api/paystack/webhook" && request.method === "POST") {
      const raw = await request.text();
      return await paystackWebhook(raw, request, env);
    }

    // ---------------- Admin ----------------
    if (url.pathname === "/api/admin/stats" && request.method === "GET") {
      const auth = await requireAdmin(request, env);
      return await adminStats(auth, request, env);
    }

    if (url.pathname === "/api/admin/users" && request.method === "GET") {
      const auth = await requireAdmin(request, env);
      return await adminUsers(auth, url, request, env);
    }

    if (url.pathname === "/api/admin/kyc/pending" && request.method === "GET") {
      const auth = await requireAdmin(request, env);
      return await adminKycPending(auth, request, env);
    }

    if (/^\/api\/admin\/kyc\/\d+\/(approve|reject)$/.test(url.pathname) && request.method === "POST") {
      const auth = await requireAdmin(request, env);
      const body = await readJson(request);
      return await adminKycResolve(auth, url, body, request, env);
    }

    if (url.pathname === "/api/admin/withdrawals/pending" && request.method === "GET") {
      const auth = await requireAdmin(request, env);
      return await adminWithdrawalsPending(auth, request, env);
    }

    if (/^\/api\/admin\/withdrawals\/\d+\/(approve|reject)$/.test(url.pathname) && request.method === "POST") {
      const auth = await requireAdmin(request, env);
      const body = await readJson(request);
      return await adminWithdrawalResolve(auth, url, body, request, env);
    }

    if (url.pathname === "/api/admin/rates" && request.method === "POST") {
      const auth = await requireAdmin(request, env);
      const body = await readJson(request);
      return await adminSetRate(auth, body, request, env);
    }

    if (url.pathname === "/api/admin/wallets/credit" && request.method === "POST") {
      const auth = await requireAdmin(request, env);
      const body = await readJson(request);
      return await adminWalletCredit(auth, body, request, env);
    }

    if (url.pathname === "/api/admin/wallets/debit" && request.method === "POST") {
      const auth = await requireAdmin(request, env);
      const body = await readJson(request);
      return await adminWalletDebit(auth, body, request, env);
    }

    if (url.pathname === "/api/admin/deposit-addresses" && request.method === "POST") {
      const auth = await requireAdmin(request, env);
      const body = await readJson(request);
      return await adminDepositAddress(auth, body, request, env);
    }

    if (url.pathname === "/api/admin/announcements" && request.method === "POST") {
      const auth = await requireAdmin(request, env);
      const body = await readJson(request);
      return await adminAnnouncement(auth, body, request, env);
    }

    return json({ error: "not_found" }, 404, request, env);
  } catch (err) {
    return json(
      {
        error: err?.message || "server_error",
        details: err?.details || null
      },
      err?.statusCode || 500,
      request,
      env
    );
  }
}

// ============================================================================
// Config / helpers
// ============================================================================

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  const allowOrigin = allowed.includes(origin) ? origin : (env.PUBLIC_URL || "*");

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin"
  };
}

function json(data, status = 200, request, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request, env),
      "Cache-Control": "no-store"
    }
  });
}

async function readJson(request) {
  const text = await request.text();
  if (!text) return {};
  return JSON.parse(text);
}

function requireEnv(env, key) {
  if (!env[key]) throw new Error(`missing_env_${key}`);
  return env[key];
}

function b64urlToBytes(input) {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const b64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function bytesToB64url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signJwt(payload, secret) {
  const enc = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const h = bytesToB64url(enc.encode(JSON.stringify(header)));
  const p = bytesToB64url(enc.encode(JSON.stringify(payload)));
  const data = `${h}.${p}`;

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return `${data}.${bytesToB64url(new Uint8Array(sig))}`;
}

async function verifyJwt(token, secret) {
  const enc = new TextEncoder();
  const parts = token.split(".");
  if (parts.length !== 3) throw Object.assign(new Error("invalid_token"), { statusCode: 401 });

  const [h, p, s] = parts;
  const data = `${h}.${p}`;

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const ok = await crypto.subtle.verify("HMAC", key, b64urlToBytes(s), enc.encode(data));
  if (!ok) throw Object.assign(new Error("invalid_token_signature"), { statusCode: 401 });

  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw Object.assign(new Error("token_expired"), { statusCode: 401 });
  }
  return payload;
}

function bearerToken(request) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim();
}

async function requireAuth(request, env) {
  const token = bearerToken(request);
  if (!token) throw Object.assign(new Error("missing_authorization"), { statusCode: 401 });
  const payload = await verifyJwt(token, requireEnv(env, "JWT_SECRET"));
  return payload;
}

async function requireAdmin(request, env) {
  const auth = await requireAuth(request, env);
  if (!(auth.role === "admin" && (auth.email || "").toLowerCase() === (env.ADMIN_EMAIL || "heylarmahtech@outlook.com").toLowerCase())) {
    throw Object.assign(new Error("admin_only"), { statusCode: 403 });
  }
  return auth;
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function newAppTokenPayload(profile) {
  return {
    sub: profile.id,
    uid: profile.id,
    email: profile.email,
    role: profile.role,
    iat: nowSeconds(),
    exp: nowSeconds() + 60 * 60 * 24 * 7
  };
}

function makeReference(prefix = "HLX") {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

async function sha256Hex(input) {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSHA512Hex(secret, payload) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function qp(params = {}) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) s.set(k, String(v));
  });
  return s.toString();
}

// ============================================================================
// Supabase REST / Auth
// ============================================================================

function supabaseBase(env) {
  return requireEnv(env, "SUPABASE_URL").replace(/\/+$/, "");
}

function anonOrServiceKey(env) {
  return env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
}

async function sbFetch(env, path, options = {}, useServiceRole = true) {
  const apiKey = useServiceRole ? requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY") : anonOrServiceKey(env);
  const headers = {
    "apikey": apiKey,
    "Authorization": `Bearer ${apiKey}`,
    ...(options.headers || {})
  };

  const res = await fetch(`${supabaseBase(env)}${path}`, {
    ...options,
    headers
  });

  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }

  if (!res.ok) {
    const err = new Error(body?.msg || body?.message || body?.error_description || body?.error || "supabase_request_failed");
    err.statusCode = res.status;
    err.details = body;
    throw err;
  }

  return body;
}

async function sbSelect(env, table, query = "", useServiceRole = true) {
  return sbFetch(env, `/rest/v1/${table}${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  }, useServiceRole);
}

async function sbInsert(env, table, rows, useServiceRole = true) {
  return sbFetch(env, `/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(Array.isArray(rows) ? rows : [rows])
  }, useServiceRole);
}

async function sbUpsert(env, table, rows, onConflict = "", useServiceRole = true) {
  const query = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : "";
  return sbFetch(env, `/rest/v1/${table}${query}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(Array.isArray(rows) ? rows : [rows])
  }, useServiceRole);
}

async function sbPatch(env, table, filterQuery, patch, useServiceRole = true) {
  return sbFetch(env, `/rest/v1/${table}?${filterQuery}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(patch)
  }, useServiceRole);
}

async function sbRpc(env, fn, args = {}, useServiceRole = true) {
  return sbFetch(env, `/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args)
  }, useServiceRole);
}

async function sbAuthPasswordGrant(env, email, password) {
  return sbFetch(env, `/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": anonOrServiceKey(env),
      "Authorization": `Bearer ${anonOrServiceKey(env)}`
    },
    body: JSON.stringify({ email, password })
  }, false);
}

async function sbAuthCreateUser(env, email, password, metadata = {}) {
  return sbFetch(env, `/auth/v1/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata
    })
  }, true);
}

async function sbAuthUpdateUserPassword(env, userId, password) {
  return sbFetch(env, `/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  }, true);
}

// ============================================================================
// Auth routes
// ============================================================================

async function registerUser(body, request, env) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const fullName = String(body.fullName || "").trim();
  const phone = String(body.phone || "").trim();

  if (!email || !password) {
    return json({ error: "email_and_password_required" }, 400, request, env);
  }
  if (password.length < 8) {
    return json({ error: "password_must_be_at_least_8_characters" }, 400, request, env);
  }

  await sbAuthCreateUser(env, email, password, { full_name: fullName, phone });

  const login = await sbAuthPasswordGrant(env, email, password);
  const profile = await getProfileByEmail(env, email);

  const token = await signJwt(newAppTokenPayload(profile), requireEnv(env, "JWT_SECRET"));

  return json({
    ok: true,
    token,
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      full_name: profile.full_name,
      phone: profile.phone
    },
    supabase: {
      access_token: login.access_token,
      refresh_token: login.refresh_token
    }
  }, 200, request, env);
}

async function loginUser(body, request, env) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return json({ error: "email_and_password_required" }, 400, request, env);
  }

  const login = await sbAuthPasswordGrant(env, email, password);
  const profile = await getProfileByEmail(env, email);

  if (profile.is_disabled) {
    return json({ error: "account_disabled" }, 403, request, env);
  }

  await sbRpc(env, "record_login", { p_user_id: profile.id });

  const token = await signJwt(newAppTokenPayload(profile), requireEnv(env, "JWT_SECRET"));

  return json({
    ok: true,
    token,
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      full_name: profile.full_name,
      phone: profile.phone,
      kyc_status: profile.kyc_status
    },
    supabase: {
      access_token: login.access_token,
      refresh_token: login.refresh_token
    }
  }, 200, request, env);
}

async function forgotPassword(body, request, env) {
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) return json({ error: "email_required" }, 400, request, env);

  const users = await sbSelect(env, "profiles", qp({
    select: "id,email,full_name",
    email: `eq.${email}`,
    limit: 1
  }));

  if (!users.length) {
    return json({ ok: true, message: "If that email exists, a reset link has been sent." }, 200, request, env);
  }

  const user = users[0];
  const rawToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const tokenHash = await sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();

  await sbInsert(env, "password_reset_tokens", {
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt
  });

  const resetUrl = `${env.PUBLIC_URL || ""}/reset-password.html?token=${encodeURIComponent(rawToken)}`;

  if (env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.RESEND_FROM || "Hey Larmah Exchange <onboarding@resend.dev>",
        to: [email],
        subject: "Reset your Hey Larmah Exchange password",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2>Reset your password</h2>
            <p>Hello ${escapeHtml(user.full_name || email)},</p>
            <p>Use the link below to reset your password. This link expires in 30 minutes.</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>If you did not request this, ignore this email.</p>
          </div>
        `
      })
    });
  }

  return json({
    ok: true,
    message: "If that email exists, a reset link has been sent."
  }, 200, request, env);
}

async function resetPassword(body, request, env) {
  const rawToken = String(body.token || "");
  const password = String(body.password || "");
  if (!rawToken || !password) return json({ error: "token_and_password_required" }, 400, request, env);
  if (password.length < 8) return json({ error: "password_must_be_at_least_8_characters" }, 400, request, env);

  const tokenHash = await sha256Hex(rawToken);
  const rows = await sbSelect(env, "password_reset_tokens", qp({
    select: "id,user_id,expires_at,used_at",
    token_hash: `eq.${tokenHash}`,
    order: "id.desc",
    limit: 1
  }));

  if (!rows.length) return json({ error: "invalid_reset_token" }, 400, request, env);

  const row = rows[0];
  if (row.used_at) return json({ error: "reset_token_already_used" }, 400, request, env);
  if (new Date(row.expires_at).getTime() < Date.now()) return json({ error: "reset_token_expired" }, 400, request, env);

  await sbAuthUpdateUserPassword(env, row.user_id, password);
  await sbPatch(env, "password_reset_tokens", `id=eq.${row.id}`, { used_at: new Date().toISOString() });

  return json({ ok: true, message: "Password updated successfully." }, 200, request, env);
}

async function getMe(auth, request, env) {
  const profile = await getProfileById(env, auth.uid);
  return json({
    ok: true,
    user: profile
  }, 200, request, env);
}

// ============================================================================
// User data routes
// ============================================================================

async function getWallets(auth, request, env) {
  const rows = await sbSelect(env, "wallets", qp({
    select: "currency,available,locked,updated_at",
    user_id: `eq.${auth.uid}`,
    order: "currency.asc"
  }));

  return json({ ok: true, wallets: rows }, 200, request, env);
}

async function getRates(request, env) {
  const rows = await sbSelect(env, "rates", qp({
    select: "pair,rate_ngn,is_active,updated_at",
    is_active: "eq.true",
    order: "pair.asc"
  }));

  return json({ ok: true, rates: rows }, 200, request, env);
}

async function getAnnouncements(request, env) {
  const rows = await sbSelect(env, "announcements", qp({
    select: "id,title,body,kind,is_active,created_at",
    is_active: "eq.true",
    order: "id.desc",
    limit: 5
  }));

  return json({ ok: true, announcements: rows }, 200, request, env);
}

async function executeSwap(auth, body, request, env) {
  const ref = makeReference("SWAP");
  const result = await sbRpc(env, "execute_swap", {
    p_from_currency: String(body.from || "").toUpperCase(),
    p_to_currency: String(body.to || "").toUpperCase(),
    p_amount: Number(body.amount || 0),
    p_reference: ref
  }, trueWithUserJwt(auth, env));

  return json({ ok: true, reference: ref, result }, 200, request, env);
}

async function placeOrder(auth, body, request, env) {
  const result = await sbRpc(env, "place_order", {
    p_pair: String(body.pair || "").toUpperCase(),
    p_side: String(body.side || "").toLowerCase(),
    p_price: Number(body.price || 0),
    p_amount: Number(body.amount || 0)
  }, trueWithUserJwt(auth, env));

  return json({ ok: true, result }, 200, request, env);
}

async function getOrders(auth, request, env) {
  const rows = await sbSelect(env, "orders", qp({
    select: "id,pair,side,price,amount,remaining,status,created_at",
    user_id: `eq.${auth.uid}`,
    order: "id.desc"
  }));

  return json({ ok: true, orders: rows }, 200, request, env);
}

async function cancelOrder(auth, id, request, env) {
  const result = await sbRpc(env, "cancel_order", {
    p_order_id: id
  }, trueWithUserJwt(auth, env));

  return json({ ok: true, result }, 200, request, env);
}

async function getTrades(auth, url, request, env) {
  const pair = (url.searchParams.get("pair") || "").toUpperCase();

  if (pair) {
    const rows = await sbSelect(env, "trades", qp({
      select: "id,pair,price,amount,created_at",
      pair: `eq.${pair}`,
      order: "id.desc",
      limit: 100
    }));
    return json({ ok: true, trades: rows }, 200, request, env);
  }

  const rows = await sbSelect(env, "trades", qp({
    select: "id,pair,price,amount,created_at,buyer_user_id,seller_user_id",
    or: `(buyer_user_id.eq.${auth.uid},seller_user_id.eq.${auth.uid})`,
    order: "id.desc",
    limit: 100
  }));

  return json({ ok: true, trades: rows }, 200, request, env);
}

async function getLedger(auth, request, env) {
  const rows = await sbSelect(env, "ledger", qp({
    select: "id,currency,entry_type,amount,balance_available_after,balance_locked_after,reference,meta,created_at",
    user_id: `eq.${auth.uid}`,
    order: "id.desc",
    limit: 200
  }));

  return json({ ok: true, ledger: rows }, 200, request, env);
}

async function submitKyc(auth, body, request, env) {
  const result = await sbRpc(env, "submit_kyc", {
    p_doc_type: String(body.docType || ""),
    p_doc_number: String(body.docNumber || "")
  }, trueWithUserJwt(auth, env));

  return json({ ok: true, kyc: result }, 200, request, env);
}

async function getWithdrawals(auth, request, env) {
  const rows = await sbSelect(env, "withdrawals", qp({
    select: "id,currency,network,amount,destination,status,review_note,created_at,reviewed_at",
    user_id: `eq.${auth.uid}`,
    order: "id.desc",
    limit: 100
  }));

  return json({ ok: true, withdrawals: rows }, 200, request, env);
}

async function requestWithdrawalNgn(auth, body, request, env) {
  const result = await sbRpc(env, "request_withdrawal_ngn", {
    p_amount: Number(body.amount || 0),
    p_bank_code: String(body.bankCode || ""),
    p_account_number: String(body.accountNumber || ""),
    p_account_name: String(body.accountName || "")
  }, trueWithUserJwt(auth, env));

  return json({ ok: true, withdrawal: result }, 200, request, env);
}

async function requestWithdrawalCrypto(auth, body, request, env) {
  const result = await sbRpc(env, "request_withdrawal_crypto", {
    p_currency: String(body.currency || "").toUpperCase(),
    p_network: String(body.network || ""),
    p_amount: Number(body.amount || 0),
    p_address: String(body.address || "")
  }, trueWithUserJwt(auth, env));

  return json({ ok: true, withdrawal: result }, 200, request, env);
}

async function getDepositAddress(auth, coin, network, request, env) {
  const filters = {
    select: "coin,network,address,is_active,created_at",
    user_id: `eq.${auth.uid}`,
    is_active: "eq.true",
    limit: 1
  };
  if (coin) filters.coin = `eq.${coin.toUpperCase()}`;
  if (network) filters.network = `eq.${network}`;

  const rows = await sbSelect(env, "deposit_addresses", qp(filters));
  return json({ ok: true, address: rows[0] || null }, 200, request, env);
}

// ============================================================================
// Paystack routes
// ============================================================================

async function paystackInit(auth, body, request, env) {
  const amountNgn = Number(body.amountNgn || body.amount || 0);
  if (!Number.isFinite(amountNgn) || amountNgn < 100) {
    return json({ error: "minimum_deposit_is_100_ngn" }, 400, request, env);
  }

  const profile = await getProfileById(env, auth.uid);
  const reference = makeReference("PAY");
  await sbInsert(env, "paystack_deposits", {
    user_id: auth.uid,
    reference,
    amount_ngn: amountNgn,
    paystack_status: "initialized"
  });

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${requireEnv(env, "PAYSTACK_SECRET_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: profile.email,
      amount: Math.round(amountNgn * 100),
      reference,
      callback_url: `${env.PUBLIC_URL}/paystack_callback.html?ref=${encodeURIComponent(reference)}`
    })
  });

  const data = await res.json();
  if (!res.ok || !data?.status) {
    return json({ error: data?.message || "paystack_init_failed" }, 400, request, env);
  }

  return json({
    ok: true,
    reference,
    authorization_url: data.data.authorization_url,
    access_code: data.data.access_code
  }, 200, request, env);
}

async function paystackVerify(auth, reference, request, env) {
  if (!reference) return json({ error: "reference_required" }, 400, request, env);

  const depRows = await sbSelect(env, "paystack_deposits", qp({
    select: "id,user_id,reference,amount_ngn,credited_at",
    reference: `eq.${reference}`,
    user_id: `eq.${auth.uid}`,
    limit: 1
  }));

  if (!depRows.length) return json({ error: "deposit_reference_not_found" }, 404, request, env);

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      "Authorization": `Bearer ${requireEnv(env, "PAYSTACK_SECRET_KEY")}`
    }
  });

  const data = await res.json();
  if (!res.ok || !data?.status) {
    return json({ error: data?.message || "paystack_verify_failed" }, 400, request, env);
  }

  const tx = data.data;
  if (tx.status !== "success") {
    return json({ error: `transaction_status_${tx.status}` }, 400, request, env);
  }

  const amountNgn = Number(tx.amount) / 100;
  const result = await sbRpc(env, "credit_paystack_deposit", {
    p_reference: reference,
    p_amount_ngn: amountNgn,
    p_raw_verify: tx
  });

  return json({
    ok: true,
    creditedNgn: amountNgn,
    result
  }, 200, request, env);
}

async function paystackWebhook(raw, request, env) {
  const signature = request.headers.get("x-paystack-signature") || "";
  const expected = await hmacSHA512Hex(requireEnv(env, "PAYSTACK_SECRET_KEY"), raw);

  if (signature !== expected) {
    return json({ error: "invalid_paystack_signature" }, 401, request, env);
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400, request, env);
  }

  if (event?.event === "charge.success") {
    const tx = event.data || {};
    const reference = tx.reference;
    const amountNgn = Number(tx.amount || 0) / 100;

    try {
      await sbRpc(env, "credit_paystack_deposit", {
        p_reference: reference,
        p_amount_ngn: amountNgn,
        p_raw_verify: tx
      });
    } catch (err) {
      // idempotent / safe to ignore if already credited or mismatched handled upstream
    }
  }

  return json({ ok: true }, 200, request, env);
}

// ============================================================================
// Admin routes
// ============================================================================

async function adminStats(auth, request, env) {
  const stats = await sbRpc(env, "admin_stats", {});
  const rates = await sbSelect(env, "rates", qp({
    select: "pair,rate_ngn,is_active,updated_at",
    order: "pair.asc"
  }));
  return json({ ok: true, stats, rates }, 200, request, env);
}

async function adminUsers(auth, url, request, env) {
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  let query = {
    select: "id,email,full_name,phone,role,kyc_status,is_disabled,last_login_at,created_at",
    order: "created_at.desc",
    limit: 200
  };

  if (q) {
    query.or = `(email.ilike.*${q}*,full_name.ilike.*${q}*)`;
  }

  const rows = await sbSelect(env, "vw_admin_users", qp(query));
  return json({ ok: true, users: rows }, 200, request, env);
}

async function adminKycPending(auth, request, env) {
  const rows = await sbSelect(env, "vw_admin_kyc_queue", qp({
    select: "*",
    status: "eq.pending",
    order: "created_at.asc",
    limit: 200
  }));
  return json({ ok: true, items: rows }, 200, request, env);
}

async function adminKycResolve(auth, url, body, request, env) {
  const parts = url.pathname.split("/");
  const id = Number(parts[4]);
  const action = parts[5] === "approve" ? "approved" : "rejected";

  const result = await sbRpc(env, "admin_resolve_kyc", {
    p_kyc_id: id,
    p_decision: action,
    p_note: String(body.note || "")
  });

  return json({ ok: true, kyc: result }, 200, request, env);
}

async function adminWithdrawalsPending(auth, request, env) {
  const rows = await sbSelect(env, "vw_admin_withdrawals_queue", qp({
    select: "*",
    status: "eq.pending",
    order: "created_at.asc",
    limit: 200
  }));
  return json({ ok: true, items: rows }, 200, request, env);
}

async function adminWithdrawalResolve(auth, url, body, request, env) {
  const parts = url.pathname.split("/");
  const id = Number(parts[4]);
  const action = parts[5] === "approve" ? "approved" : "rejected";

  const result = await sbRpc(env, "admin_resolve_withdrawal", {
    p_withdrawal_id: id,
    p_decision: action,
    p_note: String(body.note || "")
  });

  return json({ ok: true, withdrawal: result }, 200, request, env);
}

async function adminSetRate(auth, body, request, env) {
  const pair = String(body.pair || "").toUpperCase();
  const rate = Number(body.rate || body.rate_ngn || 0);
  if (!pair || rate <= 0) return json({ error: "pair_and_rate_required" }, 400, request, env);

  const rows = await sbUpsert(env, "rates", {
    pair,
    rate_ngn: rate,
    is_active: true,
    updated_by: auth.uid
  }, "pair");

  return json({ ok: true, rate: rows[0] || null }, 200, request, env);
}

async function adminWalletCredit(auth, body, request, env) {
  await sbRpc(env, "admin_credit_wallet", {
    p_user_id: String(body.userId || body.user_id || ""),
    p_currency: String(body.currency || "").toUpperCase(),
    p_amount: Number(body.amount || 0),
    p_reference: String(body.reference || makeReference("ADMINCR")),
    p_meta: body.meta || {}
  });

  return json({ ok: true }, 200, request, env);
}

async function adminWalletDebit(auth, body, request, env) {
  await sbRpc(env, "admin_debit_wallet", {
    p_user_id: String(body.userId || body.user_id || ""),
    p_currency: String(body.currency || "").toUpperCase(),
    p_amount: Number(body.amount || 0),
    p_reference: String(body.reference || makeReference("ADMINDR")),
    p_meta: body.meta || {}
  });

  return json({ ok: true }, 200, request, env);
}

async function adminDepositAddress(auth, body, request, env) {
  const rows = await sbUpsert(env, "deposit_addresses", {
    user_id: String(body.userId || body.user_id || ""),
    coin: String(body.coin || "").toUpperCase(),
    network: String(body.network || ""),
    address: String(body.address || ""),
    is_active: true,
    created_by: auth.uid
  }, "user_id,coin,network");

  return json({ ok: true, address: rows[0] || null }, 200, request, env);
}

async function adminAnnouncement(auth, body, request, env) {
  const rows = await sbInsert(env, "announcements", {
    title: String(body.title || ""),
    body: String(body.body || ""),
    kind: String(body.kind || body.type || "info"),
    is_active: true,
    created_by: auth.uid
  });

  return json({ ok: true, announcement: rows[0] || null }, 200, request, env);
}

// ============================================================================
// Internal helpers
// ============================================================================

async function getProfileByEmail(env, email) {
  const rows = await sbSelect(env, "profiles", qp({
    select: "id,email,full_name,phone,role,kyc_status,is_disabled,created_at",
    email: `eq.${email}`,
    limit: 1
  }));
  if (!rows.length) throw Object.assign(new Error("profile_not_found"), { statusCode: 404 });
  return rows[0];
}

async function getProfileById(env, id) {
  const rows = await sbSelect(env, "profiles", qp({
    select: "id,email,full_name,phone,role,kyc_status,is_disabled,last_login_at,created_at",
    id: `eq.${id}`,
    limit: 1
  }));
  if (!rows.length) throw Object.assign(new Error("profile_not_found"), { statusCode: 404 });
  return rows[0];
}

// Kept for future expansion if you want user-scoped REST with Supabase JWT.
// For now the app routes mostly use service role + worker-side auth.
function trueWithUserJwt() {
  return true;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
