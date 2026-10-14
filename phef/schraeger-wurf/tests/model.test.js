function assert(condition, message) { if (!condition) throw new Error(message); }
function near(actual, expected, message) { assert(Math.abs(actual - expected) < 1e-9, message); }
near(Wurf.parse(' 5,25 '), 5.25, 'Dezimalkomma');
assert(Wurf.parse('') === null, 'Leeres Feld');
assert(Number.isNaN(Wurf.parse('10 m/s')), 'Ungültige Zahl');
assert(Number.isNaN(Wurf.parse('Infinity')), 'Unendliche Eingabe');
assert(Wurf.validate({angle: -1, vx: 10, vy: 10}), 'Negativer Winkel');
assert(Wurf.validate({angle: 91, vx: 10, vy: 10}), 'Winkel über 90 Grad');
assert(Wurf.validate({angle: 45, vx: -1, vy: 10}), 'Negative Komponente');
near(Wurf.solve({angle:null,vx:10,vy:10}).value,45,'Winkel berechnen');
near(Wurf.solve({angle:30,vx:10,vy:null}).value,10/Math.sqrt(3),'vy berechnen');
near(Wurf.solve({angle:60,vx:null,vy:10}).value,10/Math.sqrt(3),'vx berechnen');
assert(Wurf.solve({angle:45,vx:10,vy:10}).error,'Drei Felder');
assert(Wurf.solve({angle:null,vx:null,vy:10}).error,'Ein Feld');
assert(Wurf.solve({angle:null,vx:0,vy:0}).error,'Winkel ohne Richtung');
near(Wurf.solve({angle:null,vx:0,vy:10}).value,90,'Senkrechte Richtung');
near(Wurf.solve({angle:null,vx:10,vy:0}).value,0,'Waagerechte Richtung');
near(Wurf.solve({angle:0,vx:10,vy:null}).value,0,'Waagerechter Wurf');
near(Wurf.solve({angle:90,vx:null,vy:10}).value,0,'Senkrechter Wurf');
assert(Wurf.solve({angle:0,vx:null,vy:0}).error,'vx nicht eindeutig');
assert(Wurf.solve({angle:0,vx:null,vy:10}).error,'Unmöglicher waagerechter Wurf');
assert(Wurf.solve({angle:90,vx:0,vy:null}).error,'vy nicht eindeutig');
assert(Wurf.solve({angle:90,vx:10,vy:null}).error,'Unmöglicher senkrechter Wurf');
assert(Wurf.check({angle:45,vx:10,vy:10}).kind === 'success','Konsistente Angaben');
assert(Wurf.check({angle:30,vx:10,vy:10}).kind === 'warning','Inkonsistente Angaben');
assert(Wurf.check({angle:45,vx:0,vy:0}).kind === 'neutral','Nullvektor');
for (let angle=1; angle<45; angle++) {
  const vy = Wurf.solve({angle,vx:5,vy:null}).value;
  near(Wurf.solve({angle:null,vx:5,vy}).value,angle,'Winkel-Rückrechnung');
  near(Wurf.solve({angle,vx:null,vy}).value,5,'vx-Rückrechnung');
}

assert(Wurf.validate({angle:45,vx:10.1,vy:1}), 'Achsenmaximum');
assert(Wurf.solve({angle:80,vx:10,vy:null}).error, 'Berechnung über Maximum');
const flight = Wurf.flight(10,10);
near(flight.position(0).y,1.5,'Abwurfhöhe');
near(flight.position(flight.duration).y,0,'Boden erreicht');
near(flight.position(flight.duration).x,flight.range,'Wurfweite');
near(Wurf.flight(0,10).range,0,'Senkrechter Wurf');
near(Wurf.flight(10,0).duration,Math.sqrt(3/9.81),'Waagerechter Wurf');
assert(flight.range < 24 && 1.5+100/(2*9.81)<10,'Feste Animationsachsen ausreichend');
