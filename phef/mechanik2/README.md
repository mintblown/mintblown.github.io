# Kräfte untersuchen · Mechanik 2 · Physik EF

Start: `index.html`, erreichbar über `phef/index.html`. Ohne Installation oder externe Bibliotheken im Browser öffnen. Die neue Gruppe umfasst M2-8 bis M2-11. Alle vier Versuche sind als interaktive Auswertungshilfen erreichbar. M2-8 und M2-10 verwenden eigene Messdiagramme, M2-9 und M2-11 verschiebbare Kraftpfeile.

## M2-9

Eigene Eingaben: beide Kraftmesseranzeigen, Gewichtskraft einschließlich Halter und beide Fadenwinkel zur nach oben gerichteten Senkrechten am Knoten. Optional wird die Gesamtmasse in g mit g = 9,8 N/kg in Gewichtskraft umgerechnet. Zahlen mit Komma und Punkt sind möglich. Es gibt keine vorbelegten Messwerte. Speicherung ausschließlich unter `phef-m2-9-v1` im lokalen Browser; Zurücksetzen mit Bestätigung.

Aus den Winkeln entsteht eine schematische Versuchsskizze. Kraftpfeile haben darin einen gemeinsamen Maßstab. Die Plausibilitätsprüfung verwendet seitliche und senkrechte Komponenten sowie den Betrag der verbleibenden Kraft, relativ zur Gewichtskraft. Die wählbare Grenze von 1–20 % ist eine Vergleichsgrenze, keine berechnete Messunsicherheit. Hinweise betreffen Nullstellung/Kalibrierkontrolle, Gesamtmasse, frei drehbare und fluchtende Kraftmesser, Feststellen nach Ausrichtung ohne Richtungsänderung und Winkelmessung zur echten Senkrechten. Rechnerische Vergleichskräfte werden ausdrücklich nicht als korrigierte Messwerte ausgegeben. Beim Sonderfall zweier senkrechter Fäden ist die individuelle Kraftverteilung nicht allein aus den Winkeln bestimmbar.

Die Vektorpfeile sind mit Maus, Touch und Tastatur parallel verschiebbar. Länge und Richtung bleiben erhalten. Spitze-an-Schaft-Konstruktion, automatische Nahbereichsausrichtung, Ausgangslage und optionaler Summenpfeil unterstützen die Addition. Es wird nicht auf ein vermeintlich richtiges Messergebnis gerundet oder korrigiert: Messabweichungen bleiben sichtbar.

### Betrachteter Körper und Vorzeichen

Rechts und oben zählen positiv. Für die Kräfte **auf den Knoten** gilt:

- F_L = (−F_L sin α, F_L cos α)
- F_R = (F_R sin β, F_R cos β)
- F_G = (0, −Gewichtskraft)
- Im Gleichgewicht F_L + F_R = −F_G.

Die standardmäßig gezeigten Kräfte **auf die beiden Kraftmesser** sind jeweils die entgegengesetzten Kräfte des Fadens. Ihre Vektorsumme entspricht im Gleichgewicht F_G. Das ist eine Vektorsumme über zwei verschiedene Kraftmesser, keine Gleichgewichtsbedingung an einem gemeinsamen Körper. Die umschaltbare Ansicht erklärt diese Unterscheidung. Vorausgesetzt sind ruhender Aufbau, vernachlässigbare Faden-/Knotenmasse und keine zusätzlichen Kontaktkräfte.

## Quelle und Abgrenzung

Die lokalen Unterlagen wurden in `input/Mechanik2_Schülerheft.pdf` gefunden, nicht in einem gleichnamigen Ordner. M2-9: Kapitel „Kräftezerlegung“, gedruckte Seiten 23–25. Die neue Anleitung ist eigenständig formuliert; Originalabbildungen wurden nicht übernommen. Anders als die ursprüngliche Tabelle mit drei Zwischenwinkeln arbeitet diese Seite auf Wunsch mit den beiden Winkeln zur Senkrechten. Die Titel der anderen Versuche wurden aus dem Inhaltsverzeichnis übernommen.

## Dateien und Prüfung

- `model.js`: Parser, Komponenten, Residuum, Vergleichswerte, Hinweise.
- `experiment.js`: Skizze, Eingaben, lokale Speicherung und verschiebbare Pfeile.
- `experiment.css`: Darstellung und Bedienung, ergänzend zum EF-Stil.
- `tests/model.test.js`: 40 Prüfungen unter JavaScriptCore bestanden (Symmetrie, ungleiche Winkel, Vorzeichen, Grenzfälle, ungültige Eingaben).
- `tests/browser.html`: 25 Checks in separatem Chrome-Headless-Profil bestanden: Eingabe, Plausibilität, Skizze, Addition, Zeiger-/Tastaturverschiebung, unveränderte Komponenten, Ansichtswechsel, Speicherung und Zurücksetzen. Test nur mit separatem Browserprofil ausführen; der vorherige lokale Stand wird nach dem Test wiederhergestellt.

## M2-8 und M2-10: eigene Messdiagramme

Beide Seiten begleiten die Auswertung realer Messungen. Tabellen beginnen ohne Beispielmessungen. Tabellenzeilen können hinzugefügt und gelöscht werden. Eigene Punkte werden durch Klicken/Tippen/Zeigerziehen oder präzise Koordinateneingabe gesetzt; das verändert die Messwerte nicht. Ein gesonderter Check prüft die Zeichengenauigkeit, optional eingeblendete Kreuze zeigen die aus den Messungen berechneten Koordinaten. Sie sind keine idealen Theoriewerte. Eine eigene Gerade lässt sich über Steigung und Achsenabschnitt einstellen. Messungen und Diagrammpunkte werden lokal gespeichert, mit Reset-Bestätigung. Diagramme sollen per Screenshot gesichert werden.

### M2-8 · Flaschenzug

Eingaben pro Messung: Gewichtskraft der Nutzlast F_G,L, Anzahl tragender Seilabschnitte n, Kraftmesseranzeige, Hubhöhe h und Seilweg s. Gemeinsam werden die Gewichtskraft F_G,R des mitbewegten unteren Rollenblocks und optional eine vorzeichenbehaftete Nullanzeige erfasst. Nur eine für alle Messungen gleiche Nullabweichung darf gemeinsam korrigiert werden. Die obere feste Rolle gehört nicht zur gehobenen Last. Die Anzahl tragender Seilabschnitte wird nicht automatisch mit der Anzahl sichtbarer Rollen gleichgesetzt. Das Heft wird nicht auf einen ungeprüft festgelegten Wert n reduziert.

Darstellungen:

1. x = F_G,L (N), y = nF (N): Idealgerade y = x + F_G,R. Der Abschnitt ist hier eine **Gewichtskraft**.
2. x = F_G,L/g und y = nF/g, jeweils in Gramm umgerechnet: Der Abschnitt entspricht tatsächlich der **Masse des mitbewegten Rollenblocks**.
3. x = h/s, y = F/(F_G,L+F_G,R): direkte Proportionalität zwischen dem Kehrwert des Wegfaktors und dem Kraftanteil im idealen Modell.

Die Beziehung s = nh wird separat mit den gemessenen Wegen verglichen. Für gleiche Last und Hubhöhe sind Zugkraft und Zugweg umgekehrt proportional. Das Produkt F·s enthält bei idealem Vergleich auch den Aufwand zum Anheben des Rollenblocks. Eine einzelne statische Kraftmessung ist keine vollständige reale Arbeitsmessung. Ein Achsenversatz kann auch von Nullpunktfehlern und Reibung stammen; die Interpretation als Rollenmasse setzt das einfache Modell und eine geeignete Messreihe voraus.

### M2-10 · Schiefe Ebene 1

Eingaben: Gewichtskraft von Wagen und Stift sowie pro Messung Zusatzmasse in g, Zugkraftanzeige, Höhe h und Rampenlänge s. F_G = F_G,0 + m·9,8 N/kg. Es werden keine Masse- oder Längenwerte als eigene Messungen vorbelegt. Das Heft nennt eine Rampenlänge von 100 cm; die Seite fordert zur Kontrolle am eigenen Aufbau auf.

Darstellungen: F/F_G gegen h/s sowie F_G/F gegen s/h (zweite Ansicht nur bei F > 0). Ideal jeweils eine Ursprungsgerade mit Steigung 1. Bei gleichem F_G und s ist F proportional zu h. Bei gleichem F_G und h ist F umgekehrt proportional zu s. Beide Fälle werden sprachlich unterschieden. Der vom Nutzer ausgeschlossene Lehrsatzname erscheint auf den Auswertungsseiten nicht.

## M2-11 · Schiefe Ebene 2

Eingaben: gemessene Parallelkraft F, Abhebekraft N, Gesamtgewichtskraft F_G von Wagen und Stift, Höhe h und Basis b. Optional: unabhängig gemessene Schienenlänge und Neigungswinkel. s = hypot(h,b), α = atan2(h,b). Die unabhängige Geometriekontrolle verwendet als Orientierung 2 % Länge und 2° Winkel. Der Kraftcheck verwendet eine frei wählbare Vergleichsgrenze von 1–20 % von F_G; dies ist keine berechnete Messunsicherheit.

Bei nach rechts steigender Rampe lauten die nach unten gerichteten Komponenten der Gewichtskraft:

- parallel: (−F cos α, −F sin α);
- senkrecht in die Rampe: (N sin α, −N cos α).

Ihre Summe soll (0,−F_G) entsprechen. Die gemessenen Haltekräfte zeigen jeweils entgegengesetzt; beim gerade beginnenden Abheben ersetzen sie die Komponenten der Gewichtskraft. Die Kontaktkraft der Schiene ist in diesem Moment 0. Ablesung davor, Beschleunigung, Kippen, eine falsche Normalrichtung oder Reibung können die Messung verfälschen. Der Check prüft deshalb neben F²+N²≈G² auch die richtungsabhängige Vektorsumme, F/F_G≈h/s und N/F_G≈b/s.

Skizze und Vektorboard verwenden gemeinsame Maßstäbe. Die Pfeile können mit Maus, Touch und Tastatur nur parallel verschoben werden; Summe und Spitze-an-Schaft-Konstruktion bleiben wählbar. Die Seite trennt die Komponenten der Gewichtskraft von den tatsächlich gemessenen Haltekräften. Es werden keine rechnerischen Vergleichswerte als Messungen eingesetzt.

## Ergänzte Dateien und Tests

- `analysis-model.js`: Auswertungsmodelle, vorzeichenbehaftete Nullkorrektur, Quotienten, Rollenmasse und Rampenkomponenten.
- `series.js`: Messwerttabellen und selbst eingetragene Diagrammpunkte für M2-8 und M2-10.
- `vector-board.js`, `incline.js`: Pfeilbedienung und Auswertung für M2-11.
- `analysis.css`: Tabellen, Diagramme und gemeinsame Versuchs-Navigation.
- `tests/analysis.test.js`: 168 fachliche Tests unter JavaScriptCore bestanden, einschließlich bewegter Rollenmasse, Nullpunktkorrektur, Kraft-Weg-Beziehungen und vollständiger Richtungsprüfung.
- `tests/analysis-browser.html`: 83 Checks in separatem Chrome-Headless-Profil bestanden. Prüft alle drei neuen Seiten, manuelle Diagrammpunkte, unabhängige Messdaten, Speicherung, Diagrammwechsel, Richtungswechsel und Fehlerhinweise. Nur mit separatem Profil ausführen; der vorherige Speicherstand wird wiederhergestellt.

Quelle für M2-8: gedruckte Seiten 20–22; M2-10: 26–28; M2-11: 29–31 im lokalen Schülerheft. Anleitungen eigenständig formuliert; keine Originalabbildungen kopiert.


## A4-Protokolle für alle vier Versuche

Auf jeder Versuchsseite gibt es den Abschnitt **Protokoll abschließen** mit dem Button **A4-Protokoll erstellen**. Name/Gruppe, Versuchsdatum und ein eigenes Ergebnis beziehungsweise Verbesserungsvorhaben können ergänzt werden. Diese Notizen werden je Versuch separat lokal gespeichert.

Vor dem Erstellen wird die Vollständigkeit geprüft. Bei M2-8 und M2-10 muss mindestens eine vollständige Messung mit einem selbst eingezeichneten Punkt in der aktuellen Diagrammansicht vorliegen. Unbenutzte Tabellenzeilen werden ausgelassen; teilweise ausgefüllte Zeilen müssen vervollständigt oder gelöscht werden. Eine eingeschaltete Vergleichsgerade benötigt gültige Parameter. M2-9 und M2-11 benötigen ihre vollständigen, gültigen Messwerte. Physikalisch auffällige, aber formal gültige Messungen werden nicht blockiert: Die Abweichung und die Hinweise bleiben Teil des Protokolls.

Das Dokument enthält Eingaben, berechnete Ergebnisse, Plausibilitätshinweise und die aktuelle Darstellung einschließlich Pfeillage beziehungsweise eigener Diagrammpunkte und Vergleichsgerade. Die Koordinaten der selbst gezeichneten Punkte werden zusätzlich zu den Messkoordinaten aufgeführt. M2-8 und M2-10 verwenden A4 quer, M2-9 und M2-11 A4 hoch. Eine automatische Anpassung verkleinert umfangreiche Inhalte auf eine A4-Seite; bei sehr vielen Messungen kann die Lesbarkeit sinken, worauf das Dokument hinweist. Es werden keine Daten stillschweigend abgeschnitten oder weggelassen.

Im neuen Tab stehen **Als PDF speichern / drucken** und **A4-Protokoll als HTML speichern** zur Verfügung. Für den Ausdruck Browser-Kopf- und Fußzeilen ausschalten. Die HTML-Datei enthält Druckformatierung und sämtliche SVG-Grafiken direkt eingebettet. Sie benötigt die ursprünglichen Projektdateien nicht. Bei blockiertem neuen Tab wird das HTML-Protokoll unmittelbar heruntergeladen. Das Protokoll ist eine Momentaufnahme; die Seite und ihre Messwerte werden durch das Erstellen nicht verändert.

`protocol.js` erzeugt die Protokolle aus den von den jeweiligen Auswertungsskripten bereitgestellten Daten. Die eigentlichen Berechnungen werden unverändert weiterverwendet. `tests/protocol-browser.html` hat im separaten Chrome-Headless-Profil **76 Checks** bestanden: Vollständigkeit aller vier Versuche, unveränderte Messdaten, eingebettete Diagramme, Beibehaltung der aktuellen Pfeile, sichere Texteingaben, unabhängige Dokumente und gemessene Anpassung innerhalb einer A4-Seitenfläche. Keine zusätzlichen Abhängigkeiten.
