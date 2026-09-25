(() => {
  'use strict';
  const {ExperimentObject, LinePort, Assembly} = ExperimentModel;
  const $ = id => document.getElementById(id), scene = $('scene');
  const types = {mount:{color:'#8742aa',label:'Halterung'}, hook:{color:'#bc5900',label:'Haken / Seil'}};
  const port = (id,type,x=0,y=0,extra={}) => ({id,type,x,y,...extra});
  const objects = [
    new ExperimentObject({id:'box',x:180,y:410,bounds:[-100,0,100,110],grounded:true,ports:[port('box-dock','mount')]}),
    new ExperimentObject({id:'rod',x:390,y:100,bounds:[-20,-9,20,309],ports:[port('rod-base','mount',0,300),port('rod-dock','mount',0,46,{end:{x:0,y:282}})]}),
    new ExperimentObject({id:'block',x:540,y:300,bounds:[-64,-32,64,32],ports:[port('block-dock','mount',0,14),port('block-arm-dock','mount',55)]}),
    new ExperimentObject({id:'arm',x:550,y:90,bounds:[-9,-40,150,37],ports:[port('arm-left','mount'),port('arm-right','hook',130,28)]}),
    new ExperimentObject({id:'rope',x:760,y:160,bounds:[-9,-9,65,209],ports:[port('rope-top','hook'),port('rope-bottom','hook',0,200)]}),
    new ExperimentObject({id:'ball',x:650,y:390,bounds:[-30,-12,30,110],ports:[port('ball-top','hook')]})
  ];
  const assembly=new Assembly(objects), byId=new Map(objects.map(o=>[o.id,o])), ids=[...byId.keys()];
  const pendulum = new PendulumView();
  let selected=null, drag=null;
  function render() {
    pendulum.setAvailable(PendulumModel.isReady(objects));
    for(const object of objects) {
      $(object.id).setAttribute('transform',`translate(${object.x} ${object.y})`);
      $(object.id).classList.toggle('selected',selected===object.id);
      for(const port of object.ports) {
        const dot=$(port.id), point=port.position();
        dot.setAttribute('cx',point.x-object.x); dot.setAttribute('cy',point.y-object.y);
        dot.style.setProperty('--port-color',types[port.type].color);
        dot.classList.toggle('joined',!!port.connection);
        dot.setAttribute('aria-label',`${types[port.type].label}: ${port.connection ? 'verbunden' : 'frei'}${port instanceof LinePort ? ', verschiebbar' : ''}`);
      }
    }
    const select=$('connection-choice'), previous=select.value;
    select.replaceChildren();
    const object=byId.get(selected);
    for(const port of object?.ports ?? []) if(port.connection) {
      const option=document.createElement('option'); option.value=port.id;
      option.textContent=`${types[port.type].label} → ${port.connection.other(object).id === 'box' ? 'Kiste' : names[port.connection.other(object).id]}`;
      select.append(option);
    }
    if([...select.options].some(o=>o.value===previous)) select.value=previous;
    select.disabled=!object?.connections().length; $('detach').disabled=select.disabled;
  }
  const names={box:'Kiste',rod:'Stange',block:'Klotz',arm:'Rundhakenstange',rope:'Seil',ball:'Kugel'};
  function select(id) { selected=id;render(); }
  function move(id,dx,dy) { assembly.move(byId.get(id),dx,dy);render(); }
  function snap(id) {
    if(assembly.snap(byId.get(id))) $('status').textContent='Verbunden. Die Typfarbe bleibt erhalten; der blaue Rand markiert die Verbindung.';
    render();
  }
  function point(event) {
    const p = scene.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
    return p.matrixTransform(scene.getScreenCTM().inverse());
  }
  for (const id of ids) {
    const element = $(id);
    element.addEventListener('focus', () => select(id));
    element.addEventListener('pointerdown', event => {
      if (drag || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault(); element.focus(); select(id);
      drag = {id, pointer: event.pointerId, previous: point(event)};
      element.setPointerCapture(event.pointerId); element.classList.add('dragging');
    });
    element.addEventListener('pointermove', event => {
      if (!drag || drag.pointer !== event.pointerId || drag.id !== id) return;
      const p = point(event); move(id, p.x-drag.previous.x, p.y-drag.previous.y); drag.previous = p;
    });
    const finish = event => {
      if (!drag || drag.pointer !== event.pointerId || drag.id !== id) return;
      drag = null; element.classList.remove('dragging');
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      if (event.type === 'pointerup') snap(id);
    };
    element.addEventListener('pointerup', finish);
    element.addEventListener('pointercancel', finish);
    element.addEventListener('lostpointercapture', finish);
    element.addEventListener('keydown', event => {
      const directions = {ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1]};
      if (!directions[event.key]) return;
      event.preventDefault(); const [dx,dy] = directions[event.key], step = event.shiftKey ? 20 : 5;
      move(id, dx*step, dy*step); snap(id);
    });
  }
  $('detach').addEventListener('click',()=>{
    const object=byId.get(selected), port=object?.ports.find(p=>p.id===$('connection-choice').value);
    if(!port?.connection) return;
    const connection=port.connection, other=connection.other(object);
    connection.disconnect();
    // Keep both resulting assemblies intact and separate the selected joint visibly.
    const group=assembly.component(object), moving=[...group].some(o=>o.grounded) ? other : object;
    const before=moving.x; assembly.move(moving,40,0);
    if(moving.x===before) assembly.move(moving,-40,0);
    render(); $(selected).focus(); $('status').textContent='Die ausgewählte Verbindung ist gelöst.';
  });
  $('reset').addEventListener('click',()=>{
    if(drag) { const {id,pointer}=drag;drag=null;$(id).classList.remove('dragging');if($(id).hasPointerCapture(pointer)) $(id).releasePointerCapture(pointer); }
    assembly.reset();selected=null;render();$('status').textContent='Zurückgesetzt. Gleichfarbige Anschlüsse passen zusammen.';
  });
  render();
})();
