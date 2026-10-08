'use strict';
const patterns = {
  lleft: { maxPhase: 0, cells: [[1, 0], [1, 1], [0, 2], [1, 2]] },
  lright: { maxPhase: 0, cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },
  fpentomino: { maxPhase: 0, cells: [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]] },
  block: { period: 1, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  blinker: { period: 2, cells: [[0, 0], [1, 0], [2, 0]] },
  toad: { period: 2, cells: [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]] },
  beacon: { period: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1], [2, 2], [3, 2], [2, 3], [3, 3]] },
  glider: { period: 4, cells: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]] },
  // Standard patterns: https://conwaylife.com/patterns/
  lwss: { period: 4, cells: [[1, 0], [4, 0], [0, 1], [0, 2], [4, 2], [0, 3], [1, 3], [2, 3], [3, 3]] },
  gun: { period: 30, cells: [
    [24, 0], [22, 1], [24, 1], [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2],
    [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3],
    [0, 4], [1, 4], [10, 4], [16, 4], [20, 4], [21, 4],
    [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5], [22, 5], [24, 5],
    [10, 6], [16, 6], [24, 6], [11, 7], [15, 7], [12, 8], [13, 8]
  ] }
};
const field = id => document.getElementById(id);
const thumbnail = field('pattern-preview').getContext('2d');
let placementLog = [];
const patternNames = { lleft: 'J-Tretromino', lright: 'L-Tretromino', fpentomino: 'F-Pentomino', block: 'Block', blinker: 'Blinker', toad: 'Kröte', beacon: 'Leuchtfeuer', glider: 'Glider', gun: 'Gosper-Gleiterkanone', lwss: 'LWSS' };
function phaseCells(pattern, phase) {
  // One generation can expand the pattern by at most one cell per side.
  const padding = phase + 2;
  const extent = Math.max(...pattern.cells.flat()) + 1;
  const size = extent + 2 * padding;
  const model = new LifeEngine(size);
  for (const [x, y] of pattern.cells) model.current[(y + padding) * size + x + padding] = 1;
  for (let i = 0; i < phase; i++) model.step();
  const cells = [];
  model.current.forEach((alive, index) => { if (alive) cells.push([index % size, Math.floor(index / size)]); });
  const minX = Math.min(...cells.map(([x]) => x)), minY = Math.min(...cells.map(([, y]) => y));
  return cells.map(([x, y]) => [x - minX, y - minY]);
}
function rotateCells(cells, degrees) {
  let rotated = cells.map(([x, y]) => [x, y]);
  for (let turn = 0; turn < degrees / 90; turn++) {
    const maxY = Math.max(...rotated.map(([, y]) => y));
    rotated = rotated.map(([x, y]) => [maxY - y, x]);
  }
  return rotated;
}
function integer(id, max) {
  const input = field(id), value = Number(input.value);
  if (input.value.trim() === '' || !Number.isInteger(value) || value < 0 || value > max) throw Error(`${id === 'phase' ? 'Zustand' : id.toUpperCase()}: Bitte eine ganze Zahl von 0 bis ${max} eingeben.`);
  return value;
}
function selection() {
  const pattern = patterns[field('structure').value];
  if (!pattern) throw Error('Bitte eine Struktur auswählen.');
  const rotation = Number(field('rotation').value);
  if (![0, 90, 180, 270].includes(rotation)) throw Error('Bitte eine Drehung in 90°-Schritten wählen.');
  const phase = integer('phase', (pattern.maxPhase ?? pattern.period - 1));
  const cells = rotateCells(phaseCells(pattern, phase), rotation);
  const x = integer('x', 255), y = integer('y', 255);
  return { entry: { structure: field('structure').value, phase, rotation, x, y }, cells, points: cells.map(([dx, dy]) => [(x + dx) % 256, (y + dy) % 256]) };
}
function drawPattern(cells) {
  thumbnail.fillStyle = '#101916'; thumbnail.fillRect(0, 0, 160, 160);
  if (!cells.length) return;
  const width = Math.max(...cells.map(([x]) => x)) + 1, height = Math.max(...cells.map(([, y]) => y)) + 1;
  const scale = Math.floor(160 / (Math.max(width, height) + 2));
  const left = Math.floor((160 - width * scale) / 2), top = Math.floor((160 - height * scale) / 2);
  thumbnail.fillStyle = '#ffaa4c';
  for (const [x, y] of cells) thumbnail.fillRect(left + x * scale, top + y * scale, scale - 1, scale - 1);
}
function previewSelection() {
  try {
    const { cells, points } = selection();
    drawPattern(cells); lifeBoard.preview(points);
    field('placement-status').textContent = '';
    field('placement-status').dataset.error = 'false';
  } catch (error) {
    lifeBoard.preview([]); drawPattern([]);
    field('placement-status').textContent = error.message;
    field('placement-status').dataset.error = 'true';
  }
}
field('structure').addEventListener('change', () => {
  const pattern = patterns[field('structure').value];
  field('placement-fields').hidden = !pattern;
  field('phase').value = '0'; field('phase').max = String(pattern ? (pattern.maxPhase ?? pattern.period - 1) : 0);
  if (pattern) previewSelection();
  else { lifeBoard.preview([]); field('placement-status').textContent = ''; }
});
field('rotation').addEventListener('change', previewSelection);
for (const id of ['phase', 'x', 'y']) field(id).addEventListener('input', previewSelection);
field('placement').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const selected = selection();
    lifeBoard.add(selected.points);
    placementLog.push(selected.entry);
    renderLog();
    field('placement-status').dataset.error = 'false';
    field('placement-status').textContent = 'Hinzugefügt.';
  } catch (error) {
    field('placement-status').dataset.error = 'true';
    field('placement-status').textContent = error.message;
  }
});
field('life').addEventListener('boardreset', () => {
  placementLog = []; renderLog();
  field('macro-status').textContent = '';
  field('structure').value = ''; field('placement-fields').hidden = true;
  field('placement-status').textContent = ''; drawPattern([]);
});

function renderLog() {
  field('placement-log').replaceChildren();
  placementLog.forEach((entry, index) => {
    const row = document.createElement('tr');
    for (const value of [index + 1, patternNames[entry.structure], entry.phase, `${entry.rotation}°`, entry.x, entry.y]) {
      const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
    }
    field('placement-log').append(row);
  });
}
function exportCSV(entries) {
  return '\uFEFFnr,struktur,phase,drehung,x,y\r\n' + entries.map((entry, index) =>
    [index + 1, entry.structure, entry.phase, entry.rotation, entry.x, entry.y].join(',')).join('\r\n') + '\r\n';
}
function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r\n|\n|\r/);
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const fields = line => line.split(delimiter).map(value => {
    const trimmed = value.trim();
    return /^"[^"\r\n]*"$/.test(trimmed) ? trimmed.slice(1, -1) : trimmed;
  });
  if (fields(lines[0]).join(',') !== 'nr,struktur,phase,drehung,x,y') throw Error('CSV-Kopf erwartet: nr,struktur,phase,drehung,x,y');
  return lines.slice(1).map((line, index) => {
    const values = fields(line);
    const [order, structure, phase, rotation, x, y] = values;
    const validNumbers = [order, phase, rotation, x, y].every(value => /^\d+$/.test(value));
    if (values.length !== 6 || !validNumbers || Number(order) !== index + 1 || !Object.hasOwn(patterns, structure)
      || Number(phase) > (patterns[structure].maxPhase ?? patterns[structure].period - 1) || ![0, 90, 180, 270].includes(Number(rotation)) || Number(x) > 255 || Number(y) > 255) {
      throw Error(`CSV-Zeile ${index + 2}: ungültige Struktur, Phase, Drehung, Koordinaten oder Reihenfolge.`);
    }
    return { structure, phase: Number(phase), rotation: Number(rotation), x: Number(x), y: Number(y) };
  });
}
function restoreMacro(text) {
  // Validate and prepare the entire file before changing the board or log.
  const entries = parseCSV(text);
  const points = [];
  const cache = new Map();
  for (const entry of entries) {
    const key = `${entry.structure}/${entry.phase}/${entry.rotation}`;
    if (!cache.has(key)) cache.set(key, rotateCells(phaseCells(patterns[entry.structure], entry.phase), entry.rotation));
    for (const [dx, dy] of cache.get(key)) points.push([(entry.x + dx) % 256, (entry.y + dy) % 256]);
  }
  lifeBoard.restore(points);
  placementLog = entries; renderLog();
  field('structure').value = ''; field('placement-fields').hidden = true;
  field('placement-status').textContent = ''; drawPattern([]);
  return entries.length;
}
field('export-macro').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([exportCSV(placementLog)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'game-of-life-startbedingungen.csv';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  field('macro-status').dataset.error = 'false';
  field('macro-status').textContent = `${placementLog.length} Platzierungen exportiert.`;
});
let importVersion = 0;
field('import-macro').addEventListener('change', async event => {
  const version = ++importVersion;
  const file = event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    if (version !== importVersion) return;
    const count = restoreMacro(text);
    field('macro-status').dataset.error = 'false';
    field('macro-status').textContent = `${count} Platzierungen geladen. Die Startbedingungen sind wiederhergestellt.`;
  } catch (error) {
    if (version !== importVersion) return;
    field('macro-status').dataset.error = 'true';
    field('macro-status').textContent = `${error.message} Feld und Protokoll wurden nicht verändert.`;
  } finally {
    if (version === importVersion) field('import-macro').value = '';
  }
});
renderLog();
