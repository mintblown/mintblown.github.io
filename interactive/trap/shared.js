/* Browser-local project data; no server, accounts, or network requests. */
(function () {
  'use strict';
  const KEY = 'mission-mausefallenauto-v1';
  const storageAllowed=window.TrapConsent?.persistent===true;
  let state = { tables: {}, controls: {}, explored: {}, profile: {} }, persistent = storageAllowed, stale = false;
  if(storageAllowed)try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    if (stored && typeof stored === 'object') {
      for (const part of ['tables', 'controls', 'explored']) {
        if (stored[part] && typeof stored[part] === 'object' && !Array.isArray(stored[part])) state[part] = stored[part];
      }
      if(stored.profile&&typeof stored.profile==='object'&&!Array.isArray(stored.profile)){
        for(const [key,max] of [['name',150],['groupName',150],['members',1000]])if(typeof stored.profile[key]==='string')state.profile[key]=stored.profile[key].slice(0,max);
      }
    }
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (_) { persistent = false; }
  function status() {
    const target = document.getElementById('storage-status');
    if (target) target.textContent = !storageAllowed
      ? 'Nur auf dieser geöffneten Seite: Beim Wechseln, Neuladen oder Schließen geht dieser Stand verloren. Vorher Screenshots oder eine Projektdatei sichern. Vorhandene Speicherstände bleiben unangetastet.'
      : persistent
      ? 'Automatisch auf diesem Gerät in diesem Browser gespeichert. Diagramme zusätzlich per Screenshot sichern; bei Browserdaten-Löschung gehen lokale Daten verloren.'
      : 'Der Browser kann die Daten gerade nicht dauerhaft speichern. Sichert eure Diagramme per Screenshot und eure Versuchsreihe als CSV, bevor ihr diese Seite verlasst.';
  }
  function save() {
    if (stale) return;
    if(!storageAllowed){status();return;}
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (_) { persistent = false; }
    status();
  }
  const format = (value, digits = 2) => Number.isFinite(value)
    ? value.toLocaleString('de-DE', { maximumFractionDigits: digits }) : '—';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function localDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  document.getElementById('reset-data')?.addEventListener('click', () => {
    if (!confirm(storageAllowed?'Alle gespeicherten Projektdaten in diesem Browser zurücksetzen? Screenshots und exportierte Dateien bleiben erhalten.':'Die Daten dieser geöffneten Seite verwerfen? Bereits gespeicherte Projektstände bleiben unangetastet.')) return;
    state.tables = {}; state.controls = {}; state.explored = {}; state.profile = {}; save(); location.reload();
  });
  // Another tab can save newer project data. Reload deliberately instead of overwriting it silently.
  addEventListener('storage', event => {
    if (!storageAllowed||event.key !== KEY) return;
    stale = true;
    document.querySelectorAll('input, select, button').forEach(element => { element.disabled = true; });
    const target = document.getElementById('storage-status');
    if (target) {
      target.replaceChildren(document.createTextNode('Projektdaten wurden in einem anderen Tab geändert. '));
      const button = document.createElement('button'); button.type = 'button'; button.className = 'button small secondary';
      button.textContent = 'Aktuellen Stand laden'; button.onclick = () => location.reload(); target.append(button);
    }
  });
  window.Trap = { state, save, format, escape, localDate,storageAllowed };
  const footer=document.querySelector('.site-footer');
  if(footer){
    const button=document.createElement('button');button.type='button';button.className='button small secondary';button.id='withdraw-project-consent';
    button.textContent=storageAllowed?'Einwilligung widerrufen und Daten löschen':'Einwilligung widerrufen und Sitzung beenden';
    button.onclick=()=>{
      if(storageAllowed)try{localStorage.removeItem(KEY);}catch(_){alert('Die gespeicherten Daten konnten nicht gelöscht werden. Entfernt die Website-Daten bei Bedarf über eure Browsereinstellungen.');}
      location.reload();
    };
    footer.append(button);
  }
  status();
})();
