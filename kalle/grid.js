'use strict';

const width = 80;
const height = 60;
const margin = 10;
const spacing = 5;
const speed = 1;
const edgeOvershoot = 1;

const colors = {
  black: { label: 'Schwarz', fill: '#171b1f', turn: 0 },
  red: { label: 'Rot', fill: '#d92736', turn: 1 },
  green: { label: 'Grün', fill: '#239646', turn: -1 },
  yellow: { label: 'Gelb', fill: '#ffd52b', turn: 0 },
  blue: { label: 'Blau', fill: '#246ce0', turn: 2 },
};
const colorOrder = Object.keys(colors);
const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const points = new Map();
const pointButtons = [];
const pointLayer = document.querySelector('#points');
const reset = document.querySelector('#reset');
const drive = document.querySelector('#drive');
const status = document.querySelector('#status');
const robot = document.querySelector('#robot');

function pointKey(x, y) {
  return x + ',' + y;
}

function setPoint(button, x, y, color) {
  points.set(pointKey(x, y), color);
  button.style.setProperty('--point-color', colors[color].fill);
  button.setAttribute('aria-label', x + ' cm von links, ' + y + ' cm von oben, ' + colors[color].label);
}

const lines = [];
for (let x = margin; x <= width - margin; x += spacing) {
  lines.push(`M${x} ${margin}V${height - margin}`);
  for (let y = margin; y <= height - margin; y += spacing) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'point';
    button.style.left = (100 * x / width) + '%';
    button.style.top = (100 * y / height) + '%';
    setPoint(button, x, y, 'black');
    button.addEventListener('click', () => {
      const current = colorOrder.indexOf(points.get(pointKey(x, y)));
      setPoint(button, x, y, colorOrder[(current + 1) % colorOrder.length]);
    });
    pointButtons.push({ button, x, y });
    pointLayer.append(button);
  }
}
for (let y = margin; y <= height - margin; y += spacing) {
  lines.push(`M${margin} ${y}H${width - margin}`);
}
document.querySelector('#lines').setAttribute('d', lines.join(' '));

let x = margin;
let y = height / 2;
let heading = 0;
let segment;
let running = false;
let frame;
let previousTime;

function render() {
  robot.setAttribute('transform', `translate(${x} ${y}) rotate(${heading * 90})`);
}

function setRunning(value, message) {
  running = value;
  drive.textContent = value ? 'Stop' : 'Start';
  status.textContent = message;
  if (value) {
    previousTime = performance.now();
    frame = requestAnimationFrame(tick);
  } else {
    cancelAnimationFrame(frame);
  }
}

function planSegment() {
  const [dx, dy] = directions[heading];
  const nextX = x + dx * spacing;
  const nextY = y + dy * spacing;
  if (points.has(pointKey(nextX, nextY))) {
    segment = { x: nextX, y: nextY, remaining: spacing, kind: 'point' };
  } else {
    segment = {
      x: x + dx * edgeOvershoot,
      y: y + dy * edgeOvershoot,
      remaining: edgeOvershoot,
      kind: 'edge',
      returnX: x,
      returnY: y,
    };
  }
}

function arrive(destination) {
  if (destination.kind === 'edge') {
    heading = (heading + 2) % directions.length;
    segment = {
      x: destination.returnX, y: destination.returnY,
      remaining: edgeOvershoot, kind: 'return',
    };
    return;
  }
  if (destination.kind === 'return') {
    const choices = directions.map(([dx, dy], index) => ({
      index, key: pointKey(x + dx * spacing, y + dy * spacing),
    })).filter(({ key }) => points.has(key));
    heading = choices[Math.floor(Math.random() * choices.length)].index;
    return;
  }

  const color = points.get(pointKey(x, y));
  heading = (heading + colors[color].turn + directions.length) % directions.length;
  if (color === 'yellow') {
    setRunning(false, 'An gelbem Punkt angehalten');
  }
}

function tick(time) {
  let distance = Math.max(0, time - previousTime) / 1000 * speed;
  previousTime = time;
  while (running && distance > 0) {
    if (!segment) planSegment();
    if (distance < segment.remaining) {
      const [dx, dy] = directions[heading];
      x += dx * distance;
      y += dy * distance;
      segment.remaining -= distance;
      break;
    }
    x = segment.x;
    y = segment.y;
    distance -= segment.remaining;
    const destination = segment;
    segment = undefined;
    arrive(destination);
  }
  render();
  if (running) frame = requestAnimationFrame(tick);
}

reset.addEventListener('click', () => {
  for (const { button, x, y } of pointButtons) {
    setPoint(button, x, y, 'black');
  }
});

drive.addEventListener('click', () => {
  setRunning(!running, running ? 'Angehalten' : 'Unterwegs');
});
render();
