# Married In Moments

Marketing website for **Married In Moments** — quick, legal, stress-free wedding officiating in Beaverton, OR, serving the Portland Metro and surrounding counties.

Modeled (with permission) after Married in Minutes (TX), adapted for Oregon law.

## Stack
- Static HTML/CSS/JS (no build step) — deploy to Vercel like ORF / TNLLC
- Bookings: Acuity embed on `book.html`
- Payments: Square
- Lead capture: website form → Supabase → Make → email (to wire at deploy)

## Pages
- `index.html` — home (hero, packages, process, Oregon good-to-knows, service area, gallery, email capture)
- `services.html` — package detail
- `book.html` — Acuity scheduler placeholder
- `contact.html` — contact + lead form
- `terms.html` — Oregon-adapted policies
- `styles.css` — shared styles (rose / coral / cream palette)
- `main.js` — mobile nav

## Packages
- Just the Two of Us — from $125 (license signing; we provide the 2 witnesses Oregon requires)
- The Minute Chapel — from $175 (styled elopement at 20001 SW TV Hwy, Beaverton)
- Simply Eloped — $250 (mini ceremony at client location, up to 20 guests)

## Gallery images (add to `/images`)
Nine slots wired in `index.html`; add these JPGs (AI-generated in Canva):
`couple-black.jpg`, `couple-white.jpg`, `couple-asian.jpg`,
`couple-samesex-women.jpg`, `couple-older.jpg`, `couple-samesex-men.jpg`,
`couple-military.jpg`

## TODO
- Add the 7 gallery photos to `/images`
- Quo phone number (placeholder in footer/contact until live)
- `info@marriedinmoments.com` inbox
- Wire Acuity embed + Square + lead pipeline
- `git init`, push to GitHub, connect Vercel, point `marriedinmoments.com`
