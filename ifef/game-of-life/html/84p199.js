'use strict';
// Snapshot of input/84P199_semi_synthesis.csv; coordinates are centered together.
const synthesisCSV = "nr,struktur,phase,drehung,x,y\n1,block,0,0,118,105\n2,block,0,0,127,106\n3,block,0,0,136,105\n4,block,0,0,102,112\n5,block,0,0,152,112\n6,block,0,0,102,141\n7,block,0,0,152,141\n8,block,0,0,118,148\n9,block,0,0,127,147\n10,block,0,0,136,148\n11,lleft,0,90,120,116\n12,lright,0,270,133,116\n13,lright,0,90,120,137\n14,lleft,0,270,133,137\n15,blinker,0,0,121,119\n16,blinker,0,0,132,119\n17,blinker,0,0,121,135\n18,blinker,0,0,132,135\n19,glider,0,0,105,118\n20,glider,0,90,112,121\n21,glider,0,90,149,119\n22,glider,0,180,146,126\n23,glider,0,270,104,133\n24,glider,0,0,107,126\n25,glider,0,180,148,134\n26,glider,0,270,141,131";
const synthesisPatterns = {
  block: [[0, 0], [1, 0], [0, 1], [1, 1]],
  glider: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
  blinker: [[0, 0], [1, 0], [2, 0]],
  lleft: [[1, 0], [1, 1], [0, 2], [1, 2]],
  lright: [[0, 0], [0, 1], [0, 2], [1, 2]]
};
function synthesisRotation(cells, degrees) {
  let result = cells.map(([x, y]) => [x, y]);
  for (let turn = 0; turn < degrees / 90; turn++) {
    const maxY = Math.max(...result.map(([, y]) => y));
    result = result.map(([x, y]) => [maxY - y, x]);
  }
  return result;
}
const synthesisPoints = synthesisCSV.trim().split(/\r?\n/).slice(1).flatMap(row => {
  const [, name, phase, rotation, x, y] = row.split(',');
  if (!Object.hasOwn(synthesisPatterns, name) || Number(phase) !== 0) throw Error('Ungültige Synthesestruktur oder Phase.');
  return synthesisRotation(synthesisPatterns[name], Number(rotation)).map(([dx, dy]) => [Number(x) + dx, Number(y) + dy]);
});
const minX = Math.min(...synthesisPoints.map(([x]) => x));
const minY = Math.min(...synthesisPoints.map(([, y]) => y));
const width = Math.max(...synthesisPoints.map(([x]) => x)) - minX + 1;
const height = Math.max(...synthesisPoints.map(([, y]) => y)) - minY + 1;
if (width > SIZE || height > SIZE) throw Error('Die Synthese passt nicht auf das Spielfeld.');
const initialPoints = synthesisPoints.map(([x, y]) => [
  x - minX + Math.floor((SIZE - width) / 2),
  y - minY + Math.floor((SIZE - height) / 2)
]);
function restoreSynthesis() { lifeBoard.restore(initialPoints); }
canvas.addEventListener('boardreset', restoreSynthesis);
restoreSynthesis();

for (const [index, card] of [...document.querySelectorAll('.structure-card')].entries()) {
  const picture = card.querySelector('canvas');
  const ctx = picture.getContext('2d');
  const cells = synthesisPatterns[card.dataset.pattern];
  const columns = Math.max(...cells.map(([x]) => x)) + 1;
  const rows = Math.max(...cells.map(([, y]) => y)) + 1;
  const scale = 24;
  const left = (picture.width - columns * scale) / 2;
  const top = (picture.height - rows * scale) / 2;
  ctx.fillStyle = '#101916'; ctx.fillRect(0, 0, picture.width, picture.height);
  ctx.fillStyle = '#a4e8a7';
  for (const [x, y] of cells) ctx.fillRect(left + x * scale, top + y * scale, scale - 2, scale - 2);
  card.addEventListener('click', () => {
    const revealed = card.getAttribute('aria-pressed') !== 'true';
    card.setAttribute('aria-pressed', String(revealed));
    card.setAttribute('aria-label', revealed ? `${card.querySelector('strong').textContent} – wieder verdecken` : `Grundstruktur ${index + 1} aufdecken`);
  });
}
