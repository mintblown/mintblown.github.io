/* Shared physics and input handling. Classic script: also works through file://. */
(function (root) {
  'use strict';
  const number = value => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string' || !/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value.trim())) return null;
    const n = Number(value.trim().replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const positive = n => typeof n === 'number' && Number.isFinite(n) && n > 0;
  function drive(length, axle, wheel) {
    if (![length, axle, wheel].every(positive)) return null;
    const turns = length / (2 * Math.PI * axle);
    const circumference = 2 * Math.PI * wheel;
    return { turns, circumference, distance: turns * circumference };
  }
  // This ratio describes an ideal force transmission, never a guaranteed drive force.
  function transmission(length, windingRadius, wheelRadius, stringForce) {
    const result = drive(length, windingRadius, wheelRadius);
    if (!result || !positive(stringForce)) return null;
    return { ...result, groundForce: stringForce * windingRadius / wheelRadius };
  }
  function lever(f1, l1, f2, l2) {
    if (![f1, l1, f2, l2].every(positive)) return null;
    const left = f1 * l1, right = f2 * l2;
    return { left, right, difference: left - right, relative: Math.abs(left - right) / ((left + right) / 2) * 100 };
  }
  function ramp(s, h, force, weight) {
    if (![s, h, force, weight].every(positive) || h >= s) return null;
    return { pullWork: force * s, liftWork: weight * h, difference: force * s - weight * h,
      grade: h / Math.sqrt(s * s - h * h) * 100 };
  }
  // Qualitative indicators have no unit and cannot be interpreted as real distances.
  function friction(bearing, rolling, grip) {
    const values = [bearing, rolling, grip];
    if (!values.every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100)) return null;
    return { losses: (bearing + rolling) / 2, slipping: grip < 40,
      resistance: bearing + rolling > 130, usefulGrip: grip >= 40 };
  }
  function trial(length, axle, wheel, unwind, total) {
    const prediction = drive(length, axle, wheel);
    if (!prediction || !positive(unwind) || !positive(total) || total < unwind) return null;
    return { ...prediction, afterRoll: total - unwind, difference: total - prediction.distance,
      unwindDifference: unwind - prediction.distance };
  }
  const api = { number, drive, transmission, lever, ramp, friction, trial };
  root.TrapModel = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
