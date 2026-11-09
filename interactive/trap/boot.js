/* Gate initialization and browser storage behind an explicit choice on every page. */
(function(){
  'use strict';
  const active=['federkraft','hebel','goldene-regel'];
  const isActive=id=>id==='basecamp'||active.includes(id);
  window.TrapAvailability={active,isActive};
  const main=document.querySelector('main.shell'),station=document.body.dataset.station;
  // Disable every entry point, including lesson navigation and overview cards.
  document.querySelectorAll('a[href]').forEach(link=>{
    const id=link.getAttribute('href').replace(/\.html$/,'');
    if(['uebersetzung','raeder','reibung','rechnen','testgelaende'].includes(id)){
      link.removeAttribute('href');link.setAttribute('aria-disabled','true');link.tabIndex=-1;link.classList.add('station-unavailable');
      link.title='Diese Station ist vorerst deaktiviert.';
    }
  });
  if(station&&!isActive(station)){
    main.replaceChildren();
    main.innerHTML='<section class="card unavailable-page"><p class="eyebrow">Mission Mausefallenauto</p><h1>Diese Station ist vorerst deaktiviert.</h1><p>Aktuell könnt ihr Zugkraft, Hebel und die Goldene Regel bearbeiten.</p><a class="button" href="index.html">Zur Erfinderinsel</a> <a href="../../impressum.html">Impressum</a></section>';
    main.hidden=false;window.TrapBoot={blocked:true};return;
  }
  const dialog=document.createElement('dialog');dialog.id='project-consent';dialog.className='project-consent';
  dialog.setAttribute('aria-labelledby','project-consent-title');dialog.setAttribute('aria-describedby','project-consent-description');
  dialog.innerHTML='<p class="eyebrow">Vor dem Start · Datenschutz</p><h2 id="project-consent-title">Eure Messdaten bleiben auf eurem Endgerät.</h2><div id="project-consent-description"><p>Dieses Projekt verarbeitet eure freiwilligen Namens- und Gruppenangaben, Messwerte, Modelleinstellungen und Bearbeitet-Häkchen ausschließlich im Browser. Diese Projektdaten werden nicht an uns oder Dritte übertragen.</p><p>Ohne die optionale Speicherung bleibt euer Stand nur auf dieser geöffneten Seite erhalten. Beim Neuladen, Schließen oder Wechseln der Seite geht er verloren. Bereits gespeicherte Projektstände werden dann weder gelesen noch verändert. Ihr könnt eure Ergebnisse per Screenshot oder als Projektdatei selbst sichern.</p><p>Mit „Für später speichern“ werden die Projektdaten im localStorage dieses Browsers auf eurem Endgerät gesichert und nach erneuter Zustimmung wieder geladen. Die Daten bleiben bis zum Zurücksetzen oder Löschen der Website-Daten erhalten. Eine automatische Übertragung auf andere Geräte findet nicht statt.</p><p>Das Projekt startet erst nach eurer Zustimmung. Beide Auswahlmöglichkeiten sind nicht vorausgewählt und werden bei jedem Öffnen erneut abgefragt. Ihr könnt die Einwilligung unten auf der Seite widerrufen.</p></div><form id="project-consent-form"><label class="consent-option"><input id="project-consent-checkbox" type="checkbox" required> <span>Ich willige in die lokale Verarbeitung unserer Projektdaten für dieses Lernprojekt ein.</span></label><label class="consent-option"><input id="project-save-later" type="checkbox"> <span>Unsere Projektdaten auf diesem Endgerät für späteres Weiterarbeiten speichern und nach erneuter Zustimmung wieder laden. <strong>Optional.</strong></span></label><div class="actions"><button id="project-consent-start" type="submit" class="button" disabled>Einwilligen und starten</button><a href="../../index.html">Nicht einwilligen · zurück</a></div><p><a href="../../impressum.html">Impressum</a></p><p id="project-start-status" role="status"></p></form>';
  document.body.append(dialog);
  const consent=document.getElementById('project-consent-checkbox'),saveLater=document.getElementById('project-save-later'),start=document.getElementById('project-consent-start');
  consent.addEventListener('change',()=>{start.disabled=!consent.checked;});
  dialog.addEventListener('cancel',event=>event.preventDefault());
  let started=false;
  window.TrapBoot={blocked:false,ready:false};
  document.getElementById('project-consent-form').addEventListener('submit',async event=>{
    event.preventDefault();if(!consent.checked||started)return;
    started=true;start.disabled=true;consent.disabled=true;saveLater.disabled=true;
    window.TrapConsent={persistent:saveLater.checked};
    try{
      for(const src of document.body.dataset.projectScripts.split(',')){
        await new Promise((resolve,reject)=>{
          const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(new Error('Datei konnte nicht geladen werden: '+src));document.head.append(script);
        });
      }
      main.hidden=false;dialog.close();window.TrapBoot.ready=true;document.dispatchEvent(new Event('trap:ready'));
    }catch(error){document.getElementById('project-start-status').textContent=error.message+' Bitte ladet die Seite neu.';}
  });
  dialog.showModal();
})();
