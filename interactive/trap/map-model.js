/* Visible roads and traveller share this graph. The ring keeps the car outside the pavilion. */
(function(root){
  'use strict';
  const ids=['hebel','goldene-regel','uebersetzung','raeder','basecamp','reibung','rechnen','federkraft'];
  const hubs=[[768,305],[924,356],[988,480],[924,604],[768,655],[612,604],[548,480],[612,356]];
  const points={basecamp:[768,655],hebel:[768,195],'goldene-regel':[1120,275],uebersetzung:[1160,500],raeder:[1035,680],testgelaende:[768,705],reibung:[485,690],rechnen:[400,500],federkraft:[400,275]};
  const edges=[];
  for(let i=0;i<8;i++){
    const j=(i+1)%8,a=hubs[i],b=hubs[j];
    edges.push({id:'ring-'+i,from:'hub-'+i,to:'hub-'+j,d:`M${a[0]} ${a[1]} A220 175 0 0 1 ${b[0]} ${b[1]}`});
  }
  ids.forEach((id,i)=>{if(id==='basecamp')return;const p=points[id],h=hubs[i];edges.push({id,from:'hub-'+i,to:id,d:`M${h[0]} ${h[1]} L${p[0]} ${p[1]}`});});
  edges.push({id:'testgelaende',from:'hub-4',to:'testgelaende',d:'M768 655L768 705'});
  function route(from,to){
    if(!points[from]||!points[to])throw new Error('Unbekannter Ort');
    const origin=from==='basecamp'?'hub-4':from,target=to==='basecamp'?'hub-4':to;
    const queue=[{node:origin,steps:[]}],seen=new Set([origin]);
    for(let index=0;index<queue.length;index++){const {node,steps}=queue[index];if(node===target)return steps;
      for(const edge of edges){const reverse=edge.to===node,next=reverse?edge.from:edge.from===node?edge.to:null;if(next&&!seen.has(next)){seen.add(next);queue.push({node:next,steps:[...steps,{road:edge.id,reverse}]});}}
    }
    throw new Error('Kein Weg gefunden');
  }
  root.TrapMap={points,edges,route};if(typeof module!=='undefined')module.exports=root.TrapMap;
})(typeof globalThis!=='undefined'?globalThis:this);
