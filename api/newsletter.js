// Married In Moments — newsletter signup handler (Vercel serverless).
// Fetch-friendly JSON endpoint: saves to Supabase (upsert on email) and pings Make
// so Shavon gets an email + Pushover heads-up.
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MIM_MAKE_WEBHOOK (optional).
// Table: public.mim_newsletter_signups. Make scenario: "MIM Website Lead → Email + Pushover Alert".

const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const b = req.body || {};
  if (b.company_website) { res.status(200).json({ ok: true }); return; } // honeypot

  const email = String(b.email || '').trim().toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  const row = {
    email,
    name: String(b.name || '').slice(0, 200),
    landing: String(b.landing || '').slice(0, 200),
    source: 'mim-newsletter'
  };

  const webhook = process.env.MIM_MAKE_WEBHOOK || 'https://hook.us2.make.com/qmi46skmdru6eboq54htxn8aj18fv2gb';
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        funnel_name: 'mim-newsletter',
        subject: '💌 MIM newsletter signup — ' + email,
        body:
          '<div style="font-family:Georgia,serif;font-size:16px;color:#43323A;line-height:1.6">' +
          '<h2 style="font-family:Georgia,serif;color:#43323A">New newsletter signup</h2>' +
          '<p><strong>Email:</strong> ' + esc(email) + (row.name ? '<br><strong>Name:</strong> ' + esc(row.name) : '') +
          (row.landing ? '<br><strong>Page:</strong> ' + esc(row.landing) : '') + '</p>' +
          '<p style="color:#8a7580;font-size:13px">Source: marriedinmoments.com newsletter form</p></div>',
        push_title: 'MIM: newsletter signup',
        push_message: email
      })
    });
  } catch (e) { /* non-fatal */ }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    const resp = await fetch(
      process.env.SUPABASE_URL + '/rest/v1/mim_newsletter_signups?on_conflict=email',
      {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(row)
      }
    );
    if (resp.ok) { res.status(200).json({ ok: true }); }
    else { const detail = await resp.text(); res.status(502).json({ error: 'Could not save signup', detail }); }
  } catch (e) {
    res.status(500).json({ error: 'Server error', detail: String(e) });
  }
}
