(async function(){
 const frame=document.getElementById('page'),report=document.getElementById('document'),out=document.getElementById('result'),keys=[8,9,10,11].flatMap(n=>['phef-m2-'+n+'-v1','phef-m2-'+n+'-protocol']),before=keys.map(k=>localStorage.getItem(k));let count=0;
 const assert=(v,m)=>{if(!v)throw new Error(m);count++;};
 const load=n=>new Promise(resolve=>{frame.onload=()=>resolve(frame.contentWindow);frame.src='../m2-'+n+'.html';});
 const set=(w,s,value,event='input')=>{const e=w.document.querySelector(s);e.value=value;e.dispatchEvent(new w.Event(event,{bubbles:true}));};
 const row=(w,values)=>Object.entries(values).forEach(([key,v])=>set(w,`[data-row="0"] [data-field="${key}"]`,v));
 const show=html=>new Promise(resolve=>{report.onload=()=>resolve(report.contentWindow);report.srcdoc=html;});
 try{
  keys.forEach(k=>localStorage.removeItem(k));
  for(const n of [8,9,10,11]){
   const w=await load(n),d=w.document;assert(d.querySelector('#create-protocol'),'Protocol button M2-'+n);assert(w.M2Protocol.prepare().issues,'Incomplete data rejected M2-'+n);d.querySelector('#create-protocol').click();assert(d.querySelector('#protocol-status').textContent.includes('Noch nicht fertig'),'Missing data explained');
   if(n===8){set(w,'#roller-weight','0,49');row(w,{load:'1,96',n:'5',pull:'0,49',height:'10',rope:'50'});assert(w.M2Protocol.prepare().issues,'Missing plotted point rejected');set(w,'#point-x','1,96');set(w,'#point-y','2,45');d.querySelector('#place-exact').click();}
   if(n===10){set(w,'#wagon-weight','0,98');row(w,{mass:'100',pull:'0,392',height:'20',length:'100'});set(w,'#point-x','0,2');set(w,'#point-y','0,2');d.querySelector('#place-exact').click();}
   if(n===9){for(const [id,v]of Object.entries({left:'1',right:'1',weight:'1,732',alpha:'30',beta:'30'}))set(w,'#'+id,v);d.querySelector('#head-tail').click();d.querySelector('#show-sum').click();}
   if(n===11){for(const [id,v]of Object.entries({pull:'1',normal:'1,7320508',weight:'2',height:'50',base:'86,60254'}))set(w,'#'+id,v);d.querySelector('#head-tail').click();d.querySelector('#show-sum').click();}
   set(w,'#protocol-name','Gruppe <Nord>');set(w,'#protocol-conclusion','Unsere Messung: <script>alert(1)</script>\nWeiter prüfen.');
   const result=w.M2Protocol.prepare();assert(result.html&&!result.issues,'Complete protocol generated M2-'+n);assert(result.html.includes('Gruppe &lt;Nord&gt;'),'Metadata escaped');assert(result.html.includes('&lt;script&gt;alert(1)'),'Conclusion escaped');assert(!result.html.includes('<script>alert(1)'),'No injected script');assert(result.snapshot.rows.length>0,'Results included');
   assert(result.snapshot.figures.length===(n===8||n===10?1:2),'Expected figures included');assert(result.snapshot.figures.every(f=>f.svg.includes('<svg')),'SVGs embedded');assert(!result.html.includes('class="hit"'),'Drag targets removed from document');
   if(n===8||n===10){assert(result.snapshot.rows.length===1,'Unused blank rows omitted');assert(result.snapshot.pointRows.length===1,'Plot coordinates recorded');}else assert(result.html.includes('Summe'),'Current resultant preserved');
   const doc=await show(result.html);assert(doc.document.querySelectorAll('svg').length===(n===8||n===10?1:2),'Document SVG render');assert(doc.document.querySelector('#print')&&doc.document.querySelector('#download'),'Save and print buttons');assert(doc.document.querySelector('.sheet').style.transform.startsWith('scale('),'Single-sheet fit applied');
   const paper=doc.document.querySelector('.paper').getBoundingClientRect(),sheet=doc.document.querySelector('.sheet').getBoundingClientRect();assert(sheet.height<=paper.height+1,'Fits one A4 sheet M2-'+n);assert(sheet.width<=paper.width+1,'Fits page width');assert(!doc.document.querySelector('script[src],link[rel=stylesheet],img[src]'),'Standalone document');
   if(n===9){set(w,'#left','4');assert(w.M2Protocol.prepare().html,'Implausible but valid measurement export allowed');}
  }
  out.textContent='PASS: '+count+' A4 protocol browser checks';
 }catch(error){out.textContent='FAIL: '+error.stack;}
 finally{keys.forEach((k,i)=>{if(before[i]===null)localStorage.removeItem(k);else localStorage.setItem(k,before[i]);});}
})();
