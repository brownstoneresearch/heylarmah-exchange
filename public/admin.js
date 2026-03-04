/* Hey Larmah Exchange — Admin Dashboard v3.0 */
'use strict';

async function api(path, opts={}) {
  const tok = localStorage.getItem('token');
  const headers = { ...(opts.headers||{}) };
  if (tok) headers['Authorization'] = 'Bearer ' + tok;
  headers['Content-Type'] = 'application/json';
  const res = await fetch(path, {...opts, headers});
  const j   = await res.json().catch(()=>({}));
  if (res.status === 401) { logout(); return {ok:false,j:{error:'Session expired'}}; }
  return {ok:res.ok, status:res.status, j};
}

const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmtTime = iso => iso ? new Date(iso).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'}) : '—';
const fmtNum  = n => parseFloat(n||0).toLocaleString('en-NG',{maximumFractionDigits:8});

function setMsg(id, text, type='err') {
  const el=$(id); if(!el)return;
  el.textContent=text||''; el.className='msg'+(text?' '+type:'');
}

function badge(status) {
  const map={open:'badge-amber',filled:'badge-green',cancelled:'badge-gray',pending:'badge-blue',
    processing:'badge-blue',processed:'badge-green',rejected:'badge-red',approved:'badge-green',
    not_submitted:'badge-gray',pending_review:'badge-blue',user:'badge-gray',admin:'badge-admin'};
  return `<span class="badge ${map[status]||'badge-gray'}">${esc(status)}</span>`;
}

function logout() {
  localStorage.removeItem('token'); localStorage.removeItem('userRole');
  window.location.href='/';
}

const NETWORKS = {
  BTC:['BTC'], ETH:['ERC20','Arbitrum','Optimism','Base'],
  USDT:['ERC20','TRC20','BEP20','Polygon'], BNB:['BEP20','BEP2'], TRX:['TRC20'],
};

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
      if (tab==='stats')       loadStats();
      if (tab==='users')       adminLoadUsers();
      if (tab==='kyc')         adminLoadKyc();
      if (tab==='withdrawals') adminLoadWithdrawals();
      if (tab==='rates')       loadCurrentRates();
      if (tab==='deposits')    loadAdminNetworks();
    });
  });

  init();
});

async function init() {
  const tok = localStorage.getItem('token');
  if (!tok) { window.location.href='/'; return; }
  const {ok,j} = await api('/api/me');
  if (!ok || j.user?.role !== 'admin') { window.location.href='/app.html'; return; }
  $('adminWhoami').textContent = `${j.user.email} · Admin`;
  loadStats();
  loadAdminNetworks();
}

// ── Stats ─────────────────────────────────────────────────────────────────────
async function loadStats() {
  const {ok,j} = await api('/api/admin/stats');
  if (!ok) return;
  $('st-users').textContent  = j.totalUsers||0;
  $('st-active').textContent = j.activeUsers||0;
  $('st-kycp').textContent   = j.kycPending||0;
  $('st-kyca').textContent   = j.kycApproved||0;
  $('st-pw').textContent     = j.pendingWithdrawals||0;
  $('st-orders').textContent = j.openOrders||0;
  $('st-trades').textContent = j.tradesLast24h||0;
  $('st-time').textContent   = new Date().toLocaleTimeString('en-GB');

  const rateEl = $('adminRatesDisplay');
  if (rateEl && j.rates) {
    const pairs = ['BTCNGN','ETHNGN','USDTNGN','BNBNGN','TRXNGN'];
    rateEl.innerHTML = pairs.map(p=>`
      <div class="stat-card">
        <div class="label">${p.replace('NGN','/NGN')}</div>
        <div class="value text-amber" style="font-size:16px">₦${fmtNum(j.rates[p]||'0')}</div>
      </div>`).join('');
  }
}

// ── Users ─────────────────────────────────────────────────────────────────────
let searchTimer;
function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(adminLoadUsers, 400);
}

async function adminLoadUsers() {
  const search = $('userSearch')?.value.trim()||'';
  const {ok,j} = await api(`/api/admin/users?limit=100${search?'&search='+encodeURIComponent(search):''}`);
  const tb = document.querySelector('#usersTable tbody'); if(!tb)return;
  if (!ok) { tb.innerHTML='<tr><td colspan="9" class="text-faint" style="text-align:center;padding:20px">Failed to load</td></tr>'; return; }
  if (!j.users?.length) { tb.innerHTML='<tr><td colspan="9" class="text-faint" style="text-align:center;padding:20px">No users found</td></tr>'; return; }
  tb.innerHTML = j.users.map(u=>`
    <tr>
      <td>#${u.id}</td>
      <td>${esc(u.email)}</td>
      <td>${esc(u.full_name||'—')}</td>
      <td>${badge(u.role)}</td>
      <td id="kyc-status-${u.id}"><button class="btn btn-secondary btn-sm" onclick="loadUserKyc(${u.id})">Load</button></td>
      <td>${u.is_suspended ? '<span class="badge badge-red">Suspended</span>' : '<span class="badge badge-green">Active</span>'}</td>
      <td class="text-sm">${fmtTime(u.created_at)}</td>
      <td class="text-sm">${fmtTime(u.last_login_at)}</td>
      <td>
        <div class="flex" style="gap:4px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="toggleSuspend(${u.id}, ${!u.is_suspended})">${u.is_suspended?'Unsuspend':'Suspend'}</button>
          <button class="btn btn-teal btn-sm" onclick="forceKyc(${u.id})">Approve KYC</button>
        </div>
      </td>
    </tr>`).join('');
}

async function loadUserKyc(uid) {
  const {ok,j} = await api(`/api/admin/users/${uid}`);
  const el = $(`kyc-status-${uid}`); if(!el)return;
  el.innerHTML = badge(j.kyc?.status||'not_submitted');
}

async function toggleSuspend(uid, suspend) {
  if (!confirm(`${suspend?'Suspend':'Unsuspend'} user #${uid}?`)) return;
  const {ok,j} = await api(`/api/admin/users/${uid}/suspend`,{method:'POST',body:JSON.stringify({suspend})});
  if (!ok) return alert(j.error||'Failed');
  adminLoadUsers();
}

async function forceKyc(uid) {
  if (!confirm(`Force approve KYC for user #${uid}?`)) return;
  const {ok,j} = await api(`/api/admin/users/${uid}/kyc-force-approve`,{method:'POST',body:JSON.stringify({notes:'Admin force-approved'})});
  if (!ok) return alert(j.error||'Failed');
  alert('KYC approved');
  adminLoadUsers();
}

// ── KYC Review ────────────────────────────────────────────────────────────────
async function adminLoadKyc() {
  const {ok,j} = await api('/api/admin/kyc/pending');
  const tb = document.querySelector('#kycTable tbody'); if(!tb)return;
  if (!ok) { tb.innerHTML='<tr><td colspan="7" class="text-faint" style="text-align:center;padding:20px">Failed to load</td></tr>'; return; }
  if (!j.pending?.length) { tb.innerHTML='<tr><td colspan="7" class="text-faint" style="text-align:center;padding:20px">No pending KYC</td></tr>'; return; }
  tb.innerHTML = j.pending.map(k=>`
    <tr>
      <td>#${k.user_id}</td>
      <td>${esc(k.email||'—')}</td>
      <td>${esc(k.full_name||'—')}</td>
      <td>${esc(k.document_type||'—')}</td>
      <td class="text-mono">${esc(k.document_number||'—')}</td>
      <td>${fmtTime(k.submitted_at)}</td>
      <td>
        <div class="flex" style="gap:4px">
          <button class="btn btn-teal btn-sm" onclick="reviewKyc(${k.user_id},'approve')">Approve</button>
          <button class="btn btn-danger btn-sm" onclick="reviewKyc(${k.user_id},'reject')">Reject</button>
        </div>
      </td>
    </tr>`).join('');
}

async function reviewKyc(uid, action) {
  const notes = action==='reject' ? prompt('Rejection reason (optional):') : null;
  const {ok,j} = await api(`/api/admin/kyc/${uid}/${action}`,{method:'POST',body:JSON.stringify({notes:notes||''})});
  if (!ok) return alert(j.error||'Failed');
  adminLoadKyc();
}

// ── Withdrawals ───────────────────────────────────────────────────────────────
async function adminLoadWithdrawals() {
  const {ok,j} = await api('/api/admin/withdrawals/pending');
  const tb = document.querySelector('#adminWTable tbody'); if(!tb)return;
  if (!ok) { tb.innerHTML='<tr><td colspan="8" class="text-faint" style="text-align:center;padding:20px">Failed to load</td></tr>'; return; }
  if (!j.pending?.length) { tb.innerHTML='<tr><td colspan="8" class="text-faint" style="text-align:center;padding:20px">No pending withdrawals</td></tr>'; return; }
  tb.innerHTML = j.pending.map(w=>{
    const dest = w.destination||{};
    const destStr = dest.address||(dest.accountNumber?`${dest.accountNumber} — ${dest.bankCode||''}`:JSON.stringify(dest));
    return `<tr>
      <td>#${w.id}</td>
      <td>#${w.user_id}</td>
      <td>${esc(w.currency)}</td>
      <td>${esc(w.network||'—')}</td>
      <td class="text-mono">${w.amount}</td>
      <td class="text-sm" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(destStr)}</td>
      <td class="text-sm">${fmtTime(w.created_at)}</td>
      <td>
        <div class="flex" style="gap:4px">
          <button class="btn btn-teal btn-sm" onclick="processWithdrawal(${w.id},'mark-processed')">✓ Processed</button>
          <button class="btn btn-danger btn-sm" onclick="processWithdrawal(${w.id},'reject')">✗ Reject</button>
        </div>
      </td>
    </tr>`;}).join('');
}

async function processWithdrawal(id, action) {
  const notes = action==='reject' ? prompt('Rejection notes (optional):') : prompt('Processing notes (optional):');
  const {ok,j} = await api(`/api/admin/withdrawals/${id}/${action}`,{method:'POST',body:JSON.stringify({notes:notes||''})});
  if (!ok) return alert(j.error||'Failed');
  adminLoadWithdrawals();
}

// ── Rates ─────────────────────────────────────────────────────────────────────
async function loadCurrentRates() {
  const {ok,j} = await api('/api/rates');
  if (!ok) return;
  j.rates?.forEach(r => {
    const inp = $('rate-'+r.pair);
    if (inp) inp.placeholder = `Current: ₦${fmtNum(r.rate_ngn_per_unit)}`;
  });
}

async function setRate(pair) {
  const val = $('rate-'+pair).value.trim();
  setMsg('rateMsg-'+pair,'');
  if (!val) return setMsg('rateMsg-'+pair,'Enter rate');
  const {ok,j} = await api('/api/admin/rates',{method:'POST',body:JSON.stringify({pair,rateNgnPerUnit:val})});
  if (!ok) return setMsg('rateMsg-'+pair, j.error||'Failed');
  setMsg('rateMsg-'+pair,'Rate updated ✓','ok');
  $('rate-'+pair).value='';
  loadCurrentRates();
  setTimeout(()=>setMsg('rateMsg-'+pair,''), 3000);
}

// ── Wallets ───────────────────────────────────────────────────────────────────
async function adminCredit() {
  const uid = $('walUid').value.trim();
  const cur = $('walCur').value;
  const amt = $('walAmt').value.trim();
  setMsg('walMsg','');
  if (!uid||!amt) return setMsg('walMsg','User ID and amount required');
  const {ok,j} = await api('/api/admin/wallet/credit',{method:'POST',body:JSON.stringify({userId:Number(uid),currency:cur,amount:amt})});
  if (!ok) return setMsg('walMsg', j.error||'Failed');
  setMsg('walMsg', `Credited ${amt} ${cur} to user #${uid}`, 'ok');
  $('walAmt').value='';
}

async function adminDebit() {
  const uid = $('walUid').value.trim();
  const cur = $('walCur').value;
  const amt = $('walAmt').value.trim();
  setMsg('walMsg','');
  if (!uid||!amt) return setMsg('walMsg','User ID and amount required');
  if (!confirm(`Debit ${amt} ${cur} from user #${uid}?`)) return;
  const {ok,j} = await api('/api/admin/wallet/debit',{method:'POST',body:JSON.stringify({userId:Number(uid),currency:cur,amount:amt})});
  if (!ok) return setMsg('walMsg', j.error||'Failed');
  setMsg('walMsg', `Debited ${amt} ${cur} from user #${uid}`, 'ok');
  $('walAmt').value='';
}

async function adminViewWallets() {
  const uid = $('walViewUid').value.trim();
  if (!uid) return;
  const {ok,j} = await api(`/api/admin/users/${uid}`);
  const el = $('walViewResult'); if(!el)return;
  if (!ok) { el.innerHTML=`<div class="msg err">${j.error||'User not found'}</div>`; return; }
  const ICONS={NGN:'₦',BTC:'₿',ETH:'Ξ',USDT:'₮',BNB:'⬡',TRX:'⚡'};
  el.innerHTML = `<div class="text-sm text-faint" style="margin-bottom:8px">${esc(j.user?.email)}</div>`+
    (j.wallets||[]).map(w=>`
    <div class="wallet-row">
      <span class="text-amber">${ICONS[w.currency]||''} ${esc(w.currency)}</span>
      <div>
        <div class="text-mono">${fmtNum(w.available)}</div>
        ${w.locked!=='0'?`<div class="text-faint text-sm">Locked: ${fmtNum(w.locked)}</div>`:''}
      </div>
    </div>`).join('');
}

// ── Ledger ────────────────────────────────────────────────────────────────────
async function adminLoadLedger() {
  const uid = $('ledUid').value.trim();
  const {ok,j} = await api(`/api/admin/ledger${uid?'?userId='+uid:''}`);
  const tb = document.querySelector('#adminLedger tbody'); if(!tb)return;
  if (!ok||!j.entries?.length) { tb.innerHTML='<tr><td colspan="7" class="text-faint" style="text-align:center;padding:20px">No entries</td></tr>'; return; }
  tb.innerHTML = j.entries.map(e=>`
    <tr>
      <td>#${e.id}</td><td>#${e.user_id}</td>
      <td>${esc(e.type)}</td><td>${esc(e.currency)}</td>
      <td class="${parseFloat(e.amount)>=0?'text-green':'text-red'}">${e.amount}</td>
      <td class="text-faint text-sm">${esc(e.reference||'—')}</td>
      <td>${fmtTime(e.created_at)}</td>
    </tr>`).join('');
}

// ── Deposit Addresses ─────────────────────────────────────────────────────────
function loadAdminNetworks() {
  const coin = $('daCoin')?.value;
  if (!coin) return;
  const nets = NETWORKS[coin]||['Mainnet'];
  $('daNetwork').innerHTML = nets.map(n=>`<option value="${n}">${n}</option>`).join('');
}

async function assignDepositAddr() {
  const uid     = $('daUid').value.trim();
  const currency = $('daCoin').value;
  const network  = $('daNetwork').value;
  const address  = $('daAddr').value.trim();
  setMsg('daMsg','');
  if (!uid||!address) return setMsg('daMsg','User ID and address required');
  const {ok,j} = await api('/api/admin/deposit-address',{method:'POST',body:JSON.stringify({userId:Number(uid),currency,network,address})});
  if (!ok) return setMsg('daMsg', j.error||'Failed');
  setMsg('daMsg', `Address assigned to user #${uid}`, 'ok');
  $('daAddr').value='';
}

// ── Announcements ─────────────────────────────────────────────────────────────
async function postAnnouncement() {
  const title = $('annTitle').value.trim();
  const body  = $('annBody').value.trim();
  const type  = $('annType').value;
  setMsg('annMsg','');
  if (!title||!body) return setMsg('annMsg','Title and message required');
  const {ok,j} = await api('/api/admin/announcements',{method:'POST',body:JSON.stringify({title,body,type})});
  if (!ok) return setMsg('annMsg', j.error||'Failed');
  setMsg('annMsg','Announcement posted ✓','ok');
  $('annTitle').value=''; $('annBody').value='';
}
