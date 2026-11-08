# Klausurtraining Informatik EF

Einstieg: `html/index.html`, verlinkt in `ifef/index.html`.
Die Seite benötigt keinen Build und keine externen Bibliotheken. Sie lässt sich
als Datei oder über einen statischen Webserver öffnen.

## Aufbau

- Acht Themenstationen mit je vier Aufgaben sowie ein Abschlusscheck mit acht Aufgaben.
- Jede Themenstation verbindet Erklärung, Java-Beispiel, Experiment und Reflexion.
- `html/content.js`: Lerninhalte, erwartete Antworten und Lösungserläuterungen.
- `html/training.js`: Navigation, Antwortauswertung, Experimente und Lernpass.
- `html/training.css`: Ergänzungen zum bestehenden Info-EF-Stylesheet.
- `html/typography.js`: Monospace-Formatierung für Java im Fließtext und ein
  lokales Begriffsglossar. Erklärungen sind per Mouseover, Tastaturfokus und
  Antippen erreichbar und lassen sich mit Escape schließen. Dynamische Tipps,
  Lösungen und Experimenttexte werden ebenfalls formatiert; Eingabefelder und
  persönliche Notizen bleiben unangetastet.

Inhaltliche Grundlage: `input/EX_IF_EF_uebung.pdf` (Klassen und Datentypen,
Cell/Field, Binärzahlen, Dateninterpretation, mehrfaches Verdoppeln).
Die Kursstruktur orientiert sich am Bruchlabor in `ma6/brueche/html/`.

Vor jedem Start erscheint ein Einwilligungsdialog mit zwei nicht vorausgewählten
Checkboxen: Zustimmung zum Training und optionale Speicherung für später.
Ohne Zustimmung wird das Training nicht initialisiert. Ohne die zusätzliche
Speicherauswahl bleibt der Lernstand ausschließlich im Arbeitsspeicher der
geöffneten Seite; localStorage wird weder gelesen noch geschrieben. Bereits
vorhandene Speicherstände bleiben dabei unangetastet.
Mit gewählter Speicherung werden Fortschritt und Notizen unter
`ifef-klausurtraining-v1` ausschließlich im Browser gespeichert und wieder geladen.
Die Auswahl wird bei jedem Öffnen erneut abgefragt. Beim Widerruf wird der
Lernstand im Speichermodus gelöscht; im Sitzungsmodus wird nur die Sitzung beendet.
Die Seite wird anschließend wieder gesperrt. Musterlösungen führen zu einer gesonderten Wertung als nachgearbeitet.
Freie Begründungen und Notizen werden nicht automatisch bewertet. Java-Antworten
werden als Tokenfolgen mit den hinterlegten Varianten verglichen; es wird kein
beliebiger Java-Code ausgeführt.

## Browserprüfungen

```sh
python3 ifef/klausurtraining/tests/run_browser.py
```

Der Runner verwendet installiertes Chrome mit isolierten temporären Profilen.
Unter anderen Betriebssystemen kann `CHROME_BIN` auf das Chrome-Binary zeigen.
Geprüft werden alle Aufgaben und Experimente, Eingabegrenzen, Java-Tokenvergleich,
Desktop- und Smartphonebreiten, erneutes Öffnen des Lernstands, beschädigte
Speicherdaten und gesperrter localStorage. Es werden keine zusätzlichen
Python-Pakete benötigt.
