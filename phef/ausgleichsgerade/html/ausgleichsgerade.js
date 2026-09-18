const front = document.querySelector('#practice-plot');
const back = document.querySelector('#solution-plot');
const card = document.querySelector('#fit-card');
const solve = document.querySelector('#solve-button');
const retry = document.querySelector('#retry-button');
const clear = document.querySelector('#clear-button');
const newButton = document.querySelector('#new-button');
const status = document.querySelector('#fit-status');

const plot = { left: 136, right: 616, top: 40, bottom: 520 };
const xFor = x => plot.left + x * 48;
const yFor = y => plot.bottom - y * 48;
let sourceLine;
let measurements = [];
let handles = [];
let dragging = -1;

function graphMarkup() {
  const grid = Array.from({ length: 11 }, (_, n) => {
    const x = xFor(n);
    const y = yFor(n);
    return `<line class="fit-grid" x1="${x}" y1="${plot.top}" x2="${x}" y2="${plot.bottom}"/><line class="fit-grid" x1="${plot.left}" y1="${y}" x2="${plot.right}" y2="${y}"/><line class="fit-tick" x1="${x}" y1="${plot.bottom}" x2="${x}" y2="${plot.bottom + 8}"/><line class="fit-tick" x1="${plot.left - 8}" y1="${y}" x2="${plot.left}" y2="${y}"/><text class="fit-tick-label" x="${x}" y="${plot.bottom + 29}" text-anchor="middle">${n}</text>${n ? `<text class="fit-tick-label" x="${plot.left - 17}" y="${y + 6}" text-anchor="end">${n}</text>` : ''}`;
  }).join('');
  return `<rect width="760" height="600" fill="#fff"/>${grid}<path class="fit-axis" d="M136 520 L642 520 M136 520 L136 20 M642 520 l-13 -7 m13 7 -13 7 M136 20 l-7 13 m7 -13 7 13"/><text class="fit-axis-label" x="376" y="581" text-anchor="middle">x</text><text class="fit-axis-label" x="73" y="280" text-anchor="middle" transform="rotate(-90 73 280)">y</text><g class="own-line"></g><g class="source-line"></g><g class="measurements"></g><g class="handles"></g>`;
}

front.innerHTML = graphMarkup();
back.innerHTML = graphMarkup();

function generateMeasurements() {
  let yStart;
  let yEnd;
  do {
    yStart = 2 + Math.random() * 6;
    yEnd = 2 + Math.random() * 6;
  } while (Math.abs(yEnd - yStart) < 1.8);
  sourceLine = { start: { x: 0, y: yStart }, end: { x: 10, y: yEnd } };
  measurements = Array.from({ length: 10 }, (_, i) => {
    const x = i + 0.5;
    const y = yStart + (yEnd - yStart) * x / 10 + (Math.random() * 1.6 - 0.8);
    return { x, y };
  });
}

function clippedLine(first, second) {
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  if (Math.hypot(dx, dy) < 0.2) return '';
  let start = -Infinity;
  let end = Infinity;
  for (const [value, delta] of [[first.x, dx], [first.y, dy]]) {
    if (Math.abs(delta) < 1e-9) continue;
    const a = (0 - value) / delta;
    const b = (10 - value) / delta;
    start = Math.max(start, Math.min(a, b));
    end = Math.min(end, Math.max(a, b));
  }
  if (start > end) return '';
  return `M${xFor(first.x + start * dx)} ${yFor(first.y + start * dy)} L${xFor(first.x + end * dx)} ${yFor(first.y + end * dy)}`;
}

function draw() {
  const dots = measurements.map(p => `<circle class="fit-measurement" cx="${xFor(p.x)}" cy="${yFor(p.y)}" r="5.5"/>`).join('');
  const ownPath = handles.length === 2 ? clippedLine(handles[0], handles[1]) : '';
  const own = ownPath ? `<path class="fit-own-line" d="${ownPath}"/>` : '';
  for (const svg of [front, back]) {
    svg.querySelector('.measurements').innerHTML = dots;
    svg.querySelector('.own-line').innerHTML = own;
    svg.querySelector('.handles').innerHTML = handles.map(p => `<circle class="fit-handle" cx="${xFor(p.x)}" cy="${yFor(p.y)}" r="10"/>`).join('');
  }
  back.querySelector('.source-line').innerHTML = card.classList.contains('is-flipped') ? `<path class="fit-source-line" d="M${xFor(0)} ${yFor(sourceLine.start.y)} L${xFor(10)} ${yFor(sourceLine.end.y)}"/>` : '';
  solve.disabled = !ownPath;
  if (!card.classList.contains('is-flipped')) {
    status.textContent = handles.length === 0 ? 'Setze den ersten Punkt deiner Geraden.' : handles.length === 1 ? 'Setze den zweiten Punkt deiner Geraden.' : ownPath ? 'Verschiebe die Punkte bei Bedarf oder löse auf.' : 'Ziehe die Punkte etwas weiter auseinander.';
  }
}

function setFace(flipped) {
  card.classList.toggle('is-flipped', flipped);
  card.querySelector('.fit-front').setAttribute('aria-hidden', String(flipped));
  card.querySelector('.fit-back').setAttribute('aria-hidden', String(!flipped));
  solve.hidden = flipped;
  retry.hidden = !flipped;
  clear.hidden = flipped;
}

function startRound(newData) {
  if (newData) generateMeasurements();
  handles = [];
  dragging = -1;
  setFace(false);
  draw();
}

function pointerPosition(event) {
  const point = front.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const location = point.matrixTransform(front.getScreenCTM().inverse());
  if (location.x < plot.left - 15 || location.x > plot.right + 15 || location.y < plot.top - 15 || location.y > plot.bottom + 15) return null;
  return {
    x: Math.max(0, Math.min(10, (location.x - plot.left) / 48)),
    y: Math.max(0, Math.min(10, (plot.bottom - location.y) / 48))
  };
}

front.addEventListener('pointerdown', event => {
  if (card.classList.contains('is-flipped') || (event.pointerType === 'mouse' && event.button !== 0)) return;
  const point = pointerPosition(event);
  if (!point) return;
  const nearest = handles.reduce((best, p, index) => {
    const distance = Math.hypot(p.x - point.x, p.y - point.y);
    return distance < best.distance ? { index, distance } : best;
  }, { index: -1, distance: Infinity });
  if (nearest.distance <= 0.8) dragging = nearest.index;
  else if (handles.length < 2) { handles.push(point); dragging = handles.length - 1; }
  else return;
  handles[dragging] = point;
  front.setPointerCapture(event.pointerId);
  draw();
});

front.addEventListener('pointermove', event => {
  if (dragging < 0 || !front.hasPointerCapture(event.pointerId)) return;
  const point = pointerPosition(event);
  if (!point) return;
  handles[dragging] = point;
  draw();
});

front.addEventListener('pointerup', () => { dragging = -1; });
front.addEventListener('pointercancel', () => { dragging = -1; });

solve.addEventListener('click', () => {
  if (solve.disabled) return;
  setFace(true);
  draw();
  status.textContent = 'Deine Gerade und die Ausgangsgerade sind zu sehen.';
});

retry.addEventListener('click', () => startRound(false));
clear.addEventListener('click', () => { handles = []; draw(); });
newButton.addEventListener('click', () => startRound(true));
startRound(true);
