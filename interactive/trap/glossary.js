/* Short explanations: hover, keyboard focus or tap. No external library. */
(function(){
  'use strict';
  const terms={
    'tangential':'Entlang einer Tangente: Die Richtung steht senkrecht zum Radius der Kreisbahn. Am Spannarm heißt das: rechtwinklig zum Arm.',
    'Tangentiale':'Tangential heißt: rechtwinklig zum Spannarm und entlang seiner Kreisbahn.',
    'Drehpunkt':'Der Punkt, um den sich ein Hebel oder Arm dreht.',
    'Angriffspunkt':'Die Stelle, an der eine Kraft auf einen Körper wirkt.',
    'Hebelarm':'Der senkrechte Abstand zwischen dem Drehpunkt und der Wirkungslinie einer Kraft. Bei senkrechter Kraft am geraden Arm ist das der Abstand zum Angriffspunkt.',
    'Hebelgesetz':'Im Gleichgewicht gilt: Kraft mal Hebelarm ist auf beiden Seiten gleich groß.',
    'Gleichgewicht':'Die Kräfte gleichen sich so aus, dass der Hebel nicht zu drehen beginnt.',
    'Zugkraft':'Eine Kraft, die an etwas zieht. Hier zieht zum Beispiel der Faden am Antrieb.',
    'Haltekraft':'Die Kraft, mit der ihr den Spannarm in einer bestimmten Stellung festhaltet.',
    'Gewichtskraft':'Die Kraft, mit der die Erde einen Körper nach unten zieht. Ihre Einheit ist Newton (N).',
    'Federkraftmesser':'Ein Messgerät mit einer Feder. Es zeigt die Größe einer Kraft in Newton (N) an.',
    'Newton':'Die Einheit der Kraft. Das Einheitenzeichen ist N.',
    'Wickelradius':'Abstand von der Mitte der Achse bis zur Stelle, an der der Faden aufgewickelt ist. Fadenlagen können diesen Abstand verändern.',
    'Wickelscheibe':'Eine Scheibe, auf der der Faden aufgewickelt wird. Sie dreht hier fest mit der Antriebsachse mit.',
    'Antriebsachse':'Die Achse, die vom Faden gedreht wird und diese Drehung an die Antriebsräder weitergibt.',
    'Übersetzung':'Das Verhältnis, in dem ein Antrieb Kraft, Drehung und Weg überträgt. Ein anderer Wickelradius wirkt hier ähnlich wie ein anderer Fahrradgang.',
    'Radius':'Abstand von der Kreismitte zum Rand. Der Radius ist halb so groß wie der Durchmesser.',
    'Durchmesser':'Abstand von einem Kreisrand zum gegenüberliegenden Rand durch die Mitte: zweimal der Radius.',
    'Umfang':'Die Länge einmal um den Kreis herum. Beim Rad ist das der Weg einer Umdrehung ohne Rutschen.',
    'Schlupf':'Das Rad dreht sich, rutscht dabei aber am Boden. Deshalb passen Umdrehungen und Fahrstrecke nicht mehr genau zusammen.',
    'Haftreibung':'Reibung zwischen Kontaktstellen, die nicht gegeneinander rutschen. Sie ermöglicht beim Auto den Schub am Boden.',
    'Lagerreibung':'Reibung dort, wo sich die Achse in ihrer Halterung dreht. Sie behindert die Bewegung.',
    'Rollwiderstand':'Widerstand beim Rollen, etwa weil sich Rad oder Boden verformen.',
    'Trägheit':'Ein Körper behält seine Bewegung bei, solange keine entsprechende Kraft sie ändert. Auch eine Drehung lässt sich nicht beliebig schnell ändern.',
    'Arbeit':'Mechanische Arbeit beschreibt eine Energieübertragung durch eine Kraft entlang eines Weges. Bei konstanter Kraft in Wegrichtung gilt W = F · s.',
    'Energie':'Eine physikalische Größe, mit der wir beschreiben, wie viel Arbeit möglich ist. Die gespannte Feder speichert Energie.',
    'Höhenenergie':'Energie, die ein Körper durch seine erhöhte Lage besitzt. Beim Anheben nimmt sie zu.',
    'thermische Energie':'Energie, die mit der ungeordneten Bewegung der Teilchen zusammenhängt. Reibung kann dazu führen, dass sich Bauteile erwärmen.',
    'Joule':'Die Einheit für Arbeit und Energie. 1 Joule (J) ist 1 Newtonmeter (N·m).',
    'gleichförmig':'Mit gleichbleibender Geschwindigkeit, also ohne schneller oder langsamer zu werden.',
    'Hubhöhe':'Der senkrechte Höhenunterschied, um den der Wagen angehoben wird.',
    'Steigung':'Verhältnis von Höhenunterschied zu waagerechter Strecke. 20 % heißt: 20 cm höher auf 100 cm waagerechter Strecke.',
    'geometrische Strecke':'Die Strecke, die sich nur aus Fadenlänge, Wickelradius und Radradius ergibt. Sie ist keine Vorhersage der gesamten realen Fahrt.',
    'Messunsicherheit':'Keine Messung ist vollkommen genau. Zum Beispiel können Ablesen, Messgerät und Aufbau das Ergebnis beeinflussen.',
    'Prognose':'Eine begründete Vorhersage, die ihr später mit Beobachtungen und Messungen vergleicht.',
    'Goldene Regel':'Was man bei einer einfachen Maschine an Kraft spart, muss man an Weg zusetzen. Dabei entsteht keine zusätzliche Energie.'
  };
  for(const [base,variants] of Object.entries({'tangential':['tangentiale','tangentialen','tangentialer'],'Hebelarm':['Hebelarme','Hebelarmen','Hebelarms'],'Zugkraft':['Zugkräfte','Zugkräften'],'gleichförmig':['gleichförmige','gleichförmiger'],'Radius':['Radradius','Antriebsradradius'],'Haltekraft':['Haltekräfte']})) for(const word of variants) terms[word]=terms[base];
  const tooltip=document.createElement('div');tooltip.id='physics-tooltip';tooltip.className='term-tooltip';tooltip.role='tooltip';tooltip.hidden=true;document.body.append(tooltip);let active=null;
  function hide(){if(active)active.removeAttribute('aria-describedby');active=null;tooltip.hidden=true;}
  function show(target){hide();active=target;target.setAttribute('aria-describedby',tooltip.id);tooltip.textContent=target.dataset.definition;tooltip.hidden=false;const r=target.getBoundingClientRect(),box=tooltip.getBoundingClientRect();tooltip.style.left=Math.max(12,Math.min(r.left,innerWidth-box.width-12))+'px';tooltip.style.top=(r.bottom+box.height+12<innerHeight?r.bottom+8:Math.max(12,r.top-box.height-8))+'px';}
  const keys=Object.keys(terms).sort((a,b)=>b.length-a.length),pattern=new RegExp('(^|[^\\p{L}])('+keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?=$|[^\\p{L}])','giu');
  const definitions=new Map(keys.map(k=>[k.toLocaleLowerCase('de-DE'),terms[k]]));
  function annotate(root){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];let node;
    while(node=walker.nextNode())if(node.parentElement&&!node.parentElement.closest('.term, .term-tooltip, script, style, svg, a, button, input, textarea, select, label, output, nav, .chart, .storage-status, .site-footer'))nodes.push(node);
    for(const node of nodes){const text=node.textContent;pattern.lastIndex=0;const matches=[...text.matchAll(pattern)];if(!matches.length)continue;const fragment=document.createDocumentFragment();let offset=0;
      for(const match of matches){const index=match.index+match[1].length;fragment.append(document.createTextNode(text.slice(offset,index)));const term=document.createElement('span');term.className='term';term.tabIndex=0;term.setAttribute('role','button');term.setAttribute('aria-label',match[2]+' – Begriff erklären');term.textContent=match[2];term.dataset.definition=definitions.get(match[2].toLocaleLowerCase('de-DE'));term.onmouseenter=()=>show(term);term.onfocus=()=>show(term);term.onclick=event=>{event.preventDefault();event.stopPropagation();show(term);};term.onmouseleave=()=>{if(document.activeElement!==term)hide();};term.onblur=hide;term.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(term);}};fragment.append(term);offset=index+match[2].length;}
      fragment.append(document.createTextNode(text.slice(offset)));node.replaceWith(fragment);
    }
  }
  const main=document.querySelector('main');if(main)annotate(main);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});document.addEventListener('pointerdown',event=>{if(!event.target.closest('.term'))hide();});addEventListener('scroll',hide,{passive:true});addEventListener('resize',hide);
  const hero=document.querySelector('.lesson-hero')||document.getElementById('basecamp');if(hero){const help=document.createElement('p');help.className='glossary-help';help.textContent='Gepunktet unterstrichene Fachbegriffe werden erklärt: mit der Maus darüberfahren, antippen oder mit Tab auswählen.';hero.append(help);}
  window.TrapGlossary={terms,annotate};
})();
