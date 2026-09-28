# Wegdifferenz: Historie und QR-Export

Die letzte Übungsrunde wird ausschließlich in `localStorage` unter `kkg.phef.wegdifferenz.history.v1` gespeichert. Die Historie enthält Aufgaben, akzeptierte Eingaben, Lösungszeitpunkte (ISO 8601), Sekunden bis zur richtigen Antwort und Fehlversuche pro Aufgabe. Bearbeitungszeit ist die vergangene Uhrzeit seit dem Anzeigen, einschließlich Unterbrechungen und Neuladen. Die 2,2 Sekunden Rückmeldung zwischen Aufgaben zählen nicht mit. Jede erfolglose Betätigung von „Antwort prüfen“ zählt als Fehlversuch, auch unvollständige Formulare. Der Gesamtfehlerzähler umfasst auch eine beim Beenden ungelöste Aufgabe; diese zählt nicht zu den Bearbeitungszeiten.

„Übungsrunde beenden“ sperrt weitere Antworten und zeigt den QR-Code. „Neue Runde beginnen“ ersetzt den letzten lokalen Datensatz. Bei 99 gelösten Aufgaben endet die Runde automatisch. Bei gesperrtem Browserspeicher funktioniert sie im Arbeitsspeicher; ein Hinweis erklärt die fehlende Persistenz. Zeit und Fehlerzahlen sind auf neun Dezimalstellen begrenzt.

## QR-Protokoll, Version 1

Der Inhalt besteht ausschließlich aus ASCII-Ziffern, ohne Feldnamen oder Trennzeichen. Reihenfolge und feste Breiten:

| Feld | Ziffern |
|---|---:|
| Version (`1`) | 1 |
| Anzahl gelöster Aufgaben, 00–99 | 2 |
| Gesamtzahl falscher Eingaben | 9 |
| Sekunden pro gelöster Aufgabe, chronologisch | je 9 |
| HMAC-SHA-256 als Dezimalzahl | 78 |

Alle Felder werden links mit Nullen aufgefüllt. Signiert wird die gesamte Zahlenfolge **vor** dem 78-stelligen Prüfwert, UTF-8-codiert. Schlüssel: UTF-8 `kkg`. Die 32 Digest-Bytes werden als vorzeichenlose Big-Endian-Zahl interpretiert und dezimal ausgegeben. Zeitstempel und Lösungen werden nicht in den QR übernommen.

Prüfung einer gescannten Zahlenfolge:

```sh
python3 phef/wegdifferenz/tools/verify_history.py 'ZAHLENFOLGE'
```

Der Browser nutzt Web Crypto (HTTPS oder localhost erforderlich); der Export wird bei fehlender Unterstützung mit einer konkreten Fehlermeldung abgebrochen. Der bekannte, im Client liegende Schlüssel erlaubt Konsistenzprüfung, aber keinen manipulationssicheren Leistungsnachweis. Es werden keine Daten an einen Server gesendet.

QR-Erzeugung: lokal eingebundene [Project-Nayuki-Bibliothek](https://www.nayuki.io/page/qr-code-generator-library), MIT-Lizenz im Dateikopf, heruntergeladen von `https://www.nayuki.io/res/qr-code-generator-library/qrcodegen.js`. Fehlerkorrektur mindestens Medium, weißer Rand von vier Modulen.
