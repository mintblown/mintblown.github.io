/* Run: node --test phef/wegdifferenz/tests/model.test.js */
if(typeof require==='function') {
  require('node:vm').runInThisContext(require('node:fs').readFileSync(require('node:path').join(__dirname,'../html/model.js'),'utf8'));
}
(() => {
  const {distance,measurements,interval,parse,check}=DistanceExercise;
  const assert=(ok,message)=>{if(!ok)throw Error(message);};
  assert(distance(0)===0 && distance(10)<500,'curve fits axes and starts at rest');
  for(let t=1;t<=10;t++)assert(distance(t)>distance(t-1),'increasing distance');
  const data=measurements(()=>.75);
  assert(data.length===11 && data[0].s===0,'one measurement each second including start');
  for(let i=1;i<data.length;i++)assert(data[i].t===i && Math.abs(data[i].s-distance(i))<=4,'small scatter');
  assert(parse('12,5')===12.5 && parse(' 0 ')===0,'German decimal input');
  for(const value of ['','12m','1.2.3','-3','Infinity'])assert(Number.isNaN(parse(value)),'invalid input '+value);
  for(let start=0;start<10;start+=.5) for(let end=start+.5;end<=Math.min(10,start+3);end+=.5) {
    const task={start,end},a=Math.round(distance(start)/5)*5,b=Math.round(distance(end)/5)*5;
    assert(check(task,a,b,b-a,Math.round((b-a)/(end-start)*10)/10).ok,'rounded reading accepted');
    assert(!check(task,a+20,b,b-a,0).ok,'wrong start rejected');
    assert(!check(task,a,b+20,b-a,0).ok,'wrong end rejected');
    assert(check(task,a,b,b-a+10,0).field==='delta','arithmetic checked independently');
    assert(check(task,a,b,b-a,(b-a)/(end-start)+1).field==='speed','wrong speed rejected');
    for(const random of [()=>0,()=>.999999]) {
      const next=interval(task,random);
      assert(next.start!==start || next.end!==end,'new task differs');
      assert(next.start>=0 && next.end<=10 && next.end-next.start>=.5 && next.end-next.start<=3 && Number.isInteger(next.start*2) && Number.isInteger(next.end*2),'interval bounds');
    }
  }
  assert(!check({start:2,end:5},NaN,20,10).ok,'missing input rejected');
  globalThis.distanceTestResult='PASS: curve, scattered measurements, parsing, all 105 half-second intervals, reading tolerance, arithmetic, speed and task generation';
})();
