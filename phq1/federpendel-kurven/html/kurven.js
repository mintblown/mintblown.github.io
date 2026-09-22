const plots = [
  { kind: 'y', svg: document.querySelector('#y-plot'), amplitude: document.querySelector('#y-amplitude'), period: document.querySelector('#y-period'), phase: null, max: .1, label: 'Ort y / cm' },
  { kind: 'v', svg: document.querySelector('#v-plot'), amplitude: document.querySelector('#v-amplitude'), period: document.querySelector('#v-period'), phase: document.querySelector('#v-phase'), max: .8, label: 'Geschwindigkeit vᵧ / (m/s)' }
];
const frame = { left: 108, right: 778, top: 33, bottom: 405 };
const endTime = 2.7;
const xFor = time => frame.left + time / endTime * (frame.right - frame.left);
const yFor = (value, max) => (frame.top + frame.bottom) / 2 - value / max * (frame.bottom - frame.top) / 2;
const fmt = (value, digits) => value.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

function drawGraph(config) {
  const amplitude = Number(config.amplitude.value);
  const period = Number(config.period.value);
  const phase = config.phase ? Number(config.phase.value) * Math.PI : 0;
  const vertical = Array.from({ length: 7 }, (_, index) => {
    const time = index * .45;
    const x = xFor(time);
    return `<line class="fit-grid" x1="${x}" y1="${frame.top}" x2="${x}" y2="${frame.bottom}"/><line class="fit-tick" x1="${x}" y1="${frame.bottom}" x2="${x}" y2="${frame.bottom + 7}"/><text class="fit-tick-label" x="${x}" y="${frame.bottom + 30}" text-anchor="middle">${fmt(time, 2)}</text>`;
  }).join('');
  const horizontal = Array.from({ length: 5 }, (_, index) => {
    const value = (2 - index) * config.max / 2;
    const y = yFor(value, config.max);
    const label = config.kind === 'y' ? fmt(value * 100, 0) : fmt(value, 1);
    return `<line class="fit-grid" x1="${frame.left}" y1="${y}" x2="${frame.right}" y2="${y}"/><line class="fit-tick" x1="${frame.left - 7}" y1="${y}" x2="${frame.left}" y2="${y}"/><text class="fit-tick-label" x="${frame.left - 16}" y="${y + 6}" text-anchor="end">${label}</text>`;
  }).join('');
  const measurements = messwerte.filter(row => row[config.kind === 'y' ? 1 : 2] !== null).map(row => {
    const x = xFor(row[0]);
    const y = yFor(row[config.kind === 'y' ? 1 : 2], config.max);
    return `<circle class="fit-measurement" cx="${x}" cy="${y}" r="3.7"/>`;
  }).join('');
  const model = Array.from({ length: 271 }, (_, index) => {
    const time = index / 100;
    const value = (config.kind === 'y' ? amplitude / 100 : amplitude) * Math.sin(2 * Math.PI * time / period + phase);
    return `${index ? 'L' : 'M'}${xFor(time).toFixed(2)} ${yFor(value, config.max).toFixed(2)}`;
  }).join(' ');
  config.svg.innerHTML = `<rect width="820" height="480" fill="white"/>${vertical}${horizontal}<path class="fit-axis" d="M${frame.left} ${frame.bottom} L798 ${frame.bottom} M${frame.left} ${frame.bottom} L${frame.left} 15 M798 ${frame.bottom} l-12 -7 m12 7 -12 7 M${frame.left} 15 l-7 12 m7 -12 7 12"/><text class="fit-axis-label" x="443" y="471" text-anchor="middle">Zeit t / s</text><text class="fit-axis-label" x="25" y="216" text-anchor="middle" transform="rotate(-90 25 216)">${config.label}</text><path class="fit-model" d="${model}"/>${measurements}`;
  document.querySelector(`#${config.kind}-amplitude-output`).textContent = config.kind === 'y' ? `${fmt(amplitude, 1)} cm` : `${fmt(amplitude, 2)} m/s`;
  document.querySelector(`#${config.kind}-period-output`).textContent = `${fmt(period, 2)} s`;
  if (config.phase) document.querySelector('#v-phase-output').textContent = `${fmt(Number(config.phase.value), 2)} π`;
}

for (const config of plots) {
  for (const input of [config.amplitude, config.period, config.phase].filter(Boolean)) input.addEventListener('input', () => drawGraph(config));
  drawGraph(config);
}

document.querySelector('.comparison-answer').addEventListener('toggle', event => {
  if (event.target.open && window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
    window.MathJax.typesetPromise([event.target]).catch(() => {});
  }
});
