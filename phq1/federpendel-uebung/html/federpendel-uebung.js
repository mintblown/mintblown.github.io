const front = document.querySelector('#practice-plot');
const back = document.querySelector('#solution-plot');
const card = document.querySelector('#osc-card');
const amplitudeTool = document.querySelector('#amplitude-tool');
const periodTool = document.querySelector('#period-tool');
const tools = document.querySelector('#mark-tools');
const inputWrap = document.querySelector('#osc-input');
const tInput = document.querySelector('#t-input');
const dInput = document.querySelector('#d-input');
const evaluation = document.querySelector('#osc-evaluation');
const solve = document.querySelector('#solve-button');
const retry = document.querySelector('#retry-button');
const clear = document.querySelector('#clear-button');
const newButton = document.querySelector('#new-button');
const status = document.querySelector('#osc-status');

const graph = { left: 118, right: 778, top: 90, bottom: 450, middle: 270 };
const xFor = time => graph.left + time * 110;
const yFor = displacement => graph.middle - displacement * 18;
const format = (value, digits = 2) => value.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
let amplitude;
let period;
let amplitudeMark = null;
let periodMarks = [];
let mode = 'amplitude';
let dragging = null;

function graphMarkup() {
  const timeGrid = Array.from({ length: 13 }, (_, i) => {
    const t = i * 0.5;
    const x = xFor(t);
    return `<line class="osc-grid" x1="${x}" y1="${graph.top}" x2="${x}" y2="${graph.bottom}"/><line class="osc-tick" x1="${x}" y1="${graph.middle}" x2="${x}" y2="${graph.middle + 7}"/>${i % 2 === 0 ? `<text class="osc-tick-label" x="${x}" y="${graph.middle + 29}" text-anchor="middle">${t}</text>` : ''}`;
  }).join('');
  const displacementGrid = [-10, -5, 0, 5, 10].map(y => `<line class="osc-grid" x1="${graph.left}" y1="${yFor(y)}" x2="${graph.right}" y2="${yFor(y)}"/><line class="osc-tick" x1="${graph.left - 8}" y1="${yFor(y)}" x2="${graph.left}" y2="${yFor(y)}"/><text class="osc-tick-label" x="${graph.left - 18}" y="${yFor(y) + 6}" text-anchor="end">${y}</text>`).join('');
  return `<rect width="820" height="630" fill="#fff"/>${timeGrid}${displacementGrid}<path class="osc-axis" d="M118 470 L118 63 M118 270 L794 270 M118 63 l-7 13 m7 -13 7 13 M794 270 l-13 -7 m13 7 -13 7"/><text class="osc-axis-label" x="448" y="612" text-anchor="middle">Zeit t / s</text><text class="osc-axis-label" x="35" y="270" text-anchor="middle" transform="rotate(-90 35 270)">Auslenkung x / cm</text><g class="osc-signal"></g><g class="osc-own-marks"></g><g class="osc-answer-marks"></g>`;
}

front.innerHTML = graphMarkup();
back.innerHTML = graphMarkup();

function signalAt(t) { return amplitude * Math.sin(2 * Math.PI * t / period); }

function signalPath() {
  const samples = Array.from({ length: 241 }, (_, i) => {
    const t = i * 6 / 240;
    return `${i ? 'L' : 'M'}${xFor(t).toFixed(2)} ${yFor(signalAt(t)).toFixed(2)}`;
  });
  return `<path class="osc-curve" d="${samples.join(' ')}"/>`;
}

function ownMarkup() {
  let markup = '';
  if (amplitudeMark) {
    const x = xFor(amplitudeMark.t);
    const y = yFor(amplitudeMark.y);
    markup += `<path class="osc-own" d="M${x} ${graph.middle} L${x} ${y} M${x - 6} ${graph.middle} L${x + 6} ${graph.middle}"/><circle class="osc-marker" cx="${x}" cy="${y}" r="7"/><text class="osc-own-label" x="${x + 12}" y="${(graph.middle + y) / 2}">x̂</text>`;
  }
  for (const t of periodMarks) {
    const x = xFor(t);
    markup += `<path class="osc-own" d="M${x} 465 L${x} 508"/><circle class="osc-marker" cx="${x}" cy="${yFor(signalAt(t))}" r="7"/>`;
  }
  if (periodMarks.length === 2) {
    const left = xFor(Math.min(...periodMarks));
    const right = xFor(Math.max(...periodMarks));
    markup += `<path class="osc-own" d="M${left} 508 L${right} 508 M${left} 508 l9 -5 m-9 5 9 5 M${right} 508 l-9 -5 m9 5 -9 5"/><text class="osc-own-label" x="${(left + right) / 2}" y="530" text-anchor="middle">T</text>`;
  }
  return markup;
}

function answerMarkup() {
  const peak = yFor(amplitude);
  const firstPeak = xFor(period / 4);
  const secondPeak = xFor(5 * period / 4);
  return `<path class="osc-answer" d="M730 ${graph.middle} L730 ${peak} M730 ${graph.middle} l-6 -10 m6 10 6 -10 M730 ${peak} l-6 10 m6 -10 6 10"/><text class="osc-answer-label" x="746" y="${(graph.middle + peak) / 2}">x̂</text><path class="osc-answer" d="M${firstPeak} 546 L${secondPeak} 546 M${firstPeak} 546 l9 -5 m-9 5 9 5 M${secondPeak} 546 l-9 -5 m9 5 -9 5 M${firstPeak} 532 v18 M${secondPeak} 532 v18"/><text class="osc-answer-label" x="${(firstPeak + secondPeak) / 2}" y="568" text-anchor="middle">T</text>`;
}

function parsedNumber(input) {
  const raw = input.value.trim();
  if (!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(raw)) return null;
  const value = Number(raw.replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function render() {
  const curve = signalPath();
  const own = ownMarkup();
  for (const svg of [front, back]) {
    svg.querySelector('.osc-signal').innerHTML = curve;
    svg.querySelector('.osc-own-marks').innerHTML = own;
  }
  back.querySelector('.osc-answer-marks').innerHTML = card.classList.contains('is-flipped') ? answerMarkup() : '';
  solve.disabled = !amplitudeMark || periodMarks.length !== 2 || Math.abs(periodMarks[1] - periodMarks[0]) < 0.25 || parsedNumber(tInput) === null || parsedNumber(dInput) === null;
  if (!card.classList.contains('is-flipped')) {
    status.textContent = !amplitudeMark ? 'Markiere zuerst die Amplitude.' : periodMarks.length === 0 ? 'Markiere das erste Maximum oder Minimum.' : periodMarks.length === 1 ? 'Markiere das nächste gleichartige Maximum oder Minimum.' : parsedNumber(tInput) === null ? 'Trage die abgelesene Schwingungsdauer T ein.' : parsedNumber(dInput) === null ? 'Gib die berechnete Federkonstante D ein.' : 'Du kannst deine Markierungen prüfen oder auflösen.';
  }
}

function setMode(next) {
  mode = next;
  amplitudeTool.setAttribute('aria-pressed', String(next === 'amplitude'));
  periodTool.setAttribute('aria-pressed', String(next === 'period'));
}

function setFace(flipped) {
  card.classList.toggle('is-flipped', flipped);
  card.querySelector('.osc-front').setAttribute('aria-hidden', String(flipped));
  card.querySelector('.osc-back').setAttribute('aria-hidden', String(!flipped));
  tools.hidden = flipped;
  inputWrap.hidden = flipped;
  solve.hidden = flipped;
  retry.hidden = !flipped;
  clear.hidden = flipped;
}

function startRound(newValues) {
  if (newValues) {
    const previous = `${amplitude},${period}`;
    do {
      amplitude = 5 + Math.floor(Math.random() * 6);
      period = (5 + Math.floor(Math.random() * 11)) / 5;
    } while (`${amplitude},${period}` === previous);
  }
  amplitudeMark = null;
  periodMarks = [];
  dragging = null;
  tInput.value = '';
  dInput.value = '';
  evaluation.replaceChildren();
  setMode('amplitude');
  setFace(false);
  render();
}

function pointerPosition(event) {
  const point = front.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const location = point.matrixTransform(front.getScreenCTM().inverse());
  if (location.x < graph.left - 15 || location.x > graph.right + 15 || location.y < graph.top - 15 || location.y > graph.bottom + 15) return null;
  return {
    t: Math.max(0, Math.min(6, (location.x - graph.left) / 110)),
    y: Math.max(-10, Math.min(10, (graph.middle - location.y) / 18))
  };
}

front.addEventListener('pointerdown', event => {
  if (card.classList.contains('is-flipped') || (event.pointerType === 'mouse' && event.button !== 0)) return;
  const point = pointerPosition(event);
  if (!point) return;
  if (mode === 'amplitude') {
    amplitudeMark = point;
    dragging = 'amplitude';
  } else {
    const nearest = periodMarks.reduce((best, t, index) => {
      const distance = Math.abs(t - point.t);
      return distance < best.distance ? { index, distance } : best;
    }, { index: -1, distance: Infinity });
    if (nearest.distance < 0.17 || periodMarks.length === 2) dragging = nearest.index;
    else { periodMarks.push(point.t); dragging = periodMarks.length - 1; }
    periodMarks[dragging] = point.t;
  }
  front.setPointerCapture(event.pointerId);
  render();
});

front.addEventListener('pointermove', event => {
  if (dragging === null || !front.hasPointerCapture(event.pointerId)) return;
  const point = pointerPosition(event);
  if (!point) return;
  if (dragging === 'amplitude') amplitudeMark = point;
  else periodMarks[dragging] = point.t;
  render();
});

function stopDragging() {
  if (dragging === 'amplitude' && amplitudeMark) setMode('period');
  dragging = null;
  render();
}
front.addEventListener('pointerup', stopDragging);
front.addEventListener('pointercancel', stopDragging);

amplitudeTool.addEventListener('click', () => setMode('amplitude'));
periodTool.addEventListener('click', () => setMode('period'));
dInput.addEventListener('input', render);
tInput.addEventListener('input', render);

solve.addEventListener('click', () => {
  if (solve.disabled) return;
  const markedA = Math.abs(amplitudeMark.y);
  const markedT = Math.abs(periodMarks[1] - periodMarks[0]);
  const correctD = 4 * Math.PI ** 2 * 0.1 / period ** 2;
  const enteredT = parsedNumber(tInput);
  const enteredD = parsedNumber(dInput);
  const lines = [
    `Amplitude: markiert ${format(markedA, 1)} cm; Musterwert ${format(amplitude, 0)} cm.`,
    `Schwingungsdauer: markiert ${format(markedT, 2)} s, eingegeben ${format(enteredT, 2)} s; Musterwert ${format(period, 1)} s.`,
    `Federkonstante: eingegeben ${format(enteredD)} N/m; Musterwert ${format(correctD)} N/m.`,
    'Die Federkonstante wurde mit der Schwingungsdauer und der Masse 0,100 kg berechnet.'
  ];
  evaluation.replaceChildren(...lines.map(line => {
    const paragraph = document.createElement('p');
    paragraph.textContent = line;
    return paragraph;
  }));
  setFace(true);
  render();
  status.textContent = 'Deine Markierungen und die Musterlösung sind zu sehen.';
});

retry.addEventListener('click', () => startRound(false));
clear.addEventListener('click', () => { amplitudeMark = null; periodMarks = []; setMode('amplitude'); render(); });
newButton.addEventListener('click', () => startRound(true));
startRound(true);
