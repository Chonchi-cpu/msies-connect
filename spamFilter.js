/* ============================================================
   spamFilter.js - automated spam detection for comments.
   Pure functions only (no localStorage, no DOM) so the rules are
   easy to read, tweak and test. data.js calls analyzeSpam() when
   a comment is posted or edited, and decides what to do with the
   verdict:

     score <  SPAM_FLAG_AT   -> 'ok'    posted normally
     score >= SPAM_FLAG_AT   -> 'flag'  posted, but sent to the
                                        Super Admin review queue
     score >= SPAM_BLOCK_AT  -> 'block' not posted; logged for the
                                        Super Admin

   Every rule adds points to one score (max 100), so a single weak
   signal (an ALL CAPS reply, a phone number) never trips the filter
   on its own - it takes a strong signal, or several weak ones.
   This is a heuristic filter, not a guarantee: it catches the
   common patterns (links, scam/promo wording, copy-paste floods,
   shouting) and leaves the rest to user reports.
   ============================================================ */

const SPAM_FLAG_AT = 40;
const SPAM_BLOCK_AT = 70;

/* Links to these sites are never counted as spam links. A host
   matches if it equals an entry or ends with ".entry". */
const SPAM_TRUSTED_DOMAINS = ['deped.gov.ph', 'gov.ph', 'msies.edu.ph', 'edu.ph'];

/* Link shorteners and chat-invite links hide where they lead. */
const SPAM_SUSPICIOUS_HOSTS = [
  'bit.ly', 'tinyurl.com', 'cutt.ly', 'rb.gy', 'is.gd', 'bit.do', 't.co',
  't.me', 'wa.me', 'chat.whatsapp.com', 'discord.gg'
];

/* [phrase, points, stem]. Phrases are matched against the
   normalized text (see spamNormalize), as whole words; stem:true
   also matches longer words ("casino" -> "casinos"). */
const SPAM_PHRASES = [
  /* scams and get-rich-quick */
  ['free money', 40], ['easy money', 40], ['earn money', 30], ['make money', 30],
  ['earn extra income', 30], ['guaranteed income', 40], ['work from home', 25],
  ['no experience needed', 30], ['double your money', 45], ['risk free', 25],
  ['investment opportunity', 30], ['loan approved', 30], ['you have won', 40],
  ['you won', 25], ['claim your prize', 45], ['claim prize', 45], ['100% free', 30],
  ['libreng pera', 40], ['kumita ng', 25, true], ['pautang', 25, true],
  /* promotions */
  ['click here', 20], ['click the link', 25], ['link in bio', 30], ['buy now', 25],
  ['order now', 20], ['limited offer', 20], ['limited time', 15], ['act now', 20],
  ['promo code', 25], ['discount code', 25], ['promo', 20], ['giveaway', 20, true],
  ['free gift', 25], ['subscribe to', 20], ['follow me', 20], ['check my profile', 25],
  ['dm me', 20], ['cheap followers', 40], ['crypto', 15], ['bitcoin', 15],
  /* gambling and adult */
  ['casino', 40, true], ['jackpot', 30], ['betting', 25], ['sugal', 25, true],
  ['online sugal', 40], ['viagra', 50], ['onlyfans', 50], ['porn', 50, true]
];

const SPAM_TLDS = 'com|net|org|info|biz|xyz|top|click|link|site|online|shop|store|live|club|vip|ru|cn|tk|ml|ga|cf|gq|ly|gl|co|me|ph|io|app|tv|cc';
const SPAM_URL_RE = /(?:https?:\/\/|www\.)[^\s<>"']+/gi;
/* Bare domains ("freecash.xyz/win"). The TLD must be lowercase so a
   missing space after a full stop ("Thanks.Me too") isn't a link. */
const SPAM_DOMAIN_RE = new RegExp('\\b[a-zA-Z0-9][a-zA-Z0-9-]*(?:\\.[a-zA-Z0-9-]+)*\\.(?:' + SPAM_TLDS + ')\\b(?:/[^\\s<>"\']*)?', 'g');
/* "bit dot ly", "site (dot) com" */
const SPAM_DOT_RE = new RegExp('\\b[a-z0-9-]+\\s*(?:\\(dot\\)|\\[dot\\]|\\sdot\\s)\\s*(?:' + SPAM_TLDS + ')\\b', 'gi');
const SPAM_ZERO_WIDTH_RE = /[\u200B-\u200F\u2060\uFEFF]/g;

/* Lower-cases and flattens text so evasion tricks don't hide a
   phrase: styled/full-width letters, invisible characters, "fr33",
   "m0ney", "ca$h", punctuation inside words, stretched letters
   ("freeeee") and extra spaces. Letter/digit swaps are only undone
   inside words that mix letters and digits, so "100% free" and
   "08:00" are left alone. Doubled letters are squeezed to one on
   both the text and the phrase list, so the two always agree. */
function spamNormalize(text) {
  let t = String(text == null ? '' : text)
    .normalize('NFKC')
    .replace(SPAM_ZERO_WIDTH_RE, '')
    .toLowerCase();
  const leet = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's' };
  t = t.split(/\s+/).map((tok) => {
    if (/\p{L}/u.test(tok) && /[0-9@$]/.test(tok)) return tok.replace(/[0-9@$]/g, (ch) => leet[ch] || ch);
    return tok;
  }).join(' ');
  t = t.replace(/[^\p{L}\p{N}%\s]/gu, ' ');
  t = t.replace(/(\p{L})\1+/gu, '$1');
  return t.replace(/\s+/g, ' ').trim();
}

/* Compact fingerprint of a comment, used to spot the same text
   being posted again. */
function spamKey(text) {
  return spamNormalize(text).replace(/\s+/g, '');
}

const SPAM_PHRASES_NORM = SPAM_PHRASES.map(([phrase, points, stem]) => ({
  phrase, points, stem: !!stem, norm: spamNormalize(phrase)
}));

function spamHost(link) {
  return String(link)
    .replace(/^[a-z]+:\/\//i, '')
    .split(/[\/?#:]/)[0]
    .replace(/^www\./i, '')
    .toLowerCase();
}
function spamHostMatches(host, list) {
  return list.some((d) => host === d || host.endsWith('.' + d));
}

/* Finds links in the text. Returns { links: [host...] } with trusted
   school/government hosts left out. */
function spamFindLinks(text) {
  const found = [];
  let rest = String(text || '').normalize('NFKC').replace(SPAM_ZERO_WIDTH_RE, '');
  rest = rest.replace(SPAM_URL_RE, (m) => { found.push(m); return ' '; });
  rest = rest.replace(SPAM_DOMAIN_RE, (m) => { found.push(m); return ' '; });
  const dotted = rest.match(SPAM_DOT_RE) || [];
  dotted.forEach((m) => found.push(m.replace(/\s*(?:\(dot\)|\[dot\]|\sdot\s)\s*/i, '.')));
  const hosts = found.map(spamHost).filter(Boolean);
  return hosts.filter((h) => !spamHostMatches(h, SPAM_TRUSTED_DOMAINS));
}

/* analyzeSpam(text, { recent })
     recent: this user's earlier attempts, [{ at, key }] (key from
             spamKey), used for the "same text again" and "posting
             too fast" rules. Leave it out to skip those two rules.
   Returns { score, verdict: 'ok'|'flag'|'block',
             reasons: [plain-language labels], matches: [phrases] } */
function analyzeSpam(text, opts) {
  const o = opts || {};
  const raw = String(text == null ? '' : text);
  const reasons = [];
  const matches = [];
  let score = 0;
  const add = (pts, reason) => { score += pts; if (reason && !reasons.includes(reason)) reasons.push(reason); };

  if (!raw.trim()) return { score: 0, verdict: 'ok', reasons, matches };

  /* hidden characters */
  if (SPAM_ZERO_WIDTH_RE.test(raw)) add(15, 'Hidden characters');
  SPAM_ZERO_WIDTH_RE.lastIndex = 0;

  /* links */
  const links = spamFindLinks(raw);
  if (links.length === 1) add(45, 'Contains a link');
  else if (links.length > 1) add(45 + 25 * (links.length - 1), 'Contains several links');
  if (links.some((h) => spamHostMatches(h, SPAM_SUSPICIOUS_HOSTS))) add(20, 'Shortened or chat-invite link');
  links.forEach((h) => matches.push(h));

  /* promo / scam wording */
  const norm = ' ' + spamNormalize(raw) + ' ';
  let phrasePts = 0;
  SPAM_PHRASES_NORM.forEach((p) => {
    if (!p.norm) return;
    const hit = p.stem ? norm.includes(' ' + p.norm) : norm.includes(' ' + p.norm + ' ');
    if (hit) { phrasePts += p.points; matches.push(p.phrase); }
  });
  if (phrasePts) add(Math.min(phrasePts, 80), 'Promotional or scam-style wording');

  /* contact details */
  if (/(?:\+?63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/.test(raw) || /\b\d{10,}\b/.test(raw)) add(20, 'Contains a phone number');
  if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(raw)) add(15, 'Contains an email address');

  /* shouting */
  const letters = raw.match(/\p{L}/gu) || [];
  if (letters.length >= 12) {
    const upper = raw.match(/\p{Lu}/gu) || [];
    if (upper.length / letters.length >= 0.7) add(20, 'Mostly capital letters');
  }

  /* stretched / repeated characters, punctuation and emoji floods */
  if (/([^\s.\-_*~=])\1{5,}/u.test(raw)) add(15, 'Repeated characters');
  if (/[!?]{4,}/.test(raw)) add(10, 'Too many punctuation marks');
  let emoji = 0;
  try { emoji = (raw.match(/\p{Extended_Pictographic}/gu) || []).length; } catch (e) { emoji = 0; }
  if (emoji >= 8) add(15, 'Too many emoji');

  /* the same few words over and over */
  const words = spamNormalize(raw).split(' ').filter(Boolean);
  if (words.length >= 8 && new Set(words).size / words.length < 0.4) add(25, 'Repeated words');

  /* behaviour: copy-paste and flooding */
  if (Array.isArray(o.recent)) {
    const now = o.now || Date.now();
    const key = spamKey(raw);
    if (key.length >= 8) {
      const same = o.recent.filter((r) => r.key === key && now - r.at < 10 * 60 * 1000).length;
      if (same >= 2) add(70, 'Same text posted more than once');
      else if (same === 1) add(40, 'Same text posted more than once');
    }
    const lastHalfMinute = o.recent.filter((r) => now - r.at < 30 * 1000).length;
    if (lastHalfMinute >= 3) add(40, 'Posting too quickly'); /* 4th attempt within 30 seconds */
  }

  score = Math.min(100, score);
  const verdict = score >= SPAM_BLOCK_AT ? 'block' : score >= SPAM_FLAG_AT ? 'flag' : 'ok';
  return { score, verdict, reasons, matches };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeSpam, spamKey, spamNormalize, spamFindLinks, SPAM_FLAG_AT, SPAM_BLOCK_AT };
}
