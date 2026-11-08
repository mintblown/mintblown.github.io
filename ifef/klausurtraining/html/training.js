'use strict';
let Training;
let persistentStorageAllowed = false;
function startTraining() {
  if (Training) return;
  Training = (() => {
  const { stations, escape, code } = TrainingContent;
  const $ = id => document.getElementById(id);
  const storageKey = 'ifef-klausurtraining-v1';
  const total = stations.reduce((sum, station) => sum + station.questions.length, 0);
  const validIDs = new Set(stations.flatMap((station, i) => station.questions.map((_, j) => `${i}-${j}`)));
  const initialState = () => ({ contentRevision:2, station:0, question:0, solved:[], assisted:[], reviewed:[], notes:{} });
  let state = initialState();
  let storageAvailable = true;
  if (persistentStorageAllowed) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && typeof saved === 'object') {
      if (Number.isInteger(saved.station) && saved.station >= 0 && saved.station < stations.length) state.station = saved.station;
      if (Number.isInteger(saved.question) && saved.question >= 0 && saved.question < stations[state.station].questions.length) state.question = saved.question;
      for (const list of ['solved','assisted','reviewed']) if (Array.isArray(saved[list])) state[list] = [...new Set(saved[list].filter(id => validIDs.has(id)))];
      // Only this replaced task needs to be answered again; keep all other progress.
      if (saved.contentRevision !== 2) for (const list of ['solved','assisted','reviewed']) state[list] = state[list].filter(id => id !== '0-3');
      if (saved.notes && typeof saved.notes === 'object') for (let i = 0; i < stations.length; i++) if (typeof saved.notes[i] === 'string') state.notes[i] = saved.notes[i].slice(0,10000);
      state.reviewed = state.reviewed.filter(id => !state.solved.includes(id));
    }
  } catch { storageAvailable = false; }
  }
  function save() {
    if (!persistentStorageAllowed) {
      $('storage-status').textContent = 'Ihr Lernstand bleibt nur in dieser geöffneten Seite erhalten. Beim Schließen oder Neuladen wird er verworfen.';
      return;
    }
    try { localStorage.setItem(storageKey, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
    $('storage-status').textContent = storageAvailable ? '' : 'Der Browser erlaubt derzeit keine dauerhafte Speicherung. Das Training funktioniert für diese Sitzung weiter.';
  }
  const taskID = () => `${state.station}-${state.question}`;
  // Compare Java tokens, preserving identifier boundaries, literal case and punctuation.
  function javaTokens(value) {
    const tokens = String(value).match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?[fFdDlL]?|==|!=|>=|<=|\+\+|--|\+=|-=|\*=|\/=|&&|\|\||<<|>>|[{}()[\].,;=+*\/%!<>?:-]|\S/g) || [];
    return JSON.stringify(tokens);
  }
  function gradeField(field, value) {
    const answers = Array.isArray(field.answer) ? field.answer : [field.answer];
    if (field.kind === 'number') return /^\d+$/.test(value.trim()) && answers.some(answer => Number(value) === answer);
    if (field.kind === 'java') return answers.some(answer => javaTokens(value) === javaTokens(answer));
    return answers.some(answer => value.trim() === String(answer));
  }
  function updateProgress() {
    $('progress').max = total; $('progress').value = state.solved.length;
    $('progress-text').textContent = `${state.solved.length} von ${total} selbst gelöst · ${state.reviewed.length} mit Lösung nachgearbeitet`;
    $('stations').innerHTML = stations.map((station, i) => {
      const own = station.questions.filter((_, j) => state.solved.includes(`${i}-${j}`)).length;
      return `<button type="button" data-station="${i}" ${state.station === i ? 'aria-current="step"' : ''}>${i + 1}. ${station.name}<small>${own}/${station.questions.length} selbst gelöst · ${station.time} Min.</small></button>`;
    }).join('');
    $('stations').querySelectorAll('button').forEach(button => button.addEventListener('click', () => selectStation(Number(button.dataset.station))));
    $('badges').innerHTML = stations.map((station, i) => {
      const own = station.questions.filter((_, j) => state.solved.includes(`${i}-${j}`)).length;
      const reviewed = station.questions.filter((_, j) => state.reviewed.includes(`${i}-${j}`)).length;
      return `<div class="badge ${own === station.questions.length ? 'won' : ''}"><strong>${own === station.questions.length ? '✓ ' : ''}${station.name}</strong>${own}/${station.questions.length} selbst gelöst${reviewed ? `<br>${reviewed} mit Lösung nachgearbeitet` : ''}</div>`;
    }).join('');
    $('finish-message').textContent = state.solved.length === total
      ? 'Alle 40 Aufgaben selbst gelöst. Prüfen Sie auch Ihre schriftlichen Begründungen und Diagramme – diese gehören zur Klausurvorbereitung dazu.'
      : `${state.solved.length} Aufgaben selbst gelöst, ${state.reviewed.length} mit Lösung nachgearbeitet. Nutzen Sie den Lernpass, um gezielt offene Themen zu wiederholen.`;
    updateBlockCompletion();
  }
  function updateBlockCompletion() {
    const complete = stations[state.station].questions.every((_, index) => {
      const id = `${state.station}-${index}`;
      return state.solved.includes(id) || state.reviewed.includes(id);
    });
    $('block-complete').hidden = !complete;
    $('block-complete').textContent = complete ? 'Fasse deine Erkenntnisse zusammen und gehe zur nächsten Lektion.' : '';
  }
  function selectStation(index) {
    state.station = index; state.question = 0; render();
    $('station-title').focus({ preventScroll:true }); $('werkstatt').scrollIntoView({ block:'start' });
  }
  function render() {
    save(); updateProgress();
    const station = stations[state.station];
    $('station-meta').textContent = `Station ${state.station + 1} von ${stations.length} · ${station.time} Minuten`;
    $('station-title').textContent = station.title; $('station-intro').textContent = station.intro;
    $('lesson').innerHTML = `<div class="learn">${station.lesson}</div>`;
    $('reflection').textContent = station.reflection; $('notes').value = state.notes[state.station] || '';
    $('next-station').textContent = state.station === stations.length - 1 ? 'Zum Lernpass ↓' : 'Zur nächsten Station →';
    setupExperiments(); renderQuestion();
  }
  function renderQuestion() {
    save();
    const question = stations[state.station].questions[state.question];
    $('question-count').textContent = `Aufgabe ${state.question + 1} von ${stations[state.station].questions.length}`;
    $('exercise').innerHTML = `<h3>${question.title}</h3>${question.prompt}`;
    $('answers').innerHTML = question.fields.map(field => {
      const id = `answer-${field.key}`;
      if (field.kind === 'choice') return `<fieldset id="field-${field.key}" class="answer-field"><legend>${escape(field.label)}</legend>${field.options.map(([value,label], index) => `<label class="choice" for="${id}-${index}"><input id="${id}-${index}" type="radio" name="${field.key}" value="${escape(value)}"> <span>${escape(label)}</span></label>`).join('')}<p class="field-result" aria-live="polite"></p></fieldset>`;
      return `<div class="answer-field" id="field-${field.key}"><label for="${id}">${escape(field.label)}</label><input id="${id}" type="text" name="${field.key}" ${field.kind === 'number' ? 'inputmode="numeric"' : ''} ${field.hint ? `aria-describedby="${id}-hint"` : ''} autocomplete="off" spellcheck="false">${field.hint ? `<p class="small answer-hint" id="${id}-hint">${escape(field.hint)}</p>` : ''}<p class="field-result" aria-live="polite"></p></div>`;
    }).join('');
    $('feedback').className = 'status';
    $('feedback').textContent = state.solved.includes(taskID()) ? '✓ Diese Aufgabe haben Sie bereits selbst gelöst.' : state.reviewed.includes(taskID()) ? 'Diese Aufgabe haben Sie mit Musterlösung nachgearbeitet.' : state.assisted.includes(taskID()) ? 'Die Musterlösung wurde schon geöffnet. Weitere richtige Antworten zählen hier als Nacharbeiten mit Lösung.' : '';
    $('hint').hidden = true; $('hint').replaceChildren();
    $('prev').disabled = state.question === 0;
    $('next').disabled = state.question === stations[state.station].questions.length - 1;
  }
  function submit(event) {
    event.preventDefault();
    const question = stations[state.station].questions[state.question];
    const data = new FormData($('answer-form'));
    let missing = false;
    let missingSemicolons = 0;
    const results = question.fields.map(field => {
      const value = String(data.get(field.key) ?? '');
      const blank = !value.trim(); missing ||= blank;
      const correct = !blank && gradeField(field, value);
      const missingSemicolon = state.station === 2 && state.question === 2 && !blank && !correct
        && !value.trim().endsWith(';') && gradeField(field, `${value.trim()};`);
      if (missingSemicolon) missingSemicolons++;
      const wrapper = $(`field-${field.key}`);
      wrapper.classList.toggle('invalid', !correct);
      wrapper.querySelectorAll('input').forEach(input => input.setAttribute('aria-invalid', String(!correct)));
      wrapper.querySelector('.field-result').textContent = blank ? 'Bitte geben Sie eine Antwort an.'
        : correct ? '✓ Richtig.'
        : missingSemicolon ? 'Die Berechnung ist richtig. Bei dieser vollständigen Java-Anweisung fehlt am Ende das Semikolon (;).'
        : 'Noch nicht richtig. Prüfen Sie diesen Teil noch einmal.';
      return correct;
    });
    const correct = results.every(Boolean);
    $('feedback').className = `status ${correct ? 'good' : 'bad'}`;
    if (correct) {
      if (!state.solved.includes(taskID())) {
        const list = state.assisted.includes(taskID()) ? state.reviewed : state.solved;
        if (!list.includes(taskID())) list.push(taskID());
      }
      $('feedback').textContent = state.solved.includes(taskID()) ? '✓ Alle Teilantworten stimmen. Die Aufgabe zählt als selbst gelöst.' : '✓ Alle Teilantworten stimmen. Die Aufgabe zählt als mit Musterlösung nachgearbeitet.';
      save(); updateProgress();
    } else $('feedback').textContent = missing ? 'Es fehlt noch mindestens eine Antwort. Ergänzen Sie die markierten Felder.'
      : missingSemicolons === results.filter(result => !result).length
        ? 'Die Berechnungen stimmen. Ergänzen Sie die fehlenden Semikolons bei den markierten Java-Anweisungen und prüfen Sie erneut.'
        : `${results.filter(Boolean).length} von ${results.length} Teilantworten stimmen. Nutzen Sie bei Bedarf den Tipp und probieren Sie es erneut.`;
  }
  function setupExperiments() {
    setupBits(); setupDivision(); setupDoubling(); setupPAP(); setupTypes(); setupVariables(); setupInformation(); setupClass(); setupObjects();
  }
  function setupBits() {
    if (!$('bit-lab')) return;
    const bits = [...'01000010'].map(Number);
    function draw() {
      $('bit-lab').innerHTML = bits.map((bit,i) => `<div><small>${2 ** (7-i)}</small><button type="button" data-bit="${i}" aria-label="Bit mit Stellenwert ${2 ** (7-i)} umschalten" aria-pressed="${Boolean(bit)}">${bit}</button></div>`).join('');
      const value = parseInt(bits.join(''),2);
      const ascii = value >= 32 && value <= 126 ? `„${escape(String.fromCharCode(value))}“` : value < 128 ? 'nicht druckbares ASCII-Steuerzeichen' : 'kein Standard-ASCII (nur 0–127)';
      const sum = bits.flatMap((bit,i) => bit ? [2 ** (7-i)] : []);
      $('bit-readout').innerHTML = `<strong>${bits.join('')}₂ = ${sum.join(' + ') || '0'} = ${value}₁₀</strong><br>Als ASCII: ${ascii}.<br>Leuchtende LEDs: ${bits.flatMap((bit,i) => bit ? [i+1] : []).join(', ') || 'keine'}.`;
      $('leds').innerHTML = bits.map((bit,i) => `<span class="led ${bit ? 'on' : ''}" aria-label="LED ${i+1}: ${bit ? 'an' : 'aus'}">${i+1}</span>`).join('');
      $('bit-lab').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
        const index = Number(button.dataset.bit); bits[index] = 1 - bits[index]; draw(); $('bit-lab').querySelector(`[data-bit="${index}"]`).focus();
      }));
    }
    draw();
  }
  const boundedInteger = (id,min,max) => {
    const raw = $(id).value;
    return /^\d+$/.test(raw) && Number(raw) >= min && Number(raw) <= max ? Number(raw) : null;
  };
  function setupDivision() {
    if (!$('division-start')) return;
    let original = 37, value = 37, rows = [];
    function draw() {
      $('division-step').disabled = value === 0;
      $('division-trace').innerHTML = `<div class="table-wrap"><table><caption>Divisionen ab ${original}</caption><thead><tr><th>Dividend (Dezimalzahl)</th><th>Quotient (Dezimalzahl)</th><th>Rest (Dezimalzahl)</th></tr></thead><tbody>${rows.map(row => `<tr><td>${row.value}</td><td>${row.next}</td><td>${row.rest}</td></tr>`).join('')}</tbody></table></div><p>${value === 0 ? `Fertig: ${original}₁₀ = <strong>${rows.length ? rows.map(row => row.rest).reverse().join('') : '0'}₂</strong>. Reste von unten nach oben lesen.` : `Nächster Dividend: ${value}. Lesen Sie die Reste erst nach der letzten Division rückwärts.`}</p>`;
    }
    function start() {
      const input = boundedInteger('division-value',0,255);
      if (input === null) { $('division-trace').textContent = 'Bitte eine ganze Dezimalzahl von 0 bis 255 eingeben.'; $('division-step').disabled = true; return; }
      original = value = input; rows = []; draw();
    }
    $('division-start').onclick = start;
    $('division-value').onchange = start;
    $('division-step').onclick = () => { if (value === 0) return; const next = Math.floor(value/2); rows.push({value,next,rest:value%2}); value = next; draw(); };
    start();
  }
  function setupDoubling() {
    if (!$('double-start')) return;
    let value = 5, count = 3, rows = [];
    function draw() {
      $('double-step').disabled = count === 0;
      $('double-trace').innerHTML = `<div class="table-wrap"><table><caption>Zustand nach vollständigen Durchläufen</caption><thead><tr><th>Zeitpunkt</th><th>zahl (Dezimalzahl)</th><th>anzahl (Dezimalzahl)</th><th>Binär (mind. 8 Stellen)</th></tr></thead><tbody>${rows.map((row,i) => `<tr${i === rows.length-1 ? ' class="trace-current"' : ''}><td>${i === 0 ? 'Start' : 'Durchlauf '+i}</td><td>${row.value}</td><td>${row.count}</td><td>${row.value.toString(2).padStart(8,'0')}${row.value > 255 ? ' · mehr als 8 Bit!' : ''}</td></tr>`).join('')}</tbody></table></div><p>${count === 0 ? `anzahl > 0 ist false. Ausgabe: ${value}.` : `anzahl > 0 ist true. Der nächste Durchlauf verdoppelt ${value} und verringert ${count} um 1.`}</p>`;
    }
    function start() {
      const a = boundedInteger('double-value',1,255), b = boundedInteger('double-count',0,8);
      if (a === null || b === null) { $('double-trace').textContent = 'Bitte Startzahl 1–255 und Anzahl 0–8 als ganze Dezimalzahlen eingeben.'; $('double-step').disabled = true; return; }
      value = a; count = b; rows = [{value,count}]; draw();
    }
    $('double-start').onclick = start;
    $('double-value').onchange = start; $('double-count').onchange = start;
    $('double-step').onclick = () => { if (count === 0) return; value *= 2; count--; rows.push({value,count}); draw(); };
    start();
  }
  function setupPAP() {
    if (!$('pap-check')) return;
    const keys = ['condition','double','decrement'];
    const expected = ['anzahl > 0','zahl = zahl * 2;','anzahl = anzahl - 1;'];
    const draw = () => keys.forEach(key => { $(`pap-${key}`).textContent = $(`pap-choice-${key}`).value || '?'; });
    keys.forEach(key => $(`pap-choice-${key}`).onchange = () => { draw(); $('pap-feedback').textContent = ''; });
    $('pap-check').onclick = () => {
      const values = keys.map(key => $(`pap-choice-${key}`).value);
      const ok = values.every((value,i) => value === expected[i]);
      $('pap-feedback').textContent = ok ? '✓ Vollständig: Prüfen → verdoppeln → Zählvariable verringern → zurück zur Prüfung. Bei nein wird ausgegeben.' : 'Noch nicht passend: Der Ja-Zweig soll für eine positive Zählvariable verdoppeln und die Zählvariable näher an 0 bringen.';
      $('pap-feedback').className = ok ? 'good' : 'bad';
      keys.forEach((key,i) => document.querySelector(`[data-node="${key}"]`).classList.toggle('active', values[i] === expected[i]));
    };
    draw();
  }
  function setupTypes() {
    if (!$('type-example')) return;
    const descriptions = {
      boolean:'Primitiv. Die Variable alive enthält direkt true. Zwei logische Werte: true oder false. Methodenaufrufe auf dem primitiven Wert sind nicht möglich.',
      int:'Primitiv. size enthält direkt 3. int besitzt 32 Bit und ist vorzeichenbehaftet. size.step() wäre kein gültiger Methodenaufruf.',
      float:'Primitiv. speed enthält einen 32-Bit-Gleitkommawert. Das Literal 1.5f ist float; ohne f wäre 1.5 ein double-Literal.',
      String:'Referenztyp. name verweist auf ein String-Objekt mit dem Text Ada. String beginnt mit großem S. Das Literal erzeugt bzw. verwendet ein String-Objekt ohne ausgeschriebenes new.',
      Cell:'Referenztyp. new Cell(true) erzeugt eine neue Instanz, initialisiert deren alive-Attribut und liefert eine Referenz. Die Variable cell speichert diese Referenz.',
      array:'Referenztyp. values verweist auf ein Array-Objekt mit drei int-Elementen. Die Elemente werden zunächst mit 0 initialisiert. Der Elementtyp int ist primitiv; der Arraytyp int[] ist es nicht.'
    };
    const draw = () => { $('type-readout').textContent = descriptions[$('type-example').value]; };
    $('type-example').onchange = draw; draw();
  }
  function highlighted(lines, step) {
    return `<pre>${lines.map((line,i) => `<code class="code-line ${i === step-1 ? 'active' : ''}">${escape(line)}</code>`).join('')}</pre>`;
  }
  function setupVariables() {
    if (!$('variable-step')) return;
    let step = 0;
    const lines = ['int size;', 'size = 3;', 'int copy = size;', 'size = size + 1;'];
    const snapshots = [[], [['int size','nicht initialisiert']], [['int size','3']], [['int size','3'],['int copy','3']], [['int size','4'],['int copy','3']]];
    function draw() {
      $('variable-code').innerHTML = highlighted(lines,step);
      $('variable-memory').innerHTML = snapshots[step].length ? snapshots[step].map(([name,value]) => `<div class="memory-row">${name} → ${value}</div>`).join('') : 'Noch keine Anweisung ausgeführt.';
      $('variable-step').disabled = step === lines.length;
    }
    $('variable-step').onclick = () => { if (step < lines.length) step++; draw(); };
    $('variable-reset').onclick = () => { step = 0; draw(); }; draw();
  }
  function setupInformation() {
    if (!$('info-bits')) return;
    function draw() {
      const bits = Number($('info-bits').value), states = boundedInteger('info-states',1,65536);
      $('info-bits-label').textContent = `${bits} Bit`;
      $('info-capacity').textContent = `${2 ** bits} Muster · vorzeichenlose Werte von 0 bis ${2 ** bits - 1}`;
      if (states === null) { $('info-result').textContent = 'Bitte 1 bis 65536 Zustände als ganze Zahl eingeben.'; return; }
      const minimum = Math.ceil(Math.log2(states));
      $('info-result').textContent = `${states} gleichwahrscheinliche Möglichkeiten tragen ${Math.log2(states).toLocaleString('de-DE',{maximumFractionDigits:2})} Bit Information. Eine feste Codierung braucht mindestens ${minimum} Bit. Bei der gewählten Breite ${bits} ${states <= 2 ** bits ? `reichen die Muster; ${2 ** bits - states} bleiben ungenutzt.` : 'reichen die Muster noch nicht.'}${states === 1 ? ' Bei nur einer bekannten Möglichkeit ist kein unterscheidendes Bit erforderlich.' : ''}`;
    }
    $('info-bits').oninput = draw; $('info-states').oninput = draw; draw();
  }
  function setupClass() {
    if (!$('class-part')) return;
    const descriptions = {
      class:'Oberes Feld: Klassenname Cell. Die Klasse ist der Bauplan; hier wird kein einzelner Objektzustand angegeben.',
      attribute:'Mittleres Feld: private boolean alive. Das Attribut speichert pro Objekt dessen Zustand. Java-Schreibweise: Typ vor Name.',
      constructor:'Unteres Feld: Cell(boolean alive). Konstruktor mit einem Parameter. Der Name stimmt mit der Klasse überein; es gibt keinen Rückgabetyp.',
      getter:'Unteres Feld: boolean getAlive(). Methode ohne Parameter, die einen boolean-Wert zurückliefert.',
      setter:'Unteres Feld: void setAlive(boolean alive). Methode mit einem boolean-Parameter, aber ohne Rückgabewert.',
      change:'Unteres Feld: void change(). Methode ohne Parameter und Rückgabewert. Sie kehrt den Zustand dieses Objekts um.'
    };
    const draw = () => { $('class-readout').textContent = descriptions[$('class-part').value]; };
    $('class-part').onchange = draw; draw();
  }
  function setupObjects() {
    if (!$('object-mode')) return;
    let step = 0;
    const modes = {
      alias:{ lines:['Cell a = new Cell(true);','Cell b = a;','b.change();'], snapshots:[{vars:[],objects:[]},{vars:['Cell a → Objekt #1'],objects:['Objekt #1: alive = true']},{vars:['Cell a → Objekt #1','Cell b → Objekt #1'],objects:['Objekt #1: alive = true']},{vars:['Cell a → Objekt #1','Cell b → Objekt #1'],objects:['Objekt #1: alive = false']}] },
      independent:{ lines:['Cell a = new Cell(true);','Cell b = new Cell(true);','a.change();'], snapshots:[{vars:[],objects:[]},{vars:['Cell a → Objekt #1'],objects:['Objekt #1: alive = true']},{vars:['Cell a → Objekt #1','Cell b → Objekt #2'],objects:['Objekt #1: alive = true','Objekt #2: alive = true']},{vars:['Cell a → Objekt #1','Cell b → Objekt #2'],objects:['Objekt #1: alive = false','Objekt #2: alive = true']}] },
      primitive:{ lines:['int x = 5;','int y = x;','y = 7;'], snapshots:[{vars:[],objects:[]},{vars:['int x = 5'],objects:[]},{vars:['int x = 5','int y = 5'],objects:[]},{vars:['int x = 5','int y = 7'],objects:[]}] }
    };
    function draw() {
      const mode = modes[$('object-mode').value], snapshot = mode.snapshots[step];
      $('object-code').innerHTML = highlighted(mode.lines,step);
      $('object-memory').innerHTML = `<div class="memory-box"><h4>Variablen</h4>${snapshot.vars.length ? snapshot.vars.map(value => `<div class="memory-row">${value}</div>`).join('') : 'Noch keine Variablen.'}</div><div class="memory-box"><h4>Objekte</h4>${snapshot.objects.length ? snapshot.objects.map(value => `<div class="memory-row">${value}</div>`).join('') : 'Keine Objekte erzeugt.'}</div>`;
      $('object-step').disabled = step === mode.lines.length;
    }
    $('object-step').onclick = () => { if (step < modes[$('object-mode').value].lines.length) step++; draw(); };
    $('object-reset').onclick = () => { step = 0; draw(); };
    $('object-mode').onchange = () => { step = 0; draw(); }; draw();
  }
  $('answer-form').addEventListener('submit',submit);
  $('hint-button').onclick = () => {
    $('hint').textContent = stations[state.station].questions[state.question].hint; $('hint').hidden = false;
  };
  $('solution-button').onclick = () => {
    if (!state.solved.includes(taskID()) && !state.assisted.includes(taskID())) state.assisted.push(taskID());
    const question = stations[state.station].questions[state.question];
    $('hint').innerHTML = `<h4>Lösungsweg</h4><p>${escape(question.solution)}</p><p class="small">Wenn die Aufgabe noch nicht selbst gelöst war, zählen weitere richtige Antworten hier als Nacharbeiten mit Lösung.</p>`;
    $('hint').hidden = false; save();
  };
  $('prev').onclick = () => { if (state.question > 0) { state.question--; renderQuestion(); } };
  $('next').onclick = () => { if (state.question < stations[state.station].questions.length - 1) { state.question++; renderQuestion(); } };
  $('next-station').onclick = () => { if (state.station < stations.length - 1) selectStation(state.station + 1); else $('finish').scrollIntoView(); };
  $('notes').oninput = () => { state.notes[state.station] = $('notes').value.slice(0,10000); save(); };
  $('reset').onclick = () => { $('reset-confirm').hidden = false; };
  $('reset-no').onclick = () => { $('reset-confirm').hidden = true; };
  $('reset-yes').onclick = () => { state = initialState(); save(); $('reset-confirm').hidden = true; render(); };
  render();
  return { gradeField, javaTokens, getState:() => JSON.parse(JSON.stringify(state)), selectStation };
})();

}

const consentDialog = document.getElementById('storage-consent');
const consentCheckbox = document.getElementById('consent-checkbox');
const consentStart = document.getElementById('consent-start');
consentCheckbox.addEventListener('change', () => { consentStart.disabled = !consentCheckbox.checked; });
consentDialog.addEventListener('cancel', event => event.preventDefault());
document.getElementById('consent-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!consentCheckbox.checked) return;
  persistentStorageAllowed = document.getElementById('save-for-later').checked;
  document.getElementById('withdraw-consent').textContent = persistentStorageAllowed
    ? 'Einwilligung widerrufen und Lernstand löschen' : 'Einwilligung widerrufen und Sitzung beenden';
  document.getElementById('training-content').hidden = false;
  startTraining();
  consentDialog.close();
  document.getElementById('station-title').focus({ preventScroll:true });
});
document.getElementById('withdraw-consent').addEventListener('click', () => {
  if (!Training) return;
  try { if (persistentStorageAllowed) localStorage.removeItem('ifef-klausurtraining-v1'); }
  catch { alert('Der Browser konnte den gespeicherten Lernstand nicht löschen. Sie können die Website-Daten in den Browser-Einstellungen entfernen.'); }
  location.reload();
});
consentDialog.showModal();
