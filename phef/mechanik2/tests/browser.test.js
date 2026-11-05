(async function(){
 const frame=document.getElementById('page'),output=document.getElementById('result'),key='phef-m2-9-v1',original=localStorage.getItem(key);let count=0;
 const assert=(v,m)=>{if(!v)throw new Error(m);count++;};
 const load=()=>new Promise(resolve=>{frame.onload=()=>resolve(frame.contentWindow);frame.src='../m2-9.html';});
 const input=(w,id,value)=>{const e=w.document.getElementById(id);e.value=value;e.dispatchEvent(new w.Event('input',{bubbles:true}));};
 const dimensions=(w,id)=>{const line=w.document.querySelector(`[data-vector="${id}"] .hit`);return {x1:+line.getAttribute('x1'),y1:+line.getAttribute('y1'),x2:+line.getAttribute('x2'),y2:+line.getAttribute('y2')};};
 try{
  localStorage.removeItem(key);let w=await load(),d=w.document;
  assert(!d.querySelector('#vector-board'),'No invented measurements');assert(d.getElementById('head-tail').disabled,'No vectors without measurements');
  for(const [id,value]of Object.entries({left:'1',right:'1',weight:'1,732',alpha:'30',beta:'30'}))input(w,id,value);
  assert(d.querySelector('#setup svg'),'Setup generated');assert(d.querySelector('#plausibility.good'),'Plausible equilibrium');assert(d.querySelector('#vector-board'),'Interactive vectors');
  assert(d.getElementById('mode-explanation').textContent.includes('Kraftmesser'),'Meter force view explained');
  d.getElementById('head-tail').click();let l=dimensions(w,'left'),r=dimensions(w,'right');
  assert(Math.abs(l.x2-r.x1)<.001&&Math.abs(l.y2-r.y1)<.001,'Head-to-tail placement');
  d.getElementById('show-sum').click();assert(d.querySelector('#vector-board [stroke="#2c8a64"]'),'Resultant drawn');
  let group=d.querySelector('[data-vector="right"]');group.focus();const before=dimensions(w,'right');group.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));const after=dimensions(w,'right');
  assert(after.x1-before.x1===5,'Keyboard translation');assert(Math.abs((after.x2-after.x1)-(before.x2-before.x1))<1e-9,'Horizontal vector component unchanged');assert(Math.abs((after.y2-after.y1)-(before.y2-before.y1))<1e-9,'Vertical vector component unchanged');
  const board=d.querySelector('#vector-board');board.setPointerCapture=()=>{};board.hasPointerCapture=()=>false;
  l=dimensions(w,'left');const matrix=board.getScreenCTM(),point=board.createSVGPoint();point.x=l.x1;point.y=l.y1;const client=point.matrixTransform(matrix);
  d.querySelector('[data-vector="left"] .hit').dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,clientX:client.x,clientY:client.y,pointerId:1}));
  board.dispatchEvent(new w.PointerEvent('pointermove',{clientX:client.x+15,clientY:client.y+10,pointerId:1}));board.dispatchEvent(new w.PointerEvent('pointerup',{pointerId:1}));
  const dragged=dimensions(w,'left');assert(dragged.x1!==l.x1,'Pointer dragging');assert(Math.abs((dragged.x2-dragged.x1)-(l.x2-l.x1))<1e-9,'Dragging preserves vector');
  input(w,'mode','knot');l=dimensions(w,'left');assert(l.y2<l.y1,'Knot force points upwards');
  input(w,'alpha','89');assert(d.querySelector('#plausibility.warning'),'Inconsistent measurement flagged');assert(d.getElementById('plausibility').textContent.includes('Winkelfehler'),'Flat-angle advice');
  input(w,'alpha','90');assert(d.getElementById('alpha').getAttribute('aria-invalid')==='true','90 degrees rejected');assert(!d.querySelector('#vector-board'),'Invalid diagram removed');
  input(w,'alpha','30');input(w,'mass','200');assert(d.getElementById('mass-result').textContent.includes('1,96'),'Mass with correct g');d.getElementById('use-mass').click();assert(d.getElementById('weight').value==='1.96','Mass conversion applied');
  w=await load();d=w.document;assert(d.getElementById('weight').value==='1.96','Measurements persist');assert(d.querySelector('#vector-board'),'Diagram reconstructed after reload');
  w.confirm=()=>false;d.getElementById('clear').click();assert(d.getElementById('left').value==='1','Cancel reset preserves data');
  w.confirm=()=>true;d.getElementById('clear').click();assert(d.getElementById('left').value==='','Confirmed reset clears inputs');assert(!d.querySelector('#vector-board'),'Reset clears diagram');
  output.textContent='PASS: '+count+' browser checks for M2-9';
 }catch(error){output.textContent='FAIL: '+error.stack;}
 finally{if(original===null)localStorage.removeItem(key);else localStorage.setItem(key,original);}
})();
