/* Run: node --test phef/wegdifferenz/tests/history.test.js */
if(typeof require==='function') {
  require('node:vm').runInThisContext(require('node:fs').readFileSync(require('node:path').join(__dirname,'../html/history.js'),'utf8'));
}
(() => {
  const assert=(ok,message)=>{if(!ok)throw Error(message);};
  const storage={value:null,getItem(){return this.value;},setItem(k,v){this.value=v;},removeItem(){this.value=null;}};
  const h=new ExerciseHistory(storage);
  h.start({start:1,end:3});h.state.startedAt=Date.now()-12000;h.wrong();h.wrong();
  h.solve({start:10,end:60,delta:50,speed:25});
  assert(h.state.records.length===1 && h.state.records[0].seconds===12 && h.state.records[0].errors===2,'solution timing and errors');
  assert(h.body()==='101000000002000000012','numeric fixed-width format');
  const restored=new ExerciseHistory(storage);assert(restored.state.records.length===1,'restore');
  restored.start({start:3,end:4});const next=new ExerciseHistory(storage);assert(next.state.startedAt===restored.state.startedAt,'active timer survives reload');
  next.wrong();next.finish();assert(next.state.errors===3 && next.state.records.length===1,'unfinished-task errors included');
  assert(new ExerciseHistory(storage).state.finished,'end persists');
  next.reset();assert(new ExerciseHistory(storage).state.records.length===0,'new round clears history');
  storage.value='{broken';assert(new ExerciseHistory(storage).state.records.length===0,'invalid JSON ignored');
  const blocked={getItem(){throw Error();},setItem(){throw Error();}};
  const memory=new ExerciseHistory(blocked);memory.start({start:0,end:1});memory.wrong();assert(!memory.saved && memory.state.errors===1,'storage failure keeps exercise usable');
  globalThis.historyTestResult='PASS: timestamps, durations, errors, persistence, active timer, finishing, reset, invalid storage, numeric format';
})();
