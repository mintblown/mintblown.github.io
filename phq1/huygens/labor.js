const byId = (id) => document.getElementById(id);
const tabs = [...document.querySelectorAll('[role="tab"]')];
const degrees = Math.PI / 180;
const colors = { background: '#101f32', white: '#dfe9f4', blue: '#62d6ff', gold: '#f7bd65', green: '#85e3ac' };
const format = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

function line(ctx, start, end, color, width = 2, dashed = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? [5, 5] : []);
  ctx.beginPath();
  ctx.moveTo(...start);
  ctx.lineTo(...end);
  ctx.stroke();
  ctx.setLineDash([]);
}

function arc(ctx, center, radius, start, end, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(...center, radius, start, end);
  ctx.stroke();
}

function dot(ctx, center, color, radius = 4) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(...center, radius, 0, Math.PI * 2);
  ctx.fill();
}

function label(ctx, text, x, y, color = colors.white) {
  ctx.fillStyle = color;
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.fillText(text, x, y);
}

function clear(ctx) {
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

const plane = byId('plane').getContext('2d');

function drawPlane() {
  const time = Number(byId('time').value);
  const radius = time * 2;
  byId('time-value').value = format.format(time / 10) + ' s';
  clear(plane);
  line(plane, [90, 24], [90, 276], colors.white);
  for (let y = 26; y <= 276; y += 31) {
    arc(plane, [90, y], radius, -Math.PI / 2, Math.PI / 2, colors.blue, 1.3);
    dot(plane, [90, y], colors.white, 3);
  }
  if (byId('envelope').checked) {
    line(plane, [90 + radius, 24], [90 + radius, 276], colors.gold, 3);
  }
}

byId('time').addEventListener('input', drawPlane);
byId('envelope').addEventListener('change', drawPlane);
drawPlane();

const diffraction = byId('diffraction').getContext('2d');
const field = document.createElement('canvas');
field.width = 240;
field.height = 150;
const fieldContext = field.getContext('2d');
const frame = fieldContext.createImageData(field.width, field.height);
const real = new Float32Array(field.width * field.height);
const imaginary = new Float32Array(real.length);
const barrier = 62;
const wavelength = 20;
const waveNumber = 2 * Math.PI / wavelength;
let phase = 0;
let animation = 0;
let lastFrame = 0;
let opening = 0;
let sourceCount = 0;
const motion = byId('diff-motion');

function prepareField() {
  const width = Number(byId('width').value);
  opening = width * wavelength;
  byId('width-value').value = format.format(width) + ' λ';
  sourceCount = Math.ceil(width * 8);
  for (let y = 0; y < field.height; y++) {
    for (let x = 0; x < field.width; x++) {
      const index = y * field.width + x;
      const dx = x - barrier;
      if (dx < 0) {
        real[index] = Math.cos(waveNumber * dx);
        imaginary[index] = Math.sin(waveNumber * dx);
        continue;
      }

      let sumReal = 0;
      let sumImaginary = 0;
      for (let source = 0; source < sourceCount; source++) {
        const sourceY = field.height / 2 + ((source + 0.5) / sourceCount - 0.5) * opening;
        const distance = Math.hypot(dx, y - sourceY);
        const amplitude = 1 / Math.sqrt(1 + distance / wavelength);
        sumReal += amplitude * Math.cos(waveNumber * distance);
        sumImaginary += amplitude * Math.sin(waveNumber * distance);
      }
      // Average across the opening so the wave patterns share a readable scale.
      real[index] = sumReal / sourceCount;
      imaginary[index] = sumImaginary / sourceCount;
    }
  }
  drawDiffraction();
}

function drawDiffraction() {
  const cosine = Math.cos(phase);
  const sine = Math.sin(phase);
  for (let i = 0; i < real.length; i++) {
    const height = real[i] * cosine + imaginary[i] * sine;
    const strength = Math.abs(height);
    const crest = height >= 0;
    frame.data[i * 4] = 16 + strength * (crest ? 82 : 152);
    frame.data[i * 4 + 1] = 31 + strength * (crest ? 183 : 108);
    frame.data[i * 4 + 2] = 50 + strength * 205;
    frame.data[i * 4 + 3] = 255;
  }
  fieldContext.putImageData(frame, 0, 0);
  diffraction.drawImage(field, 0, 0, 480, 300);
  line(diffraction, [barrier * 2, 0], [barrier * 2, 150 - opening], colors.white, 6);
  line(diffraction, [barrier * 2, 150 + opening], [barrier * 2, 300], colors.white, 6);
  if (byId('sources').checked) {
    for (let i = 0; i < sourceCount; i++) {
      dot(diffraction, [barrier * 2, 150 + ((i + 0.5) / sourceCount - 0.5) * opening * 2], colors.gold, 1.8);
    }
  }
}

function animate(now) {
  if (lastFrame) phase += Math.min(now - lastFrame, 50) * 0.004;
  lastFrame = now;
  drawDiffraction();
  animation = requestAnimationFrame(animate);
}

function stopMotion() {
  cancelAnimationFrame(animation);
  animation = 0;
  lastFrame = 0;
  motion.setAttribute('aria-pressed', 'false');
  motion.textContent = 'Animation starten';
}

motion.addEventListener('click', () => {
  if (animation) {
    stopMotion();
  } else {
    animation = requestAnimationFrame(animate);
    motion.setAttribute('aria-pressed', 'true');
    motion.textContent = 'Animation anhalten';
  }
});
byId('width').addEventListener('input', prepareField);
byId('sources').addEventListener('change', drawDiffraction);
prepareField();

const refractionCanvas = byId('refraction');
const refraction = refractionCanvas.getContext('2d');
const construct = byId('construct');
const instruction = byId('instruction');
const feedback = byId('feedback');
const check = byId('check');
const A = [91, 130];
const B = [286, 130];
const span = B[0] - A[0];
let stage;
let radius;
let tangentAngle;
let activePointer = null;

function geometry() {
  const angle = Number(byId('angle').value);
  const ratio = Number(byId('medium').value);
  const alpha = angle * degrees;
  const distance = span * Math.sin(alpha);
  const C = [B[0] - distance * Math.sin(alpha), B[1] - distance * Math.cos(alpha)];
  return { angle, ratio, distance, C, targetRadius: distance * ratio };
}

function arrow(ctx, start, end, color) {
  line(ctx, start, end, color);
  const direction = Math.atan2(end[1] - start[1], end[0] - start[0]);
  for (const side of [-1, 1]) {
    const angle = direction + side * Math.PI / 6;
    line(ctx, end, [end[0] - 8 * Math.cos(angle), end[1] - 8 * Math.sin(angle)], color);
  }
}

function drawRefraction() {
  const { angle, ratio, distance, C } = geometry();
  const theta = tangentAngle * degrees;
  const T = [A[0] + radius * Math.sin(theta), A[1] + radius * Math.cos(theta)];
  byId('angle-value').value = angle + '°';
  clear(refraction);
  refraction.fillStyle = '#17364c';
  refraction.fillRect(0, A[1], 480, 340 - A[1]);
  line(refraction, [0, A[1]], [480, A[1]], '#839cb3', 1);
  label(refraction, 'Medium 1', 364, 30);
  label(refraction, 'Medium 2', 364, 157);
  label(refraction, 'v₂/v₁ = ' + ratio.toLocaleString('de-DE'), 364, 180);
  line(refraction, A, C, colors.green, 4);
  label(refraction, 'Einfallende', 16, 30, colors.green);
  label(refraction, 'Wellenfront AC', 16, 50, colors.green);
  line(refraction, B, [B[0], B[1] - 46], colors.white, 1, true);
  arc(refraction, B, 28, -Math.PI / 2 - angle * degrees, -Math.PI / 2, colors.white, 1);
  arrow(refraction, C, B, colors.white);
  label(refraction, 'α', B[0] - 24, B[1] - 39);
  label(refraction, 'CB = λ₁ = ' + Math.round(distance) + ' LE', B[0] + 15, 106);
  arc(refraction, A, radius, 0, Math.PI, colors.blue);
  line(refraction, A, T, colors.blue, 2, true);
  if (stage !== 'radius') {
    line(refraction, B, T, colors.gold, 4);
    label(refraction, stage === 'done' ? 'Gebrochene Wellenfront BT' : 'Wellenfront BT anlegen', 247, 286, colors.gold);
    label(refraction, 'T', T[0] + 12, T[1] + 17, colors.gold);
  }
  if (stage === 'done') {
    const beta = theta;
    const normalEnd = [T[0], T[1] + 30];
    line(refraction, T, normalEnd, colors.white, 1, true);
    arc(refraction, T, 22, Math.PI / 2 - beta, Math.PI / 2, colors.gold, 1);
    arrow(refraction, T, [T[0] + 33 * Math.sin(beta), T[1] + 33 * Math.cos(beta)], colors.gold);
    label(refraction, 'β = ' + format.format(beta / degrees) + '°', T[0] + 36, T[1] + 32, colors.gold);
  }
  for (const [name, point, dx, dy] of [['A', A, -20, -10], ['B', B, 8, -8], ['C', C, 7, -8]]) {
    dot(refraction, point, colors.white);
    label(refraction, name, point[0] + dx, point[1] + dy);
  }
  dot(refraction, T, colors.blue, 11);
  dot(refraction, T, colors.background, 4);
  if (stage === 'radius') label(refraction, 'r = ' + Math.round(radius) + ' LE', T[0] + 17, T[1] + 5, colors.blue);
  else label(refraction, 'r = λ₂ = ' + Math.round(radius) + ' LE', 16, 321, colors.blue);
}

function setStage(next) {
  stage = next;
  construct.min = stage === 'radius' ? '8' : '0';
  construct.max = stage === 'radius' ? '198' : '89';
  construct.value = stage === 'radius' ? radius : tangentAngle;
  construct.disabled = stage === 'done';
  check.disabled = stage === 'done';
  byId('construct-label').textContent = stage === 'radius' ? 'Radius einstellen' : 'Berührpunkt einstellen';
  instruction.textContent = {
    radius: 'Ziehe den blauen Griff nach unten. Wähle den Radius r = λ₁ · (v₂/v₁). LE steht für Längeneinheiten.',
    tangent: 'Ziehe den Griff auf dem Kreisbogen. Lege die Gerade BT so an, dass sie den Kreis bei T berührt. Der Radius AT muss senkrecht auf BT stehen.',
    done: 'Vergleiche Einfallswinkel α und Brechungswinkel β. Wiederhole die Konstruktion im anderen Medium.'
  }[stage];
  drawRefraction();
}

function resetConstruction() {
  radius = 35;
  tangentAngle = 0;
  feedback.textContent = '';
  setStage('radius');
}

function updateConstruction(value) {
  if (stage === 'radius') {
    radius = value;
  } else {
    tangentAngle = value;
  }
  feedback.textContent = '';
  drawRefraction();
}

function moveGrip(event) {
  const rect = refractionCanvas.getBoundingClientRect();
  const dx = (event.clientX - rect.left) * 480 / rect.width - A[0];
  const dy = (event.clientY - rect.top) * 340 / rect.height - A[1];
  const value = stage === 'radius' ? dy : Math.atan2(dx, Math.max(1, dy)) / degrees;
  construct.value = Math.round(value);
  updateConstruction(Number(construct.value));
}

refractionCanvas.addEventListener('pointerdown', (event) => {
  if (stage === 'done' || activePointer !== null || event.button !== 0) return;
  activePointer = event.pointerId;
  refractionCanvas.setPointerCapture(activePointer);
  moveGrip(event);
});
refractionCanvas.addEventListener('pointermove', (event) => {
  if (event.pointerId === activePointer && stage !== 'done') moveGrip(event);
});
refractionCanvas.addEventListener('lostpointercapture', (event) => {
  if (event.pointerId === activePointer) activePointer = null;
});
construct.addEventListener('input', () => updateConstruction(Number(construct.value)));

check.addEventListener('click', () => {
  const { targetRadius, angle } = geometry();
  if (stage === 'radius') {
    if (Math.abs(radius - targetRadius) > 4) {
      feedback.textContent = radius < targetRadius ? 'Der Radius ist noch zu klein.' : 'Der Radius ist noch zu groß.';
      return;
    }
    radius = targetRadius;
    setStage('tangent');
    feedback.textContent = 'Der Radius passt. Lege jetzt die Tangente an.';
    return;
  }
  const beta = Math.asin(radius / span) / degrees;
  if (Math.abs(tangentAngle - beta) > 3) {
    feedback.textContent = tangentAngle < beta ? 'Schiebe den Berührpunkt weiter nach rechts.' : 'Schiebe den Berührpunkt weiter nach links.';
    return;
  }
  tangentAngle = beta;
  setStage('done');
  feedback.textContent = 'Die Tangente passt. α = ' + angle + '°, β = ' + format.format(beta) + '°.';
});
for (const id of ['angle', 'medium', 'reset']) {
  byId(id).addEventListener(id === 'reset' ? 'click' : 'input', resetConstruction);
}
resetConstruction();

function selectTab(selected, focus = false) {
  for (const tab of tabs) {
    const active = tab === selected;
    tab.setAttribute('aria-selected', active);
    tab.tabIndex = active ? 0 : -1;
    byId(tab.getAttribute('aria-controls')).hidden = !active;
  }
  if (selected.id !== 'tab-spalt') stopMotion();
  if (focus) selected.focus();
}

for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (event) => {
    const next = {
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    selectTab(tabs[next], true);
  });
}
