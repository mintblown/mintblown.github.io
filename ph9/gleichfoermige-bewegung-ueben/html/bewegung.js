const svg = document.querySelector('#motion-plot');
const form = document.querySelector('#motion-form');
const situation = document.querySelector('#situation-text');
const distanceQuestion = document.querySelector('#distance-question');
const speedQuestion = document.querySelector('#speed-question');
const accelerationQuestion = document.querySelector('#acceleration-question');
const pointList = document.querySelector('#point-list');
const status = document.querySelector('#motion-status');
const solution = document.querySelector('#motion-solution');
const solutionCopy = document.querySelector('#solution-copy');
const inputs = {
  distance: document.querySelector('#distance-input'),
  speed: document.querySelector('#speed-input'),
  acceleration: document.querySelector('#acceleration-input')
};
const feedback = {
  distance: document.querySelector('#distance-feedback'),
  speed: document.querySelector('#speed-feedback'),
  acceleration: document.querySelector('#acceleration-feedback')
};

const frame = { left: 118, right: 754, top: 45, bottom: 500 };
let task;
let ownPoints = [];
let dragging = -1;
let solved = false;

function randomItem(values) { return values[Math.floor(Math.random() * values.length)]; }

function makeTask() {
  const speed = randomItem([1, 2, 3, 4]);
  const step = randomItem([1, 2]);
  const times = [0, step, 2 * step, 3 * step];
  const maxTime = times[3];
  return {
    speed,
    times,
    distanceTime: randomItem(times.slice(1)),
    maxTime,
    maxDistance: speed * maxTime,
    points: times.map(time => ({ x: time, y: speed * time }))
  };
}

function niceMaximum(value) {
  if (value <= 12) return 12;
  if (value <= 18) return 18;
  return 24;
}

function xFor(value) { return frame.left + value / task.maxTime * (frame.right - frame.left); }
function yFor(value) { return frame.bottom - value / niceMaximum(task.maxDistance) * (frame.bottom - frame.top); }

function graphMarkup() {
  const yMax = niceMaximum(task.maxDistance);
  const vertical = task.times.map(value => {
    const x = xFor(value);
    return `<line class="motion-grid" x1="${x}" y1="${frame.top}" x2="${x}" y2="${frame.bottom}"/><line class="motion-tick" x1="${x}" y1="${frame.bottom}" x2="${x}" y2="${frame.bottom + 8}"/><text class="motion-tick-label" x="${x}" y="${frame.bottom + 32}" text-anchor="middle">${value}</text>`;
  }).join('');
  const horizontal = Array.from({ length: 7 }, (_, index) => {
    const value = index * yMax / 6;
    const y = yFor(value);
    return `<line class="motion-grid" x1="${frame.left}" y1="${y}" x2="${frame.right}" y2="${y}"/><line class="motion-tick" x1="${frame.left - 8}" y1="${y}" x2="${frame.left}" y2="${y}"/><text class="motion-tick-label" x="${frame.left - 17}" y="${y + 6}" text-anchor="end">${value}</text>`;
  }).join('');
  return `<rect width="820" height="590" fill="#fff"/>${vertical}${horizontal}<path class="motion-axis" d="M${frame.left} ${frame.bottom} L780 ${frame.bottom} M${frame.left} ${frame.bottom} L${frame.left} 18 M780 ${frame.bottom} l-14 -8 m14 8 -14 8 M${frame.left} 18 l-8 14 m8 -14 8 14"/><text class="motion-axis-label" x="436" y="572" text-anchor="middle">Zeit t / s</text><text class="motion-axis-label" x="35" y="273" text-anchor="middle" transform="rotate(-90 35 273)">Weg s / m</text><g class="motion-solution-line"></g><g class="motion-answer-points"></g><g class="motion-own-points"></g>`;
}

function draw() {
  svg.innerHTML = graphMarkup();
  svg.querySelector('.motion-own-points').innerHTML = ownPoints.map(point => `<circle class="motion-own-dot" cx="${xFor(point.x)}" cy="${yFor(point.y)}" r="8"/>`).join('');
  if (solved) {
    const first = task.points[0];
    const last = task.points[task.points.length - 1];
    svg.querySelector('.motion-solution-line').innerHTML = `<path class="motion-answer-line" d="M${xFor(first.x)} ${yFor(first.y)} L${xFor(last.x)} ${yFor(last.y)}"/>`;
    svg.querySelector('.motion-answer-points').innerHTML = task.points.map(point => `<circle class="motion-answer-ring" cx="${xFor(point.x)}" cy="${yFor(point.y)}" r="15"/>`).join('');
  }
  status.textContent = solved ? 'Deine Punkte und die Musterlösung sind eingezeichnet.' : ownPoints.length === 4 ? 'Vier Punkte gesetzt. Du kannst sie noch verschieben.' : `${ownPoints.length} von 4 Punkten gesetzt.`;
}

function positionFromPointer(event) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const local = point.matrixTransform(svg.getScreenCTM().inverse());
  return {
    x: Math.max(0, Math.min(task.maxTime, (local.x - frame.left) / (frame.right - frame.left) * task.maxTime)),
    y: Math.max(0, Math.min(niceMaximum(task.maxDistance), (frame.bottom - local.y) / (frame.bottom - frame.top) * niceMaximum(task.maxDistance)))
  };
}

svg.addEventListener('pointerdown', event => {
  if (solved || (event.pointerType === 'mouse' && event.button !== 0)) return;
  const point = positionFromPointer(event);
  const nearest = ownPoints.reduce((best, item, index) => {
    const distance = Math.hypot((item.x - point.x) / task.maxTime, (item.y - point.y) / niceMaximum(task.maxDistance));
    return distance < best.distance ? { index, distance } : best;
  }, { index: -1, distance: Infinity });
  if (nearest.distance < .045) dragging = nearest.index;
  else if (ownPoints.length < 4) { ownPoints.push(point); dragging = ownPoints.length - 1; }
  else return;
  ownPoints[dragging] = point;
  svg.setPointerCapture(event.pointerId);
  draw();
});
svg.addEventListener('pointermove', event => {
  if (dragging < 0 || !svg.hasPointerCapture(event.pointerId)) return;
  ownPoints[dragging] = positionFromPointer(event);
  draw();
});
svg.addEventListener('pointerup', () => { dragging = -1; });
svg.addEventListener('pointercancel', () => { dragging = -1; });

function readNumber(input) { return Number(input.value.trim().replace(',', '.')); }
function showFeedback(name, expected) {
  const value = readNumber(inputs[name]);
  const correct = inputs[name].value.trim() !== '' && Math.abs(value - expected) < .01;
  feedback[name].textContent = `${correct ? '✓ Richtig.' : 'Musterlösung:'} ${expected.toLocaleString('de-DE')}${name === 'distance' ? ' m' : name === 'speed' ? ' m/s' : ' m/s²'}`;
  feedback[name].className = `answer-feedback ${correct ? 'is-correct' : 'is-correction'}`;
}

function countPointMatches() {
  const used = Array(task.points.length).fill(false);
  return ownPoints.reduce((count, own) => {
    let best = -1;
    let distance = Infinity;
    task.points.forEach((answer, index) => {
      const d = Math.hypot((own.x - answer.x) / task.maxTime, (own.y - answer.y) / niceMaximum(task.maxDistance));
      if (!used[index] && d < distance) { best = index; distance = d; }
    });
    if (best >= 0 && distance < .055) { used[best] = true; return count + 1; }
    return count;
  }, 0);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (solved) return;
  const distance = task.speed * task.distanceTime;
  showFeedback('distance', distance);
  showFeedback('speed', task.speed);
  showFeedback('acceleration', 0);
  const matches = countPointMatches();
  solved = true;
  draw();
  solutionCopy.innerHTML = String.raw`<p><strong>Weg:</strong> \(s=v\cdot t=${task.speed}\,\mathrm{m/s}\cdot ${task.distanceTime}\,\mathrm{s}=${distance}\,\mathrm{m}\)</p><p><strong>Geschwindigkeit:</strong> \(v=s/t=${task.maxDistance}\,\mathrm{m}/${task.maxTime}\,\mathrm{s}=${task.speed}\,\mathrm{m/s}\)</p><p><strong>Beschleunigung:</strong> Die Geschwindigkeit ändert sich nicht. Deshalb ist \(\Delta v=0\) und \(a=0\,\mathrm{m/s^2}\).</p><p><strong>Diagramm:</strong> ${matches} von 4 Messpunkten wurden getroffen. Die orangefarbenen Ringe und die Gerade zeigen die Musterlösung.</p>`;
  Object.values(inputs).forEach(input => { input.disabled = true; });
  solution.hidden = false;
  if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') window.MathJax.typesetPromise([solution]).catch(() => {});
  solution.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

document.querySelector('#clear-motion-points').addEventListener('click', () => {
  if (solved) return;
  ownPoints = [];
  draw();
});

function startRound() {
  task = makeTask();
  ownPoints = [];
  dragging = -1;
  solved = false;
  Object.values(inputs).forEach(input => { input.value = ''; input.disabled = false; });
  Object.values(feedback).forEach(item => { item.textContent = ''; item.className = 'answer-feedback'; });
  situation.textContent = `Ein Fahrrad bewegt sich gleichförmig mit ${task.speed} m/s. Es startet bei s = 0 m.`;
  distanceQuestion.textContent = `Welchen Weg legt es in ${task.distanceTime} s zurück?`;
  speedQuestion.textContent = `Es legt ${task.maxDistance} m in ${task.maxTime} s zurück. Wie groß ist v?`;
  accelerationQuestion.textContent = 'Wie groß ist die Beschleunigung während der gleichförmigen Fahrt?';
  pointList.textContent = task.points.map(point => `(${point.x} s | ${point.y} m)`).join('  ·  ');
  solution.hidden = true;
  solutionCopy.replaceChildren();
  draw();
}

document.querySelector('#new-motion').addEventListener('click', startRound);
startRound();
