(() => {
  'use strict';
  const {distance,measurements,interval,parse,check}=DistanceExercise;
  const $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
  const x=t=>80+t*72,y=s=>560-s;
  const fields={start:$('start-value'),end:$('end-value'),delta:$('delta-value'),speed:$('speed-value')};
  const history=new ExerciseHistory();
  let task=null,solved=history.state.records.length,waiting=false,nextTimer=null;
  const number=value=>value.toLocaleString('de-DE',{maximumFractionDigits:2});
  function draw(parent,tag,attributes,text) {
    const element=document.createElementNS(ns,tag);
    for(const [key,value] of Object.entries(attributes))element.setAttribute(key,value);
    if(text!==undefined)element.textContent=text;
    $(parent).append(element);return element;
  }
  for(let s=0;s<=500;s+=10) {
    draw('grid','line',{x1:80,x2:800,y1:y(s),y2:y(s),class:s%50===0?'grid-major':'grid-minor'});
    if(s%50===0)draw('axes','text',{x:66,y:y(s)+6,'text-anchor':'end'},s);
  }
  for(let t=0;t<=10;t+=.5) {
    draw('grid','line',{x1:x(t),x2:x(t),y1:60,y2:560,class:Number.isInteger(t)?'grid-major':'grid-minor'});
    if(Number.isInteger(t))draw('axes','text',{x:x(t),y:588,'text-anchor':'middle'},t);
  }
  draw('axes','path',{d:'M80 45 V560 H815',class:'axis'});
  draw('axes','text',{x:80,y:27,class:'axis-title'},'Weg s in m');
  draw('axes','text',{x:440,y:626,class:'axis-title','text-anchor':'middle'},'Zeit t in s');
  $('distance-curve').setAttribute('d',Array.from({length:401},(_,i)=>`${i?'L':'M'}${x(i/40)},${y(distance(i/40))}`).join(' '));
  for(const point of measurements())draw('measurements','circle',{cx:x(point.t),cy:y(point.s),r:4.5,class:'measurement'});
  function next() {
    if(history.state.finished)return;
    task=history.state.task ?? interval(task);waiting=false;
    if(!history.state.task)history.start(task);
    updateHistoryStats();
    $('interval').replaceChildren();$('markers').replaceChildren();
    draw('interval','rect',{x:x(task.start),y:60,width:x(task.end)-x(task.start),height:500,class:'interval-fill'});
    for(const [i,t] of [task.start,task.end].entries()) {
      draw('markers','line',{x1:x(t),x2:x(t),y1:60,y2:560,class:'time-marker'});
      draw('markers','text',{x:x(t),y:49,'text-anchor':'middle',class:'marker-label'},`t${i===0?'₁':'₂'}`);
    }
    $('task-title').textContent=`t₁ = ${number(task.start)} s; t₂ = ${number(task.end)} s ⇒ Δt = ${number(task.end-task.start)} s`;
    $('plot-desc').textContent=`Weg-Zeit-Diagramm von 0 bis 10 Sekunden und 0 bis 500 Metern. Die Messpunkte streuen um eine ansteigende Kurve. Senkrechte Linien bei ${number(task.start)} und ${number(task.end)} Sekunden markieren das Intervall. Kleine Gitterabstände: 0,5 Sekunden und 10 Meter.`;
    $('start-label').textContent=`s₁ bei t₁ = ${number(task.start)} s`;
    $('end-label').textContent=`s₂ bei t₂ = ${number(task.end)} s`;
    for(const field of Object.values(fields)) {field.value='';field.disabled=false;field.removeAttribute('aria-invalid');}
    $('check-answer').disabled=false;
    if(solved) { $('feedback').className='';$('feedback').textContent='Neue Aufgabe: Lies die Werte für das jetzt markierte Intervall ab.';fields.start.focus(); }
  }
  $('answer-form').addEventListener('submit',event=>{
    event.preventDefault();if(waiting || history.state.finished)return;
    for(const field of Object.values(fields))field.removeAttribute('aria-invalid');
    const values=Object.fromEntries(Object.entries(fields).map(([key,field])=>[key,parse(field.value)]));
    const result=check(task,values.start,values.end,values.delta,values.speed);
    $('feedback').textContent=result.message;$('feedback').className=result.ok?'success':'';
    if(!result.ok) {
      history.wrong();updateHistoryStats();
      const invalid=result.field ?? Object.keys(fields).find(key=>!Number.isFinite(values[key]));
      if(invalid) {fields[invalid].setAttribute('aria-invalid','true');fields[invalid].focus();}
      return;
    }
    addRecord(history.solve(values));updateHistoryStats();
    solved++;waiting=true;$('score').textContent=`${solved} gelöst`;
    $('feedback').textContent=`Richtig: ${number(values.end)} m − ${number(values.start)} m ≈ ${number(values.delta)} m; v̄ ≈ ${number(values.speed)} m/s. Gleich folgt ein neues Intervall.`;
    for(const field of Object.values(fields))field.disabled=true;
    $('check-answer').disabled=true;
    if(solved>=99)finishRound();
    else nextTimer=setTimeout(next,2200);
  });
  function addRecord(record) {
    const {task,values}=record;
    const entry=document.createElement('li');
    const intervalText=document.createElement('p');
    intervalText.textContent=`t₁ = ${number(task.start)} s; t₂ = ${number(task.end)} s ⇒ Δt = ${number(task.end-task.start)} s`;
    const resultText=document.createElement('p');
    resultText.textContent=`s₁ = ${number(values.start)} m; s₂ = ${number(values.end)} m ⇒ Δs ≈ ${number(values.delta)} m ⇒ v̄ ≈ ${number(values.speed)} m/s`;
    const timing=document.createElement('p');
    timing.className='history-info';
    timing.textContent=`Gelöst am ${new Date(record.completedAt).toLocaleString('de-DE')}; ${record.seconds} s; ${record.errors} Fehlversuche`;
    entry.append(intervalText,resultText,timing);$('solved-list').append(entry);$('solved-empty').hidden=true;
  }
  function updateHistoryStats() {
    $('history-stats').textContent=`${history.state.records.length} Aufgaben gelöst; ${history.state.errors} falsche Eingaben insgesamt.`;
    if(!history.saved)$('history-info').textContent='Der Browser erlaubt keine lokale Speicherung. Die Historie bleibt nur bis zum Schließen oder Neuladen dieser Seite erhalten.';
  }
  async function finishRound() {
    clearTimeout(nextTimer);waiting=true;history.finish();
    for(const field of Object.values(fields))field.disabled=true;
    $('check-answer').disabled=true;$('finish-round').disabled=true;$('qr-result').hidden=false;
    $('task-title').textContent='Übungsrunde beendet';
    $('feedback').textContent='Die Übungsrunde ist beendet. Dein Ergebnis steht unten.';
    $('qr-status').textContent='QR-Code wird erstellt …';updateHistoryStats();
    try {
      const payload=await history.payload();
      const qr=qrcodegen.QrCode.encodeText(payload,qrcodegen.QrCode.Ecc.MEDIUM);
      const svg=$('history-qr');svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${qr.size+8} ${qr.size+8}`);
      draw('history-qr','rect',{width:qr.size+8,height:qr.size+8,fill:'white'});
      const cells=[];
      for(let y=0;y<qr.size;y++)for(let x=0;x<qr.size;x++)if(qr.getModule(x,y))cells.push(`M${x+4},${y+4}h1v1h-1z`);
      draw('history-qr','path',{d:cells.join(''),fill:'black'});
      svg.removeAttribute('hidden');$('qr-payload').textContent=payload;
      $('qr-status').textContent=`${solved} gelöste Aufgaben; ${history.state.errors} falsche Eingaben. Scanne den QR-Code, um das Ergebnis zu übernehmen.`;
    } catch(error) {
      $('qr-status').textContent=`Der QR-Code konnte nicht erstellt werden. ${error.message}`;
      $('finish-round').disabled=false;
    }
  }
  $('finish-round').addEventListener('click',finishRound);
  $('new-round').addEventListener('click',()=>{history.reset();location.reload();});
  for(const record of history.state.records)addRecord(record);
  $('score').textContent=`${solved} gelöst`;updateHistoryStats();
  if(history.state.finished)finishRound();else next();
})();
