# Kräfte zeichnen – EF

Kopie der Einheit `ph9/kraefte-zeichnen/html/`, ergänzt um die EF-Aufgaben 4 und 5. Hinweise zur gemeinsamen Pflege stehen in den Basisdateien beider Versionen. Änderungen an gemeinsamen Features ggf. in beide Kopien übernehmen; `ef.js` bleibt EF-spezifisch.

- Teile 1–3: Gewichtskraft, Tüte, Colakiste (140 N).
- Teil 4: Drei Gegenstände mit zufälligen Gewichtskräften (8–12 N) und zufälligem schrägem F₁. F₂ muss die horizontalen Komponenten aufheben und den senkrechten Anteil bis zur Gewichtskraft ergänzen. Ein Kästchen entspricht 1 N. Die Zufallswerte bleiben während der Bearbeitung erhalten.
- Teil 5: Containerschiff mit 50 000 t = 50 000 000 kg. Beide Zugkräfte haben ganzzahlige Rasterkomponenten (1 Kästchen = 100 kN). Die resultierende Kraft kann schräg verlaufen. Zuerst wird der Summenpfeil am Bug geprüft. Sein Kraftbetrag in kN steht direkt in der Zeichnung. Erst nach korrekter Zeichnung werden die Rechenfelder freigeschaltet. Geprüft werden Beschleunigungsbetrag in m/s² und Geschwindigkeitsbetrag nach 10 s in m/s. Beide Rechenergebnisse müssen auf mindestens zwei gültige Stellen gerundet sein; genauere Angaben werden ebenfalls geprüft. Das Modell vernachlässigt Wasserwiderstand und Drehung. Der Button für neue Kräfte setzt nur die Schiffsaufgabe zurück.
- Alle erfolgreich gelösten Grafiken einschließlich der Schiffsergebnisse erscheinen in der bestehenden Übersicht.
- Keine dauerhafte Speicherung und keine externen Abhängigkeiten.

## Browserprüfung

`tests/browser.html` im Browser öffnen. Testet die drei Gleichgewichte, falsche Antworten, vier zufällige Schiffsaufgaben, Zahlen mit Dezimalkomma, Fortschritt und Übersicht. Für `file://` muss der Browser den Zugriff des Test-Iframes auf die lokale Seite erlauben; alternativ über einen lokalen HTTP-Server öffnen.
