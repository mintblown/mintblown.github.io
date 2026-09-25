'use strict';
const DistanceExercise = (() => {
  // Illustrative accelerating start, not measured F1 telemetry. s in m, t in s.
  const distance = t => 90 * (t - 6 * (1 - Math.exp(-t / 6)));
  const measurements = (random = Math.random) => Array.from({length:11}, (_,t) => ({t,s:t===0 ? 0 : distance(t)+(random()-.5)*8}));
  function interval(previous, random = Math.random) {
    const choices=[];
    for(let start=0;start<10;start+=.5) for(let end=start+.5;end<=Math.min(10,start+3);end+=.5) {
      if(!previous || start!==previous.start || end!==previous.end) choices.push({start,end});
    }
    return choices[Math.floor(random()*choices.length)];
  }
  function parse(value) {
    const normalized=value.trim().replace(',','.');
    return /^\d+(?:\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
  }
  function check(task, start, end, delta, speed) {
    if(![start,end,delta,speed].every(Number.isFinite)) return {ok:false,field:null,message:'Trage in alle vier Felder eine Zahl ein: Strecken in m, Geschwindigkeit in m/s. Dezimalkommas sind erlaubt.'};
    if(Math.abs(start-distance(task.start))>6) return {ok:false,field:'start',message:'Lies s₁ noch einmal ab: Gehe bei t₁ bis zur violetten Kurve und dann waagerecht zur Wegachse.'};
    if(Math.abs(end-distance(task.end))>6) return {ok:false,field:'end',message:'Prüfe s₂: Gehe bei t₂ bis zur violetten Kurve und lies die Höhe an der Wegachse ab.'};
    if(Math.abs(delta-(end-start))>.51) return {ok:false,field:'delta',message:'Die abgelesenen Werte passen. Rechne jetzt Δs = s₂ − s₁. Runde die Differenz höchstens auf ganze Meter.'};
    if(Math.abs(speed-delta/(task.end-task.start))>.051) return {ok:false,field:'speed',message:'Berechne die mittlere Geschwindigkeit mit v̄ = Δs / Δt aus deiner Wegdifferenz. Runde auf eine Nachkommastelle und gib das Ergebnis in m/s an.'};
    return {ok:true,message:'Richtig!'};
  }
  return {distance,measurements,interval,parse,check};
})();
