'use strict';
const PendulumModel = (() => {
  class Pendulum {
    constructor(length=1) { this.length=length; this.reset(); }
    reset(angle=0) { this.angle=Math.max(-Math.PI/2,Math.min(Math.PI/2,angle)); this.omega=0; this.time=0; }
    setLength(length) { this.length=Math.max(.1,Math.min(2,length)); this.reset(); }
    sample() { return {t:this.time,x:this.length*Math.sin(this.angle),vx:this.length*Math.cos(this.angle)*this.omega}; }
    energy() { return .5*(this.length*this.omega)**2+2*9.81*this.length*Math.sin(this.angle/2)**2; }
    amplitudes() {
      // At the turning point E = g L (1-cos(thetaMax)); at equilibrium vx is maximal.
      const energy=this.energy(), q=Math.max(0,Math.min(1,energy/(9.81*this.length)));
      return {x:this.length*Math.sqrt(q*(2-q)),vx:Math.sqrt(2*energy)};
    }
    step(dt) {
      // Full nonlinear equation, no small-angle approximation or damping.
      const rate=(a,w)=>[w,-9.81/this.length*Math.sin(a)];
      const a=this.angle,w=this.omega,k1=rate(a,w);
      const k2=rate(a+dt*k1[0]/2,w+dt*k1[1]/2);
      const k3=rate(a+dt*k2[0]/2,w+dt*k2[1]/2);
      const k4=rate(a+dt*k3[0],w+dt*k3[1]);
      this.angle+=dt*(k1[0]+2*k2[0]+2*k3[0]+k4[0])/6;
      this.omega+=dt*(k1[1]+2*k2[1]+2*k3[1]+k4[1])/6;
      this.time+=dt;
    }
  }
  function isReady(objects) {
    const ports=new Map(objects.flatMap(o=>o.ports.map(p=>[p.id,p])));
    const linked=(a,b)=>{
      const p=ports.get(a),q=ports.get(b);
      return !!p?.connection && (p.connection.a===q || p.connection.b===q);
    };
    const support=linked('box-dock','rod-base');
    const holder=(linked('rod-dock','block-dock') && linked('block-arm-dock','arm-left')) ||
      (linked('rod-dock','block-arm-dock') && linked('block-dock','arm-left'));
    return support && holder && linked('arm-right','rope-top') && linked('rope-bottom','ball-top');
  }
  return {Pendulum,isReady};
})();
