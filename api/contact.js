// Married In Moments — contact form handler (Vercel serverless).
// Pattern cloned from oregonfingerprints.com: form POST → Make webhook (emails Shavon
// + Pushover ping) → Supabase insert → redirect back with ?sent=1.
//
// Env vars (Vercel → married-in-moments → Settings → Environment Variables):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (same Supabase project as ORF)
//   MIM_MAKE_WEBHOOK (optional) overrides the webhook below
// Table: public.mim_contacts. Make scenario: "MIM Website Lead → Email + Pushover Alert".

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
    source: 'mim-contact-form'
  };

  // Notify Shavon via Make (email + Pushover). The scenario expects prebuilt fields.
  const webhook = process.env.MIM_MAKE_WEBHOOK || 'https://hook.us2.make.com/qmi46skmdru6eboq54htxn8aj18fv2gb';
  const body =
    '<div style="font-family:Georgia,serif;font-size:16px;color:#43323A;line-height:1.6">' +
    '<h2 style="font-family:Georgia,serif;color:#43323A">New Married In Moments inquiry</h2>' +
    '<p><strong>Name:</strong> ' + esc(row.name) + '<br>' +
    '<strong>Email:</strong> <a href="mailto:' + esc(row.email) + '">' + esc(row.email) + '</a><br>' +
    (row.phone ? '<strong>Phone:</strong> <a href="tel:' + esc(row.phone) + '">' + esc(row.phone) + '</a><br>' : '') +
    '<strong>Service:</strong> ' + esc(row.service) + '</p>' +
    '<p><strong>Message:</strong><br>' + esc(row.message).replace(/\n/g, '<br>') + '</p>' +
    '<p style="color:#8a7580;font-size:13px">Source: marriedinmoments.com contact form' +
    (row.landing ? ' · Landing: ' + esc(row.landing) : '') + '</p></div>';

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        funnel_name: 'mim-contact-form',
        subject: '💍 MIM inquiry — ' + row.name + (row.service ? ' (' + row.service + ')' : ''),
        body,
        push_title: 'MIM: new inquiry',
        push_message: row.name + ' — ' + (row.service || 'no service selected')
      })
    });
  } catch (e) { /* non-fatal */ }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) { done(); return; }

  try {
    const resp = await fetch(process.env.SUPABASE_URL + '/rest/v1/mim_contacts', {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(row)
    });
    if (resp.ok) { done(); }
    else { const detail = await resp.text(); res.status(502).json({ error: 'Could not save message', detail }); }
  } catch (e) {
    res.status(500).json({ error: 'Server error', detail: String(e) });
  }
}
