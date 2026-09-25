/* Run: node --test ph6/experiment-aufbauen/tests/pendulum.test.js */
if(typeof require==='function') {
  const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
  for(const file of ['model.js','pendulum-model.js']) vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../html',file),'utf8'));
}
(() => {
  const assert=(ok,message)=>{if(!ok)throw Error(message);};
  const {Pendulum,isReady}=PendulumModel;
  for(const length of [.1,1,2]) {
    const p=new Pendulum(length);p.reset(Math.PI/2);const energy=p.energy();
    for(let i=0;i<240*120;i++)p.step(1/240);
    assert(Math.abs(p.energy()-energy)/energy<.00002,'energy conserved at length '+length);
    assert(Math.abs(p.angle)<=Math.PI/2+.00001,'amplitude stays within release angle');
    p.reset();for(let i=0;i<240;i++)p.step(1/240);
    assert(p.angle===0 && p.sample().vx===0,'rest remains at rest');
  }
  for(const angle of [0,Math.PI/6,-Math.PI/6,Math.PI/2]) {
    const oscillator=new Pendulum(1.5);oscillator.reset(angle);
    const limits=oscillator.amplitudes();
    assert(Math.abs(limits.x-1.5*Math.abs(Math.sin(angle)))<1e-12,'displacement amplitude');
    assert(Math.abs(limits.vx-Math.sqrt(2*9.81*1.5*(1-Math.cos(angle))))<1e-12,'horizontal velocity amplitude');
    for(let i=0;i<240;i++)oscillator.step(1/240);
    assert(Math.abs(oscillator.amplitudes().vx-limits.vx)<1e-7,'amplitude independent of current phase');
  }
  const p=new Pendulum(1);p.reset(.01);
  for(let i=0;i<240*Math.PI/Math.sqrt(9.81);i++)p.step(1/240);
  assert(Math.abs(p.angle+.01)<.00001,'small-angle half period');
  p.reset(.7);p.step(1/240);const a=p.sample();p.step(.000001);const b=p.sample();
  assert(Math.abs((b.x-a.x)/.000001-a.vx)<.00001,'vx is horizontal derivative');
  p.reset(9);assert(p.angle===Math.PI/2,'positive release limit');p.reset(-9);assert(p.angle===-Math.PI/2,'negative release limit');
  p.setLength(3);assert(p.length===2 && p.time===0 && p.omega===0 && p.angle===0,'length upper limit and reset');
  p.setLength(0);assert(p.length===.1,'length lower limit');
  const {ExperimentObject,Connection}=ExperimentModel;
  const ids=[['box-dock'],['rod-base','rod-dock'],['block-dock','block-arm-dock'],['arm-left','arm-right'],['rope-top','rope-bottom'],['ball-top']];
  const objects=ids.map((ports,i)=>new ExperimentObject({id:String(i),x:0,y:0,bounds:[0,0,0,0],ports:ports.map(id=>({id,type:'test'}))}));
  const port=id=>objects.flatMap(o=>o.ports).find(p=>p.id===id);
  const links=[['box-dock','rod-base'],['rod-dock','block-dock'],['block-arm-dock','arm-left'],['arm-right','rope-top'],['rope-bottom','ball-top']];
  assert(!isReady(objects),'incomplete assembly hidden');
  const connections=links.map(([a,b])=>new Connection(port(a),port(b)));
  assert(isReady(objects),'complete assembly unlocks');
  for(const connection of connections) {connection.disconnect();assert(!isReady(objects),'every connection required');new Connection(connection.a,connection.b);}
  port('rod-dock').connection.disconnect();port('arm-left').connection.disconnect();
  new Connection(port('rod-dock'),port('block-arm-dock'));new Connection(port('block-dock'),port('arm-left'));
  assert(isReady(objects),'interchangeable block ports accepted');
  globalThis.pendulumTestResult='PASS: nonlinear motion, energy over 120 s at all lengths, velocity, release limits, rest/reset, assembly gating';
})();
