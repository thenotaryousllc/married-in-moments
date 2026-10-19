// Married In Moments — vendor/SEO spam filter for the contact form.
// Files starting with "_" in /api are NOT deployed as their own endpoints.
//
// HOW IT DECIDES (fail open — a missed real couple costs far more than one spam email):
//   1. Any STRONG vendor pattern in the message      -> quarantine (not emailed)
//   2. Two or more SOFT signals, no strong pattern   -> borderline: ask Claude Haiku
//      "couple or vendor?"; quarantine only if Haiku says VENDOR. Any error -> deliver.
//   3. Anything else                                 -> deliver as normal
//
// TO ADD OR REMOVE A KEYWORD: edit the STRONG or SOFT lists below, commit, push.
// Every pattern is English-only vendor jargon, so Spanish-language inquiries are never
// penalized for being in Spanish. Language choice is never a signal.

// Each entry: [label shown in the quarantine table, regular expression]
export const STRONG = [
  ['SEO', /\bSEO\b/i],
  ['Google rankings', /google\s+(rank|ranking|rankings|first page|page one)/i],
  ['search rankings', /search\s+(engine|rankings?)/i],
  ['backlinks', /back-?links?|link[- ]building|domain authority|guest post/i],
  ['website traffic', /(website|web site|site|organic)\s+traffic/i],
  ['online visibility', /online\s+(visibility|presence|reputation)/i],
  ['custom proposal', /custom\s+(seo|marketing|website|growth)\s+proposal|(prepare|send)\s+(you\s+)?a\s+custom\s+proposal/i],
  ['website audit', /(website|site|seo|free)\s+audit|audit\s+report/i],
  ['improve your website', /(help|improve|grow|boost)\s+your\s+(website|site|business|sales|rankings?)/i],
  ['web design / development pitch', /web\s*(design|development)\s+(services|agency|company)|redesign\s+your\s+(website|site)/i],
  ['marketing pitch', /digital\s+marketing|marketing\s+(agency|services|team)|social\s+media\s+management/i],
  ['lead-gen / data pitch', /\bB2B\b|lead\s+(finder|generation|gen\b)|million\s+(companies|contacts|emails|leads)|email\s+list/i],
  ['product pitch', /designer[- ]style|lookalike|replica\s+(watch|bag)|flawless,?\s+classic\s+watch|\d+%\s+off\s+your\s+(entire\s+)?(cart|order)/i],
  ['addresses the domain, not a couple', /^\s*(hi|hello|hey|dear|greetings)[\s,]+(team\s+)?(https?:\/\/)?(www\.)?marriedinmoments/i],
  ['"Hi Team <domain>"', /\b(hi|hello|dear)\s+team\s+(https?:\/\/)?[a-z0-9-]+\.(com|net|org|co)\b/i],
];

// Wedding words in English AND Spanish — a message with none of these gets a soft flag.
const WEDDING = /wedd|marr|marri|ceremon|elop|officiant|vow|licen[cs]|fianc|bride|groom|partner|husband|wife|engag|anniversar|chapel|boda|casar|casamos|ceremonia|matrimonio|oficiante|novi[oa]|prometid|esposo|esposa|pareja|votos|licencia|aniversario/i;

export function scoreSubmission(b) {
  const msg = String(b.message || '');
  const name = String(b.name || '');
  const email = String(b.email || '').toLowerCase();
  const reasons = [];

  for (const [label, re] of STRONG) if (re.test(msg)) reasons.push(label);
  const strong = reasons.length;

  // SOFT signals — none of these alone ever blocks an inquiry.
  const soft = [];
  if (!b.wedding_date) soft.push('no wedding date');
  if (!WEDDING.test(msg)) soft.push('no ceremony details in message');
  if (/[Ѐ-ӿ一-鿿؀-ۿ]/.test(msg)) soft.push('non-Latin script');
  const otherEmail = (msg.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || []).find((e) => e.toLowerCase() !== email);
  if (otherEmail) soft.push('asks for reply at a different email');
  if (/https?:\/\/|www\./i.test(msg)) soft.push('contains a link');
  if (/^(info|sales|support|marketing|admin|contact|hello|team)@/.test(email)) soft.push('generic business inbox');
  if (/\d/.test(name)) soft.push('digits in name');
  // "brief call this week" is classic vendor phrasing, but a couple could say it too — soft only.
  if (/(brief|quick|short)\s+call\s+(this|next)\s+week/i.test(msg)) soft.push('asks for a call this week');

  let verdict = 'deliver';
  if (strong >= 1) verdict = 'quarantine';
  else if (soft.length >= 2) verdict = 'borderline';

  return { verdict, reasons: reasons.concat(soft), strong, soft: soft.length };
}

// Borderline only: ask Claude Haiku. Returns 'VENDOR', 'COUPLE', or null (unknown -> deliver).
export async function askHaiku(b) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.MIM_SPAM_MODEL || 'claude-haiku-4-5',
        max_tokens: 5,
        system: 'You screen contact-form messages for a wedding officiant business in Portland, Oregon. ' +
          'Couples may write in English, Spanish, or any language, briefly or vaguely. ' +
          'Answer VENDOR only if the sender is clearly selling something to the business (SEO, marketing, web design, leads, data, products) or is an obvious scam. ' +
          'Otherwise answer COUPLE. When unsure, answer COUPLE. Reply with exactly one word.',
        messages: [{ role: 'user', content: 'Name: ' + String(b.name || '').slice(0, 100) +
          '\nEmail: ' + String(b.email || '').slice(0, 100) +
          '\nMessage:\n' + String(b.message || '').slice(0, 2000) }]
      })
    });
    if (!r.ok) return null;
    const d = await r.json();
    const out = String((d.content && d.content[0] && d.content[0].text) || '').toUpperCase();
    return out.includes('VENDOR') ? 'VENDOR' : out.includes('COUPLE') ? 'COUPLE' : null;
  } catch (e) { return null; } finally { clearTimeout(t); }
}
