'use strict';
class PendulumView {
  constructor() {
    this.$=id=>document.getElementById(id);
    this.model=new PendulumModel.Pendulum();
    this.available=false;this.running=false;this.drag=null;this.frameId=null;this.last=null;this.accumulator=0;this.tick=0;this.hover=null;
    this.history=[this.model.sample()];this.setAxisRanges();
    this.svg=this.$('pendulum-scene');this.bob=this.$('pendulum-bob');
    this.$('pendulum-length').addEventListener('input',()=>{
      this.cancelDrag();this.pause();this.model.setLength(Number(this.$('pendulum-length').value));this.clearHistory();
      this.say('Fadenlänge geändert. Ziehe die Kugel aus der Ruhelage.');this.render();
    });
    this.$('pendulum-pause').addEventListener('click',()=>{
      if(this.running) {this.pause();this.say('Pausiert. Die Diagramme bleiben stehen.');}
      else this.play();this.render();
    });
    this.$('pendulum-stop').addEventListener('click',()=>this.stop());
    this.bob.addEventListener('pointerdown',event=>{
      if(this.drag!==null || (event.pointerType==='mouse' && event.button!==0)) return;
      event.preventDefault();this.pause();this.drag=event.pointerId;this.bob.setPointerCapture(event.pointerId);this.bob.focus();this.deflect(event);
    });
    this.bob.addEventListener('pointermove',event=>{if(this.drag===event.pointerId)this.deflect(event);});
    this.bob.addEventListener('pointerup',event=>{
      if(this.drag!==event.pointerId)return;
      this.deflect(event);this.cancelDrag();this.play();
    });
    for(const type of ['pointercancel','lostpointercapture']) this.bob.addEventListener(type,event=>{
      if(this.drag!==event.pointerId)return;
      this.cancelDrag();this.say('Auslenkung pausiert. Mit „Fortsetzen“ starten.');this.render();
    });
    this.bob.addEventListener('keydown',event=>{
      if(['ArrowLeft','ArrowRight'].includes(event.key)) {
        event.preventDefault();this.pause();this.model.reset(this.model.angle+(event.key==='ArrowLeft'?-1:1)*Math.PI/36);this.clearHistory();this.render();
      } else if(event.key==='Enter' || event.key===' ') {event.preventDefault();this.play();}
    });
    for(const id of ['position-chart','velocity-chart']) {
      const chart=this.$(id);
      chart.addEventListener('pointermove',event=>{
        const p=this.point(chart,event);this.hover=Math.max(0,Math.min(1,(p.x-70)/800));this.renderCharts();
      });
      chart.addEventListener('pointerleave',()=>{this.hover=null;this.renderCharts();});
      chart.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
        event.preventDefault();this.hover=Math.max(0,Math.min(1,(this.hover??1)+(event.key==='ArrowLeft'?-.01:.01)));this.renderCharts();
      });
      chart.addEventListener('blur',()=>{this.hover=null;this.renderCharts();});
    }
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden) {this.cancelDrag();this.pause();this.say('Pausiert, weil die Seite im Hintergrund ist.');this.render();}
    });
    this.render();
  }
  say(text) {this.$('pendulum-status').textContent=text;}
  setAvailable(ready) {
    if(ready===this.available)return;
    this.available=ready;this.$('pendulum-panel').hidden=!ready;this.$('pendulum-locked').hidden=ready;
    if(!ready)this.stop();else this.say('Aufbau vollständig. Ziehe die Kugel zur Seite und lasse sie los.');
  }
  point(svg,event) {const p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}
  deflect(event) {
    const p=this.point(this.svg,event);
    this.model.reset(Math.atan2(p.x-450,p.y-55));this.clearHistory();
    this.say('Loslassen startet das Pendel aus der Ruhe.');this.render();
  }
  cancelDrag() {
    if(this.drag===null)return;
    const id=this.drag;this.drag=null;
    if(this.bob.hasPointerCapture(id))this.bob.releasePointerCapture(id);
  }
  setAxisRanges() {
    const amplitudes=this.model.amplitudes();
    // Keep a finite symmetric scale for a pendulum started at rest.
    this.axisRanges={x:amplitudes.x || .01,vx:amplitudes.vx || .01};
  }
  clearHistory() {this.setAxisRanges();this.history=[this.model.sample()];this.accumulator=0;this.tick=0;this.hover=null;}
  pause() {this.running=false;cancelAnimationFrame(this.frameId);this.frameId=null;this.last=null;}
  play() {
    if(!this.available || this.running || this.drag!==null)return;
    if(this.model.time===0)this.setAxisRanges();
    this.running=true;this.last=null;this.say('Das Pendel schwingt reibungsfrei.');
    this.frameId=requestAnimationFrame(now=>this.frame(now));this.render();
  }
  stop() {this.cancelDrag();this.pause();this.model.reset();this.clearHistory();this.say('Gestoppt. Das Pendel befindet sich in der Ruhelage.');this.render();}
  frame(now) {
    if(!this.running)return;
    if(this.last!==null) {
      const delta=(now-this.last)/1000;
      // Do not fast-forward through a stalled or suspended browser tab.
      if(delta>.25) {this.pause();this.say('Pausiert nach einer Unterbrechung. Mit „Fortsetzen“ geht es weiter.');this.render();return;}
      this.accumulator+=delta;
      while(this.accumulator>=1/240) {
        this.model.step(1/240);this.accumulator-=1/240;this.tick++;
        if(this.tick%2===0)this.history.push(this.model.sample());
      }
      while(this.history.length>1 && this.history[1].t<this.model.time-2)this.history.shift();
    }
    this.last=now;this.render();this.frameId=requestAnimationFrame(t=>this.frame(t));
  }
  render() {
    const {length,angle,time}=this.model;
    const x=450+180*length*Math.sin(angle),y=55+180*length*Math.cos(angle);
    this.$('pendulum-string').setAttribute('x2',x);this.$('pendulum-string').setAttribute('y2',y);
    this.bob.setAttribute('cx',x);this.bob.setAttribute('cy',y);
    this.bob.setAttribute('aria-valuenow',Math.round(angle*180/Math.PI));
    this.bob.setAttribute('aria-valuetext',`${Math.round(angle*180/Math.PI)} Grad`);
    this.$('pendulum-length-value').textContent=length.toLocaleString('de-DE',{minimumFractionDigits:2})+' m';
    this.$('pendulum-angle').textContent=Math.round(angle*180/Math.PI)+'°';
    this.$('pendulum-time').textContent=time.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})+' s';
    this.$('pendulum-pause').textContent=this.running?'Pause':'Fortsetzen';
    this.renderCharts();
  }
  renderCharts() {
    const end=Math.max(2,this.model.time),start=end-2;
    const samples=[...this.history,this.model.sample()].filter(p=>p.t>=start-1/120);
    const desired=this.hover===null?this.model.time:start+2*this.hover;
    const nearest=samples.reduce((a,b)=>Math.abs(b.t-desired)<Math.abs(a.t-desired)?b:a);
    for(const [id,key,range,unit] of [['position-chart','x',this.axisRanges.x,'m'],['velocity-chart','vx',this.axisRanges.vx,'m/s']]) {
      const x=t=>70+(t-start)*400,y=v=>95-v/range*65;
      this.$(id+'-curve').setAttribute('d',samples.map((p,i)=>`${i?'L':'M'}${x(p.t).toFixed(2)},${y(p[key]).toFixed(2)}`).join(' '));
      this.$(id+'-cursor').setAttribute('x1',x(nearest.t));this.$(id+'-cursor').setAttribute('x2',x(nearest.t));
      this.$(id+'-dot').setAttribute('cx',x(nearest.t));this.$(id+'-dot').setAttribute('cy',y(nearest[key]));
      for(let i=0;i<=4;i++)this.$(id+'-t'+i).textContent=(start+i*.5).toFixed(1);
      const label=range<.01 ? range.toExponential(1) : range.toFixed(2);
      this.$(id+'-max').textContent=label;this.$(id+'-min').textContent='−'+label;
      this.$(id+'-value').textContent=`t = ${nearest.t.toFixed(2)} s · ${key==='x'?'x':'vₓ'} = ${nearest[key].toFixed(3)} ${unit}`;
    }
  }
}
