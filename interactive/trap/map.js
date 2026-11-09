(function () {
  'use strict';
  const {state,format}=Trap,{points,edges,route}=TrapMap,{isActive,active}=TrapAvailability;
  const titles={federkraft:'Zugkraft',hebel:'Hebel','goldene-regel':'Goldene Regel',uebersetzung:'Übersetzung',raeder:'Räder',reibung:'Reibung',rechnen:'Rechnen',testgelaende:'Testgelände'};
  const nodes=[...document.querySelectorAll('[data-destination]')],car=document.getElementById('traveller'),start=document.getElementById('start-lesson'),status=document.getElementById('map-status'),overview=document.getElementById('open-station');
  const overlay=document.querySelector('.map-overlay'),paths={};let current='basecamp',moving=false;
  overlay.innerHTML=edges.map(edge=>`<path class="island-road-edge" d="${edge.d}"/><path id="road-${edge.id}" class="island-road" d="${edge.d}"/><path class="island-road-dashes" d="${edge.d}"/>`).join('');
  edges.forEach(edge=>paths[edge.id]=document.getElementById('road-'+edge.id));
  const place=p=>{car.style.left=p.x/1536*100+'%';car.style.top=p.y/1024*100+'%';};
  const position=id=>({x:points[id][0],y:points[id][1]});
  function progress(){
    nodes.forEach(node=>{
      const id=node.dataset.destination,p=points[id],enabled=isActive(id);
      node.style.left=p[0]/1536*100+'%';node.style.top=p[1]/1024*100+'%';
      node.classList.toggle('visited',enabled&&state.explored[id]===true);
      node.setAttribute('aria-label',enabled?`Zu ${titles[id]} reisen${state.explored[id]===true?' · als bearbeitet markiert':''}`:`${titles[id]} · vorerst deaktiviert`);
      node.title=enabled?titles[id]:titles[id]+' · vorerst deaktiviert';
      if(!enabled)node.setAttribute('aria-disabled','true');
    });
    document.getElementById('map-progress').textContent=`${format(active.filter(id=>state.explored[id]===true).length,0)} / ${active.length} aktive Stationen bearbeitet · weitere Stationen vorerst deaktiviert`;
  }
  function segment(step){const path=paths[step.road],length=path.getTotalLength(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.max(500,length*2.5);return new Promise(resolve=>{let begin;function frame(time){begin??=time;const amount=duration?Math.min((time-begin)/duration,1):1;const eased=amount*amount*(3-2*amount);place(path.getPointAtLength((step.reverse?1-eased:eased)*length));if(amount<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});}
  async function travel(target){
    if(moving)return;
    if(!isActive(target)){status.textContent='Diese Station ist vorerst deaktiviert. Wählt Zugkraft, Hebel oder Goldene Regel.';return;}
    const steps=route(current,target);moving=true;start.hidden=true;car.setAttribute('aria-busy','true');nodes.forEach(n=>n.setAttribute('aria-disabled','true'));
    status.textContent=`Unterwegs zu ${target==='basecamp'?'Basecamp':titles[target]} …`;
    overview.href=target==='basecamp'?'#basecamp':`${target}.html`;
    for(const step of steps)await segment(step);
    current=target;place(position(target));moving=false;car.setAttribute('aria-busy','false');nodes.forEach(n=>{if(isActive(n.dataset.destination))n.removeAttribute('aria-disabled');});
    if(target==='basecamp'){status.textContent='Ihr seid am Basecamp. Wählt eure nächste Werkstatt.';overview.textContent='Mission kennenlernen ↓';}
    else{start.href=`${target}.html`;start.textContent='Lektion starten →';start.setAttribute('aria-label',`${titles[target]}: Lektion starten`);start.hidden=false;status.textContent=`Angekommen: ${titles[target]}. Startet die Lektion über eurer Figur.`;overview.textContent=`${titles[target]} öffnen →`;start.focus({preventScroll:true});}
  }
  nodes.forEach(node=>node.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();travel(node.dataset.destination);}));
  const base=document.querySelector('.map-node.base');base.style.left=(points.basecamp[0]-90)/1536*100+'%';base.style.top=(points.basecamp[1]-45)/1024*100+'%';base.addEventListener('click',event=>{event.preventDefault();travel('basecamp');});
  place(position(current));progress();window.TrapTravel={travel,get current(){return current},get moving(){return moving}};
})();
