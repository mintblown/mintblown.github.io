'use strict';
const get = id => document.getElementById(id);
const attributes = ['länge', 'breite', 'winkel', 'phase', 'position x', 'position y', 'bild'];
const methods = ['drehe', 'entwickle', 'platziere'];
class Lebensform {
  constructor() { this.values = [3, 3, 0, 0, 0, 0, '010001111']; }
  set(values) {
    const [height, width, angle, phase, x, y, image] = values;
    if (![height, width, angle, phase, x, y].every(Number.isInteger) || height < 1 || height > 16 || width < 1 || width > 16 || angle % 90 !== 0 || Math.abs(angle) > 36000 || phase < 0 || phase > 120 || x < 0 || x > 255 || y < 0 || y > 255) throw Error('Prüfe die Werte: A/B 1–16, C in 90°-Schritten (−36000 bis 36000), D 0–120, E/F 0–255.');
    if (typeof image !== 'string' || !/^[01]+$/.test(image) || image.length !== height * width) throw Error(`Das Bild benötigt genau ${width * height} Bits (${width} × ${height}), nur 0 und 1 ohne Leerzeichen.`);
    this.values = [height, width, ((angle % 360) + 360) % 360, phase, x, y, image];
    this.cells = [];
    [...image].forEach((bit, i) => { if (bit === '1') this.cells.push([i % width, Math.floor(i / width)]); });
  }
  drehe(n) {
    if (!Number.isInteger(n) || n % 90 || Math.abs(n) > 36000) throw Error('n muss ein Vielfaches von 90 zwischen −36000 und 36000 sein.');
    const values = [...this.values];
    values[2] = (values[2] + n) % 360;
    this.set(values);
  }
  view() {
    let [height, width] = this.values;
    let cells = this.cells.map(([x, y]) => [x, y]);
    for (let turn = 0; turn < this.values[2] / 90; turn++) {
      cells = cells.map(([x, y]) => [height - 1 - y, x]);
      [height, width] = [width, height];
    }
    return { height, width, cells };
  }
  entwickle(n) {
    if (!Number.isInteger(n) || n < 0 || n > 30) throw Error('n muss eine ganze Zahl von 0 bis 30 sein.');
    const values = [...this.values];
    if (values[3] + n > 120) throw Error('Die Phase darf höchstens 120 sein.');
    const [height, width] = values;
    // A dead border isolates this object's fixed image from the toroidal engine.
    const size = Math.max(height, width) + 4;
    const model = new LifeEngine(size);
    let image = values[6];
    for (let step = 0; step < n; step++) {
      model.current.fill(0);
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) model.current[(y + 2) * size + x + 2] = Number(image[y * width + x]);
      model.step();
      let result = '';
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) result += model.current[(y + 2) * size + x + 2];
      image = result;
    }
    values[3] += n; values[6] = image; this.set(values);
  }
}
const object = new Lebensform();
function name(kind, i) { return get(`${kind}-name-${i}`).value.trim() || (kind === 'a' ? String.fromCharCode(65 + i) : `M${i + 1}`); }
for (const [kind, list, target] of [['a', attributes, 'attribute-names'], ['m', methods, 'method-names']]) {
  list.forEach((_, i) => {
    const row = document.createElement('div'); row.className = 'name-row';
    const label = document.createElement('label'); label.htmlFor = `${kind}-name-${i}`; label.textContent = kind === 'a' ? String.fromCharCode(65 + i) : `M${i + 1}`;
    const input = document.createElement('input'); input.id = label.htmlFor; input.placeholder = kind === 'a' ? 'Dein Attributname' : 'Dein Methodenname'; input.maxLength = 40;
    input.addEventListener('input', updateLabels); row.append(label, input);
    if (kind === 'm') { const suffix = document.createElement('span'); suffix.textContent = i < 2 ? '(n)' : '()'; row.append(suffix); }
    get(target).append(row);
  });
}
attributes.forEach((_, i) => {
  const label = document.createElement('label'), title = document.createElement('span'); title.id = `field-label-${i}`;
  const input = document.createElement(i === 6 ? 'textarea' : 'input'); input.id = `value-${i}`;
  if (i === 6) {
    input.rows = 4; input.spellcheck = false; input.setAttribute('aria-describedby', 'binary-help');
    label.className = 'binary-field';
  } else { input.type = 'number'; input.step = i === 2 ? '90' : '1'; input.min = i < 2 ? '1' : i === 2 ? '-36000' : '0'; input.max = i < 2 ? '16' : i === 2 ? '36000' : i === 3 ? '120' : '255'; }
  label.append(title, input); get('attribute-fields').append(label);
});
function updateLabels() {
  attributes.forEach((_, i) => { get(`field-label-${i}`).textContent = name('a', i); });
  ['rotate', 'develop', 'place'].forEach((key, i) => { get(`${key}-button`).textContent = `${name('m', i)}(${i < 2 ? 'n' : ''})`; });
  caption();
}
function caption() { get('object-caption').textContent = attributes.map((_, i) => `${name('a', i)} = ${object.values[i]}`).join('\n'); }
function renderObject() {
  const { height, width, cells } = object.view();
  get('object-picture').style.gridTemplateColumns = `repeat(${width}, 1fr)`;
  get('object-picture').replaceChildren();
  const alive = new Set(cells.map(([x, y]) => y * width + x));
  for (let i = 0; i < height * width; i++) { const cell = document.createElement('span'); if (alive.has(i)) cell.className = 'alive'; cell.setAttribute('aria-hidden', 'true'); get('object-picture').append(cell); }
  get('object-picture').setAttribute('aria-label', `${width} Zellen breit, ${height} Zellen hoch, ${alive.size} lebende Zellen, Winkel ${object.values[2]}, Phase ${object.values[3]}.`);
  object.values.forEach((value, i) => { get(`value-${i}`).value = value; }); caption();
}
function action(fn, message) {
  try { fn(); renderObject(); get('object-status').dataset.error = 'false'; get('object-status').textContent = message; }
  catch (error) { get('object-status').dataset.error = 'true'; get('object-status').textContent = error.message; }
}
function numeric(id) { if (!get(id).value.trim()) throw Error('Bitte fülle alle Zahlenfelder aus.'); return Number(get(id).value); }
get('attributes-form').addEventListener('submit', event => {
  event.preventDefault(); action(() => {
    const values = attributes.map((_, i) => i === 6 ? get(`value-${i}`).value : numeric(`value-${i}`));
    object.set(values);
  }, 'Attribute übernommen. Vergleiche Bild und Objektkarte.');
});
get('rotate-form').addEventListener('submit', event => { event.preventDefault(); action(() => object.drehe(numeric('rotate-n')), 'Drehung ausgeführt. Vergleiche Winkel und Ausdehnung.'); });
get('develop-form').addEventListener('submit', event => { event.preventDefault(); action(() => object.entwickle(numeric('develop-n')), 'Entwicklung ausgeführt. Vergleiche Phase und Bild.'); });
get('suggest-names').addEventListener('click', () => {
  attributes.forEach((value, i) => { get(`a-name-${i}`).value = value; }); methods.forEach((value, i) => { get(`m-name-${i}`).value = value; }); updateLabels();
});
object.set(object.values); updateLabels(); renderObject();
