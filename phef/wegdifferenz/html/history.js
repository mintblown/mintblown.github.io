'use strict';
class ExerciseHistory {
  constructor(storage) {
    try {storage=storage??globalThis.localStorage;} catch {storage=null;}
    this.storage=storage;this.key='kkg.phef.wegdifferenz.history.v1';this.saved=true;
    this.state={records:[],errors:0,task:null,startedAt:null,finished:false};
    try {
      const s=JSON.parse(storage.getItem(this.key));
      const integer=n=>Number.isSafeInteger(n)&&n>=0&&n<=999999999;
      const task=t=>t && Number.isFinite(t.start)&&Number.isFinite(t.end)&&t.start>=0&&t.end<=10&&t.end>t.start&&t.end-t.start<=3;
      if(s && Array.isArray(s.records) && s.records.length<=99 && integer(s.errors) && typeof s.finished==='boolean' && (s.task===null || (task(s.task)&&Number.isFinite(s.startedAt))) && s.records.every(r=>integer(r.seconds)&&integer(r.errors)&&typeof r.completedAt==='string'&&Number.isFinite(Date.parse(r.completedAt))&&task(r.task)&&['start','end','delta','speed'].every(k=>Number.isFinite(r.values[k]))))this.state=s;
    } catch {this.saved=false;}
  }
  save() {try {this.storage.setItem(this.key,JSON.stringify(this.state));this.saved=true;}catch {this.saved=false;}}
  start(task) {this.state.task={...task};this.state.startedAt=Date.now();this.state.taskErrors=0;this.save();}
  wrong() {this.state.errors=Math.min(999999999,this.state.errors+1);this.state.taskErrors=(this.state.taskErrors||0)+1;this.save();}
  solve(values) {
    const s=this.state;
    const record={task:{...s.task},values:{...values},completedAt:new Date().toISOString(),seconds:Math.min(999999999,Math.max(0,Math.round((Date.now()-s.startedAt)/1000))),errors:s.taskErrors||0};
    s.records.push(record);s.task=null;s.startedAt=null;this.save();return record;
  }
  finish() {this.state.finished=true;this.save();}
  reset() {try {this.storage?.removeItem(this.key);}catch {}}
  body() {
    const s=this.state;
    // Numeric-only version, count, total errors, seconds per solved task (chronological).
    return '1'+String(s.records.length).padStart(2,'0')+String(s.errors).padStart(9,'0')+s.records.map(r=>String(r.seconds).padStart(9,'0')).join('');
  }
  async payload() {
    if(!globalThis.crypto?.subtle)throw Error('Für den Prüfwert bitte diese Seite über HTTPS oder localhost öffnen.');
    const encoder=new TextEncoder();
    const key=await crypto.subtle.importKey('raw',encoder.encode('kkg'),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const body=this.body();
    const signature=new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(body)));
    const hex=Array.from(signature,n=>n.toString(16).padStart(2,'0')).join('');
    return body+BigInt('0x'+hex).toString().padStart(78,'0');
  }
}
