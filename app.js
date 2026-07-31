/* Ledger — credit card credit tracker
   Data is deliberately minimal: no card numbers, no balances, no PII.
   Only "did I use credit X in period Y". */

(() => {
'use strict';

const APP_VER = 'v1.0.2';

/* ============================ CARD DATA ============================ */

const CARDS = [
  {
    id:'disc', issuer:'Discover it', name:'Student Cash Back', fee:'No fee',
    face:'linear-gradient(135deg,#F07818,#C94502)',
    rates:[
      {t:'gas',      r:'5%',  c:'Gas & EV charging', n:5},
      {t:'transit',  r:'5%',  c:'Public transit',    n:5},
      {t:'flights',  r:'5%',  c:'Flights',           n:5},
      {t:'drugstore',r:'5%',  c:'Drugstores',        n:5},
      {t:'other',    r:'1%',  c:'Everything else',   n:1}
    ],
    perks:['No annual fee','No foreign transaction fee'],
    credits:[
      {id:'disc-q3', label:'Activate quarterly 5%', sub:'Rotating categories · $1,500 cap',
       cadence:'quarterly', value:75}
    ]
  },
  {
    id:'csr', issuer:'Chase', name:'Sapphire Reserve', fee:'$795',
    face:'linear-gradient(135deg,#2A3A5C,#101725)',
    rates:[
      {t:'chase',    r:'8X', c:'Chase Travel',            n:8},
      {t:'flights',  r:'4X', c:'Flights & hotels direct', n:4},
      {t:'dining',   r:'3X', c:'Dining worldwide',        n:3},
      {t:'rideshare',r:'5X', c:'Lyft (thru 9/30/27)',     n:5},
      {t:'other',    r:'1X', c:'Everything else',         n:1}
    ],
    perks:['Priority Pass Select','Sapphire Lounges + 2 guests','IHG One Platinum',
           'Apple TV+ & Music','$120 Global Entry / 4 yrs'],
    credits:[
      {id:'csr-travel',  label:'Travel credit',        sub:'Any travel merchant · automatic', cadence:'anniversary', anniv:'csr', value:300},
      {id:'csr-edit1',   label:'The Edit hotel — 1st', sub:'Prepaid 2+ nights via Chase Travel', cadence:'annual', value:250},
      {id:'csr-edit2',   label:'The Edit hotel — 2nd', sub:'Second qualifying stay',          cadence:'annual', value:250},
      {id:'csr-select',  label:'Select-hotel credit',  sub:'2026 only · IHG, Omni, Virgin…',  cadence:'annual', value:250},
      {id:'csr-dining',  label:'Exclusive Tables',     sub:'Book via OpenTable',              cadence:'half',    value:150},
      {id:'csr-stubhub', label:'StubHub / viagogo',    sub:'Activated',                       cadence:'half',    value:150},
      {id:'csr-dd-r',    label:'DoorDash restaurant',  sub:'One order',                       cadence:'monthly', value:5},
      {id:'csr-dd-1',    label:'DoorDash non-restaurant', sub:'Grocery or retail',            cadence:'monthly', value:10},
      {id:'csr-dd-2',    label:'DoorDash non-restaurant', sub:'Second order',                 cadence:'monthly', value:10},
      {id:'csr-lyft',    label:'Lyft credit',          sub:'Posts in-app on the 1st',         cadence:'monthly', value:10},
      {id:'csr-pelo',    label:'Peloton credit',       sub:'Activated',                       cadence:'monthly', value:10}
    ]
  },
  {
    id:'vx', issuer:'Capital One', name:'Venture X', fee:'$395',
    face:'linear-gradient(135deg,#20437E,#0C1830)',
    rates:[
      {t:'hotels',   r:'10X', c:'Hotels & cars · C1 Travel',  n:10},
      {t:'c1flight', r:'5X',  c:'Flights · C1 Travel',        n:5},
      {t:'other',    r:'2X',  c:'Everything else',            n:2}
    ],
    perks:['Unlimited Priority Pass','Capital One Lounges','Hertz President\u2019s Circle',
           'Cell phone protection','$120 Global Entry / 4 yrs'],
    credits:[
      {id:'vx-travel', label:'Travel credit',      sub:'Capital One Travel only', cadence:'anniversary', anniv:'vx', value:300},
      {id:'vx-miles',  label:'Anniversary miles',  sub:'Posts automatically',     cadence:'anniversary', anniv:'vx', points:10000}
    ]
  },
  {
    id:'csp', issuer:'Chase', name:'Sapphire Preferred', fee:'$95',
    face:'linear-gradient(135deg,#1E86DE,#0B4C86)',
    rates:[
      {t:'chase',     r:'5X', c:'Chase Travel',        n:5},
      {t:'rideshare', r:'5X', c:'Lyft (thru 9/30/27)', n:5},
      {t:'dining',    r:'3X', c:'Dining',              n:3},
      {t:'grocery',   r:'3X', c:'Online groceries',    n:3},
      {t:'gas',       r:'3X', c:'Gas & EV charging',   n:3},
      {t:'vacation',  r:'3X', c:'Vacation homes',      n:3},
      {t:'streaming', r:'3X', c:'Streaming',           n:3},
      {t:'other',     r:'1X', c:'Everything else',     n:1}
    ],
    perks:['DashPass','$120 Global Entry / 4 yrs','Free Apple TV year'],
    credits:[
      {id:'csp-hotel', label:'Chase Travel hotel credit', sub:'Booked via Chase Travel', cadence:'anniversary', anniv:'csp', value:100},
      {id:'csp-dd',    label:'DoorDash non-restaurant',   sub:'Groceries or retail',     cadence:'monthly',     value:10}
    ]
  },
  {
    id:'cfu', issuer:'Chase', name:'Freedom Unlimited', fee:'No fee',
    face:'linear-gradient(135deg,#16B7B3,#08606B)',
    rates:[
      {t:'chase',    r:'5%',   c:'Chase Travel',     n:5},
      {t:'dining',   r:'3%',   c:'Dining',           n:3},
      {t:'drugstore',r:'3%',   c:'Drugstores',       n:3},
      {t:'other',    r:'1.5%', c:'Everything else',  n:1.5}
    ],
    perks:['DashPass 6 months','2% on Lyft','No annual fee'],
    credits:[
      {id:'cfu-dd', label:'DoorDash non-restaurant', sub:'One order per quarter', cadence:'quarterly', value:10}
    ]
  }
];

const CREDITS = CARDS.flatMap(c => c.credits.map(cr => ({...cr, cardId:c.id, card:c.name})));

const CATS = [
  ['Dining','dining'],['Groceries','grocery'],['Gas & EV','gas'],['Drugstore','drugstore'],
  ['Transit','transit'],['Flights','flights'],['Hotels','hotels'],['Chase Travel','chase'],
  ['Rideshare','rideshare'],['Vacation rentals','vacation'],['Streaming','streaming'],['Everything else','other']
];

const VERDICT = {
  dining   :['Sapphire Reserve','3X','Worldwide, no foreign transaction fee. Preferred and Freedom also hit 3X — pick whichever points you want.'],
  gas      :['Discover it','5%','Only while gas is the active quarter, within the $1,500 cap. Otherwise Sapphire Preferred at 3X.'],
  drugstore:['Discover it','5%','While drugstores are the active quarter. Freedom Unlimited at 3% once you hit the cap.'],
  transit  :['Discover it','5%','While transit is the active quarter. The Reserve pays only 1X here.'],
  flights  :['Sapphire Reserve','8X','Through Chase Travel. Booked direct it is 4X; Venture X gives 5X through Capital One Travel. Discover beats all of them when flights are the active quarter.'],
  hotels   :['Venture X','10X','Best rate you hold, but only through Capital One Travel. Direct booking is 4X on the Reserve, 8X through Chase Travel.'],
  chase    :['Sapphire Reserve','8X','Highest portal rate in your wallet. Stack with Points Boost for up to 2¢ per point.'],
  rideshare:['Sapphire Reserve','5X','Through Sept 2027, and the monthly Lyft credit stacks on top.'],
  other    :['Venture X','2X','Uncapped 2X beats Freedom Unlimited at 1.5% on anything without a bonus category.']
};

/* ============================ PERIOD MATH ============================ */

const DEFAULT_ANNIV = { csr:{m:6,d:1}, vx:{m:7,d:21}, csp:{m:11,d:1} };
const DAY = 86400000;

function annivWindow(m, d){
  const now = new Date();
  let s = new Date(now.getFullYear(), m-1, d);
  if (s > now) s = new Date(now.getFullYear()-1, m-1, d);
  return { start:s, end:new Date(s.getFullYear()+1, m-1, d) };
}

function windowFor(cr, anniv){
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  switch (cr.cadence) {
    case 'monthly':   return { start:new Date(y,m,1),                 end:new Date(y,m+1,1) };
    case 'quarterly': return { start:new Date(y,Math.floor(m/3)*3,1), end:new Date(y,(Math.floor(m/3)+1)*3,1) };
    case 'half':      return { start:new Date(y,m<6?0:6,1),           end:new Date(y,m<6?6:12,1) };
    case 'annual':    return { start:new Date(y,0,1),                 end:new Date(y+1,0,1) };
    case 'anniversary': {
      const a = (anniv && anniv[cr.anniv]) || DEFAULT_ANNIV[cr.anniv] || {m:1,d:1};
      return annivWindow(a.m, a.d);
    }
    default: return null;
  }
}

const pKey     = (cr,a) => { const w = windowFor(cr,a); return w ? cr.cadence+':'+w.start.toISOString().slice(0,10) : 'once'; };
const daysLeft = (cr,a) => { const w = windowFor(cr,a); return w ? Math.max(0, Math.ceil((w.end - Date.now())/DAY)) : null; };
const spent    = (cr,a) => { const w = windowFor(cr,a); if(!w) return 0;
                             return Math.min(1, Math.max(0, (Date.now()-w.start)/(w.end-w.start))); };

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ============================ STATE + SYNC ============================ */

const LS = 'ledger.state.v1';
const CFG = 'ledger.sync.v1';

let state = { claims:{}, anniv:{...DEFAULT_ANNIV} };
let cfg   = { url:'', key:'', room:'' };

const loadLocal = () => {
  try { const s = JSON.parse(localStorage.getItem(LS)||'null'); if(s) state = {claims:{}, anniv:{...DEFAULT_ANNIV}, ...s}; } catch {}
  try { const c = JSON.parse(localStorage.getItem(CFG)||'null'); if(c) cfg = {...cfg, ...c}; } catch {}
};
const saveLocal = () => { try { localStorage.setItem(LS, JSON.stringify(state)); } catch {} };
const saveCfg   = () => { try { localStorage.setItem(CFG, JSON.stringify(cfg)); } catch {} };

const syncOn = () => !!(cfg.url && cfg.key && cfg.room);

function setDot(mode, title){
  const d = document.getElementById('syncDot');
  d.className = 'syncdot' + (mode==='on'?' on':mode==='err'?' err':'');
  d.textContent = mode==='on'?'synced':mode==='err'?'offline':'local';
  d.title = title || '';
}

/* merge two claim maps by per-key timestamp — lets two devices edit different credits */
function mergeClaims(a={}, b={}){
  const out = {...a};
  for (const [k,v] of Object.entries(b)) if (!out[k] || (v.t||0) > (out[k].t||0)) out[k] = v;
  return out;
}

/* Sync goes through two security-definer RPCs rather than the table, so the
   sync code is the thing the database actually checks. The anon key alone
   reaches nothing — it cannot read the table, and it cannot read a row whose
   code it does not already have. */
const rpc = (fn, body) => fetch(`${cfg.url.replace(/\/$/,'')}/rest/v1/rpc/${fn}`, {
  method:'POST',
  headers:{ apikey:cfg.key, Authorization:`Bearer ${cfg.key}`, 'Content-Type':'application/json' },
  body: JSON.stringify(body)
});

async function pull(){
  if (!syncOn()) return;
  const r = await rpc('ledger_pull', { code: cfg.room });
  if (!r.ok) throw new Error('pull '+r.status);
  const data = await r.json();   // null until this code has been pushed once
  if (data) {
    state.claims = mergeClaims(state.claims, data.claims||{});
    if (data.anniv) state.anniv = {...state.anniv, ...data.anniv};
    saveLocal();
  }
}

let pushT;
function pushSoon(){
  if (!syncOn()) return;
  clearTimeout(pushT);
  pushT = setTimeout(async () => {
    try {
      const r = await rpc('ledger_push', { code: cfg.room, payload: state });
      if (!r.ok) throw new Error('push '+r.status);
      setDot('on','Synced '+new Date().toLocaleTimeString());
    } catch(e){ setDot('err','Could not reach Supabase — changes are saved on this device'); }
  }, 700);
}

/* ============================ RENDER ============================ */

const $ = s => document.querySelector(s);
const isClaimed = cr => state.claims[cr.id]?.p === pKey(cr, state.anniv);
const CHK = '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';

function creditRow(cr){
  const claimed = isClaimed(cr);
  const dl = daysLeft(cr, state.anniv);
  const pct = Math.round(spent(cr, state.anniv)*100);
  const warn = !claimed && dl !== null && dl <= 7;
  const val = cr.value != null ? '$'+cr.value : cr.points ? (cr.points/1000)+'k pts' : '';
  const left = dl === null ? '' : dl === 0 ? 'ends today' : dl === 1 ? '1 day left' : dl+' days left';

  const b = document.createElement('button');
  b.className = 'row'; b.type = 'button';
  b.setAttribute('aria-pressed', claimed ? 'true' : 'false');
  b.innerHTML =
    `<span class="row-top">
       <span class="chk">${CHK}</span>
       <span class="row-txt"><span class="row-lab">${cr.label}</span><span class="row-sub">${cr.sub}</span></span>
       <span class="row-val">${val}</span>
     </span>
     <span class="meter${warn?' warn':''}">
       <span class="meter-track"><span class="meter-fill" style="width:${pct}%"></span></span>
       <span class="meter-t">${left}</span>
     </span>`;
  b.addEventListener('click', () => {
    state.claims[cr.id] = { p: claimed ? null : pKey(cr, state.anniv), t: Date.now() };
    saveLocal(); pushSoon(); render();
  });
  return b;
}

const GROUPS = [
  ['monthly',    'Monthly'],
  ['quarterly',  'Quarterly'],
  ['half',       'Half-year'],
  ['annual',     'Calendar year'],
  ['anniversary','Anniversary year']
];

function render(){
  let open = 0, done = 0;
  for (const cr of CREDITS) {
    if (isClaimed(cr)) done++;
    else if (cr.value != null) open += cr.value;
  }
  $('#statOpen').textContent = '$'+open.toLocaleString();
  $('#statSub').textContent  = `${done} of ${CREDITS.length} claimed in their current window`;

  /* closing this week */
  const soon = CREDITS
    .filter(cr => !isClaimed(cr) && daysLeft(cr,state.anniv) !== null && daysLeft(cr,state.anniv) <= 7)
    .sort((a,b) => daysLeft(a,state.anniv) - daysLeft(b,state.anniv));
  const box = $('#alarmBox');
  if (soon.length) {
    box.hidden = false;
    $('#alarmList').innerHTML = soon.map(cr => {
      const d = daysLeft(cr,state.anniv);
      return `<li><span class="t">${d===0?'today':d+'d'}</span><span>${cr.label}${cr.value!=null?' — $'+cr.value:''}</span></li>`;
    }).join('');
  } else box.hidden = true;

  /* grouped credits */
  const wrap = $('#creditGroups'); wrap.innerHTML = '';
  for (const [cad,label] of GROUPS) {
    const list = CREDITS.filter(cr => cr.cadence === cad);
    if (!list.length) continue;
    const g = document.createElement('div'); g.className = 'grp';
    const h = document.createElement('p'); h.className = 'grp-h'; h.textContent = label;
    g.appendChild(h);
    list.forEach(cr => g.appendChild(creditRow(cr)));
    wrap.appendChild(g);
  }

  /* cards */
  const cl = $('#cardList'); cl.innerHTML = '';
  for (const c of CARDS) {
    const el = document.createElement('div'); el.className = 'cardblk';
    el.innerHTML =
      `<div class="face" style="background:${c.face}">
         <span class="face-fee">${c.fee}</span>
         <div class="face-iss">${c.issuer}</div>
         <div class="face-nm">${c.name}</div>
       </div>
       <div class="blk-body">
         <div class="rates">${c.rates.map(r=>`<span class="rt"><b>${r.r}</b> ${r.c}</span>`).join('')}</div>
         ${c.perks.length?`<div class="perks">${c.perks.map(p=>`<span class="pk">${p}</span>`).join('')}</div>`:''}
       </div>`;
    cl.appendChild(el);
  }

  $('#foot').textContent = syncOn() ? 'Synced across your devices.' : 'Saved on this device only.';
}

/* ============================ SETTINGS UI ============================ */

function renderAnniv(){
  const wrap = $('#annivRows'); wrap.innerHTML = '';
  for (const key of ['csr','vx','csp']) {
    const card = CARDS.find(c => c.id === key);
    const a = state.anniv[key] || DEFAULT_ANNIV[key];
    const row = document.createElement('div'); row.className = 'annivrow';
    row.innerHTML =
      `<span class="nm">${card.name}</span>
       <select aria-label="${card.name} month">${MONTHS.map((m,i)=>
         `<option value="${i+1}"${i+1===a.m?' selected':''}>${m}</option>`).join('')}</select>
       <input type="number" min="1" max="31" value="${a.d}" aria-label="${card.name} day">`;
    const [sel, inp] = [row.querySelector('select'), row.querySelector('input')];
    const upd = () => {
      const d = Math.min(31, Math.max(1, parseInt(inp.value,10) || 1));
      inp.value = d;
      state.anniv[key] = { m:parseInt(sel.value,10), d };
      saveLocal(); pushSoon(); render();
    };
    sel.addEventListener('change', upd);
    inp.addEventListener('change', upd);
    wrap.appendChild(row);
  }
}

function wireSettings(){
  $('#sbUrl').value = cfg.url; $('#sbKey').value = cfg.key; $('#sbRoom').value = cfg.room;

  /* The sync code is the credential the database checks, so it has to come
     from a CSPRNG — never Math.random(). randomUUID needs a secure context;
     getRandomValues is the wider fallback and still cryptographic. */
  $('#genRoom').addEventListener('click', () => {
    let code;
    if (crypto.randomUUID) {
      code = crypto.randomUUID();
    } else {
      const b = new Uint8Array(16);
      crypto.getRandomValues(b);
      code = [...b].map(x => x.toString(16).padStart(2,'0')).join('');
    }
    $('#sbRoom').value = code;
  });

  $('#saveSync').addEventListener('click', async () => {
    cfg = { url:$('#sbUrl').value.trim(), key:$('#sbKey').value.trim(), room:$('#sbRoom').value.trim() };
    saveCfg();
    const note = $('#syncNote');
    if (!syncOn()) { setDot('local'); note.textContent = 'Fill in all three fields to turn on sync.'; render(); return; }
    note.textContent = 'Connecting…';
    try { await pull(); pushSoon(); setDot('on'); note.textContent = 'Sync is on. Enter the same code on your other devices.'; render(); }
    catch(e){ setDot('err'); note.textContent = 'Could not connect. Check the URL, key, and that the ledger table exists.'; }
  });

  $('#exportBtn').addEventListener('click', () => {
    const t = $('#ioBox'); t.hidden = false; t.value = JSON.stringify(state); t.select();
  });
  $('#importBtn').addEventListener('click', () => {
    const t = $('#ioBox');
    if (t.hidden) { t.hidden = false; t.value = ''; t.placeholder = 'Paste exported data, then tap Import again.'; t.focus(); return; }
    try {
      const s = JSON.parse(t.value);
      state.claims = mergeClaims(state.claims, s.claims||{});
      if (s.anniv) state.anniv = {...state.anniv, ...s.anniv};
      saveLocal(); pushSoon(); renderAnniv(); render();
      t.hidden = true;
    } catch { t.value = 'That is not valid exported data.'; }
  });
  $('#resetBtn').addEventListener('click', () => {
    const now = Date.now();
    for (const cr of CREDITS) state.claims[cr.id] = { p:null, t:now };
    saveLocal(); pushSoon(); render();
  });

  $('#swVer').textContent = APP_VER;
}

/* ============================ NAV + ADVISOR ============================ */

function wireTabs(){
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(x => { x.classList.remove('is-on'); x.setAttribute('aria-selected','false'); });
      t.classList.add('is-on'); t.setAttribute('aria-selected','true');
      document.querySelectorAll('.pane').forEach(p => p.classList.remove('is-active'));
      document.getElementById('pane-'+t.dataset.pane).classList.add('is-active');
      window.scrollTo(0,0);
    });
  });
}

function wireAdvisor(){
  const wrap = $('#cats');
  CATS.forEach(([label,tag]) => {
    const b = document.createElement('button');
    b.className = 'cat'; b.type = 'button'; b.textContent = label;
    b.setAttribute('aria-pressed','false');
    b.addEventListener('click', () => {
      [...wrap.children].forEach(x => x.setAttribute('aria-pressed','false'));
      b.setAttribute('aria-pressed','true');
      let v = VERDICT[tag];
      if (!v) {
        let best = null;
        for (const c of CARDS) for (const r of c.rates)
          if (r.t === tag && (!best || r.n > best.n)) best = { n:r.n, card:c.name, rate:r.r, c:r.c };
        v = best ? [best.card, best.rate, `Earns ${best.rate} on ${best.c.toLowerCase()}.`] : null;
      }
      $('#verdict').innerHTML = v
        ? `<p class="v-card">${v[0]}</p><span class="v-rate">${v[1]}</span><p class="v-note">${v[2]}</p>`
        : `<p class="verdict-empty">No bonus category — Venture X at 2X is your floor.</p>`;
    });
    wrap.appendChild(b);
  });
}

function wireInstall(){
  let prompt = null;
  const btn = $('#installBtn');
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); prompt = e; btn.hidden = false; });
  btn.addEventListener('click', async () => { if (!prompt) return; prompt.prompt(); await prompt.userChoice; prompt = null; btn.hidden = true; });
  window.addEventListener('appinstalled', () => { btn.hidden = true; });
}

/* ============================ BOOT ============================ */

loadLocal();
wireTabs(); wireAdvisor(); wireInstall(); wireSettings(); renderAnniv(); render();

if (syncOn()) { setDot('on'); pull().then(render).catch(() => setDot('err')); }
else setDot('local');

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { if (syncOn()) pull().then(render).catch(()=>setDot('err')); else render(); }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
}

})();
