'use strict';
const Geometry = (() => {
  const width=2000,height=2000,robotSize=100,ballDiameter=40,margin=Math.SQRT2*robotSize/2;
  const rad=d=>d*Math.PI/180;
  const normalize=d=>((d+180)%360+360)%360-180;
  const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
  const inside=p=>p.x>=margin&&p.x<=width-margin&&p.y>=margin&&p.y<=height-margin;
  function segment(start,target,heading){
    const x=Math.max(margin,Math.min(width-margin,target.x)),y=Math.max(margin,Math.min(height-margin,target.y));
    if(distance(start,{x,y})<1)return null;
    const turn=Math.round(normalize(Math.atan2(y-start.y,x-start.x)*180/Math.PI-heading));
    const next=heading+turn;
    let length=Math.round(distance(start,{x,y}));
    let end;
    do{end={x:start.x+length*Math.cos(rad(next)),y:start.y+length*Math.sin(rad(next))};if(inside(end))break;length--;}while(length>0);
    return length>0?{end,heading:next,turn,length}:null;
  }
  function commands(segments){return segments.flatMap(s=>[
    `R${String(Math.abs(s.turn)).padStart(3,'0')}DEG${s.turn<0?'L':'R'}`,
    `G${String(s.length).padStart(3,'0')}MMF`
  ]);}
  function scanPoint(pose,sample){
    const angle=rad(pose.heading+sample.angle),range=20+sample.distance;
    return {x:pose.x+range*Math.cos(angle),y:pose.y+range*Math.sin(angle)};
  }
  return {scanPoint,width,height,robotSize,ballDiameter,margin,rad,normalize,distance,inside,segment,commands};
})();
if(typeof module!=='undefined')module.exports=Geometry;
