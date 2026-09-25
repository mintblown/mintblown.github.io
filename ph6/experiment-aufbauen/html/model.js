/* DOM-independent assembly model. Coordinates and bounds are in SVG units. */
'use strict';
const ExperimentModel = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  class Port {
    constructor(owner, {id, type, x = 0, y = 0}) {
      Object.assign(this, {owner, id, type, x, y, connection: null});
    }
    position() { return {x: this.owner.x + this.x, y: this.owner.y + this.y}; }
    compatible(other) { return this.owner !== other.owner && this.type === other.type && !this.connection && !other.connection && !(this instanceof LinePort && other instanceof LinePort); }
  }
  class LinePort extends Port {
    constructor(owner, options) {
      super(owner, options);
      this.end = options.end;
      this.t = options.t ?? 0;
    }
    vector() { return {x:this.end.x-this.x, y:this.end.y-this.y}; }
    project(point) {
      const start = super.position(), v = this.vector();
      return clamp(((point.x-start.x)*v.x+(point.y-start.y)*v.y)/(v.x*v.x+v.y*v.y),0,1);
    }
    position(t = this.t) { const p = super.position(), v = this.vector(); return {x:p.x+t*v.x,y:p.y+t*v.y}; }
  }
  class ExperimentObject {
    constructor({id, x, y, bounds, grounded = false, ports = []}) {
      Object.assign(this, {id,x,y,bounds,grounded});
      this.initial = {x,y};
      this.ports = ports.map(options => options.end ? new LinePort(this,options) : new Port(this,options));
    }
    connections() { return this.ports.flatMap(p=>p.connection ? [p.connection] : []); }
    reset() { Object.assign(this,this.initial); for (const port of this.ports) { port.connection=null; if (port instanceof LinePort) port.t=0; } }
  }
  class Connection {
    constructor(a,b) { this.a=a; this.b=b; a.connection=this; b.connection=this; }
    other(object) { return this.a.owner===object ? this.b.owner : this.a.owner; }
    get rail() { return [this.a,this.b].find(p=>p instanceof LinePort); }
    disconnect() { this.a.connection=null; this.b.connection=null; }
  }
  class Assembly {
    constructor(objects, bounds = [20,20,880,520]) { this.objects=objects; this.bounds=bounds; }
    component(object, excluded=null) {
      const result = new Set([object]);
      for (const current of result) for (const connection of current.connections()) if (connection!==excluded) result.add(connection.other(current));
      return result;
    }
    connections() { return [...new Set(this.objects.flatMap(o=>o.connections()))]; }
    extent(group) { return [Math.min(...[...group].map(o=>o.x+o.bounds[0])),Math.min(...[...group].map(o=>o.y+o.bounds[1])),Math.max(...[...group].map(o=>o.x+o.bounds[2])),Math.max(...[...group].map(o=>o.y+o.bounds[3]))]; }
    fits(group,dx=0,dy=0) { const b=this.extent(group), limit=this.bounds; return b[0]+dx>=limit[0]-1e-8 && b[1]+dy>=limit[1]-1e-8 && b[2]+dx<=limit[2]+1e-8 && b[3]+dy<=limit[3]+1e-8; }
    translate(group,dx,dy) { for(const o of group) { o.x+=dx; o.y+=dy; } }
    move(object,dx,dy) {
      const whole=this.component(object);
      // Cutting a sliding connection identifies the movable carriage without an object-specific hierarchy.
      for(const connection of this.connections()) {
        const rail=connection.rail;
        if(!rail || !whole.has(rail.owner)) continue;
        const carriage=this.component(connection.other(rail.owner),connection);
        if(!carriage.has(object) || [...carriage].some(o=>o.grounded)) continue;
        const v=rail.vector();
        let delta=(dx*v.x+dy*v.y)/(v.x*v.x+v.y*v.y), low=-rail.t, high=1-rail.t;
        const b=this.extent(carriage), limit=this.bounds;
        for(const [axis,speed] of [[0,v.x],[1,v.y]]) if(speed!==0) {
          const a=(limit[axis]-b[axis])/speed, z=(limit[axis+2]-b[axis+2])/speed;
          low=Math.max(low,Math.min(a,z)); high=Math.min(high,Math.max(a,z));
        }
        delta=clamp(delta,low,high); rail.t+=delta; this.translate(carriage,delta*v.x,delta*v.y); return;
      }
      const b=this.extent(whole), limit=this.bounds;
      dx=clamp(dx,limit[0]-b[0],limit[2]-b[2]);
      dy=[...whole].some(o=>o.grounded) ? 0 : clamp(dy,limit[1]-b[1],limit[3]-b[3]);
      this.translate(whole,dx,dy);
    }
    connect(a,b, moving=a.owner, radius=30) {
      if(!a.compatible(b)) return null;
      const group=this.component(moving);
      // Closed constraint loops are excluded; arbitrary compatible branches are supported.
      if(group.has(a.owner)===group.has(b.owner)) return null;
      const rail=[a,b].find(p=>p instanceof LinePort);
      const t=rail ? rail.project((rail===a ? b : a).position()) : null;
      const pa=a instanceof LinePort ? a.position(t) : a.position();
      const pb=b instanceof LinePort ? b.position(t) : b.position();
      if(Math.hypot(pa.x-pb.x,pa.y-pb.y)>radius) return null;
      let dx=pb.x-pa.x,dy=pb.y-pa.y, shifted=group;
      if(!group.has(a.owner)) { dx=-dx; dy=-dy; }
      if([...shifted].some(o=>o.grounded) && Math.abs(dy)>1e-8) {
        shifted=this.component(group.has(a.owner) ? b.owner : a.owner); dx=-dx;dy=-dy;
      }
      if(([...shifted].some(o=>o.grounded) && Math.abs(dy)>1e-8) || !this.fits(shifted,dx,dy)) return null;
      this.translate(shifted,dx,dy); if(rail) rail.t=t;
      return new Connection(a,b);
    }
    snap(object) {
      const group=this.component(object), candidates=[];
      for(const item of group) for(const a of item.ports) for(const other of this.objects) if(!group.has(other)) for(const b of other.ports) {
        if(!a.compatible(b)) continue;
        const pa=a instanceof LinePort ? a.position(a.project(b.position())) : a.position();
        const pb=b instanceof LinePort ? b.position(b.project(a.position())) : b.position();
        candidates.push({a,b,d:Math.hypot(pa.x-pb.x,pa.y-pb.y)});
      }
      candidates.sort((a,b)=>a.d-b.d);
      for(const candidate of candidates) { const result=this.connect(candidate.a,candidate.b,object); if(result) return result; }
      return null;
    }
    reset() { for(const c of this.connections()) c.disconnect(); for(const o of this.objects) o.reset(); }
  }
  return {Port,LinePort,ExperimentObject,Connection,Assembly};
})();
