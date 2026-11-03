/* Self-contained construction report. Uses exactly the same validation and charts as the stations. */
(function () {
  'use strict';
  const {escape:esc,format:fmt}=Trap, M=TrapModel, T=TrapTables;
  const names={federkraft:'Zugkraft der Falle',hebel:'Hebelwerkstatt','goldene-regel':'Goldene Regel',uebersetzung:'Übersetzung',raeder:'Radwerkstatt',reibung:'Reibungsforschung',rechnen:'Rechenwerkstatt',testgelaende:'Testgelände'};
  const labels={
    'arm-angle':'Skizzenwinkel α (°)','lever-length':'Armlänge im Modell (cm)','lever-angle':'Drehwinkel im Modell (°)',
    'winding-mode':'Wickelstelle im Modell','winding-radius':'Wickelradius im Modell (mm)','string-length':'Fadenlänge im Modell (cm)','string-force':'Angenommene Fadenzugkraft (N)',
    'wheel-radius':'Radradius im Modell (cm)','wheel-turns':'Umdrehungen im Modell','roll-progress':'Abrollvorgang (%)',
    bearing:'Lagerreibung (qualitative Stufe 0–100)',rolling:'Rollwiderstand (qualitative Stufe 0–100)',grip:'Haftung (qualitative Stufe 0–100)',
    'calc-length':'Eigene abwickelbare Fadenlänge (cm)','calc-axle':'Eigener wirksamer Wickelradius (mm)','calc-wheel':'Eigener Antriebsradradius (cm)'
  };
  const nonempty=row=>Object.values(row).some(v=>String(v??'').trim()!=='');
  function value(v){return v===null||v===undefined||v===''?'—':esc(v);}
  function table(headers,rows){return `<table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((v,i)=>i===0?`<th scope="row">${v}</th>`:`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
  function dataSection(type,rows){
    const spec=T.specs[type],filled=rows.map((row,i)=>({row,i,a:T.assess(type,row)})).filter(item=>nonempty(item.row));
    if(!filled.length)return '<p class="empty">Noch keine Messwerte eingegeben.</p>';
    const resultCells=item=>T.outputValues(type,item.a.result).map(n=>value(Number.isFinite(n)?fmt(n,3):null));
    let html='';
    if(type==='trials'){
      html+='<h3>Baumaße und Beobachtungen je Lauf</h3>'+table(['Lauf',...spec.fields.slice(0,5).map(f=>f[1])],filled.map(item=>[String(item.i+1),...spec.fields.slice(0,5).map(f=>value(item.row[f[0]]))]));
      html+='<h3>Messungen und berechnete Ergebnisse</h3>'+table(['Lauf',...spec.fields.slice(5).map(f=>f[1]),...spec.outputs],filled.map(item=>[String(item.i+1),...spec.fields.slice(5).map(f=>value(item.row[f[0]])),...resultCells(item)]));
    }else html+=table(['Nr.',...spec.fields.map(f=>f[1]),...spec.outputs],filled.map(item=>[String(item.i+1),...spec.fields.map(f=>value(item.row[f[0]])),...resultCells(item)]));
    const issues=filled.flatMap(({i,a})=>{
      const notes=[];
      if(a.invalid.length)notes.push('Ungültige Werte: '+a.invalid.map(k=>spec.fields.find(f=>f[0]===k)[1]).join(', '));
      if(a.missing.length)notes.push('Noch offen: '+a.missing.map(k=>spec.fields.find(f=>f[0]===k)[1]).join(', '));
      if(a.warning)notes.push(a.warning);
      return notes.length?[`<li>Messung ${i+1}: ${esc(notes.join(' · '))}</li>`]:[];
    });
    if(issues.length)html+='<div class="notice"><strong>Hinweise zum Datenstand</strong><ul>'+issues.join('')+'</ul></div>';
    // Keep bar groups readable on paper. Original row numbers survive pagination.
    if(type==='spring')html+=T.chartHTML(type,rows);
    else for(let offset=0;offset<rows.length;offset+=8){const chunk=rows.slice(offset,offset+8);if(chunk.some(nonempty))html+=T.chartHTML(type,chunk,offset);}
    return html;
  }
  function settingsSection(settings){
    let html='';
    for(const [station,entries] of Object.entries(settings)){
      const filled=Object.entries(entries).filter(([,v])=>String(v).trim()!=='');if(!filled.length)continue;
      html+=`<h3>${esc(names[station]||station)}</h3>`+table(['Einstellung','Gespeicherter Wert'],filled.map(([key,v])=>[esc(labels[key]||key),value(key==='winding-mode'?(v==='drum'?'Fest gekoppelte Wickelscheibe':v==='axle'?'Direkt auf der Achse':v):v)]));
    }
    return html||'<p class="empty">Noch keine Modelleinstellungen verändert oder eigenen Rechenmaße eingegeben.</p>';
  }
  function render(source,date=new Date()){
    // Copy and validate the snapshot; building a report never changes project data.
    const data=TrapBackup.decode(TrapBackup.encode(source));
    const settings=data.controls.rechnen||{},dimensions=['calc-length','calc-axle','calc-wheel'].map(id=>M.number(settings[id]));
    const valid=dimensions.every((n,i)=>n!==null&&n>0&&n<=[1000,100,100][i]);
    const prediction=valid?M.drive(dimensions[0]/100,dimensions[1]/1000,dimensions[2]/100):null;
    const headline=table(['Baumaß','Eingegebener Wert'],['calc-length','calc-axle','calc-wheel'].map((id,i)=>[esc(labels[id]),value(settings[id])]));
    let main=`<header><p class="eyebrow">Mission Mausefallenauto · Klasse 9</p><h1>Unsere Bau-Doku</h1><p>Projektstand vom ${esc(date.toLocaleString('de-DE'))}</p><p>Zusammenfassung der eingegebenen Daten. Offene Felder sind mit „—“ gekennzeichnet. Modelle und reale Messungen werden getrennt ausgewiesen.</p></header><section><h2>1 · Unsere aktuellen Baumaße und Prognose</h2>${headline}`;
    if(prediction)main+=`<div class="result"><strong>Geometrische Strecke während vollständiger Fadenabwicklung: ${fmt(prediction.distance)} m</strong><p>Wickelumfang: ${fmt(2*Math.PI*dimensions[1]/1000,4)} m · Achsumdrehungen: ${fmt(prediction.turns)} · Radumfang: ${fmt(prediction.circumference,4)} m</p><p>n = L / (2πr<sub>Wicklung</sub>), s = n · 2πr<sub>Rad</sub> = L · r<sub>Rad</sub> / r<sub>Wicklung</sub></p></div>`;
    else main+='<p class="empty">Noch keine vollständigen gültigen Baumaße aus der Rechenwerkstatt vorhanden. Laufbezogene Baumaße stehen gegebenenfalls im Testprotokoll.</p>';
    main+='<p class="notice">Voraussetzungen: konstanter wirksamer Wickelradius, vollständige Fadenabwicklung ohne Durchrutschen, fest gekoppelte Achse und Antriebsräder, schlupffreies Rollen. Die geometrische Strecke ist weder garantierte Gesamtfahrstrecke noch obere Grenze: Das Auto kann früher stehen bleiben oder nach Fadenende ausrollen.</p></section>';
    for(const [type,title,explanation] of [
      ['spring','2 · Zugkraft unserer Falle','Reale Messungen am festen Angriffspunkt. Der Kraftmesser zieht bei jedem Winkel senkrecht zum Arm. Verbindungslinien sind keine allgemeingültige Federkennlinie.'],
      ['lever','3 · Unser Hebelversuch','Reale Gleichgewichtsmessungen. Verglichen werden Kraft mal senkrechter Hebelarm und ihre Differenz; keine automatisch bewertete Musterlösung.'],
      ['ramp','4 · Goldene Regel: Kraft und Weg','Reale Rampenmessungen. Bei gleicher Höhe vergleichen wir F · s mit F_G · h. 1 N·m = 1 Joule. Reibung und Messunsicherheit können Unterschiede erklären.'],
      ['trials','5 · Unsere Testläufe','Reale Strecken stehen neben der geometrischen Modellrechnung. „Bis Fadenende / Stopp“ ist nur bei vollständig abgewickeltem Faden direkt vergleichbar. Δ gesamt = Gesamtstrecke − geometrische Strecke ist eine Beschreibung, keine Qualitätsnote.']
    ])main+=`<section><h2>${title}</h2><p>${explanation}</p>${dataSection(type,data.tables[type]||[])}</section>`;
    main+='<section><h2>6 · Gespeicherte Modelleinstellungen und Rechenmaße</h2><p>Die folgenden Werte sind gespeicherte Einstellungen. Virtuelle Regler sind keine experimentellen Messungen. Unveränderte Standardwerte werden nicht als eigene Eingaben ergänzt.</p>'+settingsSection(data.controls)+'</section>';
    main+='<section><h2>7 · Unser Bearbeitungsstand</h2>'+table(['Werkstatt','Selbsteinschätzung'],Object.entries(names).map(([id,name])=>[esc(name),data.explored[id]===true?'Als bearbeitet markiert':'Noch nicht als bearbeitet markiert']))+'</section>';
    main+='<footer>Diese Doku enthält den eingegebenen digitalen Projektstand. Analoge Notizen und externe Screenshots sind nicht eingebettet. Zum späteren Weiterarbeiten zusätzlich die JSON-Projektdatei speichern.</footer>';
    return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsere Bau-Doku · Mausefallenauto</title><style>
      *{box-sizing:border-box}body{margin:0;background:#f3f2ec;color:#203c35;font:14px/1.65 system-ui,sans-serif}.toolbar{position:sticky;top:0;background:#203f34;color:white;padding:14px 24px;display:flex;gap:15px;align-items:center;flex-wrap:wrap}.toolbar button{font:700 14px system-ui;padding:10px 16px;border:0;border-radius:8px;cursor:pointer;background:#fff2ce;color:#203c35}.toolbar a{color:white}main{max-width:1060px;background:white;margin:24px auto;padding:38px}h1{font-size:36px;margin:8px 0}h2{font-size:24px;margin:0 0 12px}h3{font-size:17px}.eyebrow{text-transform:uppercase;font-size:11px;letter-spacing:.12em}section{margin:32px 0;padding-top:18px;border-top:1px solid #cddbd0}table{width:100%;border-collapse:collapse;margin:18px 0;font-size:12px;table-layout:fixed}th,td{border:1px solid #cbd8ce;text-align:left;padding:8px;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}thead th{background:#eaf1e7}tbody th{font-weight:600}tr{break-inside:avoid}thead{display:table-header-group}.notice,.result{padding:15px;background:#edf3e8;border-left:4px solid #6a8c58;margin:18px 0}.notice{background:#fff3d7;border-color:#bb923e}.empty{color:#5c7165;font-style:italic}.chart{break-inside:avoid;margin:25px 0}.chart svg{display:block;width:100%;height:auto;min-width:0!important}.chart text{font:12px system-ui;fill:#34534a}.chart>div{overflow:visible!important}.chart .screenshot{display:none}.legend{display:flex;gap:18px;flex-wrap:wrap;font-size:12px}.legend span:before{content:'';display:inline-block;width:12px;height:12px;background:var(--legend);margin-right:6px}.hint{font-size:12px;color:#526d62}footer{font-size:12px;border-top:1px solid #ccd8ca;padding-top:20px}button:focus-visible,a:focus-visible{outline:3px solid #da9d30;outline-offset:3px}@media(max-width:700px){main{margin:0;padding:20px}table{font-size:10px}td,th{padding:5px}}@page{size:A4 landscape;margin:12mm}@media print{body{background:white;font-size:11px}.toolbar{display:none}main{max-width:none;margin:0;padding:0}section{margin:20px 0}h1{font-size:27px}h2{font-size:20px;break-after:avoid}h3{break-after:avoid}table{font-size:10px}.chart{max-width:780px;margin:20px auto}.notice,.result,th,.legend span:before{-webkit-print-color-adjust:exact;print-color-adjust:exact}footer{margin-top:24px}}
    </style></head><body><div class="toolbar"><button type="button" onclick="window.print()">Drucken / als PDF speichern</button><button type="button" id="download-document">Dokument als HTML speichern</button><span>Vollständige Bau-Doku · Tabellen und Diagramme eingebettet</span></div><main>${main}</main><script>document.getElementById('download-document').onclick=function(){var html='<!doctype html>'+document.documentElement.outerHTML;var url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));var a=document.createElement('a');a.href=url;a.download='mausefallenauto-bau-doku.html';a.click();setTimeout(function(){URL.revokeObjectURL(url)},1000)};<\/script></body></html>`;
  }
  window.TrapDocument={render};
  const actions=document.querySelector('.project-files .actions');
  if(!actions)return;
  const button=document.createElement('button');button.type='button';button.className='button secondary';button.id='project-document';button.textContent='Bau-Doku erstellen';actions.append(button);
  button.onclick=()=>{
    const status=document.getElementById('project-file-status');
    try{
      const html=render(Trap.state),url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
      const opened=window.open(url,'_blank');
      if(opened){opened.opener=null;status.textContent='Bau-Doku in einem neuen Tab geöffnet. Dort könnt ihr sie als PDF oder als eigenständige HTML-Datei sichern.';}
      else{const link=document.createElement('a');link.href=url;link.download=`mausefallenauto-bau-doku-${Trap.localDate()}.html`;link.click();status.textContent='Der neue Tab wurde blockiert. Die Bau-Doku wird stattdessen als HTML-Datei heruntergeladen; öffnet sie zum Lesen oder Drucken.';}
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(error){status.textContent='Bau-Doku konnte nicht erstellt werden: '+error.message;}
  };
})();
