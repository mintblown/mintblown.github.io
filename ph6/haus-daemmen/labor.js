"use strict";

const $ = (id) => document.getElementById(id);
const number = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
const timeNumber = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });
const format = (value, unit) => number.format(value) + " " + unit;
const layers = [];
const reviewedDays = new Set();
const shutters = { southLeft: false, southRight: false, east: false, west: false };
for (const control of document.querySelectorAll("[data-shutter]")) {
  control.addEventListener("click", () => {
    const side = control.dataset.shutter;
    const closed = !shutters[side];
    shutters[side] = closed;
    resetDayResults();
    control.setAttribute("aria-pressed", String(closed));
    const reading = control.querySelector("span");
    if (reading) reading.textContent = closed ? "geschlossen" : "offen";
  });
}
const wall = $("wall");
const tabs = [...document.querySelectorAll('[role="tab"]')];

function button(label, action) {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.addEventListener("click", action);
  return element;
}

function totalThickness() {
  return layers.reduce((sum, layer) => sum + layer.cm, 0);
}

function addLayer(kind) {
  const room = 30 - totalThickness();
  if (!Object.hasOwn(materials, kind) || layers.length >= 3 || room === 0) return;
  layers.unshift({ kind, cm: Math.min(5, room) });
  renderWall();
  if (document.activeElement.disabled) $("layer-controls").querySelector("input").focus();
}

for (const [kind, material] of Object.entries(materials)) {
  const tile = button("+ " + material.name, () => addLayer(kind));
  tile.style.setProperty("--material", material.color);
  tile.draggable = true;
  tile.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", kind);
    event.dataTransfer.effectAllowed = "copy";
  });
  $("materials").append(tile);
  $("sample").add(new Option(material.name, kind));
}

wall.addEventListener("dragover", (event) => {
  event.preventDefault();
  wall.classList.add("dropping");
});
wall.addEventListener("dragleave", (event) => {
  if (!wall.contains(event.relatedTarget)) wall.classList.remove("dropping");
});
wall.addEventListener("drop", (event) => {
  event.preventDefault();
  wall.classList.remove("dropping");
  addLayer(event.dataTransfer.getData("text/plain"));
});

function updateWall() {
  const total = totalThickness();
  const outer = layers[0]?.kind;
  document.querySelector(".house-illustration").dataset.facade = outer ?? "concrete";
  $("facade-material").textContent = "Außenfläche · " + (outer ? materials[outer].name : "Beton");
  $("total").textContent = layers.length + " von 3 Schichten · " + total + " von 30 cm";
  $("empty").hidden = layers.length > 0;
  const full = layers.length === 3 || total === 30;
  for (const tile of $("materials").children) {
    tile.disabled = full;
    tile.draggable = !full;
  }
  layers.forEach((layer, i) => {
    const strip = $("layers").children[i];
    const row = $("layer-controls").children[i];
    const input = row.querySelector("input");
    strip.style.width = (layer.cm / 30 * 100) + "%";
    input.max = layer.cm + 30 - total;
    input.value = layer.cm;
    row.querySelector("output").textContent = layer.cm + " cm";
    strip.querySelector("button").setAttribute("aria-label",
      materials[layer.kind].name + ", " + layer.cm + " cm. Mit Pfeiltasten Dicke ändern.");
  });
}

function resizeLayer(layer, value) {
  const max = layer.cm + 30 - totalThickness();
  layer.cm = Math.max(1, Math.min(max, value));
  updateWall();
  resetDayResults();
}

function renderWall() {
  $("layers").replaceChildren();
  $("layer-controls").replaceChildren();

  for (const layer of layers) {
    const material = materials[layer.kind];
    const strip = document.createElement("div");
    strip.className = "strip";
    strip.style.background = material.color;

    const grip = button("↔", () => {});
    grip.className = "grip";
    grip.title = "Ziehen, um die Dicke zu ändern";
    grip.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const startX = event.clientX;
      const startCm = layer.cm;
      const width = $("layers").clientWidth;
      grip.setPointerCapture(event.pointerId);
      grip.onpointermove = (move) => {
        resizeLayer(layer, startCm + Math.round((startX - move.clientX) * 30 / width));
      };
    });
    grip.addEventListener("lostpointercapture", () => { grip.onpointermove = null; });
    grip.addEventListener("keydown", (event) => {
      const direction = { ArrowLeft: 1, ArrowRight: -1 }[event.key];
      if (!direction) return;
      event.preventDefault();
      resizeLayer(layer, layer.cm + direction);
    });
    strip.append(grip);
    $("layers").append(strip);

    const row = document.createElement("div");
    row.className = "layer-row";
    row.style.setProperty("--material", material.color);
    const label = document.createElement("label");
    const output = document.createElement("output");
    const input = document.createElement("input");
    input.type = "range";
    input.min = 1;
    input.setAttribute("aria-label", "Dicke " + material.name);
    input.addEventListener("input", () => resizeLayer(layer, Number(input.value)));
    label.append(material.name + " ", output, input);
    const remove = button("×", () => {
      const index = layers.indexOf(layer);
      layers.splice(index, 1);
      renderWall();
      const rows = $("layer-controls").children;
      const next = rows[Math.min(index, rows.length - 1)];
      (next?.querySelector("button") ?? $("materials").firstElementChild).focus();
    });
    remove.setAttribute("aria-label", material.name + " entfernen");
    row.append(label, remove);
    $("layer-controls").append(row);
  }
  updateWall();
  resetDayResults();
}

function timeLabel(hour) {
  const minutes = Math.round(hour * 60);
  return String(Math.floor(minutes / 60)).padStart(2, "0") + ":" + String(minutes % 60).padStart(2, "0");
}

function drawChart(canvas, series, hour, limits, unit) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  const scale = window.devicePixelRatio || 1;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  const { min, max, step } = limits;
  const xMax = series[0].points.at(-1).hour;
  const plot = { left: 49, top: 22, right: width - 24, bottom: height - 32 };
  const x = (t) => plot.left + t / xMax * (plot.right - plot.left);
  const y = (v) => plot.bottom - (v - min) / (max - min) * (plot.bottom - plot.top);
  ctx.font = "12px system-ui";
  ctx.fillStyle = "#4c5459";
  ctx.fillText(unit, 8, 13);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let value = min; value <= max + step / 100; value += step) {
    ctx.strokeStyle = "#deded7";
    ctx.beginPath();
    ctx.moveTo(plot.left, y(value));
    ctx.lineTo(plot.right, y(value));
    ctx.stroke();
    ctx.fillText(number.format(value), plot.left - 8, y(value));
  }
  ctx.textAlign = "center";
  for (let time = 0; time <= xMax; time += xMax / 4) {
    ctx.fillText(time + " h", x(time), height - 11);
  }
  ctx.strokeStyle = "#969da0";
  ctx.beginPath();
  ctx.moveTo(x(hour), plot.top);
  ctx.lineTo(x(hour), plot.bottom);
  ctx.stroke();
  for (const line of series) {
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash(line.dashed ? [6, 5] : []);
    ctx.beginPath();
    line.points.forEach((point, i) => {
      const draw = i === 0 ? "moveTo" : "lineTo";
      ctx[draw](x(point.hour), y(point[line.key]));
    });
    ctx.stroke();
    ctx.setLineDash([]);
    const point = line.points[Math.round(hour / stepHours)];
    ctx.fillStyle = line.color;
    ctx.beginPath();
    ctx.arc(x(hour), y(point[line.key]), 4, 0, 2 * Math.PI);
    ctx.fill();
  }
}

const sampleControls = ["sample", "sample-thickness", "sample-hour", "sample-shade"];
function updateLab() {
  const cm = Number($("sample-thickness").value);
  const kind = $("sample").value;
  const shaded = $("sample-shade").checked;
  const hour = Number($("sample-hour").value);
  $("sample-value").textContent = cm + " cm";
  const elapsed = timeNumber.format(hour) + " h";
  $("sample-time").textContent = elapsed;
  for (const season of ["summer", "winter"]) {
    const points = simulateBox(season, [{ kind, cm }], shaded);
    const baseline = simulateBox(season, [], shaded);
    const index = Math.round(hour / stepHours);
    const label = "Innen nach " + elapsed + " · " + format(points[index].inside, "°C")
      + " (ohne Dämmung " + format(baseline[index].inside, "°C") + ")";
    $("box-" + season).textContent = label;
    const canvas = $("lab-" + season);
    const cube = canvas.parentElement.querySelector(".cube");
    cube.style.setProperty("--sample", materials[kind].color);
    cube.classList.toggle("shaded", shaded);
    canvas.setAttribute("aria-label", "Temperaturverlauf im Testwürfel. " + label);
    const limits = season === "summer" ? { min: 15, max: 55, step: 10 } : { min: -15, max: 25, step: 10 };
    drawChart(canvas, [
      { points: baseline, key: "inside", color: "#616974", dashed: true },
      { points, key: "inside", color: season === "summer" ? "#a84624" : "#245e92" }
    ], hour, limits, "°C");
  }
}
for (const id of sampleControls) $(id).addEventListener("input", updateLab);

const daySettings = [
  { id: "sommer", season: "summer", title: "Ein heißer Sommertag",
    question: "Was glaubst du, hält das Haus am besten kühl?",
    intro: "Sonne · draußen bis 35 °C · Start innen 22 °C",
    unit: "°C", key: "inside", name: "Innen", color: "#a84624", compare: "Außen" },
  { id: "winter", season: "winter", title: "Ein kalter Wintertag",
    question: "Welcher Teil der Dämmung ist am wichtigsten, um Heizkosten zu sparen?",
    intro: "Draußen −15 bis −10 °C · die Heizung hält innen 20 °C",
    unit: "kW", key: "heating", name: "Dein Haus", color: "#245e92", compare: "Ohne Dämmung" }
];

function metric(container, label, value) {
  const item = document.createElement("div");
  const name = document.createElement("span");
  const reading = document.createElement("strong");
  name.textContent = label;
  reading.textContent = value;
  item.append(name, reading);
  container.append(item);
}

for (const settings of daySettings) {
  const panel = $(settings.id);
  panel.append($("day-template").content.cloneNode(true));
  panel.classList.add(settings.season);
  panel.querySelector("h2").textContent = settings.title;
  panel.querySelector(".day-intro").textContent = settings.intro;
  const legend = panel.querySelector(".chart-legend");
  const main = document.createElement("span");
  const compare = document.createElement("span");
  main.style.setProperty("--line", settings.color);
  main.textContent = settings.name;
  compare.className = "dashed";
  compare.textContent = settings.compare;
  legend.append(main, compare);
  const form = panel.querySelector("form");
  const answer = form.querySelector("textarea");
  answer.id = settings.id + "-vermutung";
  form.querySelector("label").htmlFor = answer.id;
  form.querySelector("label").textContent = settings.question;
  const result = panel.querySelector(".day");
  answer.addEventListener("input", () => {
    answer.setCustomValidity("");
    result.hidden = true;
    reviewedDays.delete(settings.id);
    updateSummaryAvailability();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!answer.value.trim()) {
      answer.setCustomValidity("Schreib zuerst deine Vermutung auf.");
      answer.reportValidity();
      return;
    }
    result.hidden = false;
    reviewedDays.add(settings.id);
    updateDay(settings);
    updateSummaryAvailability();
    result.querySelector("h2").focus();
  });
  panel.querySelector("input").addEventListener("input", () => updateDay(settings));
}

function buildDescription() {
  return layers.length
    ? "Dämmung von außen nach innen · " + layers.map((layer) => materials[layer.kind].name + " " + layer.cm + " cm").join(" + ")
    : "Fassade · Beton ohne Dämmung";
}

function shutterDescription() {
  return "Rollläden · " + Object.values(shutters).filter(Boolean).length + " von 4 geschlossen";
}

function updateDay(settings, panel = $(settings.id)) {
  const isSummer = settings.season === "summer";
  const points = simulateDay(settings.season, layers, shutters);
  const baseline = isSummer ? points : simulateDay(settings.season, [], shutters);
  const hour = Number(panel.querySelector("input").value);
  const index = Math.round(hour / stepHours);
  const { unit, key } = settings;
  panel.querySelector("output").textContent = timeLabel(hour) + " Uhr";
  const build = panel.querySelector(".build-summary");
  const shade = panel.querySelector(".shutter-summary");
  if (build) build.textContent = buildDescription();
  if (shade) shade.textContent = shutterDescription();
  const peak = Math.max(...points.map((point) => point[key]));
  const values = panel.querySelector(".metrics");
  values.replaceChildren();
  metric(values, isSummer ? "Innen" : "Heizleistung", format(points[index][key], unit));
  metric(values, "Außen", format(points[index].outside, "°C"));
  metric(values, isSummer ? "Höchste Innentemperatur" : "Höchste Heizleistung", format(peak, unit));
  if (!isSummer) metric(values, "Ohne Dämmung", format(baseline[index].heating, unit));

  const canvas = panel.querySelector("canvas");
  canvas.setAttribute("aria-label", settings.title + ", " + settings.name + " um " + timeLabel(hour)
    + " Uhr: " + format(points[index][key], unit));
  const limits = isSummer
    ? { min: 20, max: Math.max(35, Math.ceil(peak / 5) * 5), step: 5 }
    : { min: 0, max: Math.ceil(Math.max(...baseline.map((point) => point.heating)) / 5) * 5, step: 5 };
  drawChart(canvas, [
    { points: baseline, key: isSummer ? "outside" : "heating", color: "#616974", dashed: true },
    { points, key, color: settings.color }
  ], hour, limits, unit);
}

function refreshVisible() {
  const selected = tabs.find((tab) => tab.getAttribute("aria-selected") === "true");
  const id = selected.getAttribute("aria-controls");
  if (id === "labor") updateLab();
  const day = daySettings.find((settings) => settings.id === id);
  if (day && reviewedDays.has(day.id)) updateDay(day);
  if (!$("result-summary").hidden) {
    daySettings.forEach((settings, i) => updateDay(settings, $("summary-days").children[i]));
  }
}

function updateSummaryAvailability() {
  const ready = reviewedDays.size === daySettings.length;
  $("summary-toggle").hidden = !ready;
  if (!ready) setSummaryOpen(false);
}

function resetDayResults() {
  reviewedDays.clear();
  for (const { id } of daySettings) $(id).querySelector(".day").hidden = true;
  updateSummaryAvailability();
}

function setSummaryOpen(open) {
  const summary = $("result-summary");
  if (open) {
    summary.hidden = false;
    summary.showModal();
  } else {
    summary.close();
    summary.hidden = true;
  }
  const toggle = $("summary-toggle");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.textContent = open ? "Kurzzusammenfassung schließen" : "Kurzzusammenfassung anzeigen";
}

$("result-summary").querySelector(".summary-close").addEventListener("click", () => setSummaryOpen(false));
$("result-summary").addEventListener("cancel", (event) => {
  event.preventDefault();
  setSummaryOpen(false);
});

$("summary-toggle").addEventListener("click", () => {
  const open = $("result-summary").hidden;
  setSummaryOpen(open);
  if (!open) return;

  const housePreview = document.querySelector(".house-illustration").cloneNode(true);
  for (const shutter of housePreview.querySelectorAll("button")) {
    const shape = document.createElement("span");
    shape.className = shutter.className;
    shape.setAttribute("aria-pressed", shutter.getAttribute("aria-pressed"));
    shape.setAttribute("aria-hidden", "true");
    shutter.replaceWith(shape);
  }
  $("result-summary").querySelector(".summary-house").replaceChildren(housePreview);
  $("summary-build").textContent = buildDescription();
  $("summary-shutters").textContent = shutterDescription();

  const results = $("summary-days");
  results.replaceChildren();
  for (const settings of daySettings) {
    const panel = $(settings.id);
    const copy = panel.querySelector(".day").cloneNode(true);
    copy.classList.add(settings.season);
    copy.querySelector(".build-summary").remove();
    copy.querySelector(".shutter-summary").remove();
    const prompt = document.createElement("h4");
    prompt.textContent = settings.question;
    const prediction = document.createElement("p");
    prediction.className = "prediction-text";
    prediction.textContent = panel.querySelector("textarea").value.trim();
    copy.querySelector(".day-intro").after(prompt, prediction);
    const timeControl = copy.querySelector("input");
    timeControl.value = panel.querySelector("input").value;
    timeControl.addEventListener("input", () => updateDay(settings, copy));
    results.append(copy);
    updateDay(settings, copy);
  }
  $("result-summary-title").focus();
});

function activateTab(selected) {
  for (const tab of tabs) {
    const active = tab === selected;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    $(tab.getAttribute("aria-controls")).hidden = !active;
  }
  refreshVisible();
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (event) => {
    const nextIndex = {
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1
    }[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    activateTab(tabs[nextIndex]);
    tabs[nextIndex].focus();
  });
});

window.addEventListener("resize", refreshVisible);
renderWall();
refreshVisible();
