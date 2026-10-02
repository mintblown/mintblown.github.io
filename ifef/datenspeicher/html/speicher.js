'use strict';
const initial = [null, null, 42, null, null, null, 75, 79, 192, null, 71, 101, 110, 97, 117, 33, 0];
let memory = [...initial];
const $ = id => document.getElementById(id);
const bits = n => n.toString(2).padStart(8, '0');
const controls = ['NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL', 'BS', 'TAB', 'LF', 'VT', 'FF', 'CR', 'SO', 'SI', 'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB', 'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US'];
const format = n => Object.is(n, -0) ? '−0' : String(n).replace('.', ',');
function render(start = -1, end = -1) {
  $('memory').replaceChildren();
  memory.forEach((byte, address) => {
    const row = document.createElement('tr');
    row.classList.toggle('selected', address >= start && address <= end);
    const heading = document.createElement('th'); heading.scope = 'row'; heading.textContent = address; row.append(heading);
    for (const bit of byte === null ? '————————' : bits(byte)) {
      const cell = document.createElement('td'); cell.textContent = bit;
      if (byte === null) { cell.className = 'empty'; cell.setAttribute('aria-label', 'nicht belegt'); }
      row.append(cell);
    }
    $('memory').append(row);
  });
}
function report(id, text, error = false) { $(id).textContent = text; $(id).dataset.error = String(error); }
$('memory-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const start = Number($('start').value), end = Number($('end').value);
    if ($('start').value === '' || $('end').value === '' || !Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > 16 || start > end) throw Error('Bitte einen Bereich von 0 bis 16 mit Startadresse ≤ Endadresse wählen.');
    const write = event.submitter?.value === 'write';
    if (write) {
      const bytes = $('bytes').value.trim().split(/\s+/);
      if (bytes.length !== end - start + 1 || bytes.some(byte => !/^[01]{8}$/.test(byte))) throw Error(`Bitte genau ${end - start + 1} Byte(s) mit jeweils acht Bits eingeben. Es wurde nichts geschrieben.`);
      bytes.forEach((byte, i) => { memory[start + i] = parseInt(byte, 2); });
    }
    render(start, end);
    const selected = memory.slice(start, end + 1);
    $('readout').textContent = selected.map((byte, i) => `${start + i}: ${byte === null ? 'nicht belegt' : bits(byte)}`).join('\n');
    if (!write && selected.every(byte => byte !== null)) $('bytes').value = selected.map(bits).join(' ');
    report('memory-status', `Adressen ${start}–${end} ${write ? 'geschrieben' : 'gelesen'}.`);
  } catch (error) { report('memory-status', error.message, true); }
});
$('reset').addEventListener('click', () => {
  memory = [...initial]; render(); $('bytes').value = ''; $('readout').textContent = 'Noch kein Bereich gelesen.';
  report('memory-status', 'Die Vorgaben des Arbeitsblatts sind wiederhergestellt.');
});
function decode(byte, kind) {
  if (kind === 'int') return String(byte >= 128 ? byte - 256 : byte);
  if (kind === 'float') return format(floatDecode(byte));
  if (byte > 127) throw Error('Dieses Byte gehört nicht zu Standard-ASCII (höchstes Bit muss 0 sein).');
  return byte < 32 ? controls[byte] : byte === 32 ? 'SPACE' : byte === 127 ? 'DEL' : String.fromCharCode(byte);
}
function encode(raw, kind) {
  if (kind === 'ascii') {
    const name = raw.trim().toUpperCase();
    const index = controls.indexOf(name === 'HT' ? 'TAB' : name);
    if (index >= 0) return index;
    if (name === 'SPACE') return 32;
    if (name === 'DEL') return 127;
    if (raw.length !== 1 || raw.charCodeAt(0) > 127) throw Error('Bitte ein ASCII-Zeichen oder einen Steuerzeichennamen eingeben (zum Beispiel NUL). Umlaute gehören nicht zu Standard-ASCII.');
    return raw.charCodeAt(0);
  }
  const normalized = raw.trim().replace('−', '-').replace(',', '.');
  if (kind === 'float' && /^nan$/i.test(normalized)) return 127;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) throw Error('Bitte eine gültige Dezimalzahl eingeben.');
  const number = Number(normalized);
  if (kind === 'float') return floatEncode(number);
  if (!Number.isInteger(number) || number < -128 || number > 127) throw Error('int: Bitte eine ganze Zahl von −128 bis 127 eingeben.');
  return (number + 256) % 256;
}
$('decode-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const binary = $('binary').value;
    if (!/^[01]{8}$/.test(binary)) throw Error('Bitte genau acht Bits eingeben.');
    const value = decode(parseInt(binary, 2), $('kind').value);
    $('value').value = value;
    report('conversion-result', `${binary} → ${value}`);
  } catch (error) { report('conversion-result', error.message, true); }
});
$('encode-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const raw = $('value').value, kind = $('kind').value, byte = encode(raw, kind);
    $('binary').value = bits(byte);
    let message = `${raw} → ${bits(byte)}`;
    if (kind === 'float') {
      const value = floatDecode(byte), requested = Number(raw.trim().replace('−', '-').replace(',', '.'));
      message += ` · Gespeicherter Wert: ${format(value)}.`;
      if (Number.isFinite(value) && value !== requested) message += ` Gerundet; Abweichung: ${format(Number((value - requested).toPrecision(10)))}.`;
    }
    report('conversion-result', message);
  } catch (error) { report('conversion-result', error.message, true); }
});
$('kind').addEventListener('change', () => {
  $('value-label').textContent = { ascii: 'ASCII-Zeichen oder Steuerzeichenname', int: 'Ganzzahl · −128 bis 127', float: 'Dezimalzahl · E4M3 (z. B. 5,5)' }[$('kind').value];
  $('value').value = '';
  report('conversion-result', 'Interpretation geändert. Geben Sie einen Wert ein oder wandeln Sie die acht Bits um.');
});
render();
