# Optimierungsstrategie

## Ziel und Leitgedanke

Die Lernprojekte sollen zuverlässig über GitHub Pages erreichbar sein und sich mit überschaubarem Aufwand fachlich korrekt, zugänglich und sicher erweitern lassen – auch mit Unterstützung einer Coding-KI. Die Website ist bereits eine umfangreiche statische Sammlung; ein Framework- oder Build-Systemwechsel ist dafür kein Selbstzweck.

**Leitlinie:** Zuerst Veröffentlichungs- und Qualitätsprüfungen verlässlich machen, dann gezielt Tests und Lernangebote verbessern. Bestehende, funktionierende Einheiten nicht pauschal umbauen.

## Bestandsaufnahme

Der betrachtete Stand umfasst rund 309 versionierte Dateien in mehreren Fach- und Jahrgangsbereichen. Die Website besteht aus statischem HTML, CSS, JavaScript und lokalen Assets. Im Repository gibt es weder ein zentrales Paket-/Build-System noch eine `.github`-Workflow-Konfiguration.

Ein lokaler statischer Check ergab:

- 79 HTML-Dateien; alle enthalten ein `lang`-Attribut.
- Kein gefundenes `<img>`-Element ohne `alt`-Attribut.
- Keine defekten lokalen Ziele in den geprüften HTML-Verweisen.
- Fünf HTML-Dateien ohne Viewport-Metadaten; alle fünf sind Browser-Testseiten.
- 26 Test- und Test-Fixture-Dateien, verteilt auf acht Themenbereiche. Testverfahren sind projektabhängig; einige Tests sind Browser-Fixtures, keine eigenständigen Node-Tests.
- Mehrere PNG-Dateien sind groß, unter anderem `interactive/trap/insel-v2.png` (ca. 3,62 MB), `interactive/force/assets/lernpfad_grafik.png` (ca. 3,23 MB) und `interactive/trap/trap.png` (ca. 3,07 MB).

Die genannten Bildgrößen sind Dateigrößen im Arbeitsbaum, keine gemessenen Ladezeiten. Es wurden weder Lighthouse-Messungen noch ein vollständiges fachliches oder barrierefreiheitstechnisches Audit durchgeführt. Die GitHub-Pages-Einstellungen konnten nicht eingesehen werden; eine aktive Veröffentlichung ist damit nicht bestätigt.

## Priorisierte Roadmap

### Priorität 1: GitHub-Pages-Veröffentlichung verifizieren

In den Repository-Einstellungen einmalig klären, welche Pages-Quelle tatsächlich verwendet wird. Für die statische Website ist **Veröffentlichung aus dem Stammverzeichnis eines ausgewählten Branches** der einfachste Einstieg. Nicht parallel eine zweite Deployment-Methode einrichten, solange nicht bewusst auf eine Actions-Veröffentlichung umgestellt wird.

**Arbeitsschritte**

1. In GitHub unter **Settings → Pages** Branch, Quellordner, Status und veröffentlichte URL prüfen.
2. Einen kleinen, ungefährlichen Dokumentationswechsel veröffentlichen und die Live-Seite über die dort angezeigte URL prüfen.
3. Gewählte Quelle und den Prüfweg in [Entwicklung und Tests](development.md#github-pages-deployment) aktuell halten.

**Abnahmekriterien:** Die Pages-URL ist bekannt; ein Commit auf die konfigurierte Quelle wird veröffentlicht; die Startseite und die neu hinzugefügte Seite lassen sich online öffnen.

### Priorität 2: Automatische Qualitätsprüfungen ergänzen

Eine kleine CI-Prüfung bei Pull Requests sollte zuerst vorhandene, messbare Fehlerklassen abfangen. Der aktuelle Link-Check ist sauber; er eignet sich als Baseline, nicht als Grund für einen großen Umbau.

**Empfohlener Umfang**

- Lokale Links und Asset-Pfade aller HTML-Seiten prüfen.
- Neue normale Lernseiten auf `lang`, Viewport-Metadaten und sinnvolle Bildalternativen prüfen. Test-Fixtures getrennt behandeln, damit ihre besonderen Anforderungen nicht fälschlich als Seitenfehler gewertet werden.
- Vorhandene Node-Modelltests gezielt ausführen und Python-/Browser-Tests entsprechend ihrer Topic-Anleitungen ergänzen.
- Fehler mit Dateipfad und Verweis ausgeben; bei nicht verfügbarem Browser oder Runner nicht erfolgreich „durchfallen“ oder den Test stillschweigend überspringen.

**Abnahmekriterien:** Ein absichtlich falscher lokaler Link lässt den Check fehlschlagen; der unveränderte Stand besteht; die Pull-Request-Prüfung ist ohne manuelle Browserdaten zuverlässig wiederholbar.

### Priorität 3: Testabdeckung nach Lernrisiko ausbauen

Tests sind besonders wichtig, wenn fehlerhafte Ergebnisse falsches Lernen verursachen oder Daten verloren gehen könnten. Daher zuerst Berechnungsmodelle, Antwortauswertung, Zustandswechsel und Speicherung interaktiver Einheiten testen. Für reine Erklärseiten ist nicht automatisch eine eigene Testsuite erforderlich.

**Vorgehen**

1. Für jede neue oder wesentlich geänderte interaktive Einheit das passende Testverfahren aus ihrer README festlegen.
2. Rechenlogik nach Möglichkeit DOM-unabhängig testen.
3. Fachlich wichtige Grenzfälle sowie leere, ungültige und falsche Eingaben einschließen.
4. Browser-Tests mit getrennten/temporären Profilen ausführen, sofern sie Speicherstände verändern.

**Abnahmekriterien:** Jede neu eingeführte relevante Berechnung hat fokussierte Tests; dokumentierte Tests sind für andere Entwickler reproduzierbar.

### Priorität 4: KI-gestützte Erstellung als überprüfbaren Arbeitsablauf nutzen

Die [Prompt-Vorlage für Lerneinheiten](prompt-vorlage-lerneinheit.md) ist eine vorhandene Grundlage. Sie sollte mit verschieden großen Aufgaben erprobt und anhand tatsächlicher Ergebnisse verbessert werden – nicht nur anhand des Prompts selbst.

**Vorgehen**

1. Die Vorlage bei einer kurzen Erklärseite, einer Übung und einer Einheit mit Modell/Berechnung testen.
2. Prüfen, ob die Coding-KI benachbarte Beispiele liest, lokal passende Pfade verwendet, Tests ausführt und relevante Dokumentation aktualisiert.
3. Fachliche Aussagen, Lösungen, Quellen, Modellgrenzen und Sicherheitshinweise immer durch eine Lehrkraft oder Fachperson prüfen.
4. Erst bei wiederkehrenden Lücken ein dauerhaftes, werkzeugspezifisches Projektregelwerk ergänzen.

**Abnahmekriterien:** Die KI liefert einen nachvollziehbaren Diff, benennt ausgeführte und nicht ausführbare Tests ehrlich und hinterlässt keine veralteten Anleitungen.

### Priorität 5: Große Assets mit Messung optimieren

Die größten Bilder sollten nach tatsächlicher Verwendung priorisiert werden. Wo Bildinhalt und Lizenz es erlauben, Auflösung und Format (z. B. WebP) optimieren. Diagramme, Beschriftungen und handgezeichnete Details müssen nach Umwandlung visuell geprüft werden. Keine Quelldateien ohne bewusste Entscheidung ersetzen.

Bei Bedarf `width` und `height` an Bild-Elementen setzen und nicht kritische Bilder unterhalb des sichtbaren Bereichs verzögert laden. Vorher und nachher Dateigröße sowie Bildqualität auf Desktop und Smartphone vergleichen.

**Abnahmekriterien:** Spürbar kleinere übertragene Dateien ohne unleserliche Diagramme, Layoutsprünge oder verlorene Alternativtexte. Performance-Aussagen erst nach Messung treffen.

### Priorität 6: Wiederverwendbarkeit behutsam erhöhen

Fachbereiche haben ähnliche Karten- und Seitenmuster, aber eigene Farbwelten und vorhandene Spezialfälle. Deshalb Stylesheets nicht sofort zusammenlegen. Zuerst wiederkehrende, stabile Grundlagen identifizieren – etwa Fokusdarstellung, responsive Abstände oder gemeinsame Navigation – und nur dann schrittweise extrahieren, wenn Änderungen dadurch tatsächlich leichter und sicherer werden.

**Abnahmekriterien:** Eine gemeinsame Regel hat mindestens mehrere reale Nutzer und kann geändert werden, ohne fachfremde Seiten unbeabsichtigt zu verändern. Visuelle Regressionen werden stichprobenartig auf betroffenen Seiten geprüft.

## Dauerhafte Leitplanken

- HTML, CSS und JavaScript ohne Build-System beibehalten, solange neue Anforderungen keinen klaren Bedarf dafür schaffen.
- Relative URLs nutzen und jeden neuen Navigationspfad prüfen; GitHub-Pages-Unterpfade und Groß-/Kleinschreibung beachten.
- Themen-README bei Änderungen an fachlichen Annahmen, Datenverhalten, Sicherheit oder Testabläufen aktualisieren.
- Keine Lernenden-/Personendaten, Zugangsdaten oder Browserprofile committen. Lokale Speicherung, Einwilligung und Zurücksetzen transparent halten.
- Neue Einheiten mit Zielgruppe, Lernzielen, Vorwissen, Ablauf, Rückmeldung und fachlichen Grenzen planen.
- Messwerte von Lernenden von Ideal- oder Vergleichswerten unterscheiden; Unsicherheiten nicht verbergen.

## Empfohlene Reihenfolge

1. Pages-Quelle und Live-Veröffentlichung verifizieren.
2. Kleine Pull-Request-Checks für lokale Verweise und ausgewählte Tests ergänzen.
3. Tests dort ausbauen, wo fachliche Berechnungen oder Lernstände betroffen sind.
4. Coding-KI-Vorlage an realen Aufgaben erproben und nachjustieren.
5. Große Assets und wiederkehrende Styles gezielt und messbar optimieren.

Diese Reihenfolge reduziert zuerst Veröffentlichungs- und Wartungsrisiken und lässt die bewährte statische Struktur unangetastet.
