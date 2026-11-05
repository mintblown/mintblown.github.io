/* y is positive upwards; angles are measured from the upwards vertical. */
(function(root){
 'use strict';
 function number(raw){if(typeof raw==='number')return Number.isFinite(raw)?raw:null;if(typeof raw!=='string'||!/^\d+(?:[.,]\d*)?$/.test(raw.trim()))return null;const n=Number(raw.trim().replace(',','.'));return Number.isFinite(n)?n:null;}
 function calculate(left,right,weight,alpha,beta,tolerance=5){
  if(![left,right,weight,alpha,beta,tolerance].every(Number.isFinite)||left<0||right<0||weight<=0||left>100||right>100||weight>100||alpha<0||beta<0||alpha>=90||beta>=90||tolerance<1||tolerance>20)return null;
  const a=alpha*Math.PI/180,b=beta*Math.PI/180;
  const L={x:-left*Math.sin(a),y:left*Math.cos(a)},R={x:right*Math.sin(b),y:right*Math.cos(b)},sum={x:L.x+R.x,y:L.y+R.y};
  const residual={x:sum.x,y:sum.y-weight},error=Math.hypot(residual.x,residual.y),relative=error/weight*100;
  const denominator=Math.sin(a+b);
  const expected=Math.abs(denominator)>1e-8?{left:weight*Math.sin(b)/denominator,right:weight*Math.sin(a)/denominator}:null;
  return {left,right,L,R,sum,residual,error,relative,balanced:relative<=tolerance,expected,weight,alpha,beta,tolerance};
 }
 function vector(result,id,mode){const sign=mode==='meters'?-1:1,v=id==='left'?result.L:result.R;return {x:v.x*sign,y:v.y*sign};}
 function feedback(r){
  const notes=[];const limit=r.weight*r.tolerance/100;
  if(r.balanced)notes.push('Die Messwerte passen innerhalb eurer gewählten Vergleichsgrenze zum Kräftegleichgewicht. Das ist ein Plausibilitätscheck, kein Beweis für fehlerfreie Messungen.');
  else notes.push('Die Kräfte schließen noch nicht zum Gleichgewicht. Prüft den Aufbau und wiederholt die Messung, bevor ihr Werte ändert.');
  if(Math.abs(r.residual.x)>limit)notes.push('Seitlich bleibt eine Kraft übrig: Prüft beide Winkel zur Senkrechten. Richtet jeden Kraftmesser genau in Richtung seines Fadens aus. Der Knoten soll ruhig und frei hängen.');
  if(Math.abs(r.residual.y)>limit)notes.push('Die senkrechten Anteile passen nicht zur Gewichtskraft: Prüft die Nullstellung in der tatsächlichen Messlage und die gesamte Testmasse einschließlich Halter.');
  if(r.alpha>70||r.beta>70)notes.push('Die Fäden verlaufen sehr flach. Dann beeinflussen schon kleine Winkelfehler das Ergebnis stark. Messt direkt am Knoten und vermeidet einen schrägen Blick auf den Winkelmesser.');
  if(r.left===0||r.right===0)notes.push('Ein Kraftmesser zeigt 0 N. Prüft, ob der Faden straff ist und ob ihr den Wert richtig abgelesen habt.');
  return notes;
 }
 root.M29={number,calculate,vector,feedback};if(typeof module!=='undefined')module.exports=root.M29;
})(typeof globalThis!=='undefined'?globalThis:this);
