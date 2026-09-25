(() => {
  'use strict';
  const {distance,measurements,interval,parse,check}=DistanceExercise;
  const $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
  const x=t=>80+t*72,y=s=>560-s;
  const fields={start:$('start-value'),end:$('end-value'),delta:$('delta-value'),speed:$('speed-value')};
  let task=null,solved=0,waiting=false;
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
    task=interval(task);waiting=false;
    $('interval').replaceChildren();$('markers').replaceChildren();
    draw('interval','rect',{x:x(task.start),y:60,width:x(task.end)-x(task.start),height:500,class:'interval-fill'});
    for(const [i,t] of [task.start,task.end].entries()) {
      draw('markers','line',{x1:x(t),x2:x(t),y1:60,y2:560,class:'time-marker'});
      draw('markers','text',{x:x(t),y:49,'text-anchor':'middle',class:'marker-label'},`t${i===0?'₁':'₂'}`);
    }
    $('task-title').textContent=`t₁ = ${number(task.start)} s → t₂ = ${number(task.end)} s · Δt = ${number(task.end-task.start)} s`;
    $('plot-desc').textContent=`Weg-Zeit-Diagramm von 0 bis 10 Sekunden und 0 bis 500 Metern. Die Messpunkte streuen um eine ansteigende Kurve. Senkrechte Linien bei ${number(task.start)} und ${number(task.end)} Sekunden markieren das Intervall. Kleine Gitterabstände: 0,5 Sekunden und 10 Meter.`;
    $('start-label').textContent=`s₁ bei t₁ = ${number(task.start)} s`;
    $('end-label').textContent=`s₂ bei t₂ = ${number(task.end)} s`;
    for(const field of Object.values(fields)) {field.value='';field.disabled=false;field.removeAttribute('aria-invalid');}
    $('check-answer').disabled=false;
    if(solved) { $('feedback').className='';$('feedback').textContent='Neue Aufgabe: Lies die Werte für das jetzt markierte Intervall ab.';fields.start.focus(); }
  }
  $('answer-form').addEventListener('submit',event=>{
    event.preventDefault();if(waiting)return;
    for(const field of Object.values(fields))field.removeAttribute('aria-invalid');
    const values=Object.fromEntries(Object.entries(fields).map(([key,field])=>[key,parse(field.value)]));
    const result=check(task,values.start,values.end,values.delta,values.speed);
    $('feedback').textContent=result.message;$('feedback').className=result.ok?'success':'';
    if(!result.ok) {
      const invalid=result.field ?? Object.keys(fields).find(key=>!Number.isFinite(values[key]));
      if(invalid) {fields[invalid].setAttribute('aria-invalid','true');fields[invalid].focus();}
      return;
    }
    solved++;waiting=true;$('score').textContent=`${solved} gelöst`;
    $('feedback').textContent=`Richtig: ${number(values.end)} m − ${number(values.start)} m ≈ ${number(values.delta)} m; v̄ ≈ ${number(values.speed)} m/s. Gleich folgt ein neues Intervall.`;
    for(const field of Object.values(fields))field.disabled=true;
    $('check-answer').disabled=true;
    setTimeout(next,2200);
  });
  next();
})();
