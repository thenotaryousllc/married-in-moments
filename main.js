// Married In Moments — mobile nav toggle
(function () {
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }
})();

// Contact form — fill tracking fields + show the thank-you banner after redirect
(function () {
  var form = document.getElementById('contactForm');
  if (form) {
    var set = function (name, value) {
      var el = form.querySelector('input[name="' + name + '"]');
      if (el && !el.value) el.value = value || '';
    };
    var params = new URLSearchParams(location.search);
    set('referrer', document.referrer);
    set('landing', location.pathname);
    set('utm_source', params.get('utm_source'));
    set('utm_medium', params.get('utm_medium'));
    set('utm_campaign', params.get('utm_campaign'));
  }
  if (new URLSearchParams(location.search).get('sent') === '1') {
    var banner = document.getElementById('formSent');
    if (banner) {
      banner.hidden = false;
      if (form) form.reset();
      banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
})();

// Newsletter signup — injected into the footer on every page
(function () {
  var footer = document.querySelector('.site-footer .wrap');
  if (!footer) return;
  var bottom = footer.querySelector('.footer-bottom');

  var box = document.createElement('div');
  box.className = 'newsletter';
  box.innerHTML =
    '<div class="newsletter-inner">' +
    '<h4 style="margin:0 0 6px">A little love in your inbox</h4>' +
    '<p style="margin:0 0 14px">Marriage license tips, real ceremony moments, and seasonal booking reminders. No spam &mdash; ever.</p>' +
    '<form class="newsletter-form" novalidate>' +
    '<input type="email" name="email" placeholder="you@email.com" required aria-label="Email address">' +
    '<input type="text" name="company_website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">' +
    '<button class="btn btn-primary" type="submit">Sign Up</button>' +
    '</form>' +
    '<p class="newsletter-msg" role="status" style="margin:10px 0 0;font-size:.88rem"></p>' +
    '</div>';
  footer.insertBefore(box, bottom || null);

  var form = box.querySelector('form');
  var msg = box.querySelector('.newsletter-msg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg.textContent = 'Please enter a valid email address.';
      return;
    }
    var btn = form.querySelector('button');
    btn.disabled = true;
    msg.textContent = 'One moment…';
    fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        company_website: form.company_website.value,
        landing: location.pathname
      })
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok) {
          form.hidden = true;
          msg.textContent = 'You’re on the list — welcome! Keep an eye on your inbox.';
        } else {
          btn.disabled = false;
          msg.textContent = (res.d && res.d.error) || 'Something went wrong — please try again.';
        }
      })
      .catch(function () {
        btn.disabled = false;
        msg.textContent = 'Something went wrong — please try again.';
      });
  });
})();
