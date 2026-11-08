'use strict';

// Decorate text nodes only: never parse learner input or rewrite form controls.
const TrainingTypography = (() => {
  const definitions = [
    ['Bit', ['Bit','Bits'], 'Ein Bit ist die kleinste binäre Informationseinheit. Es kann den Wert 0 oder 1 annehmen.'],
    ['Byte', ['Byte','Bytes'], 'Ein Byte besteht aus acht Bits. Acht Bits ermöglichen 256 verschiedene Bitmuster.'],
    ['Binärzahl', ['Binärzahl','Binärzahlen','Binärdarstellung'], 'Eine Zahl im Stellenwertsystem zur Basis 2. Sie verwendet nur die Ziffern 0 und 1.'],
    ['Dezimalzahl', ['Dezimalzahl','Dezimalzahlen'], 'Eine Zahl im Stellenwertsystem zur Basis 10 mit den Ziffern 0 bis 9. Hier bedeutet das auch bei ganzen Zahlen: im Zehnersystem eingeben.'],
    ['Stellenwert', ['Stellenwert','Stellenwerte','Stellenwerten'], 'Der Wert einer Ziffer hängt von ihrer Position ab. Bei Binärzahlen sind die Stellenwerte von rechts 1, 2, 4, 8 und so weiter.'],
    ['Zweierpotenz', ['Zweierpotenz','Zweierpotenzen'], 'Eine Zahl der Form 2 hoch n, zum Beispiel 1, 2, 4, 8 oder 16.'],
    ['Bitmuster', ['Bitmuster','Bitmustern'], 'Eine bestimmte Folge von Nullen und Einsen. Welche Bedeutung sie hat, bestimmt die verwendete Codierung.'],
    ['ASCII', ['ASCII'], 'Eine Zeichencodierung mit den Werten 0 bis 127. Zum Beispiel steht 65 für A und 66 für B.'],
    ['Algorithmus', ['Algorithmus','Algorithmen'], 'Eine eindeutige Folge von Handlungsschritten, die eine Aufgabe nach festgelegten Regeln löst.'],
    ['Ganzzahldivision', ['Ganzzahldivision'], 'Bei der Division zweier int-Werte entsteht wieder ein ganzzahliges Ergebnis. Zum Beispiel ergibt 13 / 2 den Wert 6; 13 % 2 liefert den Rest 1.'],
    ['PAP', ['PAP','Programmablaufplan','Programmablaufpläne','Programmablaufplans','Programmablaufplänen'], 'Ein Programmablaufplan stellt einen Algorithmus mit Symbolen und Richtungspfeilen dar.'],
    ['Raute', ['Raute'], 'Das Entscheidungssymbol im Programmablaufplan. Eine Bedingung entscheidet, ob der Ja- oder der Nein-Zweig ausgeführt wird.'],
    ['Schleife', ['Schleife','Schleifen'], 'Ein Programmabschnitt, der abhängig von einer Bedingung wiederholt wird. Eine while-Schleife prüft ihre Bedingung vor jedem Durchlauf.'],
    ['Schleifenrumpf', ['Schleifenrumpf','Schleifenrumpfs'], 'Die Anweisungen, die bei jedem Durchlauf einer Schleife ausgeführt werden. In Java stehen sie häufig zwischen geschweiften Klammern.'],
    ['Zählvariable', ['Zählvariable','Zählvariablen'], 'Eine Variable, die zum Beispiel die Anzahl ausgeführter oder noch übriger Schleifendurchläufe festhält.'],
    ['Variable', ['Variable','Variablen'], 'Ein benannter Platz für einen Wert oder eine Referenz. Ihr Datentyp bestimmt, welche Inhalte zulässig sind.'],
    ['Ausdruck', ['Ausdruck','Ausdrücke','Ausdrucks'], 'Ein Stück Java-Code, das einen Wert berechnet, zum Beispiel zahl * 2 oder anzahl > 0.'],
    ['Semikolon', ['Semikolon','Semikolons'], 'Das Zeichen ; schließt in Java zum Beispiel eine Deklaration oder Zuweisungsanweisung ab. Eine reine Bedingung benötigt kein Semikolon.'],
    ['Linksverschiebung', ['Linksverschiebung'], 'Verschiebt die Bits nach links. Ohne Verlust eines relevanten Bits entspricht eine Verschiebung um eine Stelle der Multiplikation mit 2.'],
    ['Bedingung', ['Bedingung','Bedingungen'], 'Ein Ausdruck, der true oder false ergibt und damit eine Entscheidung oder Wiederholung steuert.'],
    ['Datentyp', ['Datentyp','Datentypen','Datentyps'], 'Legt fest, welche Werte eine Variable enthalten darf und welche Operationen damit möglich sind.'],
    ['Primitiver Datentyp', ['primitiv','primitive','primitiven','Primitiv','Primitive'], 'Eine Variable eines primitiven Java-Datentyps enthält ihren Wert direkt. Dazu gehören boolean, byte, short, int, long, float, double und char.'],
    ['Referenztyp', ['Referenztyp','Referenztypen','Referenztyps'], 'Ein Datentyp, dessen Variablen Referenzen auf Objekte oder null enthalten. Beispiele sind String, Cell und Arraytypen.'],
    ['Referenz', ['Referenz','Referenzen','Referenzvariable','Referenzvariablen'], 'Ein Verweis auf ein Objekt. Wird eine Referenz kopiert, können zwei Variablen auf dasselbe Objekt zugreifen.'],
    ['Wertkopie', ['Wertkopie'], 'Der Wert einer primitiven Variable wird in eine andere Variable kopiert. Spätere Zuweisungen an eine der Variablen ändern die andere nicht.'],
    ['Referenzkopie', ['Referenzkopie'], 'Ein Verweis wird kopiert, ohne ein neues Objekt zu erzeugen. Beide Variablen verweisen danach auf dasselbe Objekt.'],
    ['Klasse', ['Klasse','Klassen'], 'Ein Bauplan, der Attribute, Konstruktoren und Methoden für seine Objekte beschreibt.'],
    ['Klassendiagramm', ['Klassendiagramm','Klassendiagramme','Klassendiagramms'], 'Eine Darstellung einer Klasse mit Bereichen für Klassenname, Attribute sowie Konstruktor und Methoden.'],
    ['Objekt', ['Objekt','Objekte','Objekten','Objekts'], 'Eine konkrete Instanz einer Klasse mit eigenen Attributwerten. Mehrere Referenzen können auf dasselbe Objekt zeigen.'],
    ['Instanz', ['Instanz','Instanzen','Cell-Instanz'], 'Ein konkretes Objekt, das nach dem Bauplan einer Klasse erzeugt wurde.'],
    ['Instanziierung', ['Instanziierung'], 'Das Erzeugen eines neuen Objekts einer Klasse, in den Beispielen mit new und einem Konstruktoraufruf.'],
    ['Attribut', ['Attribut','Attribute','Attributen','Attributs','Attributwert','Attributwerte'], 'Eine in einer Klasse deklarierte Variable, die bei den hier verwendeten Instanzattributen den Zustand eines Objekts speichert.'],
    ['Methode', ['Methode','Methoden','Instanzmethode'], 'Ein benannter Programmabschnitt einer Klasse. Er kann Parameter entgegennehmen, den Objektzustand verändern und einen Wert zurückgeben.'],
    ['Konstruktor', ['Konstruktor','Konstruktoren','Konstruktors','Konstruktoraufruf'], 'Initialisiert ein neues Objekt. Er heißt wie die Klasse und besitzt keinen Rückgabetyp, auch nicht void.'],
    ['Parameter', ['Parameter','Parametern','Parameterliste','Konstruktorparameter'], 'Eine Variable in der Signatur einer Methode oder eines Konstruktors, die beim Aufruf einen übergebenen Wert übernimmt.'],
    ['Rückgabetyp', ['Rückgabetyp','Rückgabetyps'], 'Gibt an, welchen Typ der von einer Methode zurückgegebene Wert hat. void bedeutet: Die Methode gibt keinen Wert zurück.'],
    ['Signatur', ['Signatur','Signaturen','Konstruktorsignatur'], 'Hier ist die im Diagramm verlangte Java-Schreibweise gemeint: Name und Parameterliste, bei Methoden zusätzlich der Rückgabetyp. Streng genommen gehört der Rückgabetyp nicht zur Java-Methodensignatur.'],
    ['Deklaration', ['Deklaration','Deklarationen','Variablendeklaration','Variablendeklarationen'], 'Legt Typ und Namen einer Variable fest. Sie kann mit einer ersten Wertzuweisung verbunden sein.'],
    ['Initialisierung', ['Initialisierung','initialisiert','initialisieren'], 'Die erstmalige Zuweisung eines Werts an eine Variable oder das Festlegen des Anfangszustands eines Objekts.'],
    ['Zuweisung', ['Zuweisung','Zuweisungen'], 'Speichert den Wert des rechten Ausdrucks in der linken Variable. In Java ist das einfache Zuweisungszeichen =.'],
    ['Literal', ['Literal','Literale','Literals','Dezimalliteral','Gleitkommaliteral','Gleitkommaliterale','Stringliteral','Binärliteral'], 'Ein direkt im Quelltext geschriebener Wert, zum Beispiel 3, true, 1.5 oder "Ada".'],
    ['Gleitkommazahl', ['Gleitkommazahl','Gleitkommazahlen','Gleitkommawert'], 'Eine Zahl mit Vorzeichen, Exponent und Mantisse. float und double können viele Dezimalwerte nur näherungsweise speichern.'],
    ['Compiler', ['Compiler','Compilerfehler'], 'Ein Compiler übersetzt Java-Quelltext und prüft dabei unter anderem Syntax und Typen. Bei einem Compilerfehler kann dieser Code nicht regulär ausgeführt werden.'],
    ['JVM', ['JVM'], 'Java Virtual Machine: die Laufzeitumgebung, die Java-Bytecode ausführt.'],
    ['UTF-16', ['UTF-16','UTF-16-Codeeinheit','UTF-16-Codeeinheiten'], 'Eine Unicode-Zeichencodierung mit 16-Bit-Codeeinheiten. Ein Java-char enthält eine solche Einheit; manche Zeichen benötigen zwei davon.'],
    ['Codierung', ['Codierung','Binärcodierung','Zeichencodierung'], 'Eine vereinbarte Zuordnung von Informationen zu Zeichen oder Bitmustern.'],
    ['Codewort', ['Codewort','Codewörter','Codewörtern'], 'Ein einzelnes Muster einer Codierung, das zum Beispiel eine Ziffer oder einen Ampelzustand bezeichnet.'],
    ['Informationsgehalt', ['Informationsgehalt','Informationsgehalts'], 'Bei N gleichwahrscheinlichen Möglichkeiten beträgt die Information einer Auswahl log₂(N) Bit. Eine feste Codebreite muss auf ganze Bits aufgerundet werden.'],
    ['Getter', ['Getter'], 'Eine Methode, die einen gespeicherten Attributwert zurückliefert, hier getAlive().'],
    ['Setter', ['Setter'], 'Eine Methode, die einen neuen Attributwert übernimmt und speichert, hier setAlive(boolean alive).'],
    ['boolean', ['boolean'], 'Ein primitiver Java-Typ mit den Werten true und false. Seine konkrete Speicherbelegung ist nicht allgemein festgelegt.'],
    ['int', ['int'], 'Ein primitiver Java-Typ für ganze Zahlen mit 32 Bit und dem Wertebereich −2³¹ bis 2³¹ − 1.'],
    ['float', ['float'], 'Ein primitiver Java-Typ für Gleitkommazahlen mit 32 Bit. Ein Literal wie 1.5f ist float.'],
    ['double', ['double'], 'Ein primitiver Java-Typ für Gleitkommazahlen mit 64 Bit. Ein Literal wie 1.5 ist ohne f vom Typ double.'],
    ['String', ['String'], 'Eine Java-Klasse für Zeichenketten. Eine String-Variable enthält eine Referenz auf ein String-Objekt.'],
    ['char', ['char'], 'Ein primitiver Java-Typ für eine 16-Bit-UTF-16-Codeeinheit, zum Beispiel das Literal \'B\'.'],
    ['void', ['void'], 'Kennzeichnet eine Methode ohne Rückgabewert. Ein Konstruktor hat dagegen überhaupt keinen Rückgabetyp.'],
    ['new', ['new'], 'Java-Schlüsselwort zum Erzeugen eines neuen Objekts oder Arrays. Bei einem Objekt folgt der Konstruktoraufruf.'],
    ['private', ['private'], 'Ein so markiertes Attribut oder eine Methode ist nur innerhalb der umschließenden obersten Klasse zugänglich. Hier schützt private den direkten Zugriff auf alive von außen.'],
    ['public', ['public'], 'Eine Sichtbarkeitsangabe, die den Zugriff grundsätzlich auch von anderen Klassen aus erlaubt.'],
    ['while', ['while'], 'Beginnt in Java eine Schleife, deren Bedingung vor jedem Durchlauf geprüft wird.'],
    ['this', ['this'], 'Bezeichnet das aktuelle Objekt. Mit this.alive wird ausdrücklich dessen Attribut alive angesprochen.'],
    ['NullPointerException', ['NullPointerException'], 'Ein Laufzeitfehler, der etwa entsteht, wenn über eine Referenz mit dem Wert null eine Instanzmethode aufgerufen wird.'],
    ['null', ['null'], 'Der besondere Referenzwert, der auf kein Objekt verweist. Ein Methodenaufruf über null löst eine NullPointerException aus.'],
    ['localStorage', ['localStorage'], 'Ein Speicher im Browser für Daten, die über das Schließen der Seite hinaus erhalten bleiben können. Dieses Training nutzt ihn nur nach Ihrer zusätzlichen Auswahl.']
  ];
  const glossary = new Map();
  definitions.forEach(([key, words, description]) => words.forEach(word => glossary.set(word, {key, description})));
  const quote = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const glossaryPattern = [...glossary.keys()].sort((a,b) => b.length-a.length).map(quote).join('|');
  const identifiers = 'zahl|anzahl|alive|size|field|cell|name|speedFloat|speed|distance|count|values|ready|empty|binaer|rest|doppelt|copy|symbol|x|y|a|b|c';
  // Include the deliberately incorrect lowercase string spelling used in a quiz option.
  const types = 'boolean|byte|short|int|long|float|double|char|string|String|Cell|Field|void';
  const literal = '(?:"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|-?\\d+(?:\\.\\d+)?[fFdDlL]?|true|false|null)';
  const call = '(?:(?:[A-Za-z_$][\\w$]*\\.)*[A-Za-z_$][\\w$]*\\([^()]*\\))';
  const atom = `(?:new\\s+${call}|${call}|${literal}|(?:${identifiers}))`;
  const expression = `${atom}(?:\\s*(?:<<|>>|>=|<=|==|!=|[+*/%<>-])\\s*${atom})*`;
  const assignment = `(?:(?:${types})(?:\\[\\])?\\s+)?(?:${identifiers})\\s*(?:[+*-]?=)\\s*${expression};?`;
  const signature = `(?:(?:${types})\\s+)?${call};?`;
  const codePattern = `${assignment}|${signature}|(?:${identifiers})\\s*(?:>=|<=|==|!=|>|<)\\s*${atom}|(?:${identifiers})(?:\\[\\])?|(?:${types})(?:\\[\\])?|new|private|public|protected|static|class|this|while|return|true|false|null`;
  const boundary = '(?<![\\p{L}\\p{N}_$])';
  const endBoundary = '(?![\\p{L}\\p{N}_$])';
  const textPattern = new RegExp(`${boundary}(?:${codePattern}|${glossaryPattern})${endBoundary}`, 'gu');
  const codeTerms = new RegExp(`${boundary}(?:${glossaryPattern})${endBoundary}`, 'gu');
  const excluded = 'script,style,textarea,input,select,button,a,summary,pre,svg,math,.term,.glossary-tooltip,[contenteditable]';
  let observer, activeTerm, hideTimer;
  const tooltip = document.createElement('div');
  tooltip.id = 'glossary-tooltip'; tooltip.className = 'glossary-tooltip';
  tooltip.setAttribute('role','tooltip'); tooltip.hidden = true;
  document.body.append(tooltip);

  function term(word, entry) {
    const span = document.createElement('span');
    span.className = 'term'; span.tabIndex = 0;
    span.setAttribute('role','button'); span.setAttribute('aria-label', `${word}: Begriff erklären`);
    span.dataset.definition = entry.description;
    span.textContent = word;
    return span;
  }
  function decorate(root = document.body) {
    observer?.disconnect();
    try {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.parentElement && !node.parentElement.closest(excluded) && node.textContent.trim()) nodes.push(node);
      }
      for (const node of nodes) {
        const inCode = Boolean(node.parentElement.closest('code'));
        const pattern = inCode ? codeTerms : textPattern;
        pattern.lastIndex = 0;
        const matches = [...node.textContent.matchAll(pattern)];
        if (!matches.length) continue;
        const fragment = document.createDocumentFragment();
        let position = 0;
        for (const match of matches) {
          fragment.append(document.createTextNode(node.textContent.slice(position,match.index)));
          const word = match[0], entry = glossary.get(word);
          const isCode = !inCode && new RegExp(`^(?:${codePattern})$`,'u').test(word);
          let element = entry ? term(word,entry) : document.createTextNode(word);
          if (isCode) {
            const code = document.createElement('code'); code.append(element); element = code;
          }
          fragment.append(element); position = match.index + word.length;
        }
        fragment.append(document.createTextNode(node.textContent.slice(position)));
        node.replaceWith(fragment);
      }
      if (activeTerm && !activeTerm.isConnected) hide();
    } finally {
      observer?.observe(document.body,{subtree:true,childList:true,characterData:true});
    }
  }
  function hide() {
    clearTimeout(hideTimer);
    activeTerm?.removeAttribute('aria-describedby'); activeTerm = null; tooltip.hidden = true;
  }
  function show(target) {
    clearTimeout(hideTimer);
    if (activeTerm !== target) hide();
    activeTerm = target;
    (target.closest('dialog') || document.body).append(tooltip);
    tooltip.textContent = target.dataset.definition;
    target.setAttribute('aria-describedby',tooltip.id);
    tooltip.hidden = false;
    const rect = target.getBoundingClientRect();
    const margin = 12;
    tooltip.style.left = `${Math.max(margin,Math.min(rect.left,innerWidth-tooltip.offsetWidth-margin))}px`;
    let top = rect.bottom + 8;
    if (top + tooltip.offsetHeight > innerHeight-margin) top = rect.top-tooltip.offsetHeight-8;
    tooltip.style.top = `${Math.max(margin,Math.min(top,innerHeight-tooltip.offsetHeight-margin))}px`;
  }
  document.addEventListener('pointerover',event => {
    const target = event.target.closest('.term'); if (target) show(target);
  });
  document.addEventListener('pointerout',event => {
    if (event.target.closest('.term') && !event.relatedTarget?.closest?.('.term,.glossary-tooltip')) {
      hideTimer = setTimeout(() => { if (document.activeElement !== activeTerm) hide(); },150);
    }
  });
  tooltip.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  tooltip.addEventListener('pointerleave',hide);
  document.addEventListener('focusin',event => {
    const target = event.target.closest('.term');
    if (target) {
      show(target);
      requestAnimationFrame(() => { if (document.activeElement === target && target.isConnected) show(target); });
    }
  });
  document.addEventListener('focusout',event => { if (event.target.closest('.term')) hide(); });
  document.addEventListener('click',event => {
    const target = event.target.closest('.term');
    if (target) { event.preventDefault(); event.stopPropagation(); show(target); }
    else if (!event.target.closest('.glossary-tooltip')) hide();
  });
  document.addEventListener('keydown',event => {
    if (event.key === 'Escape') { hide(); return; }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.term')) {
      event.preventDefault(); event.stopPropagation(); show(event.target);
    }
  });
  addEventListener('resize',hide);
  document.addEventListener('scroll',hide,true);
  observer = new MutationObserver(() => decorate());
  decorate();
  return {decorate};
})();
