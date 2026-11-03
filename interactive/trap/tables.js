/* Editable real measurements. Empty cells are never replaced by invented measurements. */
(function () {
  'use strict';
  const { state, save, format: fmt, escape: esc, localDate } = Trap;
  const M = TrapModel;
  const screenshot = '<p class="screenshot">Screenshot sichern: Haltet dieses Diagramm zusammen mit Achsenbeschriftungen und Legende als Screenshot fest. Legt ihn in eurer Gruppenablage ab; die lokale Browserspeicherung ersetzt diese Sicherung nicht.</p>';
  const specs = {
    spring: { caption: 'Eure gemessene tangentiale Haltekraft', fields: [
      ['angle','Winkel α (°)',0,180],['force','Kraft F (N)',0,100]], outputs: [], chart:'spring-chart' },
    lever: { caption:'Eure Hebel im Gleichgewicht', fields: [
      ['f1','Kraft F₁ (N)',0,200,true],['l1','Hebelarm l₁ (cm)',0,100,true],['f2','Kraft F₂ (N)',0,200,true],['l2','Hebelarm l₂ (cm)',0,100,true]],
      outputs:['F₁ · l₁ (N·cm)','F₂ · l₂ (N·cm)','Differenz links − rechts (N·cm)'], chart:'lever-chart' },
    ramp: { caption:'Eure Rampen bei gleicher Hubhöhe', fields:[
      ['s','Rampenlänge s (m)',0,10,true],['h','Hubhöhe h (m)',0,2,true],['force','Zugkraft F (N)',0,200,true],['weight','Gewichtskraft F_G (N)',0,200,true]],
      outputs:['F · s (N·m)','F_G · h (N·m)','Differenz (N·m)'],chart:'ramp-chart' },
    trials: { caption:'Eure Testläufe mit eigenen Baumaßen und Messwerten', fields:[
      ['date','Datum','date'],['change','Änderung / Beobachtung','text'],['length','Fadenlänge L (cm)',0,1000,true],['axle','Wickelradius (mm)',0,100,true],['wheel','Radradius (cm)',0,100,true],['unwind','Bis Fadenende / Stopp (m)',0,1000],['total','Gesamtstrecke (m)',0,1000]],
      outputs:['Geometrisch (m)','Ausrollen (m)','Δ gesamt (m)'],chart:'trials-chart' }
  };
  const hosts = {};
  function blank(type) { return Object.fromEntries(specs[type].fields.map(([key,,kind])=>[key,kind==='date'?localDate():''])); }
  function rows(type) { return state.tables[type]; }
  function value(row, field) {
    const [key,,min,max,strict] = field;
    const n=M.number(row[key]);
    return n!==null && n<=max && (strict?n>min:n>=min) ? n : null;
  }
  function assess(type,row) {
    const spec=specs[type], vals={}, invalid=[], missing=[];
    spec.fields.forEach(field=>{
      const [key,,kind]=field;
      if (kind==='text' || kind==='date') return;
      vals[key]=value(row,field);
      if (vals[key]===null) (String(row[key]??'').trim()?invalid:missing).push(key);
    });
    let result=null, warning='';
    if(type==='spring' && !invalid.length && !missing.length) result={x:vals.angle,y:vals.force};
    if(type==='lever' && !invalid.length && !missing.length) result=M.lever(vals.f1,vals.l1,vals.f2,vals.l2);
    if(type==='ramp' && !invalid.length && !missing.length){
      if(vals.h>=vals.s){invalid.push('h','s');warning='Die Rampenlänge muss größer als die Hubhöhe sein.';}
      else {result=M.ramp(vals.s,vals.h,vals.force,vals.weight);if(result.grade>22)warning='Die berechnete Steigung liegt über etwa 20 %. Prüft Höhe und Rampenlänge sowie eure Einheiten.';}
    }
    if(type==='trials') {
      const prediction=M.drive(vals.length===null?null:vals.length/100,vals.axle===null?null:vals.axle/1000,vals.wheel===null?null:vals.wheel/100);
      if(vals.unwind!==null && vals.total!==null && vals.total<vals.unwind){invalid.push('unwind','total');warning='Die Gesamtstrecke darf nicht kleiner als die Strecke bis Fadenende / Stopp sein.';}
      result={ prediction: prediction?.distance ?? null, unwind: invalid.includes('unwind')?null:vals.unwind,
        total:invalid.includes('total')?null:vals.total,
        afterRoll: vals.total!==null&&vals.unwind!==null&&!invalid.includes('total')?vals.total-vals.unwind:null,
        difference:prediction&&vals.total!==null&&!invalid.includes('total')?vals.total-prediction.distance:null };
    }
    return {vals,invalid,missing,result,warning};
  }
  function outputValues(type,result){
    if(!result)return specs[type].outputs.map(()=>null);
    if(type==='lever')return [result.left,result.right,result.difference];
    if(type==='ramp')return [result.pullWork,result.liftWork,result.difference];
    if(type==='trials')return [result.prediction,result.afterRoll,result.difference];
    return [];
  }
  function tableHTML(type){const spec=specs[type];return `<div class="table-scroll"><table><caption>${spec.caption}</caption><thead><tr><th scope="col">Nr.</th>${spec.fields.map(f=>`<th scope="col">${esc(f[1])}</th>`).join('')}${spec.outputs.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}<th scope="col">Zeile</th></tr></thead><tbody>${rows(type).map((row,i)=>`<tr data-row="${i}"><th scope="row">${i+1}</th>${spec.fields.map(field=>{const [key,label,kind,max,strict]=field;const inputType=kind==='date'?'date':'text';return `<td><input type="${inputType}" ${kind!=='text'&&kind!=='date'?'inputmode="decimal"':''} class="${kind==='text'?'wide':''}" data-field="${key}" value="${esc(row[key])}" aria-label="${esc(label)}, Messung ${i+1}" ${kind==='text'?'maxlength="300"':''} ${kind==='date'?'':'autocomplete="off"'}></td>`;}).join('')}${spec.outputs.map((_,j)=>`<td class="computed" data-output="${j}">—</td>`).join('')}<td><button type="button" class="button small secondary" data-delete="${i}" aria-label="Messung ${i+1} löschen">Löschen</button></td></tr>`).join('')}</tbody></table></div><button type="button" class="button secondary" data-add>＋ Messung hinzufügen</button><p class="table-message" role="status" data-message></p>`;}
  function initialize(type,host) {
    hosts[type]=host;
    if(!Array.isArray(state.tables[type]))state.tables[type]=Array.from({length:type==='trials'?1:3},()=>blank(type));
    state.tables[type]=state.tables[type].filter(r=>r && typeof r==='object').map(r=>Object.fromEntries(specs[type].fields.map(([key])=>[key,String(r[key]??'')])));
    render(type);
  }
  function render(type){const host=hosts[type];host.innerHTML=tableHTML(type);
    host.querySelector('[data-add]').onclick=()=>{rows(type).push(blank(type));save();render(type);const list=host.querySelectorAll('tbody input');list[list.length-specs[type].fields.length]?.focus();};
    host.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{const index=Number(b.dataset.delete);rows(type).splice(index,1);save();render(type);host.querySelector('[data-add]').focus();});
    host.querySelectorAll('tbody input').forEach(input=>input.addEventListener('input',()=>{const i=Number(input.closest('tr').dataset.row);rows(type)[i][input.dataset.field]=input.value;save();update(type);}));
    update(type);
  }
  function update(type){const host=hosts[type],analyses=rows(type).map(row=>assess(type,row));let count=0,messages=[];
    host.querySelectorAll('tbody tr').forEach((tr,i)=>{const a=analyses[i];if(a.invalid.length)count++;
      tr.querySelectorAll('[data-field]').forEach(input=>input.setAttribute('aria-invalid',String(a.invalid.includes(input.dataset.field))));
      outputValues(type,a.result).forEach((value,j)=>tr.querySelector(`[data-output="${j}"]`).textContent=fmt(value,3));
      if(a.warning)messages.push(`Messung ${i+1}: ${a.warning}`);
    });
    const message=host.querySelector('[data-message]');
    message.textContent=(count?`${count} Zeile(n) enthalten ungültige Werte. Markierte Felder prüfen: nur Zahlen im sinnvollen Messbereich; Komma oder Punkt sind möglich. `:'')+messages.join(' ');
    if(type==='ramp'){
      const complete=analyses.filter(a=>a.result);
      if(complete.length>1){
        const heights=complete.map(a=>a.vals.h),weights=complete.map(a=>a.vals.weight);
        if(Math.max(...heights)-Math.min(...heights)>.005) message.textContent+=' Für den Vergleich sollte die Hubhöhe gleich bleiben. Eure Höhen unterscheiden sich; prüft den Aufbau.';
        if(Math.max(...weights)-Math.min(...weights)>.1) message.textContent+=' Verwendet denselben Wagen. Eure Gewichtskräfte unterscheiden sich; prüft Messung und Beladung.';
      }
    }
    if(!message.textContent)message.textContent=type==='trials'?'Leere Messfelder bleiben offen. Baumaße liefern nur die geometrische Vergleichsstrecke. Wiederholungen erhalten eigene Zeilen.':'Leere Felder bleiben offen. Nur vollständig und gültig ausgefüllte Messungen erscheinen im Diagramm. Komma oder Punkt sind möglich.';
    chart(type,analyses);
  }
  function frame(title,svg){return `<div class="chart"><h3>${esc(title)}</h3>${svg}${screenshot}</div>`;}
  function chart(type,analyses,target=document.getElementById(specs[type].chart),offset=0) {
    if(!target)return;
    if(type==='spring') {
      const points=analyses.map(a=>a.result).filter(Boolean).sort((a,b)=>a.x-b.x);
      if(!points.length){target.innerHTML=frame('Kraft-Winkel-Diagramm','<p class="chart-empty">Eure eigenen Messwerte erscheinen hier, sobald Winkel und Kraft eingetragen sind.</p>');return;}
      const xmax=Math.max(10,...points.map(p=>p.x)),ymax=Math.max(1,...points.map(p=>p.y))*1.15;
      const x=n=>65+n/xmax*555,y=n=>280-n/ymax*230;
      let svg=axes(xmax,ymax,'Winkel α (°)','Kraft F (N)');
      svg+=`<polyline points="${points.map(p=>`${x(p.x)},${y(p.y)}`).join(' ')}" fill="none" stroke="#32886a" stroke-width="2"/>`;
      svg+=points.map(p=>`<circle cx="${x(p.x)}" cy="${y(p.y)}" r="5" fill="#286b55"><title>${esc(fmt(p.x))}°: ${esc(fmt(p.y))} N</title></circle>`).join('');
      target.innerHTML=frame('Kraft-Winkel-Diagramm',`<svg viewBox="0 0 660 345" role="img" aria-label="Eure ${points.length} Kraft-Winkel-Messpunkte; genaue Werte stehen in der Tabelle">${svg}</svg><p class="hint">Die Linien verbinden nur eure Messpunkte und geben keine allgemeingültige Federkennlinie vor. Gleiche Winkel werden nicht automatisch gemittelt.</p>`);
    } else {
      let groups=[],series=[],title='';
      if(type==='lever'){groups=analyses.flatMap((a,i)=>a.result?[{label:String(i+1+offset),values:[a.result.left,a.result.right]}]:[]);series=['F₁ · l₁','F₂ · l₂'];title='Kraft mal Hebelarm vergleichen';}
      if(type==='ramp'){groups=analyses.flatMap((a,i)=>a.result?[{label:String(i+1+offset),values:[a.result.pullWork,a.result.liftWork]}]:[]);series=['F · s','F_G · h'];title='Kraft mal Weg vergleichen';}
      if(type==='trials'){groups=analyses.flatMap((a,i)=>a.result&&[a.result.prediction,a.result.unwind,a.result.total].some(Number.isFinite)?[{label:String(i+1+offset),values:[a.result.prediction,a.result.unwind,a.result.total]}]:[]);series=['Geometrisch (Modell)','Bis Fadenende / Stopp (Messung)','Gesamt (Messung)'];title='Eure Testläufe im Vergleich';}
      const colors=['#397c69','#dc9c3e','#6b71b2'];
      if(!groups.length){target.innerHTML=frame(title,'<p class="chart-empty">Tragt eure Messungen ein. Hier werden eure Werte verglichen.</p>');return;}
      const ymax=Math.max(1,...groups.flatMap(g=>g.values.filter(Number.isFinite)))*1.15;
      const width=Math.max(660,groups.length*100+100),plotwidth=width-105;
      let svg=axes(1,ymax,'Messung / Lauf',type==='lever'?'Produkt (N·cm)':type==='ramp'?'Produkt (N·m)':'Strecke (m)',width,false);
      groups.forEach((g,i)=>{const groupwidth=plotwidth/groups.length,bw=Math.min(27,(groupwidth-16)/series.length);const center=65+(i+.5)*groupwidth;
        g.values.forEach((v,j)=>{if(!Number.isFinite(v))return;const h=v/ymax*230;svg+=`<rect x="${center-series.length*bw/2+j*bw}" y="${280-h}" width="${bw-2}" height="${h}" rx="2" fill="${colors[j]}"><title>Messung ${g.label}, ${esc(series[j])}: ${esc(fmt(v,3))}</title></rect>`;});
        svg+=`<text x="${center}" y="301" text-anchor="middle">${g.label}</text>`;
      });
      const legend=`<div class="legend">${series.map((s,i)=>`<span style="--legend:${colors[i]}">${esc(s)}</span>`).join('')}</div>`;
      target.innerHTML=frame(title,`<div style="overflow-x:auto"><svg style="min-width:${width>800?width+'px':'0'}" viewBox="0 0 ${width} 345" role="img" aria-label="${esc(title)}; alle genauen Werte stehen in der Tabelle">${svg}</svg></div>${legend}${type==='trials'?'<p class="hint">Fehlende Messwerte werden ausgelassen, nicht als 0 dargestellt. Nur eine vollständig beobachtete Fadenabwicklung ist direkt mit der geometrischen Strecke vergleichbar.</p>':''}`);
    }
  }
  function axes(xmax,ymax,xlabel,ylabel,width=660,numericX=true){
    let s=`<text x="65" y="20">${esc(ylabel)}</text><path d="M65 40V280H${width-40}" fill="none" stroke="#6a8072" stroke-width="1.5"/>`;
    for(let i=0;i<=5;i++){const y=280-i/5*230;s+=`<path d="M65 ${y}H${width-40}" stroke="#e1e8dd"/><text x="56" y="${y+4}" text-anchor="end">${esc(fmt(i*ymax/5))}</text>`;if(numericX)s+=`<text x="${65+i/5*(width-105)}" y="302" text-anchor="middle">${esc(fmt(i*xmax/5,0))}</text>`;}
    return s+`<text x="${width/2}" y="334" text-anchor="middle">${esc(xlabel)}</text>`;
  }
  document.querySelectorAll('[data-table]').forEach(host=>initialize(host.dataset.table,host));
  document.getElementById('import-dimensions')?.addEventListener('click',()=>{
    const c=state.controls.rechnen||{}, row=blank('trials');
    const values=['calc-length','calc-axle','calc-wheel'].map(k=>M.number(c[k]));
    const result=M.drive(values[0]===null?null:values[0]/100,values[1]===null?null:values[1]/1000,values[2]===null?null:values[2]/100);
    const status=document.getElementById('trial-status');
    if(!result){status.textContent='In der Rechenwerkstatt sind noch keine drei gültigen Baumaße gespeichert.';return;}
    row.length=String(c['calc-length']);row.axle=String(c['calc-axle']);row.wheel=String(c['calc-wheel']);
    rows('trials').push(row);save();render('trials');status.textContent='Neuer Lauf mit den gespeicherten Rechenmaßen angelegt. Tragt jetzt eure echten Messungen und Beobachtungen ein.';
  });
  document.getElementById('export-csv')?.addEventListener('click',()=>{
    const spec=specs.trials;
    // Protect free text against spreadsheet formula interpretation.
    const csvCell=value=>{let s=String(value??'');if(/^[\s]*[=+\-@]/.test(s) && M.number(s)===null)s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    const csv=[['Lauf',...spec.fields.map(f=>f[1]),...spec.outputs],...rows('trials').map((r,i)=>[i+1,...spec.fields.map(f=>r[f[0]]),...outputValues('trials',assess('trials',r).result).map(n=>Number.isFinite(n)?String(n).replace('.',','):'')])].map(r=>r.map(csvCell).join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`mausefallenauto-${localDate()}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    document.getElementById('trial-status').textContent='CSV-Download angestoßen. Sichert das Diagramm zusätzlich per Screenshot.';
  });
  window.TrapTables={assess,outputValues,blank,specs,chartHTML(type,rows,offset=0){
    const target={innerHTML:''};chart(type,rows.map(row=>assess(type,row)),target,offset);return target.innerHTML;
  }};
})();
