(() => {
  'use strict';
  const get = id => document.getElementById(`curve-${id}`);
  const fmt = value => (Math.abs(value) < 1e-12 ? 0 : value).toLocaleString('de-DE', { maximumSignificantDigits: 5 });
  const parse = text => {
    const cleaned = text.trim().replace(',', '.');
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(cleaned) ? Number(cleaned) : NaN;
  };
  let model = null;
  function sample(m, t) {
    const phase = m.omega * (t - m.origin) + m.phase;
    return [m.rest + m.amplitude * Math.sin(phase), m.amplitude * m.omega * Math.sin(phase + Math.PI / 2), m.amplitude * m.omega ** 2 * Math.sin(phase + Math.PI)];
  }
  function configure() {
    const maxima = get('mode').value === 'maxima';
    ['t1', 't2'].forEach(id => { get(id).disabled = !maxima; });
    ['period', 'phase'].forEach(id => { get(id).readOnly = maxima; });
    update();
  }
  function update() {
    const maxima = get('mode').value === 'maxima';
    const fields = ['rest', 'amplitude', ...(maxima ? ['t1', 't2'] : ['period', 'phase'])];
    const values = {};
    const errors = [];
    ['rest', 'amplitude', 't1', 't2', 'period', 'phase'].forEach(id => get(id).setAttribute('aria-invalid', 'false'));
    fields.forEach(id => {
      values[id] = parse(get(id).value);
      if (!Number.isFinite(values[id])) { errors.push('Bitte fülle alle aktiven Felder mit endlichen Zahlen aus (Komma oder Punkt sind möglich).'); get(id).setAttribute('aria-invalid', 'true'); }
    });
    if (values.amplitude < 0) { errors.push('Die Amplitude muss mindestens 0 sein.'); get('amplitude').setAttribute('aria-invalid', 'true'); }
    if (maxima && (values.t1 < 0 || !(values.t2 > values.t1))) {
      errors.push('Für die Maxima muss 0 ≤ t₁ < t₂ gelten.');
      get('t1').setAttribute('aria-invalid', 'true'); get('t2').setAttribute('aria-invalid', 'true');
    }
    const period = maxima ? values.t2 - values.t1 : values.period;
    if (!maxima && period <= 0) { errors.push('Die Schwingungsdauer muss größer als 0 sein.'); get('period').setAttribute('aria-invalid', 'true'); }
    const omega = 2 * Math.PI / period;
    const phase0 = maxima ? Math.PI / 2 - omega * values.t1 : values.phase;
    const start = maxima ? Math.max(0, values.t1 - period / 2) : 0;
    const end = start + 2.5 * period;
    const scale = Math.max(Math.abs(values.rest), values.amplitude);
    if (!errors.length && (![omega, phase0, end, values.amplitude * omega ** 2, scale * 3].every(Number.isFinite) || end <= start || omega <= 0)) {
      errors.push('Diese Werte liegen außerhalb des darstellbaren Zahlenbereichs. Bitte wähle kleinere Werte oder eine größere Schwingungsdauer.');
    }
    get('status').dataset.error = String(errors.length > 0);
    get('view').hidden = errors.length > 0;
    if (errors.length) {
      model = null;
      get('status').textContent = [...new Set(errors)].join(' ');
      if (maxima) { get('period').value = ''; get('phase').value = ''; }
      return;
    }
    if (maxima) {
      get('period').value = String(Number(period.toPrecision(12))).replace('.', ',');
      // An equivalent phase in [-pi, pi) is easier to read and reuse in manual mode.
      const normalized = ((phase0 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      get('phase').value = String(Number(normalized.toPrecision(12))).replace('.', ',');
    }
    model = { rest: values.rest, amplitude: values.amplitude, omega, period, start, end, origin: maxima ? values.t1 : 0, phase: maxima ? Math.PI / 2 : values.phase, maxima, t1: values.t1, t2: values.t2, unit: get('unit').value };
    get('status').textContent = `T = ${fmt(period)} s · ω = ${fmt(omega)} rad/s · φ₀ = ${get('phase').value} rad.${values.amplitude === 0 ? ' Bei Amplitude 0 gibt es keine Schwingung und keine unterscheidbaren Maxima.' : ''}`;
    draw();
  }
  function draw() {
    if (!model) return;
    const m = model;
    const left = 112, right = 855, width = right - left;
    const tx = t => left + (t - m.start) / (m.end - m.start) * width;
    const cursor = m.start + Number(get('cursor').value) / 1000 * (m.end - m.start);
    const names = ['Position y', 'Geschwindigkeit v', 'Beschleunigung a'];
    const units = [m.unit, `${m.unit}/s`, `${m.unit}/s²`];
    const amplitudes = [m.amplitude, m.amplitude * m.omega, m.amplitude * m.omega ** 2];
    const colors = ['#266d80', '#986224', '#6a5091'];
    let svg = '<title id="curve-title">Position, Geschwindigkeit und Beschleunigung</title><desc id="curve-description">Drei aus deinen Eingaben berechnete Sinuskurven mit gemeinsamer Zeitachse. Die genauen Werte am gewählten Zeitpunkt stehen unter dem Diagramm.</desc><defs><marker id="curve-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#344653" stroke-width="1.5"/></marker></defs><rect width="900" height="870" fill="white"/>';
    for (let panel = 0; panel < 3; panel++) {
      const top = 30 + panel * 285, bottom = top + 205;
      const center = panel === 0 ? m.rest : 0;
      const amplitude = amplitudes[panel];
      const padding = (amplitude || Math.abs(center) * .1 || 1) * .2;
      const low = Math.min(0, center - amplitude) - padding;
      const high = Math.max(0, center + amplitude) + padding;
      const py = value => bottom - (value - low) / (high - low) * (bottom - top);
      for (let i = 0; i <= 4; i++) {
        const value = low + (high - low) * i / 4, y = py(value);
        svg += `<path d="M${left} ${y}H${right}" stroke="#e0e6eb"/><text x="${left - 10}" y="${y + 5}" text-anchor="end">${fmt(value)}</text>`;
      }
      for (let i = 0; i <= 5; i++) {
        const t = m.start + (m.end - m.start) * i / 5, x = tx(t);
        svg += `<path d="M${x} ${top}V${bottom}" stroke="#e0e6eb"/><text x="${x}" y="${bottom + 22}" text-anchor="middle">${fmt(t)}</text>`;
      }
      svg += `<path d="M${left} ${bottom + 2}V${top - 10} M${left} ${py(0)}H${right + 10}" stroke="#344653" fill="none" marker-end="url(#curve-arrow)"/>`;
      svg += `<path d="M${left} ${bottom}V${top - 10}" stroke="#344653" marker-end="url(#curve-arrow)"/>`;
      svg += `<text transform="translate(22 ${(top + bottom) / 2}) rotate(-90)" text-anchor="middle" font-weight="700">${names[panel]} / ${units[panel]}</text><text x="${(left + right) / 2}" y="${bottom + 48}" text-anchor="middle">Zeit t / s</text>`;
      if (panel === 0) {
        svg += `<path d="M${left} ${py(m.rest)}H${right}" stroke="#6d7d83" stroke-dasharray="7 5"/><text x="${right - 5}" y="${py(m.rest) - 7}" text-anchor="end">Ruhelage ${fmt(m.rest)} ${m.unit}</text>`;
      }
      if (m.maxima) for (const [index, t] of [m.t1, m.t2].entries()) {
        svg += `<path d="M${tx(t)} ${top}V${bottom}" stroke="#9aa9b3" stroke-dasharray="3 5"/>`;
        if (panel === 0) svg += `<text x="${tx(t) + 5}" y="${top + 16}">t${index === 0 ? '₁' : '₂'}</text>`;
      }
      let path = '';
      for (let i = 0; i <= 500; i++) {
        const t = m.start + (m.end - m.start) * i / 500;
        path += `${i ? 'L' : 'M'}${tx(t).toFixed(2)} ${py(sample(m, t)[panel]).toFixed(2)} `;
      }
      svg += `<path d="${path}" fill="none" stroke="${colors[panel]}" stroke-width="2.8"/><path d="M${tx(cursor)} ${top}V${bottom}" stroke="#344653" stroke-dasharray="5 4"/><circle cx="${tx(cursor)}" cy="${py(sample(m, cursor)[panel])}" r="5" fill="${colors[panel]}"/>`;
    }
    document.getElementById('measurement-plot').innerHTML = `<g font-family="Arial, sans-serif" font-size="14" fill="#344653">${svg}</g>`;
    const current = sample(m, cursor);
    get('readout').textContent = `t = ${fmt(cursor)} s · y = ${fmt(current[0])} ${m.unit} · v = ${fmt(current[1])} ${m.unit}/s · a = ${fmt(current[2])} ${m.unit}/s²`;
    get('cursor').setAttribute('aria-valuetext', `${fmt(cursor)} Sekunden`);
  }
  ['rest', 'amplitude', 't1', 't2', 'period', 'phase'].forEach(id => get(id).addEventListener('input', update));
  get('mode').addEventListener('change', configure);
  get('unit').addEventListener('change', update);
  get('cursor').addEventListener('input', draw);
  configure();
})();
