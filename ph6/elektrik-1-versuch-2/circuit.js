const plateRails=[
  {id:'plus',path:[[8,34],[8,9],[16,9]],sockets:[['source-plus','Batterieanschluss +',16,9],['upper-left','Linke Seitenbuchse oben',8,34]]},
  {id:'minus',path:[[25,9],[35,9]],sockets:[['source-minus','Batterieanschluss −',25,9],['top-left','Obere Buchse innen links',35,9]]},
  {id:'top-bridge',path:[[65,9],[76,9]],sockets:[['top-inner','Obere Buchse innen rechts',65,9],['top-middle','Obere Buchse rechts mittig',76,9]]},
  {id:'top-right',path:[[83,9],[92,9],[92,34]],sockets:[['top-outer','Obere Buchse außen rechts',83,9],['upper-right','Rechte Seitenbuchse oben',92,34]]},
  {id:'left',path:[[8,66],[8,76],[35,76]],branch:[[35,60],[35,92]],sockets:[
    ['lower-left','Linke Seitenbuchse unten',8,66],['lamp-left-upper','Lampenleiste links oben',35,60],
    ['lamp-left','Lampenanschluss links',35,76],['lamp-left-lower','Lampenleiste links unten',35,92],
  ]},
  {id:'right',path:[[65,76],[92,76],[92,66]],branch:[[65,60],[65,92]],sockets:[
    ['lower-right','Rechte Seitenbuchse unten',92,66],['lamp-right-upper','Lampenleiste rechts oben',65,60],
    ['lamp-right','Lampenanschluss rechts',65,76],['lamp-right-lower','Lampenleiste rechts unten',65,92],
  ]},
];

const main = document.querySelector("main");

function circuitPage(){
  const components=[
    {kind:'battery',name:'Batteriehalter (3 × AA)',mount:'Batteriehalter oben links',x:20.5,y:23},
    {kind:'lamp',name:'Glühlampe',mount:'Glühlampe unten mittig',x:50,y:59},
  ];
  const rails=plateRails;
  const sockets=rails.flatMap(({id,sockets})=>sockets.map(([key,name,x,y])=>({key,name,x,y,rail:id})));
  const socketByKey=Object.fromEntries(sockets.map(socket=>[socket.key,socket]));
  const leads=[{name:'Rotes Kabel',color:'#c53243',ends:[]},{name:'Blaues Kabel',color:'#1768b1',ends:[]}];

  main.insertAdjacentHTML('beforeend',`
    <section aria-labelledby="circuit-heading">
      <div class="section-head"><div><h2 id="circuit-heading">Virtueller Stromkreis</h2>
      <p>Setze den Batteriehalter oben links und die Glühlampe unten mittig ein. Wähle dann ein Kabel und stecke es in zwei Buchsen. Die Metallleisten verbinden die Buchsen auf der Platte.</p></div></div>
      <div class="workbench">
        <div class="panel">
          <h3>Bauteile</h3>
          <div class="parts-tray" id="circuit-parts"></div>
          <h3>Experimentierkabel</h3>
          <div class="parts-tray" id="circuit-leads"></div>
          <div id="circuit-connections"></div>
          <button type="button" class="action secondary" id="reset-circuit">Aufbau leeren</button>
        </div>
        <div class="panel">
          <h3>Grundplatte</h3>
          <div class="lab circuit-board" id="circuit-board">
            <canvas id="circuit-wires" aria-hidden="true"></canvas>
            <div class="circuit-sockets" role="group" aria-label="Steckbuchsen der Grundplatte"></div>
            <div class="circuit-mounts" role="group" aria-label="Einbauplätze"></div>
          </div>
          <p class="circuit-status" id="circuit-status" role="status"></p>
          <p class="muted" id="circuit-instruction" aria-live="polite"></p>
        </div>
      </div>
    </section>
    <section class="panel">
      <div class="section-head"><h2>Das dokumentierst du</h2></div>
      <ol>
        <li><strong>Aufbau.</strong> Zeichne den funktionierenden Stromkreis. Beschrifte Batterie, Plus- und Minuspol, Glühlampe und beide Leitungen.</li>
        <li><strong>Beobachtung.</strong> Halte fest, was die Glühlampe bei offenem und geschlossenem Stromkreis macht. Löse dazu ein Kabel und schließe es wieder an.</li>
        <li><strong>Erklärung.</strong> Beschreibe den Weg des Stroms durch beide Leitungen und den Glühdraht. Was passiert, wenn diese Verbindung unterbrochen wird?</li>
        <li><strong>Sicherheit.</strong> Erkläre, warum die beiden Batteriepole im echten Versuch nie direkt miteinander verbunden werden dürfen.</li>
      </ol>
      <small>Versuch nach dem Schülerheft <cite>Elektrik 1</cite>, 9. Auflage, S. 8–9.</small>
    </section>
  `);

  const board=document.querySelector('#circuit-board');
  const canvas=document.querySelector('#circuit-wires');
  const ctx=canvas.getContext('2d');
  const equipment=document.querySelector('#circuit-parts');
  const leadTray=document.querySelector('#circuit-leads');
  const connections=document.querySelector('#circuit-connections');
  const status=document.querySelector('#circuit-status');
  const instruction=document.querySelector('#circuit-instruction');
  const socketTray=board.querySelector('.circuit-sockets');
  const mounts=board.querySelector('.circuit-mounts');
  const placed=new Set();
  const terminals=sockets.map(({key,name,x,y})=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='terminal';
    button.dataset.terminal=key;
    button.style.left=x+'%';
    button.style.top=y+'%';
    button.setAttribute('aria-label',name);
    button.title=name;
    button.textContent=key==='source-plus'?'+':key==='source-minus'?'−':'';
    socketTray.append(button);
    return button;
  });
  let selectedPart=null;
  let selectedLead=null;
  let firstEnd=null;

  function chip(text){
    const button=document.createElement('button');
    button.type='button';
    button.className='chip';
    button.textContent=text;
    return button;
  }

  function place(kind){
    if(selectedPart!==kind){
      update('Wähle zuerst '+(kind==='battery'?'den Batteriehalter.':'die Glühlampe.'));
      return;
    }
    placed.add(kind);
    selectedPart=null;
    update();
    equipment.querySelector('[data-tool="'+(kind==='battery'?'lamp':'battery')+'"]:enabled')?.focus();
  }

  const mountControls=components.map(component=>{
    const {kind,name,mount,x,y}=component;
    const tool=chip(name);
    tool.dataset.tool=kind;
    tool.draggable=true;
    function selectPart(){
      selectedPart=kind;
      selectedLead=firstEnd=null;
      update('Wähle den Einbauplatz für '+(kind==='battery'?'den Batteriehalter.':'die Glühlampe.'));
    }
    tool.addEventListener('click',selectPart);
    tool.addEventListener('dragstart',event=>{
      event.dataTransfer.setData('text/plain',kind);
      event.dataTransfer.effectAllowed='move';
      selectPart();
    });
    equipment.append(tool);

    const target=chip(kind==='battery'?'Batteriehalter':'Glühlampe');
    target.classList.add('circuit-mount');
    target.dataset.mount=kind;
    target.setAttribute('aria-label',mount);
    target.style.left=x+'%';
    target.style.top=y+'%';
    target.addEventListener('click',()=>place(kind));
    target.addEventListener('dragover',event=>event.preventDefault());
    target.addEventListener('drop',event=>{
      event.preventDefault();
      if(event.dataTransfer.getData('text/plain')===kind)place(kind);
      else update('Dieses Bauteil gehört auf den anderen Einbauplatz.');
    });
    mounts.append(target);
    return {kind,tool,target};
  });

  const leadControls=leads.map((lead,index)=>{
    const tool=chip(lead.name);
    tool.classList.add('lead-chip');
    tool.style.setProperty('--lead-color',lead.color);
    tool.addEventListener('click',()=>{
      selectedPart=firstEnd=null;
      selectedLead=index;
      update();
    });
    leadTray.append(tool);

    const row=document.createElement('div');
    row.className='lead-connection';
    const detail=document.createElement('span');
    const remove=chip('Lösen');
    remove.setAttribute('aria-label',lead.name+' lösen');
    remove.addEventListener('click',()=>{
      lead.ends=[];
      if(selectedLead===index)selectedLead=firstEnd=null;
      update();
    });
    row.append(detail,remove);
    connections.append(row);
    return {tool,row,detail};
  });

  for(const button of terminals){
    button.addEventListener('click',()=>{
      if(selectedLead===null){
        update('Wähle zuerst ein Experimentierkabel.');
        return;
      }
      const id=button.dataset.terminal;
      if(firstEnd===null){
        firstEnd=id;
        update();
        return;
      }
      if(firstEnd===id){
        update('Wähle für das zweite Kabelende einen anderen Anschluss.');
        return;
      }
      leads[selectedLead].ends=[firstEnd,id];
      selectedLead=firstEnd=null;
      update();
    });
  }

  function drawWires(){
    const width=board.clientWidth;
    const height=board.clientHeight;
    const scale=window.devicePixelRatio||1;
    canvas.width=Math.round(width*scale);
    canvas.height=Math.round(height*scale);
    ctx.scale(scale,scale);
    function point(x,y){
      return {x:x*width/100,y:y*height/100};
    }
    function trace(path,color,weight){
      ctx.beginPath();
      path.forEach(([x,y],index)=>{
        const position=point(x,y);
        if(index===0)ctx.moveTo(position.x,position.y);
        else ctx.lineTo(position.x,position.y);
      });
      ctx.lineWidth=weight;
      ctx.lineJoin='round';
      ctx.strokeStyle=color;
      ctx.stroke();
    }
    for(const {path,branch} of rails){
      for(const segment of [path,branch].filter(Boolean)){
        trace(segment,'#576b75',8);
        trace(segment,'#c3cbd0',5);
      }
    }
    if(placed.has('battery')){
      trace([[16,9],[19,9]],'#293d4e',2.5);
      trace([[22,9],[25,9]],'#293d4e',2.5);
      trace([[19,4.5],[19,13.5]],'#293d4e',2.5);
      trace([[22,6],[22,12]],'#293d4e',3.5);
    }
    if(placed.has('lamp')){
      const center=point(50,76);
      const radius=12;
      const lit=board.classList.contains('lamp-lit');
      trace([[35,76],[65,76]],'#293d4e',3);
      ctx.beginPath();
      ctx.arc(center.x,center.y,radius,0,Math.PI*2);
      ctx.fillStyle=lit?'#ffd44d':'#edf4f7';
      if(lit){ctx.shadowColor='#f9c12b';ctx.shadowBlur=18;}
      ctx.fill();
      ctx.shadowBlur=0;
      ctx.lineWidth=2;
      ctx.strokeStyle='#293d4e';
      ctx.stroke();
      ctx.beginPath();
      for(const sign of [-1,1]){
        ctx.moveTo(center.x-7,center.y+7*sign);
        ctx.lineTo(center.x+7,center.y-7*sign);
      }
      ctx.stroke();
    }
    leads.forEach(({color,ends},index)=>{
      if(ends.length!==2)return;
      const [a,b]=ends.map(key=>{const {x,y}=socketByKey[key];return point(x,y);});
      const bend=Math.min(height-6,Math.max(a.y,b.y)+26+index*9);
      ctx.beginPath();
      ctx.moveTo(a.x,a.y);
      ctx.bezierCurveTo(a.x,bend,b.x,bend,b.x,b.y);
      ctx.lineWidth=4;
      ctx.lineCap='round';
      ctx.strokeStyle=color;
      ctx.stroke();
    });
  }

  function reachable(start){
    const connected=new Set([start]);
    const remaining=[start];
    for(const terminal of remaining){
      for(const {ends} of leads){
        const [a,b]=ends.map(key=>socketByKey[key].rail);
        if(a!==terminal && b!==terminal)continue;
        const other=a===terminal?b:a;
        if(connected.has(other))continue;
        connected.add(other);
        remaining.push(other);
      }
    }
    return connected;
  }

  function update(message){
    for(const {kind,tool,target} of mountControls){
      const mounted=placed.has(kind);
      tool.disabled=mounted;
      tool.setAttribute('aria-pressed',String(selectedPart===kind));
      target.disabled=mounted;
      target.dataset.mounted=String(mounted);
    }
    leadControls.forEach(({tool,row,detail},index)=>{
      const {ends,name}=leads[index];
      tool.disabled=placed.size!==components.length;
      tool.setAttribute('aria-pressed',String(selectedLead===index));
      row.hidden=ends.length===0;
      detail.textContent=ends.length?name+' verbindet '+socketByKey[ends[0]].name+' und '+socketByKey[ends[1]].name+'.':'';
    });
    terminals.forEach(button=>{
      button.disabled=placed.size!==components.length;
      button.setAttribute('aria-pressed',String(button.dataset.terminal===firstEnd));
    });

    const plus=reachable('plus');
    const minus=reachable('minus');
    const short=plus.has('minus');
    const lit=!short&&((plus.has('left')&&minus.has('right'))||(plus.has('right')&&minus.has('left')));
    board.classList.toggle('lamp-lit',lit);
    status.dataset.state=short?'short':lit?'lit':'open';
    status.textContent=short?'Kurzschluss. Die Batteriepole sind über Kabel verbunden. Löse eine Verbindung.'
      :lit?'Stromkreis geschlossen. Die Glühlampe leuchtet.'
      :placed.size<components.length?'Aufbau unvollständig.':'Stromkreis offen. Die Glühlampe bleibt aus.';

    instruction.textContent=message??(selectedLead!==null
      ? leads[selectedLead].name+' · '+(firstEnd?'Zweiten Anschluss wählen.':'Ersten Anschluss wählen.')
      :placed.size<components.length?'Wähle ein Bauteil und setze es auf die Grundplatte.'
      : 'Wähle ein Kabel, um zwei Buchsen zu verbinden.');
    drawWires();
  }

  document.querySelector('#reset-circuit').addEventListener('click',()=>{
    placed.clear();
    leads.forEach(lead=>{ lead.ends=[]; });
    selectedPart=selectedLead=firstEnd=null;
    update();
  });
  new ResizeObserver(drawWires).observe(board);
  update();
}

circuitPage();
