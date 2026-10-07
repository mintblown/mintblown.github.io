'use strict';
const get = id => document.getElementById(id);
const attributes = ['länge', 'breite', 'winkel', 'phase', 'position x', 'position y', 'bild'];
const methods = ['drehe', 'entwickle', 'platziere'];
class Lebensform {
  constructor() { this.values = [3, 3, 0, 0, 0, 0, '010001111']; }
  set(values) {
    const [height, width, angle, phase, x, y, image] = values;
    if (![height, width, angle, phase, x, y].every(Number.isInteger) || height < 1 || height > 16 || width < 1 || width > 16 || angle % 90 !== 0 || Math.abs(angle) > 36000 || phase < 0 || phase > 10 || x < 0 || x > 255 || y < 0 || y > 255) throw Error('Prüfe die Werte: A/B 1–16, C in 90°-Schritten (−36000 bis 36000), D 0–10, E/F 0–255.');
    if (typeof image !== 'string' || !/^[01]+$/.test(image) || image.length !== height * width) throw Error(`Das Bild benötigt genau ${width * height} Bits (${width} × ${height}), nur 0 und 1 ohne Leerzeichen.`);
    this.values = [height, width, ((angle % 360) + 360) % 360, phase, x, y, image];
  }
  drehe(n) {
    if (!Number.isInteger(n) || n % 90 || Math.abs(n) > 36000) throw Error('n muss ein Vielfaches von 90 zwischen −36000 und 36000 sein.');
    const values = [...this.values];
    values[2] = (values[2] + n) % 360;
    this.set(values);
  }
  toggleCell(index) {
    const [height, width, angle, phase] = this.values;
    if (phase !== 0) throw Error('Zellen können nur bei Phase 0 geändert werden.');
    if (!Number.isInteger(index) || index < 0 || index >= height * width) throw Error('Ungültige Zelle.');
    const viewWidth = angle % 180 === 0 ? width : height;
    const x = index % viewWidth, y = Math.floor(index / viewWidth);
    // Map the rotated preview back to the unrotated initial image.
    const [sourceX, sourceY] = angle === 90 ? [y, height - 1 - x]
      : angle === 180 ? [width - 1 - x, height - 1 - y]
        : angle === 270 ? [width - 1 - y, x] : [x, y];
    const bits = [...this.values[6]], sourceIndex = sourceY * width + sourceX;
    bits[sourceIndex] = bits[sourceIndex] === '1' ? '0' : '1';
    const values = [...this.values];
    values[6] = bits.join('');
    this.set(values);
  }
  view() {
    let [height, width] = this.values;
    const { image, firstOverflowPhase } = this.simulate();
    let cells = [];
    [...image].forEach((bit, i) => { if (bit === '1') cells.push([i % width, Math.floor(i / width)]); });
    for (let turn = 0; turn < this.values[2] / 90; turn++) {
      cells = cells.map(([x, y]) => [height - 1 - y, x]);
      [height, width] = [width, height];
    }
    return { height, width, cells, firstOverflowPhase };
  }
  entwickle(n) {
    if (!Number.isInteger(n) || n < 0 || n > 10) throw Error('n muss eine ganze Zahl von 0 bis 10 sein.');
    const values = [...this.values];
    if (values[3] + n > 10) throw Error('Die Phase darf höchstens 10 sein.');
    values[3] += n;
    this.set(values);
  }
  currentImage() {
    return this.simulate().image;
  }
  simulate() {
    const [height, width, , phase] = this.values;
    // A dead border isolates this object's fixed image from the toroidal engine.
    const size = Math.max(height, width) + 4;
    const model = new LifeEngine(size);
    let image = this.values[6];
    let firstOverflowPhase = null;
    for (let step = 0; step < phase; step++) {
      model.current.fill(0);
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) model.current[(y + 2) * size + x + 2] = Number(image[y * width + x]);
      model.step();
      // Check the one-cell border before discarding it for the next step.
      // With a dead exterior, births outside the frame can only occur here.
      if (firstOverflowPhase === null) {
        for (let y = 1; y <= height + 2; y++) {
          for (let x = 1; x <= width + 2; x++) {
            if ((x === 1 || x === width + 2 || y === 1 || y === height + 2) && model.current[y * size + x]) {
              firstOverflowPhase = step + 1;
            }
          }
        }
      }
      let result = '';
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) result += model.current[(y + 2) * size + x + 2];
      image = result;
    }
    return { image, firstOverflowPhase };
  }
}
const object = new Lebensform();
// Frame belonging to the current draft bits, also before applying the form.
let imageFrame = object.values.slice(0, 2);
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
    input.rows = 4; input.spellcheck = false; input.setAttribute('aria-describedby', 'binary-help binary-status');
    label.className = 'binary-field';
  } else { input.type = 'number'; input.step = i === 2 ? '90' : '1'; input.min = i < 2 ? '1' : i === 2 ? '-36000' : '0'; input.max = i < 2 ? '16' : i === 2 ? '36000' : i === 3 ? '10' : '255'; }
  if (i === 3) {
    input.setAttribute('aria-describedby', 'phase-help object-status');
    input.addEventListener('input', updatePhase);
  }
  if (i < 2) input.setAttribute('aria-describedby', 'binary-status');
  if (i < 2 || i === 6) input.addEventListener('input', updateBinaryStatus);
  label.append(title, input); get('attribute-fields').append(label);
});
function resizeImage(image, source, target) {
  const [oldHeight, oldWidth] = source, [height, width] = target;
  let removedAlive = 0;
  for (let y = 0; y < oldHeight; y++) {
    for (let x = 0; x < oldWidth; x++) {
      if ((y >= height || x >= width) && image[y * oldWidth + x] === '1') removedAlive++;
    }
  }
  if (removedAlive) return { removedAlive };
  let result = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) result += y < oldHeight && x < oldWidth ? image[y * oldWidth + x] : '0';
  }
  return { image: result, removedAlive: 0 };
}
function updateBinaryStatus() {
  const dimensions = [0, 1].map(i => Number(get(`value-${i}`).value));
  const validDimensions = dimensions.every(value => Number.isInteger(value) && value >= 1 && value <= 16);
  const image = get('value-6').value;
  const validCharacters = /^[01]*$/.test(image);
  const expected = dimensions[0] * dimensions[1];
  const missing = expected - image.length;
  const valid = validDimensions && validCharacters && missing === 0;
  const status = get('binary-status');
  status.dataset.error = String(!valid);
  [0, 1].forEach((i) => get(`value-${i}`).setAttribute('aria-invalid', String(!Number.isInteger(dimensions[i]) || dimensions[i] < 1 || dimensions[i] > 16)));
  get('value-6').setAttribute('aria-invalid', String(!validCharacters || (validDimensions && missing !== 0)));
  if (!validDimensions) status.textContent = 'Für A und B sind ganze Zahlen von 1 bis 16 nötig, um die benötigte Bitanzahl zu berechnen.';
  else if (!validCharacters) status.textContent = `${expected} Bits benötigt (${dimensions[0]} × ${dimensions[1]}). G enthält ungültige Zeichen. Erlaubt sind nur 0 und 1, ohne Leerzeichen oder Zeilenumbrüche.`;
  else if (missing > 0) status.textContent = `${image.length} von ${expected} Bits vorhanden (${dimensions[0]} × ${dimensions[1]}). Es fehlen ${missing} ${missing === 1 ? 'Bit' : 'Bits'}. Ergänze sie oder fülle mit Nullen auf.`;
  else if (missing < 0) status.textContent = `${image.length} Bits vorhanden, ${expected} benötigt (${dimensions[0]} × ${dimensions[1]}). ${-missing} ${missing === -1 ? 'Bit ist' : 'Bits sind'} zu viel. Kürze G selbst oder vergrößere A bzw. B.`;
  else status.textContent = `Passt: ${image.length} von ${expected} Bits (${dimensions[0]} × ${dimensions[1]}).`;
  const frameChanged = dimensions.some((value, i) => value !== imageFrame[i]);
  const knownFrame = image.length === imageFrame[0] * imageFrame[1];
  let replacement = null;
  let label = 'Bildrahmen anpassen';
  if (validDimensions && validCharacters && frameChanged && knownFrame) {
    const resized = resizeImage(image, imageFrame, dimensions);
    if (resized.removedAlive) {
      status.dataset.error = 'true';
      status.textContent += ` Anpassung nicht möglich: ${resized.removedAlive} lebende Zelle(n) liegen außerhalb des neuen Rahmens. Setze diese Bits zuerst selbst auf 0 oder wähle einen größeren Rahmen.`;
    } else {
      replacement = resized.image;
      label = 'Nullen passend zum Raster ergänzen / entfernen';
      status.textContent += ` Rahmen von ${imageFrame[0]} × ${imageFrame[1]} auf ${dimensions[0]} × ${dimensions[1]} anpassen: Zellpositionen bleiben oben links erhalten; nur Nullen werden ergänzt oder entfernt.`;
    }
  } else if (validDimensions && validCharacters && missing > 0) {
    replacement = image.padEnd(expected, '0');
    label = `Mit ${missing} ${missing === 1 ? 'Null' : 'Nullen'} am Ende auffüllen`;
  }
  get('pad-binary').disabled = replacement === null;
  get('pad-binary').textContent = label;
  return { replacement, dimensions };
}
get('pad-binary').addEventListener('click', () => {
  const { replacement, dimensions } = updateBinaryStatus();
  if (replacement === null) return;
  get('value-6').value = replacement;
  imageFrame = [...dimensions];
  updateBinaryStatus();
  get('object-status').dataset.error = 'false';
  get('object-status').textContent = 'Bitinhalt angepasst. Klicke auf „Attribute setzen“, um das Objekt zu aktualisieren.';
});
function updateLabels() {
  attributes.forEach((_, i) => { get(`field-label-${i}`).textContent = name('a', i); });
  ['rotate', 'develop', 'place'].forEach((key, i) => { get(`${key}-button`).textContent = `${name('m', i)}(${i < 2 ? 'n' : ''})`; });
  caption();
}
function caption() { get('object-caption').textContent = attributes.map((_, i) => `${name('a', i)} = ${object.values[i]}`).join('\n'); }
function renderObject(syncFields = true) {
  const { height, width, cells, firstOverflowPhase } = object.view();
  const warning = get('boundary-warning');
  warning.hidden = firstOverflowPhase === null;
  warning.textContent = firstOverflowPhase === null ? '' : `Achtung: Bei der Berechnung von Phase ${firstOverflowPhase} würden lebende Zellen außerhalb des Bildrahmens entstehen. Sie werden abgeschnitten; spätere Phasen können dadurch von einer Entwicklung auf einer größeren Fläche abweichen. Vergrößere A bzw. B und passe das Anfangsbild an.`;
  get('object-picture').style.gridTemplateColumns = `repeat(${width}, 1fr)`;
  get('object-picture').replaceChildren();
  const alive = new Set(cells.map(([x, y]) => y * width + x));
  const editable = object.values[3] === 0;
  get('object-picture').setAttribute('role', editable ? 'group' : 'img');
  for (let i = 0; i < height * width; i++) {
    const cell = document.createElement(editable ? 'button' : 'span');
    cell.className = `picture-cell${alive.has(i) ? ' alive' : ''}`;
    if (editable) {
      cell.type = 'button';
      cell.setAttribute('aria-label', `Zeile ${Math.floor(i / width) + 1}, Spalte ${i % width + 1}`);
      cell.setAttribute('aria-pressed', String(alive.has(i)));
      cell.addEventListener('click', () => {
        const hasDraft = object.values.some((value, index) => index === 6
          ? get(`value-${index}`).value !== value
          : !get(`value-${index}`).value.trim() || Number(get(`value-${index}`).value) !== value);
        if (hasDraft) {
          get('object-status').dataset.error = 'true';
          get('object-status').textContent = 'Bitte zuerst die offenen Eingaben mit „Attribute setzen“ übernehmen, bevor du die Vorschau bearbeitest.';
          return;
        }
        action(() => object.toggleCell(i), 'Zelle umgeschaltet. Anfangsbild und Bitinhalt G sind aktualisiert.');
        get('object-picture').children[i]?.focus();
      });
    } else cell.setAttribute('aria-hidden', 'true');
    get('object-picture').append(cell);
  }
  get('object-picture').setAttribute('aria-label', `${width} Zellen breit, ${height} Zellen hoch, ${alive.size} lebende Zellen, Winkel ${object.values[2]}, Phase ${object.values[3]}.`);
  if (syncFields) {
    imageFrame = object.values.slice(0, 2);
    object.values.forEach((value, i) => { get(`value-${i}`).value = value; });
    get('value-3').setAttribute('aria-invalid', 'false');
  }
  caption(); updateBinaryStatus();
}
function updatePhase() {
  try {
    const phase = numeric('value-3');
    if (!Number.isInteger(phase) || phase < 0 || phase > 10) throw Error('Die Phase muss eine ganze Zahl von 0 bis 10 sein.');
    const values = [...object.values];
    values[3] = phase;
    object.set(values);
    // Do not discard unapplied edits to the initial image or its frame.
    renderObject(false);
    get('value-3').setAttribute('aria-invalid', 'false');
    get('object-status').dataset.error = 'false';
    get('object-status').textContent = `Phase ${phase} neu aus dem gespeicherten Anfangsbild berechnet. Andere Eingaben werden erst mit „Attribute setzen“ übernommen.`;
  } catch (error) {
    get('value-3').setAttribute('aria-invalid', 'true');
    get('object-status').dataset.error = 'true';
    get('object-status').textContent = error.message;
  }
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
get('develop-form').addEventListener('submit', event => { event.preventDefault(); action(() => object.entwickle(numeric('develop-n')), 'Phase erhöht und Vorschau neu aus dem Anfangsbild berechnet. G bleibt unverändert.'); });
get('suggest-names').addEventListener('click', () => {
  attributes.forEach((value, i) => { get(`a-name-${i}`).value = value; }); methods.forEach((value, i) => { get(`m-name-${i}`).value = value; }); updateLabels();
});
object.set(object.values); updateLabels(); renderObject();
