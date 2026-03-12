-- ============================================================
-- Hey Larmah Exchange — Production Schema v3.0
-- Supports: BTC, ETH, USDT, BNB, TRX + NGN
-- Run this in Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  full_name TEXT,
  phone TEXT,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  available BIGINT NOT NULL DEFAULT 0,
  locked BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, currency)
);

CREATE TABLE IF NOT EXISTS kyc (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_submitted',
  document_type TEXT,
  document_number TEXT,
  selfie_path TEXT,
  id_front_path TEXT,
  id_back_path TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewer_id INTEGER,
  notes TEXT
);

-- Exchange rates set by admin (NGN per unit, stored in kobo)
CREATE TABLE IF NOT EXISTS rates (
  pair TEXT PRIMARY KEY,
  rate BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crypto deposit addresses per user per coin/network
CREATE TABLE IF NOT EXISTS deposit_addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, currency, network)
);

CREATE TABLE IF NOT EXISTS paystack_transactions (
  reference TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'initialized',
  raw_json TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  currency TEXT NOT NULL,
  network TEXT,
  amount BIGINT NOT NULL,
  destination_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  provider_ref TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  pair TEXT NOT NULL,
  side TEXT NOT NULL,
  price BIGINT NOT NULL,
  amount BIGINT NOT NULL,
  remaining BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_match ON orders(pair, side, status, price, created_at);

CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  pair TEXT NOT NULL,
  buy_order_id INTEGER NOT NULL,
  sell_order_id INTEGER NOT NULL,
  price BIGINT NOT NULL,
  amount BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount BIGINT NOT NULL,
  reference TEXT,
  metadata_json TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

<<<<<<< HEAD
CREATE INDEX IF NOT EXISTS idx_trades_pair_created_at ON trades(pair, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_user_created_at ON ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_created_at ON withdrawals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status_created_at ON withdrawals(status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_kyc_status_submitted_at ON kyc(status, submitted_at ASC);
CREATE INDEX IF NOT EXISTS idx_announcements_active_created_at ON announcements(active, created_at DESC);

=======
>>>>>>> 883abcdf4de9d28ed21f79be4df8f0c648c04f7f
-- ── Seed default rates (NGN per 1 unit, in kobo = NGN * 100) ──────────────
-- Admin can update these via dashboard
INSERT INTO rates(pair, rate) VALUES
  ('BTCNGN',  9500000000),   -- ₦95,000,000 per BTC
  ('ETHNGN',  600000000),    -- ₦6,000,000 per ETH
  ('USDTNGN', 165000),       -- ₦1,650 per USDT
  ('BNBNGN',  90000000),     -- ₦900,000 per BNB
  ('TRXNGN',  25000)         -- ₦250 per TRX
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- RPC FUNCTIONS
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id INTEGER, p_currency TEXT, p_amount BIGINT,
  p_type TEXT, p_reference TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO wallets(user_id, currency, available, locked)
  VALUES(p_user_id, p_currency, 0, 0) ON CONFLICT DO NOTHING;
  UPDATE wallets SET available = available + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id AND currency = p_currency;
  INSERT INTO ledger(user_id, type, currency, amount, reference)
  VALUES(p_user_id, p_type, p_currency, p_amount, p_reference);
END; $$;

CREATE OR REPLACE FUNCTION debit_wallet(
  p_user_id INTEGER, p_currency TEXT, p_amount BIGINT,
  p_type TEXT, p_reference TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_available BIGINT;
BEGIN
  SELECT available INTO v_available FROM wallets
  WHERE user_id = p_user_id AND currency = p_currency FOR UPDATE;
  IF v_available IS NULL OR v_available < p_amount THEN
    RAISE EXCEPTION 'Insufficient % balance', p_currency;
  END IF;
  UPDATE wallets SET available = available - p_amount, updated_at = NOW()
  WHERE user_id = p_user_id AND currency = p_currency;
  INSERT INTO ledger(user_id, type, currency, amount, reference)
  VALUES(p_user_id, p_type, p_currency, -p_amount, p_reference);
END; $$;

CREATE OR REPLACE FUNCTION perform_swap(
  p_user_id INTEGER, p_from_currency TEXT, p_to_currency TEXT,
  p_amount BIGINT, p_rate BIGINT, p_fee_bps INTEGER
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  v_from_avail BIGINT;
  v_to_amount  BIGINT;
  v_fee        BIGINT;
  v_net        BIGINT;
  v_decimals   INTEGER;
  v_scale      BIGINT;
BEGIN
  SELECT available INTO v_from_avail FROM wallets
  WHERE user_id = p_user_id AND currency = p_from_currency FOR UPDATE;
  IF v_from_avail IS NULL OR v_from_avail < p_amount THEN
    RAISE EXCEPTION 'Insufficient %', p_from_currency;
  END IF;

  -- Scale factor based on crypto decimals
  v_scale := CASE p_from_currency
    WHEN 'BTC'  THEN 100000000
    WHEN 'ETH'  THEN 100000000
    WHEN 'BNB'  THEN 100000000
    WHEN 'USDT' THEN 1000000
    WHEN 'TRX'  THEN 1000000
    WHEN 'NGN'  THEN 100
    ELSE 100000000
  END;

  IF p_from_currency = 'NGN' THEN
    -- NGN → Crypto
    v_to_amount := (p_amount::NUMERIC * v_scale / p_rate)::BIGINT;
    v_fee       := (v_to_amount * p_fee_bps / 10000)::BIGINT;
    v_net       := v_to_amount - v_fee;
    IF v_net <= 0 THEN RAISE EXCEPTION 'Amount too small after fees'; END IF;
  ELSE
    -- Crypto → NGN
    v_scale := CASE p_from_currency
      WHEN 'BTC'  THEN 100000000
      WHEN 'ETH'  THEN 100000000
      WHEN 'BNB'  THEN 100000000
      WHEN 'USDT' THEN 1000000
      WHEN 'TRX'  THEN 1000000
      ELSE 100000000
    END;
    v_to_amount := (p_amount::NUMERIC * p_rate / v_scale)::BIGINT;
    v_fee       := (v_to_amount * p_fee_bps / 10000)::BIGINT;
    v_net       := v_to_amount - v_fee;
  END IF;

  UPDATE wallets SET available = available - p_amount, updated_at = NOW()
  WHERE user_id = p_user_id AND currency = p_from_currency;

  INSERT INTO wallets(user_id, currency, available, locked)
  VALUES(p_user_id, p_to_currency, 0, 0) ON CONFLICT DO NOTHING;
  UPDATE wallets SET available = available + v_net, updated_at = NOW()
  WHERE user_id = p_user_id AND currency = p_to_currency;

  INSERT INTO ledger(user_id, type, currency, amount)
  VALUES(p_user_id, 'swap', p_from_currency, -p_amount);
  INSERT INTO ledger(user_id, type, currency, amount)
  VALUES(p_user_id, 'swap', p_to_currency, v_net);

  RETURN json_build_object('from_amount', p_amount, 'to_amount', v_net, 'fee_amount', v_fee::TEXT);
END; $$;

CREATE OR REPLACE FUNCTION place_order(
  p_user_id INTEGER, p_pair TEXT, p_side TEXT,
  p_price BIGINT, p_amount BIGINT, p_fee_bps INTEGER
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  v_order_id INTEGER;
  v_reserve  BIGINT;
  v_avail    BIGINT;
  v_base     TEXT;
  v_quote    TEXT;
  v_scale    BIGINT;
BEGIN
  v_quote := 'NGN';
  v_base  := substring(p_pair from 1 for char_length(p_pair) - 3);
  v_scale := CASE v_base
    WHEN 'BTC'  THEN 100000000
    WHEN 'ETH'  THEN 100000000
    WHEN 'BNB'  THEN 100000000
    WHEN 'USDT' THEN 1000000
    WHEN 'TRX'  THEN 1000000
    ELSE 100000000
  END;

  IF p_side = 'buy' THEN
    v_reserve := (p_price::NUMERIC * p_amount / v_scale)::BIGINT;
    SELECT available INTO v_avail FROM wallets
    WHERE user_id = p_user_id AND currency = 'NGN' FOR UPDATE;
    IF v_avail IS NULL OR v_avail < v_reserve THEN RAISE EXCEPTION 'Insufficient NGN balance'; END IF;
    UPDATE wallets SET available = available - v_reserve, locked = locked + v_reserve, updated_at = NOW()
    WHERE user_id = p_user_id AND currency = 'NGN';
  ELSE
    SELECT available INTO v_avail FROM wallets
    WHERE user_id = p_user_id AND currency = v_base FOR UPDATE;
    IF v_avail IS NULL OR v_avail < p_amount THEN RAISE EXCEPTION 'Insufficient % balance', v_base; END IF;
    UPDATE wallets SET available = available - p_amount, locked = locked + p_amount, updated_at = NOW()
    WHERE user_id = p_user_id AND currency = v_base;
  END IF;

  INSERT INTO orders(user_id, pair, side, price, amount, remaining)
  VALUES(p_user_id, p_pair, p_side, p_price, p_amount, p_amount)
  RETURNING id INTO v_order_id;

  RETURN json_build_object('order_id', v_order_id);
END; $$;

CREATE OR REPLACE FUNCTION cancel_order(
  p_order_id INTEGER, p_user_id INTEGER
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_reserve BIGINT;
  v_base TEXT;
  v_scale BIGINT;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.user_id != p_user_id THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF v_order.status != 'open' THEN RAISE EXCEPTION 'Order not open'; END IF;

  v_base  := substring(v_order.pair from 1 for char_length(v_order.pair) - 3);
  v_scale := CASE v_base WHEN 'BTC' THEN 100000000 WHEN 'ETH' THEN 100000000
    WHEN 'BNB' THEN 100000000 WHEN 'USDT' THEN 1000000 WHEN 'TRX' THEN 1000000
    ELSE 100000000 END;

  IF v_order.side = 'buy' THEN
    v_reserve := (v_order.price::NUMERIC * v_order.remaining / v_scale)::BIGINT;
    UPDATE wallets SET available = available + v_reserve, locked = locked - v_reserve, updated_at = NOW()
    WHERE user_id = p_user_id AND currency = 'NGN';
  ELSE
    UPDATE wallets SET available = available + v_order.remaining, locked = locked - v_order.remaining, updated_at = NOW()
    WHERE user_id = p_user_id AND currency = v_base;
  END IF;

  UPDATE orders SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
  WHERE id = p_order_id;
END; $$;

CREATE OR REPLACE FUNCTION request_withdrawal(
  p_user_id INTEGER, p_currency TEXT, p_amount BIGINT,
  p_destination TEXT, p_network TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE v_avail BIGINT; v_wid INTEGER;
BEGIN
  SELECT available INTO v_avail FROM wallets
  WHERE user_id = p_user_id AND currency = p_currency FOR UPDATE;
  IF v_avail IS NULL OR v_avail < p_amount THEN
    RAISE EXCEPTION 'Insufficient % balance', p_currency;
  END IF;
  UPDATE wallets SET available = available - p_amount, locked = locked + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id AND currency = p_currency;
  INSERT INTO withdrawals(user_id, currency, network, amount, destination_json)
  VALUES(p_user_id, p_currency, p_network, p_amount, p_destination)
  RETURNING id INTO v_wid;
  INSERT INTO ledger(user_id, type, currency, amount, reference)
  VALUES(p_user_id, 'withdraw_requested', p_currency, -p_amount, 'withdraw:' || v_wid);
  RETURN json_build_object('withdrawal_id', v_wid);
END; $$;

CREATE OR REPLACE FUNCTION process_withdrawal(
  p_withdrawal_id INTEGER, p_admin_id INTEGER, p_notes TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_w withdrawals%ROWTYPE;
BEGIN
  SELECT * INTO v_w FROM withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found'; END IF;
  IF v_w.status != 'pending' THEN RAISE EXCEPTION 'Not pending'; END IF;
  UPDATE wallets SET locked = locked - v_w.amount, updated_at = NOW()
  WHERE user_id = v_w.user_id AND currency = v_w.currency;
  UPDATE withdrawals SET status = 'processed', processed_at = NOW(), notes = p_notes
  WHERE id = p_withdrawal_id;
END; $$;

CREATE OR REPLACE FUNCTION reject_withdrawal(
  p_withdrawal_id INTEGER, p_admin_id INTEGER, p_notes TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_w withdrawals%ROWTYPE;
BEGIN
  SELECT * INTO v_w FROM withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found'; END IF;
  IF v_w.status != 'pending' THEN RAISE EXCEPTION 'Not pending'; END IF;
  UPDATE wallets SET available = available + v_w.amount, locked = locked - v_w.amount, updated_at = NOW()
  WHERE user_id = v_w.user_id AND currency = v_w.currency;
  UPDATE withdrawals SET status = 'rejected', processed_at = NOW(), notes = p_notes
  WHERE id = p_withdrawal_id;
END; $$;

<<<<<<< HEAD

CREATE OR REPLACE FUNCTION finalize_paystack_deposit(
  p_reference TEXT,
  p_amount BIGINT,
  p_credit_type TEXT DEFAULT 'paystack_deposit'
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  v_tx paystack_transactions%ROWTYPE;
BEGIN
  SELECT * INTO v_tx
  FROM paystack_transactions
  WHERE reference = p_reference
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  IF v_tx.amount <> p_amount THEN
    RAISE EXCEPTION 'Amount mismatch for reference %', p_reference;
  END IF;

  IF v_tx.status = 'success' THEN
    RETURN json_build_object(
      'ok', true,
      'already_processed', true,
      'reference', v_tx.reference,
      'user_id', v_tx.user_id,
      'amount', v_tx.amount
    );
  END IF;

  PERFORM credit_wallet(v_tx.user_id, 'NGN', v_tx.amount, p_credit_type, p_reference);

  UPDATE paystack_transactions
  SET status = 'success', processed_at = NOW()
  WHERE reference = p_reference;

  RETURN json_build_object(
    'ok', true,
    'already_processed', false,
    'reference', v_tx.reference,
    'user_id', v_tx.user_id,
    'amount', v_tx.amount
  );
END; $$;

=======
>>>>>>> 883abcdf4de9d28ed21f79be4df8f0c648c04f7f
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  v_total_users INTEGER; v_active_users INTEGER;
  v_kyc_pending INTEGER; v_kyc_approved INTEGER;
  v_pending_withdrawals INTEGER; v_open_orders INTEGER; v_trades_24h INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM users;
  SELECT COUNT(*) INTO v_active_users FROM users WHERE last_login_at > NOW() - INTERVAL '30 days';
  SELECT COUNT(*) INTO v_kyc_pending FROM kyc WHERE status = 'pending';
  SELECT COUNT(*) INTO v_kyc_approved FROM kyc WHERE status = 'approved';
  SELECT COUNT(*) INTO v_pending_withdrawals FROM withdrawals WHERE status = 'pending';
  SELECT COUNT(*) INTO v_open_orders FROM orders WHERE status = 'open';
  SELECT COUNT(*) INTO v_trades_24h FROM trades WHERE created_at > NOW() - INTERVAL '1 day';
  RETURN json_build_object(
    'totalUsers', v_total_users, 'activeUsers', v_active_users,
    'kycPending', v_kyc_pending, 'kycApproved', v_kyc_approved,
    'pendingWithdrawals', v_pending_withdrawals,
    'openOrders', v_open_orders, 'tradesLast24h', v_trades_24h
  );
END; $$;

-- Disable RLS (Worker uses service key)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE kyc DISABLE ROW LEVEL SECURITY;
ALTER TABLE rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE paystack_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets DISABLE ROW LEVEL SECURITY;
