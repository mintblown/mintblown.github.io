'use strict';
const model = new LifeEngine(16);
const board = document.getElementById('board');
const stepButton = document.getElementById('step');
const status = document.getElementById('step-status');
const cells = Array.from({ length: 256 }, () => {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.setAttribute('aria-hidden', 'true');
  board.append(cell);
  return cell;
});
let pending = null;
let generation = 0;
function render() {
  cells.forEach((cell, index) => { cell.className = model.current[index] ? 'cell alive' : 'cell'; });
  board.setAttribute('aria-label', `Generation ${generation}, 16 mal 16 Zellen. Schwarz: lebendig. Weiß: tot.`);
}
function singleStep() {
  if (pending) {
    model.current.set(pending);
    pending = null;
    generation++;
    render();
    stepButton.textContent = 'Einzelschritt · Änderungen zeigen';
    status.textContent = `Generation ${generation}. Schwarz: lebendig. Weiß: tot.`;
    return;
  }
  const before = model.current.slice();
  model.step();
  pending = model.current.slice();
  model.current.set(before);
  let born = 0, dies = 0, survives = 0;
  cells.forEach((cell, index) => {
    let state = '';
    if (before[index] && !pending[index]) { state = 'dies'; dies++; }
    else if (!before[index] && pending[index]) { state = 'born'; born++; }
    else if (before[index] && pending[index]) { state = 'survives'; survives++; }
    cell.className = `cell ${state}`;
  });
  stepButton.textContent = 'Einzelschritt · Neue Generation zeigen';
  const summary = `${dies} sterben (rot), ${born} entstehen (grün), ${survives} bleiben lebendig (blau).`;
  board.setAttribute('aria-label', `Änderungen von Generation ${generation} zu ${generation + 1}: ${summary}`);
  status.textContent = `Vorschau auf Generation ${generation + 1}: ${summary}`;
}
function resetIntro() {
  pending = null;
  generation = 0;
  for (let i = 0; i < model.current.length; i++) model.current[i] = Math.random() < 0.5 ? 1 : 0;
  model.next.fill(0);
  render();
  stepButton.textContent = 'Einzelschritt · Änderungen zeigen';
  status.textContent = 'Generation 0 · Zufälliges Startfeld. Schwarz: lebendig. Weiß: tot.';
}
stepButton.addEventListener('click', singleStep);
document.getElementById('reset').addEventListener('click', resetIntro);
resetIntro();
