'use strict';
const fields = Object.fromEntries(['angle', 'vx', 'vy'].map(key => [key, document.getElementById(key)]));
const feedback = document.getElementById('feedback');
const calculation = document.getElementById('calculation');
const calculateButton = document.getElementById('calculate');
const format = value => value.toLocaleString('de-DE', {minimumFractionDigits: 1, maximumFractionDigits: 1});
const readValues = () => Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, Wurf.parse(input.value)]));
function status(text, kind = 'neutral') {
  feedback.textContent = text;
  feedback.className = `feedback ${kind}`;
}
function draw(values) {
  const {angle, vx, vy} = values;
  const originX = 190, originY = 340;
  const scale = 27;
  const dx = vx === null ? 0 : vx * scale;
  const dy = vy === null ? 0 : vy * scale;
  const endX = originX + dx, endY = originY - dy;
  const line = (x1,y1,x2,y2,color,marker) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3.5" marker-end="url(#${marker})"/>`;
  const label = (x,y,text,color,anchor='start') => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="vector-label" fill="${color}">${text}</text>`;
  let svg = '<path d="M 190 50 V 340 H 480" fill="none" stroke="#b8b0c1" stroke-width="2"/>';
  for (let tick = 2; tick <= 10; tick += 2) {
    const offset = tick * scale;
    svg += `<path d="M ${originX+offset} 340 v 6 M 184 ${originY-offset} h 6" stroke="#b8b0c1"/>`;
    svg += `<text x="${originX+offset}" y="363" text-anchor="middle" fill="#605e6e" font-size="13">${format(tick)}</text><text x="178" y="${originY-offset+5}" text-anchor="end" fill="#605e6e" font-size="13">${format(tick)}</text>`;
  }
  svg += '<text x="485" y="345" fill="#286d91" font-size="15">vₓ (m/s)</text><text x="190" y="35" fill="#a54d23" font-size="15">vᵧ (m/s)</text>';
  if (angle !== null) {
    const a = angle * Math.PI / 180;
    const rayX = originX + 300 * Math.cos(a), rayY = originY - 300 * Math.sin(a);
    svg += `<path d="M ${originX} ${originY} L ${rayX} ${rayY}" stroke="#756e7f" stroke-width="2" stroke-dasharray="7 6"/>`;
    if (angle > 0) svg += `<path d="M ${originX+66} ${originY} A 66 66 0 0 0 ${originX+66*Math.cos(a)} ${originY-66*Math.sin(a)}" fill="none" stroke="#756e7f" stroke-width="2"/>`;
    svg += label(originX+95*Math.cos(a/2),originY-95*Math.sin(a/2)-8,`α = ${format(angle)}°`,'#756e7f');
  }
  if (vx !== null && vy !== null) {
    svg += `<path d="M ${endX} ${originY} V ${endY} H ${originX}" fill="none" stroke="#b8b0c1" stroke-width="1.5" stroke-dasharray="5 5"/>`;
    if (dx > 0 || dy > 0) svg += line(originX,originY,endX,endY,'#684890','arrow-v');
    const speed = Math.hypot(vx,vy);
    svg += label(endX+8,endY-18,Number.isFinite(speed) ? `v = ${format(speed)} m/s` : 'v zu groß für die Anzeige','#684890',endX > 510 ? 'end' : 'start');
  }
  if (vx !== null) {
    if (dx > 0) svg += line(originX,originY,endX,originY,'#286d91','arrow-x');
    svg += label(originX+Math.max(dx/2,70),originY+52,`vₓ = ${format(vx)} m/s`,'#286d91','middle');
  }
  if (vy !== null) {
    if (dy > 0) svg += line(originX,originY,originX,endY,'#a54d23','arrow-y');
    svg += label(originX+12,originY-Math.max(dy/2,60),`vᵧ = ${format(vy)} m/s`,'#a54d23','start');
  }
  document.getElementById('vectors').innerHTML = svg;
  document.getElementById('scale-note').textContent = 'Feste Achsen: 0,0 bis 10,0 m/s je Komponente. Beide Pfeile haben denselben Maßstab.';
  document.getElementById('drawing-description').textContent = `Strichmännchen mit Ball. ${angle === null ? 'Kein Winkel eingegeben.' : `Abwurfwinkel ${format(angle)} Grad.`} ${vx === null ? 'Horizontale Komponente fehlt.' : `Horizontale Komponente ${format(vx)} Meter pro Sekunde.`} ${vy === null ? 'Vertikale Komponente fehlt.' : `Vertikale Komponente ${format(vy)} Meter pro Sekunde.`}`;
}
function update() {
  calculation.textContent = '';
  const values = readValues();
  const error = Wurf.validate(values);
  resetFlight(values, error);
  for (const [key,input] of Object.entries(fields)) {
    const value = values[key];
    const invalid = value !== null && (!Number.isFinite(value) || value < 0 || (key === 'angle' ? value > 90 : value > 10));
    input.setAttribute('aria-invalid', String(invalid));
  }
  calculateButton.disabled = Boolean(error) || Object.values(values).filter(value => value !== null).length !== 2;
  calculateButton.textContent = 'Fehlenden Wert berechnen';
  if (!calculateButton.disabled) {
    const key = Object.keys(values).find(key => values[key] === null);
    calculateButton.textContent = `${{angle:'Abwurfwinkel α',vx:'vₓ',vy:'vᵧ'}[key]} berechnen`;
  }
  if (error) {
    status(error, 'warning');
    document.getElementById('vectors').innerHTML = '';
    document.getElementById('drawing-description').textContent = 'Strichmännchen mit Ball. Die Eingaben sind ungültig; Geschwindigkeitspfeile werden nach der Korrektur angezeigt.';
    document.getElementById('scale-note').textContent = 'Korrigiere die Eingaben, um die Werte einzuzeichnen.';
    return;
  }
  draw(values);
  const count = Object.values(values).filter(value => value !== null).length;
  if (count === 3) {
    const result = Wurf.check(values);
    status(result.text, result.kind);
  } else if (count === 2) {
    const result = Wurf.solve(values);
    status(result.error || 'Zwei Werte sind gegeben. Berechne jetzt den fehlenden Wert.', result.error ? 'warning' : 'neutral');
  } else status('Gib mindestens zwei Werte ein. Die Zeichnung zeigt die bereits eingegebenen Größen.');
}
Object.values(fields).forEach(input => {
  input.addEventListener('input', update);
  input.addEventListener('change', () => { const value = Wurf.parse(input.value); if (value !== null && Number.isFinite(value)) input.value = value.toFixed(1).replace('.', ','); update(); });
});
document.getElementById('values-form').addEventListener('submit', event => {
  event.preventDefault();
  const result = Wurf.solve(readValues());
  if (result.error) { status(result.error, 'warning'); return; }
  fields[result.key].value = result.value.toFixed(1).replace('.', ',');
  update();
  const formula = {angle:'α = atan2(vᵧ, vₓ)',vx:'vₓ = vᵧ / tan(α)',vy:'vᵧ = vₓ · tan(α)'}[result.key];
  calculation.textContent = `${formula} → ${format(result.value)} ${result.key === 'angle' ? '°' : 'm/s'}. Der berechnete Wert wurde ins leere Feld eingesetzt.`;
  fields[result.key].focus();
});
document.getElementById('clear').addEventListener('click', () => {
  Object.values(fields).forEach(input => { input.value = ''; });
  update();
  fields.angle.focus();
});
const startFlight = document.getElementById('start-flight');
const flightStatus = document.getElementById('flight-status');
const ball = document.getElementById('flight-ball');
const trail = document.getElementById('flight-trail');
const rangeDrawing = document.getElementById('flight-range');
let animationFrame = null;
let flightModel = null;
const flightPoint = (x,y) => ({x:70+x*30,y:370-y*30});
function flightAxes() {
  let svg = '<path d="M 70 50 V 370 H 820" fill="none" stroke="#605e6e" stroke-width="2"/>';
  for (let x = 0; x <= 24; x += 2) {
    const p = flightPoint(x,0);
    svg += `<path d="M ${p.x} 65 V 370" stroke="#e6ddec"/><text x="${p.x}" y="392" text-anchor="middle" fill="#605e6e" font-size="14">${format(x)}</text>`;
  }
  for (let y = 0; y <= 10; y += 2) {
    const p = flightPoint(0,y);
    svg += `<path d="M 70 ${p.y} H 790" stroke="#e6ddec"/><text x="58" y="${p.y+5}" text-anchor="end" fill="#605e6e" font-size="14">${format(y)}</text>`;
  }
  svg += '<text x="70" y="30" fill="#605e6e" font-size="17">Höhe y (m)</text><text x="820" y="425" text-anchor="end" fill="#605e6e" font-size="17">Entfernung x (m)</text>';
  svg += '<path d="M 70 325 H 110 M 100 325 V 370" fill="none" stroke="#a54d23" stroke-dasharray="4 4"/><text x="112" y="349" fill="#a54d23" font-size="15">1,5 m</text>';
  document.getElementById('flight-axes').innerHTML = svg;
}
function renderFlight(time) {
  const position = flightModel.position(time);
  const p = flightPoint(position.x,position.y);
  ball.setAttribute('cx',p.x);
  ball.setAttribute('cy',p.y);
  let path = '';
  for (let i = 0; i <= 100; i++) {
    const sample = flightModel.position(time*i/100);
    const point = flightPoint(sample.x,sample.y);
    path += `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y} `;
  }
  trail.setAttribute('d',path);
  document.getElementById('flight-readout').textContent = `t = ${format(time)} s · x = ${format(position.x)} m · y = ${format(position.y)} m`;
}
function resetFlight(values, error) {
  if (animationFrame !== null) cancelAnimationFrame(animationFrame);
  animationFrame = null;
  flightModel = null;
  trail.setAttribute('d','');
  rangeDrawing.innerHTML = '';
  ball.setAttribute('cx',70);
  ball.setAttribute('cy',325);
  document.getElementById('flight-readout').textContent = 't = 0,0 s · x = 0,0 m · y = 1,5 m';
  const ready = !error && values.vx !== null && values.vy !== null;
  startFlight.disabled = !ready;
  startFlight.textContent = 'Experiment starten';
  if (!ready) {
    flightStatus.textContent = 'Gib gültige Werte für vₓ und vᵧ zwischen 0,0 und 10,0 m/s ein.';
    return;
  }
  flightModel = Wurf.flight(values.vx,values.vy);
  const mismatch = values.angle !== null && Wurf.check(values).kind === 'warning';
  flightStatus.textContent = mismatch ? 'Der Winkel passt nicht zu den Komponenten. Die Animation verwendet vₓ und vᵧ; korrigiere den Winkel, um alle Angaben abzugleichen.' : 'Bereit: Starte das Experiment. Am Auftreffpunkt wird die Wurfweite markiert.';
  document.getElementById('flight-description').textContent = `Wurf aus 1,5 Metern Höhe mit vₓ = ${format(values.vx)} und vᵧ = ${format(values.vy)} Metern pro Sekunde. Feste Entfernungsskala in Metern.`;
}
startFlight.addEventListener('click', () => {
  if (!flightModel) return;
  if (animationFrame !== null) cancelAnimationFrame(animationFrame);
  rangeDrawing.innerHTML = '';
  startFlight.textContent = 'Experiment neu starten';
  flightStatus.textContent = 'Der Ball fliegt …';
  let start = null;
  function frame(now) {
    if (start === null) start = now;
    const time = Math.min(flightModel.duration,(now-start)/1000);
    renderFlight(time);
    if (time < flightModel.duration) {
      animationFrame = requestAnimationFrame(frame);
    } else {
      animationFrame = null;
      const end = flightPoint(flightModel.range,0);
      rangeDrawing.innerHTML = `<path d="M 70 405 H ${end.x} M ${end.x} 370 V 411" fill="none" stroke="#684890" stroke-width="2"/><circle cx="${end.x}" cy="370" r="5" fill="#684890"/><text x="${Math.max(200,end.x)}" y="350" text-anchor="end" fill="#684890" font-size="18" font-weight="bold">Wurfweite: ${format(flightModel.range)} m</text>`;
      flightStatus.textContent = `Aufgetroffen nach ${format(flightModel.duration)} s. Wurfweite: ${format(flightModel.range)} m.`;
      document.getElementById('flight-description').textContent = flightStatus.textContent;
    }
  }
  animationFrame = requestAnimationFrame(frame);
});
flightAxes();
update();
