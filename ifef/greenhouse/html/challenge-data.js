export const systems = {
  water: {
    name: "Bewässerung", device: "Pumpe", code: "P",
    inputs: { T: "Erde trocken", W: "Tank gefüllt", M: "Manueller Start" },
    descriptions: [
      ["Die Erde ist feucht.", "Die Erde ist trocken."],
      ["Der Wassertank ist leer.", "Der Wassertank ist gefüllt."],
      ["Es gibt kein manuelles Startsignal.", "Jemand startet die Bewässerung manuell."]
    ],
    brief: "Ein leerer Tank sperrt die Pumpe. Bei Wasser im Tank reichen trockene Erde oder ein manueller Start jeweils als Auslöser.",
    expected: ([dry, tank, manual]) => Boolean(tank && (dry || manual))
  },
  air: {
    name: "Belüftung", device: "Lüftung", code: "L",
    inputs: { H: "Zu heiß", F: "Zu feucht", S: "Sturm" },
    descriptions: [
      ["Im Gewächshaus ist es nicht zu heiß.", "Im Gewächshaus ist es zu heiß."],
      ["Die Luft ist nicht zu feucht.", "Die Luft ist zu feucht."],
      ["Es gibt keinen Sturm.", "Draußen stürmt es."]
    ],
    brief: "Bei Sturm muss die Lüftung geschlossen bleiben. Sonst soll sie bei Hitze oder hoher Luftfeuchtigkeit öffnen.",
    expected: ([hot, humid, storm]) => Boolean((hot || humid) && !storm)
  },
  light: {
    name: "Beleuchtung", device: "Lampe", code: "B",
    inputs: { D: "Zu dunkel", Z: "Zeit freigegeben", E: "Energiesparmodus" },
    descriptions: [
      ["Es ist hell genug.", "Es ist zu dunkel."],
      ["Die Beleuchtungszeit ist nicht freigegeben.", "Die Beleuchtungszeit ist freigegeben."],
      ["Der Energiesparmodus ist aus.", "Der Energiesparmodus ist an."]
    ],
    brief: "Die Lampe soll bei Dunkelheit in der freigegebenen Zeit leuchten. Der Energiesparmodus hat Vorrang und hält die Lampe aus.",
    expected: ([dark, allowed, saving]) => Boolean(dark && allowed && !saving)
  }
};

export const combinations = Array.from({ length: 8 }, (_, index) =>
  [4, 2, 1].map(bit => Number(Boolean(index & bit)))
);

export function tableOutput(outputs, [a, b, c]) {
  return outputs[4 * a + 2 * b + c];
}

export function exportCode(system, source) {
  const ascii = { "∧": "&", "∨": "|", "¬": "!" };
  return system.code + ":" + ruleTokens(source).map(token => ascii[token] ?? token).join("");
}

export function importCode(system, source) {
  const parts = /^([PLB]):(.{1,140})$/i.exec(source.trim());
  if (!parts) {
    throw new Error("Geben Sie den Kennbuchstaben, einen Doppelpunkt und den logischen Ausdruck ein.");
  }
  if (parts[1].toUpperCase() !== system.code) {
    throw new Error("Dieser Code gehört zu einer anderen Steuerung. Hier beginnen Codes mit " + system.code + ":.");
  }
  compileRule(parts[2], Object.keys(system.inputs));
  return ruleTokens(parts[2]).join("");
}

export const stages = [
  { day: 1, name: "Pflanzung", event: "Trockene Erde und ein frisch gefüllter Tank. Draußen ist es bewölkt.",
    water: [1, 1, 0], air: [0, 0, 0], light: [1, 1, 0] },
  { day: 12, name: "Anwachsen", event: "Nachts steht feuchte Luft im Haus. Der Tank ist leer, die Erde trocknet aus und es gibt keine Zeitfreigabe für die Lampe.",
    water: [1, 0, 0], air: [0, 1, 0], light: [1, 0, 0] },
  { day: 26, name: "Blüte", event: "Die Pflanzen blühen an einem heißen, sonnigen Tag.",
    water: [1, 1, 0], air: [1, 0, 0], light: [0, 1, 0] },
  { day: 39, name: "Fruchtansatz", event: "Ein Sturm zieht auf. Die Luft ist feucht und die Sonne verschwindet hinter Wolken.",
    water: [0, 1, 0], air: [0, 1, 1], light: [1, 1, 0] },
  { day: 54, name: "Reifung", event: "An einem trüben Tag wird manuell nachgegossen. Der Energiesparmodus ist aktiv.",
    water: [0, 1, 1], air: [0, 0, 0], light: [1, 1, 1] },
  { day: 70, name: "Ernte", event: "Bei trockenem Boden und warmem Wetter werden die reifen Tomaten geerntet.",
    water: [1, 1, 0], air: [1, 0, 0], light: [0, 1, 0] }
];

function ruleTokens(source) {
  const tokens = source.toUpperCase().match(/&&|\|\||[A-ZÄÖÜ]+|[^\s]/gu) ?? [];
  const symbols = { UND: "∧", ODER: "∨", NICHT: "¬", "&": "∧", "&&": "∧", "|": "∨", "||": "∨", "!": "¬" };
  return tokens.map(token => symbols[token] ?? token);
}

export function compileRule(source, variables) {
  const rule = ruleTokens(source);
  let cursor = 0;

  function take(token) {
    if (rule[cursor] !== token) return false;
    cursor += 1;
    return true;
  }

  function atom() {
    if (take("¬")) {
      const operand = atom();
      return values => !operand(values);
    }
    if (take("(")) {
      const nested = expression();
      if (!take(")")) throw new Error("Eine schließende Klammer fehlt.");
      return nested;
    }
    const variable = rule[cursor++];
    if (!variables.includes(variable)) {
      throw new Error(variable ? "Unerwartetes Zeichen oder Wort: " + variable : "Hier fehlt eine Eingangsvariable.");
    }
    return values => values[variable];
  }

  function conjunction() {
    let result = atom();
    while (take("∧")) {
      const left = result;
      const right = atom();
      result = values => left(values) && right(values);
    }
    return result;
  }

  function expression() {
    let result = conjunction();
    while (take("∨")) {
      const left = result;
      const right = conjunction();
      result = values => left(values) || right(values);
    }
    return result;
  }

  const evaluate = expression();
  if (cursor !== rule.length) throw new Error("Prüfen Sie die Klammern und Operatoren nach der ersten Teilregel.");
  return inputs => evaluate(Object.fromEntries(variables.map((variable, index) => [variable, Boolean(inputs[index])])));
}

export function seasonImpact(stage, outputs) {
  const [dry, tank, manual] = stage.water;
  const [hot, humid, storm] = stage.air;
  const [dark, allowed, saving] = stage.light;
  const effects = [];
  if (dry && !(outputs.water && tank)) effects.push(["Trockenstress", [11, 7, 8]]);
  if (outputs.water && !tank) effects.push(["Die Pumpe läuft bei leerem Tank", [0, 0, 0]]);
  if (outputs.water && tank && !dry && !manual) effects.push(["Zu viel Wasser im Beet", [4, 9, 12]]);
  if ((hot || humid) && !storm && !outputs.air) effects.push(["Hitzestau oder feuchte Luft", [7, 7, 11]]);
  if (storm && outputs.air) effects.push(["Sturm trifft die ungeschützten Pflanzen", [12, 5, 9]]);
  if (dark && allowed && !saving && !outputs.light) effects.push(["Lichtmangel", [10, 12, 4]]);
  if (outputs.light && (!allowed || saving || !dark)) effects.push(["Unnötiger Energieverbrauch", [0, 0, 0]]);
  return effects;
}
