const front = document.querySelector('#practice-plot');
const back = document.querySelector('#solution-plot');
const card = document.querySelector('#flip-card');
const list = document.querySelector('#point-list');
const evaluation = document.querySelector('#evaluation');
const solve = document.querySelector('#solve-button');
const retry = document.querySelector('#retry-button');
const clear = document.querySelector('#clear-button');
const newButton = document.querySelector('#new-button');
const status = document.querySelector('#exercise-status');

const plot = { left: 200, right: 560, top: 46, bottom: 406 };
const xFor = x => plot.left + x * 36;
const yFor = y => plot.bottom - y * 36;
let answers = [];
let points = [];
let dragging = -1;

function graphMarkup() {
  const ticks = Array.from({ length: 11 }, (_, n) => {
    const x = xFor(n);
    const y = yFor(n);
    return `<line class="grid-line" x1="${x}" y1="${plot.top}" x2="${x}" y2="${plot.bottom}"/><line class="grid-line" x1="${plot.left}" y1="${y}" x2="${plot.right}" y2="${y}"/><line class="tick" x1="${x}" y1="${plot.bottom}" x2="${x}" y2="${plot.bottom + 7}"/><line class="tick" x1="${plot.left - 7}" y1="${y}" x2="${plot.left}" y2="${y}"/><text class="tick-label" x="${x}" y="${plot.bottom + 28}" text-anchor="middle">${n}</text>${n ? `<text class="tick-label" x="${plot.left - 17}" y="${y + 6}" text-anchor="end">${n}</text>` : ''}`;
  }).join('');
  return `<rect width="760" height="510" fill="#fff"/>${ticks}<path class="axis" d="M200 406 L586 406 M200 406 L200 25 M586 406 l-12 -7 m12 7 -12 7 M200 25 l-7 12 m7 -12 7 12"/><text class="axis-label" x="380" y="481" text-anchor="middle">x</text><text class="axis-label" x="155" y="224" text-anchor="middle" transform="rotate(-90 155 224)">y</text><g class="solution-points"></g><g class="own-points"></g>`;
}

front.innerHTML = graphMarkup();
back.innerHTML = graphMarkup();

function draw() {
  const own = points.map(p => `<circle class="own-dot" cx="${xFor(p.x)}" cy="${yFor(p.y)}" r="7"/>`).join('');
  front.querySelector('.own-points').innerHTML = own;
  back.querySelector('.own-points').innerHTML = own;
  back.querySelector('.solution-points').innerHTML = answers.map(p => `<circle class="answer-ring" cx="${xFor(p.x)}" cy="${yFor(p.y)}" r="14"/>`).join('');
  solve.disabled = points.length !== 5;
  if (!card.classList.contains('is-flipped')) {
    status.textContent = points.length === 5 ? 'Fünf Punkte gesetzt. Du kannst sie verschieben oder die Lösung ansehen.' : `${points.length} von 5 Punkten gesetzt.`;
  }
}

function generatePoints() {
  const candidates = [];
  for (let x = 0; x <= 10; x++) for (let y = 0; y <= 10; y++) candidates.push({ x, y });
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const chosen = [];
  for (const candidate of candidates) {
    if (chosen.every(p => (p.x - candidate.x) ** 2 + (p.y - candidate.y) ** 2 >= 4)) chosen.push(candidate);
    if (chosen.length === 5) break;
  }
  return chosen;
}

function setFace(flipped) {
  card.classList.toggle('is-flipped', flipped);
  card.querySelector('.flip-front').setAttribute('aria-hidden', String(flipped));
  card.querySelector('.flip-back').setAttribute('aria-hidden', String(!flipped));
  solve.hidden = flipped;
  retry.hidden = !flipped;
  clear.hidden = flipped;
}

function startRound(newSet) {
  if (newSet) {
    const previous = answers.map(p => `${p.x},${p.y}`).sort().join(';');
    do { answers = generatePoints(); }
    while (answers.map(p => `${p.x},${p.y}`).sort().join(';') === previous);
  }
  points = [];
  dragging = -1;
  evaluation.replaceChildren();
  list.textContent = answers.map(p => `(${p.x}|${p.y})`).join('  ·  ');
  setFace(false);
  draw();
}

function pointerPosition(event) {
  const point = front.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const location = point.matrixTransform(front.getScreenCTM().inverse());
  return {
    x: Math.max(0, Math.min(10, (location.x - plot.left) / 36)),
    y: Math.max(0, Math.min(10, (plot.bottom - location.y) / 36))
  };
}

front.addEventListener('pointerdown', event => {
  if (card.classList.contains('is-flipped') || (event.pointerType === 'mouse' && event.button !== 0)) return;
  const point = pointerPosition(event);
  const nearest = points.reduce((best, p, i) => {
    const distance = Math.hypot(p.x - point.x, p.y - point.y);
    return distance < best.distance ? { index: i, distance } : best;
  }, { index: -1, distance: Infinity });
  if (nearest.distance <= 0.6) dragging = nearest.index;
  else if (points.length < 5) { points.push(point); dragging = points.length - 1; }
  else return;
  points[dragging] = point;
  front.setPointerCapture(event.pointerId);
  draw();
});

front.addEventListener('pointermove', event => {
  if (dragging < 0 || !front.hasPointerCapture(event.pointerId)) return;
  points[dragging] = pointerPosition(event);
  draw();
});

front.addEventListener('pointerup', () => { dragging = -1; });
front.addEventListener('pointercancel', () => { dragging = -1; });

function countMatches() {
  // Each target may match only one mark; search all assignments so order does not matter.
  const used = Array(answers.length).fill(false);
  function bestFrom(index) {
    if (index === points.length) return 0;
    let best = bestFrom(index + 1);
    for (let i = 0; i < answers.length; i++) {
      if (used[i] || Math.hypot(points[index].x - answers[i].x, points[index].y - answers[i].y) > 0.8) continue;
      used[i] = true;
      best = Math.max(best, 1 + bestFrom(index + 1));
      used[i] = false;
    }
    return best;
  }
  return bestFrom(0);
}

solve.addEventListener('click', () => {
  if (points.length !== 5) return;
  const matches = countMatches();
  const title = document.createElement('h4');
  title.textContent = matches === 5 ? 'Super!' : matches >= 3 ? 'Gut!' : 'Nochmal üben!';
  const result = document.createElement('p');
  result.textContent = `${matches} von 5 Punkten richtig getroffen.`;
  evaluation.replaceChildren(title, result);
  if (matches < 3) {
    const tip = document.createElement('p');
    tip.textContent = 'Tipp: Suche zuerst x auf der waagerechten Achse. Gehe von dort senkrecht zu y auf der linken Achse.';
    evaluation.append(tip);
  }
  setFace(true);
  status.textContent = `${title.textContent} ${result.textContent}`;
});

retry.addEventListener('click', () => startRound(false));
clear.addEventListener('click', () => { points = []; draw(); });
newButton.addEventListener('click', () => startRound(true));
startRound(true);
