/* ============================================================
   abuseFilter.js - automated abuse detection for comments.
   Pure functions only (no localStorage, no DOM), like spamFilter.js,
   and it uses the same 0-100 score and the same cut-offs, so the
   two filters can be combined by data.js:

     score <  ABUSE_FLAG_AT   -> 'ok'    posted normally
     score >= ABUSE_FLAG_AT   -> 'flag'  posted, but sent to the
                                         Super Admin review queue
     score >= ABUSE_BLOCK_AT  -> 'block' not posted; logged for the
                                         Super Admin

   It looks for five kinds of abuse, in English and Filipino:
     profanity      strong swearing (block); milder
                    words such as "gago", "bwisit"  (flag)
     insult         name-calling ("stupid", "tanga")  (needs a target
                    to reach the flag level)
     harassment     "shut up", "nobody likes you"     (flag)
     threat         "I will hurt you"                 (block)
     self-harm      telling someone to hurt/kill
                    themselves                        (block)

   Rules add points. A mild insult on its own ("that rule is
   stupid") stays under the flag level; the same word aimed at a
   person ("you are stupid") does not. Words are matched as whole
   words so "class" or "Scunthorpe"-style accidents don't trip it.

   It is a word-list heuristic, not a guarantee: it can't read
   sarcasm or context, so flagged comments go to a human. Edit the
   lists below to fit your school. Needs spamFilter.js loaded first
   (it reuses spamNormalize).
   ============================================================ */

/* In Node (tests) spamNormalize isn't a global, so fetch it. */
if (typeof spamNormalize !== 'function' && typeof require === 'function') {
  try { globalThis.spamNormalize = require('./spamFilter.js').spamNormalize; } catch (e) { /* fall back to the simple normalizer */ }
}

const ABUSE_FLAG_AT = 40;
const ABUSE_BLOCK_AT = 70;
/* Strong swearing is blocked outright (not just flagged). Milder words
   below stay at flag level. Lower this to 40 to flag instead of block. */
const ABUSE_STRONG = ABUSE_BLOCK_AT;

/* [term, points, category, options]
   options.stem       also matches longer words ("fuck" -> "fucking")
   options.targetOnly counts only when the comment is aimed at a
                      person ("you are ugly"), because the word is
                      harmless on its own ("the ugly truth")
   Tiers: ABUSE_STRONG (70) blocks on its own; 30-45 flags when
   combined with a target or another word; 20-25 only adds up.
   To add a word, add it to one of the lists below. Typing the word
   with stretched letters ("fuuuck"), digits or symbols ("f4ck",
   "a$$hole", "sh!t", "f*ck"), dots or spaces ("f.u.c.k") is caught
   automatically, so you only list the plain spelling. */
const ST = { stem: true };
const TG = { targetOnly: true };
const W = (words, points, category, opts) => words.map((w) => [w, points, category, opts]);

const ABUSE_TERMS = [
  /* ---------- strong profanity and vulgar words: English (blocked) ---------- */
  ...W(['fuck', 'motherfuck', 'fuk', 'fck', 'fcuk', 'fvck', 'phuck', 'bitch', 'asshole', 'arsehole', 'cunt', 'slut',
        'whore', 'wanker', 'cocksuck', 'bullshit', 'shithead', 'dickhead', 'twat', 'bollocks', 'blowjob', 'handjob'],
       ABUSE_STRONG, 'profanity', ST),
  ...W(['shit', 'shitty', 'shyt', 'pussy', 'tits', 'dildo', 'stfu', 'fk', 'son of a bitch', 'dumbass', 'cumshot',
        'jerk off', 'jack off', 'suck my dick', 'eat shit'], ABUSE_STRONG, 'profanity'),
  /* milder English swearing (flagged when it adds up or is aimed at someone) */
  ...W(['bastard'], 35, 'profanity', ST),
  ...W(['jackass', 'piss off', 'bugger', 'tosser', 'screw you', 'prick', 'crap', 'damn', 'wtf', 'gtfo', 'boobs'], 35, 'profanity'),
  /* more English: compound swearing, vulgar insults, milder swearing */
  ...W(['dumbfuck', 'clusterfuck', 'mindfuck', 'dipshit', 'horseshit', 'shithole', 'shitface', 'shitbag', 'asswipe',
        'asshat', 'smartass', 'fatass', 'kiss my ass', 'skank', 'cocksucker', 'jerkoff', 'jackoff', 'fuck off',
        'fuck you', 'fuck u', 'sonofabitch', 'douchebag'], ABUSE_STRONG, 'profanity', ST),
  ...W(['scumbag', 'goddamn', 'douche'], 40, 'profanity'),
  ...W(['piss', 'pissed', 'pervert', 'perv', 'sicko', 'cock'], 30, 'profanity'),
  /* "dick" alone is also a first name, so only clear phrases are listed */
  ...W(['you dick', 'dick face', 'dick head'], 40, 'profanity'),

  /* ---------- strong profanity and vulgar words: Tagalog / Filipino (blocked) ---------- */
  ...W(['putangina', 'putang ina', 'potangina', 'tangina', 'tang ina', 'kingina', 'kinangina', 'pukinangina',
        'pukinang ina', 'pukingina', 'taena', 'putragis', 'putcha', 'putsa', 'pucha', 'punyeta', 'punyemas',
        'pakshet', 'pakshit', 'pakingshet', 'pakingshit', 'pakyu', 'pak yu', 'hinayupak', 'tarantado', 'hindot',
        'kantot', 'kantutan', 'jakol', 'jakulin', 'salsal', 'ptngina', 'tnginamo', 'tngina'],
       ABUSE_STRONG, 'profanity', ST),
  ...W(['puta', 'pota', 'potah', 'puki', 'pekpek', 'tamod', 'inamo', 'chupa'], ABUSE_STRONG, 'profanity'),
  ...W(['bwakanang', 'buwakanang', 'putang', 'pokpok', 'kantutin', 'kinantot', 'pinakantot', 'ipakantot'],
       ABUSE_STRONG, 'profanity', ST),
  /* Cebuano / Visayan */
  ...W(['pisti yawa', 'pisting yawa', 'pesteng yawa', 'bilat', 'iyot'], ABUSE_STRONG, 'profanity'),
  /* milder Filipino swearing */
  ...W(['gago', 'gaga', 'gagu', 'ulol', 'siraulo', 'letse', 'leche', 'walang hiya', 'walanghiya', 'kupal',
        'ulupong', 'gunggong', 'hunghang'], 35, 'profanity'),
  ...W(['bwisit', 'buwisit', 'lintik', 'peste'], 30, 'profanity', ST),
  ...W(['mokong', 'lapastangan', 'hampaslupa', 'impakto', 'patay gutom', 'patay-gutom'], 30, 'profanity'),
  ...W(['pwet', 'puwet', 'pwetan'], 20, 'profanity'),
  ...W(['bwiset', 'buset', 'ungas', 'mangmang'], 30, 'profanity'),
  ...W(['shet', 'bayag', 'burat', 'titi', 'etits', 'otok', 'yawa', 'giatay', 'abnoy'], 40, 'profanity'),

  /* ---------- hateful or discriminatory slurs (blocked) ---------- */
  ...W(['nigger', 'nigga', 'faggot', 'retard'], ABUSE_STRONG, 'hate', ST),
  ...W(['fag', 'tranny', 'chink', 'spic', 'kike', 'dyke', 'coon', 'wetback', 'beaner', 'gook', 'spaz', 'mongoloid'], ABUSE_STRONG, 'hate'),

  /* ---------- insults and name-calling: English ---------- */
  ...W(['stupid', 'dumb', 'pathetic', 'psycho', 'jerk', 'dumbo'], 25, 'insult'),
  ...W(['idiot', 'moron', 'creep'], 30, 'insult', ST),
  ...W(['loser'], 25, 'insult', ST),
  ...W(['imbecile', 'worthless', 'good for nothing', 'scum'], 30, 'insult'),
  ...W(['ugly', 'fat', 'trash', 'useless', 'disgusting', 'garbage', 'stinky', 'freak', 'weirdo', 'pig', 'brat',
        'suck', 'sucks', 'liar'], 25, 'insult', TG),
  ...W(['clown'], 20, 'insult', TG),
  /* ---------- insults and name-calling: Tagalog / Filipino ---------- */
  ...W(['tanga', 'tnga', 'bobo', 'engot', 'inutil', 'baliw ka', 'walang utak'], 30, 'insult'),
  ...W(['walang kwenta'], 25, 'insult'),
  ...W(['hayop ka', 'animal ka', 'demonyo ka'], 40, 'insult'),
  ...W(['pangit', 'baboy', 'bulok', 'mataba', 'dugyot', 'epal', 'sinungaling', 'unggoy', 'bastos', 'tae'], 25, 'insult', TG),
  ...W(['payat'], 20, 'insult', TG),
  ...W(['buang', 'boang'], 30, 'insult'),
  ...W(['boba', 'sira ulo', 'sira-ulo', 'abnormal ka', 'mukhang pera'], 30, 'insult'),
  ...W(['higad', 'malandi', 'haliparot', 'bruha', 'loko loko'], 25, 'insult', TG),

  /* ---------- harassment and bullying ---------- */
  ...W(['shut up', 'tumahimik ka', 'manahimik ka'], 35, 'harassment'),
  ...W(['shut your mouth', 'magtigil ka', 'tumigil ka na', 'ang pangit mo', 'kadiri ka', 'walang pumapansin sa iyo',
        'walang pumapansin sayo', 'walang nagmamahal sa iyo', 'walang nagmamahal sayo'], 40, 'harassment'),
  ...W(['nobody likes you', 'no one likes you', 'everyone hates you', 'nobody cares about you',
        'walang may gusto sa iyo', 'walang may gusto sayo', 'kinasusuklaman ka'], 45, 'harassment'),
  ...W(['you are nothing'], 40, 'harassment'),
  ...W(['send nudes'], 80, 'harassment'),

  /* ---------- threats (blocked) ---------- */
  ...W(['kill you', 'i will kill', 'ill kill', 'gonna kill', 'i will hurt', 'beat you up', 'i will find you',
        'sasaktan kita', 'bugbugin kita', 'susugurin kita', 'ipapabugbog kita'], 80, 'threat'),
  ...W(['hurt you', 'wait for you after school', 'upakan kita', 'abangan kita'], 70, 'threat'),
  ...W(['i know where you live'], 90, 'threat'),
  ...W(['papatayin kita', 'patayin kita', 'ipapapatay kita', 'sasaksakin kita', 'babarilin kita', 'rape you',
        'i will rape', 'gagahasain kita'], 100, 'threat'),
  ...W(['sasapakin kita', 'susuntukin kita', 'tatadyakan kita', 'sisipain kita', 'bubugbugin kita', 'hahampasin kita',
        'sasampalin kita', 'pagbabayarin kita', 'ipapahamak kita', 'gagantihan kita', 'puputulan kita', 'sasabunutan kita'], 70, 'threat'),
  ...W(['ililibing kita', 'ihahampas kita', 'tatamaan ka sa akin'], 100, 'threat'),
  ...W(['see you after school'], 40, 'threat'),
  ...W(['humanda ka'], 60, 'threat'),

  /* ---------- encouraging self-harm (blocked) ---------- */
  ...W(['kill yourself', 'kill urself', 'hope you die', 'you should die', 'i hope you die', 'mamatay ka na',
        'sana mamatay ka', 'magpakamatay ka'], 100, 'self-harm'),
  ...W(['go die', 'go and die', 'mamatay ka', 'magbigti ka', 'maglaslas ka', 'tumalon ka na', 'magpakamatay na lang ka'], 90, 'self-harm')
];

/* Innocent phrases that contain a listed word. They are removed from
   the text before it is checked. */
/* Ordinary words that would look like a listed word after letters are
   squeezed ("sheet" -> "shet"). Removed from the raw text first. */
const ABUSE_SAFE_RE = /\b(?:(?:spread|work|time|bed|cheat|balance|answer|score|data|fact|info|attendance|grade|activity|music|song|answer)?\s?sheets?)\b/gi;

const ABUSE_EXCEPTIONS = ['leche flan', 'cum laude', 'magna cum laude', 'summa cum laude', 'pussy cat', 'pussycat'];

/* Text-level pieces of the label shown to people. */
const ABUSE_LABELS = {
  profanity: 'Profanity, swearing or vulgar language',
  hate: 'Hateful or discriminatory language',
  insult: 'Insults or name-calling',
  harassment: 'Harassment or bullying',
  threat: 'Threat or intimidation',
  'self-harm': 'Telling someone to hurt themselves'
};

/* Words that show a comment is aimed at someone. Matched against the
   normalized text (lower-case, doubled letters squeezed). */
const ABUSE_TARGET_RE = /(?:^| )(?:you|youre|your|yours|yourself|ur|u|ikaw|ka|mo|kayo|niyo|kayong|kang|teacher|maam|ma am|sir|tita|tito|classmate|kuya|ate)(?: |$)/;

/* ---------- normalization ---------- */

/* Single-word terms, strongest first, used to repair masked words. */
const ABUSE_SINGLE_TERMS = ABUSE_TERMS.filter((t) => t[0].indexOf(' ') < 0).sort((a, b) => b[1] - a[1]).map((t) => t[0]);

function abuseEscape(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/* "f*ck" -> "fuck". A word with * or # inside is matched against the
   word list (the * stands for one letter); the strongest fit wins. */
function abuseUnmask(tok) {
  if (!/[*#]/.test(tok)) return tok;
  const trimmed = tok.replace(/^[^\p{L}*#]+|[^\p{L}*#]+$/gu, '');
  if (!/\p{L}/u.test(trimmed)) return tok;
  const re = new RegExp('^' + abuseEscape(trimmed).replace(/\\\*|#/g, '\\p{L}') + '$', 'iu');
  const fit = ABUSE_SINGLE_TERMS.find((t) => re.test(t));
  return fit || tok;
}

/* Joins "f u c k" / "s t u p i d" (three or more single letters in
   a row) into one word. */
function abuseJoinSpaced(tokens) {
  const out = [];
  let run = [];
  const flush = () => { if (run.length >= 3) out.push(run.join('')); else out.push(...run); run = []; };
  tokens.forEach((tok) => {
    if (/^\p{L}$/u.test(tok)) run.push(tok);
    else { flush(); out.push(tok); }
  });
  flush();
  return out;
}

function abuseNormalize(text) {
  let t = String(text == null ? '' : text).normalize('NFKC').replace(/[\u200B-\u200F\u2060\uFEFF]/g, '').toLowerCase();
  t = t.replace(/(?<=\p{L})!(?=\p{L})/gu, 'i'); /* "sh!t" -> "shit" */
  t = abuseJoinSpaced(t.split(/\s+/).filter(Boolean).map(abuseUnmask)).join(' ');
  t = typeof spamNormalize === 'function' ? spamNormalize(t) : t.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  /* "f.u.c.k" became "f u c k" above, so join single letters once more */
  return abuseJoinSpaced(t.split(' ').filter(Boolean)).join(' ');
}

const ABUSE_TERMS_NORM = ABUSE_TERMS.map(([term, points, category, opts]) => ({
  term, points, category,
  stem: !!(opts && opts.stem),
  targetOnly: !!(opts && opts.targetOnly),
  norm: abuseNormalize(term)
}));

const ABUSE_EXCEPTIONS_NORM = ABUSE_EXCEPTIONS.map(abuseNormalize).filter(Boolean);

/* analyzeAbuse(text)
   Returns { score, verdict: 'ok'|'flag'|'block',
             reasons: [plain-language labels], matches: [terms],
             categories: ['profanity', ...], targeted: bool } */
function analyzeAbuse(text) {
  const raw = String(text == null ? '' : text);
  const result = { score: 0, verdict: 'ok', reasons: [], matches: [], categories: [], targeted: false };
  if (!raw.trim()) return result;

  let norm = ' ' + abuseNormalize(raw.replace(ABUSE_SAFE_RE, ' ')) + ' ';
  ABUSE_EXCEPTIONS_NORM.forEach((e) => { norm = norm.split(' ' + e + ' ').join(' '); });
  const targeted = ABUSE_TARGET_RE.test(norm.trim());
  result.targeted = targeted;

  let score = 0;
  let wordHits = 0; /* profanity / insult hits, for the "aimed at a person" bonus */
  const cats = {};
  ABUSE_TERMS_NORM.forEach((p) => {
    if (!p.norm) return;
    if (p.targetOnly && !targeted) return;
    const hit = p.stem ? norm.includes(' ' + p.norm) : norm.includes(' ' + p.norm + ' ');
    if (!hit) return;
    cats[p.category] = (cats[p.category] || 0) + p.points;
    if (p.category === 'profanity' || p.category === 'insult') wordHits++;
    if (result.matches.indexOf(p.term) < 0) result.matches.push(p.term);
  });

  /* each category is capped so a pile of mild words can't outweigh a threat */
  Object.keys(cats).forEach((k) => { score += Math.min(cats[k], 100); });
  if (score && wordHits && targeted && !cats.threat && !cats['self-harm']) score += 25;

  /* shouting makes abuse worse */
  if (score) {
    const letters = raw.match(/\p{L}/gu) || [];
    const upper = raw.match(/\p{Lu}/gu) || [];
    if (letters.length >= 12 && upper.length / letters.length >= 0.7) score += 10;
  }

  score = Math.min(100, score);
  result.score = score;
  result.categories = Object.keys(cats);
  result.reasons = result.categories.map((c) => ABUSE_LABELS[c]);
  if (score && wordHits && targeted && !cats.threat && !cats['self-harm']) result.reasons.push('Aimed at a person');
  result.verdict = score >= ABUSE_BLOCK_AT ? 'block' : score >= ABUSE_FLAG_AT ? 'flag' : 'ok';
  if (result.verdict === 'ok') { result.reasons = []; result.matches = []; result.categories = []; }
  return result;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeAbuse, abuseNormalize, ABUSE_FLAG_AT, ABUSE_BLOCK_AT };
}
