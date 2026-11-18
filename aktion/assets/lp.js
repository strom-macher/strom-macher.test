/* strom-macher · Landing Pages (Meta-Werbung) – gemeinsames Skript
   Das Formular sendet direkt an die Supabase-Funktion „anfrage“:
   Spam-Prüfung → Lead im Vertrieb der Monteur-App → Mail ans Büro + Bestätigung an den Kunden. */
(function () {
  "use strict";

  var ANFRAGE_URL = "https://wwqzqsaykptvwgrjwsxn.supabase.co/functions/v1/anfrage";
  var TEL = "+43 664 11 09 721";
  var shownAt = Date.now();
  var params = new URLSearchParams(window.location.search);

  /* ---------- 1. Ort aus ?ort= einsetzen (passend zur Anzeige) ---------- */
  var ort = (params.get("ort") || "").trim();
  var ortOk = /^[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß .\-]{1,39}$/.test(ort);
  if (ortOk) {
    ort = ort.charAt(0).toUpperCase() + ort.slice(1);
    document.querySelectorAll("[data-ort-phrase]").forEach(function (el) {
      el.textContent = "in " + ort + " und Umgebung";
    });
    document.querySelectorAll("[data-ort-label]").forEach(function (el) {
      el.textContent = ort + " und Umgebung";
    });
    if (document.body.hasAttribute("data-ort-title")) {
      document.title = document.body.getAttribute("data-ort-title").replace("{ort}", ort);
    }
  }

  /* ---------- 2. Herkunft merken (Meta: fbclid, utm_*) ---------- */
  function herkunft() {
    var keep = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "ort"];
    var out = [];
    keep.forEach(function (k) {
      var v = params.get(k);
      if (v) out.push(k + "=" + v.slice(0, k === "fbclid" ? 24 : 80));
    });
    return out.join("&").slice(0, 400);
  }

  /* ---------- 3. Schritt-für-Schritt-Formular(e) ---------- */
  // Eine Seite kann mehrere Formulare haben (z. B. Referenz oben, Elektrik unten).
  var forms = Array.prototype.slice.call(document.querySelectorAll(".lead-form"));

  function initWizard(formEl) {
    var steps = Array.prototype.slice.call(formEl.querySelectorAll(".fstep"));
    var controls = formEl.querySelector(".wizard-controls");
    if (steps.length < 2 || !controls) return null;

    formEl.classList.add("js-wizard");
    formEl.noValidate = true;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var backBtn = controls.querySelector(".btn-back");
    var nextBtn = controls.querySelector(".btn-next");
    var wpText = formEl.querySelector(".wp-text");
    var bar = formEl.querySelector(".wizard-bar i");
    var cur = 0;
    var busy = false;

    function render(focus) {
      steps.forEach(function (s, i) {
        s.classList.toggle("active", i === cur);
        s.classList.remove("enter", "leave");
      });
      var last = cur === steps.length - 1;
      nextBtn.style.display = last ? "none" : "";
      backBtn.disabled = cur === 0;
      if (wpText) wpText.textContent = "Schritt " + (cur + 1) + " von " + steps.length;
      if (bar) bar.style.transform = "scaleX(" + ((cur + 1) / steps.length) + ")";
      if (focus) {
        var el = steps[cur].querySelector("input:not([type=hidden]):not([type=radio]), select, textarea") ||
                 steps[cur].querySelector("input[type=radio]");
        if (el) el.focus({ preventScroll: true });
      }
    }

    function go(to, focus) {
      if (busy || to === cur || to < 0 || to >= steps.length) return;
      if (reduced) { cur = to; render(focus); return; }
      busy = true;
      steps[cur].classList.add("leave");
      setTimeout(function () {
        cur = to;
        render(focus);
        steps[cur].classList.add("enter");
        busy = false;
      }, 170);
    }

    function next() { if (stepValid(steps[cur])) go(cur + 1, true); }

    nextBtn.addEventListener("click", next);
    backBtn.addEventListener("click", function () { go(cur - 1, true); });

    formEl.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter") return;
      var t = ev.target;
      if (t.tagName === "TEXTAREA" || t.type === "submit" || t.type === "checkbox") return;
      if (cur < steps.length - 1) { ev.preventDefault(); next(); }
    });

    // Auswahl-Kacheln: ein Tipp genügt, dann automatisch weiter
    formEl.querySelectorAll(".fstep .choice input[type=radio]").forEach(function (r) {
      r.addEventListener("change", function () {
        var step = r.closest(".fstep");
        if (step && step.querySelectorAll("input:not([type=radio]), select, textarea").length === 0 && cur < steps.length - 1) {
          setTimeout(next, 220);
        }
      });
    });

    render(false);

    return {
      showInvalid: function () {
        for (var i = 0; i < steps.length; i++) {
          if (!stepValid(steps[i], true)) {
            if (i !== cur) go(i, true);
            setTimeout(function () { stepValid(steps[i]); }, 260);
            return;
          }
        }
      }
    };
  }

  // Prüft einen Schritt; data-oneof="telefon email" verlangt mindestens eines der Felder
  function stepValid(stepEl, silent) {
    var oneofAttr = stepEl.getAttribute("data-oneof");
    if (oneofAttr) {
      oneofAttr.split(" ").forEach(function (n) {
        var f = stepEl.querySelector('[name="' + n + '"]');
        if (f) f.setCustomValidity("");
      });
    }
    var fields = stepEl.querySelectorAll("input, select, textarea");
    for (var i = 0; i < fields.length; i++) {
      if (!fields[i].checkValidity()) {
        if (!silent) fields[i].reportValidity();
        return false;
      }
    }
    var oneof = stepEl.getAttribute("data-oneof");
    if (oneof) {
      var names = oneof.split(" ");
      var any = names.some(function (n) {
        var f = stepEl.querySelector('[name="' + n + '"]');
        return f && f.value.trim();
      });
      if (!any) {
        var first = stepEl.querySelector('[name="' + names[0] + '"]');
        if (first && !silent) {
          first.setCustomValidity("Bitte Telefonnummer oder E-Mail-Adresse angeben.");
          first.reportValidity();
          first.setCustomValidity("");
        }
        return false;
      }
    }
    return true;
  }

  function allValid(form) {
    var steps = form.querySelectorAll(".fstep");
    for (var i = 0; i < steps.length; i++) if (!stepValid(steps[i], true)) return false;
    return true;
  }

  /* ---------- 4. Senden → App, dann Danke-Seite ---------- */
  function v(form, name) {
    var el = form.querySelector('[name="' + name + '"]:checked') || form.querySelector('[name="' + name + '"]:not([type=radio])');
    return el ? String(el.value || "").trim() : "";
  }
  function setStatus(form, msg, isError) {
    var el = form.querySelector(".form-status");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("error", !!isError);
  }

  forms.forEach(function (form) {
    var wizard = initWizard(form);
    if (!window.fetch) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!allValid(form)) { if (wizard) wizard.showInvalid(); else form.reportValidity(); return; }

      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Wird gesendet …";
      setStatus(form, "", false);

      var data = {
        kampagne: form.getAttribute("data-kampagne") || "",
        name: v(form, "name"), telefon: v(form, "telefon"), email: v(form, "email"), plzort: v(form, "plzort"),
        leistung: v(form, "leistung"), nachricht: v(form, "nachricht"),
        eigentuemer: v(form, "eigentuemer"), dachart: v(form, "dachart"), verbrauch: v(form, "verbrauch"),
        ort_anzeige: ortOk ? ort : "", herkunft: herkunft(),
        firma: v(form, "firma"), t: Date.now() - shownAt
      };

      fetch(ANFRAGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (j) {
            if (!res.ok || !j.ok) { var e = new Error(j.msg || "Status " + res.status); e.userMsg = j.msg; throw e; }
          });
        })
        .then(function () {
          window.location.href = form.getAttribute("data-danke") || "danke/";
        })
        .catch(function (err) {
          btn.disabled = false;
          btn.textContent = label;
          setStatus(form, err.userMsg || ("Das hat leider nicht geklappt. Bitte versuchen Sie es noch einmal oder rufen Sie an: " + TEL), true);
        });
    });
  });

  /* ---------- 5. Leiste unten am Handy: nach dem Hero zeigen, bei jedem Formular ausblenden ---------- */
  var sticky = document.querySelector(".sticky-cta");
  var hero = document.querySelector(".hero");
  var formSections = forms.map(function (f) { return f.closest("section"); }).filter(Boolean);
  if (sticky && hero && formSections.length && "IntersectionObserver" in window) {
    var heroVisible = true, formsVisible = 0;
    var update = function () {
      var show = !heroVisible && formsVisible === 0;
      sticky.classList.toggle("visible", show);
      sticky.inert = !show;
    };
    sticky.inert = true;
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; update(); }, { threshold: 0.1 }).observe(hero);
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.__vis = en.isIntersecting; });
      formsVisible = formSections.filter(function (s) { return s.__vis; }).length;
      update();
    }, { threshold: 0.15 });
    formSections.forEach(function (s) { fio.observe(s); });
  }

  /* ---------- 6. Einblenden beim Scrollen (respektiert „Bewegung reduzieren“) ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }
})();
