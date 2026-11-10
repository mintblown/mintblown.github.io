'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const fmt = (n, digits = 2) => n.toLocaleString('de-DE', {minimumFractionDigits: digits, maximumFractionDigits: digits});
  const density = $('density'), launch = $('launch'), record = $('record');
  let mu = Number(density.value) / 1000, running = false, start = 0, frame = 0, elapsed = 0, result = null;
  const rows = [];
  const pulse = x => Math.abs(x) < .55 ? .5 * (1 + Math.cos(Math.PI * x / .55)) : 0;
  function draw(t = 0) {
    const c = Math.sqrt(1 / mu), distance = c * t;
    // Incident pulse plus its negative mirror enforces zero displacement at x = 10.
    const y = x => t === 0 || distance >= 20 ? 125 : 125 - 53 * (pulse(x - distance) - pulse(x - (20 - distance)));
    let path = '';
    for (let i = 0; i <= 400; i++) { const x = i / 40; path += `${i ? 'L' : 'M'}${50 + 70 * x},${y(x)} `; }
    $('wave').setAttribute('d', path);
    $('beads').innerHTML = Array.from({length: 39}, (_, i) => {const x = (i + 1) / 4; return `<circle cx="${50 + x * 70}" cy="${y(x)}" r="${2 + 4 * Math.sqrt(mu)}" fill="${i === 19 ? '#b25827' : '#41698e'}"/>`;}).join('');
  }
  function tick(now) {
    if (!running) return;
    const t1 = 10 * Math.sqrt(mu), t2 = 2 * t1;
    elapsed = Math.min((now - start) / 1000, t2);
    $('elapsed').textContent = `${fmt(elapsed)} s`;
    draw(elapsed);
    if (elapsed >= t1) $('t1').textContent = `${fmt(t1)} s`;
    if (elapsed >= t2) {
      running = false; result = {mu, t1, t2};
      $('t2').textContent = `${fmt(t2)} s`;
      $('status').textContent = 'Messung abgeschlossen. Der Impuls wurde links aufgenommen. Übernimm die Werte oder starte einen neuen Versuch.';
      record.disabled = false; launch.disabled = false; density.disabled = false;
    } else {
      if (elapsed >= t1 && !$('status').dataset.reflected) { $('status').textContent = 'Rechtes Ende erreicht: Der umgekehrte Impuls läuft zurück.'; $('status').dataset.reflected = 'true'; }
      frame = requestAnimationFrame(tick);
    }
  }
  function reset() {
    cancelAnimationFrame(frame); running = false; result = null; elapsed = 0;
    density.disabled = false; launch.disabled = false; record.disabled = true;
    $('elapsed').textContent = '0,00 s'; $('t1').textContent = '—'; $('t2').textContent = '—';
    delete $('status').dataset.reflected;
    $('status').textContent = 'Bereit. Wähle eine Massenbelegung und löse einen Impuls aus.';
    draw();
  }
  density.addEventListener('input', () => {mu = Number(density.value) / 1000; $('density-value').textContent = `${fmt(mu, 3)} kg/m`; reset();});
  launch.addEventListener('click', () => {reset(); running = true; launch.disabled = true; density.disabled = true; start = performance.now(); $('status').textContent = 'Der Impuls läuft nach rechts. Die Uhr läuft ab dem Auslösen.'; frame = requestAnimationFrame(tick);});
  $('reset').addEventListener('click', reset);
  function plot() {
    const x = m => 75 + m * 680, y = t => 320 - t * 13;
    let svg = '<title>Laufzeiten über der Massenbelegung</title><desc>Blaue Kreise zeigen die Zeit für 10 Meter, orange Rauten die Gesamtzeit für 20 Meter.</desc>';
    for (let t = 0; t <= 20; t += 5) svg += `<path d="M75 ${y(t)}H755" stroke="#dce5ee"/><text x="62" y="${y(t) + 5}" text-anchor="end">${t}</text>`;
    for (let m = 0; m <= 1.001; m += .2) svg += `<path d="M${x(m)} 60V320" stroke="#dce5ee"/><text x="${x(m)}" y="344" text-anchor="middle">${fmt(m, 1)}</text>`;
    svg += '<path d="M75 52V320H765" fill="none" stroke="#596778" stroke-width="2"/><text x="75" y="30">Laufzeit t in s</text><text x="755" y="380" text-anchor="end">Massenbelegung μ in kg/m</text>';
    for (const r of rows) svg += `<circle cx="${x(r.mu)}" cy="${y(r.t1)}" r="5" fill="#41698e"><title>μ = ${fmt(r.mu,3)} kg/m; t₁ = ${fmt(r.t1)} s</title></circle><path d="M${x(r.mu)} ${y(r.t2)-6}l6 6-6 6-6-6Z" fill="#b25827"><title>μ = ${fmt(r.mu,3)} kg/m; t₂ = ${fmt(r.t2)} s</title></path>`;
    $('plot').innerHTML = svg;
  }
  function table() {
    $('measurements').innerHTML = rows.length ? rows.map((r,i) => `<tr><td>${i+1}</td><td>${fmt(r.mu,3)}</td><td>${fmt(r.t1)}</td><td>${fmt(r.t2)}</td></tr>`).join('') : '<tr><td colspan="4">Noch keine Messwerte übernommen.</td></tr>';
    $('clear').disabled = $('download').disabled = !rows.length; plot();
  }
  record.addEventListener('click', () => {if (!result) return; rows.push({...result}); record.disabled = true; $('status').textContent = `Messung ${rows.length} übernommen. Wähle eine andere Massenbelegung für den nächsten Versuch.`; table();});
  $('clear').addEventListener('click', () => {rows.length = 0; table(); $('status').textContent = 'Messreihe gelöscht.';});
  $('download').addEventListener('click', () => {
    const csv = '\ufeffμ in kg/m;t1 in s (10 m);t2 in s (20 m)\n' + rows.map(r => [fmt(r.mu,3),fmt(r.t1),fmt(r.t2)].join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = 'saitenschwingungen-messwerte.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  draw(); plot();
})();

// Separate measurement series for the guitar experiment.
(() => {
  const $ = id => document.getElementById(id);
  const rows = [];
  const fmt = n => n.toLocaleString('de-DE', {maximumFractionDigits: 6});
  function axisMax(value) {
    const power = 10 ** Math.floor(Math.log10(value));
    return Math.ceil(value / power) * power;
  }
  function render() {
    $('length-measurements').innerHTML = rows.length ? rows.map((r, i) => `<tr><td>${i + 1}</td><td>${fmt(r.length)}</td><td>${fmt(r.frequency)}</td><td><button type="button" class="secondary" data-remove="${i}" aria-label="Messwert ${i + 1} entfernen">Entfernen</button></td></tr>`).join('') : '<tr><td colspan="4">Noch keine Messwerte eingetragen.</td></tr>';
    $('length-clear').disabled = !rows.length;
    const xmax = axisMax(Math.max(.7, ...rows.map(r => r.length)) * 1.1);
    const ymax = axisMax(Math.max(100, ...rows.map(r => r.frequency)) * 1.1);
    const x = value => 85 + 655 * value / xmax;
    const y = value => 320 - 260 * value / ymax;
    let svg = '<title>Frequenz und Saitenlänge</title><desc>Messpunkte der eingegebenen Grundfrequenz in Hertz über der schwingenden Länge in Metern.</desc>';
    for (let i = 0; i <= 5; i++) {
      const lx = xmax * i / 5, fy = ymax * i / 5;
      svg += `<path d="M${x(lx)} 60V320 M85 ${y(fy)}H740" stroke="#dce5ee" fill="none"/><text x="${x(lx)}" y="344" text-anchor="middle">${fmt(Number(lx.toPrecision(6)))}</text><text x="73" y="${y(fy) + 5}" text-anchor="end">${fmt(Number(fy.toPrecision(6)))}</text>`;
    }
    svg += '<path d="M85 52V320H750" fill="none" stroke="#596778" stroke-width="2"/><text x="85" y="30">Grundfrequenz f in Hz</text><text x="740" y="380" text-anchor="end">Schwingende Länge L in m</text>';
    for (const r of rows) svg += `<circle cx="${x(r.length)}" cy="${y(r.frequency)}" r="6" fill="#41698e"><title>L = ${fmt(r.length)} m; f = ${fmt(r.frequency)} Hz</title></circle>`;
    $('length-plot').innerHTML = svg;
  }
  $('length-form').addEventListener('submit', event => {
    event.preventDefault();
    const length = $('length-input').valueAsNumber, frequency = $('frequency-input').valueAsNumber;
    if (!Number.isFinite(length) || !Number.isFinite(frequency) || length <= 0 || frequency <= 0) {
      $('length-status').textContent = 'Gib für Länge und Frequenz jeweils eine positive Zahl ein.';
      return;
    }
    rows.push({length, frequency}); render();
    $('length-status').textContent = `Messwert ${rows.length} übernommen. Du kannst die nächste Messung eintragen.`;
    $('length-input').focus();
  });
  $('length-measurements').addEventListener('click', event => {
    const button = event.target.closest('button[data-remove]');
    if (!button) return;
    rows.splice(Number(button.dataset.remove), 1); render();
    $('length-status').textContent = 'Messwert entfernt.';
  });
  $('length-clear').addEventListener('click', () => {
    rows.length = 0; render(); $('length-status').textContent = 'Messreihe gelöscht.';
  });
  render();
})();
