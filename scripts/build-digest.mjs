#!/usr/bin/env node
/* Builds digest.json — the daily strip at the top of the Credits tab.
 *
 * Reads a handful of points-blog RSS feeds, keeps only what touches the cards
 * in this wallet or a transfer bonus on the programs they earn, and writes the
 * result next to index.html. No dependencies: fetch plus a small regex parse.
 *
 * Deliberately headlines-and-links only. Nothing here summarises or interprets
 * a card benefit, and nothing here may edit CARDS or PERKS in app.js — those
 * carry a human verification date, and a feed scraper has no business
 * overwriting them.
 *
 *   node scripts/build-digest.mjs            # real feeds
 *   FEEDS_BASE=http://127.0.0.1:8877 node …  # local mock, for testing
 */

import { writeFileSync } from 'node:fs';

const MAX_AGE_DAYS = 10;   // a two-week-old headline is not news
const MAX_ITEMS    = 3;

const FEEDS = [
  ['Frequent Miler',    'https://frequentmiler.com/feed/'],
  ['Doctor of Credit',  'https://www.doctorofcredit.com/feed/'],
  ['One Mile at a Time','https://onemileatatime.com/feed/'],
  ['Thrifty Traveler',  'https://thriftytraveler.com/feed/'],
  ['View from the Wing','https://viewfromthewing.com/feed/'],
  ['Miles to Memories', 'https://milestomemories.com/feed/'],
];

/* A hit on any of these is what makes an item worth surfacing. Tags are what
   the strip shows as a label, so keep them short. */
const MATCHERS = [
  [/sapphire reserve/i,                 'Sapphire Reserve'],
  [/sapphire preferred/i,               'Sapphire Preferred'],
  [/venture x/i,                        'Venture X'],
  [/freedom unlimited/i,                'Freedom Unlimited'],
  [/discover it/i,                      'Discover it'],
  [/transfer bonus/i,                   'Transfer bonus'],
  [/ultimate rewards/i,                 'Ultimate Rewards'],
  [/capital one (miles|travel|loung)/i, 'Capital One'],
  /* Benefits get written about without the card ever being named. A headline
     reading "Chase Sapphire Lounges Cut Priority Pass Access" matches none of
     the card names above, yet it is the most relevant thing a Reserve holder
     could read that week. These catch the benefit-shaped stories. */
  [/sapphire loung/i,                   'Sapphire Lounge'],
  [/priority pass/i,                    'Priority Pass'],
  [/\bIHG\b/,                           'IHG'],
  [/global entry|tsa precheck/i,        'Global Entry'],
  [/hertz/i,                            'Hertz'],
  [/dashpass|doordash/i,                'DoorDash'],
];

const strip = s => s
  .replace(/<!\[CDATA\[|\]\]>/g, '')
  .replace(/<[^>]+>/g, '')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#x27;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim();

const tag = (re, xml) => { const m = xml.match(re); return m ? strip(m[1]) : ''; };

/* The same story runs on several blogs under different headlines, and exact
   title matching does not catch it — the first live run spent two of three
   slots on one lounge story. Compare the significant words instead. */
const STOP = new Set(('the a an and or to of for in on at is are was be how what where when why '
  + 'they you your it its with from by more now new get got can will has have this that '
  + 'but does did doe not all any out its than then after before still just only into').split(' '));

/* Crude singular form so "lounge" and "lounges" collide. Words ending in
   "ss" are left alone — otherwise "pass" and "access" lose their meaning. */
const stem = w => (w.endsWith('s') && !w.endsWith('ss')) ? w.slice(0, -1) : w;

const sig = t => new Set(t.toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/)
  .filter(w => w.length > 2 && !STOP.has(w))
  .map(stem));

/* Overlap coefficient — shared words over the *smaller* headline — rather
   than Jaccard over the union. Two write-ups of one story rarely share their
   filler, so the union grows and Jaccard collapses: "…Removing Priority Pass
   Access & Increasing Layover Time Allowed" against "…Cut Priority Pass
   Access: Probably Good News" scores only 0.40 on Jaccard and slipped
   through, putting the same story in two of three slots. On overlap it is
   0.60. The floor of three shared words still stops short headlines from
   being merged for having a word or two in common. */
function nearDuplicate(words, alreadyKept) {
  for (const prev of alreadyKept) {
    const shared = [...words].filter(w => prev.has(w)).length;
    if (shared < 3) continue;
    const smaller = Math.min(words.size, prev.size);
    if (smaller && shared / smaller >= 0.55) return true;
  }
  return false;
}

function parseFeed(xml) {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) || [];
  return blocks.map(b => {
    // Atom puts the URL in an attribute; RSS puts it in the element body.
    const link = tag(/<link[^>]*>([^<]+)<\/link>/i, b) ||
                 (b.match(/<link[^>]*href="([^"]+)"/i) || [])[1] || '';
    return {
      title: tag(/<title[^>]*>([\s\S]*?)<\/title>/i, b),
      link,
      date:  tag(/<(?:pubDate|published|updated)[^>]*>([\s\S]*?)<\/(?:pubDate|published|updated)>/i, b),
    };
  }).filter(i => i.title && i.link);
}

async function main() {
  const base = process.env.FEEDS_BASE;   // set only when testing against a mock
  const cutoff = Date.now() - MAX_AGE_DAYS * 86400000;
  const kept = [];

  for (const [source, url] of FEEDS) {
    const target = base ? `${base}/${source.toLowerCase().replace(/\s+/g, '-')}.xml` : url;
    let items = [];
    try {
      const r = await fetch(target, {
        headers: { 'User-Agent': 'ledger-credit-tracker/1.0 (+https://ledger-credit-tracker.netlify.app)' },
        signal: AbortSignal.timeout(20000),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      items = parseFeed(await r.text());
    } catch (e) {
      // One dead feed must not take the run down with it.
      console.log(`  ${source.padEnd(20)} FAILED  ${e.message}`);
      continue;
    }

    let hits = 0;
    for (const it of items) {
      const when = Date.parse(it.date);
      if (Number.isFinite(when) && when < cutoff) continue;

      const tags = MATCHERS.filter(([re]) => re.test(it.title)).map(([, t]) => t);
      if (!tags.length) continue;

      kept.push({
        title: it.title,
        link: it.link,
        source,
        date: Number.isFinite(when) ? new Date(when).toISOString().slice(0, 10) : '',
        tags: [...new Set(tags)].slice(0, 2),
        ts: Number.isFinite(when) ? when : 0,
      });
      hits++;
    }
    console.log(`  ${source.padEnd(20)} ${String(items.length).padStart(3)} items, ${hits} matched`);
  }

  /* Sort before de-duplicating, so when two blogs carry the same story the
     copy that survives is the most recent one rather than whichever feed
     happened to be listed first. */
  kept.sort((a, b) => b.ts - a.ts);

  /* One item per topic. Word-overlap tuning turned into whack-a-mole — four
     blogs covered the Sapphire Lounge story with four headlines, and each
     threshold that caught three let the fourth through. The tag already says
     what a story is about, so cap the strip at one item per primary tag and
     the problem goes away structurally. Three slots are for three different
     things; depth on one topic is what the link is for.
     Word overlap stays as a backstop for same-story-different-tag. */
  const items = [];
  const keptWords = [];
  const usedTopics = new Set();
  for (const it of kept) {
    if (items.length >= MAX_ITEMS) break;

    const topic = it.tags[0] || '';
    if (usedTopics.has(topic)) {
      console.log(`  (skipped, already have a "${topic}" item) ${it.title}`);
      continue;
    }
    const words = sig(it.title);
    if (nearDuplicate(words, keptWords)) {
      console.log(`  (skipped near-duplicate) ${it.title}`);
      continue;
    }

    usedTopics.add(topic);
    keptWords.push(words);
    const { ts, ...rest } = it;
    items.push(rest);
  }

  writeFileSync('digest.json', JSON.stringify({
    generated: new Date().toISOString(),
    items,
  }, null, 2) + '\n');

  console.log(`\nWrote digest.json — ${items.length} item(s) from ${kept.length} match(es).`);
  for (const i of items) console.log(`  · [${i.tags.join(', ')}] ${i.title}  (${i.source})`);
}

main().catch(e => { console.error('digest build failed:', e); process.exit(1); });
