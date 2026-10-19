// Public form settings for the contact page. The Turnstile SITE key is public by design;
// the SECRET key never leaves the server (api/_spam.js). Returns {} until the keys are set.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json({ turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || null });
}
