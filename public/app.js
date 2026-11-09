'use strict';

const COLLECTR_ORIGIN = 'https://app.getcollectr.com';
// The portfolio the app was built for. It keeps the original data file ("main").
const DEFAULT_PORTFOLIO = {
  id: 'main', name: 'Main', handle: 'aactnv',
  collectionId: '8ed93da0-5872-43d8-8204-cc39f60ab5f0', collectionName: 'Main', comps: true,
};
const $ = (id) => document.getElementById(id);
const profileUrl = (p) => `${COLLECTR_ORIGIN}/showcase/profile/@${p.handle}`;

let portfolios = [DEFAULT_PORTFOLIO];
let current = DEFAULT_PORTFOLIO;

let state = emptyState();
let stateVersion = '0';
let fx = { dates: [], rates: [] };
const ui = { sort: { key: 'value', dir: -1 }, valueView: 'tracked', effectView: 'tracked', fxRange: 365, syncInFlight: false, ignoredSyncs: new Set() };
let saveChain = Promise.resolve();

function emptyState() {
  return {
    version: 1, items: {}, purchases: [], snapshots: {},
    meta: { lastFull: null, lastQuick: null, totals: null, appliedSyncStamp: '', changed: false, warning: null },
  };
}

/* ---------- formatting ---------- */
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = (d) => new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const nf0 = nf(0), nf2 = nf(2), nf3 = nf(3), nf1 = nf(1);
const money = (sym, n, digits) => (n < 0 ? '−' : '') + sym + (digits === 0 ? nf0 : nf2).format(Math.abs(n));
const ils = (n, digits = 0) => `<span class="num">${money('₪', n, digits)}</span>`;
const usd = (n, digits = 2) => `<span class="num">${money('$', n, digits)}</span>`;
const plainIls = (n) => money('₪', n, 0);
const rateFmt = (r) => `<span class="num">${nf3.format(r)}</span>`;
const pct = (n) => `<span class="num">${n > 0 ? '+' : n < 0 ? '−' : ''}${nf1.format(Math.abs(n))}%</span>`;
function delta(html, n) {
  if (!n) return html;
  return `<span class="${n > 0 ? 'up' : 'down'}">${n > 0 ? '▲' : '▼'} ${html}</span>`;
}
function signedIls(n) {
  return `<span class="num">${n > 0 ? '+' : n < 0 ? '−' : ''}₪${nf0.format(Math.abs(n))}</span>`;
}
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fmtDate = (s) => (s ? `<span class="num">${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}</span>` : '');
const plainDate = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
function timeAgo(iso) {
  if (!iso) return '';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 2) return 'הרגע';
  if (min < 60) return `לפני ${min} דקות`;
  const h = Math.round(min / 60);
  if (h < 24) return h === 1 ? 'לפני שעה' : `לפני ${h} שעות`;
  const d = Math.round(h / 24);
  return d === 1 ? 'אתמול' : `לפני ${d} ימים`;
}
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 4500);
}

/* ---------- persistence ---------- */
const NO_CHANGE = Symbol('no change');
// Every write starts from the newest saved state and is rejected by the server if another
// window saved in between, in which case it reruns on the newer state. fn may run more than once.
function mutate(fn) {
  // A write belongs to the portfolio that was open when it started, even if the user switches meanwhile.
  const pid = current.id;
  const run = async () => {
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        await loadState(pid);
        const result = fn();
        if (result === NO_CHANGE) return null;
        const r = await fetch(`/api/state?p=${encodeURIComponent(pid)}`, {
          method: 'PUT',
          headers: { 'X-State-Version': stateVersion },
          body: JSON.stringify(state),
        });
        if (r.ok) return result;
        if (r.status !== 409) throw new Error(`HTTP ${r.status}`);
      }
      throw new Error('הנתונים עודכנו במקביל מחלון אחר, נסה שוב');
    } finally {
      if (pid !== current.id) await loadState(current.id);
    }
  };
  const p = saveChain.then(run, run);
  saveChain = p.catch(() => {});
  return p;
}
async function loadState(pid = current.id) {
  const r = await fetch(`/api/state?p=${encodeURIComponent(pid)}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const s = await r.json();
  stateVersion = r.headers.get('X-State-Version') || '0';
  const base = emptyState();
  state = { ...base, ...s, meta: { ...base.meta, ...(s.meta || {}) } };
}

/* ---------- exchange rates ---------- */
async function loadFx() {
  const r = await fetch('/api/fx');
  if (!r.ok) throw new Error(await r.text());
  const lines = (await r.text()).trim().split(/\r?\n/);
  const head = lines[0].split(',');
  const iDate = head.indexOf('TIME_PERIOD'), iVal = head.indexOf('OBS_VALUE');
  if (iDate < 0 || iVal < 0) throw new Error('תבנית שערים לא מוכרת');
  const rows = lines.slice(1).map((l) => l.split(','))
    .map((c) => [c[iDate], Number(c[iVal])])
    .filter(([d, v]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && v > 0)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1));
  fx = { dates: rows.map((x) => x[0]), rates: rows.map((x) => x[1]) };
}
// Official rate for a date; on days with no publication (weekends, holidays) the last one before it.
function rateOn(date) {
  let lo = 0, hi = fx.dates.length - 1, found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (fx.dates[mid] <= date) { found = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return found < 0 ? null : { rate: fx.rates[found], date: fx.dates[found] };
}
const currentRate = () => (fx.dates.length ? { rate: fx.rates[fx.rates.length - 1], date: fx.dates[fx.dates.length - 1] } : null);

/* ---------- Collectr ingest ---------- */
const itemKey = (p) => [p.product_id, p.grade_id, p.card_condition, p.product_sub_type, p.grade_company].map((v) => v ?? '').join('|');

function setHistoryPrice(it, date, price) {
  const last = it.history[it.history.length - 1];
  if (last && last[0] === date) last[1] = price;
  else if (!last || last[1] !== price) it.history.push([date, price]);
}
function portfolioUsd() {
  return Object.values(state.items).filter((i) => !i.removed).reduce((s, i) => s + i.qty * i.price, 0);
}

function upsertProduct(p, date, isoNow, markNew) {
  const key = itemKey(p);
  const collectrPrice = Number(p.market_price);
  let it = state.items[key];
  if (!it) {
    it = state.items[key] = { key, firstSeen: date, isNew: markNew, history: [] };
  }
  // A graded card priced from eBay sales keeps that price; Collectr's is kept alongside it.
  const price = it.ebay ? it.ebay.value : collectrPrice;
  Object.assign(it, {
    collectrPrice,
    productId: String(p.product_id),
    name: String(p.product_name || '').trim(),
    set: p.catalog_group || '',
    number: p.card_number || '',
    rarity: p.rarity || '',
    image: p.image_url || '',
    qty: Number(p.quantity) || 0,
    price,
    diff: Number(p.market_price_diff) || 0,
    diffPct: Number(p.market_price_percentage_diff) || 0,
    isCard: !!p.is_card,
    condition: p.card_condition || '',
    subType: p.product_sub_type || '',
    gradeCompany: p.grade_company || '',
    removed: false,
    priceAt: isoNow,
  });
  setHistoryPrice(it, date, price);
  return key;
}

// The first bookmark sent one collection of one profile; the current one sends every collection of a profile.
function normalizeSync(payload) {
  if (payload?.version === 2) return payload;
  return {
    fetchedAt: payload.fetchedAt,
    handle: DEFAULT_PORTFOLIO.handle,
    results: [{ collection: payload.collection, portfolioValue: payload.portfolioValue, totals: payload.totals, products: payload.products }],
  };
}
function syncEntryFor(norm, p) {
  if (String(norm.handle || '').toLowerCase() !== p.handle.toLowerCase()) return null;
  return (norm.results || []).find((r) => r.collection?.id === p.collectionId) || null;
}

function applyFullSync(payload, stamp, fetchedAt) {
  if (payload.collection?.id !== current.collectionId) {
    throw new Error(`הסנכרון לא הגיע מהתיק ${current.name}`);
  }
  if (!Array.isArray(payload.products)) throw new Error('הסנכרון ריק');
  const date = todayStr();
  const isoNow = fetchedAt || new Date().toISOString();
  const isFirst = !state.meta.lastFull;
  const seen = new Set();
  const before = new Set(Object.keys(state.items));
  for (const p of payload.products) seen.add(upsertProduct(p, date, isoNow, !isFirst));
  for (const key of before) {
    if (!seen.has(key)) { state.items[key].removed = true; state.items[key].qty = 0; }
  }
  const usdTotal = Number(payload.portfolioValue);
  const sum = payload.products.reduce((s, p) => s + Number(p.market_price) * Number(p.quantity), 0);
  const count = payload.products.reduce((s, p) => s + Number(p.quantity), 0);
  const expected = payload.totals ? ['cards', 'sealed', 'graded'].reduce((s, k) => s + Number(payload.totals[k] || 0), 0) : count;
  state.meta.warning = (count !== expected || (usdTotal > 0 && Math.abs(sum - usdTotal) > 1))
    ? `הסנכרון האחרון לא תואם לגמרי את Collectr: ${count} פריטים מול ${expected}, ‎$${nf2.format(sum)} מול ‎$${nf2.format(usdTotal)}.`
    : null;
  state.snapshots[date] = { usd: portfolioUsd(), qty: count, lines: payload.products.length, source: 'full' };
  state.meta.lastFull = isoNow;
  state.meta.totals = payload.totals
    ? { cards: Number(payload.totals.cards), sealed: Number(payload.totals.sealed), graded: Number(payload.totals.graded) }
    : null;
  state.meta.changed = false;
  state.meta.appliedSyncStamp = stamp;
  return { added: [...seen].filter((k) => !before.has(k)).length, isFirst, lines: payload.products.length };
}

// The public page embeds the first 30 products, the total value and the counts as page data.
function parseCollectrPage(html) {
  const re = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
  let s = '', m;
  while ((m = re.exec(html))) s += JSON.parse(m[1]);
  const at = s.indexOf('"pages":[{"user"');
  if (at < 0) throw new Error('נתוני התיק לא נמצאו בדף');
  const start = s.indexOf('[', at);
  let depth = 0, inStr = false, end = -1;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === '\\') i++;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) throw new Error('נתוני התיק חתוכים');
  return JSON.parse(s.slice(start, end + 1))[0];
}

async function fetchProfilePage(handle) {
  const r = await fetch(`/api/collectr-page?handle=${encodeURIComponent(handle)}`);
  if (!r.ok) throw new Error(await r.text());
  return parseCollectrPage(await r.text());
}
// The public page only shows the profile's default collection, so other collections rely on full syncs.
async function quickCheck() {
  ui.quickUnsupported = false;
  const data = await fetchProfilePage(current.handle);
  const main = (data.collections || []).find((c) => c.default);
  if (!(data.collections || []).some((c) => c.id === current.collectionId)) {
    throw new Error(`התיק ${current.collectionName} כבר לא מופיע בפרופיל`);
  }
  if (main?.id !== current.collectionId) { ui.quickUnsupported = true; return null; }
  return mutate(() => applyQuickCheck(data));
}

function applyQuickCheck(data) {
  const date = todayStr();
  const isoNow = new Date().toISOString();
  const totals = { cards: Number(data.total_cards), sealed: Number(data.total_sealed), graded: Number(data.total_graded) };
  const hadFull = !!state.meta.lastFull;
  let added = 0;
  if (hadFull) {
    for (const p of data.products || []) {
      if (!state.items[itemKey(p)]) added++;
      upsertProduct(p, date, isoNow, true);
    }
  }
  const known = state.meta.totals;
  if (known && (known.cards !== totals.cards || known.sealed !== totals.sealed || known.graded !== totals.graded)) {
    state.meta.changed = true;
  }
  const value = Number(data.portfolio_value?.[0]?.price);
  const snap = state.snapshots[date];
  if (value > 0) {
    // Collectr's total uses its own prices; swap in eBay prices for cards that have them.
    const ebayAdjust = Object.values(state.items)
      .filter((i) => i.ebay && !i.removed)
      .reduce((s, i) => s + i.qty * (i.price - i.collectrPrice), 0);
    state.snapshots[date] = { ...(snap || {}), usd: value + ebayAdjust, qty: totals.cards + totals.sealed + totals.graded, source: snap?.source === 'full' ? 'full' : 'quick' };
  }
  state.meta.lastQuick = isoNow;
  return { added };
}

async function checkForSync() {
  if (ui.syncInFlight) return;
  ui.syncInFlight = true;
  try {
    // The main portfolio also accepts the file written by the first version of the bookmark.
    const sources = current.id === DEFAULT_PORTFOLIO.id ? [current.handle, ''] : [current.handle];
    for (const handle of sources) {
      const q = handle ? `?handle=${encodeURIComponent(handle)}` : '';
      const source = handle || 'legacy';
      const stamp = (await (await fetch(`/api/sync-stamp${q}`)).text()).trim();
      if (!stamp || (state.meta.appliedSyncs || {})[source] === stamp || stamp === state.meta.appliedSyncStamp) continue;
      if (ui.ignoredSyncs.has(`${current.id}|${source}|${stamp}`)) continue;
      const r = await fetch(`/api/latest-sync${q}`);
      if (!r.ok) continue;
      const norm = normalizeSync(await r.json());
      const entry = syncEntryFor(norm, current);
      // Another profile or collection, or older than what is already loaded: nothing to apply.
      const isOlder = state.meta.lastFull && norm.fetchedAt && norm.fetchedAt <= state.meta.lastFull;
      if (!entry || isOlder) { ui.ignoredSyncs.add(`${current.id}|${source}|${stamp}`); continue; }
      const res = await mutate(() => {
        if ((state.meta.appliedSyncs || {})[source] === stamp) return NO_CHANGE;
        if (state.meta.lastFull && norm.fetchedAt <= state.meta.lastFull) return NO_CHANGE;
        const result = applyFullSync(entry, stamp, norm.fetchedAt);
        state.meta.appliedSyncs = { ...(state.meta.appliedSyncs || {}), [source]: stamp };
        return result;
      });
      if ($('syncDialog').open) $('syncDialog').close();
      render();
      if (!res) continue; // Another window already applied this sync.
      toast(res.isFirst ? `נטענו ${res.lines} מוצרים לתיק ${current.name}` : `סנכרון הושלם: ${res.lines} מוצרים${res.added ? `, ${res.added} חדשים` : ''}`);
    }
  } catch (e) {
    state.meta.warning = `סנכרון נכשל: ${e.message}`;
    render();
  } finally {
    ui.syncInFlight = false;
  }
}

/* ---------- graded cards and eBay sold auctions ---------- */
// Collectr's grade ids (data/grading-scales). 52 means ungraded and is not listed.
const GRADE_MAP = Object.fromEntries('1:PSA:1,2:PSA:1.5,3:PSA:2,4:PSA:3,5:PSA:4,6:PSA:5,7:PSA:6,8:PSA:7,181:PSA:7.5,9:PSA:8,10:PSA:8.5,11:PSA:9,12:PSA:10,13:BGS:1,14:BGS:1.5,15:BGS:2,16:BGS:2.5,17:BGS:3,18:BGS:3.5,19:BGS:4,20:BGS:4.5,21:BGS:5,22:BGS:5.5,23:BGS:6,24:BGS:6.5,25:BGS:7,26:BGS:7.5,27:BGS:8,28:BGS:8.5,29:BGS:9,30:BGS:9.5,31:BGS:10,32:BGS:10,33:CGC:1,34:CGC:1.5,35:CGC:2,36:CGC:2.5,37:CGC:3,38:CGC:3.5,39:CGC:4,40:CGC:4.5,41:CGC:5,42:CGC:5.5,43:CGC:6,44:CGC:6.5,45:CGC:7,46:CGC:7.5,47:CGC:8,48:CGC:8.5,49:CGC:9,50:CGC:9.5,51:CGC:10,53:CGC:10,90:TAG:1,89:TAG:1.5,88:TAG:2,87:TAG:2.5,86:TAG:3,85:TAG:3.5,84:TAG:4,83:TAG:4.5,82:TAG:5,81:TAG:5.5,80:TAG:6,79:TAG:6.5,78:TAG:7,77:TAG:7.5,76:TAG:8,75:TAG:8.5,74:TAG:9,73:TAG:10,72:TAG:10,124:ACE:1,125:ACE:2,126:ACE:3,127:ACE:4,128:ACE:5,129:ACE:6,130:ACE:7,131:ACE:8,132:ACE:9,133:ACE:10,157:ARS:1,158:ARS:2,159:ARS:3,160:ARS:4,161:ARS:5,162:ARS:6,163:ARS:7,164:ARS:8,165:ARS:9,166:ARS:10,167:ARS:10,168:AGS:1,169:AGS:1.5,170:AGS:2,171:AGS:3,172:AGS:4,173:AGS:5,174:AGS:6,175:AGS:7,176:AGS:8,177:AGS:9,178:AGS:9.5,179:AGS:10,180:AGS:10'
  .split(',').map((e) => { const [id, company, value] = e.split(':'); return [id, { company, value }]; }));
const gradeOf = (it) => GRADE_MAP[it.key.split('|')[1]] || null;
const gradeText = (it) => { const g = gradeOf(it); return g ? `${g.company} ${g.value}` : ''; };
const gradedItems = () => Object.values(state.items).filter((i) => gradeOf(i) && !i.removed);

const EBAY_SALES_USED = 5;
const needsSetName = (it) => /celebrations/i.test(it.set); // Reprints share numbers with far pricier Base Set cards.
// Collectr doesn't always mark Japanese sets, so a card can also be learned as Japanese from its sales.
const isJapaneseItem = (it) => !!it.japanese || /\bJP\b|japanese/i.test(it.set);
const normTitle = (s) => String(s || '').toUpperCase().replace(/['’`]/g, '').replace(/[^A-Z0-9/.]+/g, ' ').trim();

function ebayQuery(it) {
  const name = it.name.replace(/\(.*?\)/g, ' ').replace(/&/g, ' ');
  const g = gradeOf(it);
  return [name, it.number, needsSetName(it) ? 'Celebrations' : '', g.company, g.value].join(' ').replace(/\s+/g, ' ').trim();
}
// Fanatics matches poorly on card numbers like 132/185, so search by name and set; the number is checked on each result.
function fanaticsQuery(it) {
  const g = gradeOf(it);
  return [it.name.replace(/\(.*?\)/g, ' '), it.set, g.company, g.value].join(' ').replace(/[&:]/g, ' ').replace(/\s+/g, ' ').trim();
}
function ebayUrl(it) {
  const q = new URLSearchParams({ _nkw: ebayQuery(it), LH_Sold: '1', LH_Complete: '1', LH_Auction: '1', _sop: '13' });
  return `https://www.ebay.com/sch/i.html?${q}`;
}
function isEbayAuctionSearch(url) {
  try {
    const u = new URL(url);
    return u.hostname === 'www.ebay.com' && ['LH_Sold', 'LH_Complete', 'LH_Auction'].every((k) => u.searchParams.get(k) === '1');
  } catch { return false; }
}
function itemForEbayUrl(url) {
  let q = '';
  try { q = (new URL(url).searchParams.get('_nkw') || '').trim().toLowerCase(); } catch { /* handled by the empty match */ }
  return gradedItems().find((i) => ebayQuery(i).toLowerCase() === q) || null;
}
const EBAY_MONTHS = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };

// Decides whether one eBay result is a real sale of exactly this card in exactly this grade.
function checkEbayRow(row, it) {
  const title = String(row.title || '').replace(/^new listing\s*/i, '').trim();
  const t = normTitle(title);
  const out = { title, url: /^https:\/\/www\.ebay\.com\/itm\//.test(row.url || '') ? row.url : '', ok: false, reason: '' };
  const fail = (reason) => { out.reason = reason; return out; };

  const m = /^(?:US\s*)?\$\s*([\d,]+(?:\.\d{1,2})?)$/.exec(String(row.price || '').trim());
  if (m) out.price = Number(m[1].replace(/,/g, ''));
  const d = /Sold\s+([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/.exec(row.text || '');
  if (d && EBAY_MONTHS[d[1].toUpperCase()]) out.date = `${d[3]}-${EBAY_MONTHS[d[1].toUpperCase()]}-${d[2].padStart(2, '0')}`;

  if (!m) return fail('המחיר אינו סכום אחד בדולרים');
  if (!out.date) return fail('אין תאריך מכירה');
  if (/buy it now|best offer/i.test(row.text || '')) return fail('לא מכירה פומבית');
  const problem = titleProblem(title, it);
  if (problem) return fail(problem);
  out.ok = true;
  return out;
}
// Returns why a listing title is not this exact card, or '' if it matches.
function titleProblem(title, it, { skipGrade = false } = {}) {
  const t = normTitle(title);
  const g = gradeOf(it);
  if (!skipGrade) {
    const value = g.value.replace('.', '\\.');
    const grade = new RegExp(`(^|[^A-Z0-9])${g.company}[ .:#-]*((GEM|MINT|MT|NM)[ .-]*)*${value}(?!\\d|\\.\\d)`);
    if (!grade.test(t)) return `הדירוג בכותרת אינו ${g.company} ${g.value}`;
  }
  if (/\b(LOT|LOTS|BUNDLE|PROXY|CUSTOM|REPLICA|FAKE|COPY|STICKER|PICK|CHOOSE)\b/.test(t)) return 'חבילה או פריט לא מקורי';
  if (/\b(PRISTINE|PERFECT|BLACK LABEL)\b/.test(t)) return 'דירוג מיוחד';
  // Reverse holos of the same card number sell for very different prices.
  const isReverseItem = /reverse/i.test(it.subType || '');
  const isReverseTitle = /\bREVERSE\b|\bREV HOLO\b/.test(t);
  if (isReverseTitle && !isReverseItem) return 'גרסת Reverse Holo';
  if (isReverseItem && !isReverseTitle) return 'לא גרסת Reverse Holo';
  // Collectr records each card's version, so a sale of another version doesn't count.
  const nonHoloTitle = /\bNON[ -]?HOLO\b/.test(t);
  if (/holofoil/i.test(it.subType || '') && nonHoloTitle) return 'גרסה שאינה Holo';
  if (/normal/i.test(it.subType || '') && /^(common|uncommon|rare)$/i.test(it.rarity || '') && /\bHOLO\b/.test(t) && !nonHoloTitle) return 'גרסת Holo';
  // Stamped and special-foil printings are separate, differently priced cards.
  if (/\b(PRERELEASE|PRE RELEASE|STAFF|COSMOS|ROCKS AMERICA|STAMPED|STAMP)\b/.test(t)
    && !/prerelease|staff|cosmos|rocks america|stamp/i.test(`${it.name} ${it.set} ${it.subType}`)) return 'גרסה מיוחדת של הקלף';
  if (!isJapaneseItem(it) && /\b(JAPANESE|JAPAN|JPN|JP|KOREAN|CHINESE)\b/.test(t)) return 'שפה אחרת';
  const words = normTitle(it.name.replace(/\(.*?\)/g, ' ')).replace(/[/.]/g, ' ').split(' ')
    .filter((w) => w.length > 1 && !['EX', 'GX', 'VMAX', 'VSTAR', 'MEGA', 'LV'].includes(w));
  const padded = ` ${t.replace(/[/.]/g, ' ')} `;
  if (!words.every((w) => padded.includes(` ${w} `))) return 'שם הקלף שונה';
  const left = String(it.number || '').split('/')[0].toUpperCase();
  if (left) {
    const pattern = /^\d+$/.test(left) ? `0*${Number(left)}` : left;
    if (!new RegExp(`(^|[^A-Z0-9])${pattern}($|[^A-Z0-9])`).test(t)) return 'מספר הקלף שונה';
  }
  if (needsSetName(it) && !padded.includes(' CELEBRATIONS ')) return 'חסר שם הסט Celebrations';
  return '';
}
const average = (values) => values.reduce((s, v) => s + v, 0) / values.length;
function evaluateEbay(rows, it) {
  const checked = rows.map((r) => checkEbayRow(r, it)).filter((r) => r.title && !/^shop on ebay/i.test(r.title));
  const valid = checked.filter((r) => r.ok).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const used = valid.slice(0, EBAY_SALES_USED);
  return {
    used,
    rejected: checked.filter((r) => !r.ok),
    extra: valid.length - used.length,
    value: used.length ? average(used.map((r) => r.price)) : null,
  };
}
function applyEbayPrice(key, result, query) {
  const date = todayStr();
  const it = state.items[key];
  if (!it) throw new Error('הקלף לא נמצא');
  if (it.collectrPrice === undefined) it.collectrPrice = it.price;
  it.ebay = {
    value: result.value,
    fetchedAt: new Date().toISOString(),
    query,
    sales: result.used.map(({ title, price, date: d, url, source }) => ({ title, price, date: d, url, source: source || 'eBay' })),
  };
  it.price = result.value;
  setHistoryPrice(it, date, it.price);
  if (state.snapshots[date]) state.snapshots[date].usd = portfolioUsd();
}
function revertEbayPrice(key) {
  const date = todayStr();
  const it = state.items[key];
  if (!it?.ebay) return NO_CHANGE;
  delete it.ebay;
  it.price = it.collectrPrice;
  setHistoryPrice(it, date, it.price);
  if (state.snapshots[date]) state.snapshots[date].usd = portfolioUsd();
}
/* ---------- automatic graded prices (CompSniper, through the local server) ---------- */
const COMPS_REFRESH_DAYS = 7;
const FANATICS_MAX_AGE_DAYS = 365;
const compsUi = { hasKey: false, usedThisMonth: 0, cap: 95, running: false, progress: '' };

class CompsError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
async function loadCompsStatus() {
  const r = await fetch('/api/comps/status');
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  Object.assign(compsUi, await r.json());
}
async function compsFetch(source, keyword) {
  const q = new URLSearchParams({ source, keyword });
  const r = await fetch(`/api/comps/fetch?${q}`, { method: 'POST' });
  const remaining = r.headers.get('X-Usage-Remaining');
  if (remaining !== null) {
    compsUi.remaining = Number(remaining);
    compsUi.limit = Number(r.headers.get('X-Usage-Limit')) || compsUi.limit;
  }
  let body = {};
  try { body = await r.json(); } catch { /* A non-JSON error still has a status. */ }
  if (r.ok) { compsUi.usedThisMonth++; return body.items || []; }
  throw new CompsError(body.code || `http_${r.status}`, body.error || `HTTP ${r.status}`);
}
const compsErrorText = (e) => ({
  no_key: 'לא הוגדר מפתח CompSniper.',
  unauthorized: 'CompSniper לא קיבל את המפתח. בדוק אותו במסך מחירי המדורגים.',
  quota_exceeded: 'המכסה החודשית של CompSniper נגמרה. שאר הקלפים יתעדכנו אחרי האיפוס, בלי עלות.',
  local_cap: 'הגעת לתקרת הבקשות החודשית שהוגדרה באפליקציה. העדכון יימשך בחודש הבא.',
}[e.code] || `עדכון המדורגים נעצר: ${e.message}`);

function ebayApiSale(i, it) {
  const title = String(i.title || '');
  const out = { title, source: 'eBay', ok: false, reason: '', url: /^https:\/\/www\.ebay\.com\/itm\//.test(i.url || '') ? i.url : '' };
  const fail = (reason) => { out.reason = reason; return out; };
  out.price = Number(i.soldPrice);
  out.date = String(i.endedAt || '').slice(0, 10);
  if (i.buyingFormat !== 'auction' || i.bestOfferAccepted) return fail('לא מכירה פומבית');
  if (i.soldCurrency !== 'USD' || !(out.price > 0)) return fail('המחיר אינו בדולרים');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out.date)) return fail('אין תאריך מכירה');
  const problem = titleProblem(title, it);
  if (problem) return fail(problem);
  out.ok = true;
  return out;
}
function fanaticsApiSale(i, it, today = todayStr()) {
  const title = String(i.title || '');
  const out = { title, source: 'Fanatics', ok: false, reason: '', url: /^https:\/\//.test(i.url || '') ? i.url : '' };
  const fail = (reason) => { out.reason = reason; return out; };
  const g = gradeOf(it);
  out.price = Number(i.price);
  out.date = String(i.soldAt || '').slice(0, 10);
  if (String(i.saleType || '').toUpperCase() === 'FIXED') return fail('לא מכירה פומבית');
  if ((i.currency && i.currency !== 'USD') || !(out.price > 0)) return fail('המחיר אינו בדולרים');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out.date)) return fail('אין תאריך מכירה');
  if ((toMs(today) - toMs(out.date)) / 864e5 > FANATICS_MAX_AGE_DAYS) return fail('מכירה ישנה');
  if (String(i.gradingService || '').toUpperCase() !== g.company || Number(i.grade) !== Number(g.value)) return fail(`הדירוג אינו ${g.company} ${g.value}`);
  const problem = titleProblem(title, it, { skipGrade: true });
  if (problem) return fail(problem);
  out.ok = true;
  return out;
}
// eBay auctions first, newest first; Fanatics only fills what eBay could not.
function combineSales(ebaySales, fanaticsSales) {
  const newest = (list) => list.filter((s) => s.ok).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const used = newest(ebaySales).slice(0, EBAY_SALES_USED);
  used.push(...newest(fanaticsSales).slice(0, EBAY_SALES_USED - used.length));
  return { used, value: used.length ? average(used.map((s) => s.price)) : null };
}
function setFewSales(it, sales) {
  it.compsNoSales = !sales.length;
  if (sales.length) it.compsFew = sales.map(({ title, price, date, url, source }) => ({ title, price, date, url, source: source || 'eBay' }));
  else delete it.compsFew;
}
function compsStatusHtml(it) {
  if (it.ebay) return `<button class="tag-btn" type="button" data-ebay-info="${esc(it.key)}">${it.ebay.sales.length} מכירות · ${timeAgo(it.ebay.fetchedAt)}</button>`;
  if (it.compsFew) return `<button class="tag-btn" type="button" data-ebay-info="${esc(it.key)}">רק ${it.compsFew.length} מכירות, לפי Collectr</button>`;
  if (it.compsNoSales) return '<span class="muted">אין מכירות, לפי Collectr</span>';
  return '';
}
function compsIsDue(it, maxAgeDays) {
  if (!it.compsCheckedAt) return true;
  return (Date.now() - new Date(it.compsCheckedAt).getTime()) / 864e5 >= maxAgeDays;
}
function compsDueItems(maxAgeDays) {
  return gradedItems().filter((i) => compsIsDue(i, maxAgeDays)).sort((a, b) => {
    if (!a.compsCheckedAt !== !b.compsCheckedAt) return a.compsCheckedAt ? 1 : -1;
    if (a.compsCheckedAt !== b.compsCheckedAt && a.compsCheckedAt) return a.compsCheckedAt < b.compsCheckedAt ? -1 : 1;
    return b.qty * b.price - a.qty * a.price;
  });
}
function renderCompsProgress() {
  if ($('compsDialog').open) openCompsDialog();
  renderFreshness();
}
async function runCompsUpdate({ maxAgeDays = COMPS_REFRESH_DAYS, limit = Infinity, auto = false } = {}) {
  if (compsUi.running) return;
  await loadCompsStatus();
  if (!compsUi.hasKey || !current.comps) return;
  await saveChain;
  await loadState();
  // Saving a key spends nothing: the weekly schedule starts after the first "update now" click.
  if (auto && !state.meta.compsAutoEnabled) return;
  if (!compsDueItems(maxAgeDays).length) return;
  // One window at a time updates prices, so requests aren't spent twice.
  const locked = await mutate(() => {
    if ((state.meta.compsLockUntil || 0) > Date.now()) return NO_CHANGE;
    state.meta.compsLockUntil = Date.now() + 10 * 60000;
    return true;
  });
  if (!locked) return;
  compsUi.running = true;
  let failures = 0, stopError = null, updated = 0;
  const cards = compsDueItems(maxAgeDays).slice(0, limit);
  try {
    for (let n = 0; n < cards.length; n++) {
      const it = cards[n];
      compsUi.progress = `מעדכן ${n + 1} מתוך ${cards.length}: ${it.name}`;
      renderCompsProgress();
      const query = ebayQuery(it);
      try {
        const ebayRaw = await compsFetch('ebay', `${query} -lot -proxy -custom`);
        let ebaySales = ebayRaw.map((i) => ebayApiSale(i, it));
        // Every sale of this exact card and number is Japanese: the card itself is Japanese.
        let learnedJapanese = false;
        if (!isJapaneseItem(it) && !ebaySales.some((s) => s.ok)) {
          const asJapanese = ebayRaw.map((i) => ebayApiSale(i, { ...it, japanese: true }));
          if (asJapanese.some((s) => s.ok)) { ebaySales = asJapanese; learnedJapanese = true; it.japanese = true; }
        }
        let fanaticsSales = [];
        const needMore = ebaySales.filter((s) => s.ok).length < EBAY_SALES_USED;
        const cardsLeft = cards.length - n - 1;
        // Fill from Fanatics only while the month's requests can still cover the remaining cards.
        const canAskFanatics = compsUi.remaining === undefined || compsUi.remaining > cardsLeft + 3;
        if (needMore && canAskFanatics) {
          fanaticsSales = (await compsFetch('fanatics', fanaticsQuery(it))).map((i) => fanaticsApiSale(i, it));
        }
        const result = combineSales(ebaySales, fanaticsSales);
        const enough = result.used.length >= EBAY_SALES_USED;
        await mutate(() => {
          const cur = state.items[it.key];
          if (!cur) return NO_CHANGE;
          cur.compsCheckedAt = new Date().toISOString();
          if (learnedJapanese) cur.japanese = true;
          state.meta.compsLockUntil = Date.now() + 10 * 60000;
          if (enough) {
            delete cur.compsNoSales;
            delete cur.compsFew;
            applyEbayPrice(it.key, result, query);
          } else if (!(needMore && !canAskFanatics && cur.ebay)) {
            // Too few sales to trust: Collectr prices it. A card only short on this month's
            // requests keeps its last good value instead (the condition above).
            revertEbayPrice(it.key);
            setFewSales(cur, result.used);
          }
        });
        if (enough) updated++;
        failures = 0;
        render();
      } catch (e) {
        if (['no_key', 'unauthorized', 'quota_exceeded', 'local_cap'].includes(e.code)) { stopError = e; break; }
        failures++;
        if (failures >= 3) { stopError = e; break; }
      }
    }
  } finally {
    compsUi.running = false;
    compsUi.progress = '';
    await mutate(() => {
      state.meta.compsLockUntil = 0;
      state.meta.compsError = stopError ? compsErrorText(stopError) : null;
      state.meta.compsLastRun = new Date().toISOString();
      if (compsUi.remaining !== undefined) state.meta.compsUsage = { remaining: compsUi.remaining, limit: compsUi.limit };
    }).catch(() => {});
    await loadCompsStatus().catch(() => {});
    render();
    renderCompsProgress();
  }
  if (updated) toast(`עודכנו ${updated} קלפים מדורגים לפי מכירות אחרונות`);
}
function openCompsDialog() {
  const dlg = $('compsDialog');
  const graded = gradedItems().sort((a, b) => b.qty * b.price - a.qty * a.price);
  const usage = state.meta.compsUsage;
  const dueToday = compsDueItems(1).length;
  const rows = graded.map((i) => {
    const gap = i.ebay && i.collectrPrice > 0 ? (i.ebay.value - i.collectrPrice) / i.collectrPrice : 0;
    const big = Math.abs(gap) > 0.5 ? '<span class="tag warn-tag">פער גדול</span>' : '';
    const status = compsStatusHtml(i) || '<span class="muted">טרם עודכן</span>';
    return `<tr><td>${esc(i.name)} <span class="muted">${esc(gradeText(i))}</span>${big}</td>
      <td>${i.ebay ? usd(i.ebay.value) : '—'}</td><td>${usd(i.collectrPrice ?? i.price)}</td><td>${status}</td></tr>`;
  }).join('');
  const keyForm = `<form id="compsKeyForm" class="key-form">
      <label class="field">מפתח API של CompSniper
        <input type="password" name="key" autocomplete="off" spellcheck="false" dir="ltr" placeholder="${compsUi.hasKey ? 'להחלפת המפתח השמור' : 'cs_live_...'}" required>
      </label>
      <button class="btn${compsUi.hasKey ? '' : ' primary'}" type="submit">שמירת מפתח</button>
    </form>`;
  dlg.innerHTML = `
    <h3 style="font-size:17px;font-weight:650">מחירי קלפים מדורגים</h3>
    <p class="muted" style="margin-top:4px">הערך הוא ממוצע 5 המכירות הפומביות האחרונות ב-eBay, עם השלמה מ-Fanatics כשאין מספיק. אם גם אז יש פחות מ-5, הקלף נשאר לפי Collectr. העדכון רץ פעם בשבוע כשהאפליקציה פתוחה.</p>
    ${compsUi.hasKey ? `
      <label class="check-row"><input type="checkbox" id="compsPortfolioToggle" ${current.comps ? 'checked' : ''}> עדכון מחירי מדורגים בתיק <b>${esc(current.name)}</b></label>
      <p class="muted">המכסה החודשית משותפת לכל התיקים: כל קלף מדורג צורך בקשה אחת בשבוע${graded.length ? `, ובתיק הזה יש ${graded.length}` : ''}. כשהעדכון כבוי, הקלפים בתיק מתומחרים לפי Collectr.</p>
    ` : ''}
    ${compsUi.hasKey ? `
      <div class="preview">
        <div class="row"><span>בקשות שהאפליקציה שלחה החודש</span><b><span class="num">${compsUi.usedThisMonth} / ${compsUi.cap}</span></b></div>
        ${usage ? `<div class="row"><span>נשארו לפי CompSniper</span><b><span class="num">${usage.remaining} / ${usage.limit}</span></b></div>` : ''}
        ${state.meta.compsLastRun ? `<div class="row"><span>עדכון אחרון</span><b>${timeAgo(state.meta.compsLastRun)}</b></div>` : ''}
      </div>
      ${compsUi.running ? `<p class="muted" style="margin-top:8px">${esc(compsUi.progress)}</p>` : ''}
      ${state.meta.compsError ? `<p class="warn-line">${esc(state.meta.compsError)}</p>` : ''}
    ` : `
      <ol class="steps">
        <li>נרשמים ל-<a href="https://compsniper.com/pricing" target="_blank" rel="noopener noreferrer">CompSniper</a> במסלול <b>Basic</b> בחינם. <b>לא מזינים אמצעי תשלום.</b></li>
        <li>מעתיקים את מפתח ה-API מהחשבון ומדביקים כאן. הוא נשמר רק במחשב הזה.</li>
      </ol>`}
    ${keyForm}
    <p id="compsError" class="error" hidden></p>
    ${graded.length ? `<div class="scroll comps-table"><table><thead><tr><th>קלף</th><th>ממוצע מכירות</th><th>Collectr</th><th>סטטוס</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}
    <div class="dialog-actions" style="flex-wrap:wrap">
      ${compsUi.hasKey && current.comps ? `<button class="btn primary" type="button" data-comps-run ${compsUi.running || !dueToday ? 'disabled' : ''}>${dueToday ? `עדכון עכשיו (${dueToday} קלפים)` : 'הכול עודכן היום'}</button>` : ''}
      ${compsUi.hasKey ? '<button class="btn" type="button" data-comps-remove>הסרת המפתח</button>' : ''}
      <button class="btn" type="button" data-close>סגירה</button>
    </div>`;
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.querySelector('#compsKeyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await fetch('/api/comps/key', { method: 'PUT', body: e.target.elements.key.value });
    if (!r.ok) {
      const p = dlg.querySelector('#compsError');
      p.textContent = 'המפתח לא נראה תקין. העתק אותו שוב מהחשבון ב-CompSniper.';
      p.hidden = false;
      return;
    }
    await mutate(() => { state.meta.compsError = null; }).catch(() => {});
    await loadCompsStatus();
    toast('המפתח נשמר');
    render();
    openCompsDialog();
  });
  dlg.querySelector('[data-comps-run]')?.addEventListener('click', async () => {
    try {
      await mutate(() => { state.meta.compsAutoEnabled = true; });
      await runCompsUpdate({ maxAgeDays: 1 });
    } catch (e) { toast(`העדכון נכשל: ${e.message}`); }
  });
  dlg.querySelector('#compsPortfolioToggle')?.addEventListener('change', async (e) => {
    const on = e.target.checked;
    if (compsUi.running) { e.target.checked = !on; toast('עדכון מחירים רץ כרגע, נסה שוב בסיומו'); return; }
    try {
      if (!on) {
        // Turned off: no more updates, so the old sale prices would only go stale.
        await mutate(() => {
          for (const i of Object.values(state.items)) {
            if (i.ebay) revertEbayPrice(i.key);
            delete i.compsFew; delete i.compsNoSales; delete i.compsCheckedAt;
          }
        });
      }
      await savePortfolios(portfolios.map((p) => (p.id === current.id ? { ...p, comps: on } : p)));
    } catch (err) { toast(`השמירה נכשלה: ${err.message}`); }
    render();
    openCompsDialog();
  });
  dlg.querySelector('[data-comps-remove]')?.addEventListener('click', async () => {
    await fetch('/api/comps/key', { method: 'DELETE' });
    await loadCompsStatus();
    render();
    openCompsDialog();
  });
  if (!dlg.open) dlg.showModal();
}

// Next card to update: never-priced first by value, then the oldest update.
function nextEbayItem(afterKey) {
  return gradedItems().filter((i) => i.key !== afterKey).sort((a, b) => {
    if (!a.ebay !== !b.ebay) return a.ebay ? 1 : -1;
    if (!a.ebay) return b.qty * b.price - a.qty * a.price;
    return a.ebay.fetchedAt < b.ebay.fetchedAt ? -1 : 1;
  })[0] || null;
}
function openEbaySearch(it) {
  const w = window.open(ebayUrl(it), 'ebay-search');
  try { if (w) w.opener = null; } catch { /* the search still opened */ }
  toast(`נפתח חיפוש ל-${it.name}. בסיום הטעינה לוחצים שם על הסימניה.`);
}
function ebayBookmarkHtml() {
  return '<a class="bookmarklet" data-ebay-bookmark href="#" draggable="true">קריאת מכירות eBay</a>';
}
function armEbayBookmark(root) {
  root.querySelectorAll('[data-ebay-bookmark]').forEach((link) => {
    link.setAttribute('href', ebayBookmarkletCode());
    link.addEventListener('click', (e) => { e.preventDefault(); toast('יש לגרור את הכפתור לסרגל הסימניות'); });
  });
}
function openEbayFromRow(key) {
  const it = state.items[key];
  if (!it) return;
  if (Object.values(state.items).some((i) => i.ebay)) { openEbaySearch(it); return; }
  const dlg = $('ebayDialog');
  dlg.innerHTML = `
    <h3 style="font-size:17px;font-weight:650">מחירי קלפים מדורגים מ-eBay</h3>
    <p class="muted" style="margin-top:4px">השווי נקבע לפי הממוצע של 5 המכירות הפומביות האחרונות. בדרך הזו הקריאה נעשית מהדף שאתה פותח ב-Chrome.</p>
    <ol class="steps">
      <li><b>פעם אחת בלבד:</b> גרור את הכפתור הזה לסרגל הסימניות.<br>${ebayBookmarkHtml()}</li>
      <li>פתח את החיפוש של הקלף והמתן לטעינה.<br>
        <button class="btn small" type="button" data-open-search style="margin-top:4px">פתיחת החיפוש של ${esc(it.name)}</button></li>
      <li>לחץ על הסימניה. האפליקציה תראה אילו מכירות נכללו, ושום דבר לא נשמר לפני אישור שלך.</li>
    </ol>
    <div class="dialog-actions"><button class="btn" type="button" data-close>סגירה</button></div>`;
  armEbayBookmark(dlg);
  dlg.querySelector('[data-open-search]').addEventListener('click', () => openEbaySearch(it));
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  if (!dlg.open) dlg.showModal();
}
function salesRowsHtml(sales) {
  return sales.map((s) => `<div class="sale"><span class="sale-title">${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>` : esc(s.title)}</span><span class="sale-meta">${esc(s.source || 'eBay')} · ${fmtDate(s.date)} · <b>${usd(s.price)}</b></span></div>`).join('');
}
function openEbayReview(payload, selectedKey) {
  const dlg = $('ebayDialog');
  const graded = gradedItems().sort((a, b) => a.name.localeCompare(b.name));
  const it = (selectedKey && state.items[selectedKey]) || itemForEbayUrl(payload.url);
  const options = graded.map((i) => `<option value="${esc(i.key)}" ${it && i.key === it.key ? 'selected' : ''}>${esc(i.name)} · ${esc(i.number)} · ${esc(gradeText(i))}</option>`).join('');
  const select = `<label class="field">קלף<select id="ebayItem"><option value="">בחר קלף</option>${options}</select></label>`;
  const validSearch = isEbayAuctionSearch(payload.url);
  const res = it && validSearch ? evaluateEbay(payload.rows || [], it) : null;
  let body = '';
  if (!validSearch) {
    body = '<p class="warn-line">הדף הזה אינו חיפוש של מכירות פומביות שהסתיימו, ולכן לא נקרא ממנו מחיר. יש לפתוח את החיפוש מכפתור eBay באפליקציה.</p>';
  } else if (!it) {
    body = '<p class="warn-line">לא זיהיתי לאיזה קלף שייך החיפוש. בחר קלף מהרשימה.</p>';
  } else if (!(payload.rows || []).length) {
    body = '<p class="warn-line">לא נקראו תוצאות מהדף. ייתכן ש-eBay שינה את מבנה הדף, או שאין תוצאות לחיפוש הזה.</p>';
  } else if (!res.used.length) {
    body = `<p class="warn-line">לא נמצאה מכירה שתואמת בדיוק לקלף ולדירוג, והמחיר הנוכחי נשאר (${usd(it.price)}).</p>`;
  } else {
    body = res.used.length < EBAY_SALES_USED
      ? `<p class="warn-line">נמצאו רק ${res.used.length} מכירות מתאימות, פחות מ-5, ולכן הקלף נשאר לפי המחיר הנוכחי (${usd(it.price)}).</p>
        <h4 class="sales-head">המכירות שנמצאו</h4>${salesRowsHtml(res.used)}`
      : `<div class="preview">
        <div class="row"><span>ממוצע של ${res.used.length} המכירות האחרונות</span><b>${usd(res.value)}</b></div>
        <div class="row"><span>${it.ebay ? 'מחיר מכירות קודם' : 'מחיר Collectr'}</span><b>${usd(it.price)}</b></div>
      </div>
      <h4 class="sales-head">המכירות שנכללו</h4>${salesRowsHtml(res.used)}`;
  }
  const rejected = res && res.rejected.length
    ? `<details class="chart-table"><summary>${res.rejected.length} תוצאות לא נכללו</summary><div class="scroll">${res.rejected.map((r) => `<div class="sale"><span class="sale-title">${esc(r.title)}</span><span class="sale-meta">${esc(r.reason)}</span></div>`).join('')}</div></details>`
    : '';
  const next = it ? nextEbayItem(it.key) : null;
  dlg.innerHTML = `
    <h3 style="font-size:17px;font-weight:650;margin-bottom:10px">מכירות פומביות מ-eBay</h3>
    ${select}
    <div style="margin-top:10px">${body}</div>
    ${rejected}
    <p id="ebayError" class="error" hidden></p>
    <div class="dialog-actions" style="flex-wrap:wrap">
      ${res && res.used.length >= EBAY_SALES_USED ? `${next ? '<button class="btn primary" type="button" data-save-next>שמירה ולקלף הבא</button>' : ''}<button class="btn${next ? '' : ' primary'}" type="button" data-save>שמירה</button>` : ''}
      ${it?.ebay ? '<button class="btn" type="button" data-revert>חזרה למחיר Collectr</button>' : ''}
      <button class="btn" type="button" data-close>סגירה</button>
    </div>`;
  dlg.querySelector('#ebayItem').addEventListener('change', (e) => openEbayReview(payload, e.target.value));
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  const fail = (e) => { const p = dlg.querySelector('#ebayError'); p.textContent = `השמירה נכשלה: ${e.message}`; p.hidden = false; };
  const saveThen = async (after) => {
    try {
      await mutate(() => applyEbayPrice(it.key, res, ebayQuery(it)));
    } catch (e) { fail(e); return; }
    dlg.close();
    render();
    toast(`${it.name}: ${money('$', res.value, 2)} לפי ${res.used.length} מכירות`);
    if (after) after();
  };
  dlg.querySelector('[data-save]')?.addEventListener('click', () => saveThen());
  // The search opens right away, inside the click, so the browser doesn't treat it as an unwanted popup.
  dlg.querySelector('[data-save-next]')?.addEventListener('click', () => { openEbaySearch(next); saveThen(); });
  dlg.querySelector('[data-revert]')?.addEventListener('click', async () => {
    try {
      await mutate(() => revertEbayPrice(it.key));
    } catch (e) { fail(e); return; }
    dlg.close();
    render();
    toast(`${it.name} חזר למחיר של Collectr`);
  });
  if (!dlg.open) dlg.showModal();
}
function openEbayCardInfo(key) {
  const it = state.items[key];
  const dlg = $('ebayDialog');
  if (!it.ebay) {
    dlg.innerHTML = `
      <h3 style="font-size:17px;font-weight:650">${esc(it.name)} · ${esc(gradeText(it))}</h3>
      <p class="muted" style="margin-top:4px">נמצאו רק ${(it.compsFew || []).length} מכירות מתאימות, פחות מ-5, ולכן הקלף מתומחר לפי Collectr (${usd(it.price)}). הוא ייבדק שוב בעדכון הבא.</p>
      <h4 class="sales-head">המכירות שנמצאו (לא נספרו)</h4>${salesRowsHtml(it.compsFew || [])}
      <div class="dialog-actions"><button class="btn" type="button" data-close>סגירה</button></div>`;
    dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
    if (!dlg.open) dlg.showModal();
    return;
  }
  dlg.innerHTML = `
    <h3 style="font-size:17px;font-weight:650">${esc(it.name)} · ${esc(gradeText(it))}</h3>
    <p class="muted" style="margin-top:4px">עודכן ${timeAgo(it.ebay.fetchedAt)}. ממוצע מכירות ${usd(it.ebay.value)}, מחיר Collectr ${usd(it.collectrPrice)}.${compsUi.hasKey ? ' חזרה למחיר Collectr תחזיק עד העדכון האוטומטי הבא.' : ''}</p>
    <h4 class="sales-head">המכירות שנכללו</h4>${salesRowsHtml(it.ebay.sales)}
    <div class="dialog-actions" style="flex-wrap:wrap">
      <button class="btn primary" type="button" data-open-search>עדכון מ-eBay</button>
      <button class="btn" type="button" data-revert>חזרה למחיר Collectr</button>
      <button class="btn" type="button" data-close>סגירה</button>
    </div>`;
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.querySelector('[data-open-search]').addEventListener('click', () => { dlg.close(); openEbaySearch(it); });
  dlg.querySelector('[data-revert]').addEventListener('click', async () => {
    try { await mutate(() => revertEbayPrice(key)); } catch (e) { toast(`השמירה נכשלה: ${e.message}`); return; }
    dlg.close();
    render();
  });
  if (!dlg.open) dlg.showModal();
}
function ebayBookmarkletCode() {
  // Reads only what is already on the page the user opened. The filtering lives in the app.
  const code = `(()=>{
const S='${location.origin}';
if(!/^https:\\/\\/www\\.ebay\\.com\\/sch\\//.test(location.href)){alert('יש ללחוץ על הסימניה בדף חיפוש של eBay שנפתח מהאפליקציה.');return}
const w=window.open(S+'/','portfolio-tracker');
if(!w){alert('הדפדפן חסם את פתיחת האפליקציה. יש לאשר חלונות קופצים מהאתר הזה ולנסות שוב.');return}
const T=(l,q)=>{const e=l.querySelector(q);return e?e.innerText.trim():''};
const rows=[...document.querySelectorAll('li.s-card,li.s-item')].map(l=>{const a=l.querySelector('a[href*="/itm/"]');return a?{url:a.href.split('?')[0],title:T(l,'.s-card__title,.s-item__title').split('\\n')[0],price:T(l,'.s-card__price,.s-item__price'),text:l.innerText.slice(0,800)}:null}).filter(Boolean);
const D={sentAt:new Date().toISOString(),url:location.href,rows};
const b=document.createElement('div');
b.style='position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;background:#111;color:#fff;padding:10px 18px;border-radius:10px;font:15px system-ui;direction:rtl';
b.textContent='נקראו '+rows.length+' תוצאות, שולח לאפליקציה…';document.body.append(b);
let i,t;const done=()=>{clearInterval(i);clearTimeout(t);removeEventListener('message',h)};
const h=e=>{if(e.origin===S&&e.data&&e.data.type==='ebay-sales-ack'&&e.data.sentAt===D.sentAt){done();b.textContent='✓ נשלח לאפליקציה';setTimeout(()=>b.remove(),3000)}};
addEventListener('message',h);
i=setInterval(()=>w.postMessage({type:'ebay-sales',payload:D},S),700);
t=setTimeout(()=>{done();b.style.background='#b92f2f';b.textContent='האפליקציה לא ענתה. האם היא פועלת?';setTimeout(()=>b.remove(),9000)},20000)
})()`;
  return `javascript:${encodeURIComponent(code.replace(/\n/g, ''))}`;
}

/* ---------- calculations ---------- */
function purchaseCalc(p, rNow) {
  const it = state.items[p.key];
  const price = it ? it.price : 0;
  const costUsd = p.currency === 'USD' ? p.amount : p.amount / p.rate;
  const costIls = p.currency === 'USD' ? p.amount * p.rate : p.amount;
  const valueUsd = p.qty * price;
  const valueIls = valueUsd * rNow;
  return {
    costUsd, costIls, valueUsd, valueIls,
    pnlIls: valueIls - costIls,
    // value - cost = (valueUsd - costUsd) * rNow + costUsd * (rNow - rateAtPurchase)
    marketEffect: (valueUsd - costUsd) * rNow,
    fxEffect: costUsd * (rNow - p.rate),
  };
}
function totals() {
  const r = currentRate()?.rate;
  const t = { costIls: 0, costUsd: 0, valueIls: 0, valueUsd: 0, pnlIls: 0, marketEffect: 0, fxEffect: 0, count: 0 };
  if (!r) return t;
  for (const p of state.purchases) {
    const c = purchaseCalc(p, r);
    for (const k of ['costIls', 'costUsd', 'valueIls', 'valueUsd', 'pnlIls', 'marketEffect', 'fxEffect']) t[k] += c[k];
    t.count++;
  }
  return t;
}
function itemPurchases(key) { return state.purchases.filter((p) => p.key === key); }
function itemRow(it) {
  const r = currentRate()?.rate || 0;
  const ps = itemPurchases(it.key);
  const row = { it, ps, boughtQty: 0, costIls: 0, costUsd: 0, pnlIls: 0, avgRate: null };
  for (const p of ps) {
    const c = purchaseCalc(p, r);
    row.boughtQty += p.qty; row.costIls += c.costIls; row.costUsd += c.costUsd; row.pnlIls += c.pnlIls;
  }
  if (row.costUsd > 0) row.avgRate = row.costIls / row.costUsd;
  row.valueIls = it.qty * it.price * r;
  row.pnlPct = row.costIls > 0 ? (row.pnlIls / row.costIls) * 100 : null;
  return row;
}
function latestSnapshot() {
  const dates = Object.keys(state.snapshots).sort();
  return dates.length ? { date: dates[dates.length - 1], ...state.snapshots[dates[dates.length - 1]] } : null;
}
function priceOn(it, date) {
  let price = it.history[0]?.[1] ?? it.price;
  for (const [d, v] of it.history) { if (d <= date) price = v; else break; }
  return price;
}

/* ---------- rendering: header + KPIs ---------- */
/* ---------- portfolios ---------- */
async function loadPortfolios() {
  const r = await fetch('/api/portfolios');
  const list = r.ok ? await r.json().catch(() => []) : [];
  if (Array.isArray(list) && list.length) portfolios = list;
  else await savePortfolios([DEFAULT_PORTFOLIO]);
  let saved = null;
  try { saved = localStorage.getItem('portfolio'); } catch { /* storage may be blocked */ }
  current = portfolios.find((p) => p.id === saved) || portfolios[0];
}
async function savePortfolios(list) {
  const r = await fetch('/api/portfolios', { method: 'PUT', body: JSON.stringify(list) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  portfolios = list;
  current = portfolios.find((p) => p.id === current.id) || portfolios[0];
  renderPortfolioPicker();
}
function renderPortfolioPicker() {
  $('portfolioSelect').innerHTML = portfolios.map((p) => `<option value="${esc(p.id)}" ${p.id === current.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  $('tableTitle').textContent = `המוצרים בתיק ${current.name}`;
  document.title = portfolios.length > 1 ? `${current.name} · מעקב תיק קלפים` : 'מעקב תיק קלפים';
}
async function switchPortfolio(id) {
  if (id === current.id) return;
  if (compsUi.running) {
    toast('עדכון מחירי מדורגים רץ כרגע, אפשר לעבור תיק בסיומו');
    renderPortfolioPicker();
    return;
  }
  await saveChain;
  current = portfolios.find((p) => p.id === id) || portfolios[0];
  try { localStorage.setItem('portfolio', current.id); } catch { /* only a convenience */ }
  ui.quickUnsupported = false;
  ui.quickError = null;
  state = emptyState();
  renderPortfolioPicker();
  await loadState();
  render();
  await checkForSync();
  await refreshAll(false);
  runCompsUpdate({ auto: true }).catch(() => {});
}
function parseProfileLink(text) {
  const m = String(text || '').trim().match(/showcase\/profile\/@?([A-Za-z0-9_.-]{1,40})/i)
    || String(text || '').trim().match(/^@?([A-Za-z0-9_.-]{1,40})$/);
  return m ? m[1] : null;
}
function openPortfoliosDialog(found) {
  const dlg = $('portfoliosDialog');
  const rows = portfolios.map((p) => `
    <div class="portfolio-row">
      <input type="text" value="${esc(p.name)}" maxlength="60" data-rename="${esc(p.id)}" aria-label="שם התיק">
      <span class="muted"><bdi dir="ltr">@${esc(p.handle)}</bdi> · ${esc(p.collectionName)}${p.id === current.id ? ' · פתוח עכשיו' : ''}</span>
      ${portfolios.length > 1 ? `<button class="btn small ghost" type="button" data-remove-portfolio="${esc(p.id)}">הסרה</button>` : ''}
    </div>`).join('');
  const pick = found ? `
    <div class="add-step">
      <p>נמצא הפרופיל של <b>${esc(found.user)}</b>. איזה תיק לעקוב?</p>
      <label class="field">תיק<select id="newCollection">${found.collections.map((c) => {
        const taken = portfolios.some((p) => p.handle.toLowerCase() === found.handle.toLowerCase() && p.collectionId === c.id);
        return `<option value="${esc(c.id)}" ${taken ? 'disabled' : ''}>${esc(c.name)}${c.default ? ' (ראשי)' : ''}${taken ? ' · כבר במעקב' : ''}</option>`;
      }).join('')}</select></label>
      <label class="field">שם במעקב<input type="text" id="newName" maxlength="60"></label>
      <div class="dialog-actions"><button class="btn primary" type="button" data-add-portfolio>הוספת התיק</button></div>
    </div>` : '';
  dlg.innerHTML = `
    <h3 style="font-size:17px;font-weight:650">התיקים במעקב</h3>
    <p class="muted" style="margin-top:4px">לכל תיק נשמרים בנפרד המוצרים, הרכישות וההיסטוריה. שינוי שם נשמר כשיוצאים מהשדה.</p>
    <div class="portfolio-list">${rows}</div>
    <h4 class="sales-head">הוספת תיק</h4>
    <form id="addPortfolioForm" class="key-form">
      <label class="field">קישור לפרופיל ב-Collectr
        <input type="text" name="link" dir="ltr" placeholder="https://app.getcollectr.com/showcase/profile/@..." value="${found ? esc(profileUrl(found)) : ''}" required>
      </label>
      <button class="btn" type="submit">בדיקת הקישור</button>
    </form>
    <p id="portfolioError" class="error" hidden></p>
    ${pick}
    <div class="dialog-actions"><button class="btn" type="button" data-close>סגירה</button></div>`;
  const fail = (m) => { const p = dlg.querySelector('#portfolioError'); p.textContent = m; p.hidden = false; };
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.querySelectorAll('[data-rename]').forEach((input) => input.addEventListener('change', async () => {
    const name = input.value.trim();
    if (!name) { input.value = portfolios.find((p) => p.id === input.dataset.rename).name; return; }
    try {
      await savePortfolios(portfolios.map((p) => (p.id === input.dataset.rename ? { ...p, name } : p)));
      toast('השם נשמר');
    } catch (e) { fail(`השמירה נכשלה: ${e.message}`); }
  }));
  dlg.querySelectorAll('[data-remove-portfolio]').forEach((b) => b.addEventListener('click', async () => {
    const p = portfolios.find((x) => x.id === b.dataset.removePortfolio);
    if (!confirm(`להסיר את "${p.name}" מהמעקב? הנתונים שלו נשארים שמורים במחשב, אבל הוא לא יופיע באפליקציה.`)) return;
    try {
      const rest = portfolios.filter((x) => x.id !== p.id);
      if (p.id === current.id) await switchPortfolio(rest[0].id);
      await savePortfolios(rest);
      openPortfoliosDialog();
    } catch (e) { fail(`ההסרה נכשלה: ${e.message}`); }
  }));
  dlg.querySelector('#addPortfolioForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const handle = parseProfileLink(e.target.elements.link.value);
    if (!handle) { fail('זה לא נראה קישור לפרופיל ב-Collectr. הקישור צריך להכיל showcase/profile/@'); return; }
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    try {
      const data = await fetchProfilePage(handle);
      const collections = (data.collections || []).filter((c) => c.id && c.name);
      if (!collections.length) throw new Error('לא נמצאו תיקים בפרופיל');
      openPortfoliosDialog({ handle: data.handle || handle, user: data.user || handle, collections });
    } catch (err) {
      fail(`לא הצלחתי לקרוא את הפרופיל. ודא שהקישור נכון ושהתיק מוצג לציבור ב-Collectr. (${err.message})`);
    } finally { btn.disabled = false; }
  });
  if (found) {
    const select = dlg.querySelector('#newCollection');
    const nameInput = dlg.querySelector('#newName');
    const firstFree = [...select.options].find((o) => !o.disabled);
    if (firstFree) select.value = firstFree.value;
    const suggest = () => { const c = found.collections.find((x) => x.id === select.value); nameInput.value = c ? `${c.name} · ${found.user}` : ''; };
    suggest();
    select.addEventListener('change', suggest);
    dlg.querySelector('[data-add-portfolio]').addEventListener('click', async () => {
      const c = found.collections.find((x) => x.id === select.value);
      if (!c || select.selectedOptions[0]?.disabled) { fail('התיק הזה כבר במעקב. בחר תיק אחר.'); return; }
      const p = {
        id: `p${Date.now().toString(36)}`, name: nameInput.value.trim() || `${c.name} · ${found.user}`,
        handle: found.handle, collectionId: c.id, collectionName: c.name, comps: false,
      };
      try {
        await savePortfolios([...portfolios, p]);
        dlg.close();
        await switchPortfolio(p.id);
        openSyncDialog();
      } catch (err) { fail(`ההוספה נכשלה: ${err.message}`); }
    });
  }
  if (!dlg.open) dlg.showModal();
}

function render() {
  renderFreshness();
  renderBanners();
  renderKpis();
  renderValueChart();
  renderEffectChart();
  renderFxChart();
  renderTable();
}
function renderFreshness() {
  const parts = [];
  if (state.meta.lastFull) parts.push(`סנכרון מלא ${timeAgo(state.meta.lastFull)}`);
  if (ui.quickUnsupported) parts.push('בדיקה מהירה זמינה רק לתיק הראשי של הפרופיל');
  else if (state.meta.lastQuick) parts.push(`בדיקה מהירה ${timeAgo(state.meta.lastQuick)}`);
  const graded = gradedItems();
  if (compsUi.running) parts.push(compsUi.progress);
  else if (graded.length && current.comps && compsUi.hasKey) parts.push(`מדורגים לפי מכירות: ${graded.filter((i) => i.ebay).length}/${graded.length}`);
  $('freshness').textContent = parts.join(' · ') || 'ממתין לסנכרון ראשון';
}
function renderBanners() {
  const out = [];
  if (!state.meta.lastFull) {
    out.push(`<div class="banner"><span>כדי לטעון את כל המוצרים מהתיק ${esc(current.name)} צריך סנכרון ראשון.</span><button class="btn small" type="button" data-open-sync>איך מסנכרנים</button></div>`);
  }
  if (state.meta.changed) {
    out.push(`<div class="banner"><span>התיק ב-Collectr השתנה מאז הסנכרון האחרון. סנכרון מלא יעדכן את כל המוצרים.</span><button class="btn small" type="button" data-open-sync>סנכרון מלא</button></div>`);
  }
  const fresh = Object.values(state.items).filter((i) => i.isNew && !i.removed && !itemPurchases(i.key).length).length;
  if (fresh) {
    out.push(`<div class="banner"><span>${fresh === 1 ? 'מוצר חדש אחד ממתין' : `${fresh} מוצרים חדשים ממתינים`} להזנת סכום קנייה.</span><button class="btn small" type="button" data-show-new>הצג</button></div>`);
  }
  if (state.meta.warning) out.push(`<div class="banner"><span>${esc(state.meta.warning)}</span></div>`);
  if (ui.fxError) out.push(`<div class="banner"><span>לא הצלחתי לטעון שערים מבנק ישראל: ${esc(ui.fxError)}</span></div>`);
  if (ui.quickError) out.push(`<div class="banner"><span>הבדיקה המהירה נכשלה: ${esc(ui.quickError)}</span></div>`);
  if (state.meta.compsError) out.push(`<div class="banner"><span>${esc(state.meta.compsError)}</span><button class="btn small" type="button" data-open-comps>פרטים</button></div>`);
  $('banners').innerHTML = out.join('');
}
function renderKpis() {
  const r = currentRate();
  const snap = latestSnapshot();
  const t = totals();
  const items = Object.values(state.items).filter((i) => !i.removed);
  const entered = items.filter((i) => itemPurchases(i.key).length).length;
  const pnlPct = t.costIls > 0 ? (t.pnlIls / t.costIls) * 100 : null;
  const avgRate = t.costUsd > 0 ? t.costIls / t.costUsd : null;
  const kpi = (label, value, sub) => `<div class="kpi"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-sub">${sub}</div></div>`;
  $('kpis').innerHTML = [
    kpi('שווי כל התיק היום',
      snap && r ? ils(snap.usd * r.rate) : '—',
      snap ? `${usd(snap.usd)} לפי Collectr${snap.qty ? ` · ${nf0.format(snap.qty)} פריטים` : ''}` : 'ממתין לנתונים'),
    kpi('שילמת על מוצרים שהוזנו',
      t.count ? ils(t.costIls) : '—',
      t.count ? `≈ ${usd(t.costUsd)} לפי שער יום הקנייה · שווים היום ${ils(t.valueIls)}` : `הוזנו ${entered} מתוך ${items.length} מוצרים`),
    kpi('רווח או הפסד',
      t.count ? delta(signedIls(t.pnlIls), t.pnlIls) : '—',
      t.count ? `${pct(pnlPct)} על ${entered} מתוך ${items.length} מוצרים שהוזנו` : 'יוצג אחרי הזנת סכום קנייה'),
    kpi('שער דולר יציג',
      r ? rateFmt(r.rate) : '—',
      r ? `${fmtDate(r.date)}${avgRate ? ` · שער קנייה ממוצע ${rateFmt(avgRate)}` : ''}` : 'טוען מבנק ישראל'),
  ].join('');
}

/* ---------- charts ---------- */
const svgNS = 'http://www.w3.org/2000/svg';
const toMs = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
function niceTicks(min, max, count = 4) {
  if (min === max) { const pad = Math.abs(min) * 0.1 || 1; min -= pad; max += pad; }
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return { lo, hi, ticks };
}
function showTooltip(html, x, y) {
  const t = $('tooltip');
  t.innerHTML = html;
  t.hidden = false;
  const b = t.getBoundingClientRect();
  t.style.left = `${Math.max(8, Math.min(x + 14, innerWidth - b.width - 8))}px`;
  t.style.top = `${Math.max(8, Math.min(y - b.height - 12, innerHeight - b.height - 8))}px`;
}
const hideTooltip = () => { $('tooltip').hidden = true; };

/**
 * One-axis time-series line chart.
 * series: [{ name, color, points: [[date, value], ...] }]; markers: [{ date, value, html }]
 */
function lineChart(el, { series, fmtAxis, fmtTip, markers = [], tableLabel, tableRows = 30 }) {
  const width = Math.max(280, el.clientWidth || 600);
  const height = 240;
  const m = { top: 12, right: 14, bottom: 26, left: 58 };
  const all = series.flatMap((s) => s.points);
  const xs = all.map((p) => toMs(p[0]));
  let xMin = Math.min(...xs), xMax = Math.max(...xs);
  if (xMin === xMax) { xMin -= 864e5 * 7; xMax += 864e5 * 7; }
  const { lo, hi, ticks } = niceTicks(Math.min(...all.map((p) => p[1])), Math.max(...all.map((p) => p[1])));
  const X = (d) => m.left + ((toMs(d) - xMin) / (xMax - xMin)) * (width - m.left - m.right);
  const Y = (v) => m.top + (1 - (v - lo) / (hi - lo)) * (height - m.top - m.bottom);

  const dates = [...new Set(all.map((p) => p[0]))].sort();
  const xTickCount = Math.min(dates.length, Math.floor(width / 110));
  const xTicks = [];
  for (let i = 0; i < xTickCount; i++) {
    xTicks.push(dates[xTickCount === 1 ? 0 : Math.round((i * (dates.length - 1)) / (xTickCount - 1))]);
  }
  let s = `<svg xmlns="${svgNS}" viewBox="0 0 ${width} ${height}" height="${height}" tabindex="0" role="img" aria-label="${esc(tableLabel)}" dir="ltr">`;
  for (const t of ticks) {
    s += `<line x1="${m.left}" x2="${width - m.right}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--grid)" stroke-width="1"/>`;
    s += `<text class="axis-text" x="${m.left - 8}" y="${Y(t) + 4}" text-anchor="end">${esc(fmtAxis(t))}</text>`;
  }
  xTicks.forEach((d, i) => {
    const anchor = xTickCount > 1 && i === 0 ? 'start' : xTickCount > 1 && i === xTickCount - 1 ? 'end' : 'middle';
    s += `<text class="axis-text" x="${X(d)}" y="${height - 6}" text-anchor="${anchor}">${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(2, 4)}</text>`;
  });
  for (const ser of series) {
    if (ser.points.length > 1) {
      const path = ser.points.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('');
      s += `<path d="${path}" fill="none" stroke="${ser.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
    const last = ser.points[ser.points.length - 1];
    s += `<circle cx="${X(last[0])}" cy="${Y(last[1])}" r="4" fill="${ser.color}" stroke="var(--surface)" stroke-width="2"/>`;
  }
  for (const mk of markers) {
    s += `<circle cx="${X(mk.date)}" cy="${Y(mk.value)}" r="5" fill="var(--series-2)" stroke="var(--surface)" stroke-width="2"/>`;
  }
  s += `<line class="cross" x1="0" x2="0" y1="${m.top}" y2="${height - m.bottom}" stroke="var(--axis)" stroke-width="1" visibility="hidden"/>`;
  s += '</svg>';

  let legend = '';
  if (series.length > 1 || markers.length) {
    legend = `<div class="legend">${series.map((x) => `<span><i style="background:${x.color}"></i>${esc(x.name)}</span>`).join('')}${markers.length ? '<span><i class="dot" style="background:var(--series-2)"></i>רכישה</span>' : ''}</div>`;
  }
  const rows = dates.slice(-tableRows).reverse().map((d) => `<tr><td>${plainDate(d)}</td>${series.map((x) => {
    const p = x.points.find((q) => q[0] === d);
    return `<td>${p ? `<span class="num">${esc(fmtTip(p[1]))}</span>` : '—'}</td>`;
  }).join('')}</tr>`).join('');
  const table = `<details class="chart-table"><summary>הצגה כטבלה</summary><div class="scroll"><table><thead><tr><th>תאריך</th>${series.map((x) => `<th>${esc(x.name)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></details>`;

  el.innerHTML = `${legend}${s}${table}`;
  const svg = el.querySelector('svg');
  const cross = svg.querySelector('.cross');
  const showAt = (idx, clientX, clientY) => {
    const d = dates[idx];
    cross.setAttribute('x1', X(d)); cross.setAttribute('x2', X(d)); cross.setAttribute('visibility', 'visible');
    const lines = series.map((x) => {
      const p = x.points.find((q) => q[0] === d);
      return p ? `<div class="tt-row"><span>${esc(x.name)}</span><b dir="ltr">${esc(fmtTip(p[1]))}</b></div>` : '';
    }).join('');
    const mk = markers.filter((q) => q.date === d).map((q) => `<div class="tt-row"><span>רכישה</span><b>${q.html}</b></div>`).join('');
    showTooltip(`<div class="tt-date">${plainDate(d)}</div>${lines}${mk}`, clientX, clientY);
  };
  let cursor = dates.length - 1;
  svg.addEventListener('pointermove', (e) => {
    const rect = svg.getBoundingClientRect();
    const scale = width / rect.width;
    const ms = xMin + (((e.clientX - rect.left) * scale - m.left) / (width - m.left - m.right)) * (xMax - xMin);
    let best = 0, bestDist = Infinity;
    dates.forEach((d, i) => { const dist = Math.abs(toMs(d) - ms); if (dist < bestDist) { best = i; bestDist = dist; } });
    cursor = best;
    showAt(best, e.clientX, e.clientY);
  });
  const clear = () => { cross.setAttribute('visibility', 'hidden'); hideTooltip(); };
  svg.addEventListener('pointerleave', clear);
  svg.addEventListener('blur', clear);
  svg.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    cursor = Math.max(0, Math.min(dates.length - 1, cursor + (e.key === 'ArrowRight' ? 1 : -1)));
    const rect = svg.getBoundingClientRect();
    showAt(cursor, rect.left + (X(dates[cursor]) * rect.width) / width, rect.top + 30);
  });
}

function chartEmpty(el, text) { el.innerHTML = `<div class="chart-empty">${esc(text)}</div>`; }

function renderValueChart() {
  const el = $('valueChart');
  const dates = Object.keys(state.snapshots).sort();
  $('valueTitle').textContent = ui.valueView === 'all' ? 'שווי כל התיק בשקלים' : 'עלות מול שווי';
  if (!fx.dates.length || !dates.length) { chartEmpty(el, 'הגרף יופיע אחרי הסנכרון הראשון.'); return; }
  let series;
  if (ui.valueView === 'all') {
    series = [{
      name: 'שווי התיק',
      color: 'var(--series-1)',
      points: dates.map((d) => [d, state.snapshots[d].usd * rateOn(d).rate]),
    }];
  } else {
    if (!state.purchases.length) { chartEmpty(el, 'הזן סכום קנייה למוצר, והגרף יתחיל להשוות בין מה ששילמת לשווי היום.'); return; }
    const value = [], cost = [];
    for (const d of dates) {
      const ps = state.purchases.filter((p) => p.date <= d);
      const r = rateOn(d).rate;
      let v = 0, c = 0;
      for (const p of ps) {
        const it = state.items[p.key];
        v += it ? p.qty * priceOn(it, d) * r : 0;
        c += p.currency === 'USD' ? p.amount * p.rate : p.amount;
      }
      if (ps.length) { value.push([d, v]); cost.push([d, c]); }
    }
    if (!value.length) { chartEmpty(el, 'הרכישות שהוזנו מתוארכות אחרי הסנכרון האחרון. הגרף יתעדכן בסנכרון הבא.'); return; }
    series = [
      { name: 'שווי היום', color: 'var(--series-1)', points: value },
      { name: 'שולם', color: 'var(--series-2)', points: cost },
    ];
  }
  lineChart(el, {
    series,
    fmtAxis: (v) => plainIls(v),
    fmtTip: (v) => plainIls(v),
    tableLabel: 'שווי לאורך זמן בשקלים',
  });
  if (series[0].points.length === 1) {
    el.insertAdjacentHTML('beforeend', '<p class="chart-note">זו נקודת הנתונים הראשונה. Collectr מציג רק מחיר נוכחי, ולכן הגרף יתמלא עם כל יום שבו האפליקציה מתעדכנת.</p>');
  }
}

function renderEffectChart() {
  const el = $('effectChart');
  const t = totals();
  if (!t.count || !fx.dates.length) { chartEmpty(el, 'כאן תראה כמה מהרווח או ההפסד נובע ממחיר הקלפים וכמה משינוי שער הדולר.'); return; }
  const width = Math.max(260, el.clientWidth || 320);
  const height = 240;
  const m = { top: 26, bottom: 44, side: 8 };
  const steps = [
    { label: 'שולם', from: 0, to: t.costIls, kind: 'total' },
    { label: 'מחיר קלפים', from: t.costIls, to: t.costIls + t.marketEffect, kind: 'delta', v: t.marketEffect },
    { label: 'שער דולר', from: t.costIls + t.marketEffect, to: t.valueIls, kind: 'delta', v: t.fxEffect },
  ];
  let note = '';
  if (ui.effectView === 'all') {
    // No cost is known for the rest of the portfolio, so its value is shown but never counted as profit.
    const totalIls = portfolioUsd() * currentRate().rate;
    const unknownIls = totalIls - t.valueIls;
    steps.push({ label: 'ללא עלות', from: t.valueIls, to: totalIls, kind: 'neutral', v: unknownIls });
    steps.push({ label: 'שווי התיק', from: 0, to: totalIls, kind: 'total' });
    note = `<p class="chart-note">הרווח ${signedIls(t.pnlIls)} מחושב רק על פריטים שהוזנו. למוצרים ללא עלות ידועה מוצג השווי בלבד.</p>`;
  } else {
    steps.push({ label: 'שווי היום', from: 0, to: t.valueIls, kind: 'total' });
  }
  const yMax = Math.max(...steps.map((x) => Math.max(x.from, x.to))) * 1.02 || 1;
  const Y = (v) => m.top + (1 - v / yMax) * (height - m.top - m.bottom);
  const band = (width - m.side * 2) / steps.length;
  const barW = Math.min(46, band * 0.6);
  let s = `<svg xmlns="${svgNS}" viewBox="0 0 ${width} ${height}" height="${height}" role="img" aria-label="פירוק הרווח: שולם, השפעת מחיר הקלפים, השפעת שער הדולר, שווי היום" dir="ltr">`;
  s += `<line x1="${m.side}" x2="${width - m.side}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--axis)"/>`;
  steps.forEach((b, i) => {
    // Reads right to left, like the rest of the page.
    const cx = width - m.side - band * i - band / 2;
    const top = Y(Math.max(b.from, b.to)), bottom = Y(Math.min(b.from, b.to));
    const h = Math.max(2, bottom - top);
    const fill = b.kind === 'total' ? 'var(--series-1)' : b.kind === 'neutral' ? 'var(--axis-text)' : b.v >= 0 ? 'var(--bar-good)' : 'var(--bar-bad)';
    s += `<rect x="${cx - barW / 2}" y="${top}" width="${barW}" height="${h}" rx="4" fill="${fill}"/>`;
    const text = b.kind === 'total' ? plainIls(b.to) : `${b.v >= 0 ? '+' : '−'}₪${nf0.format(Math.abs(b.v))}`;
    s += `<text class="bar-value" x="${cx}" y="${top - 7}" text-anchor="middle">${esc(text)}</text>`;
    // One word per line, so five labels fit side by side in a narrow card.
    b.label.split(' ').forEach((line, n) => {
      s += `<text class="bar-label" x="${cx}" y="${height - 26 + n * 15}" text-anchor="middle">${esc(line)}</text>`;
    });
    if (i < steps.length - 1) {
      s += `<line x1="${cx - barW / 2}" x2="${cx - band + barW / 2}" y1="${Y(b.to)}" y2="${Y(b.to)}" stroke="var(--axis)"/>`;
    }
  });
  el.innerHTML = `${s}</svg>${note}`;
}

function renderFxChart() {
  const el = $('fxChart');
  if (!fx.dates.length) { chartEmpty(el, 'טוען שערים מבנק ישראל…'); return; }
  const cut = new Date(Date.now() - ui.fxRange * 864e5).toISOString().slice(0, 10);
  const firstPurchase = state.purchases.reduce((a, p) => (p.date < a ? p.date : a), cut);
  const start = firstPurchase < cut ? firstPurchase : cut;
  const points = [];
  fx.dates.forEach((d, i) => { if (d >= start) points.push([d, fx.rates[i]]); });
  if (!points.length) { chartEmpty(el, 'אין שערים לטווח הזה.'); return; }
  const markers = state.purchases.map((p) => {
    const it = state.items[p.key];
    return { date: p.rateDate, value: p.rate, html: `${esc(it?.name || 'מוצר')} · ${ils(p.currency === 'USD' ? p.amount * p.rate : p.amount)}` };
  });
  lineChart(el, {
    series: [{ name: 'שער יציג', color: 'var(--series-1)', points }],
    markers,
    fmtAxis: (v) => nf2.format(v),
    fmtTip: (v) => nf3.format(v),
    tableLabel: 'שער דולר יציג לאורך זמן',
  });
}

/* ---------- table ---------- */
const COLUMNS = [
  { key: 'name', label: 'מוצר', get: (r) => r.it.name },
  { key: 'qty', label: 'כמות', get: (r) => r.it.qty },
  { key: 'price', label: 'מחיר נוכחי', get: (r) => r.it.price },
  { key: 'diff', label: 'שינוי ב-Collectr', get: (r) => r.it.diffPct },
  { key: 'value', label: 'שווי היום', get: (r) => r.valueIls },
  { key: 'cost', label: 'שולם', get: (r) => (r.ps.length ? r.costIls : null) },
  { key: 'rate', label: 'שער קנייה', get: (r) => r.avgRate },
  { key: 'pnl', label: 'רווח או הפסד', get: (r) => (r.ps.length ? r.pnlIls : null) },
];
function renderTable() {
  $('itemsHead').innerHTML = COLUMNS.map((c) => {
    const sorted = ui.sort.key === c.key;
    return `<th ${sorted ? `aria-sort="${ui.sort.dir > 0 ? 'ascending' : 'descending'}"` : ''}><button type="button" data-sort="${c.key}">${c.label}${sorted ? (ui.sort.dir > 0 ? ' ▲' : ' ▼') : ''}</button></th>`;
  }).join('') + '<th><span class="muted">פעולה</span></th>';

  const q = $('search').value.trim().toLowerCase();
  const status = $('statusFilter').value, type = $('typeFilter').value;
  const rows = Object.values(state.items).map(itemRow).filter((r) => {
    const { it, ps } = r;
    if (status === 'removed') { if (!it.removed) return false; } else if (it.removed && !ps.length) return false;
    if (status === 'missing' && (ps.length || it.removed)) return false;
    if (status === 'entered' && !ps.length) return false;
    if (status === 'new' && !(it.isNew && !ps.length && !it.removed)) return false;
    if (type === 'card' && !it.isCard) return false;
    if (type === 'sealed' && it.isCard) return false;
    if (type === 'graded' && !gradeOf(it)) return false;
    return !q || `${it.name} ${it.set} ${it.number}`.toLowerCase().includes(q);
  });
  const col = COLUMNS.find((c) => c.key === ui.sort.key);
  rows.sort((a, b) => {
    const x = col.get(a), y = col.get(b);
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return (typeof x === 'string' ? x.localeCompare(y) : x - y) * ui.sort.dir;
  });
  $('itemsBody').innerHTML = rows.map(rowHtml).join('');
  const empty = $('tableEmpty');
  empty.hidden = rows.length > 0;
  empty.textContent = Object.keys(state.items).length ? 'אין מוצרים שמתאימים לסינון.' : 'עדיין אין מוצרים. בצע סנכרון מלא כדי לטעון את תיק Main.';
}
const thumb = (url, w) => (/^https:\/\/public\.getcollectr\.com\//.test(url || '') ? url.replace('width=1200', `width=${w}`) : '');
function conditionText(it) {
  if (!it.isCard) return 'מארז סגור';
  return [it.number, gradeText(it) || it.condition].filter(Boolean).join(' · ');
}
function rowHtml(r) {
  const { it, ps } = r;
  const none = '<span class="none">—</span>';
  const img = thumb(it.image, 120);
  const partial = ps.length && r.boughtQty < it.qty ? `<span class="tag">הוזן ${r.boughtQty}/${it.qty}</span>` : '';
  return `<tr class="${it.removed ? 'removed' : ''}">
    <td><div class="product">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : '<span style="width:34px"></span>'}
      <span><span class="product-name">${esc(it.name)}${it.isNew && !ps.length && !it.removed ? '<span class="tag new">חדש</span>' : ''}${it.removed ? '<span class="tag">הוסר מהתיק</span>' : ''}${partial}</span>
      <span class="product-meta">${esc(it.set)}${conditionText(it) ? ` · ${esc(conditionText(it))}` : ''}</span></span></div></td>
    <td>${it.qty}</td>
    <td>${usd(it.price)}</td>
    <td>${compsStatusHtml(it) || (it.diffPct ? delta(pct(it.diffPct), it.diffPct) : '<span class="muted">ללא שינוי</span>')}</td>
    <td>${currentRate() ? ils(r.valueIls) : none}</td>
    <td>${ps.length ? ils(r.costIls) : none}</td>
    <td>${r.avgRate ? rateFmt(r.avgRate) : none}</td>
    <td>${ps.length ? `${delta(signedIls(r.pnlIls), r.pnlIls)} ${r.pnlPct !== null ? `<span class="muted">${pct(r.pnlPct)}</span>` : ''}` : none}</td>
    <td><button class="btn small" type="button" data-purchase="${esc(it.key)}">${ps.length ? 'רכישות' : 'הזנת קנייה'}</button>${gradeOf(it) && !it.removed && !compsUi.hasKey ? ` <button class="btn small" type="button" data-ebay-open="${esc(it.key)}">eBay</button>` : ''}</td>
  </tr>`;
}

/* ---------- purchase dialog ---------- */
function openPurchase(key, editId = null) {
  const it = state.items[key];
  if (!it) return;
  const editing = editId ? state.purchases.find((p) => p.id === editId) : null;
  const dlg = $('purchaseDialog');
  const img = thumb(it.image, 200);
  const ps = itemPurchases(key).sort((a, b) => (a.date < b.date ? 1 : -1));
  const today = todayStr();
  const history = ps.length ? `<div class="history"><h4>רכישות שהוזנו</h4>${ps.map((p) => {
    const paid = p.currency === 'USD' ? usd(p.amount) : ils(p.amount, 2);
    return `<div class="history-row${editing?.id === p.id ? ' editing' : ''}"><span>${fmtDate(p.date)} · ${p.qty} יח׳ · ${paid} · שער ${rateFmt(p.rate)}${p.note ? ` · ${esc(p.note)}` : ''}</span><span class="history-actions"><button class="btn small" type="button" data-edit="${esc(p.id)}">עדכון</button><button class="btn small ghost" type="button" data-del="${esc(p.id)}">מחיקה</button></span></div>`;
  }).join('')}</div>` : '';
  dlg.innerHTML = `
    <div class="dialog-head">${img ? `<img src="${esc(img)}" alt="">` : ''}
      <div><h3>${esc(it.name)}</h3><p class="muted">${esc(it.set)}${conditionText(it) ? ` · ${esc(conditionText(it))}` : ''}</p>
      <p class="muted">מחיר נוכחי ${usd(it.price)} · בתיק ${it.qty} יח׳</p></div></div>
    ${history}
    <form id="purchaseForm" novalidate data-edit-id="${esc(editing?.id || '')}">
      ${editing ? '<h4 class="form-title">עדכון רכישה</h4>' : ''}
      <div class="form-grid">
        <label class="field">תאריך קנייה<input type="date" name="date" max="${today}" value="${esc(editing?.date || today)}" required></label>
        <label class="field">כמות שנקנתה<input type="number" name="qty" min="1" step="1" value="${editing ? editing.qty : Math.max(1, it.qty - ps.reduce((s, p) => s + p.qty, 0))}" required></label>
        <label class="field">סכום ששולם, סה״כ<input type="number" name="amount" min="0" step="0.01" inputmode="decimal" dir="ltr" value="${editing ? editing.amount : ''}" required></label>
        <div class="field">מטבע
          <div class="segmented" role="radiogroup" aria-label="מטבע">
            <label><input type="radio" name="currency" value="ILS" ${editing?.currency === 'USD' ? '' : 'checked'}><span>₪ שקל</span></label>
            <label><input type="radio" name="currency" value="USD" ${editing?.currency === 'USD' ? 'checked' : ''}><span>$ דולר</span></label>
          </div>
        </div>
        <label class="field span2">הערה (לא חובה)<input type="text" name="note" maxlength="120" value="${esc(editing?.note || '')}"></label>
      </div>
      <div id="purchasePreview" class="preview"></div>
      <p id="purchaseWarn" class="warn-line" hidden></p>
      <p id="purchaseError" class="error" hidden></p>
      <div class="dialog-actions">
        <button class="btn primary" type="submit">${editing ? 'שמירת העדכון' : 'שמירה'}</button>
        ${editing ? '<button class="btn" type="button" data-cancel-edit>ביטול העדכון</button>' : ''}
        <button class="btn" type="button" data-close>${ps.length ? 'סגירה' : 'ביטול'}</button>
      </div>
    </form>`;
  const form = dlg.querySelector('#purchaseForm');
  const update = () => updatePurchasePreview(form, it);
  form.addEventListener('input', update);
  form.addEventListener('submit', (e) => { e.preventDefault(); submitPurchase(form, it); });
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.querySelector('[data-cancel-edit]')?.addEventListener('click', () => openPurchase(key));
  dlg.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openPurchase(key, b.dataset.edit)));
  dlg.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('למחוק את הרכישה הזו?')) return;
    try {
      await mutate(() => { state.purchases = state.purchases.filter((p) => p.id !== b.dataset.del); });
    } catch (e) {
      toast(`המחיקה נכשלה: ${e.message}`);
      return;
    }
    render();
    openPurchase(key);
  }));
  update();
  if (!dlg.open) dlg.showModal();
  form.elements.amount.focus();
}
function readPurchaseForm(form) {
  return {
    date: form.elements.date.value,
    qty: Number(form.elements.qty.value),
    amount: Number(form.elements.amount.value),
    currency: form.elements.currency.value,
    note: form.elements.note.value.trim(),
  };
}
function updatePurchasePreview(form, it) {
  const v = readPurchaseForm(form);
  const box = form.querySelector('#purchasePreview');
  const r = v.date ? rateOn(v.date) : null;
  const now = currentRate();
  if (!r || !now) { box.innerHTML = '<div class="hint">אין שער זמין לתאריך הזה.</div>'; return; }
  const hint = r.date !== v.date ? `<div class="hint">אין פרסום בתאריך הזה, נלקח השער האחרון שפורסם לפניו (${plainDate(r.date)}).</div>` : '';
  let body = `<div class="row"><span>שער יציג ביום הקנייה</span><b>${rateFmt(r.rate)}</b></div>${hint}`;
  if (v.amount > 0 && v.qty >= 1) {
    const c = purchaseCalc({ key: it.key, qty: v.qty, amount: v.amount, currency: v.currency, rate: r.rate }, now.rate);
    body += `<div class="row"><span>${v.currency === 'USD' ? 'בשקלים' : 'בדולרים'} לפי שער יום הקנייה</span><b>${v.currency === 'USD' ? ils(c.costIls) : usd(c.costUsd)}</b></div>
      <div class="row"><span>שווי היום (שער ${rateFmt(now.rate)})</span><b>${ils(c.valueIls)}</b></div>
      <div class="row"><span>רווח או הפסד</span><b>${delta(signedIls(c.pnlIls), c.pnlIls)}</b></div>`;
  }
  box.innerHTML = body;
  const warn = form.querySelector('#purchaseWarn');
  const total = itemPurchases(it.key).filter((p) => p.id !== form.dataset.editId).reduce((s, p) => s + p.qty, 0) + (v.qty || 0);
  warn.hidden = !(v.amount > 0) || total <= it.qty;
  warn.textContent = `סה״כ הרכישות (${total}) גדול מהכמות בתיק (${it.qty}).`;
}
async function submitPurchase(form, it) {
  const v = readPurchaseForm(form);
  const err = form.querySelector('#purchaseError');
  const fail = (m) => { err.textContent = m; err.hidden = false; };
  if (!v.date || v.date > todayStr()) return fail('יש לבחור תאריך קנייה שאינו בעתיד.');
  if (!(v.amount > 0)) return fail('יש להזין סכום גדול מאפס.');
  if (!Number.isInteger(v.qty) || v.qty < 1) return fail('הכמות צריכה להיות מספר שלם, 1 ומעלה.');
  const r = rateOn(v.date);
  if (!r) return fail('אין שער זמין לתאריך הזה. בדוק את החיבור לבנק ישראל ונסה שוב.');
  const editId = form.dataset.editId;
  if (editId) {
    try {
      await mutate(() => {
        const p = state.purchases.find((x) => x.id === editId);
        if (!p) throw new Error('הרכישה כבר לא קיימת');
        Object.assign(p, {
          date: v.date, qty: v.qty, amount: v.amount, currency: v.currency, note: v.note,
          rate: r.rate, rateDate: r.date, updatedAt: new Date().toISOString(),
        });
      });
    } catch (e) {
      return fail(`העדכון נכשל: ${e.message}`);
    }
    $('purchaseDialog').close();
    render();
    toast(`הרכישה עודכנה: ${it.name}`);
    return;
  }
  const purchase = {
    id: `p${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
    key: it.key, date: v.date, qty: v.qty, amount: v.amount, currency: v.currency, note: v.note,
    rate: r.rate, rateDate: r.date, createdAt: new Date().toISOString(),
  };
  try {
    await mutate(() => {
      state.purchases.push(purchase);
      if (state.items[it.key]) state.items[it.key].isNew = false;
    });
  } catch (e) {
    return fail(`השמירה נכשלה: ${e.message}`);
  }
  $('purchaseDialog').close();
  render();
  toast(`נשמר: ${it.name}`);
}

/* ---------- sync dialog ---------- */
function bookmarkletCode() {
  const server = location.origin;
  // Runs in the user's own browser on the Collectr page and reads pages the same way the page does.
  // Works on any showcase profile and sends every collection in it; the app keeps only the tracked ones.
  const code = `(async()=>{
const S='${server}';
const m=location.href.match(/^https:\\/\\/app\\.getcollectr\\.com\\/showcase\\/profile\\/@([A-Za-z0-9_.-]+)/);
if(!m){alert('יש ללחוץ על הסימניה בדף של פרופיל ב-Collectr (showcase/profile).');return}
const H=m[1];
const w=window.open(S+'/','portfolio-tracker');
if(!w){alert('הדפדפן חסם את פתיחת האפליקציה. יש לאשר חלונות קופצים מהאתר הזה ולנסות שוב.');return}
const b=document.createElement('div');
b.style='position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;background:#111;color:#fff;padding:10px 18px;border-radius:10px;font:15px system-ui;direction:rtl';
b.textContent='מסנכרן…';document.body.append(b);
try{
const A=async(o,id)=>{const r=await fetch('https://api-v2.getcollectr.com/data/showcase/@'+H+'?offset='+o+'&limit=30'+(id?'&id='+id:'')+'&filters=&unstackedView=true&username=00000000-0000-0000-0000-000000000000',{credentials:'include'});if(!r.ok)throw Error('Collectr החזיר '+r.status+'. רענן את הדף ונסה שוב.');return r.json()};
const C=((await A(0,'')).collections)||[];
if(!C.length)throw Error('לא נמצאו תיקים בפרופיל');
const R=[];
for(const c of C){let P=[],F=null;
for(let o=0;o<6000;o+=30){const j=await A(o,c.id);F=F||j;if(!(j.products||[]).length)break;P.push(...j.products);b.textContent='מסנכרן את '+c.name+'… '+P.length;await new Promise(s=>setTimeout(s,300))}
R.push({collection:{id:c.id,name:c.name},portfolioValue:F&&F.portfolio_value&&F.portfolio_value[0]&&F.portfolio_value[0].price,totals:F?{cards:F.total_cards,sealed:F.total_sealed,graded:F.total_graded}:null,products:P})}
const D={version:2,fetchedAt:new Date().toISOString(),handle:H,results:R};
await new Promise((ok,no)=>{let i,t;const h=e=>{if(e.origin===S&&e.data&&e.data.type==='collectr-sync-ack'&&e.data.fetchedAt===D.fetchedAt){done();ok()}};const done=()=>{clearInterval(i);clearTimeout(t);removeEventListener('message',h)};addEventListener('message',h);i=setInterval(()=>w.postMessage({type:'collectr-sync',payload:D},S),700);t=setTimeout(()=>{done();no(Error('האפליקציה לא ענתה. האם היא פועלת?'))},20000)});
b.textContent='✓ נשלחו '+R.length+' תיקים לאפליקציה.';setTimeout(()=>b.remove(),5000)
}catch(e){b.style.background='#b92f2f';b.textContent='הסנכרון נכשל: '+e.message;setTimeout(()=>b.remove(),9000)}
})()`;
  return `javascript:${encodeURIComponent(code.replace(/\n/g, ''))}`;
}
function openSyncDialog() {
  const dlg = $('syncDialog');
  dlg.innerHTML = `
    <h3 style="font-size:17px;font-weight:650">סנכרון מלא מ-Collectr</h3>
    <p class="muted" style="margin-top:4px">השרת של Collectr חוסם בקשות שלא מגיעות מדפדפן, ולכן הסנכרון רץ מהדפדפן שלך, בדף של Collectr עצמו. הסימניה קוראת את כל התיקים בפרופיל, והאפליקציה שומרת רק את התיקים שהוספת.</p>
    <ol class="steps">
      <li><b>פעם אחת בלבד:</b> גרור את הכפתור הזה לסרגל הסימניות (Ctrl+Shift+B מציג אותו). אם יש לך כבר סימניית סנכרון ישנה, החלף אותה בזו: הישנה מסנכרנת רק את Main.<br>
        <a class="bookmarklet" id="bookmarkletLink" href="#" draggable="true">סנכרון Collectr</a></li>
      <li>פתח את הפרופיל של התיק <b>${esc(current.name)}</b> ב-Collectr והמתן לטעינה.<br>
        <a class="btn small" style="display:inline-block;margin-top:4px;text-decoration:none" href="${esc(profileUrl(current))}" target="_blank" rel="noopener noreferrer">פתיחת הדף</a></li>
      <li>לחץ על הסימניה. האפליקציה תיפתח בחלון משלה ותתעדכן מעצמה. אם הדפדפן חוסם חלון קופץ, יש לאשר אותו.</li>
    </ol>
    <div class="dialog-actions"><button class="btn" type="button" data-close>סגירה</button></div>`;
  const link = dlg.querySelector('#bookmarkletLink');
  link.setAttribute('href', bookmarkletCode());
  link.addEventListener('click', (e) => { e.preventDefault(); toast('יש לגרור את הכפתור לסרגל הסימניות'); });
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.showModal();
}

/* ---------- events ---------- */
// Full-sync data arrives from the bookmarklet running on the Collectr page. Nothing else is accepted.
const receivedSyncs = new Set();
addEventListener('message', async (e) => {
  if (e.origin !== COLLECTR_ORIGIN || e.data?.type !== 'collectr-sync') return;
  const payload = e.data.payload;
  if (!payload?.fetchedAt || receivedSyncs.has(payload.fetchedAt)) return;
  receivedSyncs.add(payload.fetchedAt);
  try {
    const handle = normalizeSync(payload).handle;
    const r = await fetch(`/api/sync?handle=${encodeURIComponent(handle)}`, { method: 'POST', body: JSON.stringify(payload) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    e.source.postMessage({ type: 'collectr-sync-ack', fetchedAt: payload.fetchedAt }, e.origin);
    await checkForSync();
  } catch (err) {
    receivedSyncs.delete(payload.fetchedAt);
    toast(`שמירת הסנכרון נכשלה: ${err.message}`);
  }
});
document.addEventListener('click', (e) => {
  const t = e.target.closest('button, [data-open-sync]');
  if (!t) return;
  if (t.dataset.purchase) openPurchase(t.dataset.purchase);
  else if (t.dataset.ebayOpen) openEbayFromRow(t.dataset.ebayOpen);
  else if (t.dataset.ebayInfo) openEbayCardInfo(t.dataset.ebayInfo);
  else if (t.dataset.sort) {
    if (ui.sort.key === t.dataset.sort) ui.sort.dir *= -1;
    else ui.sort = { key: t.dataset.sort, dir: t.dataset.sort === 'name' ? 1 : -1 };
    renderTable();
  } else if ('openSync' in t.dataset) openSyncDialog();
  else if ('openComps' in t.dataset) openCompsDialog();
  else if ('showNew' in t.dataset) {
    $('statusFilter').value = 'new';
    renderTable();
    document.querySelector('.table-card').scrollIntoView({ behavior: 'smooth' });
  } else if (t.dataset.valueView) {
    ui.valueView = t.dataset.valueView;
    document.querySelectorAll('[data-value-view]').forEach((b) => b.classList.toggle('on', b === t));
    renderValueChart();
  } else if (t.dataset.effectView) {
    ui.effectView = t.dataset.effectView;
    document.querySelectorAll('[data-effect-view]').forEach((b) => b.classList.toggle('on', b === t));
    renderEffectChart();
  } else if (t.dataset.fxRange) {
    ui.fxRange = Number(t.dataset.fxRange);
    document.querySelectorAll('[data-fx-range]').forEach((b) => b.classList.toggle('on', b === t));
    renderFxChart();
  }
});
$('search').addEventListener('input', renderTable);
$('statusFilter').addEventListener('change', renderTable);
$('typeFilter').addEventListener('change', renderTable);
$('syncBtn').addEventListener('click', openSyncDialog);
$('compsBtn').addEventListener('click', openCompsDialog);
$('portfoliosBtn').addEventListener('click', () => openPortfoliosDialog());
$('portfolioSelect').addEventListener('change', (e) => { switchPortfolio(e.target.value).catch((err) => toast(`המעבר נכשל: ${err.message}`)); });
$('refreshBtn').addEventListener('click', () => refreshAll(true));
const receivedEbay = new Set();
addEventListener('message', (e) => {
  if (e.origin !== 'https://www.ebay.com' || e.data?.type !== 'ebay-sales') return;
  const payload = e.data.payload;
  if (!payload?.sentAt || !Array.isArray(payload.rows)) return;
  e.source.postMessage({ type: 'ebay-sales-ack', sentAt: payload.sentAt }, e.origin);
  if (receivedEbay.has(payload.sentAt)) return;
  receivedEbay.add(payload.sentAt);
  saveChain.then(() => loadState()).then(() => { render(); openEbayReview(payload); });
});
for (const dlg of [$('purchaseDialog'), $('syncDialog'), $('ebayDialog'), $('compsDialog'), $('portfoliosDialog')]) {
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}
let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { renderValueChart(); renderEffectChart(); renderFxChart(); }, 150);
});

/* ---------- startup ---------- */
async function refreshAll(announce) {
  const btn = $('refreshBtn');
  btn.disabled = true;
  try {
    ui.fxError = null;
    await loadFx().catch((e) => { ui.fxError = e.message; });
    ui.quickError = null;
    let res = null;
    try {
      res = await quickCheck();
    } catch (e) { ui.quickError = e.message; }
    render();
    if (announce && !ui.quickError && !ui.fxError) {
      toast(res?.added ? `נמצאו ${res.added} מוצרים חדשים` : 'הנתונים עודכנו');
    }
  } finally {
    btn.disabled = false;
  }
}
(async function start() {
  await loadPortfolios();
  renderPortfolioPicker();
  await loadState();
  await loadCompsStatus().catch(() => {});
  render();
  await checkForSync();
  await refreshAll(false);
  setInterval(checkForSync, 4000);
  runCompsUpdate({ auto: true }).catch(() => {});
  setInterval(() => { runCompsUpdate({ auto: true }).catch(() => {}); }, 3600000); // Costs nothing unless a card is due.
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || $('purchaseDialog').open) return;
    await saveChain;
    await loadState();
    render();
    checkForSync();
  });
})().catch((e) => toast(`שגיאה בטעינה: ${e.message}`));
