'use strict';
const SIZE = 256;
const engine = new LifeEngine(SIZE);
let preview = [];
const canvas = document.getElementById('life');
const context = canvas.getContext('2d', { alpha: false });
const pixels = context.createImageData(SIZE, SIZE);
const toggle = document.getElementById('toggle');
const speed = document.getElementById('speed');
let running = false;
let frame = null;
let lastTime = null;
let elapsed = 0;


function draw() {
  for (let i = 0; i < engine.current.length; i++) {
    const offset = i * 4;
    pixels.data[offset] = engine.current[i] ? 164 : 16;
    pixels.data[offset + 1] = engine.current[i] ? 232 : 25;
    pixels.data[offset + 2] = engine.current[i] ? 167 : 22;
    pixels.data[offset + 3] = 255;
  }
  for (const [x, y] of preview) {
    const offset = (((y + SIZE) % SIZE) * SIZE + (x + SIZE) % SIZE) * 4;
    pixels.data[offset] = 255; pixels.data[offset + 1] = 170; pixels.data[offset + 2] = 76;
  }
  context.putImageData(pixels, 0, 0);
}

function animate(time) {
  if (!running) return;
  if (lastTime !== null) elapsed += Math.min(time - lastTime, 250);
  lastTime = time;
  const interval = 1000 / Number(speed.value);
  let steps = 0;
  while (elapsed >= interval && steps < 8) {
    engine.step(); elapsed -= interval; steps++;
  }
  if (steps) draw();
  if (steps === 8) elapsed %= interval;
  frame = requestAnimationFrame(animate);
}

function pause() {
  running = false;
  cancelAnimationFrame(frame);
  frame = null; lastTime = null; elapsed = 0;
  toggle.textContent = 'Start';
  toggle.setAttribute('aria-pressed', 'false');
}

toggle.addEventListener('click', () => {
  if (running) { pause(); return; }
  running = true;
  toggle.textContent = 'Pause';
  toggle.setAttribute('aria-pressed', 'true');
  frame = requestAnimationFrame(animate);
});

function reset() {
  pause();
  for (let i = 0; i < engine.current.length; i++) engine.current[i] = canvas.dataset.initial === 'empty' ? 0 : (Math.random() < 0.5 ? 1 : 0);
  engine.next.fill(0);
  preview = [];
  canvas.dispatchEvent(new Event('boardreset'));
  draw();
}
document.getElementById('reset').addEventListener('click', reset);
speed.addEventListener('input', () => {
  speed.setAttribute('aria-valuetext', `${speed.value} Generationen pro Sekunde`);
  elapsed = 0; lastTime = null;
});
document.addEventListener('visibilitychange', () => { lastTime = null; elapsed = 0; });
reset();

const lifeBoard = {
  restore(points) {
    pause();
    engine.current.fill(0); engine.next.fill(0);
    this.add(points);
  },
  preview(points) { preview = points; draw(); },
  add(points) {
    for (const [x, y] of points) engine.current[((y + SIZE) % SIZE) * SIZE + (x + SIZE) % SIZE] = 1;
    preview = []; draw();
  }
};
