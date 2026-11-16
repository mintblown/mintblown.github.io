# Lernprojekte

Lernprojekte ist eine Sammlung deutschsprachiger, browserbasierter Lernangebote für Mathematik, Physik und Informatik. Die Materialien reichen von kurzen Anleitungen zu digitalen Grundlagen bis zu interaktiven Modellen, Übungen und selbstständigen Lernpfaden.

> **Sprache:** Die Website und die meisten Lernangebote sind auf Deutsch. Die englische Projekteinführung steht in [README.md](README.md).

## Loslegen

Es gibt keinen zentralen Build-Schritt, Paketmanager oder Installationsbedarf. Zum Anschauen kann `index.html` im Browser geöffnet werden. Für die Entwicklung ist ein lokaler HTTP-Server zuverlässiger – insbesondere bei Browserspeicher, Modulen und Web Crypto:

```powershell
py -m http.server 8000
```

Anschließend <http://localhost:8000/> öffnen. Falls `py` nicht verfügbar ist, funktioniert auch `python -m http.server 8000`. Den Server mit Strg+C beenden.

Die Website besteht aus statischem HTML, CSS, JavaScript und lokalen Dateien und soll über **GitHub Pages** veröffentlicht werden. Der empfohlene Ablauf ist die Veröffentlichung aus dem Stammverzeichnis eines Branches; die einmalige Einrichtung und Prüfung sind unter [Deployment mit GitHub Pages](doc/development.md#github-pages-deployment) beschrieben. Verweise müssen relativ zur jeweiligen Seite bleiben, damit die Dateien lokal und auf GitHub Pages funktionieren.

## Projektübersicht

| Pfad | Inhalt |
| --- | --- |
| `index.html`, `styles.css`, `img/` | Hauptübersicht und gemeinsame Bilder/Stile der Startseite |
| `ma6/` | Mathematik, Klasse 6 |
| `if6/` | Digitale Grundlagen und Informatik-Einstieg |
| `ifef/` | Informatik, Einführungsphase der Oberstufe (EF) |
| `ph6/`, `ph9/` | Physik, Klasse 6 und 9 |
| `phef/` | Physik, Einführungsphase der Oberstufe (EF) |
| `phq1/` | Physik, Q1 |
| `malq1/` | Mathematik-Leistungskurs, Q1 |
| `interactive/` | Größere interaktive Projekte und Lernumgebungen |
| `codex/` | Projektspezifische Prompts und Hinweise zur Inhaltserstellung |
| `doc/` | Dokumentation für Entwicklung und Erstellung von Lerneinheiten |

In den Fachordnern gibt es meist eine Übersichtsseite (`index.html`) und je Thema einen eigenen Ordner. Eine Lerneinheit enthält häufig ihre Einstiegsseite und Skripte in `thema/html/`, Bilder in `thema/img/` und Tests in `thema/tests/`. Das ist eine Konvention, keine Pflicht: Bestehende Projekte unterscheiden sich. Orientiere dich daher an einem möglichst ähnlichen Beispiel.

## Weiterentwickeln

1. Wähle den passenden Fach-/Jahrgangsordner und sieh dir dessen Übersichtsseite sowie eine ähnliche Lerneinheit an.
2. Lies vorhandene `README.md`-Dateien direkt am Thema. Sie können fachliche Annahmen, Datenverhalten und Testabläufe erklären, die hier nicht wiederholt werden.
3. Entwickle die Einheit in der bestehenden Projektstruktur und im vorhandenen Stil. Verlinke sie auf der Fachübersicht; ergänze `index.html` im Stammverzeichnis nur, wenn das Angebot auf der Hauptseite erscheinen soll.
4. Halte Berechnungen nach Möglichkeit getrennt von der DOM-Steuerung und ergänze gezielte Tests für neues Verhalten.
5. Prüfe die Website vom Repository-Stamm aus, kontrolliere Navigation und Bilder und führe die passenden Tests aus.

Neue Lerneinheiten können auch mit einer Coding-KI wie Claude Code erstellt werden. Die [Prompt-Vorlage für eine Lerneinheit](doc/prompt-vorlage-lerneinheit.md) enthält Platzhalter für den Auftrag und weist die KI an, das Repository zu untersuchen, passend zu implementieren, zu testen und die Dokumentation zu aktualisieren. Die KI ersetzt nicht die fachliche Prüfung durch Lehrkraft oder Fachperson.

Die ausführlicheren Anleitungen erläutern Architektur, Erstellung einer Lerneinheit, KI-gestützte Umsetzung sowie Vorschau und Tests:

- [Dokumentationsübersicht](doc/README.md)
- [Projektarchitektur und Konventionen](doc/architecture.md)
- [Eine Lerneinheit erstellen](doc/creating-lessons.md)
- [Prompt-Vorlage für Coding-KIs](doc/prompt-vorlage-lerneinheit.md)
- [Lokale Vorschau, Tests und Prüfliste](doc/development.md)
- [Optimierungsstrategie](doc/optimierungsstrategie.md)

Es gibt keinen einheitlichen Testbefehl für das gesamte Repository. Testwerkzeuge und Voraussetzungen unterscheiden sich je Projekt. Vor Browser-Tests bitte [Entwicklung und Tests](doc/development.md) sowie die README des jeweiligen Themas lesen: Manche Tests verwenden temporäre Profile oder verändern lokalen Browserspeicher.

## Pädagogische und technische Leitlinien

- Lernziel und nächste Handlung sollen klar erkennbar sein. Bevorzuge kurze, sinnvolle Schritte, hilfreiche Rückmeldungen und Gelegenheiten zum Erklären und Reflektieren.
- Fachliche Modelle und ihre Grenzen werden ausdrücklich benannt. Messwerte von Lernenden dürfen nicht stillschweigend durch Ideal- oder Rechenwerte ersetzt werden.
- Berücksichtige Tastaturbedienung, Touch, kleine Bildschirme, lesbare Kontraste und verständliche Beschriftungen. Interaktive Grafiken brauchen eine zugängliche Beschreibung oder eine gleichwertige nichtgrafische Eingabe.
- Persönliche Lerndaten bleiben lokal, sofern eine Einheit nicht einen anderen Umgang nachvollziehbar erklärt und eine passende Einwilligung einholt. Keine Analyse- oder Fremddienste ohne klaren Bedarf und transparente Information einführen.
- Nutze lokale Dateien und ergänze Werkzeuge oder Abhängigkeiten nur, wenn das Projekt sie tatsächlich benötigt.

## Mitwirken

Änderungen sollen gezielt bleiben und sich an den benachbarten Projekten orientieren. Dokumentiere nicht offensichtliches, themenspezifisches Verhalten nahe an der Einheit. Vor dem Teilen prüfen, ob alle Verweise funktionieren, die Einheit auf schmalen Bildschirmen und mit der Tastatur nutzbar ist und die passenden Tests erfolgreich sind. Zugangsdaten, Lerndaten und erzeugte Browserprofile gehören nicht ins Repository.
