'use strict';
const get = id => document.getElementById(id);
const attributes = ['länge', 'breite', 'winkel', 'phase', 'position x', 'position y', 'bild'];
const methods = ['drehe', 'entwickle', 'platziere'];
class Lebensform {
  constructor() { this.values = [3, 3, 0, 0, 0, 0, '010001111']; }
  set(values) {
    const [height, width, angle, phase, x, y, image] = values;
    if (![height, width, angle, phase, x, y].every(Number.isInteger) || height < 1 || height > 10 || width < 1 || width > 10 || angle % 90 !== 0 || Math.abs(angle) > 36000 || phase < 0 || phase > 10 || x < 0 || x > 9 || y < 0 || y > 9) throw Error('Prüfe die Werte: A/B 1–10, C in 90°-Schritten (−36000 bis 36000), D 0–10, E/F 0–9.');
    if (x + width > 10 || y + height > 10) throw Error('Der A×B-Rahmen muss vollständig im 10×10-Raster liegen. Verkleinere A/B oder verschiebe ihn mit E/F.');
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
    const [height, width] = this.values;
    if (!Number.isInteger(index) || index < 0 || index >= height * width) throw Error('Ungültige Zelle.');
    const bits = [...this.values[6]];
    bits[index] = bits[index] === '1' ? '0' : '1';
    const values = [...this.values];
    values[6] = bits.join('');
    this.set(values);
  }
  view() {
    let [height, width] = this.values;
    let { cells } = this.simulate();
    for (let turn = 0; turn < this.values[2] / 90; turn++) {
      cells = cells.map(([x, y]) => [height - 1 - y, x]);
      [height, width] = [width, height];
    }
    return { height, width, cells };
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
    const [height, width, , phase, , , image] = this.values;
    // Growth travels at most one cell per generation. Keep all of it, with
    // an additional dead margin so the toroidal engine cannot wrap around.
    const padding = phase + 2;
    const size = Math.max(height, width) + 2 * padding;
    const model = new LifeEngine(size);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      model.current[(y + padding) * size + x + padding] = Number(image[y * width + x]);
    }
    for (let step = 0; step < phase; step++) model.step();
    const cells = [];
    model.current.forEach((alive, index) => {
      if (alive) cells.push([index % size - padding, Math.floor(index / size) - padding]);
    });
    let frameImage = '';
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      frameImage += model.current[(y + padding) * size + x + padding];
    }
    return { cells, image: frameImage };
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
  } else { input.type = 'number'; input.step = i === 2 ? '90' : '1'; input.min = i < 2 ? '1' : i === 2 ? '-36000' : '0'; input.max = i < 2 ? '10' : i === 2 ? '36000' : i === 3 ? '10' : '9'; }
  if (i === 3) {
    input.setAttribute('aria-describedby', 'phase-help object-status');
    input.addEventListener('input', () => updateViewAttribute(i));
  }
  if (i === 2 || i === 4 || i === 5) input.addEventListener('input', () => updateViewAttribute(i));
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
  const validDimensions = dimensions.every(value => Number.isInteger(value) && value >= 1 && value <= 10);
  const image = get('value-6').value;
  const validCharacters = /^[01]*$/.test(image);
  const expected = dimensions[0] * dimensions[1];
  const missing = expected - image.length;
  const valid = validDimensions && validCharacters && missing === 0;
  const status = get('binary-status');
  status.dataset.error = String(!valid);
  [0, 1].forEach((i) => get(`value-${i}`).setAttribute('aria-invalid', String(!Number.isInteger(dimensions[i]) || dimensions[i] < 1 || dimensions[i] > 10)));
  get('value-6').setAttribute('aria-invalid', String(!validCharacters || (validDimensions && missing !== 0)));
  if (!validDimensions) status.textContent = 'Für A und B sind ganze Zahlen von 1 bis 10 nötig, um die benötigte Bitanzahl zu berechnen.';
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
}
function renderObject(syncFields = true) {
  const { cells } = object.view();
  const [height, width, angle, phase, originX, originY, image] = object.values;
  const transformed = angle !== 0 || phase !== 0;
  const overlay = new Set(cells.map(([x, y]) => `${x + originX},${y + originY}`));
  const outsideGrid = transformed && cells.some(([x, y]) => x + originX < 0 || y + originY < 0 || x + originX >= 10 || y + originY >= 10);
  const warning = get('boundary-warning');
  const warnings = [];
  if (outsideGrid) warnings.push('Ein Teil der entwickelten oder gedrehten Figur liegt außerhalb des sichtbaren 10×10-Rasters. Er wird weiter mitberechnet. Verschiebe den Rahmen mit E/F, um mehr davon zu sehen.');
  warning.hidden = warnings.length === 0;
  warning.textContent = warnings.join(' ');
  const picture = get('object-picture');
  picture.replaceChildren();
  picture.setAttribute('role', 'group');
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const editable = x >= originX && x < originX + width && y >= originY && y < originY + height;
      const sourceIndex = (y - originY) * width + x - originX;
      const alive = editable && image[sourceIndex] === '1';
      const colored = transformed && overlay.has(`${x},${y}`);
      const cell = document.createElement(editable ? 'button' : 'span');
      cell.className = `picture-cell${editable ? ' editable' : ''}${alive ? ' alive' : ''}${colored ? ' transformed' : ''}`;
      if (editable) {
        if (x === originX) cell.classList.add('frame-left');
        if (x === originX + width - 1) cell.classList.add('frame-right');
        if (y === originY) cell.classList.add('frame-top');
        if (y === originY + height - 1) cell.classList.add('frame-bottom');
        cell.type = 'button';
        cell.setAttribute('aria-label', `Zeile ${y + 1}, Spalte ${x + 1}, Bit ${sourceIndex + 1} der Grundfigur${colored ? ', farbige Überlagerung' : ''}`);
        cell.setAttribute('aria-pressed', String(alive));
        cell.addEventListener('click', () => {
          const hasDraft = object.values.some((value, index) => index === 6
            ? get(`value-${index}`).value !== value
            : !get(`value-${index}`).value.trim() || Number(get(`value-${index}`).value) !== value);
          if (hasDraft) {
            get('object-status').dataset.error = 'true';
            get('object-status').textContent = 'Bitte zuerst die offenen Eingaben mit „Attribute setzen“ übernehmen, bevor du die Grundfigur bearbeitest.';
            return;
          }
          action(() => object.toggleCell(sourceIndex), 'Zelle umgeschaltet. Grundfigur, Bitinhalt G und farbige Überlagerung sind aktualisiert.');
          picture.children[y * 10 + x]?.focus();
        });
      } else cell.setAttribute('aria-hidden', 'true');
      picture.append(cell);
    }
  }
  picture.setAttribute('aria-label', `10 mal 10 Zellen. Editierbarer Rahmen: ${width} breit, ${height} hoch, Position X ${originX}, Y ${originY}. Schwarze Grundfigur; farbige Überlagerung bei Winkel ${angle}, Phase ${phase}.`);
  if (syncFields) {
    imageFrame = object.values.slice(0, 2);
    object.values.forEach((value, i) => { get(`value-${i}`).value = value; });
    [2, 3, 4, 5].forEach(i => get(`value-${i}`).setAttribute('aria-invalid', 'false'));
  }
  updateBinaryStatus();
}
function updateViewAttribute(index) {
  try {
    const values = [...object.values];
    values[index] = numeric(`value-${index}`);
    object.set(values);
    // Keep unapplied edits to the initial image and its dimensions.
    renderObject(false);
    get(`value-${index}`).setAttribute('aria-invalid', 'false');
    get('object-status').dataset.error = 'false';
    get('object-status').textContent = 'Darstellung aktualisiert. A/B und G werden mit „Attribute setzen“ übernommen.';
  } catch (error) {
    get(`value-${index}`).setAttribute('aria-invalid', 'true');
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
const suggestions = [...attributes, 'drehe(n)', 'entwickle(n)', 'platziere()'];
for (let i = suggestions.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [suggestions[i], suggestions[j]] = [suggestions[j], suggestions[i]];
}
get('name-suggestions').textContent = suggestions.join(' · ');
object.set(object.values); updateLabels(); renderObject();
