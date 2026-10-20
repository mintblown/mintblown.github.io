// Run after model.js, in a browser or a JavaScript engine with URLSearchParams.
(() => {
  const assert = (condition, label) => { if (!condition) throw new Error(label); };
  const roads = [
    { from: 'camp', to: 'blue' }, { from: 'camp', to: 'orange' },
    { from: 'camp', to: 'red', gate: 'exam1', level: 1, fraction: .58 },
    { from: 'red', to: 'green', gate: 'exam2', level: 2, fraction: .53 },
    { from: 'green', to: 'purple', gate: 'exam3', level: 3, fraction: .55 }
  ];
  const reachable = (from, progress) => ForceModel.transitions(from, progress, roads).map(s => s.target);
  assert(reachable('camp', 0).join() === 'blue,orange,exam1', 'Red examination must replace red destination');
  for (let level = 1; level <= 3; level++) {
    const road = roads[level + 1];
    assert(reachable(road.from, level - 1).includes(road.gate), `Gate ${level} reachable`);
    assert(!reachable(road.from, level - 1).includes(road.to), `Gate ${level} blocks destination`);
    assert(reachable(road.gate, level - 1).length === 1, `Unpassed gate ${level} only permits retreat`);
    assert(reachable(road.gate, level - 1)[0] === road.from, `Gate ${level} permits retreat`);
    assert(reachable(road.gate, level).includes(road.to), `Passed gate ${level} permits continuation`);
    assert(reachable(road.from, level).includes(road.to), `Passed gate ${level} can be crossed directly`);
    assert(reachable(road.to, level).includes(road.from), `Passed gate ${level} can be crossed backwards`);
    const blocked = ForceModel.transitions(road.from, level - 1, roads).find(s => s.target === road.gate);
    assert(blocked.start === 0 && blocked.end === road.fraction, `Walk stops exactly at gate ${level}`);
  }
  // A graph search must never find a route around a locked examination.
  for (let progress = 0; progress < 3; progress++) {
    const visited = new Set(['camp']);
    const queue = ['camp'];
    while (queue.length) for (const node of reachable(queue.shift(), progress)) {
      if (!visited.has(node)) { visited.add(node); queue.push(node); }
    }
    assert(!visited.has(['red','green','purple'][progress]), `No bypass for level ${progress + 1}`);
  }
  for (const value of ['', '?progress=-1', '?progress=4', '?progress=NaN', '?progress=1.5', '?progress=01']) {
    assert(ForceModel.readProgress(value) === 0, `Reject invalid progress ${value}`);
  }
  for (let level = 0; level <= 3; level++) assert(ForceModel.readProgress(`?other=keep&progress=${level}`) === level, 'Read URI progress');
  const correct = [
    { newtons: '2500', arrow: {x: 4, y: 0}, sum: {x: 3, y: 4} },
    { length: '6', force: '45', explanation: 'longer' },
    { work: '180', distance: '4', force: '60' }
  ];
  correct.forEach((answers, index) => {
    const level = index + 1;
    assert(ForceModel.gradeExam(level, answers).every(Boolean), `Exam ${level} accepts correct answers`);
    for (const key of Object.keys(answers)) {
      const wrong = { ...answers, [key]: key === 'arrow' || key === 'sum' ? {x:0,y:0} : '' };
      assert(!ForceModel.gradeExam(level, wrong).every(Boolean), `Exam ${level} rejects wrong/missing ${key}`);
    }
  });
  assert(!ForceModel.gradeExam(1, { ...correct[0], arrow: {x:0,y:4} })[1], 'Arrow direction is graded');
  assert(!ForceModel.close(null, 0) && !ForceModel.close('', 0), 'Empty answers never count as zero');
  for (const length of [1.5, 3, 6, 9]) {
    const { force, work } = ForceModel.ramp(length);
    assert(Math.abs(force * length - 180) < 1e-9 && work === 180, 'Ramp conserves work');
  }
  for (const n of [1,2,4,6]) {
    const { force, distance, work } = ForceModel.pulley(n, 240, 2);
    assert(force === 240/n && distance === 2*n && force*distance === work, 'Pulley conserves work');
  }
})();
