const assert=require('node:assert/strict');
const KalleBle=require('./ble.js');
const G=require('./geometry.js');
const packet=text=>new TextEncoder().encode(text);
async function test(){
 let messages=[],disconnects=0,writes=[];
 const client=new KalleBle(m=>messages.push(m),()=>disconnects++);
 client.device={gatt:{connected:true},removeEventListener(){}};client.rx={writeValueWithResponse:async data=>{writes.push(new TextDecoder().decode(data));}};
 let settled=false;const first=client.command('G100MMF').then(()=>{settled=true;});
 await client.writeTail;assert.deepEqual(writes,['C0000 G100MMF\n']);
 client.receive(packet('A0000\n'));await Promise.resolve();assert.equal(settled,false);
 client.receive(packet('D0000\n'));await first;assert(settled);
 const error=client.command('SCAN');const rejected=assert.rejects(error,/SENSOR/);await client.writeTail;client.receive(packet('E0001,SENSOR\n'));await rejected;
 client.receive(packet('S0001,BEGIN\n'));client.receive(packet('P00199,0850,0\n'));assert.deepEqual(messages.at(-1),{type:'P',index:0,angle:1.99,distance:850,quality:0});
 client.receive(packet('P35900,0850,0\n'));assert.equal(messages.at(-1).index,1);
 for(let i=0;i<600;i++)client.receive(packet('P00100,0100,0\n'));assert.equal(messages.at(-1).index,601);
 const count=messages.length;for(const bad of ['P0512,00000,0100,0\n','P0001,36000,0100,0\n','P0001,00100,0100,3\n','D0002','D0002\nD0003\n'])client.receive(packet(bad));assert.equal(messages.length,count);
 // STOP may coexist with a pending motion, but writes are serialized.
 const motion=client.command('R090DEGR');const aborted=assert.rejects(motion,/ABORT/);const stop=client.command('STOP');await client.writeTail;
 assert(writes.at(-1).endsWith('STOP\n'));client.receive(packet('E0002,ABORT\n'));client.receive(packet('D0003\n'));await aborted;await stop;
 const lost=client.command('SCAN');const lostCheck=assert.rejects(lost,/lost/);client.cleanup(Error('lost'));await lostCheck;assert.equal(disconnects,1);
 client.device={gatt:{connected:true},removeEventListener(){}};client.rx={writeValueWithResponse:async()=>{}};
 await assert.rejects(client.command('STATUS',{timeout:5}),/Zeitüberschreitung/);
 client.nextId=10000;await assert.rejects(client.command('SCAN'),/Auftrags-IDs/);
 assert.equal(G.width,2000);assert.equal(G.height,2000);
 const p=G.scanPoint({x:500,y:500,heading:-90},{angle:0,distance:100});assert(Math.abs(p.x-500)<1e-8&&p.y===380);
 const right=G.scanPoint({x:500,y:500,heading:-90},{angle:90,distance:100});assert.equal(right.x,620);assert.equal(right.y,500);
 console.log('OK: BLE-Pakete, Abschlussmeldungen, Fehler, STOP, Verbindungsabbruch, Timeout, IDs und Scanprojektion.');
}
test().catch(error=>{console.error(error);process.exitCode=1;});
