/* Gemeinsame Einheit mit ph9/kraefte-zeichnen/html/: Neue Features ggf. in BEIDEN Versionen ergänzen; EF enthält zusätzliche Aufgaben 4 und 5. */
'use strict';
(() => {
const ns='http://www.w3.org/2000/svg';
const stages=Array.from({length:3},()=>({arrows:[],done:false,pending:null}));
const colors=['#246ba0','#b85e12','#8051a0'];
const titles=['1 – Einzelne Gegenstände','2 – Kräfte aneinanderfügen','3 – Gesamte Gewichtskraft'];
const tasks=[
 'Zeichne am Angriffspunkt des Apfels (0,2 kg) und am Angriffspunkt der Flasche (0,5 kg) jeweils die Gewichtskraft nach unten.',
 'Beginne am Angriffspunkt der Tüte mit der Gewichtskraft des Apfels. Setze danach die Gewichtskraft der Flasche an die Spitze des ersten Pfeils. Beide Pfeile zeigen nach unten.',
 'Zeichne vom Angriffspunkt der Tüte aus einen einzigen Pfeil nach unten, der die gesamte Gewichtskraft darstellt.'
];
const close=(x,y)=>Math.hypot(x.sx-y.sx,x.sy-y.sy,x.ex-y.ex,x.ey-y.ey)<=12;
const expected=[
 [{sx:60,sy:120,ex:60,ey:180},{sx:180,sy:120,ex:180,ey:270}],
 [{sx:120,sy:120,ex:120,ey:180},{sx:120,sy:180,ex:120,ey:330}],
 [{sx:120,sy:120,ex:120,ey:330}]
];
function point(x,y,label='Angriffspunkt'){return `<circle cx="${x}" cy="${y}" r="4" fill="#242424"><title>${label}</title></circle><text x="${x}" y="${y-10}" text-anchor="middle" font-size="10">${label}</text>`;}
function scene(i){return i===0?`<text x="60" y="65" text-anchor="middle" font-size="33">🍎</text><text x="60" y="87" text-anchor="middle" font-size="13">0,2 kg</text><text x="180" y="65" text-anchor="middle" font-size="33">🧴</text><text x="180" y="87" text-anchor="middle" font-size="13">0,5 kg</text>${point(60,120)}${point(180,120)}`:`<path d="M80 45 Q120 5 160 45 L175 95 H65 Z" fill="#f7e6d7" stroke="#965633"/><text x="120" y="75" text-anchor="middle" font-size="24">🍎 🧴</text>${point(120,120)}`;}
function arrow(a,k){const dx=a.ex-a.sx,dy=a.ey-a.sy,n=Math.hypot(dx,dy),ux=dx/n||0,uy=dy/n||0;return `<g stroke="${colors[k]}"><path d="M${a.sx} ${a.sy} L${a.ex} ${a.ey}" stroke-width="3"/><path d="M${a.ex-10*ux+4*uy} ${a.ey-10*uy-4*ux} L${a.ex} ${a.ey} L${a.ex-10*ux-4*uy} ${a.ey-10*uy+4*ux}" fill="none" stroke-width="3"/><text stroke="none" fill="${colors[k]}" x="${a.sx+8}" y="${(a.sy+a.ey)/2}" font-size="12">${k===2?'F gesamt':'F'+(k+1)}</text></g>`;}
function kind(i,a,j){return i===2?2:i===0?(a.sx<120?0:1):j;}
function unlocked(i){return i===0||stages[i-1].done;}
function invalidate(i){stages[i].done=false;for(let j=i+1;j<3;j++){stages[j].done=false;stages[j].arrows=[];stages[j].pending=null;if(document.getElementById(`bag-stage-${j}`)){paint(j);message(j,'Bitte zuerst das vorherige Feld erneut abschließen.');}}sync();}
function sync(){stages.forEach((s,i)=>{const card=document.getElementById(`bag-stage-${i}`);if(!card)return;const active=unlocked(i);card.querySelector('fieldset').disabled=!active;card.classList.toggle('locked',!active);card.querySelector('.stage-status').textContent=s.done?'✓ Erledigt':active?'Jetzt bearbeiten':`Erst Feld ${i} abschließen`;card.querySelector('svg').setAttribute('aria-label',`${titles[i]}${active?'':', noch gesperrt'}`);});window.dispatchEvent(new Event('bag-progress'));}
function paint(i,draft){const s=stages[i],card=document.getElementById(`bag-stage-${i}`);card.querySelector('.bag-arrows').innerHTML=s.arrows.map((a,j)=>arrow(a,kind(i,a,j))).join('')+(draft?arrow(draft,kind(i,draft,s.arrows.length)):'')+(s.pending?`<circle cx="${s.pending.x}" cy="${s.pending.y}" r="5" fill="#965633"/>`:'');}
function add(i,a){if(!unlocked(i))return;const max=i===2?1:2;if(stages[i].arrows.length>=max){message(i,'Entferne zuerst einen Pfeil, um ihn neu zu zeichnen.');return;}if(Math.hypot(a.ex-a.sx,a.ey-a.sy)<4)return;invalidate(i);stages[i].arrows.push(a);paint(i);}
function message(i,text){document.querySelector(`#bag-stage-${i} .bag-feedback`).textContent=text;}
function render(){const host=document.getElementById('bag-workspace');if(host.children.length){sync();return;}
host.innerHTML=stages.map((s,i)=>`<section class="bag-stage" id="bag-stage-${i}"><h3>${titles[i]}</h3><p class="stage-status" role="status"></p><fieldset><legend class="sr-only">${titles[i]}</legend><p>${tasks[i]}</p><svg viewBox="0 0 240 420" role="img"><defs><pattern id="bag-grid-${i}" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0 H0 V30" fill="none" stroke="#dfd8cd"/></pattern></defs><rect width="240" height="420" fill="url(#bag-grid-${i})"/>${scene(i)}<g class="bag-arrows"></g></svg><p class="help">Vom Punkt zur Pfeilspitze ziehen oder beide nacheinander antippen.</p><div class="bag-actions"><button data-action="undo">Letzten Pfeil entfernen</button><button data-action="check">Prüfen</button></div><details><summary>Ohne Ziehen eingeben</summary><p>Koordinaten in Kästchen: x nach rechts (0–8), y nach unten (0–14).</p><div class="coordinates">${['sx','sy','ex','ey'].map((k,j)=>`<label>${['Anfang x','Anfang y','Ende x','Ende y'][j]}<input name="${k}" type="number" min="0" max="${j%2?14:8}" step="any" value="${j%2?(j>1?6:4):4}"></label>`).join('')}</div><button data-action="add">Pfeil hinzufügen</button></details><p class="bag-feedback" role="status" aria-live="polite"></p></fieldset></section>`).join('');
stages.forEach((s,i)=>{const card=document.getElementById(`bag-stage-${i}`),svg=card.querySelector('svg');let gesture=null;
function pos(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return{x:Math.max(0,Math.min(240,Math.round(q.x/15)*15)),y:Math.max(0,Math.min(420,Math.round(q.y/15)*15))};}
svg.addEventListener('pointerdown',e=>{if(!unlocked(i))return;e.preventDefault();gesture=pos(e);svg.setPointerCapture(e.pointerId);});
svg.addEventListener('pointermove',e=>{if(gesture&&unlocked(i)){const p=pos(e);paint(i,{sx:gesture.x,sy:gesture.y,ex:p.x,ey:p.y});}});
svg.addEventListener('pointerup',e=>{if(!gesture||!unlocked(i))return;const p=pos(e);if(Math.hypot(p.x-gesture.x,p.y-gesture.y)>4){add(i,{sx:gesture.x,sy:gesture.y,ex:p.x,ey:p.y});s.pending=null;}else if(s.pending){add(i,{sx:s.pending.x,sy:s.pending.y,ex:p.x,ey:p.y});s.pending=null;}else s.pending=p;gesture=null;paint(i);});
svg.addEventListener('pointercancel',()=>{gesture=null;s.pending=null;paint(i);});
card.querySelector('[data-action="undo"]').onclick=()=>{invalidate(i);s.arrows.pop();s.pending=null;paint(i);message(i,'Zeichnung geändert. Bitte erneut prüfen.');};
card.querySelector('[data-action="add"]').onclick=()=>{const values=['sx','sy','ex','ey'].map(k=>{const v=card.querySelector(`[name="${k}"]`).value;return v.trim()===''?NaN:Number(v)*30;});if(values.every((v,j)=>Number.isFinite(v)&&v>=0&&v<=(j%2?420:240)))add(i,Object.fromEntries(['sx','sy','ex','ey'].map((k,j)=>[k,values[j]])));else message(i,'Bitte gültige Koordinaten innerhalb des Feldes eingeben.');};
card.querySelector('[data-action="check"]').onclick=()=>{let a=s.arrows;if(i===0)a=[...a].sort((x,y)=>x.sx-y.sx);const ok=a.length===expected[i].length&&a.every((v,j)=>close(v,expected[i][j]));if(!ok)invalidate(i);else s.done=true;sync();message(i,ok?(i<2?'Richtig! Das nächste Feld ist jetzt freigeschaltet.':'Richtig! Die gesamte Gewichtskraft beträgt 7 N. Halte deine Erkenntnisse fest.'):'Prüfe Angriffspunkt, Richtung und Pfeillänge. Ein Kästchen entspricht 1 N.');};paint(i);});sync();}
window.BagExercise={render,get hasCompleted(){return stages.some(s=>s.done);},get completedGraphics(){return stages.flatMap((s,i)=>s.done?[document.querySelector(`#bag-stage-${i} svg`).cloneNode(true)]:[]);},get done(){return stages.every(s=>s.done);}};
})();
