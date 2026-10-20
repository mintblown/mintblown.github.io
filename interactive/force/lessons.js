'use strict';

const ForceLessons = (() => {
  const dialog = document.querySelector('#activity');
  const body = document.querySelector('#activity-body');
  const title = document.querySelector('#activity-title');
  const kicker = document.querySelector('#activity-kicker');
  const fmt = value => Number(value).toLocaleString('de-DE', { maximumFractionDigits: 2 });
  const numeric = (id, label, unit, extra = '') => `<label class="number-label" for="${id}">${label}<span><input id="${id}" name="${id}" type="number" step="any" min="0" required ${extra}> ${unit}</span></label>`;
  const feedback = '<p class="feedback" role="status" aria-live="polite"></p>';
  const card = (heading, content) => `<section class="exercise"><h3>${heading}</h3>${content}${feedback}</section>`;
  const check = action => `<button type="button" class="action secondary" data-check="${action}">Antwort prüfen</button>`;
  let lastFocus;

  function vectorBoard(id, addition = false) {
    return `<div class="vector-widget" data-vector="${id}" data-x="1" data-y="1">
      <p class="hint">Ziehe die Pfeilspitze ins Gitter oder nutze die Zahlenfelder. Ein Kästchen entspricht 1 N. Rechts und oben sind positiv.</p>
      <svg class="vector-board" viewBox="0 0 360 250" role="img" aria-label="Zeichenfläche für einen Kraftpfeil; alternativ Zahlenfelder darunter verwenden">
        <defs><pattern id="grid-${id}" width="24" height="24" x="60" y="190" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#c4d5d1" stroke-width="1"/></pattern><marker id="arrow-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#176f9a"/></marker><marker id="given-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#bc6034"/></marker></defs>
        <rect x="36" y="22" width="288" height="192" fill="url(#grid-${id})"/>
        <path d="M 60 22 V 190 H 324" fill="none" stroke="#58716b"/>
        <text x="10" y="20">oben</text><text x="293" y="235">rechts</text><text x="44" y="208">0</text>
        ${addition ? `<path d="M 60 190 H 132 M 132 190 V 94" stroke="#bc6034" stroke-width="3" fill="none" marker-mid="url(#given-${id})" marker-end="url(#given-${id})"/><text x="81" y="212">3 N</text><text x="141" y="146">4 N</text>` : ''}
        <line class="drawn-vector" x1="60" y1="190" x2="84" y2="166" stroke="#176f9a" stroke-width="4" marker-end="url(#arrow-${id})"/>
        <circle class="vector-tip" cx="84" cy="166" r="8" fill="#176f9a" stroke="white" stroke-width="2"/>
        <circle cx="60" cy="190" r="4" fill="#233e3c"/>
      </svg>
      <div class="vector-fields"><label>Nach rechts (N)<input type="number" data-axis="x" min="0" max="10" step="0.5" value="1" required></label><label>Nach oben (N)<input type="number" data-axis="y" min="0" max="6" step="0.5" value="1" required></label></div>
      <p class="vector-value" aria-live="polite"></p>
    </div>`;
  }

  function rampWidget(id, showForce = true) {
    return `<div class="ramp-widget" data-ramp="${id}" data-show-force="${showForce}">
      <label for="${id}">Rampenlänge s: <output class="ramp-length" for="${id}"></output></label>
      <input id="${id}" type="range" min="1.5" max="9" step="0.5" value="3">
      <svg viewBox="0 0 430 210" class="experiment-view" role="img" aria-label="Veränderbare Rampe mit einer Last von 120 Newton auf 1,5 Meter Höhe">
        <path d="M 25 178 H 400" stroke="#849c94" fill="none"/>
        <path class="ramp-shape" fill="#d4b58a" stroke="#8b633a" stroke-width="3"/>
        <g class="ramp-load"><rect x="-18" y="-32" width="36" height="30" rx="3" fill="#dc8c4a" stroke="#774623"/><text y="-12" text-anchor="middle" font-size="11">120 N</text></g>
        <text x="22" y="26">h = 1,5 m</text><text class="ramp-force" x="210" y="35"></text>
      </svg>
      <p class="ramp-summary" aria-live="polite"></p>
    </div>`;
  }

  const lessonContent = {
    kraftpfeile: () => `<p class="intro">Kräfte haben einen Betrag, eine Richtung und einen Angriffspunkt. Ein Pfeil beginnt am Angriffspunkt; seine Spitze zeigt die Richtung. Je länger der Pfeil, desto größer die Kraft. Die Einheit ist Newton (N).</p><p class="formula">1 kN = 1 000 N · 1 N = 1 000 mN</p>
      ${card('1 · Einheiten umrechnen', `<p>Rechne 0,75 kN in Newton um.</p>${numeric('convert', 'Kraft', 'N')}${check('convert')}`)}
      ${card('2 · Einen Kraftpfeil zeichnen', `<p>Zeichne eine Kraft von <strong>4 N nach rechts</strong>. Beginne am markierten Angriffspunkt.</p>${vectorBoard('practice-arrow')}${check('arrow')}`)}
      ${card('3 · Zwei Kräfte addieren', `<p>3 N wirken nach rechts, 4 N nach oben. Verschiebe die Pfeile gedanklich Spitze an Anfang. Zeichne die <strong>resultierende Kraft vom Anfang des ersten bis zur Spitze des zweiten Pfeils</strong>.</p>${vectorBoard('practice-sum', true)}${check('sum')}`)}`,
    hebel: () => `<p class="intro">Ein Hebel dreht sich um einen Drehpunkt. Der Kraftarm ist der senkrechte Abstand vom Drehpunkt zur Wirkungslinie der Kraft. Im Gleichgewicht sind beide Drehmomente gleich groß.</p><p class="formula">F₁ · l₁ = F₂ · l₂</p>
      ${card('Bringe den Hebel ins Gleichgewicht', `<p>Verschiebe die Gewichte über die Kraftarme und ändere ihre Gewichtskräfte. Finde eine Einstellung mit gleichen Drehmomenten.</p><div class="lever-widget"><svg class="experiment-view" viewBox="0 0 500 240" role="img" aria-label="Virtueller Hebel mit verstellbaren Gewichten"><path d="M 250 135 L 220 215 H 280 Z" fill="#b8c9c2" stroke="#4e7466"/><g class="lever-beam"><rect x="35" y="125" width="430" height="14" rx="5" fill="#a9703c"/><g class="left-weight"><line y1="132" y2="170" stroke="#3c5960"/><rect x="-20" y="169" width="40" height="36" rx="5" fill="#428da0"/></g><g class="right-weight"><line y1="132" y2="170" stroke="#3c5960"/><rect x="-20" y="169" width="40" height="36" rx="5" fill="#dc9951"/></g></g><circle cx="250" cy="132" r="6" fill="#234c43"/></svg>
      <div class="control-grid"><label>Gewichtskraft links (N)<input data-lever="leftForce" type="range" min="10" max="100" step="10" value="40"><output></output></label><label>Kraftarm links (m)<input data-lever="leftArm" type="range" min="0.5" max="4" step="0.5" value="2"><output></output></label><label>Gewichtskraft rechts (N)<input data-lever="rightForce" type="range" min="10" max="100" step="10" value="20"><output></output></label><label>Kraftarm rechts (m)<input data-lever="rightArm" type="range" min="0.5" max="4" step="0.5" value="3"><output></output></label></div><p class="lever-summary" aria-live="polite"></p></div>`)} `,
    'kraft-und-weg': () => `<p class="intro">Eine Rampe hilft, eine Last mit weniger Zugkraft anzuheben. Dafür legst du einen längeren Weg zurück. Wir betrachten eine ideale Rampe ohne Reibung: Die Last hat eine Gewichtskraft von 120 N und wird um 1,5 m angehoben.</p><p class="formula">F = F<sub>G</sub> · h / s</p>
      ${card('Experiment · Wie hilft eine längere Rampe?', `<p>Verändere die Länge und beobachte die Zugkraft. Was passiert beim Verdoppeln der Länge?</p>${rampWidget('ramp-lesson')}<p>Stelle die Rampe so ein, dass du nur noch <strong>30 N</strong> benötigst.</p>${check('ramp')}`)}`,
    'goldene-regel': () => `<p class="intro">Was du an Kraft sparst, musst du an Weg zusetzen. An der idealen Maschine bleibt die Arbeit gleich. In der Wirklichkeit geht zusätzlich Energie durch Reibung verloren.</p><p class="formula">W = F · s = F<sub>G</sub> · h · Einheit: 1 J = 1 N · m</p>
      ${card('Experiment · Sammle Messwerte', `<p>Hebe die 120-N-Last um 1,5 m an. Wähle mindestens zwei verschiedene Rampenlängen, notiere die Messwerte und berechne jeweils F · s.</p>${rampWidget('gold-ramp')}<button class="action secondary" type="button" id="record">Messwert übernehmen</button><div class="table-scroll"><table><caption>Dein Messprotokoll</caption><thead><tr><th>s (m)</th><th>F (N)</th><th>Dein F · s (J)</th></tr></thead><tbody id="measurements"></tbody></table></div><p id="empty-measurements" class="hint">Noch keine Messwerte aufgenommen.</p>${check('gold')}`)}`,
    flaschenzug: () => `<p class="intro">Eine feste Rolle ändert die Zugrichtung. Lose Rollen bewegen sich mit der Last und verteilen ihre Gewichtskraft auf mehrere tragende Seilabschnitte. Zähle nur die Abschnitte, die den beweglichen Rollenblock tragen, nicht das freie Zugende. Wir vernachlässigen Reibung und das Eigengewicht der Rollen.</p><p class="formula">F = F<sub>G</sub> / n · Zugweg s = n · Hubhöhe h</p>
      ${card('Expertenlabor · Baue einen Flaschenzug', `<label for="ropes">Anordnung<select id="ropes"><option value="1">Nur eine feste Rolle · 1 tragendes Seil</option><option value="2">1 feste + 1 lose Rolle · 2 tragende Seile</option><option value="4">2 feste + 2 lose Rollen · 4 tragende Seile</option><option value="6">3 feste + 3 lose Rollen · 6 tragende Seile</option></select></label><label for="lift">Hubhöhe: <output id="lift-value"></output><input id="lift" type="range" min="0.5" max="3" step="0.5" value="1"></label><svg id="pulley-view" viewBox="0 0 430 270" class="experiment-view" role="img" aria-label="Schematische Darstellung des konfigurierten Flaschenzugs"></svg><p id="pulley-summary" class="formula" aria-live="polite"></p><p>Berechne die Zugkraft und den Zugweg für deine aktuelle Anordnung. Die Last hat eine Gewichtskraft von 240 N.</p><div class="control-grid">${numeric('pulley-force', 'Zugkraft', 'N')}${numeric('pulley-distance', 'Zugweg', 'm')}</div>${check('pulley')}`)}`
  };

  const examContent = {
    1: () => `<p class="intro">Kräfte zeichnest du als Pfeile. Ihre Länge steht für den Betrag, ihre Spitze für die Richtung. 1 kN entspricht 1 000 N. Zum Addieren setzt du die Pfeile Spitze an Anfang.</p>
      ${card('1 · Einheiten', `<p>Wie viele Newton sind <strong>2,5 kN</strong>?</p>${numeric('newtons', 'Kraft', 'N')}`)}
      ${card('2 · Kraftpfeil', `<p>Zeichne vom Angriffspunkt aus einen Pfeil für <strong>4 N nach rechts</strong>. Ein Kästchen entspricht 1 N.</p>${vectorBoard('exam-arrow')}`)}
      ${card('3 · Kräfteaddition', `<p>Zeichne die resultierende Kraft aus <strong>3 N nach rechts und 4 N nach oben</strong>. Die beiden gegebenen Pfeile stehen bereits Spitze an Anfang.</p>${vectorBoard('exam-sum', true)}`)}`,
    2: () => `<p class="intro">An einer idealen Rampe gilt F · s = F<sub>G</sub> · h. Bei gleicher Last und Höhe sinkt die Zugkraft, wenn der Weg länger wird. Alle Aufgaben gelten ohne Reibung.</p>
      ${card('1 · Rampe einstellen', `<p>Die Last wiegt 120 N, die Höhe beträgt 1,5 m. Stelle die Rampe so ein, dass die erforderliche Zugkraft <strong>30 N</strong> beträgt.</p>${rampWidget('exam-ramp', false)}`)}
      ${card('2 · Zugkraft bestimmen', `<p>Eine andere Rampe ist <strong>4 m</strong> lang. Eine Last mit einer Gewichtskraft von <strong>120 N</strong> wird darauf um <strong>1,5 m</strong> angehoben. Welche Zugkraft ist nötig?</p>${numeric('force', 'Zugkraft', 'N')}`)}
      ${card('3 · Zusammenhang erklären', `<label for="explanation">Was passiert bei gleicher Höhe und Last, wenn die Rampenlänge verdoppelt wird?</label><select id="explanation" required><option value="">Bitte wählen …</option><option value="greater">Die Zugkraft wird doppelt so groß.</option><option value="longer">Die Zugkraft halbiert sich; das Produkt F · s bleibt gleich.</option><option value="same">Die Zugkraft bleibt gleich; die Arbeit verdoppelt sich.</option></select>`)}`,
    3: () => `<p class="intro">Die Goldene Regel verknüpft Kraft und Weg: W = F · s. Bei idealen Maschinen bleibt dieses Produkt gleich. Ein Flaschenzug mit n tragenden Seilabschnitten braucht F<sub>G</sub> / n an Zugkraft und den n-fachen Zugweg.</p>
      ${card('1 · Arbeit berechnen', `<p>Du ziehst mit <strong>60 N</strong> über einen Weg von <strong>3 m</strong>. Wie groß ist die verrichtete Arbeit?</p>${numeric('work', 'Arbeit', 'J')}`)}
      ${card('2 · Fehlende Größe bestimmen', `<p>Eine ideale Maschine verrichtet <strong>180 J</strong> Arbeit. Du ziehst mit <strong>45 N</strong>. Wie lang ist der Zugweg?</p>${numeric('distance', 'Zugweg', 'm')}`)}
      ${card('3 · Kraftersparnis am Flaschenzug', `<p>Eine Last hat eine Gewichtskraft von <strong>240 N</strong>. Der Flaschenzug hat <strong>4 tragende Seilabschnitte</strong>. Welche Zugkraft brauchst du?</p>${numeric('force', 'Zugkraft', 'N')}`)}`
  };

  function showFeedback(section, ok, message) {
    const node = section.querySelector('.feedback');
    node.textContent = message;
    node.className = `feedback ${ok ? 'correct' : 'incorrect'}`;
  }
  function getNumber(id) { return body.querySelector(`#${id}`).value; }
  function getVector(id) {
    const widget = body.querySelector(`[data-vector="${id}"]`);
    return { x: widget.querySelector('[data-axis="x"]').value, y: widget.querySelector('[data-axis="y"]').value };
  }

  function mountVectors() {
    body.querySelectorAll('.vector-widget').forEach(widget => {
      const svg = widget.querySelector('svg');
      const xInput = widget.querySelector('[data-axis="x"]');
      const yInput = widget.querySelector('[data-axis="y"]');
      const draw = () => {
        const x = Number(xInput.value), y = Number(yInput.value);
        widget.dataset.x = x; widget.dataset.y = y;
        widget.querySelector('.drawn-vector').setAttribute('x2', 60 + x * 24);
        widget.querySelector('.drawn-vector').setAttribute('y2', 190 - y * 24);
        widget.querySelector('.vector-tip').setAttribute('cx', 60 + x * 24);
        widget.querySelector('.vector-tip').setAttribute('cy', 190 - y * 24);
        widget.querySelector('.vector-value').textContent = `Betrag deines Pfeils: ${fmt(Math.hypot(x, y))} N`;
      };
      const point = event => {
        const position = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
        xInput.value = Math.max(0, Math.min(10, Math.round((position.x - 60) / 12) / 2));
        yInput.value = Math.max(0, Math.min(6, Math.round((190 - position.y) / 12) / 2));
        draw();
      };
      let dragging = false;
      svg.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        dragging = true; svg.setPointerCapture(event.pointerId); point(event);
      });
      svg.addEventListener('pointermove', event => { if (dragging) point(event); });
      svg.addEventListener('pointerup', () => { dragging = false; });
      svg.addEventListener('pointercancel', () => { dragging = false; });
      xInput.addEventListener('input', draw); yInput.addEventListener('input', draw);
      draw();
    });
  }

  function mountRamps() {
    body.querySelectorAll('.ramp-widget').forEach(widget => {
      const input = widget.querySelector('input');
      const draw = () => {
        const length = Number(input.value), { force } = ForceModel.ramp(length);
        // Scale both height and horizontal run consistently, including a vertical ramp.
        const run = Math.sqrt(length * length - 1.5 * 1.5) * 35;
        const right = 390, bottom = 178, height = 1.5 * 35;
        widget.querySelector('.ramp-shape').setAttribute('d', `M ${right - run} ${bottom} L ${right} ${bottom - height} L ${right} ${bottom} Z`);
        widget.querySelector('.ramp-load').setAttribute('transform', `translate(${right - run / 2} ${bottom - height / 2}) rotate(${-Math.asin(1.5 / length) * 180 / Math.PI})`);
        widget.querySelector('.ramp-length').textContent = `${fmt(length)} m`;
        const showForce = widget.dataset.showForce === 'true';
        widget.querySelector('.ramp-force').textContent = showForce ? `Zugkraft: ${fmt(force)} N` : '';
        widget.querySelector('.ramp-summary').textContent = showForce ? `${fmt(length)} m Weg · ${fmt(force)} N Zugkraft · stets 1,5 m Höhe` : 'Wähle die passende Länge. Die Zugkraft berechnest du selbst.';
      };
      input.addEventListener('input', draw); draw();
    });
  }

  function mountLever() {
    const widget = body.querySelector('.lever-widget');
    if (!widget) return;
    const draw = () => {
      const values = {};
      widget.querySelectorAll('input').forEach(input => {
        values[input.dataset.lever] = Number(input.value);
        input.nextElementSibling.textContent = fmt(input.value);
      });
      const left = values.leftForce * values.leftArm, right = values.rightForce * values.rightArm;
      const angle = Math.max(-16, Math.min(16, (right - left) / 8));
      widget.querySelector('.lever-beam').setAttribute('transform', `rotate(${angle} 250 132)`);
      widget.querySelector('.left-weight').setAttribute('transform', `translate(${250 - values.leftArm * 48} 0)`);
      widget.querySelector('.right-weight').setAttribute('transform', `translate(${250 + values.rightArm * 48} 0)`);
      widget.querySelector('.lever-summary').textContent = `Links: ${fmt(left)} N·m · Rechts: ${fmt(right)} N·m. ${left === right ? 'Gleichgewicht! Beide Drehmomente sind gleich.' : 'Noch kein Gleichgewicht. Die Seite mit dem größeren Drehmoment sinkt.'}`;
      showFeedback(widget.closest('.exercise'), left === right, left === right ? 'Geschafft! Du hast das Hebelgesetz angewendet.' : 'Tipp: Ein kleineres Gewicht kann durch einen längeren Kraftarm ausgeglichen werden.');
    };
    widget.querySelectorAll('input').forEach(input => input.addEventListener('input', draw)); draw();
  }

  function mountPulley() {
    const ropes = body.querySelector('#ropes');
    if (!ropes) return;
    const lift = body.querySelector('#lift');
    const draw = () => {
      const n = Number(ropes.value), height = Number(lift.value);
      const result = ForceModel.pulley(n, 240, height);
      body.querySelector('#lift-value').textContent = `${fmt(height)} m`;
      let content = '<path d="M 35 25 H 385" stroke="#6a8177" stroke-width="8"/>';
      if (n === 1) {
        content += '<circle cx="185" cy="70" r="22" fill="#b2c8c1" stroke="#375e54" stroke-width="3"/><path d="M 163 200 V 70 A 22 22 0 0 1 207 70 V 170" fill="none" stroke="#b27a2d" stroke-width="4"/><path d="M 185 25 V 48" stroke="#375e54" stroke-width="4"/><rect x="136" y="200" width="54" height="42" rx="5" fill="#cc8c47"/><text x="163" y="225" text-anchor="middle">240 N</text><text x="219" y="175">↓ Zug</text>';
      } else {
        const spacing = 38, start = (430 - n * spacing) / 2;
        let rope = `M ${start} 25 V 150`;
        for (let i = 0; i < n / 2; i++) {
          const x = start + i * spacing * 2;
          content += `<circle cx="${x + spacing / 2}" cy="150" r="19" fill="#d4b989" stroke="#745b38" stroke-width="2"/><path d="M ${x + spacing / 2} 169 V 187" stroke="#375e54" stroke-width="3"/>`;
          rope += ` A 19 19 0 0 0 ${x + spacing} 150 V 70 A 19 19 0 0 1 ${x + spacing * 2} 70`;
          if (i < n / 2 - 1) rope += ' V 150';
          content += `<circle cx="${x + spacing * 1.5}" cy="70" r="19" fill="#b2c8c1" stroke="#375e54" stroke-width="2"/><path d="M ${x + spacing * 1.5} 25 V 51" stroke="#375e54" stroke-width="3"/>`;
        }
        rope += ' V 135';
        const end = start + n * spacing;
        const center = start + (n - 1) * spacing / 2;
        content += `<path d="${rope}" fill="none" stroke="#b27a2d" stroke-width="4"/><path d="M ${start + 19} 187 H ${end - 57} M ${center} 187 V 206" stroke="#375e54" stroke-width="5"/><rect x="${center - 30}" y="206" width="60" height="38" rx="5" fill="#cc8c47"/><text x="${center}" y="230" text-anchor="middle">240 N</text><text x="${end + 5}" y="145">↓ Zug</text>`;
      }
      body.querySelector('#pulley-view').innerHTML = content;
      body.querySelector('#pulley-summary').textContent = `${n} tragende Seilabschnitte · Hubhöhe ${fmt(height)} m · Arbeit ${fmt(result.work)} J`;
      // Changing the arrangement invalidates the feedback for the old arrangement.
      showFeedback(ropes.closest('.exercise'), true, 'Berechne die Werte für diese Anordnung und prüfe deine Antwort.');
    };
    ropes.addEventListener('change', draw); lift.addEventListener('input', draw); draw();
  }

  function mountMeasurements() {
    const record = body.querySelector('#record');
    if (!record) return;
    record.addEventListener('click', () => {
      const length = Number(body.querySelector('#gold-ramp').value);
      const rows = body.querySelector('#measurements');
      if ([...rows.children].some(row => Number(row.dataset.length) === length)) {
        showFeedback(record.closest('.exercise'), false, 'Diese Länge hast du schon notiert. Wähle eine andere Rampenlänge.'); return;
      }
      const row = document.createElement('tr');
      row.dataset.length = length;
      row.innerHTML = `<td>${fmt(length)}</td><td>${fmt(ForceModel.ramp(length).force)}</td><td><input type="number" min="0" step="any" required aria-label="Arbeit bei ${fmt(length)} Meter in Joule"></td>`;
      rows.append(row); body.querySelector('#empty-measurements').hidden = true;
      row.querySelector('input').focus();
    });
  }

  function mountPractice() {
    body.querySelectorAll('[data-check]').forEach(button => button.addEventListener('click', () => {
      let ok = false, message = '';
      switch (button.dataset.check) {
        case 'convert': ok = ForceModel.close(getNumber('convert'), 750); message = ok ? 'Richtig: 0,75 · 1 000 = 750 N.' : 'Multipliziere die Angabe in kN mit 1 000.'; break;
        case 'arrow': ok = ForceModel.vector(getVector('practice-arrow'), 4, 0); message = ok ? 'Richtig: vier Kästchen nach rechts, keines nach oben.' : 'Der Pfeil muss vier Kästchen nach rechts und waagerecht verlaufen.'; break;
        case 'sum': ok = ForceModel.vector(getVector('practice-sum'), 3, 4); message = ok ? 'Richtig! Die Resultierende zeigt drei Kästchen nach rechts und vier nach oben. Ihr Betrag ist 5 N.' : 'Verbinde den Anfangspunkt mit der letzten Pfeilspitze: drei Kästchen rechts und vier oben.'; break;
        case 'ramp': ok = ForceModel.close(getNumber('ramp-lesson'), 6); message = ok ? 'Richtig: Bei 6 m Länge genügen 30 N. Die Arbeit beträgt weiterhin 180 J.' : 'Nutze s = 120 N · 1,5 m / 30 N und stelle diese Länge ein.'; break;
        case 'gold': {
          const rows = [...body.querySelector('#measurements').children];
          ok = rows.length >= 2 && rows.every(row => ForceModel.close(row.querySelector('input').value, 180, 0.2));
          message = ok ? 'Genau! Bei allen Messungen gilt F · s = 180 J. Kraft und Weg ändern sich, die Arbeit bleibt gleich.' : 'Notiere mindestens zwei unterschiedliche Längen. Multipliziere für jede Zeile die Zugkraft mit dem Weg; runde auf ganze Joule.';
          break;
        }
        case 'pulley': {
          const result = ForceModel.pulley(Number(getNumber('ropes')), 240, Number(getNumber('lift')));
          ok = ForceModel.close(getNumber('pulley-force'), result.force) && ForceModel.close(getNumber('pulley-distance'), result.distance);
          message = ok ? `Richtig! ${fmt(result.force)} N · ${fmt(result.distance)} m = ${fmt(result.work)} J. Weniger Kraft bedeutet mehr Zugweg.` : 'Teile 240 N durch die Anzahl tragender Seile. Multipliziere die Hubhöhe mit dieser Anzahl, um den Zugweg zu erhalten.';
          break;
        }
      }
      showFeedback(button.closest('.exercise'), ok, message);
    }));
  }

  function mountExam(level, onPass, previousProgress) {
    const form = body.querySelector('form');
    const hints = {
      1: ['Rechne Kilonewton mit dem Faktor 1 000 in Newton um.', 'Prüfe Betrag und Richtung deines waagerechten Pfeils.', 'Die Resultierende verbindet den ersten Anfangspunkt mit der letzten Spitze.'],
      2: ['Nutze s = F_G · h / F.', 'Berechne F = 120 N · 1,5 m / 4 m.', 'Vergleiche F · s vor und nach dem Verdoppeln.'],
      3: ['Multipliziere Kraft und Weg.', 'Teile die Arbeit durch die Zugkraft.', 'Teile die Gewichtskraft durch vier tragende Seilabschnitte.']
    };
    form.addEventListener('submit', event => {
      event.preventDefault();
      const answers = level === 1 ? { newtons: getNumber('newtons'), arrow: getVector('exam-arrow'), sum: getVector('exam-sum') }
        : level === 2 ? { length: getNumber('exam-ramp'), force: getNumber('force'), explanation: getNumber('explanation') }
        : { work: getNumber('work'), distance: getNumber('distance'), force: getNumber('force') };
      const results = ForceModel.gradeExam(level, answers);
      form.querySelectorAll('.exercise').forEach((section, index) => showFeedback(section, results[index], results[index] ? 'Richtig gelöst.' : `Noch nicht richtig. ${hints[level][index]}`));
      const passed = results.every(Boolean);
      const summary = body.querySelector('#exam-result');
      summary.textContent = passed ? '3 von 3 Aufgaben richtig – Prüfung bestanden! Der weitere Weg ist jetzt frei. Dein Fortschritt steht in der Adresszeile.' : `${results.filter(Boolean).length} von 3 Aufgaben richtig. Der Weg bleibt gesperrt. Verbessere deine Antworten und versuche es erneut.`;
      summary.className = `exam-result ${passed ? 'correct' : 'incorrect'}`;
      if (passed) {
        if (level === previousProgress + 1) onPass(level);
        form.querySelector('button[type="submit"]').disabled = true;
        form.querySelectorAll('input,select').forEach(input => { input.disabled = true; });
        form.querySelectorAll('.vector-board').forEach(svg => { svg.style.pointerEvents = 'none'; });
      }
      summary.focus();
    });
  }

  function close() { if (dialog.open) dialog.close(); }
  document.querySelector('#close-activity').addEventListener('click', close);
  dialog.addEventListener('close', () => { lastFocus?.focus({ preventScroll: true }); });
  function open(id, name, level, onPass, previousProgress) {
    lastFocus = document.activeElement;
    title.textContent = name;
    kicker.textContent = level ? `PRÜFUNG ${level} VON 3 · ALLE DREI AUFGABEN ZÄHLEN` : 'ENTDECKEN · AUSPROBIEREN · VERSTEHEN';
    body.innerHTML = level
      ? `<form>${examContent[level]()}<p class="hint">Zum Bestehen müssen alle drei Aufgaben richtig sein. Du kannst beliebig oft nachbessern.</p><button class="action" type="submit">Prüfung abgeben</button><p id="exam-result" class="exam-result" role="status" tabindex="-1"></p></form>`
      : lessonContent[id]();
    mountVectors(); mountRamps(); mountLever(); mountPulley(); mountMeasurements(); mountPractice();
    if (level) mountExam(level, onPass, previousProgress);
    dialog.showModal();
    dialog.scrollTop = 0;
  }
  return { open, close };
})();
