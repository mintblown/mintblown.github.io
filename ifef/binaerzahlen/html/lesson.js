'use strict';
const $ = id => document.getElementById(id);
const weights = [128, 64, 32, 16, 8, 4, 2, 1];
const number = (digits, base) => `[${digits}]<sub>${base}</sub>`;
let bits = Array(8).fill(0);
function drawSwitches() {
  $('switches').innerHTML = '';
  weights.forEach((weight, i) => {
    const cell = document.createElement('div'); cell.className = 'bit';
    cell.innerHTML = `<small>${weight}</small><button type="button" aria-label="Bit mit Stellenwert ${weight}" aria-pressed="${Boolean(bits[i])}">${bits[i]}</button>`;
    cell.querySelector('button').onclick = event => {
      bits[i] = 1 - bits[i];
      event.currentTarget.textContent = bits[i];
      event.currentTarget.setAttribute('aria-pressed', Boolean(bits[i]));
      updateSwitchResult();
    };
    $('switches').append(cell);
  });
  updateSwitchResult();
}
function updateSwitchResult() {
  const sum = bits.reduce((total, bit, i) => total + bit * weights[i], 0);
  $('switch-result').innerHTML = `${number(bits.join(''), 2)} = ${number(sum, 10)} · Aktive Stellenwerte: ${weights.filter((_, i) => bits[i]).join(' + ') || '0'}`;
}
const descriptions = {
  branch: '<h3>Passt der Stellenwert in den Rest?</h3><ol><li>Beginnen Sie bei 8 Bit mit dem Stellenwert 128.</li><li>Falls der Rest mindestens so groß ist: Schreiben Sie 1 und ziehen Sie den Stellenwert ab. Sonst schreiben Sie 0.</li><li>Halbieren Sie den Stellenwert und wiederholen Sie bis einschließlich 1.</li></ol><p>Entscheiden Sie an jeder Verzweigung selbst: Ja oder Nein?</p>',
  division: '<h3>Wiederholt ganzzahlig durch 2 teilen</h3><ol><li>Teilen Sie die Zahl durch 2 und notieren Sie den Rest (0 oder 1).</li><li>Rechnen Sie mit dem ganzzahligen Quotienten weiter, bis dieser 0 ist.</li><li>Lesen Sie die Reste von unten nach oben. Ergänzen Sie für 8 Bit links Nullen.</li></ol><p>Sonderfall: Die Zahl 0 wird als 0 dargestellt, mit 8 Bit als 00000000.</p>',
  largest: '<h3>Immer die größte passende Zweierpotenz</h3><ol><li>Suchen Sie die größte Zweierpotenz, die höchstens so groß wie der Rest ist.</li><li>Setzen Sie an dieser Stelle eine 1 und ziehen Sie die Zweierpotenz ab.</li><li>Wiederholen Sie bis zum Rest 0. Alle nicht verwendeten Stellen erhalten eine 0.</li></ol><p>Bei der Zahl 0 bleiben alle Bits 0.</p>'
};
let method, rest, position, output, remainders, finished;
function resetConversion() {
  method = $('method').value; rest = 42; position = 0; output = Array(8).fill('0'); remainders = []; finished = false;
  $('method-description').innerHTML = descriptions[method];
  $('conversion-log').innerHTML = ''; $('conversion-feedback').textContent = '';
  renderConversion();
}
function renderConversion() {
  $('branch-controls').hidden = method !== 'branch' || finished;
  // Explicit display also overrides the flex layout of controls.
  $('branch-controls').style.display = method === 'branch' && !finished ? 'flex' : 'none';
  $('next').hidden = method === 'branch'; $('next').disabled = finished;
  if (finished) {
    $('conversion').innerHTML = `Fertig: ${number(42, 10)} = ${number('101010', 2)} = ${number('00101010', 2)}. ${method === 'division' ? 'Reste von unten nach oben: 101010; links auf 8 Bit ergänzt.' : 'Kontrolle: 32 + 8 + 2 = 42.'}`;
  } else if (method === 'branch') {
    $('conversion').textContent = `Rest: ${rest}. Ist ${rest} ≥ ${weights[position]}? Bisherige Bits: ${output.slice(0, position).join('') || '—'}${'·'.repeat(8-position)}`;
  } else if (method === 'division') {
    $('conversion').textContent = `Nächste Division: ${rest} ÷ 2. Bisherige Reste in Entstehungsreihenfolge: ${remainders.join(', ') || '—'}.`;
  } else {
    $('conversion').textContent = `Rest: ${rest}. Suchen Sie die größte passende Zweierpotenz. Aktuelles Bitmuster: ${output.join('')}.`;
  }
}
function step(choice) {
  if (finished) return;
  let line;
  if (method === 'branch') {
    const weight = weights[position], fits = rest >= weight;
    if (choice !== fits) {
      $('conversion-feedback').textContent = `Prüfen Sie noch einmal: ${rest} ist ${fits ? 'mindestens' : 'kleiner als'} ${weight}. Der Rest bleibt unverändert.`;
      return;
    }
    const before = rest; output[position] = fits ? '1' : '0';
    if (fits) rest -= weight;
    line = `${before} ≥ ${weight}? ${fits ? `Ja → 1; Rest ${before} − ${weight} = ${rest}` : `Nein → 0; Rest bleibt ${rest}`}.`;
    position++; finished = position === 8;
  } else if (method === 'division') {
    const quotient = Math.floor(rest / 2), remainder = rest % 2;
    line = `${rest} ÷ 2 = ${quotient} Rest ${remainder}.`;
    remainders.push(remainder); rest = quotient; finished = rest === 0;
  } else {
    const index = weights.findIndex(weight => weight <= rest), weight = weights[index];
    line = `Größte passende Zweierpotenz: ${weight}. Rest: ${rest} − ${weight} = ${rest-weight}. Stellenwert ${weight} erhält eine 1.`;
    rest -= weight; output[index] = '1'; finished = rest === 0;
  }
  const li = document.createElement('li'); li.textContent = line; $('conversion-log').append(li);
  $('conversion-feedback').textContent = finished ? 'Geschafft! Alle Schritte sind abgeschlossen.' : 'Schritt abgeschlossen.';
  renderConversion();
}
$('method').onchange = resetConversion; $('reset').onclick = resetConversion;
$('yes').onclick = () => step(true); $('no').onclick = () => step(false); $('next').onclick = () => step();
let revealed;
function resetDecode() {
  revealed = Array(6).fill(false); $('decode-bits').innerHTML = '';
  $('decode-bits').style.gridTemplateColumns = 'repeat(6, minmax(0, 1fr))';
  [...'101010'].forEach((bit, i) => {
    const weight = 2 ** (5-i), cell = document.createElement('div'); cell.className = 'bit';
    cell.innerHTML = `<small>2<sup>${5-i}</sup> = ${weight}</small><button aria-label="Beitrag von Bit ${bit} mit Stellenwert ${weight} aufdecken" aria-pressed="false">${bit}</button>`;
    cell.querySelector('button').onclick = event => {
      revealed[i] = true; event.currentTarget.setAttribute('aria-pressed', 'true'); updateDecode();
    };
    $('decode-bits').append(cell);
  }); updateDecode();
}
function updateDecode() {
  const terms = [...'101010'].map((bit, i) => revealed[i] ? `${bit} × ${2 ** (5-i)}` : '?');
  const sum = [...'101010'].reduce((total, bit, i) => total + (revealed[i] ? Number(bit) * 2 ** (5-i) : 0), 0);
  $('decode-result').innerHTML = `${terms.join(' + ')} · ${revealed.every(Boolean) ? `Ergebnis: ${number('101010', 2)} = ${number(sum, 10)}` : `Bisher aufgedeckte Summe: ${sum} (${revealed.filter(Boolean).length}/6 Stellen)`}`;
}
$('decode-reset').onclick = resetDecode;
drawSwitches(); resetConversion(); resetDecode();
