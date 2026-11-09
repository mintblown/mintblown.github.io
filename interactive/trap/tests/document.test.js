/* node tests/document.test.js; same tests also run under JavaScriptCore with the scripts preloaded. */
(function () {
  'use strict';
  if(typeof TrapDocument==='undefined'&&typeof require!=='undefined'){
    global.window=globalThis;
    global.document={getElementById(){return null},querySelectorAll(){return []},querySelector(){return null}};
    global.localStorage={getItem(){return null},setItem(){}};global.addEventListener=()=>{};
    require('../model.js');require('../shared.js');require('../backup.js');require('../tables.js');require('../document.js');
  }
  let count=0;const assert=(v,msg)=>{if(!v)throw new Error(msg);count++;};
  const data={tables:{
    spring:[{angle:'90',force:'2,5'},{angle:'30',force:'1,2'},{angle:'',force:''}],
    lever:[{f1:'2',l1:'20',f2:'4',l2:'10'}],ramp:[{s:'1',h:'0,1',force:'1,4',weight:'10'}],
    trials:[{date:'2026-11-03',change:'<script>alert("x")</script>',length:'100',axle:'3',wheel:'6',unwind:'18',total:'23'}]},
    controls:{rechnen:{'calc-length':'100','calc-axle':'3','calc-wheel':'6'},reibung:{grip:'25'},uebersetzung:{'winding-mode':'drum'}},explored:{federkraft:true},profile:{name:'Ada',groupName:'Team <b>Hebel</b>',members:'Ada\nBen'}};
  const before=JSON.stringify(data),html=TrapDocument.render(data,new Date('2026-11-03T12:00:00Z'));
  assert(JSON.stringify(data)===before,'Document rendering never mutates state');
  const headings=[...html.matchAll(/<h2>(.*?)<\/h2>/g)].map(match=>match[1]);
  assert(headings[0]==='1 · Name und Gruppe'&&headings[1]==='2 · Unser Bearbeitungsstand','Identity first, progress second');
  assert(html.includes('Ada')&&html.includes('Ada\nBen'),'Identity and multiline members shown');
  assert(html.includes('Team &lt;b&gt;Hebel&lt;/b&gt;')&&!html.includes('Team <b>'),'Group names are escaped');
  assert((html.match(/<svg /g)||[]).length===4,'All four measurement diagrams embedded');
  assert(html.includes('20 m</strong>'),'Current construction prediction');
  assert(html.includes('2,5'),'Decimal-comma measurement preserved');
  assert(html.includes('Fest gekoppelte Wickelscheibe'),'Saved winding mode readable');
  assert(html.includes('Haftung (qualitative'),'Saved virtual controls labeled');
  assert(html.includes('Als bearbeitet markiert'),'Self-assessed progress included');
  assert(html.includes('&lt;script&gt;alert'),'User text escaped');
  assert(!html.includes('<script>alert'),'User text cannot execute');
  assert(html.includes('Geometrisch (Modell)')&&html.includes('Gesamt (Messung)'),'Model and measurements distinguished');
  assert(html.includes('window.print()'),'Print/PDF action');
  assert(html.includes("a.download='mausefallenauto-bau-doku.html'"),'Standalone HTML download');
  assert(html.includes('</script></body></html>'),'Document script correctly closed');
  assert(!html.includes('<script src=')&&!html.includes('<link rel="stylesheet"'),'Document needs no external assets');
  assert(!html.includes('NaN')&&!html.includes('undefined'),'No invalid numeric placeholders');
  assert(html.includes('Ausrollen (m)')&&html.includes('Δ gesamt (m)'),'Derived trial results');
  const empty=TrapDocument.render({tables:{},controls:{},explored:{}});
  assert(!empty.includes('<svg '),'Empty project has no invented diagrams');
  assert(empty.includes('Noch keine vollständigen gültigen Baumaße'),'Empty dimensions explicit');
  const partial={tables:{spring:[{angle:'30',force:'-1'},{angle:'40',force:''}]},controls:{},explored:{}};
  const invalid=TrapDocument.render(partial);
  assert(invalid.includes('Ungültige Werte: Kraft F (N)'),'Invalid measurements identified');
  assert(invalid.includes('Noch offen: Kraft F (N)'),'Missing measurements identified');
  assert(!invalid.includes('<svg '),'Invalid measurements not plotted');
  const many=JSON.parse(JSON.stringify(data));many.tables.lever=Array.from({length:9},()=>({f1:'2',l1:'20',f2:'4',l2:'10'}));
  const split=TrapDocument.render(many);
  assert((split.match(/<svg /g)||[]).length===5,'Long bar charts split into printable groups');
  assert(split.includes('Messung 9,'),'Original row numbering retained across chart groups');
  if(typeof console!=='undefined')console.log('PASS: '+count+' construction document checks');
  return count;
})();
