'use strict';

// Shared, DOM-independent rules for exercises, examinations and map gates.
const ForceModel = (() => {
  const close = (value, expected, tolerance = 0.05) =>
    Number.isFinite(Number(value)) && value !== '' && value != null && Math.abs(Number(value) - expected) <= tolerance;
  const vector = (value, x, y) => Boolean(value) && close(value.x, x, 0.15) && close(value.y, y, 0.15);
  function readProgress(search) {
    const value = new URLSearchParams(search).get('progress');
    return /^[0-3]$/.test(value ?? '') ? Number(value) : 0;
  }
  function ramp(length, weight = 120, height = 1.5) {
    return { force: weight * height / length, work: weight * height };
  }
  function pulley(ropes, weight = 240, height = 1) {
    return { force: weight / ropes, distance: height * ropes, work: weight * height };
  }
  function gradeExam(level, answers) {
    if (level === 1) return [close(answers.newtons, 2500), vector(answers.arrow, 4, 0), vector(answers.sum, 3, 4)];
    if (level === 2) return [close(answers.length, 6), close(answers.force, 45), answers.explanation === 'longer'];
    if (level === 3) return [close(answers.work, 180), close(answers.distance, 4), close(answers.force, 60)];
    return [false, false, false];
  }
  // Passed gates can be crossed in one walk; an unpassed gate is the destination.
  function transitions(current, progress, roads) {
    return roads.flatMap(road => {
      const { from, to, gate, level, fraction = 0.55 } = road;
      const locked = gate && progress < level;
      if (current === from) return [{ target: locked ? gate : to, road, start: 0, end: locked ? fraction : 1 }];
      if (current === to) return [{ target: locked ? gate : from, road, start: 1, end: locked ? fraction : 0 }];
      if (gate && current === gate) return [
        { target: from, road, start: fraction, end: 0 },
        ...(!locked ? [{ target: to, road, start: fraction, end: 1 }] : [])
      ];
      return [];
    });
  }
  return { close, vector, readProgress, ramp, pulley, gradeExam, transitions };
})();
