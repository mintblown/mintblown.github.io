const front = document.querySelector('#practice-plot');
const back = document.querySelector('#solution-plot');
const card = document.querySelector('#flip-card');
const solve = document.querySelector('#solve-button');
const retry = document.querySelector('#retry-button');
const clear = document.querySelector('#clear-button');
const status = document.querySelector('#exercise-status');

const plot = { left: 102, right: 672, top: 38, bottom: 406 };
const xFor = t => plot.left + (plot.right - plot.left) * t / 30;
const yFor = s => plot.bottom - (plot.bottom - plot.top) * s / 300;
const answers = [{ x: xFor(10), y: yFor(80) }, { x: xFor(20), y: yFor(170) }];
let points = [];
let dragging = -1;

function graphMarkup() {
  const vertical = Array.from({ length: 7 }, (_, i) => {
    const x = xFor(i * 5);
    return `<line class="grid-line" x1="${x}" y1="${plot.top}" x2="${x}" y2="${plot.bottom}"/><line class="tick" x1="${x}" y1="${plot.bottom}" x2="${x}" y2="${plot.bottom + 8}"/><text class="tick-label" x="${x}" y="${plot.bottom + 29}" text-anchor="middle">${i * 5}</text>`;
  }).join('');
  const horizontal = Array.from({ length: 7 }, (_, i) => {
    const y = yFor(i * 50);
    return `<line class="grid-line" x1="${plot.left}" y1="${y}" x2="${plot.right}" y2="${y}"/><line class="tick" x1="${plot.left - 8}" y1="${y}" x2="${plot.left}" y2="${y}"/><text class="tick-label" x="${plot.left - 15}" y="${y + 5}" text-anchor="end">${i * 50}</text>`;
  }).join('');
  return `<rect x="0" y="0" width="760" height="510" fill="#fff"/>${vertical}${horizontal}<path class="axis" d="M102 406 L686 406 M102 406 L102 25"/><path class="axis" d="M686 406 l-13 -7 m13 7 l-13 7 M102 25 l-7 13 m7 -13 l7 13"/><text class="axis-label" x="387" y="482" text-anchor="middle">Zeit t / s</text><text class="axis-label" x="33" y="223" text-anchor="middle" transform="rotate(-90 33 223)">Strecke s / m</text><g class="solution-points"></g><g class="own-points"></g>`;
}

front.innerHTML = graphMarkup();
back.innerHTML = graphMarkup();

function dot(point, type) {
  return `<circle class="${type}" cx="${point.x}" cy="${point.y}" r="7"/>`;
}

function render() {
  front.querySelector('.own-points').innerHTML = points.map(p => dot(p, 'own-dot')).join('');
  back.querySelector('.own-points').innerHTML = points.map(p => dot(p, 'own-dot')).join('');
  back.querySelector('.solution-points').innerHTML = answers.map(p => `<circle class="answer-ring" cx="${p.x}" cy="${p.y}" r="14"/>`).join('');
  solve.disabled = points.length < 2;
  status.textContent = points.length === 0 ? 'Setze den ersten Punkt.' : points.length === 1 ? 'Setze den zweiten Punkt.' : 'Zwei Punkte gesetzt. Du kannst sie verschieben oder die Lösung ansehen.';
}

function pointerPosition(event) {
  const point = front.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const position = point.matrixTransform(front.getScreenCTM().inverse());
  return {
    x: Math.max(plot.left, Math.min(plot.right, position.x)),
    y: Math.max(plot.top, Math.min(plot.bottom, position.y))
  };
}

front.addEventListener('pointerdown', event => {
  if (card.classList.contains('is-flipped')) return;
  const position = pointerPosition(event);
  if (points.length < 2) {
    points.push(position);
    dragging = points.length - 1;
  } else {
    const distances = points.map(p => Math.hypot(p.x - position.x, p.y - position.y));
    dragging = distances[0] <= distances[1] ? 0 : 1;
    if (distances[dragging] > 28) return;
    points[dragging] = position;
  }
  front.setPointerCapture(event.pointerId);
  render();
});

front.addEventListener('pointermove', event => {
  if (dragging < 0 || !front.hasPointerCapture(event.pointerId)) return;
  points[dragging] = pointerPosition(event);
  render();
});

function stopDragging() { dragging = -1; }
front.addEventListener('pointerup', stopDragging);
front.addEventListener('pointercancel', stopDragging);

solve.addEventListener('click', () => {
  if (points.length !== 2) return;
  card.classList.add('is-flipped');
  card.querySelector('.flip-front').setAttribute('aria-hidden', 'true');
  card.querySelector('.flip-back').removeAttribute('aria-hidden');
  solve.hidden = true;
  retry.hidden = false;
  clear.hidden = true;
  status.textContent = 'Musterlösung und deine beiden Punkte sind zu sehen.';
});

retry.addEventListener('click', () => {
  card.classList.remove('is-flipped');
  card.querySelector('.flip-front').removeAttribute('aria-hidden');
  card.querySelector('.flip-back').setAttribute('aria-hidden', 'true');
  points = [];
  solve.hidden = false;
  retry.hidden = true;
  clear.hidden = false;
  render();
});

clear.addEventListener('click', () => { points = []; render(); });
render();
