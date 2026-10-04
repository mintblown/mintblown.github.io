'use strict';
const descriptions = {
  block: ['Der Block', 'Nichts verändert sich. Jede lebende Zelle hat genau drei lebende Nachbarn. Keine tote Zelle hat genau drei lebende Nachbarn. Der Block bleibt für immer gleich.', 'Das Muster ist 2×2 Zellen groß. Mit einem toten Rand benötigt es 4×4 Zellen.'],
  blinker: ['Der Blinker', 'Drei lebende Zellen liegen in einer Reihe. In der nächsten Runde stehen sie senkrecht, danach wieder waagerecht. Nach zwei Runden sieht das Muster aus wie am Anfang.', 'Der Start ist 3×1 Zellen groß, die nächste Phase 1×3. Über den ganzen Durchlauf braucht das Muster 3×3 Zellen, mit einem toten Rand 5×5.'],
  pulsar: ['Der Pulsar', 'Das Muster wächst, schrumpft und wächst wieder. Nach drei Runden sieht es aus wie am Anfang. Es wirkt, als würde es atmen.', 'Am Anfang ist der Pulsar 13×13 Zellen groß. In der nächsten Runde wächst er auf 15×15. Mit einem toten Rand benötigt er 17×17 Zellen.'],
  glider: ['Der Gleiter', 'Fünf lebende Zellen wandern. Nach vier Runden sieht das Muster wieder aus wie am Anfang, ist aber eine Zelle nach rechts und eine nach unten gewandert.', 'In vier Runden braucht das Muster 4×4 Zellen, mit einem toten Rand 6×6. Danach wandert es weiter und benötigt mehr Platz.'],
  lwss: ['Das kleine Raumschiff', 'Neun lebende Zellen bilden den Start. Das Raumschiff fliegt geradeaus nach rechts. Nach vier Runden hat es wieder seine Ausgangsform und ist zwei Zellen weiter rechts.', 'In vier Runden braucht es 7×5 Zellen, mit einem toten Rand 9×7. Für längere Beobachtungen benötigt es mehr Platz.'],
  gun: ['Die Gosper-Kanone', 'Die Kanone bleibt an ihrem Platz und schießt alle 30 Runden einen neuen Gleiter nach rechts unten ab. Nach 30 Runden sieht der Kanonenkörper wieder aus wie am Anfang; zusätzlich gibt es einen neuen Gleiter.', 'Der Start ist 36×9 Zellen groß. In 30 Runden wächst der Bereich auf 36×12. Mit einem toten Rand sind das 38×14 Zellen. Hier bleibt es bei diesem festen Feld für einen Durchlauf; weiterfliegende Gleiter werden bei der Feldgröße nicht berücksichtigt.']
};
// Fixed worksheet minimum sizes and origin offsets for a complete cycle.
const fields = {
  block: { width: 4, height: 4, x: 1, y: 1 },
  blinker: { width: 5, height: 5, x: 1, y: 2 },
  pulsar: { width: 17, height: 17, x: 2, y: 2 },
  glider: { width: 6, height: 6, x: 1, y: 1 },
  lwss: { width: 9, height: 7, x: 1, y: 1 },
  gun: { width: 38, height: 14, x: 1, y: 1 }
};
const node = id => document.getElementById(id);
const key = (x, y) => `${x},${y}`;
let live = new Set(), generation = 0;
let timers = new Map();
function sequenceLength() { const pattern = worksheetPatterns[node('pattern').value]; return pattern.steps ?? pattern.period; }
function neighborCount(cells, x, y) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && cells.has(key(x + dx, y + dy))) count++;
  return count;
}
function outcome(alive, count) { return alive ? (count === 2 || count === 3 ? 'same' : 'death') : (count === 3 ? 'birth' : 'same'); }
function nextGeneration(cells) {
  const counts = new Map();
  for (const cell of cells) {
    const [x, y] = cell.split(',').map(Number);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) {
      const target = key(x + dx, y + dy); counts.set(target, (counts.get(target) || 0) + 1);
    }
  }
  return new Set([...counts].filter(([cell, count]) => count === 3 || (count === 2 && cells.has(cell))).map(([cell]) => cell));
}
function inspect(button, x, y) {
  const count = neighborCount(live, x, y), alive = live.has(key(x, y)), result = outcome(alive, count);
  const description = result === 'death' ? 'stirbt' : result === 'birth' ? 'wird geboren' : alive ? 'bleibt lebendig' : 'bleibt tot';
  clearTimeout(timers.get(button));
  button.textContent = count; button.className = `${alive ? 'alive ' : ''}${result}`;
  node('cell-status').textContent = `(${x}, ${y}): ${count} lebende Nachbarn – die Zelle ${description}.`;
  timers.set(button, setTimeout(() => { button.textContent = ''; button.className = alive ? 'alive' : ''; timers.delete(button); }, 2000));
}
function render() {
  for (const timer of timers.values()) clearTimeout(timer); timers.clear();
  const board = node('pattern-board'); board.replaceChildren();
  const { width, height } = fields[node('pattern').value];
  const left = 0, top = 0, right = width - 1, bottom = height - 1;
  board.style.gridTemplateColumns = `repeat(${width}, var(--cell-size))`;
  board.style.setProperty('--cell-size', `${Math.max(24, Math.min(42, Math.floor(950 / width)))}px`);
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
    const button = document.createElement('button'); button.type = 'button';
    const alive = live.has(key(x, y)); button.className = alive ? 'alive' : '';
    button.setAttribute('aria-label', `Zelle (${x}, ${y}), ${alive ? 'lebendig' : 'tot'}: Nachbarn zählen`);
    button.addEventListener('click', () => inspect(button, x, y)); board.append(button);
  }
  node('generation').textContent = `Generation ${generation} von ${sequenceLength()} · ${live.size} lebende Zellen · Spielfeld ${width} × ${height}`;
  node('cell-status').textContent = generation === sequenceLength() ? 'Sequenz abgeschlossen. Weiter beginnt wieder beim Ausgangszustand.' : 'Wähle ein Feld. Die Nachbarzahl erscheint für zwei Sekunden.';
}
function resetPattern() {
  const selected = node('pattern').value;
  const offset = fields[selected];
  live = new Set(worksheetPatterns[selected].cells.map(([x, y]) => key(x + offset.x, y + offset.y))); generation = 0;
  const [title, description, space] = descriptions[selected];
  node('pattern-title').textContent = title; node('pattern-description').textContent = description; node('pattern-space').textContent = space;
  node('pattern-board').classList.remove('advanced'); render();
}
node('pattern').addEventListener('change', resetPattern);
node('reset-pattern').addEventListener('click', resetPattern);
node('next').addEventListener('click', () => {
  if (generation === sequenceLength()) resetPattern();
  else { live = nextGeneration(live); generation++; render(); }
  const board = node('pattern-board'); board.classList.remove('advanced'); void board.offsetWidth; board.classList.add('advanced');
});
resetPattern();

