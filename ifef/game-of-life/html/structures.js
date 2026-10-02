'use strict';
const patterns = {
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
  const cells = rotateCells(phaseCells(pattern, integer('phase', pattern.period - 1)), rotation);
  const x = integer('x', 255), y = integer('y', 255);
  return { cells, points: cells.map(([dx, dy]) => [(x + dx) % 256, (y + dy) % 256]) };
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
  field('phase').value = '0'; field('phase').max = String(pattern ? pattern.period - 1 : 0);
  if (pattern) previewSelection();
  else { lifeBoard.preview([]); field('placement-status').textContent = ''; }
});
field('rotation').addEventListener('change', previewSelection);
for (const id of ['phase', 'x', 'y']) field(id).addEventListener('input', previewSelection);
field('placement').addEventListener('submit', event => {
  event.preventDefault();
  try {
    lifeBoard.add(selection().points);
    field('placement-status').dataset.error = 'false';
    field('placement-status').textContent = 'Hinzugefügt.';
  } catch (error) {
    field('placement-status').dataset.error = 'true';
    field('placement-status').textContent = error.message;
  }
});
field('life').addEventListener('boardreset', () => {
  field('structure').value = ''; field('placement-fields').hidden = true;
  field('placement-status').textContent = ''; drawPattern([]);
});
