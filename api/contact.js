// Married In Moments — contact form handler (Vercel serverless).
// Pattern cloned from oregonfingerprints.com: form POST → Make webhook (emails Shavon
// + Pushover ping) → Supabase insert → redirect back with ?sent=1.
//
// Env vars (Vercel → married-in-moments → Settings → Environment Variables):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (same Supabase project as ORF)
//   MIM_MAKE_WEBHOOK (optional) overrides the webhook below
// Table: public.mim_contacts. Make scenario: "MIM Website Lead → Email + Pushover Alert".
//
// Spam protection (Oct 2026) — 3 layers, all fail OPEN (when unsure, the couple's inquiry is delivered):
//   1. Honeypot (company_website) — filled = bot, dropped silently.
//   2. Dropdown/timing checks below (bots that skip the browser).
//   3. Vendor/SEO content filter (api/_spam.js) — matches go to Supabase public.mim_quarantine,
//      NOT emailed. Borderline messages get a Claude Haiku "couple or vendor?" check (ANTHROPIC_API_KEY).
// Keyword lists live in api/_spam.js.

import { scoreSubmission, askHaiku } from './_spam.js';

const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).send('Method not allowed'); return; }

  const b = req.body || {};
  const origin = 'https://' + (req.headers.host || 'marriedinmoments.com');
  const done = () => { res.writeHead(302, { Location: origin + '/contact.html?sent=1' }); res.end(); };

  // Honeypot: real people leave this blank.
  if (b.company_website) { done(); return; }

  // Hard bot check: service/language must match the form's dropdowns exactly.
  // Bots that scrape the raw HTML send "Simply Eloped &mdash; $400" (with the entity
  // code) — a real browser never does. Silently drop those.
  const SERVICES = ['Drive-Thru "I Do" — from $125', 'Just the Two of Us — from $150',
    'The Minute Chapel — from $225', 'Simply Eloped — $400', 'Not sure yet'];
  const LANGUAGES = ['English', 'Español', 'Bilingual / Bilingüe (English + Español)'];
  if (b.service && !SERVICES.includes(b.service)) { done(); return; }
  if (b.language && !LANGUAGES.includes(b.language)) { done(); return; }

  // Wedding date (required on the form). Only a real YYYY-MM-DD date is kept.
  const weddingDate = /^\d{4}-\d{2}-\d{2}$/.test(String(b.wedding_date || '')) ? String(b.wedding_date) : '';

  // Layer 3: vendor/SEO content filter → quarantine instead of email.
  const check = scoreSubmission({ ...b, wedding_date: weddingDate });
  let aiVerdict = null;
  if (check.verdict === 'borderline') aiVerdict = await askHaiku(b);
  const quarantine = check.verdict === 'quarantine' || aiVerdict === 'VENDOR';

  // Soft bot signals: still delivered (never lose a real couple), but flagged.
  //  - form_ts is set by main.js, so a missing one means the page never ran in a browser
  //  - under 3 seconds from page load to submit is faster than a human can type
  //  - the name has digits in it (e.g. NAERTERHTE423196NERTHRRTH)
  const ts = Number(b.form_ts);
  const likelySpam = !ts || (Date.now() - ts) < 3000 || /\d/.test(String(b.name || '')) ||
    (check.verdict === 'borderline' && aiVerdict !== 'COUPLE');

  // Ceremony language (English / Español / Bilingual) — emailed only; not a mim_contacts column.
  const language = String(b.language || '').slice(0, 60);

  const row = {
    name: (b.name || '').slice(0, 200),
    email: (b.email || '').slice(0, 200),
    phone: (b.phone || '').slice(0, 60),
    service: (b.service || '').slice(0, 120),
    message: (b.message || '').slice(0, 4000),
    utm_source: (b.utm_source || '').slice(0, 120),
    utm_medium: (b.utm_medium || '').slice(0, 120),
    utm_campaign: (b.utm_campaign || '').slice(0, 120),
    referrer: (b.referrer || '').slice(0, 300),
    landing: (b.landing || '').slice(0, 200),
    wedding_date: weddingDate || null,
    source: 'mim-contact-form'
  };

  const hasDb = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sb = (table, data) => fetch(process.env.SUPABASE_URL + '/rest/v1/' + table, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });

  // Quarantined: log it, send NO email, show the sender the normal thank-you.
  // If the quarantine log fails for any reason, fall through and deliver it (fail open).
  if (quarantine && hasDb) {
    try {
      const q = await sb('mim_quarantine', {
        name: row.name, email: row.email, phone: row.phone, service: row.service, language,
        wedding_date: weddingDate || String(b.wedding_date || '').slice(0, 40), message: row.message,
        reasons: check.reasons, score: check.strong * 10 + check.soft,
        ai_verdict: aiVerdict, landing: row.landing, referrer: row.referrer
      });
      if (q.ok) { done(); return; }
    } catch (e) { /* fall through and deliver */ }
  }

  // Notify Shavon via Make (email + Pushover). The scenario expects prebuilt fields.
  const webhook = process.env.MIM_MAKE_WEBHOOK || 'https://hook.us2.make.com/qmi46skmdru6eboq54htxn8aj18fv2gb';
  const body =
    '<div style="font-family:Georgia,serif;font-size:16px;color:#43323A;line-height:1.6">' +
    '<h2 style="font-family:Georgia,serif;color:#43323A">New Married In Moments inquiry</h2>' +
    '<p><strong>Name:</strong> ' + esc(row.name) + '<br>' +
    '<strong>Email:</strong> <a href="mailto:' + esc(row.email) + '">' + esc(row.email) + '</a><br>' +
    (row.phone ? '<strong>Phone:</strong> <a href="tel:' + esc(row.phone) + '">' + esc(row.phone) + '</a><br>' : '') +
    '<strong>Service:</strong> ' + esc(row.service) + '<br>' +
    (weddingDate ? '<strong>Wedding date:</strong> ' + esc(new Date(weddingDate + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })) + '<br>' : '') +
    (language ? '<strong>Ceremony language:</strong> ' + esc(language) + '</p>' : '</p>') +
    '<p><strong>Message:</strong><br>' + esc(row.message).replace(/\n/g, '<br>') + '</p>' +
    '<p style="color:#8a7580;font-size:13px">Source: marriedinmoments.com contact form' +
    (row.landing ? ' · Landing: ' + esc(row.landing) : '') + '</p></div>';

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        funnel_name: 'mim-contact-form',
        subject: (likelySpam ? '⚠️ Likely spam — ' : '💍 ') + 'MIM inquiry — ' + row.name + (row.service ? ' (' + row.service + ')' : ''),
        body,
        push_title: likelySpam ? 'MIM: likely spam' : 'MIM: new inquiry',
        push_message: row.name + ' — ' + (row.service || 'no service selected') + (language && language !== 'English' ? ' — ' + language : '')
      })
    });
  } catch (e) { /* non-fatal */ }

  if (!hasDb) { done(); return; }

  try {
    const resp = await sb('mim_contacts', row);
    if (resp.ok) { done(); }
    else { const detail = await resp.text(); res.status(502).json({ error: 'Could not save message', detail }); }
  } catch (e) {
    res.status(500).json({ error: 'Server error', detail: String(e) });
  }
}
