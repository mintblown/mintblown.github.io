'use strict';
const $ = id => document.getElementById(id);
const TAU = 2 * Math.PI, C = 343;
let inverted = false, running = false, time = 0, last = null, frame;
const canvas = $('field'), context = canvas.getContext('2d');
const w = canvas.width, h = canvas.height, n = w * h;
const image = context.createImageData(w, h);
const sources = [3, 6].map(x => {
  const distance = new Float32Array(n), amplitude = new Float32Array(n);
  for (let y = 0; y < h; y++) for (let u = 0; u < w; u++) {
    const i = y * w + u;
    distance[i] = Math.hypot((u + .5) / 45 - x, (y + .5) / 45);
    amplitude[i] = 1 / Math.sqrt(Math.max(.2, distance[i]));
  }
  return {distance, amplitude, sin: new Float32Array(n), cos: new Float32Array(n)};
});
const fmt = (value, digits = 2) => value.toLocaleString('de-DE', {maximumFractionDigits: digits});
const frequencies = () => [Number($('freq').value), Number($('freqR').value)];
function rebuild() {
  frequencies().forEach((f, j) => {
    $(j ? 'hzR' : 'hz').textContent = f;
    $(j ? 'wavelengthR' : 'wavelength').textContent = fmt(C / f, 3);
    const source = sources[j], k = TAU * f / C;
    for (let i = 0; i < n; i++) {
      source.sin[i] = source.amplitude[i] * Math.sin(k * source.distance[i]);
      source.cos[i] = source.amplitude[i] * Math.cos(k * source.distance[i]);
    }
  });
  const max = Math.max(...frequencies());
  $('speed').textContent = `Zeitlupe: schnellere Quelle mit 0,65 Schwingungen/s dargestellt (Zeitfaktor ${fmt(.65 / max, 5)}).`;
  render();
}
function valuesAt(t) {
  const x = Number($('posX').value), y = Number($('posY').value);
  const amplitude = Number($('volume').value) / 50;
  return frequencies().map((f, j) => {
    const r = Math.hypot(x - (j ? 6 : 3), y);
    return amplitude / Math.sqrt(Math.max(.2, r)) * Math.sin(TAU * f * (t - r / C) + (j && inverted ? Math.PI : 0));
  });
}
function render() {
  const f = frequencies(), amplitude = Number($('volume').value) / 50;
  const s = f.map(v => Math.sin(TAU * v * time)), c = f.map(v => Math.cos(TAU * v * time));
  const sign = inverted ? -1 : 1;
  for (let i = 0; i < n; i++) {
    const p = amplitude * (s[0] * sources[0].cos[i] - c[0] * sources[0].sin[i] + sign * (s[1] * sources[1].cos[i] - c[1] * sources[1].sin[i]));
    const strength = Math.min(1, Math.abs(p) * .72), color = p >= 0 ? [38,121,237] : [229,84,98];
    const j = i * 4;
    image.data[j] = 248 + (color[0] - 248) * strength;
    image.data[j+1] = 250 + (color[1] - 250) * strength;
    image.data[j+2] = 253 + (color[2] - 253) * strength;
    image.data[j+3] = 255;
  }
  context.putImageData(image, 0, 0);
  drawPlots();
}
function axes(span, limit) {
  let markup = '<path d="M65 25V190H970 M65 107.5H970" fill="none" stroke="#bccbd9"/><text x="8" y="18">A(t)</text><text x="970" y="226" text-anchor="end">t − t aktuell (ms)</text>';
  for (let i = 0; i <= 4; i++) {
    const x = 65 + i * 905 / 4;
    markup += `<path d="M${x} 25V194" stroke="#e7edf4"/><text x="${x}" y="210" text-anchor="middle">${fmt((i / 4 - 1) * span * 1000, 1)}</text>`;
  }
  for (const value of [-limit, 0, limit]) markup += `<text x="56" y="${111.5 - value / limit * 77}" text-anchor="end">${fmt(value)}</text>`;
  return markup;
}
function drawPlots() {
  const f = frequencies(), span = 4 / Math.min(...f);
  const x = Number($('posX').value), y = Number($('posY').value);
  const distances = [Math.hypot(x - 3, y), Math.hypot(x - 6, y)];
  // Shared scale covers both individual waves and their maximum possible sum.
  const limit = Math.max(.1, distances.reduce((sum, r) => sum + 1 / Math.sqrt(Math.max(.2, r)), 0));
  const gain = Number($('volume').value) / 50;
  const samples = Math.max(800, Math.ceil(span * Math.max(...f) * 24));
  const paths = ['', '', ''];
  for (let i = 0; i <= samples; i++) {
    const t = time - span + span * i / samples;
    const a = distances.map((r, j) => gain / Math.sqrt(Math.max(.2, r)) * Math.sin(TAU * f[j] * (t - r / C) + (j && inverted ? Math.PI : 0)));
    [a[0], a[1], a[0] + a[1]].forEach((v, j) => {
      paths[j] += `${i ? 'L' : 'M'}${(65 + 905 * i / samples).toFixed(2)},${(107.5 - 77 * v / limit).toFixed(2)}`;
    });
  }
  const base = axes(span, limit);
  $('individual').innerHTML = base + `<path d="${paths[0]}" fill="none" stroke="#2679ed" stroke-width="2.5"/><path d="${paths[1]}" fill="none" stroke="#e55462" stroke-width="2.5" stroke-dasharray="7 4"/>`;
  $('sum').innerHTML = base + `<path d="${paths[2]}" fill="none" stroke="#6246a7" stroke-width="2.5"/>`;
  const a = valuesAt(time);
  $('instant').textContent = `Aktuell: ${fmt(a[0] + a[1], 3)}`;
}
function position() {
  const x = Number($('posX').value), y = Number($('posY').value);
  $('probe').setAttribute('transform', `translate(${55 + 45*x} ${65 + 45*y})`);
  $('position').textContent = `P: (${fmt(x)} m | ${fmt(y)} m) · Abstand links ${fmt(Math.hypot(x-3,y))} m · rechts ${fmt(Math.hypot(x-6,y))} m`;
  drawPlots();
}
function phase(value) {
  inverted = value;
  $('same').setAttribute('aria-pressed', String(!value));
  $('opposite').setAttribute('aria-pressed', String(value));
  $('rlabel').textContent = value ? 'R · 180°' : 'R · 0°';
  $('phaseText').textContent = `Δφ Quelle = ${value ? 180 : 0}°`;
  $('explain').textContent = (value ? 'Die rechte Quelle startet um 180° versetzt.' : 'Beide Quellen starten mit derselben Phase.') + ' Bei verschiedenen Frequenzen verändert sich die Phasendifferenz mit der Zeit.';
  render();
}
function tick(timestamp) {
  if (!running) return;
  if (last !== null) time += Math.min((timestamp-last)/1000, .1) * .65 / Math.max(...frequencies());
  last = timestamp;
  render();
  frame = requestAnimationFrame(tick);
}
$('same').onclick = () => phase(false);
$('opposite').onclick = () => phase(true);
for (const id of ['freq', 'freqR']) $(id).oninput = () => {
  if ($('linked').checked) $(id === 'freq' ? 'freqR' : 'freq').value = $(id).value;
  time = 0; last = null; rebuild();
};
$('linked').onchange = () => { if ($('linked').checked) { $('freqR').value = $('freq').value; time = 0; last = null; rebuild(); } };
$('volume').oninput = () => { $('vol').textContent = $('volume').value + ' %'; render(); };
$('posX').oninput = position; $('posY').oninput = position;
let dragging = false;
function selectPoint(event) {
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform($('room').getScreenCTM().inverse());
  $('posX').value = Math.max(0, Math.min(9, (point.x-55)/45));
  $('posY').value = Math.max(0, Math.min(10, (point.y-65)/45));
  position();
}
$('room').onpointerdown = event => { if (event.button !== 0) return; dragging = true; $('room').setPointerCapture(event.pointerId); selectPoint(event); };
$('room').onpointermove = event => { if (dragging) selectPoint(event); };
$('room').onpointerup = $('room').onpointercancel = $('room').onlostpointercapture = () => { dragging = false; };
$('play').onclick = () => {
  running = !running; last = null;
  $('play').textContent = running ? 'Ⅱ  Simulation pausieren' : '▶  Simulation starten';
  $('status').textContent = running ? 'Simulation läuft · ohne Audio' : 'Pausiert · ohne Audio';
  if (running) frame = requestAnimationFrame(tick); else cancelAnimationFrame(frame);
};
document.addEventListener('visibilitychange', () => { last = null; });
rebuild(); position(); phase(false);
