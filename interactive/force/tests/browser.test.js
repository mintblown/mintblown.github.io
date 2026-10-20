// Loaded by the temporary browser-check page after the actual application scripts.
addEventListener('load', async () => {
  const result = document.createElement('pre');
  result.id = 'browser-test-result';
  document.body.append(result);
  const assert = (ok, label) => { if (!ok) throw new Error(label); };
  const set = (id, value) => {
    const input = document.querySelector(`#activity-body #${id}`);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const setVector = (id, x, y) => {
    const widget = document.querySelector(`[data-vector="${id}"]`);
    for (const [axis, value] of [['x', x], ['y', y]]) {
      const input = widget.querySelector(`[data-axis="${axis}"]`);
      input.value = value; input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };
  const submit = () => document.querySelector('#activity-body form').requestSubmit();
  const practice = name => document.querySelector(`[data-check="${name}"]`).click();
  const passedFeedback = () => assert(document.querySelector('.feedback.correct'), 'Expected positive exercise feedback');
  try {
    // Keep path interpolation real, while reducing animation time for the tests.
    window.matchMedia = () => ({ matches: true });
    window.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 0);
    assert(buttons.size === 9, 'All nine map destinations initialize');
    assert(progress === 0, 'Start with progress zero');
    assert(!buttons.get('pruefung-rot').disabled && buttons.get('kraft-und-weg').disabled, 'Examination replaces red target');
    await travel('kraft-und-weg');
    assert(current === 'basecamp', 'Direct travel cannot bypass locked exam');
    await travel('kraftpfeile'); lesson.click();
    assert(document.querySelector('#activity').open, 'Lesson opens');
    set('convert', 750); practice('convert'); passedFeedback();
    setVector('practice-arrow', 4, 0); practice('arrow');
    setVector('practice-sum', 3, 4); practice('sum');
    assert(document.querySelectorAll('.feedback.correct').length === 3, 'All force-arrow exercises pass');
    ForceLessons.close(); await travel('basecamp'); await travel('hebel'); lesson.click();
    const arm = document.querySelector('[data-lever="rightArm"]'); arm.value = 4; arm.dispatchEvent(new Event('input'));
    assert(document.querySelector('.lever-summary').textContent.includes('Gleichgewicht!'), 'Lever can balance');
    ForceLessons.close(); await travel('basecamp'); await travel('pruefung-rot');
    assert(buttons.get('kraft-und-weg').disabled, 'Cannot leave unpassed exam towards lesson');
    lesson.click(); set('newtons',2500); submit();
    assert(progress === 0 && document.querySelector('#exam-result.incorrect'), 'Failed red exam preserves progress');
    setVector('exam-arrow',4,0); setVector('exam-sum',3,4); submit();
    assert(progress === 1 && new URL(location.href).searchParams.get('progress') === '1', 'Red pass saves URI');
    assert(!buttons.get('kraft-und-weg').disabled, 'Passing opens red destination');
    ForceLessons.close(); await travel('kraft-und-weg'); lesson.click();
    set('ramp-lesson',6); practice('ramp'); passedFeedback();
    ForceLessons.close(); await travel('pruefung-gruen'); lesson.click();
    set('force',1); set('explanation','same'); submit();
    assert(progress === 1 && buttons.get('goldene-regel').disabled, 'Failed green exam still blocks path');
    set('exam-ramp',6); set('force',45); set('explanation','longer'); submit();
    assert(progress === 2 && new URL(location.href).searchParams.get('progress') === '2', 'Green pass saves URI');
    ForceLessons.close(); await travel('goldene-regel'); lesson.click();
    for (const length of [3,6]) {
      set('gold-ramp',length); document.querySelector('#record').click();
      document.querySelector('#measurements tr:last-child input').value = 180;
    }
    practice('gold'); passedFeedback();
    assert(document.querySelectorAll('#measurements tr').length === 2, 'Measurement log contains two lengths');
    ForceLessons.close(); await travel('pruefung-violett'); lesson.click();
    set('work',1); set('distance',1); set('force',1); submit();
    assert(progress === 2 && buttons.get('flaschenzug').disabled, 'Failed violet exam blocks path');
    set('work',180); set('distance',4); set('force',60); submit();
    assert(progress === 3 && new URL(location.href).searchParams.get('progress') === '3', 'Violet pass saves URI');
    ForceLessons.close(); await travel('flaschenzug'); lesson.click();
    set('ropes',4); set('lift',2); set('pulley-force',60); set('pulley-distance',8); practice('pulley'); passedFeedback();
    assert(document.querySelectorAll('#pulley-view circle').length === 4, 'Four-rope configuration shows four pulleys');
    ForceLessons.close(); await travel('goldene-regel'); await travel('kraft-und-weg'); await travel('basecamp');
    assert(current === 'basecamp', 'Passed gates allow return trip');
    assert(document.querySelectorAll('.exam-destination.passed').length === 3, 'All exam symbols show passed badges');
    assert(new URL(location.href).searchParams.get('keep') === 'yes', 'Unrelated URI parameters survive');
    assert(!document.querySelector('#activity').open, 'Dialog closes cleanly');
    assert([...document.images].every(img => img.complete && img.naturalWidth > 0), 'All PNGs load');
    result.textContent = 'PASS: five lessons, three exams, failures block paths, success unlocks paths, URI progress, return travel, PNG assets.';
  } catch (error) {
    result.textContent = 'FAIL: ' + error.stack;
  }
});
