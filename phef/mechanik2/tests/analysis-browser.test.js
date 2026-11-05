(async function(){
 const frame=document.getElementById('page'),output=document.getElementById('result'),keys=[8,10,11].map(n=>'phef-m2-'+n+'-v1'),before=keys.map(key=>localStorage.getItem(key));let count=0;
 const assert=(v,m)=>{if(!v)throw new Error(m);count++;};
 const load=n=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Timeout loading '+n)),10000);frame.onload=()=>{clearTimeout(timer);resolve(frame.contentWindow);};frame.src='../m2-'+n+'.html';});
 const set=(w,selector,value,event='input')=>{const e=w.document.querySelector(selector);assert(e,'Input exists '+selector);e.value=value;e.dispatchEvent(new w.Event(event,{bubbles:true}));};
 const find=(w,s)=>w.document.querySelector(s),text=(w,s)=>find(w,s)?.textContent||'';
 const row=(w,index,values)=>{for(const [field,value]of Object.entries(values))set(w,`[data-row="${index}"] [data-field="${field}"]`,value);};
 const point=(w,x,y)=>{set(w,'#point-x',x);set(w,'#point-y',y);find(w,'#place-exact').click();};
 try{
  keys.forEach(key=>localStorage.removeItem(key));let w=await load(8);
  assert(w.document.querySelectorAll('tbody tr').length===3,'Three blank measurement rows');assert(!find(w,'.plot-point'),'No invented plotted data');
  set(w,'#roller-weight','0,49');set(w,'#zero','0,05');row(w,0,{load:'1,96',n:'5',pull:'0,54',height:'10',rope:'50'});
  assert(text(w,'[data-row="0"] [data-result="0"]')==='0,49','Zero correction');assert(text(w,'[data-row="0"] [data-result="1"]')==='2,45','Normalized force includes moving pulley');
  assert(text(w,'#roller-intercept').includes('50 g'),'Roller mass intercept explained');assert(text(w,'#target-coordinates').includes('1,96'),'Measured target coordinates');
  point(w,'1,96','2,45');find(w,'#check-points').click();assert(text(w,'#plot-feedback').includes('passt'),'Manual point checked');assert(w.document.querySelectorAll('.plot-point').length===1,'Manual point drawn');
  point(w,'1','1');find(w,'#check-points').click();assert(text(w,'#plot-feedback').includes('Skalierung'),'Misplotted point advice');assert(find(w,'[data-row="0"] [data-field="pull"]').value==='0,54','Plotting does not overwrite measurements');
  set(w,'#plot-mode','mass','change');point(w,'200','250');find(w,'#check-points').click();assert(text(w,'#plot-feedback').includes('passt'),'Mass coordinates use g correctly');
  set(w,'#show-line','');find(w,'#show-line').checked=true;find(w,'#show-line').dispatchEvent(new w.Event('input'));set(w,'#line-intercept','50');assert(text(w,'#line-equation').includes('50'),'Own intercept adjustable');assert(find(w,'#plot-svg [stroke="#bd8238"]'),'Own line drawn');
  w=await load(8);assert(find(w,'#plot-mode').value==='mass','Axis mode persisted');assert(w.document.querySelectorAll('.plot-point').length===1,'Manual point persisted');assert(find(w,'[data-row="0"] [data-field="pull"]').value==='0,54','Raw measurements persisted');
  set(w,'#plot-mode','forceway','change');assert(text(w,'#target-coordinates').includes('0,2'),'Reciprocal way and force ratio');row(w,0,{rope:'20'});assert(text(w,'#plausibility').includes('Wegmarkierungen'),'Rope length warning');
  find(w,'#add-row').click();assert(w.document.querySelectorAll('tbody tr').length===4,'Add measurement');find(w,'[data-delete="3"]').click();assert(w.document.querySelectorAll('tbody tr').length===3,'Delete measurement');
  w=await load(10);set(w,'#wagon-weight','0,98');row(w,0,{mass:'100',pull:'0,392',height:'20',length:'100'});
  assert(text(w,'[data-row="0"] [data-result="0"]')==='1,96','Wagon weight plus additional mass');assert(text(w,'[data-row="0"] [data-result="1"]')==='0,2','Force ratio');assert(text(w,'[data-row="0"] [data-result="2"]')==='0,2','Geometry ratio');point(w,'0,2','0,2');find(w,'#check-points').click();assert(text(w,'#plot-feedback').includes('passt'),'Ramp manual point');
  set(w,'#plot-mode','ratios','change');assert(text(w,'#target-coordinates').includes('x = 5')&&text(w,'#target-coordinates').includes('y = 5'),'Way factor and force factor');row(w,0,{length:'10'});assert(find(w,'[data-row="0"] [data-field="length"]').getAttribute('aria-invalid')==='true','Impossible ramp flagged');
  row(w,0,{length:'100',pull:'0'});assert(text(w,'#target-coordinates').includes('größer als 0'),'No division by zero in force factor');
  w=await load(11);assert(!find(w,'#vector-board'),'No invented vector forces');
  for(const [id,value]of Object.entries({pull:'1',normal:'1,7320508',weight:'2',height:'50',base:'86,60254','known-length':'100','measured-angle':'30'}))set(w,'#'+id,value);
  assert(find(w,'#setup svg'),'Incline setup drawn');assert(find(w,'#plausibility.good'),'Consistent geometry and forces');assert(text(w,'#plausibility').includes('Quadratsumme'),'Pythagoras comparison');
  find(w,'#head-tail').click();let line=find(w,'[data-vector="0"] .hit'),next=find(w,'[data-vector="1"] .hit');assert(Math.abs(+line.getAttribute('x2')-+next.getAttribute('x1'))<.001,'Component arrows head to tail');assert(+line.getAttribute('y2')>+line.getAttribute('y1'),'Weight component downward');
  find(w,'#show-sum').click();assert(find(w,'#vector-board [stroke="#2d8c66"]'),'Resultant visible');
  const beforeX=+next.getAttribute('x1'),dx=+next.getAttribute('x2')-beforeX,group=find(w,'[data-vector="1"]');group.focus();group.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));next=find(w,'[data-vector="1"] .hit');assert(+next.getAttribute('x1')===beforeX+5,'Keyboard translation');assert(Math.abs(+next.getAttribute('x2')-+next.getAttribute('x1')-dx)<1e-9,'Vector unchanged');
  set(w,'#mode','supports');line=find(w,'[data-vector="0"] .hit');assert(+line.getAttribute('y2')<+line.getAttribute('y1'),'Measured support force upward');
  set(w,'#known-length','90');assert(text(w,'#plausibility').includes('unabhängigen Schienenmessung'),'Geometry mismatch advice');set(w,'#normal','1');assert(find(w,'#plausibility.warning'),'Bad normal force flagged');assert(text(w,'#plausibility').includes('Alle vier Räder'),'Lift-off advice');
  set(w,'#base','0');assert(find(w,'#base').getAttribute('aria-invalid')==='true','Invalid base rejected');assert(!find(w,'#vector-board'),'Invalid data removes vectors');
  w=await load(11);assert(find(w,'#normal').value==='1','M11 input persistence');
  output.textContent='PASS: '+count+' browser checks for M2-8, M2-10 and M2-11';
 }catch(error){output.textContent='FAIL: '+error.stack;}
 finally{keys.forEach((key,i)=>{if(before[i]===null)localStorage.removeItem(key);else localStorage.setItem(key,before[i]);});}
})();
