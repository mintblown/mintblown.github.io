# Experimentaufbau

`html/model.js` enthält das DOM-unabhängige Modell:

- `ExperimentObject`: Position, Ausdehnung, Bodenbindung und beliebig viele Anschlüsse (`ports`). Neue Objekte werden über diese Basisklasse konfiguriert; spezialisierte Objekte können sie erweitern.
- `Port`: Ein lokaler Punkt mit einem Typ. Zwei freie Anschlüsse verschiedener Objekte sind kompatibel, wenn ihr Typ gleich ist. Pro Anschluss ist eine Verbindung möglich.
- `LinePort`: Ein Anschluss auf einer endlichen Geraden, beschrieben durch Start, Ende und Parameter `t` zwischen 0 und 1. Eine verbundene Baugruppe kann entlang dieser Geraden gleiten. Die Bewegungsberechnung verwendet Vektorprojektion und unterstützt auch andere Geradenrichtungen.
- `Connection`: Eine symmetrische Verbindung zwischen zwei Anschlüssen, ohne feste Eltern-Kind-Rollen.
- `Assembly`: Verbindungsgraph, nächste kompatible Andockpunkte, gemeinsames Verschieben, Bewegung am Gleitanschluss, Boden- und Randbegrenzung sowie Trennen und Zurücksetzen.

`html/aufbau.js` konfiguriert die sechs Objekte, deren Anschlüsse und Typfarben und verbindet das Modell mit SVG, Maus, Touch und Tastatur. Es enthält keine Tabelle erlaubter Objektpaare. Halterungen passen zu Halterungen, Haken-/Seilanschlüsse zu Haken-/Seilanschlüssen. Nur der Anschluss entlang der senkrechten Stange ist als `LinePort` konfiguriert. Die Farbe bleibt bei einer Verbindung erhalten; ein zusätzlicher blauer Rand zeigt den Belegungszustand.

Das Modell unterstützt beliebige verzweigte, schleifenfreie Aufbauten. Geschlossene Verbindungsschleifen und Verbindungen zweier Gleitanschlüsse werden abgewiesen, damit keine überbestimmten Zwangsbedingungen entstehen. Körper behalten ihre Orientierung; eine Kollisions- oder Schwerkraftsimulation ist nicht enthalten. Die Bodenbindung der Kiste und die Außenränder gelten auch für verbundene Baugruppen.

Eine Verbindung wird gezielt über das ausgewählte Objekt und die Verbindungsauswahl gelöst. Andere Verbindungen bleiben bestehen.

Tests mit Node.js:

```sh
node --test ph6/experiment-aufbauen/tests/model.test.js
```

Die Tests sind auch nach `model.js` in einer anderen JavaScript-Engine ausführbar (ohne Node-Abhängigkeiten im eigentlichen Testteil).


## Fadenpendel

`pendulum-model.js` enthält das DOM-unabhängige `Pendulum` und die Freischaltprüfung `isReady`. Der Experimentaufbau bleibt frei kombinierbar. Nur für die Pendelsimulation wird die vollständige Verbindung Kiste–Stange–Klotz–Rundhaken–Seil–Kugel verlangt. Beide Halterungsanschlüsse des Klotzes sind austauschbar; beim Seil verbindet sich das obere Ende mit dem Rundhaken und das untere mit der Kugel.

Die Bewegung folgt `θ″ = −g/L · sin(θ)` mit `g = 9,81 m/s²`, ohne Dämpfung und ohne Kleinwinkelnäherung. Grundlage: [OpenStax, Pendulums](https://openstax.org/books/university-physics-volume-1/pages/15-4-pendulums). Integration: Runge–Kutta 4 mit einem festen Zeitschritt von 1/240 s. Die Diagramme zeigen `x = L sin(θ)` und `vₓ = L cos(θ) · θ′`, abgetastet mit 120 Hz. Der Verlaufspuffer hält nur die letzten zwei Sekunden plus einen Randpunkt. Numerische Energieerhaltung ist für 120 s bei 0,1 m, 1 m und 2 m mit einer relativen Toleranz von 0,002 % getestet.

`pendulum.js` steuert Darstellung und Interaktion. Der Maßstab bleibt bei 180 SVG-Einheiten je Meter, sodass unterschiedliche Fadenlängen vergleichbar bleiben. Die Masse ist ein idealisierter Massenpunkt mit vergrößertem Griff. Neue Auslenkungen starten aus der Ruhe und setzen die Messzeit zurück. Fadenlängenänderung und Stop setzen das Pendel vollständig in die Ruhelage. Pause erhält Zustand und Messwerte. Versteckte Seiten und längere Frame-Unterbrechungen pausieren, statt Zeit nachzuholen. Das Lösen des Versuchsaufbaus stoppt und versteckt die Simulation.

Zusätzliche Tests:

```sh
node --test ph6/experiment-aufbauen/tests/pendulum.test.js
```
