'use strict';

const byId = id => document.getElementById(id);
const svgNS = 'http://www.w3.org/2000/svg';
const format = (value, digits = 2) => value.toLocaleString('de-DE', { maximumFractionDigits: digits });

document.querySelectorAll('.reveal-answer').forEach(button => {
  button.addEventListener('click', () => {
    const answer = byId(button.getAttribute('aria-controls'));
    const open = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!open));
    answer.hidden = open;
    button.lastElementChild.textContent = open ? 'Erklärung anzeigen ↓' : 'Erklärung ausblenden ↑';
    if (!open && window.MathJax?.typesetPromise) window.MathJax.typesetPromise([answer]).catch(() => {});
  });
});

// Integrate one quarter-period of the nonlinear pendulum; mirror it for a full cycle.
const gravity = 9.81;
const length = 1;
const amplitude = Math.PI / 4;
const quarter = [{ t: 0, angle: amplitude }];
let angle = amplitude, angularVelocity = 0, elapsed = 0;
const step = .0005;
while (angle > 0) {
  const acceleration = value => -gravity / length * Math.sin(value);
  const k1a = angularVelocity, k1v = acceleration(angle);
  const k2a = angularVelocity + step * k1v / 2, k2v = acceleration(angle + step * k1a / 2);
  const k3a = angularVelocity + step * k2v / 2, k3v = acceleration(angle + step * k2a / 2);
  const k4a = angularVelocity + step * k3v, k4v = acceleration(angle + step * k3a);
  const previous = angle;
  angle += step / 6 * (k1a + 2 * k2a + 2 * k3a + k4a);
  angularVelocity += step / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
  elapsed += angle > 0 ? step : step * previous / (previous - angle);
  quarter.push({ t: elapsed, angle: Math.max(0, angle) });
}
const quarterPeriod = elapsed;

function pendulumState(fraction) {
  const phase = fraction * 4;
  const segment = Math.min(3, Math.floor(phase));
  const progress = phase - segment;
  const time = (segment % 2 ? 1 - progress : progress) * quarterPeriod;
  const index = Math.min(quarter.length - 2, Math.floor(time / step));
  const left = quarter[index], right = quarter[index + 1];
  const magnitude = left.angle + (right.angle - left.angle) * (time - left.t) / (right.t - left.t);
  const phi = (segment === 1 || segment === 2 ? -1 : 1) * magnitude;
  const height = length * (1 - Math.cos(phi));
  const maxHeight = length * (1 - Math.cos(amplitude));
  const speed = Math.sqrt(Math.max(0, 2 * gravity * (maxHeight - height)));
  return { phi, height, velocity: (segment < 2 ? -1 : 1) * speed, pot: height / maxHeight };
}

function renderEnergy() {
  const fraction = Number(byId('phase').value) / 1000;
  const { phi, height, velocity, pot } = pendulumState(fraction);
  const kin = 1 - pot;
  const pivotX = 400, pivotY = 42, radius = 225;
  const massX = pivotX + radius * Math.sin(phi);
  const massY = pivotY + radius * Math.cos(phi);
  const bottom = pivotY + radius;
  const direction = velocity > .001 ? 'nach rechts' : velocity < -.001 ? 'nach links' : 'kurz in Ruhe';
  const arrowX = massX + velocity * 30 * Math.cos(phi);
  const arrowY = massY - velocity * 30 * Math.sin(phi);
  byId('pendulum-model').innerHTML = `
    <title id="pendulum-title">Fadenpendel und Energie</title>
    <desc id="pendulum-desc">Ein Meter langes Fadenpendel mit 45 Grad maximaler Auslenkung. Aktueller Winkel: ${format(phi * 180 / Math.PI, 1)} Grad, Höhe: ${format(height)} Meter. Der Pfeil zeigt die tangentiale Geschwindigkeit.</desc>
    <rect width="800" height="360" fill="white"/>
    <path d="M350 35 H450" stroke="#273342" stroke-width="6"/>
    <path d="M400 42 V${bottom}" stroke="#8fa0ad" stroke-width="2" stroke-dasharray="7 7"/>
    <path d="M${400 - radius * Math.sin(amplitude)} ${pivotY + radius * Math.cos(amplitude)} A${radius} ${radius} 0 0 0 ${400 + radius * Math.sin(amplitude)} ${pivotY + radius * Math.cos(amplitude)}" stroke="#b9cce0" stroke-width="2" fill="none" stroke-dasharray="5 5"/>
    <path d="M210 ${bottom} H665 M${massX} ${massY} H650" stroke="#8fa0ad" stroke-width="1.5" stroke-dasharray="5 5"/>
    <path d="M640 ${massY} V${bottom} M634 ${massY} H646 M634 ${bottom} H646" stroke="#41698e" stroke-width="3" fill="none"/>
    <text x="659" y="${(massY + bottom) / 2 + 6}" fill="#41698e" font-family="Arial" font-size="20">h</text>
    <path d="M400 42 L${massX} ${massY}" stroke="#273342" stroke-width="4"/>
    <circle cx="400" cy="42" r="6" fill="#273342"/>
    <circle cx="${massX}" cy="${massY}" r="22" fill="#edf3fa" stroke="#273342" stroke-width="3"/>
    ${Math.abs(velocity) > .001 ? `<path d="M${massX} ${massY} L${arrowX} ${arrowY}" stroke="#bc7a4d" stroke-width="4" marker-end="url(#energy-arrow)"/>` : ''}
    <defs><marker id="energy-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#bc7a4d" stroke-width="2"/></marker></defs>
    <text x="400" y="310" text-anchor="middle" fill="#596778" font-family="Arial" font-size="18">Tiefster Punkt: h = 0 · Ruhelage</text>
    <text x="400" y="339" text-anchor="middle" fill="#596778" font-family="Arial" font-size="18">Fadenlänge: 1 m · Maximale Auslenkung: 45°</text>`;
  byId('bar-pot').style.width = `${pot * 100}%`;
  byId('bar-kin').style.width = `${kin * 100}%`;
  byId('pot-value').textContent = `${Math.round(pot * 100)} %`;
  byId('kin-value').textContent = `${Math.round(kin * 100)} %`;
  byId('phase').setAttribute('aria-valuetext', `${format(fraction * 100, 1)} % einer Schwingung`);
  byId('energy-readout').textContent = `Zeit: ${format(fraction * 4 * quarterPeriod)} s · Winkel: ${format(phi * 180 / Math.PI, 1)}° · Höhe: ${format(height)} m · Geschwindigkeit: ${format(Math.abs(velocity))} m/s · Bewegung: ${direction}. Die Energieanteile ergeben zusammen ${Math.round((pot + kin) * 100)} %.`;
}
byId('phase').addEventListener('input', renderEnergy);
renderEnergy();

function plotFrame(title, yLabel, timeMax = 10, yMax = 1, timeLabel = 'Zeit ω₀t') {
  let content = `<rect width="820" height="360" fill="white"/><text x="410" y="25" text-anchor="middle" font-family="Arial" font-weight="700" fill="#273342">${title}</text>`;
  for (let i = 0; i <= 4; i++) {
    const y = 55 + i * 62.5;
    content += `<path d="M82 ${y}H785" stroke="#e1e7ec"/><text x="68" y="${y + 5}" text-anchor="end" font-family="Arial" fill="#596778">${format(yMax * (1 - i * .5), 2)}</text>`;
  }
  for (let i = 0; i <= 5; i++) {
    const x = 82 + i * 140.6;
    content += `<path d="M${x} 55V305" stroke="#e1e7ec"/><text x="${x}" y="329" text-anchor="middle" font-family="Arial" fill="#596778">${format(i * timeMax / 5, 1)}</text>`;
  }
  content += `<path d="M82 45V305H798" stroke="#273342" stroke-width="2.5" fill="none"/><text x="440" y="350" text-anchor="middle" font-family="Arial" fill="#273342">${timeLabel}</text><text x="22" y="180" text-anchor="middle" transform="rotate(-90 22 180)" font-family="Arial" fill="#273342">${yLabel}</text>`;
  return content;
}

let damping = 0;
function drawDamping() {
  let path = '';
  for (let i = 0; i <= 500; i++) {
    const t = i / 50;
    const frequency = Math.sqrt(1 - damping ** 2);
    const value = Math.exp(-damping * t) * (Math.cos(frequency * t) + damping / frequency * Math.sin(frequency * t));
    const x = 82 + t / 10 * 703;
    const y = 180 - value * 125;
    path += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  byId('damping-plot').innerHTML = plotFrame('Fadenpendel mit Reibung', 'Winkel φ / φ₀') + `<path d="${path}" fill="none" stroke="#41698e" stroke-width="3"/>`;
  byId('damping-text').textContent = damping === 0 ? 'Ohne Reibung bleibt die Amplitude gleich.' : damping < .3 ? 'Mit wenig Reibung schwingt das Pendel weiter. Die Amplitude nimmt langsam ab.' : 'Mit viel Reibung nimmt die Amplitude schnell ab. In diesem einfachen Bild schwingt das Pendel trotzdem noch.';
}
document.querySelectorAll('[data-damping]').forEach(button => button.addEventListener('click', () => {
  damping = Number(button.dataset.damping);
  document.querySelectorAll('[data-damping]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  drawDamping();
}));
drawDamping();

function simulateDrive(ratio) {
  const dt = .01;
  const points = [];
  let x = .08, v = 0;
  for (let i = 0; i <= 4000; i++) {
    const t = i * dt;
    const force = .35 * Math.sin(ratio * t);
    const a = force - .14 * v - x;
    v += a * dt;
    x += v * dt;
    if (i % 8 === 0) points.push({ t, x });
  }
  return points;
}

let drivePoints = [];
let driveIndex = 0;
let driveRunning = false;
let driveAnimation = 0;
function drawDrive() {
  const ratio = Number(byId('drive-frequency').value) / 100;
  drivePoints = simulateDrive(ratio);
  const max = Math.max(1, ...drivePoints.map(point => Math.abs(point.x)));
  let path = '';
  drivePoints.forEach((point, i) => {
    const x = 82 + point.t / 40 * 703;
    const y = 180 - point.x / max * 120;
    path += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)} `;
  });
  byId('drive-plot').innerHTML = plotFrame('Fadenpendel mit äußerer Kraft', 'Winkel φ / φ₀', 40, max) + `<path d="${path}" fill="none" stroke="#41698e" stroke-width="3"/><line id="drive-marker" x1="82" x2="82" y1="55" y2="305" stroke="#bc7a4d" stroke-width="3"/>`;
  byId('drive-frequency-value').textContent = `${format(ratio)} · Eigenfrequenz`;
  const lateAmplitude = Math.max(...drivePoints.slice(-125).map(point => Math.abs(point.x)));
  byId('drive-status').textContent = `Im Modell beträgt die größte späte Winkelauslenkung etwa ${format(lateAmplitude)} · φ₀. ${Math.abs(ratio - 1) < .08 ? 'Der Takt liegt nahe an der Eigenfrequenz: Die Anregung wirkt besonders stark.' : 'Der Takt passt nicht genau zur Eigenfrequenz: Die Anregung wirkt schwächer.'}`;
}
function animateDrive() {
  if (!driveRunning) return;
  driveIndex = (driveIndex + 2) % drivePoints.length;
  const x = 82 + drivePoints[driveIndex].t / 40 * 703;
  const marker = byId('drive-marker');
  if (marker) { marker.setAttribute('x1', x); marker.setAttribute('x2', x); }
  driveAnimation = requestAnimationFrame(animateDrive);
}
byId('drive-frequency').addEventListener('input', () => { driveIndex = 0; drawDrive(); });
byId('drive-start').addEventListener('click', () => { if (!driveRunning) { driveRunning = true; animateDrive(); } });
byId('drive-pause').addEventListener('click', () => { driveRunning = false; cancelAnimationFrame(driveAnimation); });
byId('drive-reset').addEventListener('click', () => { driveRunning = false; cancelAnimationFrame(driveAnimation); driveIndex = 0; byId('drive-frequency').value = 100; drawDrive(); });
drawDrive();

const cases = {
  weak: { label: 'Zu schwach gedämpft', text: 'Die Gabel überschwingt die Ruhelage mehrfach. Das Rad hüpft nach dem Stoß weiter.', fn: t => Math.exp(-.3 * t) * (Math.cos(2.2 * t) + .14 * Math.sin(2.2 * t)) },
  critical: { label: 'Aperiodischer Grenzfall', text: 'Die Gabel kehrt schnell zurück und überschwingt die Ruhelage nicht.', fn: t => (1 + t) * Math.exp(-t) },
  strong: { label: 'Zu stark gedämpft', text: 'Die Gabel überschwingt nicht, kehrt aber nur langsam in die Ruhelage zurück.', fn: t => 1.08 * Math.exp(-.28 * t) - .08 * Math.exp(-2.8 * t) }
};
let currentCase = 'weak';
function drawCase() {
  const selected = cases[currentCase];
  let path = '';
  for (let i = 0; i <= 500; i++) {
    const t = i / 50;
    const value = selected.fn(t);
    const x = 82 + t / 10 * 703;
    const y = 180 - value * 115;
    path += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  byId('case-plot').innerHTML = plotFrame(selected.label, 'Auslenkung x / x₀', 10, 1, 'Zeit (normiert)') + `<path d="${path}" fill="none" stroke="#41698e" stroke-width="3.2"/>`;
  byId('case-text').textContent = selected.text;
}
document.querySelectorAll('[data-case]').forEach(button => button.addEventListener('click', () => {
  currentCase = button.dataset.case;
  document.querySelectorAll('[data-case]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  drawCase();
}));
drawCase();

document.addEventListener('visibilitychange', () => {
  if (document.hidden && driveRunning) {
    driveRunning = false;
    cancelAnimationFrame(driveAnimation);
  }
});
