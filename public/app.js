/* Hey Larmah Exchange — User Dashboard v3.0 */
'use strict';

const { api: coreApi, appUrl, REALTIME } = window.HLX || {};

// ── Core API ──────────────────────────────────────────────────────────────────
async function api(path, opts={}) {
  const result = await coreApi(path, opts);
  if (result.status === 401) { logout(); return {ok:false, status:401, j:{error:'Session expired'}}; }
  return result;
// ── Core API ──────────────────────────────────────────────────────────────────
async function api(path, opts={}) {
  const tok = localStorage.getItem('token');
  const headers = { ...(opts.headers||{}) };
  if (tok) headers['Authorization'] = 'Bearer ' + tok;
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, {...opts, headers});
  const j   = await res.json().catch(()=>({}));
  if (res.status === 401) { logout(); return {ok:false, j:{error:'Session expired'}}; }
  return {ok:res.ok, status:res.status, j};
}

const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmtTime = iso => iso ? new Date(iso).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'}) : '—';
const fmtNum  = n => parseFloat(n||0).toLocaleString('en-NG',{maximumFractionDigits:8});

function setMsg(id, text, type='err') {
  const el=$(id); if(!el)return;
  el.textContent=text||''; el.className='msg'+(text?' '+type:'');
}

function logout() {
  localStorage.removeItem('token'); localStorage.removeItem('userRole');
  window.location.href = appUrl('/');
  window.location.href='/';
}

function badge(status) {
  const map={open:'badge-amber',filled:'badge-green',cancelled:'badge-gray',pending:'badge-blue',
    processing:'badge-blue',processed:'badge-green',rejected:'badge-red',approved:'badge-green',
    not_submitted:'badge-gray',pending_review:'badge-blue'};
  return `<span class="badge ${map[status]||'badge-gray'}">${esc(status)}</span>`;
}

// ── Tab navigation ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      const panel = $('tab-'+tab);
      if (panel) panel.classList.add('active');
      if (tab==='trade')    { loadOrderbook(); loadMyOrders(); }
      if (tab==='history')  { loadTrades(); loadLedger(); }
      if (tab==='overview') { loadWallets(); loadRates(); loadLedgerPreview(); }
      if (tab==='withdraw') { loadWithdrawals(); loadWithdrawNetworks(); }
      if (tab==='kyc')      loadKycStatus();
      if (tab==='deposit')  loadNetworks();
    });
  });

  init();
});

// ── Network maps ──────────────────────────────────────────────────────────────
const NETWORKS = {
  BTC:  ['BTC'],
  ETH:  ['ERC20','Arbitrum','Optimism','Base'],
  USDT: ['ERC20','TRC20','BEP20','Polygon'],
  BNB:  ['BEP20','BEP2'],
  TRX:  ['TRC20'],
};

function loadNetworks() {
  const coin = $('depCoin').value;
  const nets = NETWORKS[coin]||['Mainnet'];
  $('depNetwork').innerHTML = nets.map(n=>`<option value="${n}">${n}</option>`).join('');
}

function loadWithdrawNetworks() {
  const coin = $('wcCoin').value;
  const nets = NETWORKS[coin]||['Mainnet'];
  $('wcNetwork').innerHTML = nets.map(n=>`<option value="${n}">${n}</option>`).join('');
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  const tok = localStorage.getItem('token');
  if (!tok) { window.location.href = appUrl('/'); return; }
  if (!tok) { window.location.href='/'; return; }

  const {ok,j} = await api('/api/me');
  if (!ok) { logout(); return; }

  // Admin redirect
  if (j.user?.role === 'admin' && !location.search.includes('noredirect')) {
    window.location.href = appUrl('/admin.html'); return;
    window.location.href = '/admin.html'; return;
  }

  $('whoami').textContent = `${j.user?.email} · ${j.user?.role||'user'}`;

  // KYC badge
  const kycBadge = $('kycBadge');
  if (kycBadge) {
    const s = j.kyc?.status||'not_submitted';
    kycBadge.innerHTML = badge(s);
  }

  loadAnnouncements();
  loadLivePrices();
  loadWallets();
  loadRates();
  loadLedgerPreview();
  loadNetworks();
  loadWithdrawNetworks();

  startRealtime();
}


// ── Realtime refresh ──────────────────────────────────────────────────────────
const realtimeState = { timer: null, running: false, last: {} };

function activeTab() {
  return document.querySelector('.tab-btn.active')?.dataset.tab || 'overview';
}

function shouldPoll(key, everyMs, force=false) {
  const now = Date.now();
  if (force || !everyMs) {
    realtimeState.last[key] = now;
    return true;
  }
  if ((realtimeState.last[key] || 0) + everyMs > now) return false;
  realtimeState.last[key] = now;
  return true;
}

async function refreshRealtime(force=false) {
  if (document.hidden && !force) return;
  if (realtimeState.running) return;
  realtimeState.running = true;
  try {
    if (shouldPoll('prices', REALTIME?.PRICES_MS, force)) await loadLivePrices();
    if (shouldPoll('announcements', REALTIME?.ANNOUNCEMENTS_MS, force)) await loadAnnouncements();
    if (shouldPoll('wallets', REALTIME?.PORTFOLIO_MS, force)) await loadWallets();
    if (shouldPoll('rates', REALTIME?.PORTFOLIO_MS, force)) await loadRates();

    const tab = activeTab();
    if (tab === 'overview' && shouldPoll('overview-ledger', REALTIME?.PORTFOLIO_MS, force)) await loadLedgerPreview();
    if (tab === 'trade') {
      if (shouldPoll('orderbook', REALTIME?.MARKET_MS, force)) await loadOrderbook();
      if (shouldPoll('my-orders', REALTIME?.MARKET_MS, force)) await loadMyOrders();
    }
    if (tab === 'swap' && shouldPoll('swap-rates', REALTIME?.PORTFOLIO_MS, force)) await loadRates();
    if (tab === 'withdraw') {
      if (shouldPoll('withdrawals', REALTIME?.WITHDRAWALS_MS, force)) await loadWithdrawals();
      loadWithdrawNetworks();
    }
    if (tab === 'deposit') loadNetworks();
    if (tab === 'kyc' && shouldPoll('kyc', REALTIME?.KYC_MS, force)) await loadKycStatus();
    if (tab === 'history') {
      if (shouldPoll('trades', REALTIME?.HISTORY_MS, force)) await loadTrades();
      if (shouldPoll('ledger', REALTIME?.HISTORY_MS, force)) await loadLedger();
    }
  } finally {
    realtimeState.running = false;
  }
}

function startRealtime() {
  if (realtimeState.timer) clearInterval(realtimeState.timer);
  realtimeState.timer = setInterval(() => { refreshRealtime(false); }, REALTIME?.TICK_MS || 5000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshRealtime(true);
  });
  refreshRealtime(true);
  // Auto-refresh prices every 30s
  setInterval(loadLivePrices, 30000);
}

// ── Live prices ───────────────────────────────────────────────────────────────
let livePrices = {};
async function loadLivePrices() {
  const {ok,j} = await api('/api/prices');
  if (!ok) return;
  livePrices = j;
  const ticker = $('priceTicker');
  if (!ticker) return;
  const coins = [{s:'BTC',n:'Bitcoin'},{s:'ETH',n:'Ethereum'},{s:'USDT',n:'Tether'},{s:'BNB',n:'BNB'},{s:'TRX',n:'TRON'}];
  ticker.innerHTML = coins.map(c =>
    `<span class="ticker-item"><span class="ticker-coin">${c.s}</span><span class="ticker-price">$${(j[c.s]||0).toLocaleString('en-US',{maximumFractionDigits:4})}</span></span>`
  ).join('');
}

// ── Announcements ─────────────────────────────────────────────────────────────
async function loadAnnouncements() {
  const {ok,j} = await api('/api/announcements');
  if (!ok || !j.announcements?.length) return;
  const bar = $('annBar');
  if (!bar) return;
  bar.innerHTML = j.announcements.slice(0,3).map(a=>`<strong>${esc(a.title)}:</strong> ${esc(a.body)}`).join(' &nbsp;·&nbsp; ');
  bar.classList.add('show');
}

// ── Wallets ───────────────────────────────────────────────────────────────────
async function loadWallets() {
  const {ok,j} = await api('/api/wallets');
  const el = $('walletDisplay'); if(!el)return;
  if (!ok) { el.innerHTML='<div class="text-faint">Failed to load</div>'; return; }
  const ICONS = {NGN:'₦',BTC:'₿',ETH:'Ξ',USDT:'₮',BNB:'⬡',TRX:'⚡'};
  el.innerHTML = j.wallets.map(w=>`
    <div class="wallet-row">
      <div class="wallet-currency">${ICONS[w.currency]||''} ${esc(w.currency)}</div>
      <div class="wallet-amounts">
        <div class="wallet-available">${fmtNum(w.available)}</div>
        <div class="wallet-locked">${w.locked!=='0'?`Locked: ${fmtNum(w.locked)}`:''}</div>
      </div>
    </div>`).join('');
}

// ── Rates ─────────────────────────────────────────────────────────────────────
let currentRates = {};
async function loadRates() {
  const {ok,j} = await api('/api/rates');
  const el = $('ratesDisplay'); if(!el)return;
  if (!ok) { el.innerHTML='<div class="text-faint">Failed to load</div>'; return; }
  j.rates?.forEach(r => { currentRates[r.pair] = r.rate_ngn_per_unit; });
  el.innerHTML = j.rates?.map(r=>`
    <div class="rate-row">
      <span class="text-amber">${esc(r.currency)}/NGN</span>
      <span class="text-mono">₦${fmtNum(r.rate_ngn_per_unit)}</span>
    </div>`).join('') || '<div class="text-faint">No rates set</div>';
  const feeEl = $('swapFeeDisplay');
  if (feeEl) feeEl.textContent = ((j.fees?.swap_bps||50)/100).toFixed(2)+'%';
}

// ── Ledger preview ────────────────────────────────────────────────────────────
async function loadLedgerPreview() {
  const {ok,j} = await api('/api/ledger?limit=8');
  const tb = document.querySelector('#recentLedger tbody'); if(!tb)return;
  if (!ok||!j.entries?.length) { tb.innerHTML='<tr><td colspan="4" class="text-faint" style="text-align:center;padding:20px">No transactions yet</td></tr>'; return; }
  tb.innerHTML = j.entries.map(e=>`
    <tr>
      <td>${fmtTime(e.created_at)}</td>
      <td>${badge(e.type)}</td>
      <td>${esc(e.currency)}</td>
      <td class="${parseFloat(e.amount)>=0?'text-green':'text-red'}">${parseFloat(e.amount)>=0?'+':''}${e.amount}</td>
    </tr>`).join('');
}

// ── Quick swap (overview) ─────────────────────────────────────────────────────
function syncQSwap() {
  const from = $('qSwapFrom').value;
  const opts = ['NGN','BTC','ETH','USDT','BNB','TRX'].filter(c=>c!==from);
  $('qSwapTo').innerHTML = opts.map(c=>`<option value="${c}">${c}</option>`).join('');
}

async function doQuickSwap() {
  const from   = $('qSwapFrom').value;
  const to     = $('qSwapTo').value;
  const amount = $('qSwapAmt').value.trim();
  setMsg('qSwapMsg','');
  if (!amount) return setMsg('qSwapMsg','Enter an amount');
  const {ok,j} = await api('/api/swap',{method:'POST',body:JSON.stringify({fromCurrency:from,toCurrency:to,amount})});
  if (!ok) return setMsg('qSwapMsg', j.error||'Swap failed');
  setMsg('qSwapMsg', `Swapped ${j.from.amount} ${j.from.currency} → ${j.to.amount} ${j.to.currency}`, 'ok');
  $('qSwapAmt').value='';
  loadWallets();
}

// ── Swap ──────────────────────────────────────────────────────────────────────
function syncSwapTo() {
  const from = $('swapFrom').value;
  const opts = ['NGN','BTC','ETH','USDT','BNB','TRX'].filter(c=>c!==from);
  $('swapTo').innerHTML = opts.map(c=>`<option value="${c}">${c}</option>`).join('');
  updateSwapPreview();
}

function updateSwapPreview() {
  const el = $('swapPreview'); if(!el)return;
  const from = $('swapFrom')?.value;
  const to   = $('swapTo')?.value;
  const amt  = parseFloat($('swapAmount')?.value||'0');
  if (!amt || !from || !to) { el.innerHTML=''; return; }
  const pair = from==='NGN'?`${to}NGN`:`${from}NGN`;
  const rate = parseFloat(currentRates[pair]||'0');
  if (!rate) { el.innerHTML=''; return; }
  let estimated;
  if (from==='NGN') {
    estimated = ((amt / rate) * 0.995).toFixed(8);
    el.innerHTML = `<div class="swap-preview-text">≈ ${estimated} ${to} (after 0.5% fee)</div>`;
  } else {
    estimated = ((amt * rate) * 0.995).toFixed(2);
    el.innerHTML = `<div class="swap-preview-text">≈ ₦${parseFloat(estimated).toLocaleString('en-NG')} (after 0.5% fee)</div>`;
  }
}

document.addEventListener('input', e => {
  if (e.target.id==='swapAmount') updateSwapPreview();
});

async function doSwap() {
  const from   = $('swapFrom').value;
  const to     = $('swapTo').value;
  const amount = $('swapAmount').value.trim();
  setMsg('swapMsg','');
  if (!amount) return setMsg('swapMsg','Enter an amount');
  if (from===to) return setMsg('swapMsg','Select different currencies');
  const {ok,j} = await api('/api/swap',{method:'POST',body:JSON.stringify({fromCurrency:from,toCurrency:to,amount})});
  if (!ok) return setMsg('swapMsg', j.error||'Swap failed');
  setMsg('swapMsg', `✅ Swapped ${j.from.amount} ${j.from.currency} → ${j.to.amount} ${j.to.currency}`, 'ok');
  $('swapAmount').value='';
  $('swapPreview').innerHTML='';
  loadWallets();
}

// ── Orderbook ─────────────────────────────────────────────────────────────────
async function loadOrderbook() {
  const pair = $('tradePair')?.value||'BTCNGN';
  const {ok,j} = await api(`/api/market/orderbook?pair=${pair}`);
  if (!ok) return;
  const asTb = document.querySelector('#asksTable tbody');
  const bdTb = document.querySelector('#bidsTable tbody');
  const base = pair.replace('NGN','');
  if (asTb) asTb.innerHTML = (j.asks?.length ? j.asks.map(a=>`<tr><td class="ask">${fmtNum(a.price_ngn)}</td><td>${a.amount}</td></tr>`).join('') : '<tr><td colspan="2" class="text-faint">No asks</td></tr>');
  if (bdTb) bdTb.innerHTML = (j.bids?.length ? j.bids.map(b=>`<tr><td class="bid">${fmtNum(b.price_ngn)}</td><td>${b.amount}</td></tr>`).join('') : '<tr><td colspan="2" class="text-faint">No bids</td></tr>');
}

// ── Place order ───────────────────────────────────────────────────────────────
async function placeOrder() {
  const pair   = $('tradePair').value;
  const side   = $('orderSide').value;
  const price  = $('orderPrice').value.trim();
  const amount = $('orderAmount').value.trim();
  setMsg('orderMsg','');
  if (!price||!amount) return setMsg('orderMsg','Price and amount required');
  const {ok,j} = await api('/api/orders',{method:'POST',body:JSON.stringify({pair,side,price,amount})});
  if (!ok) return setMsg('orderMsg', j.error||'Failed to place order');
  setMsg('orderMsg', `Order #${j.orderId} placed`, 'ok');
  $('orderPrice').value=''; $('orderAmount').value='';
  loadOrderbook(); loadMyOrders(); loadWallets();
}

// ── My orders ─────────────────────────────────────────────────────────────────
async function loadMyOrders() {
  const pair = $('tradePair')?.value;
  const {ok,j} = await api(`/api/orders${pair?'?pair='+pair:''}`);
  const tb = document.querySelector('#myOrdersTable tbody'); if(!tb)return;
  if (!ok||!j.orders?.length) { tb.innerHTML='<tr><td colspan="9" class="text-faint" style="text-align:center;padding:20px">No orders</td></tr>'; return; }
  tb.innerHTML = j.orders.map(o=>`
    <tr>
      <td>#${o.id}</td><td>${esc(o.pair)}</td>
      <td><span class="badge ${o.side==='buy'?'badge-green':'badge-red'}">${o.side}</span></td>
      <td>${badge(o.status)}</td>
      <td class="text-mono">₦${fmtNum(o.price_ngn)}</td>
      <td>${o.amount}</td><td>${o.remaining}</td>
      <td>${fmtTime(o.created_at)}</td>
      <td>${o.status==='open'?`<button class="btn btn-danger btn-sm" onclick="cancelOrder(${o.id})">Cancel</button>`:''}</td>
    </tr>`).join('');
}

async function cancelOrder(id) {
  const {ok,j} = await api(`/api/orders/${id}/cancel`,{method:'POST',body:'{}'});
  if (!ok) return alert(j.error||'Cancel failed');
  loadMyOrders(); loadWallets();
}

// ── Deposit ───────────────────────────────────────────────────────────────────
async function doDeposit() {
  const amount = $('depositAmount').value.trim();
  setMsg('depositMsg','');
  if (!amount) return setMsg('depositMsg','Enter amount');
  const {ok,j} = await api('/api/paystack/init',{method:'POST',body:JSON.stringify({amountNgn:amount})});
  if (!ok) return setMsg('depositMsg', j.error||'Failed to init payment');
  window.location.href = j.authorization_url;
}

async function loadDepositAddress() {
  const coin    = $('depCoin').value;
  const network = $('depNetwork').value;
  setMsg('depMsg','');
  const {ok,j} = await api(`/api/deposit/address?currency=${coin}&network=${encodeURIComponent(network)}`);
  if (!ok) { setMsg('depMsg', j.error||'Failed to load address'); return; }
  if (j.address) {
    $('depAddr').textContent = j.address;
    $('depAddrWrap').style.display='block';
    $('depNoAddr').style.display='none';
  } else {
    $('depAddrWrap').style.display='none';
    $('depNoAddr').style.display='block';
  }
}

function copyAddr() {
  const addr = $('depAddr').textContent;
  navigator.clipboard.writeText(addr).then(()=>{ setMsg('depMsg','Address copied!','ok'); setTimeout(()=>setMsg('depMsg',''),2000); });
}

// ── Withdraw ──────────────────────────────────────────────────────────────────
async function withdrawNgn() {
  const amount = $('wnAmount').value.trim();
  const bankCode = $('wnBankCode').value.trim();
  const acctNum  = $('wnAcctNum').value.trim();
  const acctName = $('wnAcctName').value.trim();
  setMsg('wnMsg','');
  if (!amount||!bankCode||!acctNum||!acctName) return setMsg('wnMsg','All fields required');
  const {ok,j} = await api('/api/withdraw/naira',{method:'POST',body:JSON.stringify({amountNgn:amount,bankCode,accountNumber:acctNum,accountName:acctName})});
  if (!ok) return setMsg('wnMsg', j.error||'Withdrawal request failed');
  setMsg('wnMsg', `Withdrawal #${j.withdrawalId} submitted`, 'ok');
  $('wnAmount').value=''; loadWithdrawals(); loadWallets();
}

async function withdrawCrypto() {
  const coin    = $('wcCoin').value;
  const network = $('wcNetwork').value;
  const amount  = $('wcAmount').value.trim();
  const address = $('wcAddr').value.trim();
  setMsg('wcMsg','');
  if (!amount||!address) return setMsg('wcMsg','Amount and address required');
  const {ok,j} = await api('/api/withdraw/crypto',{method:'POST',body:JSON.stringify({currency:coin,network,amount,address})});
  if (!ok) return setMsg('wcMsg', j.error||'Withdrawal request failed');
  setMsg('wcMsg', `Withdrawal #${j.withdrawalId} submitted`, 'ok');
  $('wcAmount').value=''; $('wcAddr').value=''; loadWithdrawals(); loadWallets();
}

async function loadWithdrawals() {
  const {ok,j} = await api('/api/withdrawals');
  const tb = document.querySelector('#withdrawalsTable tbody'); if(!tb)return;
  if (!ok||!j.withdrawals?.length) { tb.innerHTML='<tr><td colspan="7" class="text-faint" style="text-align:center;padding:20px">No withdrawals</td></tr>'; return; }
  tb.innerHTML = j.withdrawals.map(w=>{
    const dest = w.destination;
    const destStr = dest?.address || (dest?.accountNumber ? `${dest.accountNumber} (${dest.bankCode||''})` : '—');
    return `<tr>
      <td>#${w.id}</td><td>${esc(w.currency)}</td><td>${esc(w.network||'—')}</td>
      <td>${w.amount}</td><td>${badge(w.status)}</td>
      <td class="text-mono text-sm" style="max-width:160px;overflow:hidden;text-overflow:ellipsis">${esc(destStr)}</td>
      <td>${fmtTime(w.created_at)}</td>
    </tr>`;}).join('');
}

// ── KYC ──────────────────────────────────────────────────────────────────────
async function loadKycStatus() {
  const {ok,j} = await api('/api/kyc/status');
  const box = $('kycStatusBox'); if(!box)return;
  const statusColors = {not_submitted:'badge-gray',pending:'badge-amber',approved:'badge-green',rejected:'badge-red'};
  const s = ok ? (j.status||'not_submitted') : 'not_submitted';
  box.innerHTML = `<div class="kyc-status-row">
    <span>Status:</span> ${badge(s)}
    ${j.submitted_at ? `<span class="text-faint text-sm">Submitted: ${fmtTime(j.submitted_at)}</span>` : ''}
    ${j.reviewed_at  ? `<span class="text-faint text-sm">Reviewed: ${fmtTime(j.reviewed_at)}</span>` : ''}
  </div>`;
  const formWrap = $('kycFormWrap');
  if (formWrap) {
    formWrap.style.display = (s==='approved'||s==='pending') ? 'none' : 'block';
    if (s==='approved') box.innerHTML += '<div class="msg ok" style="margin-top:12px">✅ Your identity has been verified. You can now withdraw.</div>';
    if (s==='pending')  box.innerHTML += "<div class=\"msg info\" style=\"margin-top:12px\">⏳ Your KYC is under review. We'll notify you soon.</div>";
    if (s==='pending')  box.innerHTML += '<div class="msg info" style="margin-top:12px">⏳ Your KYC is under review. We'll notify you soon.</div>';
    if (s==='rejected') box.innerHTML += '<div class="msg err" style="margin-top:12px">❌ KYC rejected. Please resubmit with correct documents.</div>';
  }
}

async function submitKyc() {
  const docType = $('kycDocType').value;
  const docNum  = $('kycDocNum').value.trim();
  setMsg('kycMsg','');
  if (!docNum) return setMsg('kycMsg','Document number required');
  const {ok,j} = await api('/api/kyc/submit',{method:'POST',body:JSON.stringify({documentType:docType,documentNumber:docNum})});
  if (!ok) return setMsg('kycMsg', j.error||'Submission failed');
  setMsg('kycMsg','KYC submitted for review', 'ok');
  loadKycStatus();
}

// ── Trades & Ledger ───────────────────────────────────────────────────────────
async function loadTrades() {
  const pair = $('histPair')?.value||'BTCNGN';
  const base = pair.replace('NGN','');
  const {ok,j} = await api(`/api/market/trades?pair=${pair}&limit=50`);
  const tb = document.querySelector('#tradesTable tbody'); if(!tb)return;
  if (!ok||!j.trades?.length) { tb.innerHTML=`<tr><td colspan="4" class="text-faint" style="text-align:center;padding:20px">No trades</td></tr>`; return; }
  tb.innerHTML = j.trades.map(t=>`<tr><td>#${t.id}</td><td class="text-mono">₦${fmtNum(t.price_ngn)}</td><td>${t.amount} ${esc(base)}</td><td>${fmtTime(t.created_at)}</td></tr>`).join('');
}

async function loadLedger() {
  const {ok,j} = await api('/api/ledger?limit=100');
  const tb = document.querySelector('#ledgerTable tbody'); if(!tb)return;
  if (!ok||!j.entries?.length) { tb.innerHTML='<tr><td colspan="5" class="text-faint" style="text-align:center;padding:20px">No entries</td></tr>'; return; }
  tb.innerHTML = j.entries.map(e=>`<tr>
    <td>${fmtTime(e.created_at)}</td><td>${esc(e.type)}</td><td>${esc(e.currency)}</td>
    <td class="${parseFloat(e.amount)>=0?'text-green':'text-red'}">${e.amount}</td>
    <td class="text-faint text-sm">${esc(e.reference||'—')}</td>
  </tr>`).join('');
}
