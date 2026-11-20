const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const G=require('./geometry.js');
class Element {
 constructor(){this.children=[];this.style={};this.attrs={};this.value='demo';this.options=[];}
 setAttribute(k,v){this.attrs[k]=v;}appendChild(child){this.children.push(child);this.options.push(child);return child;}
 replaceChildren(){this.children=[];}addEventListener(){}setPointerCapture(){}releasePointerCapture(){}
}
const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
let client,frames=new Map(),nextFrame=0,clock=0;
class FakeBle {
 constructor(onMessage,onDisconnect){client=this;this.onMessage=onMessage;this.onDisconnect=onDisconnect;this.connected=false;this.commands=[];this.nextId=0;this.missing=17;this.sampleCount=180;this.dropEnd=false;}
 knownDevices(){return Promise.resolve([]);}
 async command(body,options={}){
  this.commands.push(body);const id=this.nextId++;options.onAllocated?.(id);
  if(body==='SCAN'){
   this.onMessage({type:'S',id,phase:'BEGIN'});
   for(let i=0;i<this.sampleCount;i++)if(i!==this.missing)this.onMessage({type:'P',index:i,angle:i*2,distance:150,quality:i===4?1:0});
   if(!this.dropEnd)this.onMessage({type:'S',id,phase:'END',count:this.sampleCount});
  }
  if(body==='COUNT')this.onMessage({type:'N',id,count:this.sampleCount});
  if(body.startsWith('GET'))this.onMessage({type:'P',index:Number(body.slice(3)),angle:34,distance:150,quality:0});
  return {id};
 }
 disconnect(){this.connected=false;this.onDisconnect(Error('disconnected'));}
}
const context={Geometry:G,KalleBle:FakeBle,console,document:{getElementById:get,createElement:()=>new Element(),createElementNS:()=>new Element()},navigator:{},window:{addEventListener(){}},requestAnimationFrame:fn=>{frames.set(++nextFrame,fn);return nextFrame;},cancelAnimationFrame:id=>frames.delete(id),setTimeout,clearTimeout};
vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/app.js','utf8'),context);
async function drain(){for(let i=0;i<200;i++){
 await Promise.resolve();const jobs=Array.from(frames.entries());frames.clear();clock+=1000;for(const [,job]of jobs)job(clock);
 if(!vm.runInContext('busy',context)&&frames.size===0)return;
 }throw Error('GUI did not finish');}
async function main(){
 const demo=get('scan').onclick();await drain();await demo;
 assert.equal(vm.runInContext('robot.heading',context),-90);assert.equal(vm.runInContext('samples.size',context),180);
 client.connected=true;get('ble').value='robot';const scan=get('scan').onclick();await drain();await scan;
 assert(!client.commands.some(c=>c.startsWith('GET')));assert.equal(vm.runInContext('samples.size',context),179);assert(vm.runInContext('poseKnown',context));
 assert.equal(get('obstacles').children.length,178);assert.equal(vm.runInContext('robot.heading',context),-90);
 client.sampleCount=137;client.dropEnd=true;const recovered=get('scan').onclick();await drain();await recovered;
 assert(!client.commands.includes('COUNT'));assert.equal(vm.runInContext('samples.size',context),136);assert.equal(vm.runInContext('scanExpected',context),null);
 client.sampleCount=650;client.dropEnd=false;const largeScan=get('scan').onclick();await drain();await largeScan;
 assert.equal(vm.runInContext('samples.size',context),649);assert.equal(get('obstacles').children.length,648);
 vm.runInContext(`{const a=G.segment(robot,{x:500,y:300},robot.heading);const b=G.segment(a.end,{x:650,y:300},a.heading);segments=[a,b];render();}`,context);
 const before=client.commands.length,drive=get('go').onclick();await drain();await drive;
 assert.deepEqual(client.commands.slice(before),['R000DEGR','G200MMF','R090DEGR','G150MMF']);
 assert.equal(vm.runInContext('Math.round(robot.x)',context),650);assert.equal(vm.runInContext('Math.round(robot.y)',context),300);
 assert.equal(vm.runInContext('segments.length',context),0); // no stale route replay
 client.disconnect();assert(get('go').disabled);assert.equal(vm.runInContext('poseKnown',context),false);
 console.log('OK: GUI-Demoscan, BLE-Livestream ohne Nachladen, Hindernisse, Ausrichtung, vier sequenzielle Fahrbefehle und Abbruch.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
