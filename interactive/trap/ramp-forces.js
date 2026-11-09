/* Geometric addition of measured ramp forces, compared with an ideal model. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id),M=TrapModel,{state,format:fmt,escape:esc}=Trap;
  const select=$('ramp-force-row'),mode=$('ramp-force-mode'),button=$('draw-ramp-forces');
  if(!select)return;
  let shown=false;
  const palette={pull:'#176f9a',lift:'#398353',gravity:'#b74d43',sum:'#263e3b',gap:'#b46d16'};
  function available(){
    return (state.tables.ramp||[]).flatMap((row,index)=>{
      const a=TrapTables.assess('ramp',row);
      return a.result&&a.vals.lift!==null&&!a.invalid.length?[{index,values:a.vals}]:[];
    });
  }
  function arrow(x1,y1,x2,y2,color,dashed=false){
    const length=Math.hypot(x2-x1,y2-y1);
    if(length<.01)return '';
    const dx=(x2-x1)/length,dy=(y2-y1)/length,size=Math.min(9,length*.35);
    return `<g class="force-arrow"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3"${dashed?' stroke-dasharray="5 4"':''}/><path d="M${x2} ${y2}L${x2-size*dx+size*.5*dy} ${y2-size*dy-size*.5*dx}L${x2-size*dx-size*.5*dy} ${y2-size*dy+size*.5*dx}Z" fill="${color}"/></g>`;
  }
  const label=(x,y,value,color='#263e3b')=>`<text x="${x}" y="${y}" fill="${color}">${esc(value)}</text>`;
  function drawing(values,ideal){
    let data=M.rampForces(values.s,values.h,values.force,values.lift,values.weight);
    if(ideal)data=M.rampForces(values.s,values.h,data.idealPull,data.idealLift,values.weight);
    const pull=ideal?data.idealPull:values.force,lift=ideal?data.idealLift:values.lift;
    const scale=125/Math.max(values.weight,pull,lift,Math.hypot(data.sum.x,data.sum.y));
    const project=(origin,vector)=>({x:origin.x+vector.x*scale,y:origin.y-vector.y*scale});
    const o={x:230,y:205},p=project(o,data.parallel),n=project(o,data.normal),g=project(o,{x:0,y:-values.weight});
    let left=`<path d="M${o.x-150*data.cos+20*data.sin} ${o.y+150*data.sin+20*data.cos}L${o.x+140*data.cos+20*data.sin} ${o.y-140*data.sin+20*data.cos}" stroke="#b2a07b" stroke-width="13"/><g transform="translate(${o.x} ${o.y}) rotate(${-data.angle})"><rect x="-25" y="-14" width="50" height="28" rx="4" fill="#e4eadc" stroke="#587763"/></g>`;
    left+=arrow(o.x,o.y,p.x,p.y,palette.pull)+arrow(o.x,o.y,n.x,n.y,palette.lift)+arrow(o.x,o.y,g.x,g.y,palette.gravity);
    left+=label(Math.min(375,p.x+9),p.y-9,'F_Z',palette.pull)+label(Math.max(12,n.x-35),n.y-10,'F_A',palette.lift)+label(g.x+10,g.y+12,'F_G',palette.gravity);
    left+='<circle cx="230" cy="205" r="4" fill="#263e3b"/>';
    const a={x:165,y:330},b=project(a,data.parallel),c=project(a,data.sum),target=project(a,{x:0,y:values.weight});
    let right=arrow(a.x,a.y,target.x,target.y,palette.gravity,true);
    right+=arrow(a.x,a.y,b.x,b.y,palette.pull)+arrow(b.x,b.y,c.x,c.y,palette.lift);
    // Offset no force: all arrows retain their physical endpoints and common scale.
    right+=arrow(a.x,a.y,c.x,c.y,palette.sum);
    right+=`<circle cx="${a.x}" cy="${a.y}" r="4" fill="#263e3b"/><circle cx="${b.x}" cy="${b.y}" r="4" fill="${palette.pull}"/><circle cx="${c.x}" cy="${c.y}" r="5" fill="${palette.sum}"/>`;
    if(data.gap>1e-8)right+=arrow(c.x,c.y,target.x,target.y,palette.gap,true);
    right+=label(a.x-20,a.y+23,'Start')+label(Math.min(365,b.x+10),b.y+17,'F_Z',palette.pull)+label(Math.max(12,(b.x+c.x)/2-35),(b.y+c.y)/2-10,'F_A',palette.lift)+label(Math.max(12,c.x-18),c.y-13,'Summe',palette.sum)+label(target.x+12,target.y-4,'−F_G',palette.gravity);
    const svg=(title,body)=>`<figure><figcaption>${title}</figcaption><svg viewBox="0 0 440 390" role="img" aria-label="${esc(title)}. ${esc(ideal?'Ideale Kräfte schließen zum Gleichgewicht.':'Messkräfte werden maßstabsgetreu verglichen; eine Abweichung bleibt sichtbar.')}">${body}</svg></figure>`;
    const description=ideal
      ? `Im idealen Modell gilt F_Z = F_G · h / s = ${fmt(pull,3)} N und F_A = F_G · √(1 − (h/s)²) = ${fmt(lift,3)} N. Die Pfeilsumme zeigt senkrecht nach oben und ist mit ${fmt(values.weight,3)} N genauso groß wie die Gewichtskraft nach unten.`
      : `Eure Messwerte: F_Z = ${fmt(pull,3)} N und F_A = ${fmt(lift,3)} N. Die Pfeilsumme beträgt ${fmt(Math.hypot(data.sum.x,data.sum.y),3)} N. Ihr Abstand zur Gegenkraft der Gewichtskraft beträgt ${fmt(data.gap,3)} N; dieser Abstand wird nicht automatisch wegkorrigiert.`;
    return `<p class="type-label ${ideal?'virtual':''}">${ideal?'Ideales Vergleichsmodell · aus Geometrie berechnet':'Eigene Messwerte · geometrischer Vergleich'}</p><p>Hubhöhe ${fmt(values.h,3)} m · Rampenlänge ${fmt(values.s,3)} m · Winkel aus h/s: ${fmt(data.angle,1)}°. Gemeinsamer Maßstab: 1 N entspricht ${fmt(scale,1)} Zeicheneinheiten.</p><div class="force-panels">${svg('1 · Richtungen am Wagen',left)}${svg('2 · Pfeile Spitze an Anfang addieren',right)}</div><ul class="force-legend"><li style="--force-color:${palette.pull}">Blau: F_Z, parallel zur Rampe nach oben.</li><li style="--force-color:${palette.lift}">Grün: F_A, senkrecht von der Rampe weg.</li><li style="--force-color:${palette.sum}">Schwarz: Summe der blauen und grünen Kraft.</li><li style="--force-color:${palette.gravity}">Rot: Gewichtskraft F_G bzw. gestrichelt ihre Gegenkraft −F_G.</li>${!ideal&&data.gap>1e-8?`<li style="--force-color:${palette.gap}">Orange gestrichelt: Lücke zur idealen Gegenkraft, keine zusätzlich gemessene Kraft.</li>`:''}</ul><p class="readout">${description}</p><p class="screenshot">Haltet die Kräftezeichnung samt Legende als Screenshot oder handschriftliche Skizze in Goodnotes bzw. eurer Projektmappe fest.</p>`;
  }
  function update(){
    const rows=available(),selected=select.value;
    select.replaceChildren();
    rows.forEach(({index,values})=>{
      const option=document.createElement('option');option.value=String(index);option.textContent=`Messung ${index+1}: h = ${fmt(values.h,3)} m, F_A = ${fmt(values.lift,3)} N`;select.append(option);
    });
    if(rows.some(row=>String(row.index)===selected))select.value=selected;
    button.disabled=select.disabled=rows.length===0;
    if(!rows.length){
      const option=document.createElement('option');option.textContent='Noch keine vollständige Zusatzmessung';select.append(option);
      $('ramp-force-status').textContent='Tragt zunächst für eine gültige Rampenmessung zusätzlich die senkrechte Abhebekraft ein. Dann könnt ihr die Kraftpfeile zeichnen lassen.';
      $('ramp-force-drawing').replaceChildren();return;
    }
    $('ramp-force-status').textContent=`${rows.length} Messung(en) mit Abhebekraft verfügbar. Die Zusatzmessung ist freiwillig und für die fünf Höhen nicht erforderlich.`;
    if(shown)render();
  }
  function render(){
    const row=available().find(row=>String(row.index)===select.value);
    if(!row)return;
    $('ramp-force-drawing').innerHTML=drawing(row.values,mode.value==='ideal');
  }
  button.addEventListener('click',()=>{shown=true;render();});
  select.addEventListener('change',()=>{if(shown)render();});
  mode.addEventListener('change',()=>{if(shown)render();});
  document.addEventListener('trap:ramp-updated',update);
  update();
})();
