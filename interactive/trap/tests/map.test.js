/* node tests/map.test.js; no dependencies. */
(function(){
 'use strict';const M=typeof TrapMap!=='undefined'?TrapMap:require('../map-model.js');let count=0;
 const assert=(v,m)=>{if(!v)throw new Error(m);count++;};
 for(const from of Object.keys(M.points))for(const to of Object.keys(M.points)){
  const steps=M.route(from,to);let node=from==='basecamp'?'hub-4':from;
  for(const step of steps){const edge=M.edges.find(e=>e.id===step.road);assert(!!edge,'Existing visible road');assert(node===(step.reverse?edge.to:edge.from),'Continuous travel');node=step.reverse?edge.from:edge.to;}
  assert(node===(to==='basecamp'?'hub-4':to),'Destination reached');if(from===to)assert(steps.length===0,'No unnecessary travel');
 }
 assert(M.points['goldene-regel']&&M.edges.some(e=>e.id==='goldene-regel'),'Ramp connected');
 assert(M.edges.filter(e=>e.id.startsWith('ring-')).length===8,'Ring around building');
 if(typeof console!=='undefined')console.log('PASS: '+count+' road graph checks');return count;
})();
