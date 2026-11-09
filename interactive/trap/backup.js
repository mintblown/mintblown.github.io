/* Portable, versioned project files. Incomplete measurements are preserved as entered. */
(function (root) {
  'use strict';
  const FORMAT = 'mission-mausefallenauto', VERSION = 1, MAX_BYTES = 5 * 1024 * 1024;
  const fields = {
    spring: ['angle','force'], lever: ['f1','l1','f2','l2'], ramp: ['s','h','force','weight','lift'],
    trials: ['date','change','length','axle','wheel','unwind','total']
  };
  const controls = {
    federkraft: ['arm-angle'], hebel: ['lever-length','lever-angle','plate-count','plate-total-force'], 'goldene-regel': [],
    uebersetzung: ['winding-mode','winding-radius','string-length','string-force'],
    raeder: ['wheel-radius','wheel-turns','roll-progress'], reibung: ['bearing','rolling','grip'],
    rechnen: ['calc-length','calc-axle','calc-wheel'], testgelaende: []
  };
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function requireObject(value, allowed, label) {
    if (!object(value) || Object.keys(value).some(k => !allowed.includes(k))) throw new Error(`${label}: unbekannte oder beschädigte Daten.`);
  }
  function strings(value, allowed, label) {
    requireObject(value,allowed,label);
    for (const v of Object.values(value)) if (typeof v !== 'string' || v.length > 300) throw new Error(`${label}: ungültiger Eintrag.`);
    return Object.fromEntries(Object.entries(value));
  }
  function validate(data) {
    requireObject(data,['tables','controls','explored','profile'],'Projekt');
    for (const part of ['tables','controls','explored']) if (!object(data[part])) throw new Error('Messwerte, Einstellungen oder Bearbeitungsstand fehlen.');
    requireObject(data.tables,Object.keys(fields),'Messwerte');
    const tables={};
    for (const [name,rows] of Object.entries(data.tables)) {
      if (!Array.isArray(rows) || rows.length>10000) throw new Error('Ungültige Messwerttabelle.');
      tables[name]=rows.map(row=>{
        const clean=strings(row,fields[name],'Messwertzeile');
        if(name==='ramp'&&!Object.hasOwn(clean,'lift'))clean.lift='';
        if (fields[name].some(key=>!Object.hasOwn(clean,key))) throw new Error('Eine Messwertzeile ist unvollständig gespeichert.');
        return clean;
      });
    }
    requireObject(data.controls,Object.keys(controls),'Einstellungen');
    const settings=Object.fromEntries(Object.entries(data.controls).map(([station,values])=>[station,strings(values,controls[station],'Stationseinstellungen')]));
    requireObject(data.explored,Object.keys(controls),'Bearbeitungsstand');
    if (Object.values(data.explored).some(v=>typeof v!=='boolean')) throw new Error('Ungültiger Bearbeitungsstand.');
    let profile;
    if(data.profile!==undefined){
      requireObject(data.profile,['name','groupName','members'],'Gruppenangaben');profile={};
      for(const [key,max]of [['name',150],['groupName',150],['members',1000]]){
        if(data.profile[key]===undefined)continue;
        if(typeof data.profile[key]!=='string'||data.profile[key].length>max)throw new Error('Gruppenangaben: ungültiger oder zu langer Eintrag.');
        profile[key]=data.profile[key];
      }
    }
    return {tables,controls:settings,explored:Object.fromEntries(Object.entries(data.explored)),...(profile?{profile}: {})};
  }
  function encode(state) {
    return JSON.stringify({format:FORMAT,version:VERSION,savedAt:new Date().toISOString(),data:validate(state)},null,2);
  }
  function decode(source) {
    if (typeof source!=='string' || source.length>MAX_BYTES) throw new Error('Die Projektdatei ist zu groß (maximal 5 MB).');
    let file;
    try {file=JSON.parse(source.replace(/^\uFEFF/,''));} catch (_) {throw new Error('Die Datei ist keine lesbare Projektdatei. Bitte eine gespeicherte JSON-Projektdatei auswählen.');}
    if (!object(file)||file.format!==FORMAT) throw new Error('Diese Datei gehört nicht zum Mausefallenauto-Projekt. CSV-Dateien lassen sich hier nicht laden.');
    if (file.version!==VERSION) throw new Error('Diese Version der Projektdatei wird nicht unterstützt.');
    return validate(file.data);
  }
  const api={encode,decode,MAX_BYTES};root.TrapBackup=api;
  if (typeof module!=='undefined') module.exports=api;
  if (typeof document==='undefined' || !root.Trap) return;
  const storageStatus=document.getElementById('storage-status');
  if (!storageStatus) return;
  const basecampActions=document.getElementById('basecamp-project-actions');
  const section=document.createElement('section');section.className=basecampActions?'project-files':'card project-files';section.setAttribute('aria-labelledby',basecampActions?'basecamp-project-title':'project-files-title');
  section.innerHTML='<h2 id="project-files-title">Euer Projekt zum Mitnehmen</h2><p>Speichert eure Namens- und Gruppenangaben, Messwerte, Modelleinstellungen und Bearbeitet-Häkchen gemeinsam in einer Datei. So könnt ihr auf einem anderen Gerät weiterarbeiten. Diagramme entstehen beim Laden neu; Screenshots und CSV-Dateien sind nicht in der Projektdatei enthalten.</p><div class="actions"><button type="button" class="button" id="save-project">Projekt speichern</button><button type="button" class="button secondary" id="load-project">Projekt laden</button></div><input id="project-file" type="file" accept=".json,application/json" hidden><p id="project-file-status" role="status" class="hint" aria-live="polite"></p>';
  if(basecampActions){
    section.querySelector('h2').remove();basecampActions.append(section);
    const fields=[['project-name','name',150],['project-group','groupName',150],['project-members','members',1000]];
    Trap.state.profile=Trap.state.profile||{};
    fields.forEach(([id,key,max])=>{
      const field=document.getElementById(id);field.value=typeof Trap.state.profile[key]==='string'?Trap.state.profile[key]:'';
      field.addEventListener('input',()=>{Trap.state.profile[key]=field.value.slice(0,max);Trap.save();});
    });
  }else storageStatus.before(section);
  const status=document.getElementById('project-file-status'),input=document.getElementById('project-file'),load=document.getElementById('load-project');
  if(!Trap.storageAllowed){load.disabled=true;load.title='Zum Laden einer Projektdatei bitte beim Start die Speicherung für später aktivieren.';status.textContent='Projekt speichern funktioniert auch ohne dauerhafte Browserspeicherung. Zum Laden einer Projektdatei aktiviert beim Start die Speicheroption.';}
  document.getElementById('save-project').onclick=()=>{
    try {
      const json=encode(Trap.state),blob=new Blob([json],{type:'application/json'});
      if(blob.size>MAX_BYTES)throw new Error('Die Projektdaten sind zu groß für eine Projektdatei (maximal 5 MB).');
      const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`mausefallenauto-projekt-${Trap.localDate()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      status.textContent='Download gestartet. Bewahrt die JSON-Projektdatei in eurer Gruppenablage auf; mit „Projekt laden“ könnt ihr sie wieder öffnen.';
    } catch(error) {status.textContent='Speichern nicht möglich: '+error.message;}
  };
  load.onclick=()=>{input.value='';input.click();};
  input.onchange=async()=>{
    const file=input.files[0];if(!file||!Trap.storageAllowed)return;
    try {
      if(file.size>MAX_BYTES)throw new Error('Die Projektdatei ist zu groß (maximal 5 MB).');
      const restored=decode(await file.text());
      if(load.disabled)throw new Error('Der Stand wurde in einem anderen Tab geändert. Ladet zuerst die Seite neu.');
      const rows=Object.values(restored.tables).reduce((sum,table)=>sum+table.length,0),done=Object.values(restored.explored).filter(Boolean).length;
      if(!confirm(`Projektdatei laden (${rows} Tabellenzeilen, ${done} bearbeitete Stationen)? Alle aktuellen Projektdaten in diesem Browser werden ersetzt. Speichert euren bisherigen Stand vorher bei Bedarf als eigene Datei.`)){
        status.textContent='Laden abgebrochen. Euer aktueller Stand bleibt erhalten.';return;
      }
      // Persist first: a storage/quota failure must leave the running project unchanged.
      try {localStorage.setItem('mission-mausefallenauto-v1',JSON.stringify(restored));}
      catch (_) {throw new Error('Der Browser kann die Daten nicht speichern. Euer bisheriger Stand wurde nicht ersetzt. Prüft freien Speicherplatz und die Browsereinstellungen.');}
      location.reload();
    } catch(error) {status.textContent='Projekt nicht geladen: '+error.message;}
    finally {input.value='';}
  };
})(typeof globalThis!=='undefined'?globalThis:this);
