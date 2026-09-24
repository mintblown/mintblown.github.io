/* Two uniform-temperature bodies; SI units throughout. RK4, step <= 0.5 s. */
(() => {
  'use strict';
  const capacity = 2700 * 0.05 ** 3 * 900;
  const duration = 7200;
  const byId = id => document.getElementById(id);
  let temperatures = [60, 5], elapsed = 0, running = false, lastFrame = null;
  let history = [[0, 60, 5]], nextSample = 30;
  const rate = ([top, bottom]) => {
    const exchange = 0.5 * (top - bottom);
    return [(-exchange - 0.1 * (top - 20)) / capacity,
      (exchange - 0.08 * (bottom - 20)) / capacity];
  };
  function step(values, dt) {
    const add = (a, b, scale) => a.map((value, i) => value + b[i] * scale);
    const a = rate(values), b = rate(add(values, a, dt / 2));
    const c = rate(add(values, b, dt / 2)), d = rate(add(values, c, dt));
    return values.map((value, i) => value + dt * (a[i] + 2*b[i] + 2*c[i] + d[i]) / 6);
  }
  const x = seconds => 55 + seconds / duration * 640;
  const y = temperature => 245 - temperature / 60 * 210;
  const ns = 'http://www.w3.org/2000/svg';
  function drawElement(tag, attributes, label) {
    const element = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    if (label !== undefined) element.textContent = label;
    byId('chart-grid').append(element);
  }
  for (let t = 0; t <= 60; t += 10) {
    drawElement('line', {x1:55, x2:695, y1:y(t), y2:y(t), stroke:t === 20 ? '#777' : '#eee', 'stroke-dasharray':t === 20 ? '6 5' : 'none'});
    drawElement('text', {x:44, y:y(t)+5, 'text-anchor':'end', fill:'#665f58', 'font-size':14}, t);
  }
  for (let minutes = 0; minutes <= 120; minutes += 20) {
    drawElement('text', {x:x(minutes*60), y:267, 'text-anchor':'middle', fill:'#665f58', 'font-size':14}, minutes);
  }
  drawElement('text', {x:16, y:20, fill:'#665f58', 'font-size':14}, '°C');
  drawElement('text', {x:375, y:285, 'text-anchor':'middle', fill:'#665f58', 'font-size':12}, 'Versuchszeit in Minuten');
  function render() {
    byId('top-temperature').textContent = temperatures[0].toLocaleString('de-DE', {minimumFractionDigits:1, maximumFractionDigits:1}) + ' °C';
    byId('bottom-temperature').textContent = temperatures[1].toLocaleString('de-DE', {minimumFractionDigits:1, maximumFractionDigits:1}) + ' °C';
    const seconds = Math.floor(elapsed);
    byId('clock').textContent = [Math.floor(seconds/3600), Math.floor(seconds/60)%60, seconds%60].map(v => String(v).padStart(2, '0')).join(':');
    const points = [...history, [elapsed, ...temperatures]];
    ['top-curve', 'bottom-curve'].forEach((id, index) => {
      byId(id).setAttribute('d', points.map((point, i) => `${i ? 'L' : 'M'}${x(point[0]).toFixed(2)},${y(point[index+1]).toFixed(2)}`).join(' '));
    });
  }
  function frame(now) {
    if (!running) return;
    if (lastFrame !== null) {
      const target = Math.min(duration, elapsed + (now-lastFrame)/1000);
      while (elapsed < target) {
        const dt = Math.min(0.5, target-elapsed, nextSample-elapsed);
        temperatures = step(temperatures, dt);
        elapsed += dt;
        if (elapsed >= nextSample) { history.push([elapsed, ...temperatures]); nextSample += 30; }
      }
    }
    lastFrame = now;
    render();
    if (elapsed >= duration) {
      running = false;
      byId('start').disabled = true;
      byId('start').textContent = 'Beendet';
      byId('status').textContent = 'Zwei Versuchsstunden sind vorbei. Beide Würfel nähern sich weiter der Raumtemperatur von 20 °C.';
    } else animationId = requestAnimationFrame(frame);
  }
  let animationId;
  // Cancel queued callbacks before starting a new animation chain.
  function pause(message) {
    running = false;
    cancelAnimationFrame(animationId);
    lastFrame = null;
    byId('start').textContent = 'Fortsetzen';
    byId('status').textContent = message;
  }
  byId('start').addEventListener('click', () => {
    if (running) { pause('Pausiert. Beobachte die Temperaturen oder setze den Versuch fort.'); return; }
    running = true; lastFrame = null;
    byId('start').textContent = 'Pause';
    byId('status').textContent = 'Der Versuch läuft in Echtzeit.';
    animationId = requestAnimationFrame(frame);
  });
  byId('reset').addEventListener('click', () => {
    pause('Zurückgesetzt. Beide Würfel haben wieder ihre Starttemperaturen.');
    temperatures = [60, 5]; elapsed = 0; history = [[0, 60, 5]]; nextSample = 30;
    byId('start').disabled = false; byId('start').textContent = 'Start'; render();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) pause('Pausiert, weil die Seite im Hintergrund war. Mit „Fortsetzen“ geht es weiter.');
  });
  render();
})();
