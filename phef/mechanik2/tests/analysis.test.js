(function(){
 'use strict';const M=typeof MechanicsAnalysis!=='undefined'?MechanicsAnalysis:require('../analysis-model.js');let count=0;
 const assert=(v,s)=>{if(!v)throw new Error(s);count++;},near=(a,b)=>Math.abs(a-b)<1e-9;
 assert(M.number('−0,05')===-.05,'Typographic minus accepted');assert(M.number('-0,05')===-.05,'Signed zero correction');assert(M.number('1,2')===1.2,'Decimal comma');assert(M.number('9'.repeat(400))===null,'Overflow rejected');
 for(let n=1;n<=8;n++)for(const load of [.98,1.96,3.92]){
  const roller=.49,h=10,force=(load+roller)/n,r=M.pulley(load,roller,force,n,h,n*h);
  assert(near(r.normalized-load,roller),'Weight intercept independent of load and n');assert(near(r.massEquivalent-r.massLoad,50),'Pulley mass as intercept in grams');assert(near(r.inputWork,r.totalLift),'Moving block included in work');assert(near(r.ratio,n),'Rope way ratio');assert(near(r.forceError,0)&&near(r.wayError,0),'Ideal residuals');
 }
 assert(near(M.pulley(1,.2,.35,4,10,40,.05).force,.3),'Zero correction subtracted');assert(M.pulley(1,.2,.01,4,10,40,.05)===null,'Negative corrected force rejected');
 assert(M.pulley(1,.2,.3,0,10,40)===null,'Invalid supporting strand count');
 const low=M.ramp(.98,100,.392,20,100),high=M.ramp(.98,100,.784,40,100);
 assert(near(low.weight,1.96),'Wagon and additional mass included');assert(near(high.force/low.force,2),'Force proportional to height at fixed s and G');assert(near(low.x,low.y),'Normalized force and geometry proportional');assert(near(low.inputWork,low.liftWork),'Ramp work comparison');assert(near(low.wayRatio,low.forceRatio),'Way factor and force factor');assert(M.ramp(1,0,.1,101,100)===null,'Impossible geometry');assert(M.ramp(1,0,0,20,100).forceRatio===null,'No division by zero');
 for(const angle of [5,15,30,45,70,85]){const a=angle*Math.PI/180,G=2,h=100*Math.sin(a),b=100*Math.cos(a),r=M.incline(G*Math.sin(a),G*Math.cos(a),G,h,b,100,angle);
  assert(r.balanced&&near(r.error,0),'Full vector closure');assert(near(r.length,100)&&near(r.angle,angle),'Geometry derived correctly');assert(near(r.pythagoras,r.weightSquared),'Pythagoras');assert(r.parallel.y<0&&r.perpendicular.y<0,'Weight components downwards');assert(near(r.sum.x,0)&&near(r.sum.y,-G),'Weight vector reconstructed');
 }
 const wrong=M.incline(Math.sqrt(3),1,2,50,Math.sqrt(7500));assert(near(wrong.pythagoras,wrong.weightSquared)&&!wrong.balanced,'Pythagoras alone cannot validate directions');
 assert(Math.abs(M.incline(1,Math.sqrt(3),2,50,Math.sqrt(7500),90).lengthError)>2,'Independent length mismatch');
 assert(M.incline(1,1,2,0,100)===null,'Zero height rejected');assert(M.incline(-1,1,2,20,100)===null,'Negative force rejected');
 if(typeof console!=='undefined')console.log('PASS: '+count+' analysis checks');return count;
})();
