'use strict';
const G=Geometry,$=id=>document.getElementById(id),svg=$('field'),ns='http://www.w3.org/2000/svg';
const centerPose={x:G.width/2,y:G.height/2,heading:-90};
let robot={...centerPose},origin={...robot},ball=null,segments=[],drag=null;
let busy=false,connecting=false,poseKnown=true,epoch=0,cancelAnimation=null,scanState=null,remoteState='IDLE';
let scanExpected=null;
let samples=new Map(),scanPose={...robot},scanSummary='Noch kein Scan.';
const ble=new KalleBle(onMessage,onDisconnect);
const demo=()=>!ble.connected&&$('ble').value==='demo';
const status=text=>{$('status').textContent=text;};
const point=e=>{const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());return{x:p.x,y:p.y};};
function el(name,attrs,parent){const n=document.createElementNS(ns,name);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);parent.appendChild(n);return n;}
function render(){
  $('robot').setAttribute('transform',`translate(${robot.x} ${robot.y}) rotate(${robot.heading})`);
  $('ball').style.display=ball?'':'none';if(ball)$('ball').setAttribute('transform',`translate(${ball.x} ${ball.y})`);
  $('paths').replaceChildren();$('handles').replaceChildren();let start=origin;
  segments.forEach((s,i)=>{
    el('line',{x1:start.x,y1:start.y,x2:s.end.x,y2:s.end.y,stroke:'#2979ef','stroke-width':7,'marker-end':'url(#arrow)'},$('paths'));
    el('circle',{cx:s.end.x,cy:s.end.y,r:18,fill:'white',stroke:'#2979ef','stroke-width':5,class:'handle','data-index':i},$('handles'));
    el('text',{x:s.end.x+24,y:s.end.y-24,fill:'#2565af','font-size':24},$('handles')).textContent=String(i+1);start=s.end;
  });
  $('obstacles').replaceChildren();let visible=0,outside=0,invalid=0;
  const tolerance=1e-6; // Keep simulated wall hits despite floating-point rounding.
  for(const sample of samples.values()){
    if(sample.quality!==0||sample.distance===0){invalid++;continue;}
    const p=G.scanPoint(scanPose,sample);
    if(p.x< -tolerance||p.x>G.width+tolerance||p.y< -tolerance||p.y>G.height+tolerance){outside++;continue;}
    visible++;
    const circle=el('circle',{cx:p.x,cy:p.y,r:5,fill:'#d54b68',opacity:.85},$('obstacles'));
    el('title',{},circle).textContent=`${sample.index}: ${sample.distance} mm · ${sample.angle.toFixed(2)}°`;
  }
  $('go').disabled=busy||connecting||segments.length!==2||!poseKnown||(!demo()&&!ble.connected);
  $('scan').disabled=busy||connecting||(!demo()&&!ble.connected);
  $('stop').disabled=!busy||connecting;
  $('ble').disabled=busy||connecting||ble.connected;
  $('connect').disabled=busy||connecting||ble.connected;
  $('disconnect').disabled=!ble.connected||connecting;
  $('commands').textContent=segments.length===2?G.commands(segments).join('\n'):'Noch keine vollständige Route geplant.';
  $('positions').textContent=`Roboter: x ${Math.round(robot.x)} mm · y ${Math.round(robot.y)} mm\nRichtung: ${Math.round(((robot.heading%360)+360)%360)}° (270° = oben)\n${poseKnown?'Lokale Pose · bei BLE aus Schritten geschätzt':'Pose unsicher · vor der nächsten Fahrt scannen'}\n${ball?'Ball: nur Demo-Zielmarker':'Ball: nicht separat erkannt'}\n${segments.length}/2 Strecken geplant`;
  $('scanInfo').textContent=`${scanSummary} · ${samples.size}/${scanExpected??"…"} Messwerte · ${visible} sichtbare Treffer · ${invalid} ungültig${outside?` · ${outside} außerhalb der Fläche ausgeblendet`:''}`;
}
function resetDemo(){
  const random=(a,b)=>a+Math.random()*(b-a);
  robot={...centerPose};origin={...robot};poseKnown=true;segments=[];samples.clear();scanState=null;scanExpected=null;
  do{ball={x:random(100,G.width-100),y:random(100,G.height-100)};}while(G.distance(robot,ball)<G.margin+20);scanSummary='Demo · noch kein Scan';render();
}
function onMessage(message){
  if(message.type==='T')remoteState=message.state;
  if(!scanState)return;
  if(message.type==='S'&&message.id===scanState.id){
    if(message.phase==='BEGIN')scanState.began=true;
    if(message.phase==='END'){scanState.ended=true;scanState.expected=message.count;scanExpected=message.count;}
  }
  if(message.type==='P'&&scanState.began){
    samples.set(message.index,message);
    if(!scanState.recovering)robot.heading=-90+message.angle;
    scanSummary='BLE-Scan läuft';render();
  }
}
function onDisconnect(error){
  epoch++;cancelAnimation?.();busy=false;scanState=null;poseKnown=false;ball=null;segments=[];
  $('connection').textContent='BLE getrennt · erneute Verbindung und Scan nötig';status(error.message);render();
}
async function addKnownDevices(){
  try{for(const device of await ble.knownDevices())addDeviceOption(device);}catch{/* The chooser still works without getDevices(). */}
}
function addDeviceOption(device){
  if(Array.from($('ble').options).some(o=>o.value===device.id))return;
  const option=document.createElement('option');option.value=device.id;option.textContent=device.name||'Kalle-FZ';$('ble').appendChild(option);
}
$('connect').onclick=async()=>{
  if(busy||connecting)return;connecting=true;render();
  try{
    const selected=$('ble').value,device=await ble.connect(selected==='demo'||selected==='new'?null:selected);
    addDeviceOption(device);$('ble').value=device.id;
    robot={...centerPose};origin={...robot};ball=null;segments=[];samples.clear();scanExpected=null;poseKnown=false;
    remoteState='UNKNOWN';await ble.command('STATUS',{timeout:10000});
    $('connection').textContent=`Verbunden: ${device.name||'Kalle-FZ'} · ${remoteState}`;
    status('Roboter verbunden. Zuerst Scan ausführen; die Karte wird relativ zur aktuellen Blickrichtung angelegt.');
  }catch(error){status(error.message);}finally{connecting=false;render();}
};
$('disconnect').onclick=()=>ble.disconnect();
$('ble').onchange=()=>{if(demo()){resetDemo();status('Simulation ohne Hardware. Scan erzeugt Demo-Messpunkte.');}else{poseKnown=false;status('Verbinden wählen und anschließend scannen.');render();}};
$('safe').setAttribute('d',`M${G.margin} ${G.margin}H${G.width-G.margin}V${G.height-G.margin}H${G.margin}Z`);
svg.addEventListener('pointerdown',e=>{
  if(busy||connecting||!poseKnown||e.button!==0)return;
  const p=point(e),handle=e.target.closest('[data-index]');let index;
  if(handle)index=Number(handle.dataset.index);
  else if(G.distance(p,origin)<75)index=0;
  else if(segments.length===1&&G.distance(p,segments[0].end)<55)index=1;else return;
  if(index===0&&segments.length===1&&handle)index=1;
  drag={index,pointerId:e.pointerId,previous:segments.slice()};svg.setPointerCapture(e.pointerId);e.preventDefault();
});
svg.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointerId)return;
  const start=drag.index===0?origin:segments[0].end,heading=drag.index===0?origin.heading:segments[0].heading;
  const s=G.segment(start,point(e),heading);if(!s)return;
  segments=drag.index===0?[s]:[segments[0],s];render();
});
svg.addEventListener('pointerup',e=>{
  if(!drag||e.pointerId!==drag.pointerId)return;drag=null;svg.releasePointerCapture(e.pointerId);
  status(segments.length===2?'Route bereit. Los führt die vier Operationen aus.':'Zweiten Pfeil vom Endpunkt des ersten aus ziehen.');render();
});
svg.addEventListener('pointercancel',()=>{if(drag){segments=drag.previous;drag=null;render();}});
function animate(duration,update,completion=null){
  return new Promise((resolve,reject)=>{
    let start,frame,finished=false;
    const abort=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);cancelAnimation=null;reject(Error('Bewegung abgebrochen.'));};
    cancelAnimation=abort;
    const finish=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);cancelAnimation=null;update(1);render();resolve();};
    if(completion)completion.then(finish,error=>{if(!finished){finished=true;cancelAnimationFrame(frame);cancelAnimation=null;reject(error);}});
    function tick(t){
      if(finished)return;if(start===undefined)start=t;
      const progress=Math.min(completion ? 0.95 : 1,(t-start)/duration);update(progress);render();
      if(!completion&&progress>=1)finish();else frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
  });
}
async function haltAfterFailure(hardware,token){
  if(hardware&&ble.connected&&token===epoch){
    try{await ble.command('STOP',{timeout:15000});}
    catch{if(token===epoch)ble.disconnect();}
  }
}
function motionTime(steps,forward=false){const speed=forward?1000:1050,acceleration=forward?600:540;return 1000*(steps<speed*speed/acceleration?2*Math.sqrt(steps/acceleration):steps/speed+speed/acceleration);}
$('go').onclick=async()=>{
  if(busy||segments.length!==2||!poseKnown)return;
  const token=++epoch,route=segments.slice(),commands=G.commands(route),hardware=ble.connected;busy=true;render();
  try{
    for(let i=0;i<2;i++){
      if(token!==epoch)throw Error('Fahrt abgebrochen.');
      const s=route[i],heading=robot.heading;
      status(`${i*2+1}/4 · ${commands[i*2]}${hardware?' · BLE, Animation geschätzt':''}`);
      await animate(hardware?motionTime(Math.abs(s.turn)*14.57778):Math.max(150,Math.abs(s.turn)/90*1000),p=>{robot.heading=heading+s.turn*p;},hardware?ble.command(commands[i*2]):null);
      if(token!==epoch)throw Error('Fahrt abgebrochen.');
      const from={x:robot.x,y:robot.y};status(`${i*2+2}/4 · ${commands[i*2+1]}${hardware?' · BLE, Animation geschätzt':''}`);
      await animate(hardware?motionTime(s.length*20.37183,true):Math.max(150,s.length/250*1000),p=>{robot.x=from.x+(s.end.x-from.x)*p;robot.y=from.y+(s.end.y-from.y)*p;},hardware?ble.command(commands[i*2+1]):null);
    }
    origin={...robot};segments=[];status('Fahrt abgeschlossen. Neue Pfeile am aktuellen Roboter ziehen.');
  }catch(error){if(token===epoch){poseKnown=!hardware;segments=[];origin={...robot};status(error.message);await haltAfterFailure(hardware,token);}}
  finally{if(token===epoch){busy=false;render();}}
};
async function scanDemo(token){
  robot={...centerPose};scanPose={...robot};samples.clear();segments=[];scanExpected=180;
  // Ray intersections with the square and demo ball, with the same sensor offset.
  const demoSamples=[];
  for(let index=0;index<180;index++){
    const angle=index*2,beta=G.rad(scanPose.heading+angle),dx=Math.cos(beta),dy=Math.sin(beta),sx=scanPose.x+20*dx,sy=scanPose.y+20*dy;
    const distances=[];
    if(dx>1e-9)distances.push((G.width-sx)/dx);if(dx< -1e-9)distances.push(-sx/dx);
    if(dy>1e-9)distances.push((G.height-sy)/dy);if(dy< -1e-9)distances.push(-sy/dy);
    if(ball){const bx=sx-ball.x,by=sy-ball.y,b=bx*dx+by*dy,c=bx*bx+by*by-400,discriminant=b*b-c;
      if(discriminant>=0){const hit=-b-Math.sqrt(discriminant);if(hit>0)distances.push(hit);}}
    demoSamples.push({index,angle,distance:Math.min(...distances),quality:0});
  }
  await animate(3500,p=>{
    if(token!==epoch)return;robot.heading=-90+p*360;
    for(let i=0;i<Math.min(180,Math.floor(p*180)+1);i++)samples.set(i,demoSamples[i]);
    scanSummary='Demo-Scan läuft';
  });
}
$('scan').onclick=async()=>{
  if(busy||connecting)return;
  const token=++epoch,hardware=ble.connected;busy=true;poseKnown=false;drag=null;segments=[];samples.clear();
  robot={...centerPose};origin={...robot};scanPose={...robot};scanExpected=hardware?null:180;scanSummary=hardware?'BLE-Scan wird gestartet':'Demo-Scan';render();
  try{
    if(hardware){
      ball=null;scanState={id:null,began:false,ended:false,expected:null};
      status('360°-Scan läuft. Die Karte ist auf die Blickrichtung beim Scanstart ausgerichtet.');
      await ble.command('SCAN',{timeout:600000,onAllocated:id=>{scanState.id=id;}});
      if(token!==epoch)throw Error('Scan abgebrochen.');
      const expected=scanState.expected;
      if(!scanState.ended)scanSummary='Scan beendet · Anzahl nicht bestätigt';
      else if(samples.size!==expected)scanSummary=`Scan beendet · ${samples.size} von ${expected} Messwerten empfangen`;
      else scanSummary='BLE-Scan vollständig';
    }else await scanDemo(token);
    if(token!==epoch)return;
    robot.heading=-90;origin={...robot};poseKnown=true;
    if(!hardware)scanSummary='Demo-Scan vollständig';
    status('Scan beendet. Blickrichtung ist oben; gültige Entfernungstreffer innerhalb der Fläche sind eingezeichnet.');
  }catch(error){if(token===epoch){scanSummary='Scan unvollständig';status(error.message);await haltAfterFailure(hardware,token);}}
  finally{if(token===epoch){scanState=null;busy=false;render();}}
};
$('stop').onclick=async()=>{
  if(!busy)return;
  const token=++epoch;cancelAnimation?.();scanState=null;poseKnown=false;segments=[];status('Stop · Roboter bremst …');render();
  try{if(ble.connected)await ble.command('STOP',{timeout:15000});
    if(token===epoch)status('Gestoppt. Vor der nächsten Fahrt erneut scannen.');
  }catch(error){if(token===epoch){status(error.message);if(ble.connected)ble.disconnect();}}
  finally{if(token===epoch){busy=false;scanSummary='Abgebrochen · Karte unvollständig';render();}}
};
resetDemo();status('Simulation bereit. Verbinden öffnet die BLE-Geräteauswahl.');addKnownDevices();
if(!navigator.bluetooth)$('connection').textContent='Simulation · Web Bluetooth fehlt in diesem Browser (Chrome/Edge nutzen)';
window.addEventListener('pagehide',()=>{if(ble.connected)ble.disconnect();});
