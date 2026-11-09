# Mission Mausefallenauto

Interaktive Lerninsel für Physik in Klasse 9. Aktuell sind die drei Stationen Zugkraft, Hebel und Goldene Regel freigegeben. Die übrigen fünf Stationen bleiben vorerst deaktiviert: Kartenbereiche sind mit grauen Overlays markiert, Links sind gesperrt und direkte Seitenaufrufe zeigen einen Hinweis. Es gibt keine Prüfungen, Anmeldung oder externen Dienste. Die analogen Dokubögen sind nicht Teil dieser Umsetzung.

## Start

`interactive/trap/index.html` direkt im Browser öffnen. Alternativ von der Hauptseite unter „Mission Mausefallenauto“ aufrufen. Installation, Build und Server sind nicht erforderlich. Alle Dateien einschließlich `trap.png` zusammen behalten. Die lokale Speicherung hängt von den Browsereinstellungen ab; insbesondere bei direkt geöffneten Dateien können sich Browser unterschiedlich verhalten. Ein Hinweis auf der Seite meldet Speicherprobleme.

Falls für die Schulgeräte eine HTTP-Vorschau bevorzugt wird, aus dem Repository `python3 -m http.server 8000` starten und `http://localhost:8000/interactive/trap/` aufrufen. Das ist eine Option, keine Voraussetzung. Im bestehenden GitHub-Pages-Hosting genügen die statischen Projektdateien; in dieser Umsetzung wurde kein Deployment angestoßen.

## Einwilligung und Speicherung

`boot.js` zeigt vor jedem Start einen Einwilligungsdialog. Erst nach aktiver
Zustimmung werden die eigentlichen Projekt-Skripte geladen. Eine zweite, optionale
Checkbox erlaubt das Speichern für später. Beide Checkboxen sind zunächst leer.
Ohne Speicheroption wird localStorage weder gelesen noch geschrieben; bestehende
Projektstände bleiben unangetastet. Der aktuelle Stand geht dann beim Neuladen,
Schließen oder Wechseln der Seite verloren. Manuelles Speichern einer Projektdatei
und Screenshots bleiben möglich. Das Laden einer Projektdatei benötigt derzeit den
Speichermodus, da der Import den Browserstand ersetzt und die Seite neu lädt.
Mit Speicheroption werden Messwerte, Modelleinstellungen und Bearbeitet-Häkchen
unter `mission-mausefallenauto-v1` ausschließlich lokal gespeichert. Es gibt keine
Übermittlung dieser Projektdaten an den Betreiber. Der Widerruf am Seitenende
löscht im Speichermodus den lokalen Stand; im Sitzungsmodus beendet er die Seite,
ohne ältere Speicherstände anzufassen. Die Einwilligung selbst wird nicht gespeichert.
Deaktivierte Stationsseiten laden keine Projekt-Skripte und greifen nicht auf
localStorage zu. Alle vorhandenen Messdaten anderer Stationen bleiben erhalten.

## Basecamp und Bau-Doku

Im Basecamp können freiwillig Name, Gruppenname und Gruppenmitglieder eingegeben
werden. Direkt darunter stehen Bau-Doku, Projekt speichern und Projekt laden.
Die Gruppenangaben werden gemäß der Auswahl beim Start nur im aktuellen
Seitenzustand oder zusätzlich im lokalen Browserstand gehalten und sind Teil der
JSON-Projektdatei. Ältere Dateien ohne Gruppenangaben bleiben lesbar. Der
Einwilligungstext nennt diese Angaben ausdrücklich.

Die Bau-Doku beginnt mit **1 · Name und Gruppe**, danach folgt
**2 · Unser Bearbeitungsstand**. Baumaße und Prognose stehen anschließend als
Abschnitt 3; Messreihen und Modelleinstellungen folgen. Mehrzeilige Mitgliederlisten
bleiben in der Darstellung erhalten, alle Namensangaben werden als Text ausgegeben.

## Lernweg und Unterricht

| Station | Schwerpunkt | Art |
| --- | --- | --- |
| Zugkraft der Falle | Tangentiale Haltekraft bei verschiedenen Armwinkeln; Kraft-Winkel-Diagramm | Realexperiment |
| Hebelwerkstatt | Hebelbalken im Gleichgewicht; Übertragung auf Armlänge, Kraft und Weg | Realexperiment und Modell |
| Goldene Regel | Mindestens fünf Hubhöhen; Arbeit und Energie; optionale Abhebekraft mit geometrischer Kräfteaddition | Verbindliches Realexperiment mit Zusatzaufgabe |
| Übersetzung | Dünne Antriebsachse versus fest gekoppelte Wickelscheibe; Fahrradgang als Analogie | Ideales Modell |
| Radwerkstatt | Umfang, Umdrehungszahl und Strecke; Bauabwägungen | Ideales Modell |
| Reibungsforschung | Lagerreibung, Rollwiderstand, notwendige Haftung und Schlupf | Qualitatives Modell |
| Rechenwerkstatt | Eigene Maße und geometrische Strecke während der Fadenabwicklung | Rechner |
| Testgelände | Wiederholungen, gezielte Änderungen, Fadenende und Gesamtstrecke | Realexperiment |

Etwa 10–15 Minuten pro Station, bei Messungen und beim Bauen entsprechend länger. Insgesamt eine Unterrichtsreihe, keine einzelne Unterrichtsstunde. Die drei aktiven Werkstätten bleiben unabhängig zugänglich. Die Erkenntnisse werden erst durch bewusstes Aufklappen sichtbar. Jedes Experiment führt mit einer Transferfrage zur eigenen Konstruktion zurück. Die Markierung „bearbeitet“ ist eine Selbsteinschätzung und wird nicht automatisch aus Messdaten vergeben.

In der Hebelwerkstatt wird zuerst die Gewichtskraft eines Masseplättchens bestimmt und auf der Seite festgehalten; bei mehreren gleichzeitig gemessenen Plättchen wird die Gesamtkraft durch ihre Anzahl geteilt. Danach folgen mindestens sechs Partner-Runden: A gibt links vor und B gleicht rechts aus, anschließend wechseln die Rollen. Das HTML-Protokoll bietet sechs leere Zeilen und zeigt die Rollen je Runde. Die vorbereitende Plättchenmessung bleibt auch in Projektdatei und Bau-Doku erhalten.

Vorwissen: Kräfte, Reibung und Kreisumfang; der Kreisumfang wird wiederholt. Drehmoment und Radiant werden nicht eingeführt. Arbeit und Energie werden aus der Goldenen Regel entwickelt. Es gibt keine Energieintegration aus dem Kraft-Winkel-Diagramm.

### Material und Sicherheit

Die Lehrkraft bereitet Mausefallen mit sicherer Befestigung und Sicherung gegen Zuschnappen, eine Skizze zum Schätzen der Winkel, passende Federkraftmesser, Hebelbalken und Gewichte sowie Wagen und Rampen vor. Für die Rampen sind mindestens fünf verschiedene Hubhöhen bei gleicher Rampenlänge und Steigungen bis etwa 20 % vorgesehen. Ein zusätzlicher Längenvergleich ist bei gleichbleibender Höhe möglich. Die Seiten ersetzen keine Einweisung. Anpassungen und Umbauten nur an gesicherten Fallen.

Bei der Kraftmessung bleibt der Angriffspunkt fest; die Zugrichtung des Kraftmessers wird bei jedem Winkel rechtwinklig zum Arm mitgedreht. Der Winkel wird relativ zur festgelegten entspannten Armstellung anhand der Skizze sorgfältig geschätzt; eine exakte Winkelmessung ist nicht nötig. Jede Messreihe umfasst mindestens sechs verschiedene Winkel. Im Idealfall messen zwei Personen unabhängig nacheinander an derselben Falle und erfassen ihre Reihen auf getrennten iPads. Anschließend vergleichen sie Diagramme und mögliche Abweichungen nebeneinander; eine automatische Synchronisation gibt es nicht. Der tatsächliche Verlauf wird nicht vorgegeben. Die gezeichnete Federkraftmesser-Anordnung dient nur der Geometrie.

## Modelle und fachliche Grenzen

- **Hebel:** F₁·l₁ ≈ F₂·l₂ bei Gleichgewicht und senkrechten Kräften. Die Tabelleneinheit N·cm wird als Produktvergleich verwendet, ohne Drehmoment als neue Größe einzuführen. Der Armvergleich nutzt relative Kraft bezogen auf 15 cm Arm, keine erfundene Kraftmessung. Bogenweg des Armendes ist nicht generell gleich nutzbarer Fadenweg.
- **Übersetzung:** n = L/(2πr_Wicklung). Die angenommene Fadenzugkraft wird für den Vergleich konstant gehalten. F_Boden,ideal = F_Faden·r_Wicklung/r_Rad beschreibt ideale Kraftübertragung vor Verlusten und ohne Schlupf. Achse, Wickelscheibe und Antriebsrad sind fest gekoppelt. Größere Wickelstelle: mehr Schub, weniger Umdrehungen. Mehrere Fadenlagen können den wirksamen Radius verändern.
- **Rad:** U = 2πr, s = nU bei schlupffreiem Rollen. Die Zeichnung verwendet einen an die gewählten Maße angepassten gemeinsamen Maßstab für Rad und Weg.
- **Rampe:** W = F·s gilt hier für annähernd konstante Kraft in Bewegungsrichtung bei gleichförmigem Ziehen. F_G·h ist die Zunahme an Höhenenergie. Unterschiede können durch Reibung, nicht gleichförmige Bewegung oder Messunsicherheit entstehen. Die Produkte erscheinen zunächst als N·m; die aufklappbare Auswertung führt Joule ein.
- **Zusatzmessung Rampe:** Die optionale Abhebekraft wird senkrecht von der Rampenoberfläche weg beim gerade eintretenden Kontaktverlust gemessen. Eine zweite Sicherung wirkt parallel zur Rampe gegen Herunterrollen. Im idealen Modell gilt F_Z = F_G · h/s und F_A = F_G · √(1 − (h/s)²). Zwei maßstäbliche Bilder zeigen Richtungen und die Spitze-an-Anfang-Addition zur Gegenkraft von F_G. Eigene, in getrennten Situationen gemessene Kräfte und das ideale Vergleichsmodell werden unterschieden; die verbleibende Vektorlücke wird nicht wegkorrigiert. Die Grundmessung benötigt keine Abhebekraft. Alte Projektdateien ohne das optionale Feld werden mit leerem Zusatzwert geladen. `ramp-forces.js` steuert Auswahl und Zeichnung.
- **Reibung:** Die Regler sind qualitative, voneinander unabhängige Stufen. Modellgrenzen wie die Haftungsschwelle sind didaktisch gesetzt, keine realen Reibwerte. Es werden keine realen Fahrstrecken daraus berechnet. Haftreibung bei idealem Rollen ist nicht pauschal ein Energieverlust.
- **Rechner:** s_geometrisch = L·r_Rad/r_Wicklung. Konstanter Wickelradius, vollständige Fadenabwicklung ohne Durchrutschen und gekoppelte Rotation vorausgesetzt. Kein Energie- oder Beschleunigungsmodell. Das Ergebnis ist weder garantierte Gesamtstrecke noch obere Grenze: Das Auto kann vorher stehen bleiben oder danach ausrollen.
- **Testgelände:** Geometrische Strecke, Strecke bis Fadenende beziehungsweise vorzeitigem Stopp und Gesamtstrecke werden getrennt dargestellt. Beobachtungen entscheiden, ob vollständig abgewickelt wurde. Δ gesamt = Gesamtstrecke − geometrische Strecke; keine Qualitätsnote. Ausrollen wird nur bei zwei konsistenten Messstrecken berechnet.

## Daten und Sicherung

Reale Messtabellen beginnen leer. Zeilen können ergänzt, bearbeitet und gelöscht werden. Einheiten und Wertebereiche werden geprüft; Dezimalkomma und Dezimalpunkt sind möglich. Ungültige und fehlende Werte werden nicht als 0 gezeichnet. F-alpha-Messpunkte werden im Diagramm nach Winkel sortiert; Verbindungslinien sind Orientierung, keine behauptete Federkennlinie.

Unter `mission-mausefallenauto-v1` werden Einstellungen, Messdaten und selbst gesetzte Bearbeitet-Häkchen im localStorage dieses Browsers gespeichert. Keine Namen oder Konten erforderlich, keine Übertragung. Beim Wechsel von Gerät, Browser, Origin oder beim Löschen der Browserdaten wird der lokale Stand nicht mitgenommen. Änderungen aus einem zweiten Tab sperren die Eingabe im älteren Tab bis zum Neuladen, damit alte Daten neuere nicht überschreiben.

### Bau-Doku aus dem aktuellen Stand

**Bau-Doku erstellen** steht bei den Projektdatei-Buttons auf der Karte und jeder Stationsseite. Der Button erzeugt einen eigenständigen Dokument-Snapshot in einem neuen Tab, einschließlich der Daten aus allen anderen Stationen:

- aktuelle eigene Rechenmaße, geometrische Prognose und Rechenweg;
- sämtliche ausgefüllten Messwertzeilen aus Feder-, Hebel- und Rampenversuch;
- Testläufe mit Baumaßen, Datum, Beobachtungen, Messstrecken und berechneten Differenzen;
- die vier zugehörigen Diagrammarten mit Achsen und Legenden;
- gespeicherte Modelleinstellungen und Bearbeitet-Häkchen.

Die Doku verwendet die gleichen Berechnungen, Wertebereiche und Diagrammfunktionen wie die Stationsseiten. Unvollständige und ungültige Eingaben bleiben dokumentiert und werden gekennzeichnet; fehlende Messwerte werden nicht erfunden. Lange Balkendiagramme werden für lesbaren Ausdruck in Gruppen aufgeteilt. Reale Messdaten und Modellannahmen bleiben unterscheidbar. Noch unberührte Regler-Standardwerte werden nicht als selbst eingegebene Daten aufgeführt.

Im Dokument stehen **Drucken / als PDF speichern** und **Dokument als HTML speichern** bereit. Die HTML-Datei enthält sämtliche Tabellen, Diagramme und Druckformatierung und benötigt nach dem Download keine Verbindung zur Lernseite. Bei blockiertem neuem Tab wird sie direkt heruntergeladen. Sie ist eine Zusammenfassung des Erstellungszeitpunkts, keine automatisch aktualisierte Ansicht. Zum Weiterarbeiten weiterhin die JSON-Projektdatei verwenden. Analoge Notizen und bereits extern gespeicherte Screenshots werden nicht automatisch übernommen.

### Gesamtes Projekt speichern und laden

Auf der Karte und jeder Stationsseite stehen **Projekt speichern** und **Projekt laden** zur Verfügung. Speichern lädt eine JSON-Datei mit allen Messwerttabellen (auch unvollständigen Eingaben), Modelleinstellungen, eigenen Rechenmaßen und Bearbeitet-Häkchen herunter. Die Datei kann beispielsweise in der Gruppenablage gespeichert und auf einem anderen Gerät wieder eingelesen werden. Diagramme und berechnete Spalten entstehen aus den geladenen Daten neu; Screenshots und CSV-Dateien sind nicht eingebettet.

Beim Laden werden Dateiformat, Version und Datenstruktur geprüft. Fremde, beschädigte und über 5 MB große Dateien werden abgewiesen. Vor dem Ersetzen erscheint eine Bestätigung mit Tabellenzeilen und bearbeiteten Stationen. Abbrechen oder fehlerhafte Dateien lassen den vorhandenen Stand unverändert. Kann der Browser die geladenen Daten nicht speichern, bleibt der bisherige Stand erhalten und es erscheint eine Fehlermeldung. Nach erfolgreichem Laden aktualisiert sich die Seite. Die Übernahme ersetzt den gesamten bisherigen Projektstand und führt keine Gruppenstände zusammen. Bei Bedarf vorher eine eigene Sicherungsdatei speichern.

**Jedes erzeugte Diagramm fordert ausdrücklich zur manuellen Sicherung per Screenshot auf.** Screenshots gehören in die eigene Gruppenablage. Das Testgelände bietet zusätzlich CSV-Export mit Baumaßen, Messungen, Beobachtungen und berechneten Werten. CSV ist eine Sicherung, kein Importformat. Das Zurücksetzen betrifft nur dieses Projekt und fragt vorher nach.

## Dateien

- `index.html`, `map.js`, `map-model.js`: Lerninsel mit Reisefigur, verbundenem Wegenetz und Direktzugängen. Bei Ankunft erscheint der Startlink direkt über der Figur. Beim Wechsel zwischen Werkstätten reist die Figur über den Rundweg; mit reduzierter Bewegung erfolgt der Wechsel ohne lange Animation.
- `glossary.js`: kurze Fachbegriff-Erklärungen per Mouseover, Tastaturfokus oder Tippen; Escape schließt die Erklärung. Die Lektionstexte wurden sprachlich vereinfacht, fachliche Begriffe bleiben erhalten.
- `insel-prompt.txt`: finaler Bildprompt und Erzeugungsverfahren für die neue Insel.
- `insel-v2.png`: neu generierte Insel mit allen acht Stationen und passenden kurzen Thementiteln. `trap.png` bleibt als ursprüngliche Illustration erhalten. Das SVG-Wegenetz ergänzt die dargestellten Wege mit einem Rundweg außerhalb des Basecamps. Die Figur folgt ausschließlich diesen SVG-Pfaden.
- Acht Stations-HTML-Dateien: eigenständige, direkt erreichbare Anleitungen mit gemeinsamem Layout.
- `style.css`: Layout, Touch-/Tastaturbedienung, Tabletansicht und reduzierte Bewegung.
- `model.js`: reine Berechnungen und Zahlenparser.
- `shared.js`: Speicherung, Formatierung und Zurücksetzen.
- `backup.js`: versionierte JSON-Projektdateien, Validierung, Export und Import mit Bestätigung.
- `station.js`: SVG-Modelle und Bedienelemente.
- `tables.js`: editierbare Messwerttabellen, SVG-Diagramme und CSV-Export; gemeinsame Auswertung auch für die Bau-Doku.
- `document.js`: eigenständige druckbare Bau-Doku mit eingebetteten Diagrammen und HTML-Download.
- `input.txt`: ursprünglicher Auftrag, unverändert. Die Gesprächsentscheidungen konkretisieren die Umsetzung wie oben beschrieben.

## Referenz und Prüfung

Die Online-Referenz `https://mintblow.ing/interactive/force` war über den Webzugriff bei der Umsetzung nicht abrufbar. Stattdessen wurden die vorhandenen lokalen Dateien in `interactive/force` analysiert: illustrierte Karte, farbige Ortsmarkierungen, Reisefigur, Laborfarben, SVG-Interaktionen. Für dieses Projekt gibt es eigene Stationsseiten und freien Zugang ohne Prüfungen. Vorhandene fremde Prüfungs-/Avatar-Assets wurden nicht übernommen.

- `node tests/model.test.js`: 32 Tests für Zahlenparser, Einheiten, Formeln, Übersetzung, Arbeit und Messkonsistenz; keine Pakete erforderlich. In der aktuellen Umgebung wurden sie mit JavaScriptCore ausgeführt, da Node nicht installiert ist.
- `node tests/document.test.js`: 23 Tests für alle vier Diagrammarten, eigene Maße und Prognose, Datenvollständigkeit, unveränderten Originalstand, ungültige/offene Werte, sichere Textdarstellung, unabhängige HTML-Datei und lesbare Diagrammaufteilung. Mit JavaScriptCore ausgeführt.
- `node tests/backup.test.js`: 23 Tests für vollständige Wiederherstellung, leere und unvollständige Daten, Dezimalkomma, unabhängige Datenkopien und Ablehnung fremder/beschädigter/zu großer Dateien. In dieser Umgebung mit JavaScriptCore ausgeführt.
- `tests/browser.html`: 168 Integrationschecks in Chrome mit separatem temporärem Profil ausgeführt. Prüft die drei aktiven Stationen, gesperrte Wege und Direktaufrufe, Einwilligung vor Initialisierung, optionale Speicherung, Sitzungsmodus, Widerruf, reale Messungen und die geometrische Kräfteaddition. Nur in einem separaten Testprofil ausführen, da vorübergehend lokale Daten geschrieben werden. Der vorherige Speicherstand wird anschließend wiederhergestellt.
- `node tests/map.test.js`: 668 Prüfungen aller Start-Ziel-Kombinationen auf zusammenhängende, vorhandene Straßen und erreichbare Stationen. Mit JavaScriptCore ausgeführt.
- Syntax, lokale Links/Assets und eindeutige HTML-IDs geprüft.
- Eine zusätzliche visuelle Screenshot-Prüfung wurde nicht freigegeben und daher nicht ausgeführt. Physische Touchgeräte und Safari/Firefox wurden nicht separat getestet.
