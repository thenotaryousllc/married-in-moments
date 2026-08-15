# Married In Moments — Session Handoff (2026-08-14)

## Session Focus
Built and shipped the county & city SEO pages ("own the space" build). All 10 pages LIVE on marriedinmoments.com, sitemap submitted to Google Search Console.

## ✅ Completed
- **3 county license-guide pages** (statewide-license angle, unique content each, fact-checked against county sites 8/14):
  - `washington-county-marriage-license.html`
  - `multnomah-county-marriage-license.html`
  - `clackamas-county-marriage-license.html`
- **6 city officiant pages** (unique local angle each):
  - `wedding-officiant-beaverton.html` (home turf)
  - `wedding-officiant-portland.html` (un-courthouse angle)
  - `wedding-officiant-hillsboro.html` (license office in your backyard)
  - `wedding-officiant-tigard.html` (10 min up 217)
  - `wedding-officiant-lake-oswego.html` (elegant/no-planning angle)
  - `wedding-officiant-gresham.html` (Simply Eloped "we come to you" angle — featured card)
- **Hub page:** `service-areas.html` ("Areas We Serve") — links all 9 + statewide-license explainer.
- **Wired sitewide:** "Areas We Serve" added to nav + footer on all 5 existing pages; index "Where We Serve" section now links every county/city + hub button.
- **`sitemap.xml`** (15 URLs) + **`robots.txt`** — created and verified live.
- **SEO per page:** unique title/meta, canonical, OG/Twitter cards, JSON-LD ×3 (BreadcrumbList + Service + FAQPage; FAQ schema matches visible FAQ word-for-word — QA-verified programmatically, all checks passed).
- **Deployed:** committed & pushed (note: PowerShell rejects `&` in unclosed quotes — commit message used "and"). Verified live via fetch.
- **Google Search Console:** MIM domain property added — auto-verified via existing Google Workspace domain verification (no DNS work needed). **Sitemap submitted.** Request-indexing suggested for hub + 3 county pages.

## ✅ Also completed (same session, round 2 — SEO/AIO parity pass)
- **All 5 original pages upgraded** to ORF-standard heads: canonical + OG/Twitter on index/services/book/contact/terms.
- **index.html:** full LocalBusiness JSON-LD (@id #business, geo, areaServed = 3 counties + 6 cities, OfferCatalog with all 3 packages/prices). NO aggregateRating/BBB — MIM has no reviews yet; add ratings schema only once real Google reviews exist.
- **services.html:** BreadcrumbList + Service/OfferCatalog schema (all 3 packages with deposits).
- **contact.html:** ContactPage + BreadcrumbList schema. **book.html:** BreadcrumbList.
- **Map section added to homepage** (ORF pattern) — Beaverton service-area Google Maps embed near footer + "See Every Area We Serve" CTA. **Swap embed to the GBP pin once MIM's Google Business Profile exists** (copy ORF's place-embed + ?cid= link pattern).
- Footer "Beaverton, Oregon · By appointment" dead `#` link fixed → links to service-areas.html on all 15 pages.
- Full QA re-run on all 15 pages: PASSED (canonicals, valid JSON-LD, FAQ schema match, no broken/dead links, no truncation).

## 🔑 Key facts locked in (verified 2026-08-14)
- **Washington County license fee is now $85** (raised from $60 on July 1, 2026). Multnomah & Clackamas still **$60**. This price gap + statewide validity is the core marketing hook on all county pages ("apply where it's easiest — or cheapest").
- Oregon license: valid **statewide**, effective **3 days** after application, valid **60 days** (ORS 106.077). Officiant returns license within **5 business days** — MIM handles via priority mailing.
- Waiting-period waivers: WashCo $5 · Clackamas $15 · Multnomah "small fee" (unconfirmed amount — don't state a number).
- Clerk offices: WashCo 155 N First Ave Rm 130 Hillsboro · Multnomah 501 SE Hawthorne #175 Portland (walk-in, M–F 8:30–4) · Clackamas 1710 Red Soils Ct Oregon City (appointment required).

## 📋 Decisions
- URL pattern: counties = `[county]-county-marriage-license.html` (targets license searches); cities = `wedding-officiant-[city].html`. Hub = `service-areas.html`.
- Kept `.html` URLs (no cleanUrls on MIM — matches existing site).
- No public-park venue recommendations on pages (Simply Eloped = private locations only; parks need permits).
- No trust bar / review claims on MIM pages (no reviews yet — nothing borrowed from ORF/TNLLC).

## ⏳ Still open (carried forward)
- **Request indexing** in GSC (URL Inspection) for hub + 3 county pages — fast, high value, not confirmed done.
- **Google Business Profile for MIM** — now the single biggest local-SEO lever remaining.
- Newsletter ("Join the List") + Contact form — still decorative; wire to Supabase → Make → email or simplify.
- Quo number swap when ports complete (site shows (971) 715-2212 — the purchased MIM number).
- www redirect (currently apex-only) — optional.
- Optional later: Clark County WA page (different licensing rules — WA license, not OR; needs its own research).
- Gallery photos still stock; replace with real couples as bookings come in.

## ▶️ Next session should start with
1. Confirm GSC sitemap status = "Success" + request indexing on the 4 priority pages.
2. MIM Google Business Profile setup (category: Wedding service / Officiant; link to service-areas + book pages).
3. Wire contact form + newsletter (Supabase → Make pipeline, same pattern as other sites).
