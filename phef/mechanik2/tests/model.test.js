(function(){
 'use strict';const M=typeof M29!=='undefined'?M29:require('../model.js');let count=0;
 const assert=(v,m)=>{if(!v)throw new Error(m);count++;},near=(a,b)=>Math.abs(a-b)<1e-9;
 assert(M.number('1,25')===1.25,'Decimal comma');assert(M.number('0')===0,'Zero');
 for(const raw of ['',null,'-1','1e3','2 N','NaN'])assert(M.number(raw)===null,'Invalid numeric input');
 const symmetric=M.calculate(1,1,Math.sqrt(3),30,30);
 assert(symmetric.balanced,'Symmetric equilibrium');assert(near(symmetric.sum.x,0),'Horizontal balance');assert(near(symmetric.sum.y,Math.sqrt(3)),'Vertical balance');
 const meterL=M.vector(symmetric,'left','meters'),meterR=M.vector(symmetric,'right','meters');
 assert(near(meterL.x+meterR.x,0),'Meter forces horizontal balance');assert(near(meterL.y+meterR.y,-Math.sqrt(3)),'Meter sum downward');
 assert(near(M.vector(symmetric,'left','knot').y,symmetric.L.y),'Knot view upwards');
 for(const [alpha,beta]of [[10,60],[45,20],[70,15],[0,30],[30,0],[89,89]]){
  const theoretical=M.calculate(1,1,2,alpha,beta).expected;
  const r=M.calculate(theoretical.left,theoretical.right,2,alpha,beta);
  assert(r.balanced,'Asymmetric equilibrium '+alpha+','+beta);assert(near(r.error,0),'Zero residual');
 }
 assert(M.calculate(1,1,2,0,0).expected===null,'Vertical case indeterminate force sharing');
 assert(M.calculate(1,1,2,0,0).balanced,'Vertical case valid total');
 const wrong=M.calculate(1,1,2,60,20);
 assert(!wrong.balanced,'Inconsistent data flagged');assert(M.feedback(wrong).some(t=>t.includes('Seitlich')),'Angle/adjustment advice');
 assert(M.feedback(wrong).some(t=>t.includes('Nullstellung')),'Zero-position advice');
 assert(M.feedback(M.calculate(0,0,1,20,20)).some(t=>t.includes('0 N')),'Zero reading advice');
 assert(M.feedback(M.calculate(2,2,1,80,80)).some(t=>t.includes('flach')),'Angle sensitivity advice');
 for(const values of [[-1,1,2,30,30],[1,1,0,30,30],[1,1,2,90,30],[1,1,2,-1,30],[NaN,1,2,30,30],[1,1,2,30,30,0]])assert(M.calculate(...values)===null,'Invalid physics input');
 assert(M.calculate(1,1,2,0,0).left===1,'Source readings retained');
 if(typeof console!=='undefined')console.log('PASS: '+count+' mechanics checks');return count;
})();
