/* Free parallel translations, shared by the incline analysis. Coordinates of forces are y-up. */
(function(root){
 'use strict';
 const text=(x,y,s)=>`<text x="${x}" y="${y}" class="vector-label">${s}</text>`;
 function arrow(x,y,dx,dy,color,label='',ghost=false){const ex=x+dx,ey=y+dy,a=Math.atan2(dy,dx),n=Math.hypot(dx,dy);if(n<1e-9)return label?text(x+10,y-10,label+' = 0 N'):'';return `<g opacity="${ghost?.3:1}"><line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="${color}" stroke-width="${ghost?2:4}" ${ghost?'stroke-dasharray="6 5"':''}/><path d="M${ex} ${ey}L${ex-10*Math.cos(a)+5*Math.sin(a)} ${ey-10*Math.sin(a)-5*Math.cos(a)}L${ex-10*Math.cos(a)-5*Math.sin(a)} ${ey-10*Math.sin(a)+5*Math.cos(a)}Z" fill="${color}"/>${label?text(ex+10,ey-10,label):''}</g>`;}
 function mount(host,config){let positions={},show=false,drag=null;const vectors=config.vectors,scale=Math.min(95,150/Math.max(config.weight,...vectors.map(v=>Math.hypot(v.x,v.y))));
  host.innerHTML='<svg id="vector-board" viewBox="0 0 900 650" aria-label="Zwei parallel verschiebbare Kraftkomponenten mit Vergleichspfeil"></svg>';const svg=host.querySelector('svg'),down=config.reference.y<0;
  const component=i=>({x:vectors[i].x*scale,y:-vectors[i].y*scale});
  const initial=i=>({x:i?600:300,y:down?190:470});
  const end=i=>({x:positions[i].x+component(i).x,y:positions[i].y+component(i).y});
  function clamp(p,i){const v=component(i);return {x:Math.max(35-Math.min(0,v.x),Math.min(855-Math.max(0,v.x),p.x)),y:Math.max(65-Math.min(0,v.y),Math.min(570-Math.max(0,v.y),p.y))};}
  function draw(){const focused=document.activeElement?.dataset?.vector;let html='<defs><pattern id="vector-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" stroke="#e8e2ed" fill="none"/></pattern></defs><rect width="900" height="650" fill="url(#vector-grid)"/>';
   vectors.forEach((v,i)=>{const p=positions[i],d=component(i),ghost=initial(i);html+=arrow(ghost.x,ghost.y,d.x,d.y,v.color,'',true);html+=`<g class="draggable" data-vector="${i}" tabindex="0" role="button" aria-label="${v.label}: parallel verschieben mit Pfeiltasten, Enter zum Anlegen"><line class="hit" x1="${p.x}" y1="${p.y}" x2="${p.x+d.x}" y2="${p.y+d.y}" stroke="transparent" stroke-width="32"/><circle cx="${p.x}" cy="${p.y}" r="8" fill="${v.color}"/>${arrow(p.x,p.y,d.x,d.y,v.color,v.label)}</g>`;});
   const e0=end(0),e1=end(1),forward=Math.hypot(e0.x-positions[1].x,e0.y-positions[1].y)<2,backward=Math.hypot(e1.x-positions[0].x,e1.y-positions[0].y)<2,origin=backward?positions[1]:positions[0],sum={x:component(0).x+component(1).x,y:component(0).y+component(1).y};
   html+=arrow(origin.x,origin.y,config.reference.x*scale,-config.reference.y*scale,'#34323b',config.reference.label);
   if(show){const first=backward?1:0,second=1-first,a=component(first),b=component(second);html+=arrow(origin.x+a.x,origin.y+a.y,b.x,b.y,vectors[second].color,'',true)+arrow(origin.x,origin.y,sum.x,sum.y,'#2d8c66','Summe');}
   html+='<text x="25" y="32">Richtung und Länge bleiben gleich. Verschiebt nur die Lage der Pfeile.</text>'+`<text x="25" y="620" class="small">Gemeinsamer Maßstab: ${scale.toFixed(1).replace('.',',')} Zeichnungseinheiten pro N. Schwarz: ${config.reference.label}.</text>`;svg.innerHTML=html;
   if(focused!==undefined&&!drag)svg.querySelector(`[data-vector="${focused}"]`)?.focus({preventScroll:true});
   config.onFeedback((forward||backward?'Die Pfeile liegen Spitze an Schaft. ':'Legt einen Pfeilschaft an die Spitze des anderen Pfeils. ')+(config.balanced?'Die Summe passt innerhalb eurer Vergleichsgrenze zum schwarzen Pfeil.':'Die Messabweichung bleibt beim Verschieben sichtbar. Prüft die Messung und die Richtungen.'));
  }
  function reset(){positions={0:initial(0),1:initial(1)};show=false;draw();}
  const point=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());};
  svg.onpointerdown=e=>{const target=e.target.closest('[data-vector]');if(!target)return;e.preventDefault();const i=+target.dataset.vector,p=point(e);drag={i,x:p.x-positions[i].x,y:p.y-positions[i].y};svg.setPointerCapture(e.pointerId);};
  svg.onpointermove=e=>{if(!drag)return;const p=point(e);positions[drag.i]=clamp({x:p.x-drag.x,y:p.y-drag.y},drag.i);draw();};
  function release(e){if(!drag)return;const i=drag.i,tip=end(1-i);if(Math.hypot(tip.x-positions[i].x,tip.y-positions[i].y)<18)positions[i]=clamp(tip,i);drag=null;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);draw();}svg.onpointerup=release;svg.onpointercancel=release;
  svg.onkeydown=e=>{const target=e.target.closest('[data-vector]');if(!target)return;const i=+target.dataset.vector,step=e.shiftKey?20:5,delta={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[e.key];if(e.key==='Enter'){e.preventDefault();positions[i]=clamp(end(1-i),i);draw();}else if(delta){e.preventDefault();positions[i]=clamp({x:positions[i].x+delta[0],y:positions[i].y+delta[1]},i);draw();}};
  reset();return {reset,assemble(){positions[0]={x:450,y:down?185:470};positions[1]=end(0);draw();},toggleSum(){show=!show;draw();return show;}};
 }
 root.MechanicsVectors={mount,arrow};
})(typeof globalThis!=='undefined'?globalThis:this);
