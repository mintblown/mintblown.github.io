'use strict';
document.getElementById('app').onload=()=>{
try{
const w=document.getElementById('app').contentWindow,d=w.document,$=id=>d.getElementById(id);let count=0;
function assert(ok,msg){if(!ok)throw new Error(msg);count++;}
function nav(n){d.querySelector(`[data-part="${n}"]`).click();}
function enter(i,coords){const c=$('ef-card-'+i);['sx','sy','ex','ey'].forEach((k,j)=>c.querySelector(`[name="${k}"]`).value=coords[j]/30);c.querySelector('[data-action="add"]').click();}
function verify(i){$('ef-card-'+i).querySelector('[data-action="check"]').click();}
function components(i,label){const c=$('ef-card-'+i),text=[...c.querySelectorAll('.ef-scene text')].find(t=>t.textContent===label),path=text.parentElement.querySelector('path').getAttribute('d'),v=path.match(/-?\d+(?:\.\d+)?/g).map(Number);return {x:v[2]-v[0],y:v[3]-v[1]};}
assert(d.querySelectorAll('[data-part]').length===5,'Five parts');nav(3);assert(!$('ef-workspace').hidden,'EF workspace visible');assert($('drawing-workspace').hidden,'Base workspace hidden');assert($('next-task').hidden,'No early next');
for(let i=0;i<3;i++){
 const c=$('ef-card-'+i),weight=Number(c.querySelector('p strong').textContent.match(/\d+/)[0]),v=components(i,'F₁');assert(v.x!==0&&v.y<0,'Oblique force');assert(Number.isInteger(v.x/30)&&Number.isInteger(v.y/30),'Integer grid');enter(i,[180,450,180,450-30]);verify(i);assert(!w.EFExercises.done(3),'Wrong vector rejected');enter(i,[180,450,180-v.x,450-weight*30-v.y]);verify(i);assert(c.querySelector('.ef-feedback').textContent.startsWith('Richtig'),'Balance solved');
}
assert(!$('next-task').hidden,'Next available');$('next-task').click();assert($('title').textContent.startsWith('5'),'Next opens ship');
for(let round=0;round<4;round++){
 const c=$('ef-card-3'),v1=components(3,'F1'),v2=components(3,'F2'),dx=v1.x+v2.x,dy=v1.y+v2.y;assert([v1.x,v1.y,v2.x,v2.y].every(v=>Number.isInteger(v/30)),'Ship forces on whole grid');const force=Math.hypot(dx,dy)/30*100000,a=force/50000000,speed=a*10;
 assert(c.querySelector('.ship-answers').hidden&&c.querySelector('.ship-answers').disabled,'Calculations initially locked');assert(c.querySelector('.ef-scene>path').getAttribute('d').includes('L120 300'),'Origin at bow');enter(3,[120,300,150,300]);c.querySelector('[data-action="drawing-check"]').click();assert(c.querySelector('.ship-answers').hidden,'Wrong drawing keeps calculations locked');enter(3,[120,300,120+dx,300+dy]);assert(c.querySelector('.ef-arrows').textContent.includes('kN'),'Magnitude in drawing');c.querySelector('[data-action="drawing-check"]').click();assert(!c.querySelector('.ship-answers').disabled&&!c.querySelector('.ship-answers').hidden,'Correct drawing unlocks calculations');c.querySelector('[data-action="calculate"]').click();assert(!w.EFExercises.done(4),'Empty numeric answers rejected');for(const [key,value]of [['acceleration',a.toPrecision(2)],['speed',speed.toPrecision(2)]]){c.querySelector(`[name="${key}"]`).value=value.replace('.',',');}c.querySelector('[data-action="calculate"]').click();assert(w.EFExercises.done(4),'Ship calculation solved');
 if(round<3){$('new-ship').click();assert(!w.EFExercises.done(4)&&$('next-task').hidden,'New ship clears result');}
}
$('next-task').click();assert(!$('results-overview').hidden,'Overview opened');assert($('overview-graphics').querySelectorAll('svg').length===4,'EF completed graphics in overview');assert($('overview-graphics').textContent.includes('v(10 s)'),'Calculated values in overview');$('close-overview').click();assert(!$('ef-workspace').hidden,'Returned to EF');
document.getElementById('result').textContent=`PASS ${count} checks`;
}catch(e){document.getElementById('result').textContent='FAIL '+e.stack;}
};
