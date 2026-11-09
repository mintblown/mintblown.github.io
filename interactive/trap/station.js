(function () {
  'use strict';
  const {state,save,format:fmt,escape:esc}=Trap, M=TrapModel;
  const station=document.body.dataset.station;
  const $=id=>document.getElementById(id);
  const settings=state.controls[station]||(state.controls[station]={});
  const explored=$('explored');
  if(explored){
    const reminder=document.createElement('p');
    reminder.id='results-reminder';reminder.className='notice';
    reminder.setAttribute('role','status');reminder.setAttribute('aria-live','polite');
    reminder.textContent='Haltet eure Ergebnisse in Goodnotes fest: als Screenshots oder handschriftlich, gegebenenfalls in eurer Projektmappe. Sichert auch eure Beobachtungen und die Schlussfolgerungen für euer Mausefallenauto.';
    explored.closest('.lesson-footer').after(reminder);
    explored.setAttribute('aria-controls',reminder.id);
    explored.checked=state.explored[station]===true;
    reminder.hidden=!explored.checked;
    const message=document.createElement('dialog');
    message.id='results-message';message.className='results-dialog';
    message.setAttribute('aria-labelledby','results-message-title');
    message.setAttribute('aria-describedby','results-message-text');
    message.innerHTML='<h2 id="results-message-title">Ergebnisse festhalten</h2><p id="results-message-text"></p><button type="button" class="button">Verstanden</button>';
    message.querySelector('p').textContent=reminder.textContent;
    message.querySelector('button').onclick=()=>message.close();
    document.body.append(message);
    explored.onchange=()=>{state.explored[station]=explored.checked;reminder.hidden=!explored.checked;save();if(explored.checked)message.showModal();};
  }
  const svg=(label,content,width=640,height=340)=>`<svg class="diagram" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">${content}</svg>`;
  const text=(x,y,content,cls='',anchor='start')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(content)}</text>`;
  const arrow=(x1,y1,x2,y2,color='#c9513f',size=9)=>{
    const a=Math.atan2(y2-y1,x2-x1),b1x=x2-size*Math.cos(a)+size*.5*Math.sin(a),b1y=y2-size*Math.sin(a)-size*.5*Math.cos(a),b2x=x2-size*Math.cos(a)-size*.5*Math.sin(a),b2y=y2-size*Math.sin(a)+size*.5*Math.cos(a);
    return `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="3"/><path d="M${x2} ${y2}L${b1x} ${b1y}L${b2x} ${b2y}Z" fill="${color}"/>`;
  };
  const wheel=(cx,cy,r,angle=0,color='#3d7160')=>{
    let spokes='';for(let i=0;i<6;i++){const a=angle+i*Math.PI/3;spokes+=`<line x1="${cx}" y1="${cy}" x2="${cx+Math.cos(a)*r*.85}" y2="${cy+Math.sin(a)*r*.85}" stroke="${color}" stroke-width="2"/>`;}
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fffef7" stroke="${color}" stroke-width="7"/>${spokes}<circle cx="${cx}" cy="${cy}" r="5" fill="${color}"/><circle cx="${cx+r*Math.sin(angle)}" cy="${cy+r*Math.cos(angle)}" r="5" fill="#dd923e"/>`;
  };
  function bind(callback){
    const controls=[...document.querySelectorAll('.controls input, .controls select')];
    controls.forEach(input=>{
      if(typeof settings[input.id]==='string')input.value=settings[input.id];
      input.addEventListener('input',()=>{
        settings[input.id]=input.value;save();updateOutputs();callback(input.id);
      });
    });
    function updateOutputs(){controls.forEach(input=>{const output=$(input.id+'-value');if(output)output.value=fmt(Number(input.value),2);});}
    updateOutputs();callback(null);
  }
  if(station==='federkraft')bind(()=>{
    const degrees=Number($('arm-angle').value),a=degrees*Math.PI/180,cx=300,cy=230,r=125;
    const x=cx+r*Math.cos(a),y=cy-r*Math.sin(a),tx=-Math.sin(a),ty=-Math.cos(a),ix=-Math.cos(a),iy=Math.sin(a);
    const endX=x+tx*148,endY=y+ty*148,rotation=Math.atan2(ty,tx)*180/Math.PI;
    const square=`${x+ix*17},${y+iy*17} ${x+ix*17+tx*17},${y+iy*17+ty*17} ${x+tx*17},${y+ty*17}`;
    let content=`<rect x="215" y="241" width="180" height="30" rx="4" fill="#d7b47b"/><path d="M${cx} ${cy}H470" stroke="#929e8c" stroke-dasharray="6 5" stroke-width="2"/><line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#395b4c" stroke-width="10" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="9" fill="#dba447"/><circle cx="${x}" cy="${y}" r="6" fill="#c9513f"/><polyline points="${square}" fill="none" stroke="#c9513f" stroke-width="2"/><g transform="translate(${x},${y}) rotate(${rotation})"><line x1="0" y1="0" x2="43" y2="0" stroke="#c9513f" stroke-width="3"/><rect x="43" y="-12" width="69" height="24" rx="5" fill="#e3edf5" stroke="#567a88" stroke-width="2"/><path d="M49 0l5 -6l5 12l5 -12l5 12l5 -12l5 12l5 -12l5 12l5 -6" fill="none" stroke="#567a88"/></g>`;
    content+=arrow(x+tx*114,y+ty*114,endX,endY);
    if(degrees>0) content+=`<path d="M340 230 A40 40 0 ${degrees>180?1:0} 0 ${cx+40*Math.cos(a)} ${cy-40*Math.sin(a)}" stroke="#be8c2f" fill="none" stroke-width="2"/>`;
    content+=text(28,30,'Kraftmesser immer mitdrehen: 90° zum Arm','big-text')+text(465,252,'0°-Referenz','small-text')+text(285,299,`α = ${fmt(degrees,0)}° · fester Messpunkt`,'','middle')+text(320,322,'Rot: tangentiale Haltekraft · Gerät schematisch','small-text','middle');
    $('spring-view').innerHTML=svg(`Bei ${degrees} Grad ist der Kraftmesser senkrecht zum Spannarm und tangential zu seiner Kreisbahn ausgerichtet.`,content,640,345);
  });
  if(station==='hebel'){
    function plateMeasurement(){
      const count=M.number($('plate-count').value),force=M.number($('plate-total-force').value);
      const validCount=Number.isInteger(count)&&count>0&&count<=100;
      const validForce=force!==null&&force>0&&force<=200;
      $('plate-count').setAttribute('aria-invalid',String($('plate-count').value.trim()!==''&&!validCount));
      $('plate-total-force').setAttribute('aria-invalid',String($('plate-total-force').value.trim()!==''&&!validForce));
      $('plate-force-result').textContent=validCount&&validForce
        ? `Gewichtskraft eines Masseplättchens: ${fmt(force,3)} N ÷ ${count} = ${fmt(force/count,3)} N. Multipliziert diesen Wert in jeder Runde mit der Anzahl der Plättchen auf der jeweiligen Seite.`
        : 'Bestimmt zuerst die Gewichtskraft: Tragt die Anzahl gleicher Plättchen (ganze Zahl von 1 bis 100) und die gemessene Gesamtgewichtskraft (größer als 0, bis 200 N) ein.';
    }
    $('lever-view').innerHTML=svg('Waagerechter Hebelbalken: senkrechte Kräfte links und rechts; l1 und l2 sind die Abstände vom Drehpunkt.',`<path d="M300 118L278 158H322Z" fill="#52785c"/><rect x="70" y="100" width="460" height="16" rx="5" fill="#d9b678"/><circle cx="300" cy="108" r="6" fill="#345847"/><path d="M155 117V175M430 117V175" stroke="#4a675a" stroke-width="2"/><rect x="135" y="175" width="40" height="30" rx="4" fill="#8bb7aa"/><rect x="410" y="175" width="40" height="30" rx="4" fill="#8bb7aa"/>${arrow(155,155,155,226)}${arrow(430,155,430,226)}<path d="M155 80H300M300 80H430M155 72V88M300 72V88M430 72V88" stroke="#477360" stroke-width="2"/>${text(222,65,'l₁')}${text(362,65,'l₂')}${text(173,229,'F₁')}${text(448,229,'F₂')}${text(300,280,'Abstände am waagerechten Balken messen','','middle')}`,640,310);
    bind(()=>{
      plateMeasurement();
      const length=Number($('lever-length').value),degrees=Number($('lever-angle').value),a=degrees*Math.PI/180,r=length*4.7,cx=245,cy=235,x=cx+r*Math.cos(a),y=cy-r*Math.sin(a);
      const startX=cx+r;
      const arc=degrees===0?'':`<path d="M${startX} ${cy}A${r} ${r} 0 0 0 ${x} ${y}" fill="none" stroke="#c8a152" stroke-dasharray="5 5" stroke-width="3"/>`;
      const tx=-Math.sin(a),ty=-Math.cos(a);
      $('car-lever-view').innerHTML=svg('Mausefallenarm: längerer Arm bedeutet längeren Bogenweg und kleinere tangentiale Vergleichskraft.',`<rect x="205" y="242" width="205" height="35" rx="5" fill="#dcba80"/><path d="M${cx} ${cy}H${startX}" stroke="#94a895" stroke-dasharray="5 5"/>${arc}<path d="M${cx} ${cy}L${x} ${y}" stroke="#42694e" stroke-width="9" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="8" fill="#db9f3e"/>${arrow(x,y,x+tx*55,y+ty*55)}${text(455,75,`${fmt(length)} cm Armlänge`,'big-text')}${text(455,108,`${fmt(degrees)}° Drehwinkel`)}${text(455,160,'Gestrichelt: Weg des Armendes','small-text')}${text(455,188,'Rot: Richtung der tangentialen Kraft','small-text')}`,740,310);
      $('lever-result').textContent=`Vergleich mit 15 cm Arm: Kraft am Ende ${fmt(15/length)}-fach · Bogenweg ${fmt(length/15)}-fach. Der Bogenweg beträgt hier ${fmt(length*a)} cm. Das sind Modellvergleiche, keine gemessenen Kräfte oder garantierten Fadenlängen.`;
    });
  }
  if(station==='goldene-regel'){
    const ramps=[{x:35,degrees:4,label:'h₁'},{x:350,degrees:10,label:'h₂'}].map(({x,degrees,label})=>{
      const a=degrees*Math.PI/180,length=240,run=length*Math.cos(a),height=length*Math.sin(a),y=240;
      return `<path d="M${x} ${y}L${x+run} ${y-height}L${x+run} ${y}Z" fill="#dac79c" stroke="#aa9360" stroke-width="2"/><g transform="translate(${x+run/2},${y-height/2}) rotate(${-degrees})"><rect x="-27" y="-25" width="54" height="20" rx="3" fill="#72a391"/><circle cx="-17" cy="-3" r="6" fill="#365c4c"/><circle cx="17" cy="-3" r="6" fill="#365c4c"/></g>${arrow(x+run/2+25,y-height/2-25,x+run/2+85,y-height/2-25-60*Math.tan(a))}<path d="M${x+run+15} ${y-height}V${y}" stroke="#4b6c59" stroke-width="2"/>${text(x+run+20,y-height/2,label)}${text(x+80,170,'gleiche Länge s')}`;
    }).join('');
    $('ramp-view').innerHTML=svg('Zwei beispielhafte Höhen bei derselben Rampenlänge. Die Zugkraft wird parallel zur jeweiligen Rampe gemessen.',ramps+text(320,287,'Gleicher Wagen · gleiche Rampenlänge · verschiedene Höhen','','middle'),660,320);
  }
  if(station==='uebersetzung'){
    const mode=$('winding-mode');
    bind(changed=>{
      if(changed==='winding-mode'){
        $('winding-radius').value=mode.value==='axle'?'3':'15';
        settings['winding-radius']=$('winding-radius').value;$('winding-radius-value').value=fmt(Number($('winding-radius').value));save();
      }
      const radius=Number($('winding-radius').value),length=Number($('string-length').value),force=Number($('string-force').value);
      const result=M.transmission(length/100,radius/1000,.06,force);
      const visualRadius=15+radius*2.2;
      $('transmission-view').innerHTML=svg('Ein Antriebsrad und seine fest gekoppelte Wickelstelle. Der Faden zieht tangential an der Wickelstelle; ihr Radius ist einstellbar.',`<path d="M95 205H545" stroke="#476657" stroke-width="14" stroke-linecap="round"/>${wheel(445,205,86)}<ellipse cx="240" cy="205" rx="${visualRadius}" ry="${visualRadius}" fill="#e9c98c" stroke="#996d31" stroke-width="4"/><circle cx="240" cy="205" r="7" fill="#446650"/><path d="M240 ${205-visualRadius}H70" class="string"/>${arrow(150,205-visualRadius,65,205-visualRadius)}<path d="M240 205H${240+visualRadius}" stroke="#936b27" stroke-width="2"/>${text(255,226,`r = ${fmt(radius)} mm`,'small-text')}${text(65,48,`Faden: ${fmt(length/100)} m · angenommene Kraft: ${fmt(force)} N`)}${text(445,319,'Antriebsrad: r = 6 cm','','middle')}${text(240,319,mode.value==='axle'?'Wickelstelle: Achse':'Wickelstelle: Scheibe','','middle')}`,640,345);
      $('transmission-result').textContent=`Eine Wicklung: ${fmt(2*Math.PI*radius,1)} mm Faden · ${fmt(result.turns)} Achsumdrehungen · ideale Antriebskraft am Boden: ${fmt(result.groundForce,3)} N. Die geometrische Strecke für diese Fadenlänge wäre ${fmt(result.distance)} m, ohne Verluste und bei vollständiger Abwicklung.`;
    });
  }
  if(station==='raeder')bind(()=>{
    const radius=Number($('wheel-radius').value)/100,turns=Number($('wheel-turns').value),amount=Number($('roll-progress').value)/100;
    const distance=2*Math.PI*radius*turns, travelled=distance*amount;
    // One common spatial scale per frame keeps both radius and travel proportional.
    const scale=Math.min(530/(distance+2*radius),85/radius),r=radius*scale,cx=50+r+travelled*scale,cy=222-r;
    $('wheel-view').innerHTML=svg('Rad rollt ohne Schlupf: die farbige Umfangsmarkierung dreht sich mit. Der Maßstab passt zur gewählten Strecke.',`<path d="M35 226H610" stroke="#748a73" stroke-width="3"/>${arrow(50+r,265,50+r+distance*scale,265,'#c29535')}<line x1="${50+r}" y1="205" x2="${50+r}" y2="245" stroke="#95a88e" stroke-dasharray="4 4"/>${wheel(cx,cy,r,turns*amount*2*Math.PI)}${text(40,32,`Radius ${fmt(radius*100)} cm · Ziel ${fmt(turns)} Umdrehungen`)}${text(320,300,`Gesamter gezeichneter Abrollweg: ${fmt(distance)} m`,'','middle')}`,640,325);
    $('wheel-result').textContent=`Radumfang U = ${fmt(2*Math.PI*radius)} m · Strecke bei ${fmt(turns)} Umdrehungen: ${fmt(distance)} m. Aktueller Stand: ${fmt(turns*amount)} Umdrehungen und ${fmt(travelled)} m. Ohne Durchrutschen.`;
  });
  if(station==='reibung')bind(()=>{
    const bearing=Number($('bearing').value),rolling=Number($('rolling').value),grip=Number($('grip').value),r=M.friction(bearing,rolling,grip);
    const groundColor=r.slipping?'#c96d46':'#427e60';
    const bearingColor=bearing>50?'#ca6246':'#748d60';
    $('friction-view').innerHTML=svg('Qualitatives Auto: Lager, Rollkontakt und Haftung sind getrennt hervorgehoben. Es wird keine reale Fahrstrecke berechnet.',`<path d="M40 259H602" stroke="${groundColor}" stroke-width="${4+rolling/15}"/><path d="M142 184L442 165L501 200L196 222Z" fill="#e6c086" stroke="#577055" stroke-width="3"/><path d="M215 185L300 95L395 159" fill="none" stroke="#496750" stroke-width="6"/>${wheel(194,221,32,0,r.slipping?'#ba6644':'#3d7160')}${wheel(457,221,32)}<circle cx="194" cy="221" r="${8+bearing/8}" fill="none" stroke="${bearingColor}" stroke-width="4"/><circle cx="457" cy="221" r="${8+bearing/8}" fill="none" stroke="${bearingColor}" stroke-width="4"/>${r.slipping?'<path d="M115 245l-14 5l14 5M126 235l-14 5" stroke="#c55e3e" stroke-width="3" fill="none"/>':''}${text(38,35,`Lagerreibung: ${bearing<34?'gering':bearing<67?'mittel':'hoch'}`)}${text(38,62,`Rollwiderstand: ${rolling<34?'gering':rolling<67?'mittel':'hoch'}`)}${text(320,306,r.slipping?'Antriebsrad: Schlupf möglich':'Antriebsrad: Haftung im Modell ausreichend','','middle')}`,640,330);
    $('friction-result').textContent=(r.slipping?'Zu wenig Haftung: Das Antriebsrad kann durchdrehen. Die Rotation wird nicht vollständig in Weg umgesetzt. ':'Ausreichend Haftung: Der Bodenkontakt kann die Antriebskraft im Modell übertragen. ')+(r.resistance?'Hohe Lager- und Rollverluste: Das Anfahren kann schwerfallen; Bewegung wird deutlich behindert. ':r.losses>30?'Spürbare Lager- oder Rollverluste: Ein Teil der Federenergie wird in thermische Energie umgewandelt. ':'Geringe Lager- und Rollverluste: Mehr der gespeicherten Energie kann für Bewegung genutzt werden. ');
  });
  if(station==='rechnen')bind(()=>{
    const ids=['calc-length','calc-axle','calc-wheel'],limits=[1000,100,100],values=ids.map((id,i)=>{
      const input=$(id),n=M.number(input.value),valid=n!==null&&n>0&&n<=limits[i];
      input.setAttribute('aria-invalid',String(input.value.trim()!==''&&!valid));return valid?n:null;
    });
    if(values.some(n=>n===null)){
      $('calculation-result').textContent='Tragt drei gültige Maße größer als 0 ein: Fadenlänge bis 1000 cm, Wickelradius bis 100 mm, Radradius bis 100 cm. Dezimalkomma oder Punkt sind möglich.';$('calculation-view').innerHTML='';return;
    }
    const [length,axle,wheelRadius]=[values[0]/100,values[1]/1000,values[2]/100],r=M.drive(length,axle,wheelRadius);
    $('calculation-result').innerHTML=`<strong>1 · Wickelumfang:</strong> 2 · π · ${fmt(axle,4)} m = ${fmt(2*Math.PI*axle,4)} m<br><strong>2 · Umdrehungen:</strong> ${fmt(length)} m / ${fmt(2*Math.PI*axle,4)} m ≈ ${fmt(r.turns)}<br><strong>3 · Radumfang:</strong> 2 · π · ${fmt(wheelRadius,4)} m ≈ ${fmt(r.circumference,4)} m<br><strong>4 · Geometrische Strecke:</strong> ${fmt(r.turns)} · ${fmt(r.circumference,4)} m ≈ <strong>${fmt(r.distance)} m</strong><br><small>Die Berechnung verwendet ungerundete Zwischenwerte. Gemeint ist die ideale Strecke während vollständiger Fadenabwicklung.</small>`;
    $('calculation-view').innerHTML=svg('Rechenweg: Fadenlänge geteilt durch Wickelumfang ergibt Umdrehungen. Umdrehungen mal Radumfang ergibt geometrische Strecke.',`<rect x="20" y="32" width="180" height="113" rx="13" fill="#f2e2bb"/><rect x="230" y="32" width="180" height="113" rx="13" fill="#dcebd8"/><rect x="440" y="32" width="180" height="113" rx="13" fill="#dbe8ee"/>${text(110,64,'Fadenlänge /','', 'middle')}${text(110,89,'Wickelumfang','','middle')}${text(110,119,`${fmt(r.turns)} Umdrehungen`,'small-text','middle')}${arrow(204,89,226,89,'#4c7a5d',6)}${text(320,65,'Umdrehungen ×','','middle')}${text(320,90,'Radumfang','','middle')}${text(320,119,`${fmt(r.circumference,3)} m je Umdr.`,'small-text','middle')}${arrow(414,89,436,89,'#4c7a5d',6)}${text(530,68,'Geometrische','','middle')}${text(530,92,'Strecke','','middle')}${text(530,123,`${fmt(r.distance)} m`,'big-text','middle')}`,640,180)+'<p class="screenshot">Sichert euren Rechenweg mit den eigenen Maßen und der Prognose per Screenshot für eure Gruppenablage.</p>';
  });
})();
