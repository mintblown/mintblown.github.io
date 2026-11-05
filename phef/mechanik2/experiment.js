(function(){
 'use strict';
 const $=id=>document.getElementById(id),M=M29,KEY='phef-m2-9-v1';
 const ids=['left','right','weight','alpha','beta','mass','tolerance','mode'];
 const fmt=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('de-DE',{maximumFractionDigits:d}):'—';
 let result=null,showSum=false,positions={},drag=null,persistent=true;
 try{const data=JSON.parse(localStorage.getItem(KEY));if(data&&typeof data==='object')for(const id of ids){if(typeof data[id]==='string')$(id).value=data[id];}}catch(_){persistent=false;}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(ids.map(id=>[id,$(id).value]))));}catch(_){persistent=false;}$('save-status').textContent=persistent?'Eure Eingaben werden in diesem Browser gespeichert. Sichert eure Versuchsdarstellung bei Bedarf zusätzlich als Screenshot.':'Dieser Browser kann eure Eingaben gerade nicht dauerhaft speichern. Sichert sie zusätzlich auf eurem Dokubogen oder per Screenshot.';}
 const text=(x,y,value,cls='',anchor='start')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${value}</text>`;
 function arrow(x,y,dx,dy,color,label='',ghost=false){
  if(Math.hypot(dx,dy)<1e-9)return label?text(x+10,y-10,label+' = 0 N','small'):'';
  const ex=x+dx,ey=y+dy,a=Math.atan2(dy,dx),size=10;
  return `<g opacity="${ghost?.3:1}"><line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="${color}" stroke-width="${ghost?2:4}" ${ghost?'stroke-dasharray="6 5"':''}/><path d="M${ex} ${ey}L${ex-size*Math.cos(a)+5*Math.sin(a)} ${ey-size*Math.sin(a)-5*Math.cos(a)}L${ex-size*Math.cos(a)-5*Math.sin(a)} ${ey-size*Math.sin(a)+5*Math.cos(a)}Z" fill="${color}"/>${label?text(ex+10,ey-10,label,'vector-label'):''}</g>`;
 }
 function drawSetup(r){
  const cx=400,cy=290,l=200,a=r.alpha*Math.PI/180,b=r.beta*Math.PI/180;
  const endpoints=[{x:cx-l*Math.sin(a),y:cy-l*Math.cos(a),v:r.L,color:'#3278ad',label:'Fₗ',angle:r.alpha},{x:cx+l*Math.sin(b),y:cy-l*Math.cos(b),v:r.R,color:'#ac5796',label:'Fᵣ',angle:r.beta}];
  let s=`<path d="M60 65H740" stroke="#9890a2" stroke-width="9"/><path d="M400 65V450" stroke="#a9a4af" stroke-width="1.5" stroke-dasharray="6 6"/>`;
  for(const [i,p] of endpoints.entries()){
   s+=`<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="#8e7b5d" stroke-width="3"/>`;
   const angle=Math.atan2(cy-p.y,cx-p.x)*180/Math.PI;
   s+=`<path d="M${p.x} 65V${p.y}" stroke="#aaa0b5" stroke-width="2"/><g transform="translate(${p.x} ${p.y}) rotate(${angle})"><rect x="0" y="-12" width="85" height="24" rx="6" fill="${i===0?'#deedf8':'#f4e0ef'}" stroke="${p.color}" stroke-width="2"/><path d="M12 0l6 -6l6 12l6 -12l6 12l6 -12l6 12l6 -6" fill="none" stroke="${p.color}"/></g>`;
   const k=Math.min(70,110/Math.max(r.left,r.right,r.weight));s+=arrow(cx,cy,p.v.x*k,-p.v.y*k,p.color,p.label);
   const radius=i?65:45,startx=cx,starty=cy-radius,endx=cx+(i?1:-1)*radius*Math.sin(p.angle*Math.PI/180),endy=cy-radius*Math.cos(p.angle*Math.PI/180);
   if(p.angle>0)s+=`<path d="M${startx} ${starty}A${radius} ${radius} 0 0 ${i?1:0} ${endx} ${endy}" fill="none" stroke="${p.color}" stroke-width="2"/>`;
  }
  s+=`<circle cx="400" cy="290" r="6" fill="#483851"/><path d="M400 290V360" stroke="#8e7b5d" stroke-width="3"/><rect x="373" y="360" width="54" height="40" rx="5" fill="#d7c4a1" stroke="#806849"/>`+arrow(400,290,0,r.weight*Math.min(70,110/Math.max(r.left,r.right,r.weight)),'#b27b24','F_G');
  s+=text(45,32,`Links: ${fmt(M.number($('left').value))} N · α = ${fmt(r.alpha)}°`)+text(755,32,`Rechts: ${fmt(M.number($('right').value))} N · β = ${fmt(r.beta)}°`,'','end')+text(400,450,`F_G: ${fmt(r.weight)} N · Kraftpfeile im gleichen Maßstab · gestrichelt: Senkrechte`,'','middle');
  $('setup').innerHTML=`<svg viewBox="0 0 800 480" role="img" aria-label="Eure Versuchsskizze: linker Winkel ${r.alpha} Grad, rechter Winkel ${r.beta} Grad zur Senkrechten. Zwei Zugkräfte nach oben und Gewichtskraft nach unten.">${s}</svg>`;
 }
 function check(r){
  $('plausibility').className=r.balanced?'good':'warning';
  $('plausibility').innerHTML=`<strong>${r.balanced?'Messwerte im gewählten Vergleichsbereich':'Messwerte noch einmal prüfen'}</strong><div class="readings"><div>Seitlich übrig<strong>${fmt(r.residual.x,3)} N</strong></div><div>Senkrecht übrig<strong>${fmt(r.residual.y,3)} N</strong></div><div>Betrag der Restkraft<strong>${fmt(r.error,3)} N · ${fmt(r.relative,1)} %</strong></div></div><ul>${M.feedback(r).map(note=>'<li>'+note+'</li>').join('')}</ul><p class="hint">Positive Restkraft: nach rechts beziehungsweise nach oben. Negative Restkraft: nach links beziehungsweise nach unten.</p>`;
  if(r.expected){$('plausibility').innerHTML+=`<details><summary>Rechnerischer Vergleich für eure gemessenen Winkel</summary><p>Bei idealem Gleichgewicht wären links ${fmt(r.expected.left,3)} N und rechts ${fmt(r.expected.right,3)} N zu erwarten. Dies sind Rechenwerte, keine korrigierten Messungen. Messt erneut, statt diese Werte als Messwerte zu übernehmen.</p></details>`;}
 }
 function scaled(id){const v=M.vector(result,id,$('mode').value);const scale=Math.min(95,155/Math.max(M.number($('left').value),M.number($('right').value),result.weight));return {x:v.x*scale,y:-v.y*scale};}
 function resetPositions(){const down=$('mode').value==='meters';positions={left:{x:300,y:down?200:445},right:{x:600,y:down?200:445}};showSum=false;$('show-sum').setAttribute('aria-pressed','false');$('show-sum').textContent='Summenpfeil zeigen';}
 function end(id){const p=positions[id],v=scaled(id);return {x:p.x+v.x,y:p.y+v.y};}
 function boardFeedback(){
  const a=end('left'),b=positions.right,c=end('right'),d=positions.left,connected=Math.min(Math.hypot(a.x-b.x,a.y-b.y),Math.hypot(c.x-d.x,c.y-d.y))<2;
  $('vector-feedback').className=connected?'good':'notice';
  $('vector-feedback').textContent=(connected?'Die Pfeile liegen Spitze an Schaft. Vom Anfang des ersten bis zur Spitze des zweiten zeigt die Vektorsumme. ':'Legt den Anfang eines farbigen Pfeils an die Spitze des anderen. Dabei werden die Pfeile nur parallel verschoben. ')+(result.balanced?'Eure Summe passt innerhalb der Vergleichsgrenze zum schwarzen Vergleichspfeil.':'Eure Messwerte passen noch nicht genau zum schwarzen Vergleichspfeil. Die Abweichung bleibt beim Verschieben erhalten.');
 }
 function drawVectors(){
  if(!result)return;
  const down=$('mode').value==='meters',scale=Math.min(95,155/Math.max(M.number($('left').value),M.number($('right').value),result.weight));
  let s=`<defs><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#e8e2ed"/></pattern></defs><rect width="900" height="650" fill="url(#grid)"/>`;
  s+=text(25,32,'Nur parallel verschieben: Richtung und Länge bleiben erhalten.');
  for(const id of ['left','right']){
   const v=scaled(id),p=positions[id],color=id==='left'?'#3278ad':'#ac5796',label=(id==='left'?'Fₗ':'Fᵣ')+(down?'*':'');
   const ghost={x:id==='left'?300:600,y:down?200:445};s+=arrow(ghost.x,ghost.y,v.x,v.y,color,'',true);
   s+=`<g class="draggable" data-vector="${id}" tabindex="0" role="button" aria-label="${id==='left'?'Linken':'Rechten'} Kraftpfeil parallel verschieben. Pfeiltasten, Enter zum Anlegen."><line class="hit" x1="${p.x}" y1="${p.y}" x2="${p.x+v.x}" y2="${p.y+v.y}" stroke="transparent" stroke-width="32"/><circle cx="${p.x}" cy="${p.y}" r="9" fill="${color}"/>${arrow(p.x,p.y,v.x,v.y,color,label)}</g>`;
  }
  const origin=positions.left;
  s+=arrow(origin.x,origin.y,0,(down?1:-1)*result.weight*scale,'#37333c',down?'F_G':'−F_G');
  if(showSum){const l=scaled('left'),r=scaled('right');s+=arrow(origin.x+l.x,origin.y+l.y,r.x,r.y,'#ac5796','',true);s+=arrow(origin.x,origin.y,l.x+r.x,l.y+r.y,'#2c8a64','Summe');}
  s+=text(25,610,`Maßstab: ${fmt(scale,1)} Zeichnungseinheiten pro N. Schwarz: ${down?'Gewichtskraft nach unten':'Ausgleich zur Gewichtskraft nach oben'}.`,'small');
  s+=text(25,634,'* bezeichnet hier die entgegengesetzte Kraft auf den jeweiligen Kraftmesser.','small');
  const active=document.activeElement?.dataset?.vector;
  let board=$('vector-board');if(!board){$('vectors').innerHTML='<svg id="vector-board" viewBox="0 0 900 650" aria-label="Interaktive Kraftpfeile: blau links, violett rechts, schwarz Gewichtskraft oder ihr Ausgleich."></svg>';board=$('vector-board');bindBoard(board);}
  board.innerHTML=s;if(active&&!drag)board.querySelector(`[data-vector="${active}"]`)?.focus({preventScroll:true});boardFeedback();
 }
 function clamp(p,id){const v=scaled(id);return {x:Math.max(35-Math.min(0,v.x),Math.min(855-Math.max(0,v.x),p.x)),y:Math.max(65-Math.min(0,v.y),Math.min(565-Math.max(0,v.y),p.y))};}
 function join(id){const other=id==='left'?'right':'left';positions[id]=clamp(end(other),id);drawVectors();}
 function bindBoard(board){
  const point=e=>{const p=board.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(board.getScreenCTM().inverse());};
  board.addEventListener('pointerdown',e=>{const group=e.target.closest('[data-vector]');if(!group)return;e.preventDefault();const id=group.dataset.vector,p=point(e);drag={id,x:p.x-positions[id].x,y:p.y-positions[id].y};board.setPointerCapture(e.pointerId);});
  board.addEventListener('pointermove',e=>{if(!drag)return;const p=point(e);positions[drag.id]=clamp({x:p.x-drag.x,y:p.y-drag.y},drag.id);drawVectors();});
  function release(e){if(!drag)return;const id=drag.id,other=id==='left'?'right':'left',tip=end(other),p=positions[id];if(Math.hypot(tip.x-p.x,tip.y-p.y)<18)positions[id]=clamp(tip,id);drag=null;if(board.hasPointerCapture(e.pointerId))board.releasePointerCapture(e.pointerId);drawVectors();}
  board.addEventListener('pointerup',release);board.addEventListener('pointercancel',release);
  board.addEventListener('keydown',e=>{const group=e.target.closest('[data-vector]');if(!group)return;const id=group.dataset.vector,step=e.shiftKey?20:5,dirs={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};if(e.key==='Enter'){e.preventDefault();join(id);return;}if(!dirs[e.key])return;e.preventDefault();const [x,y]=dirs[e.key];positions[id]=clamp({x:positions[id].x+x,y:positions[id].y+y},id);drawVectors();});
 }
 function update(){
  const values=['left','right','weight','alpha','beta'].map((id,i)=>{const n=M.number($(id).value),valid=n!==null&&(i<2?n>=0&&n<=100:i===2?n>0&&n<=100:n>=0&&n<90);$(id).setAttribute('aria-invalid',String($(id).value.trim()!==''&&!valid));return valid?n:null;});
  $('tolerance-value').value=$('tolerance').value;
  result=values.every(v=>v!==null)?M.calculate(...values,Number($('tolerance').value)):null;
  $('mode-explanation').textContent=$('mode').value==='meters'?'Wir betrachten die Kräfte des Fadens auf die Kraftmesser. Sie zeigen entlang der Fäden zum Knoten hin. Im Gleichgewicht ergibt ihre Summe die Gewichtskraft nach unten.':'Wir betrachten die Kräfte auf den Knoten. Beide Kraftmesser ziehen ihn nach oben. Ihre Summe ist der entgegengesetzte Pfeil zur Gewichtskraft.';
  for(const id of ['reset-vectors','head-tail','show-sum'])$(id).disabled=!result;
  if(!result){$('plausibility').className='notice';$('plausibility').textContent='Gebt beide Kraftmesseranzeigen (0 bis 100 N), eine positive Gewichtskraft (bis 100 N) und beide Winkel (0 bis unter 90°) ein. Komma oder Punkt sind möglich.';$('setup').innerHTML='<p>Für eure Versuchsskizze fehlen noch gültige Messwerte.</p>';$('vectors').innerHTML='<p>Für die Kraftpfeile fehlen noch gültige Messwerte.</p>';$('vector-feedback').textContent='';}
  else{drawSetup(result);check(result);resetPositions();drawVectors();}
  save();
 }
 function mass(){const n=M.number($('mass').value),valid=n!==null&&n>0&&n<=10000;$('use-mass').disabled=!valid;$('mass-result').textContent=valid?`F_G = ${fmt(n/1000,4)} kg · 9,8 N/kg = ${fmt(n/1000*9.8,4)} N`:'Tragt eine positive Gesamtmasse bis 10000 g ein.';return valid?n/1000*9.8:null;}
 for(const id of ids){$(id).addEventListener('input',()=>{if(id==='mass'){mass();save();}else update();});}
 $('use-mass').onclick=()=>{const f=mass();if(f!==null){$('weight').value=String(Number(f.toFixed(6)));update();}};
 $('reset-vectors').onclick=()=>{resetPositions();drawVectors();};
 $('head-tail').onclick=()=>{const down=$('mode').value==='meters';positions.left={x:450,y:down?190:470};positions.right=end('left');drawVectors();};
 $('show-sum').onclick=()=>{showSum=!showSum;$('show-sum').setAttribute('aria-pressed',String(showSum));$('show-sum').textContent=showSum?'Summenpfeil ausblenden':'Summenpfeil zeigen';drawVectors();};
 $('clear').onclick=()=>{if(!confirm('Eure Eingaben zu M2-9 in diesem Browser löschen?'))return;for(const id of ['left','right','weight','alpha','beta','mass'])$(id).value='';$('tolerance').value='5';$('mode').value='meters';mass();update();};
 window.M2ProtocolSource=()=>({issues:result?[]:['Vervollständigt die fünf Messwerte und prüft die markierten Felder.'],experiment:'9',title:'Kräftezerlegung',
  globals:[['Linke Kraft Fₗ (N)',$('left').value],['Rechte Kraft Fᵣ (N)',$('right').value],['Gewichtskraft F_G (N)',$('weight').value],['Winkel α zur Senkrechten (°)',$('alpha').value],['Winkel β zur Senkrechten (°)',$('beta').value],['Gesamtmasse (g), optional',$('mass').value||'nicht eingegeben'],['Vergleichsgrenze (% von F_G)',$('tolerance').value]],
  headers:['Auswertung','Wert'],rows:result?[['Seitliche Restkraft (N)',fmt(result.residual.x,4)],['Senkrechte Restkraft (N)',fmt(result.residual.y,4)],['Restkraftbetrag (N)',fmt(result.error,4)],['Relative Abweichung (%)',fmt(result.relative,2)]]:[],
  figures:[{selector:'#setup svg',caption:'Versuchsskizze aus euren Messwerten'},{selector:'#vector-board',caption:$('mode').selectedOptions[0].textContent+' · aktuelle Pfeillage'}],summary:result?M.feedback(result).join(' '):'',analysis:[$('mode-explanation').textContent,$('vector-feedback').textContent,'Die Vergleichsgrenze ist keine berechnete Messunsicherheit. Richtung und Länge der Pfeile stammen aus den Messwerten.']});
 mass();update();
})();
