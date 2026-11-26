"use strict";

const scenes = {
  phantasia: [
    ["Streifenwagen und Radarfalle", "Zwei Polizisten warten mit einer Radarfalle an einer einsamen Landstraße."],
    ["Polizisten mit Fruchtgummitüte", "Im Streifenwagen widmen sich die Polizisten einer Tüte Phantasia. Man hört Kinderstimmen."],
    ["Fruchtgummi in Flaschenform", "Eine Colaflasche aus der Fruchtgummimischung kommt im Gespräch vor."],
    ["Krokodil und Chamäleon", "Die Polizisten reden über tierische Fruchtgummis und lassen ihrer Fantasie freien Lauf."],
    ["Phantasia-Packung", "Die Packung und die Marke stehen im Mittelpunkt des Schlussbilds."]
  ],
  heimkommen: [
    ["Nachricht am Telefon", "Der Vater hört eine Nachricht ab. Ein Besuch zu Weihnachten klappt wieder nicht."],
    ["Allein am Weihnachtstisch", "Der Vater sitzt an Weihnachten allein am gedeckten Tisch."],
    ["Die Todesnachricht", "Die erwachsenen Kinder erhalten die Nachricht, dass ihr Vater gestorben sei."],
    ["Ankunft am Haus", "Die Familie reist an und kommt im Haus des Vaters zusammen."],
    ["Wiedersehen am Tisch", "Der Vater erscheint lebendig. Die Familie bleibt und isst gemeinsam mit ihm."]
  ],
  kassensymphonie: [
    ["Einkauf an der Kasse", "Kundinnen und Kunden warten an den Kassen und legen ihre Einkäufe aufs Band."],
    ["Das Licht geht aus", "Das Licht im Markt geht aus. Die Wartenden schauen sich überrascht um."],
    ["Produkte am Scanner", "Beim Scannen der Waren erklingen unterschiedlich hohe Pieptöne."],
    ["Die Kassen spielen zusammen", "Mehrere Kassen spielen gemeinsam die Melodie von Jingle Bells. Ein Beatboxer steuert den Rhythmus bei."],
    ["Reaktionen im Markt", "Die Kundinnen und Kunden erleben die Aufführung. Einige lächeln oder klatschen."]
  ],
  dfb: [
    ["Zwei Jugendliche im Gespräch", "Eine Jugendliche wird nach dem neuen Heimtrikot gefragt. Sie findet es typisch deutsch."],
    ["Fußballfans am Imbiss", "Der Film zeigt einen Dönerimbiss als einen von mehreren Schauplätzen aus dem Alltag."],
    ["Socken in Badelatschen", "Badelatschen mit Socken greifen ein Klischee auf. Der Film spielt mit der Frage, was typisch deutsch ist."],
    ["Nationalspieler im Heimtrikot", "Die Montage zeigt Nationalspieler. Das weiße Heimtrikot taucht in verschiedenen Einstellungen auf."],
    ["Zwei Trikots", "Die Trikotkampagne stellt das weiße Heimtrikot und das pinke Auswärtstrikot vor."]
  ]
};

const spot = document.body.dataset.spot;
const bank = document.querySelector("#cards");
const timeline = document.querySelector("#timeline");
const status = document.querySelector("#status");
const order = [2, 4, 0, 3, 1];
const slots = scenes[spot].map((_, index) => {
  const slot = document.createElement("li");
  const label = document.createElement("span");
  const body = document.createElement("div");
  slot.className = "slot";
  label.className = "slot-label";
  label.textContent = `Platz ${index + 1}${index === 0 ? " · Anfang" : index === 4 ? " · Ende" : ""}`;
  body.className = "slot-body";
  slot.append(label, body);
  timeline.append(slot);
  return body;
});

let draggedCard = null;

function moveCard(card, target, keepFocus = false) {
  const previous = card.parentElement;
  if (target !== previous) {
    const occupant = target === bank ? null : target.firstElementChild;
    if (occupant) previous.append(occupant);
    target.append(card);
  }
  if (keepFocus) card.querySelector(".move").focus();
  const destination = target === bank ? "zur Kartenablage" : `auf Platz ${slots.indexOf(target) + 1}`;
  status.textContent = `${card.dataset.label} verschoben ${destination}.`;
}

function connectDropZone(zone, target) {
  zone.addEventListener("dragover", event => {
    if (!draggedCard) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    zone.classList.add("over");
  });
  zone.addEventListener("dragleave", event => {
    if (!zone.contains(event.relatedTarget)) zone.classList.remove("over");
  });
  zone.addEventListener("drop", event => {
    if (!draggedCard) return;
    event.preventDefault();
    zone.classList.remove("over");
    moveCard(draggedCard, target);
  });
}

connectDropZone(bank, bank);
slots.forEach(slot => connectDropZone(slot.parentElement, slot));

for (const index of order) {
  const [label, description] = scenes[spot][index];
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.label = label;
  card.draggable = true;
  card.innerHTML = `
    <button class="flip" type="button" aria-pressed="false">
      <span class="faces">
        <span class="face"><img draggable="false" alt=""></span>
        <span class="face back" aria-hidden="true"></span>
      </span>
    </button>
    <select class="move">
      <option value="" selected disabled>Verschieben …</option>
      <option value="bank">Kartenablage</option>
      ${slots.map((_, position) => `<option value="${position}">Platz ${position + 1}</option>`).join("")}
    </select>`;
  const flip = card.querySelector(".flip");
  const front = card.querySelector(".face");
  const back = card.querySelector(".back");
  const control = card.querySelector(".move");
  card.querySelector("img").src = `img/${spot}-${index + 1}.webp`;
  flip.setAttribute("aria-label", `${label}. Szenenbeschreibung anzeigen`);
  back.textContent = description;
  flip.addEventListener("click", () => {
    const showBack = flip.getAttribute("aria-pressed") === "false";
    flip.setAttribute("aria-pressed", String(showBack));
    flip.setAttribute("aria-label", showBack ? `${description} Bild anzeigen` : `${label}. Szenenbeschreibung anzeigen`);
    front.setAttribute("aria-hidden", String(showBack));
    back.setAttribute("aria-hidden", String(!showBack));
  });
  control.setAttribute("aria-label", `Verschieben: ${label}`);
  control.addEventListener("change", () => {
    const target = control.value === "bank" ? bank : slots[Number(control.value)];
    control.value = "";
    moveCard(card, target, true);
  });
  card.addEventListener("dragstart", event => {
    if (event.target !== card) return;
    draggedCard = card;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", label);
    requestAnimationFrame(() => {
      if (draggedCard === card) card.classList.add("dragging");
    });
  });
  card.addEventListener("dragend", () => {
    draggedCard = null;
    card.classList.remove("dragging");
    document.querySelectorAll(".over").forEach(zone => zone.classList.remove("over"));
  });
  bank.append(card);
}
