'use strict';
const Wurf = (() => {
  const rad = angle => angle * Math.PI / 180;
  function parse(text) {
    if (!text.trim()) return null;
    const normalized = text.trim().replace(',', '.');
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized) && Number.isFinite(Number(normalized)) ? Number(normalized) : NaN;
  }
  function validate(values) {
    if (Object.values(values).some(value => value !== null && !Number.isFinite(value))) return 'Bitte gib gültige Zahlen ein. Dezimalzahlen dürfen ein Komma enthalten.';
    if (values.angle !== null && (values.angle < 0 || values.angle > 90)) return 'Der Abwurfwinkel muss zwischen 0° und 90° liegen.';
    if (['vx', 'vy'].some(key => values[key] !== null && values[key] < 0)) return 'Für diesen Wurf nach rechts oben müssen vₓ und vᵧ mindestens 0 m/s sein.';
    if (['vx', 'vy'].some(key => values[key] !== null && values[key] > 10)) return 'Jede Geschwindigkeitskomponente darf höchstens 10,0 m/s betragen.';
    return '';
  }
  function solve(values) {
    const error = validate(values);
    if (error) return { error };
    const missing = Object.keys(values).filter(key => values[key] === null);
    if (missing.length !== 1) return { error: 'Fülle genau zwei Felder aus und lasse das gesuchte Feld leer.' };
    const key = missing[0];
    const {angle, vx, vy} = values;
    let value;
    if (key === 'angle') {
      if (vx === 0 && vy === 0) return { error: 'Bei vₓ = vᵧ = 0 gibt es keine Richtung. Der Winkel ist nicht bestimmbar.' };
      value = Math.atan2(vy, vx) * 180 / Math.PI;
    } else if (key === 'vx') {
      if (angle === 0) return { error: vy === 0 ? 'Bei 0° und vᵧ = 0 ist vₓ nicht eindeutig bestimmbar.' : 'Bei 0° muss vᵧ = 0 sein. Diese Angaben passen nicht zusammen.' };
      value = angle === 90 ? 0 : vy / Math.tan(rad(angle));
    } else {
      if (angle === 90) return { error: vx === 0 ? 'Bei 90° und vₓ = 0 ist vᵧ nicht eindeutig bestimmbar.' : 'Bei 90° muss vₓ = 0 sein. Diese Angaben passen nicht zusammen.' };
      value = angle === 0 ? 0 : vx * Math.tan(rad(angle));
    }
    if (!Number.isFinite(value)) return { error: 'Für diese Angaben ist keine endliche Geschwindigkeit berechenbar.' };
    if (key !== 'angle' && value > 10 + 1e-10) return { error: 'Der berechnete Wert überschreitet das Achsenmaximum von 10,0 m/s. Passe die Eingaben an.' };
    return { key, value: key === 'angle' ? value : Math.min(10, value) };
  }
  function check({angle, vx, vy}) {
    if (vx === 0 && vy === 0) return { kind: 'neutral', text: 'Bei vₓ = vᵧ = 0 ist die Geschwindigkeit null; ein Abwurfwinkel ist nicht definiert.' };
    const actual = Math.atan2(vy, vx) * 180 / Math.PI;
    const matches = Math.abs(actual - angle) <= 0.1;
    return {kind: matches ? 'success' : 'warning', actual, text: matches ? 'Die Werte passen zusammen (Winkeltoleranz: 0,1°).' : `Der eingegebene Winkel passt nicht zu den Komponenten. Aus vₓ und vᵧ folgt ein Winkel von ${actual.toLocaleString('de-DE', {minimumFractionDigits: 1, maximumFractionDigits: 1})}° (Toleranz: 0,1°).`};
  }
  function flight(vx, vy) {
    const gravity = 9.81;
    const height = 1.5;
    const duration = (vy + Math.sqrt(vy * vy + 2 * gravity * height)) / gravity;
    return { duration, range: vx * duration,
      position: time => ({x: vx * Math.min(duration, Math.max(0, time)), y: Math.max(0, height + vy * Math.min(duration, Math.max(0, time)) - gravity / 2 * Math.min(duration, Math.max(0, time)) ** 2)}) };
  }
  return { parse, validate, solve, check, flight };
})();
