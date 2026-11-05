(function(root){
 'use strict';
 function number(v){if(typeof v==='number')return Number.isFinite(v)?v:null;if(typeof v==='string')v=v.replace(/^\s*−/,'-');if(typeof v!=='string'||!/^[-+]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(v.trim()))return null;const n=Number(v.trim().replace(',','.'));return Number.isFinite(n)?n:null;}
 const positive=n=>Number.isFinite(n)&&n>0;
 function pulley(load,roller,pull,n,height,rope,zero=0){
  if(![load,roller,pull,n,height,rope,zero].every(Number.isFinite)||load<=0||roller<0||pull<0||n<1||n>12||!Number.isInteger(n)||height<=0||rope<=0)return null;
  const force=pull-zero;if(force<0)return null;
  return {load,roller,force,n,height,rope,ideal:(load+roller)/n,normalized:n*force,massLoad:load/9.8*1000,massEquivalent:n*force/9.8*1000,massRoller:roller/9.8*1000,ratio:rope/height,expectedRope:n*height,forceError:(n*force-load-roller)/(load+roller),wayError:(rope/height-n)/n,inputWork:force*rope/100,usefulWork:load*height/100,totalLift:(load+roller)*height/100};
 }
 function ramp(wagon,mass,pull,height,length,zero=0){
  if(![wagon,mass,pull,height,length,zero].every(Number.isFinite)||wagon<=0||mass<0||pull<0||height<=0||length<=height)return null;
  const force=pull-zero,weight=wagon+mass/1000*9.8;if(force<0)return null;
  return {force,weight,height,length,ideal:weight*height/length,x:height/length,y:force/weight,forceError:(force-weight*height/length)/weight,inputWork:force*length/100,liftWork:weight*height/100,wayRatio:length/height,forceRatio:force>0?weight/force:null};
 }
 function incline(pull,normal,weight,height,base,knownLength=null,measuredAngle=null,tolerance=5){
  if(![pull,normal,weight,height,base,tolerance].every(Number.isFinite)||pull<0||normal<0||weight<=0||height<=0||base<=0||tolerance<1||tolerance>20)return null;
  if(knownLength!==null&&!positive(knownLength)||measuredAngle!==null&&(!Number.isFinite(measuredAngle)||measuredAngle<=0||measuredAngle>=90))return null;
  const length=Math.hypot(height,base),theta=Math.atan2(height,base),c=Math.cos(theta),s=Math.sin(theta);
  const parallel={x:-pull*c,y:-pull*s},perpendicular={x:normal*s,y:-normal*c},sum={x:parallel.x+perpendicular.x,y:parallel.y+perpendicular.y};
  const residual={x:sum.x,y:sum.y+weight},error=Math.hypot(residual.x,residual.y),relative=error/weight*100;
  return {pull,normal,weight,height,base,length,theta,angle:theta*180/Math.PI,parallel,perpendicular,sum,residual,error,relative,balanced:relative<=tolerance,idealPull:weight*s,idealNormal:weight*c,pythagoras:pull*pull+normal*normal,weightSquared:weight*weight,lengthError:knownLength===null?null:(length-knownLength)/knownLength*100,angleError:measuredAngle===null?null:measuredAngle-theta*180/Math.PI};
 }
 const api={number,pulley,ramp,incline};root.MechanicsAnalysis=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
