'use strict';

const get = id => document.getElementById(id);
const format = value => value.toLocaleString('de-DE', { maximumFractionDigits: 2 });
let stage = 1;

function showStage(next, buttonId) {
  stage = next;
  const target = get(`step-${next}`);
  target.hidden = false;
  const button = get(buttonId);
  button.setAttribute('aria-expanded', 'true');
  button.hidden = true;
  target.querySelector('p').after(get('plot-shell'), get('plot-description'));
  render();
  if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([target]).catch(() => {});
  target.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

get('show-amplitude').addEventListener('click', () => showStage(2, 'show-amplitude'));
get('show-omega').addEventListener('click', () => showStage(3, 'show-omega'));
get('show-period').addEventListener('click', () => showStage(4, 'show-period'));
get('show-phase').addEventListener('click', () => showStage(5, 'show-phase'));
get('amplitude').addEventListener('input', render);
get('omega').addEventListener('input', render);
get('phase').addEventListener('input', render);

function render() {
  const amplitude = stage >= 2 ? Number(get('amplitude').value) : 1;
  const omegaFactor = Number(get('omega').value);
  const omega = stage >= 3 ? omegaFactor * Math.PI : 1;
  const phase = stage >= 5 ? Number(get('phase').value) : 0;
  const timeAxis = stage >= 3;
  const domain = timeAxis ? Math.max(12, 1.3 * (5 * Math.PI / 2) / omega) : 4 * Math.PI;
  const left = 92, right = 784, top = 43, bottom = 319, middle = (top + bottom) / 2;
  const scale = 51;
  const px = x => left + (x / domain) * (right - left);
  const py = y => middle - y * scale;
  let svg = '<title id="plot-title">Sinuskurve mit einstellbarer Amplitude und Kreisfrequenz</title><desc id="plot-desc">Die Kurve, die Achsen und gegebenenfalls die Schwingungsdauer werden aus den Reglerwerten gezeichnet.</desc><rect width="820" height="430" fill="white"/>';

  for (const y of [-2, -1, 0, 1, 2]) {
    svg += `<path d="M${left} ${py(y)}H${right}" stroke="${y === 0 ? '#344653' : '#e0e6eb'}" stroke-width="${y === 0 ? '2' : '1'}"/><text x="${left - 10}" y="${py(y) + 5}" text-anchor="end" fill="#344653" font-size="15">${y}</text>`;
  }
  const ticks = timeAxis ? Array.from({ length: 7 }, (_, i) => ({ x: i * domain / 6, label: format(i * domain / 6) })) : [
    { x: 0, label: '0' }, { x: Math.PI / 2, label: 'π/2' }, { x: Math.PI, label: 'π' },
    { x: 3 * Math.PI / 2, label: '3π/2' }, { x: 2 * Math.PI, label: '2π' },
    { x: 5 * Math.PI / 2, label: '5π/2' }, { x: 3 * Math.PI, label: '3π' },
    { x: 7 * Math.PI / 2, label: '7π/2' }, { x: 4 * Math.PI, label: '4π' }
  ];
  for (const tick of ticks) {
    const x = px(tick.x);
    svg += `<path d="M${x} ${top}V${bottom}" stroke="#e0e6eb"/><text x="${x}" y="${bottom + 24}" text-anchor="middle" fill="#344653" font-size="14">${tick.label}</text>`;
  }
  svg += `<path d="M${left} ${bottom}V${top} M${left} ${middle}H${right}" fill="none" stroke="#344653" stroke-width="2"/><text x="${(left + right) / 2}" y="415" text-anchor="middle" fill="#344653" font-size="17">${timeAxis ? 'Zeit t / s' : 'Winkel x / rad'}</text><text transform="translate(26 ${middle}) rotate(-90)" text-anchor="middle" fill="#344653" font-size="17">${timeAxis ? 'Auslenkung y' : 'sin(x)'}</text>`;
  let path = '';
  for (let i = 0; i <= 600; i++) {
    const x = (i / 600) * domain;
    path += `${i ? 'L' : 'M'}${px(x).toFixed(2)} ${py(amplitude * Math.sin(omega * x + phase)).toFixed(2)} `;
  }
  if (stage >= 5) {
    let reference = '';
    for (let i = 0; i <= 600; i++) {
      const x = (i / 600) * domain;
      reference += `${i ? 'L' : 'M'}${px(x).toFixed(2)} ${py(amplitude * Math.sin(omega * x)).toFixed(2)} `;
    }
    svg += `<path d="${reference}" fill="none" stroke="#8899a5" stroke-width="2" stroke-dasharray="7 6"/>`;
  }
  svg += `<path d="${path}" fill="none" stroke="#276f90" stroke-width="3"/>`;
  if (stage >= 2) {
    const peakAngle = 5 * Math.PI / 2;
    let peakX = timeAxis ? (peakAngle - phase) / omega : peakAngle;
    if (peakX > domain) peakX -= 2 * Math.PI / omega;
    svg += `<path d="M${px(peakX)} ${middle}V${py(amplitude)}" stroke="#b45e35" stroke-width="2"/><text x="${px(peakX) + 9}" y="${(middle + py(amplitude)) / 2}" fill="#9a4d28" font-size="18" font-weight="700">A</text>`;
  }
  if (stage >= 4) {
    const period = 2 * Math.PI / omega;
    const y = 379;
    svg += `<path d="M${px(0)} ${y}H${px(period)} M${px(0)} ${y - 7}V${y + 7} M${px(period)} ${y - 7}V${y + 7}" stroke="#9a4d28" stroke-width="2"/><text x="${(px(0) + px(period)) / 2}" y="${y - 7}" text-anchor="middle" fill="#9a4d28" font-size="17" font-weight="700">T</text>`;
    get('period-readout').textContent = `T = ${format(period)} s · f = ${format(1 / period)} Hz. Eine Schwingung braucht ${format(period)} Sekunden.`;
  }
  get('sinus-plot').innerHTML = svg;
  get('amplitude-value').textContent = format(amplitude);
  get('omega-value').textContent = format(omegaFactor);
  get('phase-value').textContent = format(phase);
  if (stage >= 5) {
    const shift = phase > 0 ? `${format(phase / omega)} s nach links` : phase < 0 ? `${format(-phase / omega)} s nach rechts` : '0 s';
    get('phase-readout').textContent = `Bei t = 0 gilt y(0) = ${format(amplitude * Math.sin(phase))}. Die Kurve ist um ${shift} verschoben. T bleibt ${format(2 * Math.PI / omega)} s.`;
  }
  get('plot-description').textContent = timeAxis
    ? `A = ${format(amplitude)}; ω = ${format(omegaFactor)}π/s.${stage >= 5 ? ` Anfangsphase φ₀ = ${format(phase)} rad; gestrichelt: φ₀ = 0.` : ' Die waagerechte Achse zeigt jetzt Sekunden.'}`
    : stage === 2
      ? `A = ${format(amplitude)}. Die Hochpunkte liegen bei +${format(amplitude)}, die Tiefpunkte bei −${format(amplitude)}. Die Periode bleibt 2π rad.`
      : 'Die Kurve liegt zwischen −1 und +1. Bei x = 0 beginnt sie bei 0 und steigt an.';
}

render();
