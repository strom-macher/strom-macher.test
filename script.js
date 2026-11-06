/* strom-macher – Tabs, PV-Überschlag, Mobilmenü, Kontaktformular */
(function () {
  'use strict';

  // Mobilmenü
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Projekt-Tabs
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.documentElement.classList.add('proj-interacted');
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
    });
  });

  // PV-Überschlag
  var f = document.getElementById('r-flaeche');
  var v = document.getElementById('r-verbrauch');
  var speicher = document.getElementById('r-speicher');
  var wallbox = document.getElementById('r-wallbox');
  var nf = new Intl.NumberFormat('de-AT');

  function pressed(btn) { return btn.getAttribute('aria-pressed') === 'true'; }

  function rechne() {
    var flaeche = +f.value, verbrauch = +v.value;
    var s = pressed(speicher), w = pressed(wallbox);
    var kwp = flaeche / 5.2;
    var ertrag = kwp * 1050;
    var quote = s ? (w ? 0.72 : 0.65) : (w ? 0.38 : 0.30);
    var eigen = Math.min(ertrag * quote, verbrauch * 0.92);
    var ersparnis = eigen * 0.25 + Math.max(ertrag - eigen, 0) * 0.06;

    document.getElementById('out-flaeche').textContent = flaeche + ' m²';
    document.getElementById('out-verbrauch').textContent = nf.format(verbrauch) + ' kWh';
    document.getElementById('out-kwp').textContent = kwp.toFixed(1).replace('.', ',') + ' kWp';
    document.getElementById('out-ertrag').textContent = nf.format(Math.round(ertrag / 100) / 10) + ' MWh';
    document.getElementById('out-ersparnis').textContent = '€ ' + nf.format(Math.round(ersparnis / 10) * 10);
    document.getElementById('out-quote').textContent = Math.round(quote * 100) + ' %';
  }

  if (f && v) {
    [f, v].forEach(function (el) { el.addEventListener('input', rechne); });
    [speicher, wallbox].forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.setAttribute('aria-pressed', pressed(btn) ? 'false' : 'true');
        rechne();
      });
    });
    rechne();
  }

  // Kleine „Danke“-Bubble nach erfolgreichem Absenden (verschwindet nach ca. 3 Sekunden von selbst).
  var toastTimer = null;
  function showToast(text) {
    var toast = document.getElementById('sm-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sm-toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    // Reflow erzwingen, damit die Einblend-Animation auch bei Wiederholung läuft.
    toast.classList.remove('is-visible');
    void toast.offsetWidth;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 3000);
  }


  // Logo = Home-Button: auf der Startseite sanft nach ganz oben, sonst normaler Link zur Startseite.
  var brandLink = document.querySelector('a.brand');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (brandLink && brandLink.getAttribute('href') === '#top') {
    brandLink.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (window.history && history.replaceState) { history.replaceState(null, '', location.pathname + location.search); }
    });
  }

  // Bild-Ansicht (Lightbox): Klick auf ein Foto vergrößert es, der Hintergrund wird unscharf.
  var zoomImgs = Array.prototype.slice.call(document.querySelectorAll('.hero-photo img, .service .media img, .card img, .team img'));
  if (zoomImgs.length) {
    var lb = null, lbImg, lbCap, lbPrev, lbNext, lbClose;
    var group = [], idx = 0, openThumb = null, lastFocus = null, isOpen = false, closing = false;

    function groupOf(img) {
      var host = img.closest('.panel-projects') || img.closest('.services');
      if (!host) { return [img]; }
      return Array.prototype.slice.call(host.querySelectorAll('img')).filter(function (i) { return zoomImgs.indexOf(i) !== -1; });
    }

    function build() {
      lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.hidden = true;
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.setAttribute('aria-label', 'Bildansicht');
      lb.innerHTML =
        '<button type="button" class="lb-btn lb-close" aria-label="Schließen"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
        '<button type="button" class="lb-btn lb-prev" aria-label="Vorheriges Bild"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<figure class="lb-figure"><img class="lb-img" alt="" /><figcaption class="lb-cap"></figcaption></figure>' +
        '<button type="button" class="lb-btn lb-next" aria-label="Nächstes Bild"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
      document.body.appendChild(lb);
      lbImg = lb.querySelector('.lb-img');
      lbCap = lb.querySelector('.lb-cap');
      lbPrev = lb.querySelector('.lb-prev');
      lbNext = lb.querySelector('.lb-next');
      lbClose = lb.querySelector('.lb-close');
      lbClose.addEventListener('click', close);
      lbPrev.addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
      lbNext.addEventListener('click', function (e) { e.stopPropagation(); step(1); });
      lb.addEventListener('click', function (e) { if (!e.target.closest('.lb-prev, .lb-next')) { close(); } });
    }

    function thumbTransform(thumb) {
      // Transformation, die das große Bild optisch auf die Position der Vorschau setzt.
      var t = thumb.getBoundingClientRect(), f = lbImg.getBoundingClientRect();
      if (!t.width || !f.width || t.bottom < 0 || t.top > window.innerHeight || t.right < 0 || t.left > window.innerWidth) { return null; }
      var s = t.width / f.width;
      var dx = (t.left + t.width / 2) - (f.left + f.width / 2);
      var dy = (t.top + t.height / 2) - (f.top + f.height / 2);
      return 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
    }

    function fill(thumb) {
      var src = thumb.currentSrc || thumb.src;
      lbImg.src = src;
      lbImg.alt = thumb.alt || '';
      lbCap.textContent = thumb.alt || '';
      lbImg.style.setProperty('--lb-w', (thumb.naturalWidth || 1400) + 'px');
      var multi = group.length > 1;
      lbPrev.hidden = !multi;
      lbNext.hidden = !multi;
    }

    function open(thumb) {
      if (isOpen) { return; }
      if (!lb) { build(); }
      group = groupOf(thumb);
      idx = group.indexOf(thumb);
      openThumb = thumb;
      lastFocus = document.activeElement;
      isOpen = true; closing = false;

      var sbw = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      if (sbw > 0) { document.body.style.paddingRight = sbw + 'px'; }

      lbImg.classList.remove('is-settled');
      lbImg.style.transform = '';
      fill(thumb);
      lb.hidden = false;
      lb.classList.remove('is-open');

      var show = function () {
        var tf = thumbTransform(thumb);
        lbImg.style.transform = tf || 'scale(.96)';
        void lbImg.offsetWidth;
        lb.classList.add('is-open');
        lbImg.classList.add('is-settled');
        lbImg.style.transform = 'none';
        lbClose.focus({ preventScroll: true });
      };
      if (lbImg.decode) { lbImg.decode().then(show, show); } else { show(); }
    }

    function finish() {
      lb.hidden = true;
      lb.classList.remove('is-open');
      lbImg.classList.remove('is-settled');
      document.documentElement.style.overflow = '';
      document.body.style.paddingRight = '';
      isOpen = false; closing = false;
      if (lastFocus && lastFocus.focus) { lastFocus.focus({ preventScroll: true }); }
    }

    function close() {
      if (!isOpen || closing) { return; }
      closing = true;
      var tf = thumbTransform(openThumb);
      lb.classList.remove('is-open');
      lbImg.style.transform = tf || 'scale(.96)';
      lbImg.style.opacity = '0';
      var done = false;
      var end = function () { if (done) { return; } done = true; lbImg.style.opacity = ''; finish(); };
      lbImg.addEventListener('transitionend', function h(e) { if (e.propertyName === 'transform' || e.propertyName === 'opacity') { lbImg.removeEventListener('transitionend', h); end(); } });
      setTimeout(end, 420);
    }

    function step(dir) {
      if (group.length < 2 || closing) { return; }
      idx = (idx + dir + group.length) % group.length;
      openThumb = group[idx];
      lbImg.style.opacity = '0';
      lbCap.style.opacity = '0';
      setTimeout(function () {
        fill(openThumb);
        var show = function () { lbImg.style.opacity = ''; lbCap.style.opacity = ''; };
        if (lbImg.decode) { lbImg.decode().then(show, show); } else { show(); }
      }, 120);
    }

    document.addEventListener('keydown', function (e) {
      if (!isOpen) { return; }
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight') { step(1); }
      else if (e.key === 'ArrowLeft') { step(-1); }
      else if (e.key === 'Tab') {
        var f = Array.prototype.slice.call(lb.querySelectorAll('button')).filter(function (b) { return !b.hidden; });
        if (!f.length) { return; }
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    zoomImgs.forEach(function (img) {
      img.classList.add('zoomable');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Bild vergrößern' + (img.alt ? ': ' + img.alt : ''));
      img.addEventListener('click', function () { open(img); });
      img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
    });
  }

  // Kontaktformular: sendet die Anfrage direkt in die strom-macher-App (Supabase-Funktion „anfrage“).
  // Dort: Spam-Prüfung, Eintrag im Vertrieb, Mail ans Büro und Eingangsbestätigung an den Kunden.
  var ANFRAGE_URL = 'https://wwqzqsaykptvwgrjwsxn.supabase.co/functions/v1/anfrage';

  var form = document.getElementById('anfrage');
  if (form) {
    var shownAt = Date.now();
    var statusEl = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');
    var leistungEl = form.querySelector('#f-leistung');
    var urgentEl = document.getElementById('form-urgent');
    function isUrgent() { return !!leistungEl && /Störung/.test(leistungEl.value); }
    if (leistungEl && urgentEl) {
      leistungEl.addEventListener('change', function () { urgentEl.hidden = !isUrgent(); });
    }
    var successText = 'Danke! Eure Anfrage ist bei uns angekommen. Ihr bekommt gleich eine Bestätigung per E-Mail – wir melden uns spätestens am nächsten Werktag.';
    var successUrgentText = 'Danke! Eure Meldung ist angekommen. Bei einer akuten Störung ruft bitte zusätzlich unsere Hotline an: +43 664 11 09 721.';
    var failText = 'Das hat leider nicht geklappt. Schreibt uns direkt an pv@strom-macher.at oder ruft an: +43 664 11 09 721.';
    function val(id) { return ((form.querySelector(id) || {}).value || '').trim(); }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        name: val('#f-name'), email: val('#f-email'), telefon: val('#f-telefon'), plzort: val('#f-plzort'),
        leistung: (leistungEl || {}).value || '', nachricht: val('#f-nachricht'), firma: val('#f-firma'),
        t: Date.now() - shownAt
      };
      if (!data.name || !data.email || !data.plzort || !data.nachricht) {
        if (statusEl) { statusEl.textContent = 'Bitte Name, E-Mail, PLZ und Ort sowie ein paar Worte zur Sache ausfüllen.'; }
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; }
      if (statusEl) { statusEl.textContent = 'Einen Moment, eure Anfrage wird gesendet …'; }

      fetch(ANFRAGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (j) {
            if (!res.ok || !j.ok) { var err = new Error(j.msg || ('Status ' + res.status)); err.userMsg = j.msg; throw err; }
          });
        })
        .then(function () {
          var wasUrgent = isUrgent();
          form.reset();
          shownAt = Date.now();
          if (urgentEl) { urgentEl.hidden = true; }
          if (statusEl) { statusEl.textContent = wasUrgent ? successUrgentText : successText; }
          showToast('Danke – wir melden uns!');
        })
        .catch(function (err) {
          console.error('Kontaktformular-Fehler:', err);
          if (statusEl) { statusEl.textContent = err.userMsg || failText; }
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; }
        });
    });
  }
})();

// build 2
