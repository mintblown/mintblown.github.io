const times = [0, 30, 60, 90, 120];
const labels = ['Vor dem Hüpfen', 'Direkt danach', ...times.slice(1).map(time => `Nach ${time} s`)];
const table = document.querySelector('#measurements');
const chart = document.querySelector('#chart');
const note = document.querySelector('#chart-note');
const phase = document.querySelector('#phase');
const seconds = document.querySelector('#seconds');
const start = document.querySelector('#start');
const reset = document.querySelector('#reset');

const rows = labels.map(label => {
  const row = table.insertRow();
  const heading = document.createElement('th');
  heading.scope = 'row';
  heading.textContent = label;
  row.append(heading);
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '1';
  input.max = '999';
  input.step = '1';
  input.inputMode = 'numeric';
  input.setAttribute('aria-label', `${label}, Schläge in 15 Sekunden`);
  row.insertCell().append(input);
  const result = row.insertCell();
  result.textContent = '–';
  input.addEventListener('input', draw);
  return { row, input, result };
});

function draw() {
  const values = rows.map(({ input, result }) => {
    const value = input.value && input.validity.valid ? input.valueAsNumber * 4 : null;
    result.textContent = value ?? '–';
    return value;
  });
  chart.hidden = values.every(value => value === null);
  note.textContent = chart.hidden
    ? 'Sobald du eine Zahl einträgst, erscheint hier ein Punkt.'
    : 'Links steht dein Puls vor dem Hüpfen. 0 s bedeutet direkt nach dem Hüpfen.';
  if (chart.hidden) return;

  const { width, height } = chart.getBoundingClientRect();
  if (!width) return;
  const pixelRatio = window.devicePixelRatio || 1;
  chart.width = width * pixelRatio;
  chart.height = height * pixelRatio;
  const ctx = chart.getContext('2d');
  ctx.scale(pixelRatio, pixelRatio);
  const max = Math.max(40, Math.ceil(Math.max(...values) / 40) * 40);
  const left = 45;
  const bottom = height - 54;
  const top = 32;
  const x = index => left + (width - left - 26) * index / (values.length - 1);
  const y = value => bottom - value / max * (bottom - top);

  ctx.font = '14px system-ui';
  ctx.fillStyle = '#481831';
  ctx.fillText('Schläge pro Minute', 4, 17);
  for (let i = 0; i <= 4; i++) {
    const value = i * max / 4;
    ctx.beginPath();
    ctx.strokeStyle = '#ded2dd';
    ctx.moveTo(left, y(value));
    ctx.lineTo(width - 22, y(value));
    ctx.stroke();
    ctx.fillText(value, 4, y(value) + 4);
  }
  ctx.textAlign = 'center';
  ['Vorher', ...times.map(time => `${time} s`)].forEach((label, index) => {
    ctx.fillText(label, x(index), bottom + 22);
  });
  ctx.fillText('Zeit nach dem Hüpfen', (width + left) / 2, height - 8);

  ctx.strokeStyle = '#841d52';
  ctx.fillStyle = '#841d52';
  ctx.lineWidth = 3;
  values.forEach((value, index) => {
    if (value === null) return;
    const previous = values[index - 1];
    if (index && previous !== null) {
      ctx.beginPath();
      ctx.moveTo(x(index - 1), y(previous));
      ctx.lineTo(x(index), y(value));
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x(index), y(value), 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

new ResizeObserver(draw).observe(chart);

let stage = 'ready';
let timer;
let deadline;
let activeRow = -1;

// Each measurement starts 30 seconds after the previous one.
const followUp = times.flatMap((time, index) => {
  const count = { duration: 15, label: `${labels[index + 1]} – jetzt Schläge zählen!`, row: index + 1 };
  return index === times.length - 1 ? [count] : [
    count,
    { duration: 15, label: 'Trag deine Zahl ein. Warte auf die nächste Messung.', row: index + 1 }
  ];
});
const jumpSteps = [{ duration: 60, label: 'Jetzt hüpfen!', row: -1 }, ...followUp];

function run(steps, done) {
  let index = 0;
  deadline = performance.now() + steps[0].duration * 1000;
  function tick() {
    const now = performance.now();
    while (now >= deadline) {
      index++;
      if (index === steps.length) {
        clearInterval(timer);
          done();
        return;
      }
      deadline += steps[index].duration * 1000;
    }
    const step = steps[index];
    show(step.label, Math.ceil((deadline - now) / 1000), step.row);
  }
  timer = setInterval(tick, 100);
  tick();
}

function show(label, remaining, row) {
  if (phase.textContent !== label) phase.textContent = label;
  const time = `${remaining} s`;
  if (seconds.textContent !== time) seconds.textContent = time;
  if (row !== activeRow) {
    rows[activeRow]?.row.classList.remove('active');
    rows[row]?.row.classList.add('active');
    activeRow = row;
  }
}

start.addEventListener('click', () => {
  start.hidden = true;
  reset.hidden = false;
  if (stage === 'ready') {
    run([{ duration: 15, label: 'Jetzt Schläge zählen!', row: 0 }], () => {
      stage = 'jump';
      show('Trag deine Zahl in die erste Zeile ein. Dann geht’s los!', 60, 0);
      start.textContent = 'Hüpfzeit starten';
      start.hidden = false;
    });
  } else {
    run(jumpSteps, () => show('Fertig! Trag deine letzte Zahl ein.', 0, activeRow));
  }
});

reset.addEventListener('click', () => {
  clearInterval(timer);
  stage = 'ready';
  show('Bereit für die erste Messung', 15, -1);
  start.textContent = 'Erste Messung starten';
  start.hidden = false;
  reset.hidden = true;
  start.focus();
});
