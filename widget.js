// widget.js — the Married In Moments chat bubble. Drop-in via one <script> tag.
// Served same-origin (/widget.js); calls same-origin /api/chat.
// Brand: rose/coral palette, Montserrat, no emojis (inline SVG icon instead).
(function () {
  var script = document.currentScript;
  var API = new URL(script.src).origin + "/api/chat";

  var brandName = "Married In Moments";
  var accent = "#DD6E80";      // rosy coral (site --peach-deep)
  var accentDeep = "#C4536A";  // deeper rose (site --coral-deep)
  var accentSoft = "#F6D9DD";  // soft peach (site --peach-soft)
  var greeting =
    "Hi there! I can help with our ceremony packages, Oregon marriage licenses, and booking your moment. What would you like to know?";

  var messages = [];
  var sessionId =
    "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);

  // ---- styles ----
  var css = document.createElement("style");
  css.textContent =
    "#nb-bubble{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:" +
    accent +
    ";color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 14px rgba(74,53,64,.3);z-index:99999;transition:background .15s}" +
    "#nb-bubble:hover{background:" + accentDeep + "}" +
    "#nb-panel{position:fixed;bottom:90px;right:20px;width:340px;max-width:92vw;height:460px;max-height:70vh;background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(74,53,64,.3);display:none;flex-direction:column;overflow:hidden;z-index:99999;font-family:'Montserrat',system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
    "#nb-head{background:" +
    accent +
    ";color:#fff;padding:12px 16px;font-weight:600;font-size:15px}" +
    "#nb-log{flex:1;overflow-y:auto;padding:14px;background:#FCF6F3}" +
    ".nb-msg{margin:6px 0;padding:9px 12px;border-radius:12px;max-width:82%;font-size:14px;line-height:1.4;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}" +
    ".nb-user{background:" +
    accentSoft +
    ";margin-left:auto;color:#43323A}" +
    ".nb-bot{background:#fff;border:1px solid #F0E1E3;color:#43323A}" +
    "#nb-input-row{display:flex;border-top:1px solid #F0E1E3}" +
    "#nb-input{flex:1;border:0;padding:12px;font-size:14px;outline:none;font-family:inherit}" +
    "#nb-send{border:0;background:" +
    accent +
    ";color:#fff;padding:0 16px;cursor:pointer;font-size:14px;font-family:inherit}" +
    "#nb-send:hover{background:" + accentDeep + "}" +
    ".nb-bot a{color:" + accent + ";font-weight:600}";
  document.head.appendChild(css);

  // ---- elements ----
  var bubble = document.createElement("div");
  bubble.id = "nb-bubble";
  bubble.innerHTML =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>';
  bubble.setAttribute("role", "button");
  bubble.setAttribute("aria-label", "Open chat with " + brandName);

  var panel = document.createElement("div");
  panel.id = "nb-panel";
  panel.innerHTML =
    '<div id="nb-head">' +
    brandName +
    '</div><div id="nb-log"></div>' +
    '<div id="nb-input-row"><input id="nb-input" placeholder="Type your question..." autocomplete="off"/><button id="nb-send">Send</button></div>';

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  var log = panel.querySelector("#nb-log");
  var input = panel.querySelector("#nb-input");
  var sendBtn = panel.querySelector("#nb-send");

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function linkify(s) {
    var re = /(https?:\/\/[^\s<]+|(?:www\.)?(?:marriedinmoments\.com|thenotaryousllc\.com|oregonfingerprints\.com)(?:\/[^\s<]*)?)/g;
    return escapeHtml(s).replace(re, function (u, _m, offset, full) {
      var prev = offset > 0 ? full.charAt(offset - 1) : "";
      if (!/^https?:\/\//.test(u) && (prev === "@" || /[A-Za-z0-9]/.test(prev))) {
        return u;
      }
      var clean = u.replace(/[.,!?)]+$/, "");
      var href = /^https?:\/\//.test(clean) ? clean : "https://" + clean;
      return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + clean + "</a>";
    });
  }
  function addMsg(text, who) {
    var d = document.createElement("div");
    d.className = "nb-msg " + (who === "user" ? "nb-user" : "nb-bot");
    if (who === "user") { d.textContent = text; }
    else { d.innerHTML = linkify(text); }
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  var opened = false;
  bubble.addEventListener("click", function () {
    var showing = panel.style.display === "flex";
    panel.style.display = showing ? "none" : "flex";
    if (!showing && !opened) {
      opened = true;
      addMsg(greeting, "bot");
    }
    if (!showing) input.focus();
  });

  function send() {
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMsg(text, "user");
    messages.push({ role: "user", content: text });

    var thinking = addMsg("…", "bot");

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages, sessionId: sessionId }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var reply = data.reply || "Sorry, please text or call (971) 715-2212 and we'll help directly.";
        thinking.innerHTML = linkify(reply);
        messages.push({ role: "assistant", content: reply });
      })
      .catch(function () {
        thinking.textContent =
          "Sorry, I hit a snag. Please text or call (971) 715-2212 and we'll help you directly.";
      });
  }

  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") send();
  });
})();
