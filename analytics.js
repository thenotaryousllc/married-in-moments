// analytics.js — site analytics for marriedinmoments.com (PostHog, same project as oregonfingerprints.com).
// Loaded on every public page: <script src="/analytics.js" defer></script>
// Tracks page views, where visitors came from, and the actions that turn into appointments.
// No session recording. Added Nov 3, 2026.
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags onFeatureFlags onSessionId identify setPersonProperties group resetGroups reset get_distinct_id get_session_id alias set_config opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

// Internal-traffic filter (Nov 3, 2026): your own devices and Claude's test browser
// stay out of the numbers. Visit any page with ?internal=1 once on each of your devices
// to exclude it for good; ?internal=0 turns it back on.
var __optin = false;
var __internal = /Claude|HeadlessChrome|Playwright|Lighthouse/i.test(navigator.userAgent);
try {
  var __q = new URLSearchParams(location.search);
  if (__q.get("internal") === "1") localStorage.setItem("nq_internal", "1");
  if (__q.get("internal") === "0") { localStorage.removeItem("nq_internal"); __optin = true; }
  if (localStorage.getItem("nq_internal") === "1") __internal = true;
} catch (e) {}

posthog.init("phc_AkgBdef2eDef963GLMGc5GZycohJvr4RzYL4PAMu6jNZ", {
  api_host: "https://us.i.posthog.com",
  person_profiles: "identified_only",
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: true,
  disable_session_recording: true,
  opt_out_capturing_by_default: __internal
});
if (__internal) posthog.opt_out_capturing(); else if (__optin) posthog.opt_in_capturing();
posthog.register({ site: "marriedinmoments.com", brand: "Married In Moments" });

// Conversion clicks — the numbers that matter for bookings.
document.addEventListener("click", function (ev) {
  var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
  if (!a) return;
  var href = a.getAttribute("href") || "";
  var label = (a.textContent || "").trim().slice(0, 80);
  var page = location.pathname;
  if (/^tel:/i.test(href)) {
    posthog.capture("call_click", { number: href.replace(/^tel:/i, ""), link_text: label, page: page });
  } else if (/^sms:/i.test(href)) {
    posthog.capture("text_click", { link_text: label, page: page });
  } else if (/^mailto:/i.test(href)) {
    posthog.capture("email_click", { link_text: label, page: page });
  } else if (/google\.com\/maps|maps\.google|maps\.app\.goo\.gl/i.test(href)) {
    posthog.capture("directions_click", { link_text: label, page: page });
  } else if (/(^|\/)book(\.html)?($|[?#])/i.test(href) || /acuityscheduling\.com/i.test(href)) {
    posthog.capture("booking_click", { destination: "mim_book", link_text: label, page: page });
  }
}, true);
