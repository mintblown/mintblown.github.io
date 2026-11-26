import {
  systems, stages, combinations, compileRule, exportCode, importCode, tableOutput, seasonImpact
} from "./challenge-data.js";

const $ = selector => document.querySelector(selector);
const keys = Object.keys(systems);
const greenhouse = $("#greenhouse");
const experiment = $("#experiment");
const season = $("#season");
const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const states = Object.fromEntries(keys.map(key => [key, {
  source: "", choice: 0, answers: Array(8).fill(""), outputs: null, done: false, imported: false
}]));
let active = "water";
let stageIndex = -1;
let timer;
let scores = [0, 0, 0];
let seasonOutputs = {};
let finishPending = false;

function showHouse(outputs, caption, growth = 0, fruitSize = 1, tank = true) {
  keys.forEach(key => greenhouse.classList.toggle(key + "-on", Boolean(outputs[key]) && (key !== "water" || tank)));
  greenhouse.classList.toggle("with-fruit", growth >= 3);
  greenhouse.style.setProperty("--growth", [0.66, 0.8, 1, 1.12, 1.22, 1.25][growth]);
  greenhouse.style.setProperty("--fruit-size", fruitSize);
  greenhouse.style.setProperty("--ripeness", growth === 3 ? "75deg" : growth === 4 ? "29deg" : "0deg");
  $("#devices").innerHTML = keys.map(key =>
    '<li class="' + (outputs[key] ? "on" : "") + '">' + systems[key].device +
    " " + (outputs[key] ? "an" : "aus") + (key === "water" && outputs.water && !tank ? " · kein Wasser" : "") + "</li>"
  ).join("");
  $("#scene-caption").textContent = caption;
}

function updateProgress() {
  const completed = keys.filter(key => states[key].done);
  tabs.at(-1).disabled = completed.length !== keys.length;
  $("#progress").textContent = completed.length === keys.length
    ? "Alle Steuerungen übernommen. Die Simulation ist bereit."
    : completed.length + " von 3 Steuerungen übernommen.";
}

function tabKey(tab) {
  return tab.id.slice(4);
}

function openTab(key) {
  clearTimeout(timer);
  active = key;
  tabs.forEach(tab => {
    const selected = tabKey(tab) === key;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  season.hidden = key !== "season";
  experiment.hidden = key === "season";
  if (key === "season") {
    if (stageIndex < 0) showHouse({}, "Die Setzlinge stehen bereit.");
    else showSeasonHouse();
    if (!$("#next-stage").disabled) scheduleAdvance();
  } else {
    experiment.setAttribute("aria-labelledby", "tab-" + key);
    showExperiment(key);
  }
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => openTab(tabKey(tab)));
  tab.addEventListener("keydown", event => {
    const available = tabs.filter(item => !item.disabled);
    const current = available.indexOf(tab);
    const target = {
      ArrowLeft: (current - 1 + available.length) % available.length,
      ArrowRight: (current + 1) % available.length,
      Home: 0,
      End: available.length - 1
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    available[target].focus();
    openTab(tabKey(available[target]));
  });
});

function showExperiment(key) {
  const system = systems[key];
  const state = states[key];
  const inputs = Object.entries(system.inputs);
  const stageLabel = stage => "Tag " + stage.day + " · " + stage.name;
  const action = value => value ? "an" : "aus";

  experiment.innerHTML = `
    <h2>${system.name}</h2>
    <p>${system.brief}</p>
    <div class="scenario">
      <label for="case">Situation aus der Saison</label>
      <select id="case">${stages.map((stage, index) => '<option value="' + index + '">' + stageLabel(stage) + '</option>').join("")}</select>
      <p id="case-description"></p>
      <div id="sensors" class="choices"></div>
      <p id="case-result" class="readout" role="status"></p>
    </div>
    <table class="rule-table" aria-describedby="table-help">
      <caption>Wahrheitstabelle für ${system.device}</caption>
      <thead><tr><th scope="col"><span class="visually-hidden">Situation</span></th>
        ${inputs.map(([letter, label]) => '<th scope="col"><abbr title="' + label + '">' + letter + '</abbr></th>').join("")}
        <th scope="col">Ausgang</th><th scope="col">Regelprüfung</th></tr></thead>
      <tbody id="rule-rows">${combinations.map((values, index) => {
        const combination = values.join("");
        const tooltip = "row-situation-" + index;
        const description = values.map((value, input) => system.descriptions[input][value]).join(" ");
        return `<tr><td class="situation-cell">
          <button type="button" class="secondary situation-help" aria-label="Situation ${combination}" aria-describedby="${tooltip}">?</button>
          <span class="situation-tooltip" id="${tooltip}" role="tooltip">${description}</span>
        </td>${values.map(value => "<td>" + value + "</td>").join("")}
        <td><input class="output-entry" type="text" inputmode="numeric" maxlength="1" pattern="[01]" aria-label="Ausgang für ${combination}" aria-describedby="table-help" value="${state.answers[index]}"></td>
        <td class="row-check"></td></tr>`;
      }).join("")}</tbody>
    </table>
    <p id="table-help">Tragen Sie für jeden Ausgang 0 (aus) oder 1 (an) ein. Das Fragezeichen beschreibt die Eingangskombination.</p>
    <form id="rule-form">
      <label for="rule">Eine Regel für alle Situationen</label>
      <div class="rule-entry">
        <input id="rule" type="text" maxlength="140" spellcheck="false" autocomplete="off" aria-describedby="rule-help" placeholder="Logischen Ausdruck eingeben" required>
        <div class="symbols" aria-label="Zeichen einfügen">
          ${["¬", "∧", "∨", "(", ")"].map(symbol => '<button class="secondary" type="button" data-symbol="' + symbol + '">' + symbol + '</button>').join("")}
        </div>
      </div>
      <p id="rule-help">Verwenden Sie ${inputs.map(([letter]) => letter).join(", ")} und die Operatoren ∧, ∨, ¬. Klammern legen fest, welche Teile zusammengehören. Ohne Klammern gilt zuerst NICHT, dann UND, dann ODER. Sie können die Operatoren auch ausschreiben.</p>
      <button type="submit">Regel mit Tabelle prüfen</button>
    </form>
    <p id="test-result" role="status"></p>
    <div id="table-result" hidden>
      <button id="complete" type="button">Steuerung übernehmen</button>
      <div id="transfer" hidden>
        <label for="transfer-code">Code zum Weitergeben</label>
        <div class="controls">
          <input id="transfer-code" type="text" readonly>
          <button id="copy-code" class="secondary" type="button">Code kopieren</button>
        </div>
        <p id="copy-status" role="status"></p>
        <p>Der Buchstabe vor dem Doppelpunkt kennzeichnet die Steuerung. Danach folgt Ihre Regel mit &amp; für UND, | für ODER und ! für NICHT.</p>
      </div>
    </div>
    <details class="import-box">
      <summary>Code einer Expertengruppe übernehmen</summary>
      <form id="import-form">
        <label for="incoming-code">Code für ${system.name}</label>
        <input id="incoming-code" type="text" autocomplete="off" spellcheck="false" required>
        <button type="submit">Code übernehmen</button>
        <p id="import-status" role="status"></p>
      </form>
    </details>`;

  const rule = $("#rule");
  const scenario = $("#case");
  const result = $("#test-result");
  rule.value = state.source;
  scenario.value = state.choice;
  const rows = Array.from($("#rule-rows").rows);

  function showScenario() {
    const stage = stages[state.choice];
    const values = stage[key];
    $("#case-description").textContent = stage.event;
    $("#sensors").innerHTML = inputs.map(([letter, label], index) =>
      '<div class="choice"><span>' + letter + " · " + label + '</span><strong>' + values[index] + "</strong></div>"
    ).join("");
    const rowIndex = parseInt(values.join(""), 2);
    rows.forEach((row, index) => {
      if (index === rowIndex) row.setAttribute("aria-current", "true");
      else row.removeAttribute("aria-current");
    });
    if (!state.outputs) {
      $("#case-result").textContent = "Tragen Sie den gewünschten Ausgang in der markierten Zeile ein.";
      showHouse({}, stageLabel(stage));
      return;
    }
    const output = tableOutput(state.outputs, values);
    $("#case-result").textContent = system.device + " laut Regel " + action(output) +
      ". Laut Anforderung " + action(system.expected(values)) + ".";
    showHouse({ [key]: output }, stageLabel(stage), 0, 1, Boolean(stage.water[1]));
  }

  function showTable() {
    $("#table-result").hidden = !state.outputs;
    let matches = 0;
    rows.forEach((row, index) => {
      const cell = row.querySelector(".row-check");
      if (!state.outputs) {
        cell.textContent = "–";
        return;
      }
      const output = state.outputs[index];
      const correct = system.expected(combinations[index]) === output;
      if (correct) matches += 1;
      const value = String(Number(output));
      const answer = state.answers[index];
      cell.textContent = "Regel: " + value + (correct ? "" : " (Soll: " + Number(!output) + ")") +
        (answer && answer !== value ? " · Eingabe weicht ab" : "");
    });
    if (!state.outputs) return;
    result.textContent = (state.imported ? "Code übernommen. " : state.done ? "Steuerung übernommen. " : "") +
      matches + " von 8 Ausgängen Ihrer Regel erfüllen die Anforderungen." +
      (matches < 8 ? " Prüfen Sie die Abweichungen oder untersuchen Sie deren Folgen in der Simulation." : "");
    $("#complete").hidden = state.done;
    $("#transfer").hidden = !state.done;
    $("#transfer-code").value = state.done ? exportCode(system, state.source) : "";
  }

  function updateOutputs(outputs, done, imported = false) {
    Object.assign(state, { outputs, done, imported });
    resetSeason();
    updateProgress();
    $("#copy-status").textContent = "";
    showTable();
    showScenario();
  }

  rows.forEach((row, index) => {
    const field = row.querySelector(".output-entry");
    field.addEventListener("input", () => {
      field.value = field.value.replace(/[^01]/g, "").slice(0, 1);
      state.answers[index] = field.value;
      if (state.outputs) showTable();
    });
  });

  rule.addEventListener("input", () => {
    state.source = rule.value;
    result.textContent = "";
    if (state.outputs) updateOutputs(null, false);
  });

  experiment.querySelectorAll("[data-symbol]").forEach(button => button.addEventListener("click", () => {
    rule.setRangeText(button.dataset.symbol, rule.selectionStart, rule.selectionEnd, "end");
    rule.focus();
    rule.dispatchEvent(new Event("input"));
  }));

  scenario.addEventListener("change", () => {
    state.choice = Number(scenario.value);
    showScenario();
  });

  $("#rule-form").addEventListener("submit", event => {
    event.preventDefault();
    try {
      const evaluate = compileRule(state.source, Object.keys(system.inputs));
      updateOutputs(combinations.map(evaluate), false);
    } catch (error) {
      result.textContent = error.message;
    }
  });

  $("#complete").addEventListener("click", () => {
    state.done = true;
    showTable();
    updateProgress();
    $("#transfer-code").focus();
  });

  $("#copy-code").addEventListener("click", async () => {
    const field = $("#transfer-code");
    const status = $("#copy-status");
    try {
      await navigator.clipboard.writeText(field.value);
      status.textContent = "Code kopiert.";
    } catch {
      field.focus();
      field.select();
      status.textContent = "Code markiert. Kopieren Sie ihn mit der Tastatur.";
    }
  });

  $("#import-form").addEventListener("submit", event => {
    event.preventDefault();
    const field = $("#incoming-code");
    const status = $("#import-status");
    try {
      const expression = importCode(system, field.value);
      const evaluate = compileRule(expression, Object.keys(system.inputs));
      rule.value = state.source = expression;
      field.value = "";
      updateOutputs(combinations.map(evaluate), true, true);
      status.textContent = "Code übernommen. Regel und Wahrheitstabelle sind oben sichtbar.";
    } catch (error) {
      status.textContent = error.message;
    }
  });

  showTable();
  showScenario();
}

function resetSeason() {
  clearTimeout(timer);
  stageIndex = -1;
  finishPending = false;
  $("#timeline").replaceChildren();
  $("#stage").replaceChildren();
  $("#harvest").hidden = true;
  $("#start-season").textContent = "Simulation starten";
  $("#next-stage").disabled = true;
}

function advance() {
  clearTimeout(timer);
  if (finishPending) {
    const labels = ["Größe", "Geschmack", "Konsistenz"];
    $("#kpis").innerHTML = labels.map((label, index) =>
      '<div><dt>' + label + '</dt><dd><meter min="0" max="100" value="' + scores[index] +
      '" aria-label="' + label + '"></meter><strong>' + scores[index] + ' %</strong></dd></div>'
    ).join("");
    $("#fruit").style.setProperty("--harvest-scale", 0.55 + scores[0] / 170);
    $("#fruit").style.setProperty("--harvest-saturation", 0.35 + scores[1] / 125);
    $("#fruit").style.setProperty("--harvest-shape", 0.68 + scores[2] / 310);
    $("#harvest").hidden = false;
    $("#next-stage").disabled = true;
    finishPending = false;
    return;
  }

  const stage = stages[++stageIndex];
  seasonOutputs = Object.fromEntries(keys.map(key => [key, tableOutput(states[key].outputs, stage[key])]));
  const effects = seasonImpact(stage, seasonOutputs);
  scores = scores.map((value, index) =>
    Math.max(0, value - effects.reduce((loss, [, penalties]) => loss + penalties[index], 0))
  );
  $("#timeline").innerHTML = stages.map(({ name }, index) =>
    '<li' + (stageIndex === index ? ' aria-current="step"' : "") + '>' + name + '</li>'
  ).join("");
  $("#stage").innerHTML = "<h3>Tag " + stage.day + " · " + stage.name + "</h3><p>" + stage.event +
    "</p><p><strong>Beobachtung</strong> " +
    (effects.length ? effects.map(([message]) => message).join(" · ") : "Die Steuerungen passen zu dieser Situation.") + "</p>";
  showSeasonHouse();
  finishPending = stageIndex === stages.length - 1;
  $("#next-stage").textContent = finishPending ? "Ergebnis zeigen" : "Nächste Station";
  scheduleAdvance();
}

function showSeasonHouse() {
  const stage = stages[stageIndex];
  showHouse(seasonOutputs, stage.name + " · Tag " + stage.day, stageIndex,
    0.65 + scores[0] / 285, Boolean(stage.water[1]));
}

function scheduleAdvance() {
  timer = setTimeout(advance, 4400);
}

$("#start-season").addEventListener("click", () => {
  resetSeason();
  scores = [100, 100, 100];
  $("#start-season").textContent = "Simulation neu starten";
  $("#next-stage").disabled = false;
  advance();
});

$("#next-stage").addEventListener("click", advance);
updateProgress();
openTab(active);
