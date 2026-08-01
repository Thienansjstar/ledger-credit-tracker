/* Ledger — credit card credit tracker
   Data is deliberately minimal: no card numbers, no balances, no PII.
   Only "did I use credit X in period Y". */

(() => {
'use strict';

const APP_VER = 'v1.2.0';

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
           'Apple TV+ & Music','Trip & rental car cover'],
    credits:[
      {id:'csr-global',  label:'Global Entry / TSA PreCheck', sub:'Application fee · one per 4 years', cadence:'multiyear', years:4, value:120},
      {id:'csr-apple',   label:'Apple TV+ & Apple Music',  sub:'Activate in the Chase app',        cadence:'once'},
      {id:'csr-pp',      label:'Enroll Priority Pass',     sub:'Membership must be activated',     cadence:'once'},
      {id:'csr-ihg',     label:'Register IHG Platinum',    sub:'Link it to your IHG account',      cadence:'once'},
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
    perks:['Priority Pass \u00b7 guests $35','Capital One Lounges \u00b7 guests $45','Hertz President\u2019s Circle',
           'Cell phone protection','No foreign transaction fee'],
    credits:[
      {id:'vx-travel', label:'Travel credit',      sub:'Capital One Travel only', cadence:'anniversary', anniv:'vx', value:300},
      {id:'vx-miles',  label:'Anniversary miles',  sub:'Posts automatically',     cadence:'anniversary', anniv:'vx', points:10000},
      {id:'vx-global', label:'Global Entry / TSA PreCheck', sub:'Application fee \u00b7 one per 4 years', cadence:'multiyear', years:4, value:120},
      {id:'vx-pp',     label:'Enroll Priority Pass',   sub:'Unlimited visits for you · guests $35', cadence:'once'},
      {id:'vx-hertz',  label:'Register Hertz status',  sub:'President\u2019s Circle via Capital One', cadence:'once'},
      {id:'vx-phone',  label:'Pay phone bill on this card', sub:'Required for cell phone protection', cadence:'once'}
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
    perks:['DashPass','Free Apple TV year','Primary rental car cover'],
    credits:[
      {id:'csp-hotel', label:'Chase Travel hotel credit', sub:'Booked via Chase Travel', cadence:'anniversary', anniv:'csp', value:100},
      {id:'csp-dd',    label:'DoorDash non-restaurant',   sub:'Groceries or retail',     cadence:'monthly',     value:10},
      {id:'csp-global',label:'Global Entry / TSA PreCheck', sub:'Application fee · one per 4 years', cadence:'multiyear', years:4, value:120},
      {id:'csp-apple', label:'Apple TV+ free year',      sub:'Activate before the offer lapses', cadence:'once'},
      {id:'csp-dash',  label:'Activate DashPass',        sub:'Complimentary while you hold the card', cadence:'once'}
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
      {id:'cfu-dd',   label:'DoorDash non-restaurant', sub:'One order per quarter', cadence:'quarterly', value:10},
      {id:'cfu-dash', label:'Activate DashPass',       sub:'6 complimentary months', cadence:'once'}
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

/* ============================ PERKS ============================
   The things that are not dollar credits — status tiers, lounges, insurance.
   `gets` is what the benefit actually does for you; `how` exists because
   several of these are dormant until you go and switch them on; `watch` is
   the fine print that decides whether the benefit is real in practice. */

const PERKS = [
  { card:'csr', items:[
    { name:'IHG One Rewards Platinum Elite', kind:'Hotel status',
      what:'Automatic elite status across IHG — Holiday Inn, Kimpton, InterContinental, Hotel Indigo, Six Senses.',
      gets:['Room upgrades when one is free at check-in',
            'Late checkout on request',
            'A points bonus on qualifying stays',
            'Guaranteed room availability when you book far enough ahead'],
      how:'Register through Chase, then put the matching IHG number on every booking — status does nothing if the stay is not attached to it.',
      watch:'Granted through 31 December 2027. It is not open-ended, so do not plan status runs around it lasting forever.' },

    { name:'Priority Pass Select', kind:'Airport lounges',
      what:'Membership in the large independent lounge network — 1,300+ lounges.',
      gets:['Lounge access on days you are flying',
            'Up to two guests free, roughly $27 each beyond that',
            'Independent of which airline you fly'],
      how:'Enrol once through Chase. The membership does not exist until you activate it, so do it before a trip, not at the gate.',
      watch:'Chase has trimmed the non-lounge parts of Priority Pass over the years. Assume restaurant and spa credits are gone unless you confirm otherwise.' },

    { name:'Sapphire Lounge by The Club', kind:'Airport lounges',
      what:'Chase’s own lounges, a step above the contract ones.',
      gets:['Entry for you plus two guests', 'Generally better food and less crowding'],
      watch:'From 15 August 2026 these lounges leave Priority Pass and LoungeKey. Your access comes from the Reserve itself so you keep it — but a Priority Pass card from any other issuer will stop working here.' },

    { name:'Apple TV+ and Apple Music', kind:'Subscriptions',
      what:'Both services complimentary for at least a year — around $288 a year of value.',
      gets:['Roughly the price of two standalone subscriptions, every month'],
      how:'Activate in the Chase app. It never starts on its own.',
      watch:'Must be activated by 22 June 2027. Miss that and the benefit is simply forfeited, which is why it sits in Credits as a checkable item.' },

    { name:'Travel and purchase protection', kind:'Insurance',
      what:'The reason to put a trip on this card rather than anything else in your wallet.',
      gets:['Trip cancellation and interruption cover',
            'Trip delay reimbursement',
            'Primary rental car cover up to $75,000, exotics not excluded',
            'Baggage delay and lost luggage cover'],
      watch:'Primary rental cover only applies if you decline the rental company’s own waiver and pay with this card. Taking their insurance forfeits it. Rentals up to 31 consecutive days.' }
  ]},

  { card:'vx', items:[
    { name:'Hertz President’s Circle', kind:'Car rental status',
      what:'Hertz’s top published tier, granted outright rather than earned. Capital One removed the end date, so this one is not on a countdown.',
      gets:['Guaranteed upgrade, usually two car classes',
            'Pick any car from the President’s Circle aisle',
            'Skip the counter and go straight to the car',
            'Bonus points on rentals'],
      how:'Enrol through Capital One, then book with that Hertz Gold Plus Rewards number.' },

    { name:'Priority Pass', kind:'Airport lounges',
      what:'Unlimited visits for you. Guests are no longer free.',
      gets:['Unlimited complimentary visits for the primary cardholder',
            'Guests $35 each, every visit'],
      watch:'Guests stopped being complimentary on 1 February 2026. The $75k spend threshold does not help here — it only covers Capital One Lounges and Landings, never Priority Pass.' },

    { name:'Capital One Lounges and Landings', kind:'Airport lounges',
      what:'Capital One’s own lounges. You still get in free; bringing anyone costs.',
      gets:['Unlimited complimentary entry for the primary cardholder',
            'Guests $45 per adult, $25 for 17 and under, free under 2'],
      watch:'Spending $75,000 on the card in a calendar year restores 2 complimentary guests at Lounges and 1 at Landings, for that year and the next. Authorized users lost free access entirely on 1 February 2026 — each now costs $125 a year.' },

    { name:'Cell phone protection', kind:'Insurance',
      what:'Covers the phones on your bill against damage and theft.',
      gets:['Applies to every line on the bill', 'Per-claim limit, with a deductible', 'A small number of claims per year'],
      how:'Only active if you actually pay the phone bill with this card. That payment is the entire trigger — no payment, no cover.' },

    { name:'No foreign transaction fee', kind:'Everyday',
      gets:['Nothing added on overseas spend, unlike the Freedom Unlimited'] }
  ]},

  { card:'csp', items:[
    { name:'10% anniversary points bonus', kind:'Watch out',
      what:'This is being retired, not something to count on.',
      watch:'Discontinued for anyone who applied on or after 15 June 2026. If you applied before that, you keep earning it only on purchases through 1 October 2026, then it stops. Do not factor it into whether the $95 fee is worth paying next year.' },

    { name:'DashPass', kind:'Delivery',
      gets:['No delivery fee on qualifying DoorDash orders', 'Lower service fees'],
      how:'Activate through Chase.' },

    { name:'Apple TV+', kind:'Subscriptions',
      gets:['A complimentary year'],
      how:'Activate before the offer window closes — it does not wait for you.' },

    { name:'Travel and purchase protection', kind:'Insurance',
      gets:['Trip cancellation and interruption cover',
            'Primary rental car cover up to $60,000',
            'Baggage delay cover'],
      watch:'As on the Reserve, primary rental cover requires declining the rental company’s waiver.' }
  ]},

  { card:'cfu', items:[
    { name:'DashPass', kind:'Delivery', gets:['Six complimentary months'], how:'Activate through Chase.' },
    { name:'Purchase protection and extended warranty', kind:'Insurance',
      gets:['New purchases covered against damage or theft for a window after buying',
            'Manufacturer warranties extended'] },
    { name:'Foreign transaction fee', kind:'Watch out',
      watch:'This card does charge one. Use the Reserve, Preferred or Venture X abroad — the 1.5% here is wiped out and then some.' }
  ]},

  { card:'disc', items:[
    { name:'No annual fee, no foreign transaction fee', kind:'Everyday',
      gets:['Nothing to justify each year', 'No surcharge on overseas spend'] },
    { name:'Acceptance abroad', kind:'Watch out',
      watch:'Discover is thin outside the US. Carry a Visa or Mastercard as your primary when travelling and treat this as a backup.' },
    { name:'Quarterly activation', kind:'Watch out',
      watch:'The 5% is capped per quarter and pays nothing at all unless you activate. That is why it sits in the Credits tab as a checkable item.' }
  ]}
];

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

/* `multiyear` credits (Global Entry) do not sit in a calendar window — the
   clock starts when you use one. So the window is derived from the claim
   timestamp rather than from today's date, and an unused one has no
   deadline at all: it is simply available. `once` items never expire. */
const YEAR = 365.25 * DAY;

function multiState(cr){
  const c = state.claims[cr.id];
  if (!c || !c.p) return { used:false, until:null };
  const until = c.t + (cr.years || 4) * YEAR;
  return until > Date.now() ? { used:true, until } : { used:false, until:null };
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
const isClaimed = cr => cr.cadence === 'multiyear'
  ? multiState(cr).used
  : state.claims[cr.id]?.p === pKey(cr, state.anniv);

const fmtMonth = ts => { const d = new Date(ts); return MONTHS[d.getMonth()]+' '+d.getFullYear(); };

/* Several credits share a label across cards — three Global Entry rows, two
   DashPass, two Travel credit. Identical rows are unusable, so name the card
   on exactly those and leave the unambiguous ones clean. */
const DUPE_LABELS = new Set(
  Object.entries(CREDITS.reduce((m,c) => (m[c.label] = (m[c.label]||0)+1, m), {}))
    .filter(([,n]) => n > 1).map(([label]) => label)
);
const CHK = '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';

function creditRow(cr){
  const claimed = isClaimed(cr);
  const dl = daysLeft(cr, state.anniv);
  const pct = Math.round(spent(cr, state.anniv)*100);
  const warn = !claimed && dl !== null && dl <= 7;
  const val = cr.value != null ? '$'+cr.value : cr.points ? (cr.points/1000)+'k pts' : '';
  const left = dl === null ? '' : dl === 0 ? 'ends today' : dl === 1 ? '1 day left' : dl+' days left';

  /* Only window-bound credits get a depletion meter. A one-time setup has
     nothing to deplete, and an unused Global Entry credit is not running
     out — it is just sitting there. Showing a bar for either would imply a
     deadline that does not exist. */
  let meter;
  if (cr.cadence === 'once') {
    meter = `<span class="meter flat"><span class="meter-t">${claimed ? 'set up' : 'one-time setup'}</span></span>`;
  } else if (cr.cadence === 'multiyear') {
    const m = multiState(cr);
    meter = `<span class="meter flat"><span class="meter-t">${m.used ? 'next available '+fmtMonth(m.until) : 'available now'}</span></span>`;
  } else {
    meter = `<span class="meter${warn?' warn':''}">
       <span class="meter-track"><span class="meter-fill" style="width:${pct}%"></span></span>
       <span class="meter-t">${left}</span>
     </span>`;
  }

  const b = document.createElement('button');
  b.className = 'row'; b.type = 'button';
  b.setAttribute('aria-pressed', claimed ? 'true' : 'false');
  b.innerHTML =
    `<span class="row-top">
       <span class="chk">${CHK}</span>
       <span class="row-txt"><span class="row-lab">${cr.label}</span><span class="row-sub">${
         DUPE_LABELS.has(cr.label) ? `<b class="row-card">${cr.card}</b> ${cr.sub}` : cr.sub
       }</span></span>
       <span class="row-val">${val}</span>
     </span>
     ${meter}`;
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
  ['anniversary','Anniversary year'],
  ['multiyear',  'Every 4 years'],
  ['once',       'Set up once']
];

function render(){
  let open = 0, done = 0;
  for (const cr of CREDITS) {
    if (isClaimed(cr)) done++;
    else if (cr.value != null) open += cr.value;
  }
  $('#statOpen').textContent = '$'+open.toLocaleString();
  $('#statSub').textContent  = `${done} of ${CREDITS.length} claimed or set up`;

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

function renderPerks(){
  const wrap = $('#perkList'); wrap.innerHTML = '';
  for (const grp of PERKS) {
    const card = CARDS.find(c => c.id === grp.card);
    const blk = document.createElement('div'); blk.className = 'perkcard';
    blk.innerHTML =
      `<div class="perkcard-h">
         <span class="swatch" style="background:${card.face}"></span>
         <span class="perkcard-nm">${card.name}</span>
         <span class="perkcard-iss">${card.issuer}</span>
       </div>` +
      grp.items.map(it => `
        <div class="perk">
          <p class="perk-nm">${it.name}<span class="perk-kind${it.kind==='Watch out'?' warnkind':''}">${it.kind}</span></p>
          ${it.what ? `<p class="perk-what">${it.what}</p>` : ''}
          ${it.gets ? `<ul class="perk-gets">${it.gets.map(g=>`<li>${g}</li>`).join('')}</ul>` : ''}
          ${it.how ? `<p class="perk-how"><b>Turn it on</b> ${it.how}</p>` : ''}
          ${it.watch ? `<p class="perk-watch"><b>Watch out</b> ${it.watch}</p>` : ''}
        </div>`).join('');
    wrap.appendChild(blk);
  }
}

/* ============================ DAILY DIGEST ============================
   digest.json is rebuilt by a scheduled GitHub Action and lands here through
   the normal deploy. Headlines and links only — nothing in it is treated as
   fact about a card, and nothing in it touches CARDS or PERKS. It is a
   pointer to go and read, which is why every row is a link out.

   Failure is deliberately quiet: no file, bad JSON, or offline just means no
   strip. But when a digest does show, its date is on screen, so a feed that
   silently stopped updating looks stale rather than looking like no news. */

const DIGEST_SEEN = 'ledger.digest.seen';

async function loadDigest(){
  let d;
  try {
    const r = await fetch('digest.json', { cache:'no-cache' });
    if (!r.ok) return;
    d = await r.json();
  } catch { return; }
  if (!d || !Array.isArray(d.items) || !d.items.length) return;

  const day = String(d.generated || '').slice(0,10);
  if (localStorage.getItem(DIGEST_SEEN) === day) return;   // dismissed today

  const esc = s => String(s).replace(/[&<>"]/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

  $('#digestDate').textContent = day;
  $('#digestList').innerHTML = d.items.map(i => `
    <li>
      <a href="${esc(i.link)}" target="_blank" rel="noopener noreferrer">
        <span class="dg-title">${esc(i.title)}</span>
        <span class="dg-meta">${(i.tags||[]).map(t=>`<span class="dg-tag">${esc(t)}</span>`).join('')}
          <span class="dg-src">${esc(i.source)}</span></span>
      </a>
    </li>`).join('');

  $('#digest').hidden = false;
  $('#digestX').addEventListener('click', () => {
    try { localStorage.setItem(DIGEST_SEEN, day); } catch {}
    $('#digest').hidden = true;
  });
}

/* ============================ CALENDAR EXPORT ============================
   Reminders without a backend. Push would need a server awake at the right
   moment; a calendar file hands the job to the phone's own scheduler, which
   keeps working whether or not this app is installed or Supabase is awake.
   One event per cadence rather than per credit, so the calendar stays
   readable — 5 recurring entries instead of thirty. */

const icsEsc = s => String(s).replace(/([\\;,])/g,'\\$1').replace(/\n/g,'\\n');
const pad2   = n => String(n).padStart(2,'0');
const ymd    = d => d.getFullYear()+pad2(d.getMonth()+1)+pad2(d.getDate());

/* RFC 5545 caps a line at 75 *octets*, not characters, and continuation lines
   begin with a space that counts toward the limit. The em dashes in these
   summaries are three bytes each, so counting JS string length would let lines
   run over. Split on code-point boundaries so multi-byte characters survive. */
function fold(line){
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out = [];
  let cur = '', bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > 75) { out.push(cur); cur = ' ' + ch; bytes = 1 + b; }
    else { cur += ch; bytes += b; }
  }
  out.push(cur);
  return out.join('\r\n');
}

function vevent({uid, start, rrule, summary, desc, alarm}){
  const end = new Date(start.getTime() + DAY);
  return [
    'BEGIN:VEVENT',
    'UID:'+uid,
    'DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z',
    'DTSTART;VALUE=DATE:'+ymd(start),
    'DTEND;VALUE=DATE:'+ymd(end),
    'RRULE:'+rrule,
    'SUMMARY:'+icsEsc(summary),
    'DESCRIPTION:'+icsEsc(desc),
    'BEGIN:VALARM','ACTION:DISPLAY','TRIGGER;RELATED=START:PT9H',
    'DESCRIPTION:'+icsEsc(summary),'END:VALARM',
    'END:VEVENT'
  ].map(fold).join('\r\n');
}

function buildICS(){
  const now = new Date(), y = now.getFullYear();
  const list = cad => CREDITS.filter(c => c.cadence === cad);
  const names = cad => list(cad).map(c => `${c.label} (${c.card}${c.value!=null?' — $'+c.value:''})`).join('\n');
  const sum = cad => list(cad).reduce((t,c) => t + (c.value||0), 0);

  const ev = [];

  if (list('monthly').length)
    ev.push(vevent({ uid:'ledger-monthly@ledger.app', start:new Date(y, now.getMonth(), 25),
      rrule:'FREQ=MONTHLY;BYMONTHDAY=25',
      summary:`Monthly card credits — $${sum('monthly')} closing`,
      desc:'These reset on the 1st. Anything unused is gone.\n\n'+names('monthly') }));

  if (list('quarterly').length)
    ev.push(vevent({ uid:'ledger-quarterly@ledger.app', start:new Date(y, 2, 25),
      rrule:'FREQ=YEARLY;BYMONTH=3,6,9,12;BYMONTHDAY=25',
      summary:`Quarterly card credits — $${sum('quarterly')} closing`,
      desc:'End of quarter approaching.\n\n'+names('quarterly') }));

  if (list('half').length)
    ev.push(vevent({ uid:'ledger-half@ledger.app', start:new Date(y, 5, 20),
      rrule:'FREQ=YEARLY;BYMONTH=6,12;BYMONTHDAY=20',
      summary:`Half-year card credits — $${sum('half')} closing`,
      desc:'These reset on 1 January and 1 July.\n\n'+names('half') }));

  if (list('annual').length)
    ev.push(vevent({ uid:'ledger-annual@ledger.app', start:new Date(y, 11, 10),
      rrule:'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=10',
      summary:`Calendar-year credits — $${sum('annual')} closing`,
      desc:'Three weeks until these reset on 1 January. Book now if you have not.\n\n'+names('annual') }));

  /* Anniversary credits key off your account-open date, so each card gets its
     own reminder two weeks ahead of its own reset. */
  for (const key of ['csr','vx','csp']) {
    const anCredits = CREDITS.filter(c => c.cadence === 'anniversary' && c.anniv === key);
    if (!anCredits.length) continue;
    const a = state.anniv[key] || DEFAULT_ANNIV[key];
    const card = CARDS.find(c => c.id === key);
    const warn = new Date(y, a.m-1, a.d);
    warn.setTime(warn.getTime() - 14*DAY);
    ev.push(vevent({ uid:`ledger-anniv-${key}@ledger.app`, start:warn,
      rrule:`FREQ=YEARLY;BYMONTH=${warn.getMonth()+1};BYMONTHDAY=${warn.getDate()}`,
      summary:`${card.name} anniversary credits close in 2 weeks`,
      desc:`Your ${card.name} year resets on ${MONTHS[a.m-1]} ${a.d}.\n\n`+
           anCredits.map(c=>`${c.label}${c.value!=null?' — $'+c.value:c.points?' — '+(c.points/1000)+'k pts':''}`).join('\n') }));
  }

  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Ledger//Credit Tracker//EN',
          'CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Ledger — card credits',
          ...ev, 'END:VCALENDAR'].join('\r\n');
}

function downloadICS(){
  const blob = new Blob([buildICS()], { type:'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'ledger-credits.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  $('#icsBtn').addEventListener('click', downloadICS);

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
wireTabs(); wireAdvisor(); wireInstall(); wireSettings(); renderAnniv(); renderPerks(); render();
loadDigest();

if (syncOn()) { setDot('on'); pull().then(render).catch(() => setDot('err')); }
else setDot('local');

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { if (syncOn()) pull().then(render).catch(()=>setDot('err')); else render(); }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
}

})();
