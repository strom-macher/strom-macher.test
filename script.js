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

  // Kontaktformular: sendet die Anfrage direkt per HubSpot Forms API,
  // damit zuverlässig genau ein Kontakt im HubSpot-CRM angelegt wird.
  var HUBSPOT_PORTAL_ID = '149291029';
  var HUBSPOT_FORM_GUID = 'bebd2361-682d-40b0-9f6e-90ea78a726a1';

  var form = document.getElementById('anfrage');
  if (form) {
    var statusEl = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');
    var defaultStatusText = statusEl ? statusEl.textContent : '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = (form.querySelector('#f-name') || {}).value || '';
      var email = (form.querySelector('#f-email') || {}).value || '';
      var telefon = (form.querySelector('#f-telefon') || {}).value || '';
      var leistung = (form.querySelector('#f-leistung') || {}).value || '';
      var nachricht = (form.querySelector('#f-nachricht') || {}).value || '';

      name = name.trim();
      email = email.trim();
      telefon = telefon.trim();
      nachricht = nachricht.trim();

      var fields = [
        { name: 'firstname', value: name },
        { name: 'email', value: email },
        { name: 'message', value: 'Worum geht es: ' + leistung + '\n\n' + nachricht }
      ];
      if (telefon) { fields.push({ name: 'phone', value: telefon }); }

      if (submitBtn) { submitBtn.disabled = true; }
      if (statusEl) { statusEl.textContent = 'Einen Moment, eure Anfrage wird gesendet …'; }

      fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + HUBSPOT_PORTAL_ID + '/' + HUBSPOT_FORM_GUID, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: fields,
          context: {
            pageUri: window.location.href,
            pageName: document.title
          }
        })
      })
        .then(function (res) {
          if (!res.ok) { throw new Error('HubSpot-Formular hat mit Status ' + res.status + ' geantwortet.'); }
          form.reset();
          if (statusEl) {
            statusEl.textContent = 'Danke! Eure Anfrage ist bei uns angekommen – wir melden uns so schnell wie möglich.';
          }
        })
        .catch(function (err) {
          console.error('Kontaktformular-Fehler:', err);
          if (statusEl) {
            statusEl.textContent = 'Das hat leider nicht geklappt. Schreibt uns direkt an pv@strom-macher.at oder ruft an: +43 664 11 09 721.';
          }
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; }
        });
    });
  }
})();
