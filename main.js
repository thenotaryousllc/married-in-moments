// Married In Moments — mobile nav toggle
// Full-screen overlay menu: opaque, scroll-locked, X to close, Escape to close.
// Runs on every page (all pages load main.js), so the fix is sitewide.
(function () {
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  // Inject the X close button so all pages get it without editing each HTML file.
  var close = links.querySelector('.nav-close');
  if (!close) {
    close = document.createElement('button');
    close.className = 'nav-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close menu');
    close.innerHTML = '&times;';
    links.insertBefore(close, links.firstChild);
  }

  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'navLinks');

  function openMenu() {
    links.classList.add('open');
    document.body.classList.add('nav-open');   // scroll lock behind the overlay
    toggle.setAttribute('aria-expanded', 'true');
    close.focus();
  }

  function closeMenu(returnFocus) {
    links.classList.remove('open');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', function () {
    if (links.classList.contains('open')) closeMenu(true);
    else openMenu();
  });

  close.addEventListener('click', function () { closeMenu(true); });

  Array.prototype.forEach.call(links.querySelectorAll('a'), function (a) {
    a.addEventListener('click', function () { closeMenu(false); });
  });

  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && links.classList.contains('open')) {
      closeMenu(true);
    }
  });

  // If the viewport grows back to desktop while the menu is open, reset cleanly.
  window.addEventListener('resize', function () {
    if (window.innerWidth > 960 && links.classList.contains('open')) closeMenu(false);
  });
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
    set('form_ts', String(Date.now())); // bot check: real browsers run this script
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

// Contact form — accessible inline validation (EN/ES)
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;

  // Error text in the couple's ceremony language (English, Spanish, or both for bilingual)
  var MSG = {
    name:         ['Please enter your name.', 'Por favor escriba su nombre.'],
    email:        ['Please enter a valid email address, like name@email.com.', 'Por favor escriba un correo electrónico válido, por ejemplo nombre@correo.com.'],
    wedding_date: ['Please choose your wedding date — your best guess is fine.', 'Por favor elija la fecha de su boda — una fecha aproximada está bien.'],
    message:      ['Please tell us a little about your ceremony.', 'Por favor cuéntenos un poco sobre su ceremonia.']
  };
  function text(key) {
    var lang = (form.querySelector('[name="language"]') || {}).value || 'English';
    var m = MSG[key];
    if (lang === 'Español') return m[1];
    if (lang.indexOf('Bilingual') === 0) return m[0] + ' / ' + m[1];
    return m[0];
  }

  function errEl(input) {
    var id = input.id + '-err';
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('p');
      el.id = id;
      el.className = 'field-error';
      el.hidden = true;
      input.parentNode.appendChild(el);
      var d = (input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
      if (d.indexOf(id) < 0) d.push(id);
      input.setAttribute('aria-describedby', d.join(' '));
    }
    return el;
  }
  function invalid(input) {
    if (input.type === 'email') return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    return !input.value.trim();
  }
  function show(input) {
    var el = errEl(input);
    var lang = (form.querySelector('[name="language"]') || {}).value || 'English';
    el.setAttribute('lang', lang === 'Español' ? 'es' : 'en');
    el.textContent = text(input.name);
    el.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  }
  function clear(input) {
    var el = document.getElementById(input.id + '-err');
    if (el) { el.hidden = true; el.textContent = ''; }
    input.removeAttribute('aria-invalid');
  }

  var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));
  form.setAttribute('novalidate', ''); // JS is running, so we show our own clearer messages
  required.forEach(function (input) {
    input.addEventListener('blur', function () { if (input.getAttribute('aria-invalid') === 'true' && !invalid(input)) clear(input); });
    input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true' && !invalid(input)) clear(input); });
  });

  form.addEventListener('submit', function (e) {
    var first = null;
    required.forEach(function (input) {
      if (invalid(input)) { show(input); if (!first) first = input; } else clear(input);
    });
    if (first) { e.preventDefault(); first.focus(); return; }
    var btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  });

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
    '<p class="newsletter-msg" role="status" aria-live="polite" style="margin:10px 0 0;font-size:.88rem"></p>' +
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
          msg.textContent = 'You’re on the list! Check your inbox for a little welcome note.';
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

// Homepage "Join the List" form (and any form marked data-newsletter) → same /api/newsletter endpoint
(function () {
  document.querySelectorAll('form[data-newsletter]').forEach(function (form) {
    var msg = form.parentNode.querySelector('.capture-msg');
    var say = function (t) { if (msg) msg.textContent = t; };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[name="email"]');
      var email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        input.setAttribute('aria-invalid', 'true');
        say('Please enter a valid email address.');
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      var btn = form.querySelector('button');
      btn.disabled = true;
      say('One moment…');
      fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          company_website: (form.querySelector('input[name="company_website"]') || {}).value || '',
          landing: location.pathname,
          source: 'mim-homepage'
        })
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok) {
            form.hidden = true;
            say('You’re on the list! Check your inbox for a little welcome note.');
          } else {
            btn.disabled = false;
            say((res.d && res.d.error) || 'Something went wrong — please try again.');
          }
        })
        .catch(function () {
          btn.disabled = false;
          say('Something went wrong — please try again.');
        });
    });
  });
})();
