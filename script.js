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

  // Kontaktformular: Absenden bleibt auf der Seite (kein E-Mail-Programm
  // öffnet sich mehr). Der HubSpot-Trackingcode (siehe <head>) erkennt dieses
  // Formular automatisch ("Collected forms") und erfasst Absendungen als
  // Kontakt im HubSpot-Portal. Bei Problemen bleibt die direkte
  // E-Mail-Adresse im Kontaktbereich als Fallback bestehen.
  var form = document.getElementById('anfrage');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      document.querySelector('.form-status').textContent =
        'Danke! Eure Anfrage ist bei uns eingegangen – wir melden uns so schnell wie möglich. ' +
        'Falls es einmal nicht klappt, schreibt uns direkt an pv@strom-macher.at.';
      form.reset();
    });
  }
})();
