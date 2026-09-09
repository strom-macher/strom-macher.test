# strom-macher – Website Rework 2026

Statische Website: HTML, ein Stylesheet, ein Skript. Kein Server, keine
Datenbank, keine externen Ladevorgänge (keine Google Fonts, keine CDNs,
keine Cookies).

## Dateien

| Datei | Zweck |
| --- | --- |
| `index.html` | Startseite (neue Struktur und Texte) |
| `styles.css` | Design-Tokens, Layout, Responsive, Motion |
| `script.js` | Mobilmenü, Projekt-Tabs, PV-Überschlag, Kontaktformular |
| `impressum.html`, `datenschutz.html` | Rechtsseiten (unverändert übernommen) |
| `legal.css` | Stylesheet der Rechtsseiten (das alte Stylesheet) |
| `assets/` | Logos, Favicons, Fotos (jeweils `.webp` + `.jpg`/`.png`) |
| `robots.txt`, `sitemap.xml` | Suchmaschinen |

## Was neu ist

- **Positionierung**: „Erst der Verteiler. Dann die Sonne." – der Bestand
  zuerst, PV darauf. Das unterscheidet euch von reinen PV-Anbietern.
- **Fakten-Leiste** statt Werbefloskeln: 24 h Rückmeldung, 40 km Umkreis,
  ein Ansprechpartner, Doku zu jedem Projekt.
- **PV-Überschlag** (`#rechner`): drei Eingaben, drei Ergebnisse, danach
  Übergabe an den PV-Konfigurator. Ohne Formular und ohne E-Mail-Adresse.
- **Projekte als Tabs** statt Karussells – nichts wandert weg, alles
  vergleichbar, drei Sparten in einem Bereich.
- **Ablauf mit vier Schritten**, inklusive Übergabe von Messprotokoll und
  Prüfbericht als Argument, nicht als Fußnote.
- Karussell-Logik, Header-Animationen und Scroll-Reveal sind entfallen:
  weniger Bewegung, schnellerer Seitenaufbau, ein Skript unter 3 kB.

## Vor dem Livegang

1. **Zahlen bestätigen**: „24 h", „40 km" und die Rechenannahmen im
   Überschlag (1.050 kWh/kWp, 25 ct Bezug, 6 ct Einspeisung, 30/65 %
   Eigenverbrauch) stehen in `index.html` bzw. `script.js`.
2. **Echte Fotos** für Verteilerumbau und Hauselektrik. Die Platzhalter sind
   als `.pattern-azure` / `.pattern-amber` mit Bildunterschrift markiert –
   dort den `<picture>`-Block wie bei der PV-Karte einsetzen und die
   Zeile „Platzhalter · echte Projektfotos …" entfernen.
3. **Kontaktformular**: baut per JavaScript einen `mailto:`-Link. Für den
   professionellen Einsatz einen Formulardienst (Formspree, Netlify Forms,
   Basin) eintragen und den Submit-Handler in `script.js` entfernen.
4. **Impressum / Datenschutz**: Gewerbeberechtigung und Kammerzugehörigkeit
   fehlen noch, der Datenschutztext ist ein allgemeiner Platzhalter.
5. **Domain** in Canonical, Open Graph, strukturierten Daten, `sitemap.xml`
   und `robots.txt` prüfen.
6. **Markenschrift**: Überschriften laufen auf Helvetica/Arial. Für ein
   identisches Bild auf allen Geräten eine `woff2`-Datei nach
   `assets/fonts/` legen, `@font-face` in `styles.css` ergänzen und
   `--font-head` umstellen. Bitte selbst hosten, nicht von Google laden.

## Lokal ansehen

```bash
cd site
python3 -m http.server 8000
# http://localhost:8000
```
