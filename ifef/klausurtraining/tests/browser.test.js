'use strict';
addEventListener('load', () => {
  const output = document.createElement('pre');
  output.id = 'test-result'; output.hidden = true; document.body.prepend(output);
  const $ = id => document.getElementById(id);
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const set = (id,value,event='change') => { $(id).value = value; $(id).dispatchEvent(new Event(event,{bubbles:true})); };
  const click = id => $(id).click();
  const submit = () => $('answer-form').requestSubmit();
  function fill(question) {
    question.fields.forEach(field => {
      const answer = Array.isArray(field.answer) ? field.answer[0] : field.answer;
      if (field.kind === 'choice') document.querySelector(`input[name="${field.key}"][value="${answer}"]`).checked = true;
      else document.querySelector(`input[name="${field.key}"]`).value = answer;
    });
  }
  try {
    assert(typeof Training === 'undefined', 'Training does not initialize before consent');
    assert(window.storageReads === 0 && window.storageWrites === 0, 'No storage access before consent');
    assert($('storage-consent').open && $('training-content').hidden, 'Consent dialog gates training');
    assert(!$('consent-checkbox').checked && $('consent-start').disabled, 'Consent is not preselected');
    $('consent-form').dispatchEvent(new Event('submit', {cancelable:true}));
    assert(typeof Training === 'undefined' && window.storageReads === 0 && window.storageWrites === 0, 'Submitting without consent cannot start or access storage');
    const cancel = new Event('cancel', {cancelable:true});
    $('storage-consent').dispatchEvent(cancel);
    assert(cancel.defaultPrevented, 'Escape cannot bypass consent');
    assert(!$('save-for-later').checked, 'Persistence is optional and not preselected');
    click('save-for-later');
    assert($('consent-start').disabled, 'Persistence choice alone is not consent');
    click('consent-checkbox');click('consent-start');
    assert(Training && !$('storage-consent').open && !$('training-content').hidden, 'Explicit consent starts training');
    TrainingTypography.decorate();
    const sample = document.createElement('p');
    sample.textContent = 'int size = 3; boolean alive = true; string name = "Ada"; a.getAlive() und anzahl > 0. Eine Referenz verweist auf ein Objekt.';
    $('lesson').append(sample);TrainingTypography.decorate(sample);
    const snippets = [...sample.querySelectorAll('code')].map(node => node.textContent);
    assert(snippets.includes('int size = 3;') && snippets.includes('boolean alive = true;') && snippets.includes('string name = "Ada";'), 'Inline Java declarations use monospace, including invalid quiz syntax');
    assert(snippets.includes('a.getAlive()') && snippets.includes('anzahl > 0'), 'Inline calls and conditions use monospace');
    const term = [...sample.querySelectorAll('.term')].find(node => node.textContent === 'Referenz');
    assert(term && term.tabIndex === 0, 'Technical terms are keyboard accessible');
    term.dispatchEvent(new PointerEvent('pointerover',{bubbles:true}));
    assert(!$('glossary-tooltip').hidden && $('glossary-tooltip').textContent.includes('Verweis'), 'Mouseover shows definition');
    term.focus();assert(term.getAttribute('aria-describedby') === 'glossary-tooltip','Definition associated with focused term');
    term.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert($('glossary-tooltip').hidden,'Escape dismisses glossary');
    term.click();assert(!$('glossary-tooltip').hidden,'Tap/click shows definition');
    const tooltipRect = $('glossary-tooltip').getBoundingClientRect();
    assert(tooltipRect.left >= 0 && tooltipRect.right <= innerWidth && tooltipRect.top >= 0 && tooltipRect.bottom <= innerHeight, 'Definition stays within viewport');
    sample.remove();TrainingTypography.decorate();assert($('glossary-tooltip').hidden,'Removing station content dismisses stale tooltip');
    const {stations} = TrainingContent;
    assert(stations.length === 9 && stations.reduce((sum,s)=>sum+s.questions.length,0) === 40,'Nine stations, forty questions');
    assert(!/Java-byte|javaByte|vorzeichenbehaftet|−128/.test(JSON.stringify(stations.slice(0,2))), 'No Java-byte sign digression in the first two stations');
    assert(!/zähler/i.test(JSON.stringify(stations)), 'Use Zählvariable outside fraction arithmetic');
    // Verify every accepted answer, blank/incorrect rejection, token boundaries and case.
    for (const station of stations) for (const question of station.questions) for (const field of question.fields) {
      for (const answer of Array.isArray(field.answer) ? field.answer : [field.answer]) assert(Training.gradeField(field,String(answer)),`Accept ${field.key} in ${question.title}`);
      assert(!Training.gradeField(field,''),`Reject blank ${field.key}`);
      assert(!Training.gradeField(field,'not a valid answer'),`Reject wrong ${field.key}`);
      if (field.kind === 'number') assert(field.hint.includes('Dezimalzahl'), `Decimal input format specified for ${field.key}`);
      if (field.kind === 'text' && /^[01]+$/.test(String(field.answer))) assert(field.label.includes('Binärzahl'), `Binary input format specified for ${field.key}`);
      if (field.kind === 'java') assert(Training.gradeField(field,String(Array.isArray(field.answer)?field.answer[0]:field.answer).replaceAll(' = ','=')), 'Ignore harmless Java whitespace');
    }
    assert(!Training.gradeField({kind:'java',answer:'int size = 3;'},'intsize=3;'),'Preserve Java identifier boundaries');
    assert(!Training.gradeField({kind:'java',answer:'String name = "Ada";'},'string name = "Ada";'),'Preserve Java case');
    assert(!Training.gradeField({kind:'number',answer:0},''),'Empty is not zero');
    const [doubleField, decrementField] = stations[2].questions[2].fields;
    assert(Training.gradeField(doubleField,'2* zahl'), 'PAP accepts reversed multiplication as expression');
    assert(Training.gradeField(doubleField,'zahl = 2*zahl;'), 'PAP accepts reversed multiplication as statement');
    assert(Training.gradeField(decrementField,'-1 + anzahl'), 'PAP accepts reversed addition as expression');
    assert(Training.gradeField(decrementField,'anzahl = -1+anzahl;'), 'PAP accepts reversed addition as statement');
    assert(!Training.gradeField(decrementField,'1 - anzahl'), 'PAP rejects reversed subtraction');
    Training.selectStation(2);click('next');click('next');
    document.querySelector('[name="double"]').value = 'zahl = 2 * zahl';
    document.querySelector('[name="decrement"]').value = 'anzahl = -1 + anzahl';
    submit();
    assert([...document.querySelectorAll('.field-result')].every(node => node.textContent.includes('Berechnung ist richtig') && node.textContent.includes('Semikolon')), 'Missing semicolons get specific syntax feedback');
    assert(!Training.getState().solved.includes('2-2'), 'Incomplete statements do not count as solved');
    document.querySelector('[name="double"]').value = 'zahl = 3 * zahl';submit();
    assert(!document.querySelector('#field-double .field-result').textContent.includes('Semikolon'), 'Incorrect calculation is not misdiagnosed as missing semicolon');
    document.querySelector('[name="double"]').value = 'zahl = 2 * zahl;';
    document.querySelector('[name="decrement"]').value = 'anzahl = -1 + anzahl;';submit();
    assert($('feedback').classList.contains('good'), 'Corrected statements pass');
    document.querySelector('[name="double"]').value = '2 * zahl';
    document.querySelector('[name="decrement"]').value = '-1 + anzahl';submit();
    assert($('feedback').classList.contains('good') && ![...document.querySelectorAll('.field-result')].some(node => node.textContent.includes('Semikolon')), 'Standalone expressions need no semicolon');
    click('reset');click('reset-yes');
    // Experiment behavior, including edge cases.
    Training.selectStation(0);
    assert($('bit-readout').textContent.includes('66') && document.querySelectorAll('.led.on').length === 2,'Bit model starts with 66');
    document.querySelector('[data-bit="0"]').click();
    assert($('bit-readout').textContent.includes('194') && $('bit-readout').textContent.includes('kein Standard-ASCII'),'ASCII boundary');
    Training.selectStation(1);
    for (let i=0;i<6;i++) click('division-step');
    assert($('division-step').disabled && $('division-trace').textContent.includes('100101'),'Division yields 37 in binary');
    set('division-value',0); assert($('division-step').disabled && $('division-trace').textContent.includes('0₂'),'Zero conversion terminates');
    set('division-value',999); assert($('division-step').disabled,'Invalid conversion input is blocked');
    for(let i=0;i<3;i++) click('double-step');
    assert($('double-step').disabled && $('double-trace').textContent.includes('Ausgabe: 40'),'Doubling trace terminates');
    set('double-count',0); assert($('double-step').disabled && $('double-trace').textContent.includes('Ausgabe: 5'),'Zero runs');
    set('double-count',6); for(let i=0;i<6;i++) click('double-step');
    assert($('double-trace').textContent.includes('320') && $('double-trace').textContent.includes('mehr als 8 Bit'),'8-bit overflow stays visible');
    Training.selectStation(2);
    set('pap-choice-condition','anzahl > 0'); set('pap-choice-double','zahl = zahl * 2;'); set('pap-choice-decrement','anzahl = anzahl - 1;'); click('pap-check');
    assert($('pap-feedback').classList.contains('good') && document.querySelectorAll('.pap .active').length === 3,'Completed PAP correct');
    set('pap-choice-condition','anzahl == 0');click('pap-check'); assert($('pap-feedback').classList.contains('bad'),'Wrong PAP rejected');
    Training.selectStation(3);set('type-example','String'); assert($('type-readout').textContent.includes('Referenztyp'),'String is reference type');
    Training.selectStation(4); click('variable-step'); assert($('variable-memory').textContent.includes('nicht initialisiert'),'Declaration has no readable local default');
    for(let i=0;i<3;i++) click('variable-step');
    assert($('variable-memory').textContent.includes('int size → 4') && $('variable-memory').textContent.includes('int copy → 3'),'Primitive copy independent');
    Training.selectStation(5);set('info-states',1,'input');assert($('info-result').textContent.includes('mindestens 0 Bit'),'One known state needs no discrimination bit');
    set('info-states',10,'input');assert($('info-result').textContent.includes('mindestens 4 Bit'),'Ten states need four bits');
    Training.selectStation(6);set('class-part','constructor');assert($('class-readout').textContent.includes('keinen Rückgabetyp'),'Constructor has no return type');
    Training.selectStation(7);for(let i=0;i<3;i++)click('object-step');
    assert($('object-memory').textContent.includes('Objekt #1: alive = false') && !$('object-memory').textContent.includes('Objekt #2'),'Alias changes shared object');
    set('object-mode','independent');for(let i=0;i<3;i++)click('object-step');
    assert($('object-memory').textContent.includes('Objekt #1: alive = false') && $('object-memory').textContent.includes('Objekt #2: alive = true'),'Independent objects');
    set('object-mode','primitive');for(let i=0;i<3;i++)click('object-step');assert($('object-memory').textContent.includes('int x = 5') && $('object-memory').textContent.includes('int y = 7'),'Primitive scenario');
    // Incomplete and assisted tasks must never inflate self-solved progress.
    click('reset');click('reset-yes');submit();assert(Training.getState().solved.length === 0 && document.querySelector('[aria-invalid="true"]'),'Blank answers rejected');
    click('solution-button');fill(stations[0].questions[0]);submit();submit();
    assert(Training.getState().solved.length === 0 && Training.getState().reviewed.length === 1,'Solutions tracked separately and not duplicated');
    assert($('block-complete').hidden, 'One correct task does not complete the block');
    for (let j=1;j<stations[0].questions.length;j++) {
      click('next');fill(stations[0].questions[j]);submit();
      assert($('block-complete').hidden === (j < stations[0].questions.length-1), 'Completion waits for every task, including assisted tasks');
    }
    assert($('block-complete').textContent === 'Fasse deine Erkenntnisse zusammen und gehe zur nächsten Lektion.', 'Exact completion message');
    Training.selectStation(1);assert($('block-complete').hidden, 'Completion message does not leak into another block');
    Training.selectStation(0);assert(!$('block-complete').hidden, 'Completed block remains complete when revisited');
    $('notes').value = '<script>note</script>'; $('notes').dispatchEvent(new Event('input'));
    Training.selectStation(1);Training.selectStation(0);assert($('notes').value === '<script>note</script>','Notes preserved as text');
    click('reset');click('reset-no');assert(Training.getState().reviewed.length === 1,'Cancel reset preserves state');
    click('reset');click('reset-yes');assert(Training.getState().reviewed.length === 0 && $('notes').value === '' && $('block-complete').hidden,'Reset only own training');
    // Solve all tasks through the real form and station controls.
    stations.forEach((station,i) => {
      Training.selectStation(i);
      station.questions.forEach((question,j) => {
        TrainingTypography.decorate();
        assert(!document.querySelector('code code,.term .term'), 'Formatting is idempotent');
        document.querySelectorAll('label.choice').forEach(label => {
          const radio = label.querySelector('input[type="radio"]');
          const text = label.querySelector('span');
          assert(getComputedStyle(label).display === 'flex', 'Radio labels use flex layout');
          assert(text.getBoundingClientRect().left - radio.getBoundingClientRect().right >= 8, 'Visible space between every radio button and answer text');
        });
        question.fields.filter(field => field.kind === 'number').forEach(field => {
          const input = document.querySelector(`[name="${field.key}"]`);
          assert(document.getElementById(input.getAttribute('aria-describedby')).textContent.includes('Dezimalzahl'), 'Numeric input format remains visible and accessible');
        });
        fill(question);submit();
        assert($('feedback').classList.contains('good'),`Form accepts ${i}-${j}`);
        assert(Training.getState().solved.length === stations.slice(0,i).reduce((sum,s)=>sum+s.questions.length,0)+j+1,'Each task counts once');
        submit();
        if(j<station.questions.length-1) click('next');
      });
      assert($('next').disabled,'Final question disables next');
      assert(!$('block-complete').hidden, `Completed block ${i} displays reflection reminder`);
    });
    assert(Training.getState().solved.length === 40 && $('progress').value === 40,'All forty tasks counted');
    assert(document.querySelectorAll('.badge.won').length === 9,'Nine completed badges');
    const stored = JSON.parse(localStorage.getItem('ifef-klausurtraining-v1'));
    assert(stored.solved.length === 40 && stored.station === 8 && stored.question === 7,'Progress persisted');
    assert(document.documentElement.scrollWidth <= window.innerWidth,'No horizontal page overflow');
    Training.selectStation(0);window.scrollTo({top:0,behavior:'instant'});
    output.textContent='PASS: 40 questions, all answer types, 9 stations, all experiments, boundary cases, Java token grading, hints/solutions, persistence, reset, responsive overflow.';
  } catch (error) { output.textContent='FAIL: '+error.stack; }
});
