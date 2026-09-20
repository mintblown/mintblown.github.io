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

function springPath(endX) {
  const start = 85;
  const turns = 12;
  let path = `M30 125 H${start}`;
  for (let i = 0; i <= turns * 2; i++) {
    const x = start + (endX - start) * i / (turns * 2);
    const y = i === 0 || i === turns * 2 ? 125 : 125 + (i % 2 ? -20 : 20);
    path += ` L${x.toFixed(1)} ${y}`;
  }
  return path;
}

function renderEnergy() {
  const theta = Number(byId('phase').value) / 1000 * 2 * Math.PI;
  const position = Math.cos(theta);
  const velocity = -Math.sin(theta);
  const pot = position ** 2;
  const kin = velocity ** 2;
  const massX = 400 + 235 * position;
  const direction = velocity > .03 ? 'nach rechts' : velocity < -.03 ? 'nach links' : 'kurz in Ruhe';
  byId('spring-model').innerHTML = `
    <rect width="800" height="250" fill="white"/>
    <path d="M25 55 V195 M25 70 h30 M25 95 h30 M25 120 h30 M25 145 h30 M25 170 h30" stroke="#273342" stroke-width="4" fill="none"/>
    <path d="${springPath(massX - 48)}" stroke="#273342" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M400 45 V205" stroke="#8fa0ad" stroke-width="2" stroke-dasharray="7 7"/>
    <text x="400" y="224" text-anchor="middle" fill="#596778" font-family="Arial">Ruhelage</text>
    <rect x="${massX - 48}" y="80" width="96" height="90" rx="12" fill="#edf3fa" stroke="#273342" stroke-width="4"/>
    <path d="M${massX - velocity * 16} 62 L${massX + velocity * 62} 62" stroke="#bc7a4d" stroke-width="5" marker-end="url(#energy-arrow)"/>
    <defs><marker id="energy-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#bc7a4d" stroke-width="2"/></marker></defs>
    <text x="${massX}" y="135" text-anchor="middle" fill="#273342" font-size="24" font-weight="700" font-family="Arial">m</text>`;
  byId('bar-pot').style.width = `${pot * 100}%`;
  byId('bar-kin').style.width = `${kin * 100}%`;
  byId('pot-value').textContent = `${Math.round(pot * 100)} %`;
  byId('kin-value').textContent = `${Math.round(kin * 100)} %`;
  byId('energy-readout').textContent = `Auslenkung: ${format(position)} · Geschwindigkeit: ${format(velocity)} · Bewegung: ${direction}. Die Energieanteile ergeben zusammen ${Math.round((pot + kin) * 100)} %.`;
}
byId('phase').addEventListener('input', renderEnergy);
renderEnergy();

function plotFrame(title, yLabel, timeMax = 10, yMax = 1) {
  let content = `<rect width="820" height="360" fill="white"/><text x="410" y="25" text-anchor="middle" font-family="Arial" font-weight="700" fill="#273342">${title}</text>`;
  for (let i = 0; i <= 4; i++) {
    const y = 55 + i * 62.5;
    content += `<path d="M82 ${y}H785" stroke="#e1e7ec"/><text x="68" y="${y + 5}" text-anchor="end" font-family="Arial" fill="#596778">${format(yMax * (1 - i * .5), 2)}</text>`;
  }
  for (let i = 0; i <= 5; i++) {
    const x = 82 + i * 140.6;
    content += `<path d="M${x} 55V305" stroke="#e1e7ec"/><text x="${x}" y="329" text-anchor="middle" font-family="Arial" fill="#596778">${format(i * timeMax / 5, 1)}</text>`;
  }
  content += `<path d="M82 45V305H798" stroke="#273342" stroke-width="2.5" fill="none"/><text x="440" y="350" text-anchor="middle" font-family="Arial" fill="#273342">Zeit t</text><text x="22" y="180" text-anchor="middle" transform="rotate(-90 22 180)" font-family="Arial" fill="#273342">${yLabel}</text>`;
  return content;
}

let damping = 0;
function drawDamping() {
  let path = '';
  for (let i = 0; i <= 500; i++) {
    const t = i / 50;
    const value = Math.exp(-damping * t) * Math.cos(2 * Math.PI * t / 2);
    const x = 82 + t / 10 * 703;
    const y = 180 - value * 125;
    path += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  byId('damping-plot').innerHTML = plotFrame('Auslenkung mit Reibung', 'Auslenkung x') + `<path d="${path}" fill="none" stroke="#41698e" stroke-width="3"/>`;
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
  byId('drive-plot').innerHTML = plotFrame('Gedämpftes Pendel mit äußerer Kraft', 'Auslenkung x', 40, max) + `<path d="${path}" fill="none" stroke="#41698e" stroke-width="3"/><line id="drive-marker" x1="82" x2="82" y1="55" y2="305" stroke="#bc7a4d" stroke-width="3"/>`;
  byId('drive-frequency-value').textContent = `${format(ratio)} · Eigenfrequenz`;
  const lateAmplitude = Math.max(...drivePoints.slice(-125).map(point => Math.abs(point.x)));
  byId('drive-status').textContent = `Im Modell beträgt die größte späte Auslenkung etwa ${format(lateAmplitude)}. ${Math.abs(ratio - 1) < .08 ? 'Der Takt liegt nahe an der Eigenfrequenz: Die Anregung wirkt besonders stark.' : 'Der Takt passt nicht genau zur Eigenfrequenz: Die Anregung wirkt schwächer.'}`;
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
  byId('case-plot').innerHTML = plotFrame(selected.label, 'Auslenkung x') + `<path d="${path}" fill="none" stroke="#41698e" stroke-width="3.2"/>`;
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
