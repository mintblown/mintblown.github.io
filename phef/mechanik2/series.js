(function(){
 'use strict';const $=id=>document.getElementById(id),M=MechanicsAnalysis,type=document.body.dataset.experiment,KEY='phef-m2-'+type+'-v1',isPulley=type==='8';
 const fmt=(n,d=3)=>Number.isFinite(n)?n.toLocaleString('de-DE',{maximumFractionDigits:d}):'—';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const spec=isPulley?[['load','Gewichtskraft der Last F_G,L (N)'],['n','Tragende Seilabschnitte n'],['pull','Anzeige Zugkraft (N)'],['height','Hubhöhe h (cm)'],['rope','Seilweg s (cm)']]:[['mass','Zusatzmasse m (g)'],['pull','Anzeige Zugkraft (N)'],['height','Hubhöhe h (cm)'],['length','Rampenlänge s (cm)']];
 const globalIds=isPulley?['roller-weight','zero']:['wagon-weight','zero'];
 let data={globals:{},rows:[],points:{},mode:'normalized',slope:'1',intercept:'0'},persistent=true,dragging=false;
 const blank=()=>({id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),...Object.fromEntries(spec.map(([k])=>[k,'']))});
 try{const stored=JSON.parse(localStorage.getItem(KEY));if(stored&&Array.isArray(stored.rows)){data={...data,...stored,globals:stored.globals||{},points:stored.points||{},rows:stored.rows.filter(r=>r&&typeof r==='object'&&typeof r.id==='string')};}}catch(_){persistent=false;}
 if(!data.rows.length)data.rows=[blank(),blank(),blank()];
 for(const id of globalIds)if(typeof data.globals[id]==='string')$(id).value=data.globals[id];
 $('plot-mode').value=data.mode;if(!$('plot-mode').value){data.mode='normalized';$('plot-mode').value='normalized';}
 $('line-slope').value=data.slope;$('line-intercept').value=data.intercept;
 function save(){data.globals=Object.fromEntries(globalIds.map(id=>[id,$(id).value]));data.mode=$('plot-mode').value;data.slope=$('line-slope').value;data.intercept=$('line-intercept').value;try{localStorage.setItem(KEY,JSON.stringify(data));}catch(_){persistent=false;}$('storage-status').textContent=persistent?'Messwerte und selbst eingezeichnete Punkte werden in diesem Browser gespeichert. Diagramme zusätzlich per Screenshot sichern.':'Die Browserspeicherung ist nicht verfügbar. Sichert eure Tabelle und Diagramme per Screenshot.';}
 function globalValue(id,zero=false){const raw=$(id).value.trim(),n=zero&&raw===''?0:M.number(raw),valid=n!==null&&(zero?Math.abs(n)<=10:isPulley?n>=0&&n<=100:n>0&&n<=100);$(id).setAttribute('aria-invalid',String(raw!==''&&!valid));return valid?n:null;}
 function assess(row){const vals={};let invalid=[],missing=[];
  for(const [key]of spec){const n=M.number(row[key]),limit=key==='n'?12:key==='mass'?10000:key==='load'||key==='pull'?100:1000,valid=n!==null&&n>=0&&n<=limit&&(key==='n'?Number.isInteger(n)&&n>=1:['load','height','rope','length'].includes(key)?n>0:true);if(!valid)(String(row[key]??'').trim()?invalid:missing).push(key);vals[key]=valid?n:null;}
  const g=globalValue(isPulley?'roller-weight':'wagon-weight'),zero=globalValue('zero',true);let result=null;
  if(!invalid.length&&!missing.length&&g!==null&&zero!==null){result=isPulley?M.pulley(vals.load,g,vals.pull,vals.n,vals.height,vals.rope,zero):M.ramp(g,vals.mass,vals.pull,vals.height,vals.length,zero);if(!result)invalid.push('pull',...(isPulley?[]:['height','length']));}
  return {result,invalid,missing};
 }
 function coords(r){if(!r)return null;const mode=$('plot-mode').value;if(isPulley)return mode==='mass'?{x:r.massLoad,y:r.massEquivalent}:mode==='forceway'?{x:r.height/r.rope,y:r.force/(r.load+r.roller)}:{x:r.load,y:r.normalized};return mode==='ratios'?(r.forceRatio===null?null:{x:r.wayRatio,y:r.forceRatio}):{x:r.x,y:r.y};}
 function values(r){return !r?['—','—','—','—']:isPulley?[fmt(r.force),fmt(r.normalized),fmt(r.ratio),`${fmt(r.inputWork)} / ${fmt(r.totalLift)}`]:[fmt(r.weight),fmt(r.y),fmt(r.x),`${fmt(r.inputWork)} / ${fmt(r.liftWork)}`];}
 function renderTable(){const outputs=isPulley?['Korrigiertes F (N)','n · F (N)','s / h','F·s / (F_G,L+F_G,R)·h (N·m)']:['Gesamtgewichtskraft F_G (N)','F / F_G','h / s','F·s / F_G·h (N·m)'];
  $('measurement-table').innerHTML=`<div class="table-scroll"><table><caption>Eure gemessenen Werte – keine Beispielmessungen</caption><thead><tr><th>Nr.</th>${spec.map(([,label])=>'<th>'+label+'</th>').join('')}${outputs.map(label=>'<th>'+label+'</th>').join('')}<th>Zeile</th></tr></thead><tbody>${data.rows.map((row,i)=>`<tr data-row="${i}"><th>${i+1}</th>${spec.map(([key,label])=>`<td><input type="text" inputmode="decimal" autocomplete="off" data-field="${key}" value="${esc(row[key])}" aria-label="${label}, Messung ${i+1}"></td>`).join('')}${outputs.map((_,j)=>`<td data-result="${j}"></td>`).join('')}<td><button type="button" data-delete="${i}">Löschen</button></td></tr>`).join('')}</tbody></table></div>`;
  $('measurement-table').querySelectorAll('input').forEach(input=>input.oninput=()=>{const i=+input.closest('tr').dataset.row;data.rows[i][input.dataset.field]=input.value;save();update();});
  $('measurement-table').querySelectorAll('[data-delete]').forEach(button=>button.onclick=()=>{const [row]=data.rows.splice(+button.dataset.delete,1);delete data.points[row.id];save();renderTable();update();$('add-row').focus();});
 }
 let results=[],selected='',bounds={x:1,y:1};
 const pointFor=row=>data.points[row.id]?.[$('plot-mode').value];
 function setPoint(point){const row=data.rows.find(r=>r.id===selected);if(!row)return;data.points[row.id]??={};data.points[row.id][$('plot-mode').value]=point;save();showPointFields();draw();}
 function showPointFields(){const row=data.rows.find(r=>r.id===selected),point=row&&pointFor(row);$('point-x').value=point?String(+point.x.toFixed(5)):'';$('point-y').value=point?String(+point.y.toFixed(5)):'';}
 function update(){results=data.rows.map(assess);const messages=[];
  data.rows.forEach((row,i)=>{const a=results[i],tr=$('measurement-table').querySelector(`[data-row="${i}"]`);tr.querySelectorAll('[data-field]').forEach(input=>input.setAttribute('aria-invalid',String(a.invalid.includes(input.dataset.field))));values(a.result).forEach((value,j)=>tr.querySelector(`[data-result="${j}"]`).textContent=value);
   if(a.invalid.length)messages.push(`Messung ${i+1}: Markierte Werte prüfen. Kräfte dürfen nach Nullkorrektur nicht negativ sein; Höhe und Länge müssen zum Aufbau passen.`);
   if(a.result){const r=a.result;if(Math.abs(r.forceError)>.1)messages.push(`Messung ${i+1}: Kraft und Aufbau weichen deutlich vom einfachen Modell ab. Prüft ${isPulley?'Nullstellung, tragende Seilabschnitte, Rollenreibung und die Gewichtskraft der mitbewegten Teile':'Nullstellung, Gesamtgewichtskraft, parallele Zugrichtung und Rollreibung'}.`);if(isPulley&&Math.abs(r.wayError)>.1)messages.push(`Messung ${i+1}: s / h = ${fmt(r.ratio)} passt noch nicht zu n = ${r.n}. Prüft Wegmarkierungen und Anzahl der tragenden Abschnitte.`);}
  });
  const count=results.filter(a=>a.result).length;
  $('plausibility').className=messages.length?'warning':'notice';$('plausibility').innerHTML=`<strong>${count} vollständig auswertbare Messung(en)</strong>${messages.length?'<ul>'+messages.map(m=>'<li>'+m+'</li>').join(''):'<p>Vervollständigt eure Werte und vergleicht mehrere Messungen. Eine Übereinstimmung beweist noch keine fehlerfreie Messung.</p>'}<p class="hint">Hier werden Abweichungen über 10 % als Orientierung hervorgehoben. Das ist keine berechnete Messunsicherheit. Die Produkte F·s und F_G·h vergleichen ein Modell mit angenommener gleichbleibender Kraft; eine einzelne statische Kraftmessung ist keine vollständige Arbeitsmessung.</p>`;
  const options=data.rows.map((row,i)=>results[i].result&&coords(results[i].result)?`<option value="${row.id}">Messung ${i+1}</option>`:'').join('');$('selected-row').innerHTML=options;
  if(data.rows.some((row,i)=>row.id===selected&&results[i].result&&coords(results[i].result)))$('selected-row').value=selected;
  selected=$('selected-row').value;showTarget();showPointFields();draw();
  if(isPulley){const gr=globalValue('roller-weight');$('roller-intercept').textContent=gr===null?'Tragt die Gewichtskraft des Rollenblocks ein, um den Vergleich zu berechnen.':`Eure gemessene Gewichtskraft des Rollenblocks F_G,R: ${fmt(gr)} N. Das entspricht ${fmt(gr/9.8*1000)} g. Diese Werte sind die idealen Achsenabschnitte der beiden Darstellungen.`;}
 }
 function showTarget(){const index=data.rows.findIndex(row=>row.id===selected),c=index>=0?coords(results[index].result):null;$('target-coordinates').textContent=c?`Messung ${index+1}: Aus euren Messwerten folgen x = ${fmt(c.x,5)} und y = ${fmt(c.y,5)}. Tragt diese Koordinaten ein.`:'Für das Diagramm fehlen vollständige gültige Messwerte. In der Darstellung F_G / F muss die korrigierte Kraft größer als 0 sein.';for(const id of ['place-exact','check-points','clear-point'])$(id).disabled=!c;}
 function draw(){
  const mode=$('plot-mode').value,cs=results.map(a=>coords(a.result)).filter(Boolean),placed=data.rows.map(pointFor).filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0);
  if(!dragging)bounds={x:Math.max(1,...cs.map(c=>c.x),...placed.map(p=>p.x))*1.2,y:Math.max(1,...cs.map(c=>c.y),...placed.map(p=>p.y))*1.2};
  const px=x=>70+x/bounds.x*760,py=y=>390-y/bounds.y*330;
  let s='<defs><clipPath id="plot-area"><rect x="70" y="60" width="760" height="330"/></clipPath></defs>';
  for(let i=0;i<=5;i++){const x=70+i/5*760,y=390-i/5*330;s+=`<path d="M${x} 60V390M70 ${y}H830" stroke="#e4deeb" fill="none"/><text x="${x}" y="416" text-anchor="middle">${fmt(i/5*bounds.x,2)}</text><text x="58" y="${y+5}" text-anchor="end">${fmt(i/5*bounds.y,2)}</text>`;}
  const labels=isPulley?(mode==='mass'?['Lastmasse m_L (g)','n · F / g (in g umgerechnet)']:mode==='forceway'?['Kehrwert Wegfaktor h / s','Kraftanteil F / (F_G,L + F_G,R)']:['Gewichtskraft der Last F_G,L (N)','n · F (N)']):(mode==='ratios'?['Wegfaktor s / h','Kraftfaktor F_G / F']:['Neigungsverhältnis h / s','Kraftanteil F / F_G']);
  s+=`<path d="M70 50V390H842" stroke="#51415f" fill="none" stroke-width="2"/><text x="70" y="28">${labels[1]}</text><text x="450" y="460" text-anchor="middle">${labels[0]}</text>`;
  if($('show-line').checked){const slope=M.number($('line-slope').value),intercept=M.number($('line-intercept').value);if(slope!==null&&intercept!==null)s+=`<path d="M70 ${py(intercept)}L830 ${py(slope*bounds.x+intercept)}" stroke="#bd8238" stroke-width="3" clip-path="url(#plot-area)"/>`;}
  data.rows.forEach((row,i)=>{const point=pointFor(row),c=coords(results[i]?.result);if($('show-targets').checked&&c)s+=`<path d="M${px(c.x)-5} ${py(c.y)}h10M${px(c.x)} ${py(c.y)-5}v10" stroke="#4b7664" stroke-width="2"/>`;if(point&&Number.isFinite(point.x)&&Number.isFinite(point.y))s+=`<g data-point="${row.id}" class="plot-point"><circle cx="${px(point.x)}" cy="${py(point.y)}" r="${row.id===selected?9:6}" fill="${row.id===selected?'#765199':'#327d8d'}"/><text x="${px(point.x)+12}" y="${py(point.y)-10}">${i+1}</text></g>`;});
  let svg=$('plot-svg');if(!svg){$('plot').innerHTML='<svg id="plot-svg" viewBox="0 0 900 480" role="img" aria-label="Interaktives Messdiagramm. Punkte können auch über die Koordinatenfelder eingegeben werden."></svg>';svg=$('plot-svg');bindPlot(svg);}svg.innerHTML=s;
  $('line-equation').textContent=`Eigene Gerade: y = ${$('line-slope').value} · x + (${$('line-intercept').value}). Achsenabschnitt und Steigung beziehen sich auf die gerade gewählte Darstellung.`;
 }
 function bindPlot(svg){const point=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const v=p.matrixTransform(svg.getScreenCTM().inverse());return {x:Math.max(0,Math.min(bounds.x,(v.x-70)/760*bounds.x)),y:Math.max(0,Math.min(bounds.y,(390-v.y)/330*bounds.y))};};
  // Freeze the scale while dragging so a point cannot push its own axis away.
  let fixed=null;function move(e){if(!dragging)return;bounds=fixed;const p=point(e);const row=data.rows.find(r=>r.id===selected);if(!row)return;data.points[row.id]??={};data.points[row.id][$('plot-mode').value]=p;save();showPointFields();draw();bounds=fixed;}
  svg.onpointerdown=e=>{if(!selected)return;const target=e.target.closest('[data-point]');if(target){selected=target.dataset.point;$('selected-row').value=selected;showTarget();}dragging=true;fixed={...bounds};svg.setPointerCapture(e.pointerId);move(e);};svg.onpointermove=move;svg.onpointerup=e=>{if(!dragging)return;dragging=false;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);draw();};svg.onpointercancel=()=>{dragging=false;draw();};
 }
 $('add-row').onclick=()=>{data.rows.push(blank());save();renderTable();update();$('measurement-table').querySelector('tbody tr:last-child input').focus();};
 for(const id of globalIds)$(id).oninput=()=>{save();update();};
 $('plot-mode').onchange=()=>{save();update();};$('selected-row').onchange=()=>{selected=$('selected-row').value;showTarget();showPointFields();draw();};
 $('place-exact').onclick=()=>{const x=M.number($('point-x').value),y=M.number($('point-y').value);if(x===null||y===null||x<0||y<0||x>100000||y>100000){$('plot-feedback').textContent='Gebt zwei nicht negative Koordinaten bis 100000 ein.';return;}setPoint({x,y});$('plot-feedback').textContent='Euer Punkt ist eingezeichnet. Prüft ihn mit den ausgerechneten Messkoordinaten.';};
 $('clear-point').onclick=()=>{const row=data.rows.find(r=>r.id===selected);if(row&&data.points[row.id])delete data.points[row.id][$('plot-mode').value];save();showPointFields();draw();};
 $('check-points').onclick=()=>{const notes=[];data.rows.forEach((row,i)=>{const target=coords(results[i]?.result);if(!target)return;const p=pointFor(row);notes.push(!p?`Messung ${i+1}: noch kein Punkt.`:Math.abs(p.x-target.x)<=Math.max(.01*Math.abs(target.x),.002*Math.max(1,...results.map(a=>coords(a.result)?.x||0)))&&Math.abs(p.y-target.y)<=Math.max(.01*Math.abs(target.y),.002*Math.max(1,...results.map(a=>coords(a.result)?.y||0)))?`Messung ${i+1}: Punkt passt zu euren Messkoordinaten.`:`Messung ${i+1}: Achsen und Skalierung prüfen. Erwartete Messkoordinaten: (${fmt(target.x,5)} | ${fmt(target.y,5)}).`);});$('plot-feedback').textContent=notes.join(' ');};
 for(const id of ['show-targets','show-line','line-slope','line-intercept'])$(id).addEventListener('input',()=>{save();draw();});
 $('reset-data').onclick=()=>{if(!confirm('Messwerte und Diagrammpunkte dieses Versuchs löschen?'))return;try{localStorage.removeItem(KEY);}catch(_){}location.reload();};
 window.M2ProtocolSource=()=>{
  const active=data.rows.map((row,i)=>({row,i,a:assess(row)})).filter(({row})=>spec.some(([key])=>String(row[key]??'').trim()!==''));
  const issues=[];if(!active.length)issues.push('Tragt mindestens eine vollständige Messung ein.');
  active.forEach(({row,i,a})=>{if(!a.result)issues.push(`Messung ${i+1}: Messwerte und gemeinsame Eingaben vervollständigen beziehungsweise prüfen.`);else if(!coords(a.result))issues.push(`Messung ${i+1}: Für diese Diagrammansicht ist die korrigierte Kraft zu klein oder 0.`);else if(!pointFor(row))issues.push(`Messung ${i+1}: Tragt den Punkt in der aktuellen Diagrammansicht ein.`);});
  if($('show-line').checked&&(M.number($('line-slope').value)===null||M.number($('line-intercept').value)===null))issues.push('Prüft die Werte eurer Vergleichsgeraden.');
  const headers=['Nr.',...spec.map(([,label])=>label),...(isPulley?['F korr. (N)','n·F (N)','s/h','F·s / (F_G,L+F_G,R)h (N·m)']:['F_G (N)','F/F_G','h/s','F·s / F_G·h (N·m)'])];
  return {issues,title:isPulley?'Kräfte am Flaschenzug':'Kräfte an der schiefen Ebene 1',experiment:type,
   globals:globalIds.map(id=>[isPulley&&id==='roller-weight'?'Gewichtskraft des Rollenblocks F_G,R (N)':id==='wagon-weight'?'Gewichtskraft von Wagen und Stift F_G,0 (N)':'Nullanzeige in Messlage (N)',$(id).value.trim()||'0 (keine zusätzliche Korrektur)']),
   headers,rows:active.map(({row,i,a})=>[String(i+1),...spec.map(([key])=>row[key]),...values(a.result)]),
   pointRows:active.map(({row,i,a})=>{const target=coords(a.result),point=pointFor(row);return [String(i+1),fmt(target?.x,5),fmt(target?.y,5),fmt(point?.x,5),fmt(point?.y,5)];}),
   figures:[{selector:'#plot-svg',caption:$('plot-mode').selectedOptions[0]?.textContent||'Messdiagramm'}],
   summary:$('plausibility').innerText,
   analysis:[$('show-line').checked?$('line-equation').textContent:'Keine eigene Vergleichsgerade eingeblendet.', $('show-targets').checked?'Kontrollpunkte aus den Messwerten sind eingeblendet.':'Nur selbst eingezeichnete Punkte sind dargestellt.',isPulley?'Ideal: n·F = F_G,L + F_G,R; s = n·h. Kraft und Zugweg sind bei gleicher Last und Hubhöhe umgekehrt proportional. In der Massendarstellung entspricht der Achsenabschnitt der Masse des bewegten Rollenblocks.':'Ideal: F/F_G = h/s und F·s = F_G·h. F ist bei gleichem F_G und h umgekehrt proportional zu s.']};
 };
 renderTable();update();save();
})();
