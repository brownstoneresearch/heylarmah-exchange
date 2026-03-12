(function (global) {
  'use strict';

  const defaults = {
    APP_URL: global.location.origin,
    API_BASE_URL: global.location.origin,
    API_TIMEOUT_MS: 15000,
    REALTIME: {
      TICK_MS: 5000,
      PRICES_MS: 15000,
      ANNOUNCEMENTS_MS: 30000,
      PORTFOLIO_MS: 15000,
      MARKET_MS: 5000,
      HISTORY_MS: 10000,
      WITHDRAWALS_MS: 15000,
      KYC_MS: 20000,
      ADMIN_STATS_MS: 10000,
      ADMIN_LIST_MS: 15000,
      ADMIN_LEDGER_MS: 15000,
    },
  };

  const cfg = global.HLX_CONFIG || {};

  function normalizeUrl(value, fallback) {
    return String(value || fallback || '').trim().replace(/\/+$/, '');
  }

  const APP_URL = normalizeUrl(cfg.APP_URL, defaults.APP_URL);
  const API_BASE_URL = normalizeUrl(cfg.API_BASE_URL, defaults.API_BASE_URL);
  const API_TIMEOUT_MS = Number(cfg.API_TIMEOUT_MS || defaults.API_TIMEOUT_MS);
  const REALTIME = Object.freeze({ ...defaults.REALTIME, ...(cfg.REALTIME || {}) });

  function joinUrl(base, path) {
    if (!path) return base;
    if (/^https?:\/\//i.test(path)) return path;
    return `${base}${String(path).startsWith('/') ? '' : '/'}${path}`;
  }

  function appUrl(path = '/') {
    return joinUrl(APP_URL, path);
  }

  function apiUrl(path = '') {
    return joinUrl(API_BASE_URL, path);
  }

  async function api(path, opts = {}) {
    const tok = global.localStorage.getItem('token');
    const headers = { ...(opts.headers || {}) };
    if (tok && !headers.Authorization) headers.Authorization = 'Bearer ' + tok;
    if (!(opts.body instanceof global.FormData) && opts.body !== undefined && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    const timeout = global.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const res = await global.fetch(apiUrl(path), {
        ...opts,
        headers,
        cache: 'no-store',
        mode: 'cors',
        signal: controller.signal,
      });
      const contentType = res.headers.get('content-type') || '';
      let j = {};
      if (contentType.includes('application/json')) {
        j = await res.json().catch(() => ({}));
      } else {
        const text = await res.text().catch(() => '');
        j = text ? { message: text } : {};
      }
      return { ok: res.ok, status: res.status, j, res };
    } catch (error) {
      const isAbort = error && (error.name === 'AbortError' || /aborted/i.test(String(error.message || '')));
      return { ok: false, status: 0, j: { error: isAbort ? 'Request timed out' : (error.message || 'Network error') } };
    } finally {
      global.clearTimeout(timeout);
    }
  }

  global.HLX = Object.freeze({
    config: cfg,
    APP_URL,
    API_BASE_URL,
    API_TIMEOUT_MS,
    REALTIME,
    appUrl,
    apiUrl,
    api,
  });
})(window);
