'use strict';
const get = id => document.getElementById(id);
function status(id, text, state = '') {
  get(id).textContent = text;
  get(id).dataset.state = state;
}

// Source-level teaching trace; not a Java interpreter or CPU emulator.
let traceStep = 0;
const traceMessages = [
  'Noch keine Anweisung ausgeführt. Die Striche bedeuten: noch kein Wert zugewiesen bzw. noch keine Ausgabe.',
  'Anweisung 1: Der Wert 5 wird der Variablen zahl1 zugewiesen. Noch keine Ausgabe.',
  'Anweisung 2: Der Wert 3 wird der Variablen zahl2 zugewiesen. Beide Eingangswerte stehen bereit.',
  'Anweisung 3: 5 + 3 wird berechnet und als 8 in ergebnis gespeichert. Die Konsole ist noch leer.',
  'Anweisung 4: Die Konsole gibt 8 aus. Das Programm ist beendet.'
];
function renderTrace() {
  ['value-1', 'value-2', 'value-result', 'console-value'].forEach((id, i) => {
    get(id).textContent = traceStep > i ? [5, 3, 8, 8][i] : '—';
    get(`line-${i + 1}`).setAttribute('aria-current', traceStep === i + 1 ? 'step' : 'false');
  });
  get('trace-next').disabled = traceStep === 4;
  status('trace-status', traceMessages[traceStep]);
}
get('trace-next').addEventListener('click', () => { traceStep = Math.min(4, traceStep + 1); renderTrace(); });
get('trace-reset').addEventListener('click', () => { traceStep = 0; renderTrace(); });
renderTrace();

const syntaxExamples = {
  valid: ['int ergebnis = zahl1 + zahl2;', 'Diese Zeile ist syntaktisch korrekt: Beide Operanden und das abschließende Semikolon sind vorhanden. Im vollständigen Programm sind auch die Variablen zuvor deklariert.'],
  semicolon: ['int ergebnis = zahl1 + zahl2', 'Das abschließende Semikolon fehlt. IntelliJ bzw. der Compiler meldet sinngemäß „Semikolon erwartet“. Der geänderte Quelltext lässt sich nicht erfolgreich übersetzen.'],
  operand: ['int ergebnis = zahl1 + ;', 'Hinter dem Pluszeichen fehlt der zweite Operand. Der Ausdruck ist unvollständig. Auch mit Semikolon kann diese Zeile nicht erfolgreich übersetzt werden.']
};
get('syntax-example').addEventListener('change', () => {
  get('syntax-code').textContent = syntaxExamples[get('syntax-example').value][0];
  status('syntax-feedback', '');
});
get('syntax-check').addEventListener('click', () => status('syntax-feedback', syntaxExamples[get('syntax-example').value][1]));

const roles = [
  { question: 'Daten und Programmanweisungen bereithalten', answer: 'Speicher' },
  { question: 'Die Werte 5 und 3 addieren', answer: 'Rechenwerk' },
  { question: 'Anweisungen holen und die nächsten Schritte veranlassen', answer: 'Steuerwerk' },
  { question: 'Informationen zwischen den Bausteinen transportieren', answer: 'Bussystem' }
];
roles.forEach((role, i) => {
  const row = document.createElement('div'); row.className = 'role-row';
  const label = document.createElement('label'); label.htmlFor = `role-${i}`; label.textContent = role.question;
  const select = document.createElement('select'); select.id = `role-${i}`;
  for (const name of ['', 'Steuerwerk', 'Bussystem', 'Speicher', 'Rechenwerk']) {
    const option = document.createElement('option'); option.value = name; option.textContent = name || 'Bitte zuordnen'; select.append(option);
  }
  select.addEventListener('change', () => { select.setAttribute('aria-invalid', 'false'); status('roles-feedback', ''); });
  row.append(label, select); get('role-questions').append(row);
});
get('roles-form').addEventListener('submit', event => {
  event.preventDefault();
  const wrong = roles.filter((role, i) => {
    const incorrect = get(`role-${i}`).value !== role.answer;
    get(`role-${i}`).setAttribute('aria-invalid', String(incorrect));
    return incorrect;
  });
  status('roles-feedback', wrong.length ? `${4 - wrong.length} von 4 richtig. Prüfen Sie noch: ${wrong.map(role => role.question).join('; ')}.` : 'Alle vier Zuordnungen stimmen. Ergänzen Sie nun die Verbindungen in Ihrer Skizze.', wrong.length ? 'error' : 'success');
});
const phases = [
  'Holen: Das Steuerwerk veranlasst, dass die nächste Maschinenanweisung aus dem Speicher geholt wird. Ihre Adresse steht im Befehlszähler.',
  'Entschlüsseln: Das Steuerwerk wertet aus, welche Operation die Anweisung verlangt und welche Werte oder Speicherstellen dazu benötigt werden.',
  'Ausführen: Die erforderlichen Schritte werden veranlasst. Bei einer Addition berechnet das Rechenwerk das Ergebnis; es wird anschließend abgelegt. Danach beginnt der Zyklus für die nächste Anweisung.'
];
document.querySelectorAll('.cycle-button').forEach(button => {
  button.addEventListener('click', () => {
    const phase = Number(button.dataset.phase);
    document.querySelectorAll('.cycle-button').forEach(other => {
      const active = other === button;
      other.setAttribute('aria-pressed', String(active)); other.classList.toggle('secondary', !active);
    });
    get('cycle-text').textContent = phases[phase];
  });
});

// Logical teaching model: 64 addressable LEDs, each with four unsigned bytes.
// No physical bus protocol, board-specific memory map or hardware I/O is assumed.
const channels = ['red', 'green', 'blue', 'saturation'];
const channelNames = ['Rot', 'Grün', 'Blau', 'Sättigung'];
const ledMemory = Array.from({ length: 64 }, () => [0, 0, 0, 0]);
const ledDisplay = Array.from({ length: 64 }, () => [0, 0, 0, 0]);
let selectedAddress = 0;
const bits = value => value.toString(2).padStart(8, '0');
function color(values) {
  const rgb = values.slice(0, 3);
  const saturation = values[3] / 255;
  // Blend toward the neutral gray at the RGB color's HSL lightness.
  // 0 removes color; 255 preserves the original RGB values.
  const gray = (Math.max(...rgb) + Math.min(...rgb)) / 2;
  return rgb.map(value => Math.round(gray + (value - gray) * saturation));
}
function describe(values) { return channelNames.map((name, i) => `${name} ${values[i]}`).join(', '); }
function draftValues() { return channels.map(name => Number(get(name).value)); }
function validAddress() {
  const raw = get('led-address').value;
  const valid = /^\d{1,2}$/.test(raw) && Number(raw) <= 63;
  get('led-address').setAttribute('aria-invalid', String(!valid));
  if (!valid) {
    status('led-status', 'Bitte geben Sie eine ganze LED-Adresse von 0 bis 63 ein.', 'error');
    return null;
  }
  return Number(raw);
}
function currentAddressConfirmed() {
  const address = validAddress();
  if (address === null) return false;
  if (address !== selectedAddress) {
    status('led-status', 'Die eingegebene Adresse ist noch nicht ausgewählt. Klicken Sie zuerst auf „Auswählen“; dabei werden die gespeicherten Werte dieser LED geladen.', 'error');
    return false;
  }
  return true;
}
function updatePreview() {
  const values = draftValues();
  channels.forEach((name, i) => { get(`${name}-value`).textContent = values[i]; });
  get('led-preview').style.backgroundColor = `rgb(${color(values).join(', ')})`;
}
function updateSaved() {
  get('saved-values').textContent = `Im Speicher für LED ${selectedAddress}: ${describe(ledMemory[selectedAddress])}.`;
  get('address-info').textContent = `Zeile ${Math.floor(selectedAddress / 8)}, Spalte ${selectedAddress % 8} · LED-Adresse ${selectedAddress} · Byte-Positionen ${4 * selectedAddress} bis ${4 * selectedAddress + 3} im Bildpuffer.`;
}
function paintMatrix() {
  ledDisplay.forEach((values, address) => {
    const button = get(`led-${address}`);
    const rgb = color(values);
    button.style.backgroundColor = `rgb(${rgb.join(', ')})`;
    button.style.color = .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2] > 140 ? '#000' : '#fff';
    button.setAttribute('aria-pressed', String(address === selectedAddress));
    button.setAttribute('aria-label', `LED ${address}, Zeile ${Math.floor(address / 8)}, Spalte ${address % 8}. Ausgabe: ${describe(values)}.`);
    button.tabIndex = address === selectedAddress ? 0 : -1;
  });
}
function selectAddress(address, focus = false) {
  selectedAddress = address; get('led-address').value = address;
  get('led-address').setAttribute('aria-invalid', 'false');
  channels.forEach((name, i) => { get(name).value = ledMemory[address][i]; });
  updatePreview(); updateSaved(); paintMatrix();
  status('led-status', `LED ${address} ausgewählt. Ihre gespeicherten Werte wurden in die Regler geladen. Ungespeicherte Änderungen der vorherigen Auswahl wurden verworfen.`);
  if (focus) get(`led-${address}`).focus();
}
for (let address = 0; address < 64; address++) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'led'; button.id = `led-${address}`; button.textContent = address;
  button.addEventListener('click', () => selectAddress(address));
  button.addEventListener('keydown', event => {
    let next = address;
    if (event.key === 'ArrowRight' && address % 8 < 7) next++;
    else if (event.key === 'ArrowLeft' && address % 8 > 0) next--;
    else if (event.key === 'ArrowDown' && address < 56) next += 8;
    else if (event.key === 'ArrowUp' && address >= 8) next -= 8;
    else if (event.key === 'Home') next = Math.floor(address / 8) * 8;
    else if (event.key === 'End') next = Math.floor(address / 8) * 8 + 7;
    else if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault(); selectAddress(next, true);
  });
  get('led-matrix').append(button);
}
get('select-address').addEventListener('click', () => {
  const address = validAddress(); if (address !== null) selectAddress(address);
});
channels.forEach(name => get(name).addEventListener('input', () => {
  updatePreview(); status('led-status', 'Regler geändert. Die Vorschau zeigt den Entwurf; Speicher und Matrix sind unverändert.');
}));
get('led-form').addEventListener('submit', event => {
  event.preventDefault(); if (!currentAddressConfirmed()) return;
  const values = draftValues();
  if (!values.every(value => Number.isInteger(value) && value >= 0 && value <= 255)) {
    status('led-status', 'Jeder Kanal benötigt einen ganzzahligen Wert von 0 bis 255.', 'error'); return;
  }
  ledMemory[selectedAddress] = [...values]; updateSaved();
  status('led-status', `Vier Bytes für LED ${selectedAddress} gespeichert. Die Matrix zeigt weiterhin den zuletzt übertragenen Zustand. Senden Sie jetzt die gespeicherten Werte.`, 'success');
});
get('send-led').addEventListener('click', () => {
  if (!currentAddressConfirmed()) return;
  const saved = ledMemory[selectedAddress]; ledDisplay[selectedAddress] = [...saved]; paintMatrix();
  get('bus-message').textContent = `LED-Adresse: ${selectedAddress} (getrennte Zielinformation). Nutzdaten in der Reihenfolge R, G, B, S: ${saved.join(' | ')}. Binär, je 8 Bit: ${saved.map(bits).join(' | ')}.`;
  const unsaved = draftValues().some((value, i) => value !== saved[i]);
  status('led-status', `Gespeicherte Werte an LED ${selectedAddress} übertragen. Nur diese LED wurde aktualisiert.${unsaved ? ' Achtung: Die Regler enthalten noch ungespeicherte Änderungen; diese wurden nicht gesendet.' : ''}`, 'success');
});
get('reset-leds').addEventListener('click', () => {
  for (let i = 0; i < 64; i++) { ledMemory[i] = [0, 0, 0, 0]; ledDisplay[i] = [0, 0, 0, 0]; }
  selectAddress(0); get('bus-message').textContent = 'Noch keine Übertragung.';
  status('led-status', 'Simulation zurückgesetzt: Speicher und Ausgabe aller LEDs sind 0.');
});
updatePreview(); updateSaved(); paintMatrix();
status('led-status', 'LED 0 ist ausgewählt. Als Entwurf ist Rot mit voller Sättigung eingestellt. Im Speicher und auf der Matrix stehen noch ausschließlich Nullen.');
