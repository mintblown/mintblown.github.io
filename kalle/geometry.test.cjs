const assert=require('node:assert/strict');
const G=require('./geometry.js');
const start={x:400,y:400};
const first=G.segment(start,{x:500,y:400},0);
const second=G.segment(first.end,{x:500,y:600},first.heading);
assert.deepEqual(G.commands([first,second]),['R000DEGR','G100MMF','R090DEGR','G200MMF']);
assert.equal(G.segment(start,{x:400,y:300},0).turn,-90);
assert.equal(G.segment(start,{x:500,y:400},350).turn,10);
assert.equal(G.segment(start,start,0),null);
for(let i=0;i<2000;i++){
 const from={x:G.margin+Math.random()*(G.width-2*G.margin),y:G.margin+Math.random()*(G.height-2*G.margin)};
 const heading=Math.random()*720-360;
 const s=G.segment(from,{x:Math.random()*2400-400,y:Math.random()*1800-400},heading);
 if(!s)continue;
 assert(G.inside(s.end));assert(Number.isInteger(s.turn));assert(Number.isInteger(s.length));
 assert(Math.abs(G.distance(from,s.end)-s.length)<1e-8);
 assert.equal(s.heading,heading+s.turn);
 for(let j=0;j<=10;j++)assert(G.inside({x:from.x+(s.end.x-from.x)*j/10,y:from.y+(s.end.y-from.y)*j/10}));
}
console.log('OK: Befehlsformat, Drehrichtung, Winkelübergang und 2000 begrenzte Fahrsegmente.');
