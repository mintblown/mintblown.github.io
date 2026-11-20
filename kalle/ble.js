'use strict';
class KalleBle {
  static SERVICE='6b616c6c-6500-4000-8000-000000000001';
  static RX='6b616c6c-6500-4000-8000-000000000002';
  static TX='6b616c6c-6500-4000-8000-000000000003';
  constructor(onMessage=()=>{},onDisconnect=()=>{}) {
    this.onMessage=onMessage;this.onDisconnect=onDisconnect;
    this.streamIndex=0;this.pending=new Map();this.nextId=0;this.writeTail=Promise.resolve();this.devices=new Map();
    this.notification=e=>this.receive(e.target.value);
    this.disconnected=()=>this.cleanup(new Error('BLE-Verbindung getrennt. Position bitte durch Scan neu beziehen.'));
  }
  get connected(){return Boolean(this.rx&&this.device?.gatt.connected);}
  async knownDevices(){
    if(!navigator.bluetooth?.getDevices)return [];
    const devices=await navigator.bluetooth.getDevices();devices.forEach(d=>this.devices.set(d.id,d));return devices;
  }
  async connect(id){
    if(!navigator.bluetooth)throw Error('Web Bluetooth fehlt. Bitte Chrome oder Edge verwenden.');
    if(!globalThis.isSecureContext)throw Error('BLE benötigt HTTPS oder localhost.');
    const device=this.devices.get(id)||await navigator.bluetooth.requestDevice({filters:[{services:[KalleBle.SERVICE]}]});
    this.device=device;this.devices.set(device.id,device);
    device.addEventListener('gattserverdisconnected',this.disconnected);
    try {
      const server=await device.gatt.connect(),service=await server.getPrimaryService(KalleBle.SERVICE);
      this.rx=await service.getCharacteristic(KalleBle.RX);this.tx=await service.getCharacteristic(KalleBle.TX);
      this.tx.addEventListener('characteristicvaluechanged',this.notification);
      await this.tx.startNotifications();this.nextId=0;this.writeTail=Promise.resolve();
      return device;
    } catch(error){this.disconnect();throw error;}
  }
  disconnect(){
    const device=this.device;
    this.cleanup(new Error('Verbindung getrennt.'));
    if(device?.gatt.connected)device.gatt.disconnect();
  }
  cleanup(error){
    const hadConnection=Boolean(this.rx||this.device);
    this.tx?.removeEventListener('characteristicvaluechanged',this.notification);
    this.device?.removeEventListener('gattserverdisconnected',this.disconnected);
    for(const item of this.pending.values()){clearTimeout(item.timer);item.reject(error);}
    this.pending.clear();this.rx=this.tx=this.device=null;
    if(hadConnection)this.onDisconnect(error);
  }
  command(body,{timeout=120000,onAllocated=()=>{}}={}){
    if(!this.connected)return Promise.reject(Error('Kein Roboter verbunden.'));
    if(this.nextId>9999)return Promise.reject(Error('Alle Auftrags-IDs verbraucht. Bitte neu verbinden.'));
    const id=this.nextId++,packet=`C${String(id).padStart(4,'0')} ${body}\n`;
    if(new TextEncoder().encode(packet).length>20)return Promise.reject(Error('BLE-Befehl ist zu lang.'));
    let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});
    const item={resolve,reject,timer:setTimeout(()=>{
      this.pending.delete(id);reject(Error(`Zeitüberschreitung bei ${body}. Bewegung nicht erneut senden; STOP oder Scan verwenden.`));
    },timeout)};
    this.pending.set(id,item);onAllocated(id);
    const rx=this.rx;
    this.writeTail=this.writeTail.catch(()=>{}).then(async()=>{
      if(!this.pending.has(id)||!this.connected||this.rx!==rx)throw Error('Verbindung nicht mehr gültig.');
      await rx.writeValueWithResponse(new TextEncoder().encode(packet));
    }).catch(error=>{
      if(this.pending.get(id)===item){this.pending.delete(id);clearTimeout(item.timer);reject(error);}
    });
    return promise;
  }
  receive(view){
    const packet=new TextDecoder().decode(view);
    if(!packet.endsWith('\n')||packet.length>20)return;
    const line=packet.slice(0,-1);let match;
    if((match=/^([ADE])(\d{4})(?:,([A-Z]+))?$/.exec(line))){
      const [,type,idText,error]=match,id=Number(idText),item=this.pending.get(id);
      if(type==='E'&&!error)return;
      if(item&&type!=='A'){
        clearTimeout(item.timer);this.pending.delete(id);
        if(type==='D')item.resolve({id});else item.reject(Error(`${idText}: ${error}`));
      }
      this.onMessage({type,id,error});
    } else if((match=/^P(\d{5}),(\d{4}),([012])$/.exec(line))){
      const [,angle,distance,quality]=match;
      if(Number(angle)<36000)this.onMessage({type:'P',index:this.streamIndex++,angle:Number(angle)/100,distance:Number(distance),quality:Number(quality)});
    } else if((match=/^S(\d{4}),(BEGIN|END)(?:,(\d{1,9}))?$/.exec(line))){
      if(match[2]==='BEGIN')this.streamIndex=0;
      this.onMessage({type:'S',id:Number(match[1]),phase:match[2],count:match[3]?Number(match[3]):null});
    } else if((match=/^T(\d{4}),(IDLE|MOVING|SCANNING|STOPPING)$/.exec(line))){
      this.onMessage({type:'T',id:Number(match[1]),state:match[2]});
    }
  }
}
if(typeof module!=='undefined')module.exports=KalleBle;
