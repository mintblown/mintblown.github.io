/* Run: node --test ph6/experiment-aufbauen/tests/model.test.js
 * The same tests can be evaluated after model.js in any JavaScript engine. */
if (typeof require === 'function') {
  const fs = require('node:fs');
  const vm = require('node:vm');
  vm.runInThisContext(fs.readFileSync(require('node:path').join(__dirname, '../html/model.js'), 'utf8'));
}
(() => {
  const {ExperimentObject, LinePort, Assembly}=ExperimentModel;
  const assert=(ok,message)=>{if(!ok) throw Error(message);};
  const part=(id,x,y,ports,extra={})=>new ExperimentObject({id,x,y,bounds:[-5,-5,5,5],ports,...extra});
  const pin=(id,type='mount',x=0,y=0)=>({id,type,x,y});
  {
    const a=part('a',100,100,[pin('a')]), b=part('b',120,100,[pin('b','hook')]);
    const world=new Assembly([a,b]);
    assert(!world.connect(a.ports[0],b.ports[0]),'different types must not connect');
    assert(!world.connect(a.ports[0],a.ports[0]),'self connection forbidden');
  }
  {
    // No hard-coded object pairs: interchangeable hooks, multiple ports, either drag direction.
    const a=part('arbitrary-a',100,100,[pin('a','hook'),pin('a2','hook',0,40),pin('a3','hook',0,80)]);
    const b=part('arbitrary-b',120,100,[pin('b','hook')]);
    const c=part('arbitrary-c',120,140,[pin('c','hook')]);
    const world=new Assembly([a,b,c]);
    const ab=world.connect(a.ports[0],b.ports[0],b);
    assert(ab && b.x===100,'reverse docking aligns moved component');
    assert(world.connect(a.ports[1],c.ports[0],c),'second arbitrary port connects');
    assert(!world.connect(a.ports[0],a.ports[2]),'occupied ports cannot be reused');
    world.move(c,40,20);assert(a.x===140 && b.x===140 && c.y===160,'rigid branch moves as a unit');
    ab.disconnect();world.move(b,20,0);assert(a.x===140 && b.x===160,'specific edge detaches');
    world.reset();assert(world.connections().length===0 && a.x===100 && c.y===140,'reset');
  }
  {
    const base=part('base',100,400,[pin('base')],{grounded:true});
    const rod=part('rod',100,100,[pin('foot','mount',0,300),{...pin('rail'),end:{x:0,y:200}}]);
    const slider=part('slider',110,180,[pin('slider'),pin('side','hook',30)]);
    const ball=part('ball',140,180,[pin('ball','hook')]);
    const world=new Assembly([base,rod,slider,ball]);
    assert(world.connect(rod.ports[0],base.ports[0]),'foot to grounded base');
    assert(world.connect(slider.ports[0],rod.ports[1]),'point anywhere on line');
    const rail=rod.ports[1];assert(rail instanceof LinePort && Math.abs(rail.t-.4)<1e-8,'projection onto rail');
    assert(world.connect(ball.ports[0],slider.ports[1]),'accessory on slider');
    world.move(ball,50,30);assert(slider.x===100 && slider.y===210 && ball.y===210 && rod.y===100,'only carriage slides');
    world.move(slider,0,999);assert(slider.y===300 && rail.t===1,'line upper parameter bound');
    world.move(slider,0,-999);assert(slider.y===100 && rail.t===0,'line lower parameter bound');
    world.move(rod,20,50);assert(base.x===120 && base.y===400 && rod.y===100 && ball.x===150,'grounded assembly translates horizontally');
    world.move(base,999,0);assert(world.fits(world.component(base)),'all connected parts respect bounds');
    assert(!world.connect(slider.ports[0],base.ports[0]),'occupied endpoints rejected');
  }
  {
    // Generic straight-line constraint also handles diagonal tracks without special-casing y.
    const rail=part('rail',100,100,[{...pin('line'),end:{x:100,y:100}}]);
    const slider=part('slider',150,150,[pin('point')]);
    const world=new Assembly([rail,slider]);world.connect(slider.ports[0],rail.ports[0]);
    world.move(slider,20,0);assert(slider.x===160 && slider.y===160,'project drag onto straight line');
  }
  {
    const box=part('box',100,400,[pin('box')],{grounded:true});
    const item=part('item',110,390,[pin('item')]);
    const world=new Assembly([box,item]);
    assert(world.connect(box.ports[0],item.ports[0],box),'grounded endpoint connects from either direction');
    assert(box.y===400 && item.y===400,'grounded body stays fixed vertically');
  }
  {
    const a=part('a',30,30,[pin('a')]), b=part('b',50,30,[pin('b')]);
    const world=new Assembly([a,b]);assert(world.snap(b),'nearest matching port snaps');
    const c=part('c',100,100,[pin('c')]);world.objects.push(c);
    assert(!world.snap(c),'far ports do not snap');
  }
  globalThis.modelTestResult='PASS: port types, arbitrary branches, reverse docking, sliding, grounded assemblies, limits, detachment, reset';
})();
