'use strict';

const stations = {
  basecamp: { name: 'Marktplatz', x: 714, y: 476, color: '#e5b67c' },
  kraftpfeile: { name: 'Kraftpfeile', x: 372, y: 223, color: '#1687ed' },
  'kraft-und-weg': { name: 'Kraft und Weg', x: 981, y: 222, color: '#e13d43' },
  hebel: { name: 'Hebel', x: 484, y: 623, color: '#f3a51c' },
  'goldene-regel': { name: 'Goldene Regel', x: 1203, y: 581, color: '#4dbd56' },
  flaschenzug: { name: 'Flaschenzug', x: 1197, y: 764, color: '#9653d6' },
  'pruefung-rot': { name: 'Prüfung Rot', color: '#e13d43', level: 1 },
  'pruefung-gruen': { name: 'Prüfung Grün', color: '#4dbd56', level: 2 },
  'pruefung-violett': { name: 'Prüfung Violett', color: '#9653d6', level: 3 }
};
const roads = [
  { from: 'basecamp', to: 'kraftpfeile' },
  { from: 'basecamp', to: 'hebel' },
  { from: 'basecamp', to: 'kraft-und-weg', gate: 'pruefung-rot', level: 1, fraction: 0.58 },
  { from: 'kraft-und-weg', to: 'goldene-regel', gate: 'pruefung-gruen', level: 2, fraction: 0.53 },
  { from: 'goldene-regel', to: 'flaschenzug', gate: 'pruefung-violett', level: 3, fraction: 0.55 }
];
const traveller = document.querySelector('#traveller');
const lesson = document.querySelector('#lesson');
const mapStatus = document.querySelector('#status');
const progressLabel = document.querySelector('#progress-label');
let current = 'basecamp';
let progress = ForceModel.readProgress(location.search);
let moving = false;
let animationVersion = 0;
const buttons = new Map();

function place({ x, y }) {
  traveller.style.left = `${x / 1536 * 100}%`;
  traveller.style.top = `${y / 1024 * 100}%`;
}

function saveProgress() {
  const url = new URL(location.href);
  if (url.searchParams.get('progress') === String(progress)) return;
  url.searchParams.set('progress', progress);
  try { history.replaceState(null, '', url.href); }
  catch { location.replace(url.href); }
}

function update() {
  const reachable = ForceModel.transitions(current, progress, roads).map(step => step.target);
  buttons.forEach((button, id) => {
    const station = stations[id];
    button.disabled = moving || !reachable.includes(id);
    const passed = station.level && progress >= station.level;
    button.classList.toggle('passed', Boolean(passed));
    button.setAttribute('aria-label', `Zu ${station.name} reisen${passed ? ' (bestanden)' : ''}`);
    button.title = `${station.name}${passed ? ' · bestanden' : ''}`;
  });
  lesson.hidden = moving || current === 'basecamp';
  lesson.textContent = stations[current].level ? 'Prüfung starten' : 'Lektion starten';
  progressLabel.textContent = `${progress} / 3 Prüfungen bestanden`;
}

function describePosition() {
  const station = stations[current];
  mapStatus.textContent = current === 'basecamp'
    ? 'Du bist auf dem Marktplatz. Die Prüfung auf dem roten Pfad öffnet den weiteren Weg.'
    : station.level && progress < station.level
      ? `Du bist bei „${station.name}“. Bestehe alle drei Aufgaben, um weiterzugehen. Der Rückweg bleibt offen.`
      : `Du bist bei „${station.name}“. ${station.level ? 'Die Prüfung ist bestanden.' : 'Entdecke die Lektion.'} Folge einem blinkenden Punkt, um weiterzureisen.`;
}

async function travel(target) {
  if (moving) return;
  const step = ForceModel.transitions(current, progress, roads).find(step => step.target === target);
  if (!step) return;
  const version = ++animationVersion;
  moving = true;
  update();
  mapStatus.textContent = `Unterwegs zu ${stations[target].name} …`;
  const path = step.road.path;
  const length = path.getTotalLength();
  const distance = length * Math.abs(step.end - step.start);
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.max(700, distance * 4);
  await new Promise(resolve => {
    let start;
    function frame(time) {
      if (version !== animationVersion) return resolve();
      start ??= time;
      const amount = duration ? Math.min((time - start) / duration, 1) : 1;
      const eased = amount * amount * (3 - 2 * amount);
      place(path.getPointAtLength((step.start + (step.end - step.start) * eased) * length));
      if (amount < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
  if (version !== animationVersion) return;
  current = target;
  moving = false;
  place(stations[current]);
  update();
  describePosition();
  if (current !== 'basecamp') lesson.focus({ preventScroll: true });
  else document.querySelector('.destination:not(:disabled)')?.focus({ preventScroll: true });
}

function init() {
  try {
    const svg = document.querySelector('#overlay svg');
    if (!svg) throw new Error('Lernpfad-Overlay fehlt');
    roads.forEach(road => {
      const path = svg.querySelector(`#weg-${road.to}`);
      if (road.from === 'basecamp') {
        path.setAttribute('d', path.getAttribute('d').replace(/^M\s*([\d.]+)[,\s]+([\d.]+)/, 'M 714,476 L $1,$2'));
      }
      road.path = path;
      if (road.gate) {
        const point = path.getPointAtLength(path.getTotalLength() * road.fraction);
        Object.assign(stations[road.gate], { x: point.x, y: point.y });
      }
    });
    Object.entries(stations).forEach(([id, station]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `destination${station.level ? ' exam-destination' : ''}`;
      button.style.left = `${station.x / 1536 * 100}%`;
      button.style.top = `${station.y / 1024 * 100}%`;
      button.style.setProperty('--color', station.color);
      if (station.level) button.innerHTML = '<img src="assets/pruefung.png" alt=""><span class="exam-check" aria-hidden="true">✓</span>';
      button.addEventListener('click', () => travel(id));
      buttons.set(id, button);
      document.querySelector('#destinations').append(button);
    });
    lesson.addEventListener('click', () => {
      if (moving || current === 'basecamp') return;
      const station = stations[current];
      ForceLessons.open(current, station.name, station.level || 0, level => {
        if (level !== progress + 1) return;
        progress = level;
        saveProgress();
        update();
        describePosition();
      }, progress);
    });
    addEventListener('popstate', () => {
      animationVersion++;
      moving = false;
      current = 'basecamp';
      progress = ForceModel.readProgress(location.search);
      ForceLessons.close();
      place(stations[current]);
      update();
      describePosition();
    });
    place(stations[current]);
    saveProgress();
    update();
    describePosition();
  } catch (error) {
    mapStatus.textContent = 'Die Lernlandkarte konnte nicht geladen werden. Bitte lade die Seite erneut.';
    console.error(error);
  }
}
init();
