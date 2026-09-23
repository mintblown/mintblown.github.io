const svg = document.querySelector('#thermo-svg');
const marks = document.querySelector('#marks');
const status = document.querySelector('#status');
const continueButton = document.querySelector('#continue');
const undoButton = document.querySelector('#undo');
const resetButton = document.querySelector('#reset');
const stepLabel = document.querySelector('#step-label');
const stepTitle = document.querySelector('#step-title');
const instruction = document.querySelector('#step-instruction');
const readingStep = document.querySelector('#reading-step');
const answerForm = document.querySelector('#answer-form');
const answerInput = document.querySelector('#answer');
const answerResult = document.querySelector('#answer-result');

const ZERO_Y = 730;
const HUNDRED_Y = 130;
let stage = 1;
let anchors = [];
let divisions = [];

function yForTemperature(temperature) {
  return ZERO_Y + (HUNDRED_Y - ZERO_Y) * temperature / 100;
}

function pointerPosition(event) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(svg.getScreenCTM().inverse());
}

function draw() {
  const anchorMarkup = anchors.map((y, index) => `<line class="cal-line" x1="45" y1="${y}" x2="1490" y2="${y}"/><text class="cal-label" x="55" y="${y - 12}">${index === 0 ? '0 °C' : '100 °C'}</text>`).join('');
  const divisionMarkup = divisions.map((y, index) => `<line class="cal-tick" x1="1325" y1="${y}" x2="1445" y2="${y}"/><text class="cal-label" x="1457" y="${y + 9}">${(index + 1) * 10}</text>`).join('');
  const scaleEnds = stage >= 2 ? `<line class="cal-tick" x1="1310" y1="${ZERO_Y}" x2="1445" y2="${ZERO_Y}"/><text class="cal-label" x="1457" y="${ZERO_Y + 9}">0</text><line class="cal-tick" x1="1310" y1="${HUNDRED_Y}" x2="1445" y2="${HUNDRED_Y}"/><text class="cal-label" x="1457" y="${HUNDRED_Y + 9}">100 °C</text>` : '';
  marks.innerHTML = anchorMarkup + scaleEnds + divisionMarkup;
}

svg.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const point = pointerPosition(event);
  if (stage === 1 && anchors.length < 2) {
    anchors.push(point.y);
    continueButton.disabled = anchors.length !== 2;
    status.textContent = anchors.length === 1 ? 'Jetzt die 100-°C-Linie auf Höhe der Flüssigkeit in Panel 2 setzen.' : 'Beide Linien sind gesetzt. Prüfe die Fixpunkte.';
    draw();
  } else if (stage === 2 && divisions.length < 9) {
    const temperature = (divisions.length + 1) * 10;
    const target = yForTemperature(temperature);
    if (point.x < 1024) {
      status.textContent = `Setze den ${temperature}-°C-Teilstrich rechts neben das Thermometer in Panel 3.`;
      return;
    }
    if (Math.abs(point.y - target) > 30) {
      status.textContent = `Das ist noch nicht die passende Höhe für ${temperature} °C. Teile den Abstand gleichmäßig und versuche es erneut.`;
      return;
    }
    divisions.push(target);
    continueButton.disabled = divisions.length !== 9;
    status.textContent = divisions.length === 9 ? 'Deine Skala ist vollständig. Weiter zum Ablesen!' : `Gut! Setze jetzt den Teilstrich für ${(divisions.length + 1) * 10} °C.`;
    draw();
  }
});

continueButton.addEventListener('click', () => {
  if (stage === 1) {
    if (Math.abs(anchors[0] - ZERO_Y) > 48 || Math.abs(anchors[1] - HUNDRED_Y) > 48) {
      status.textContent = 'Mindestens eine Linie liegt noch nicht auf der Höhe der Flüssigkeit. Lösche die letzte Marke oder beginne neu.';
      return;
    }
    anchors = [ZERO_Y, HUNDRED_Y];
    stage = 2;
    divisions = [];
    stepLabel.textContent = 'Stufe 2 von 3';
    stepTitle.textContent = 'Teile die Skala in zehn gleiche Abschnitte';
    instruction.textContent = 'Setze rechts neben Panel 3 nacheinander die Teilstriche für 10, 20, 30 bis 90 °C. Zwischen 0 °C und 100 °C entstehen zehn gleich große Abschnitte.';
    status.textContent = 'Setze zuerst den Teilstrich für 10 °C.';
    continueButton.textContent = 'Weiter zum Ablesen';
    continueButton.disabled = true;
    draw();
  } else if (stage === 2 && divisions.length === 9) {
    stage = 3;
    stepLabel.textContent = 'Stufe 3 von 3';
    stepTitle.textContent = 'Lies die unbekannte Temperatur ab';
    instruction.textContent = 'Vergleiche die Höhe der roten Flüssigkeit in Panel 3 mit deiner Skala.';
    status.textContent = 'Trage deinen abgelesenen Wert unten ein.';
    continueButton.hidden = true;
    undoButton.hidden = true;
    readingStep.hidden = false;
    answerInput.focus();
  }
});

undoButton.addEventListener('click', () => {
  if (stage === 1 && anchors.length) anchors.pop();
  if (stage === 2 && divisions.length) divisions.pop();
  continueButton.disabled = stage === 1 ? anchors.length !== 2 : divisions.length !== 9;
  status.textContent = stage === 1 ? (anchors.length ? 'Setze jetzt die 100-°C-Linie.' : 'Setze die 0-°C-Linie.') : `Setze den Teilstrich für ${(divisions.length + 1) * 10} °C.`;
  draw();
});

function reset() {
  stage = 1;
  anchors = [];
  divisions = [];
  stepLabel.textContent = 'Stufe 1 von 3';
  stepTitle.textContent = 'Setze die beiden Fixpunktlinien';
  instruction.textContent = 'Klicke zuerst auf die Höhe der Flüssigkeit in Panel 1. Setze danach die 100-°C-Linie auf die Höhe in Panel 2.';
  status.textContent = 'Setze die 0-°C-Linie.';
  continueButton.textContent = 'Weiter';
  continueButton.hidden = false;
  continueButton.disabled = true;
  undoButton.hidden = false;
  readingStep.hidden = true;
  answerInput.value = '';
  answerResult.textContent = '';
  draw();
}

resetButton.addEventListener('click', reset);
answerForm.addEventListener('submit', event => {
  event.preventDefault();
  const value = Number(answerInput.value.trim().replace(',', '.'));
  if (!Number.isFinite(value)) {
    answerResult.textContent = 'Bitte gib eine Zahl ein.';
  } else if (Math.abs(value - 37) <= 1) {
    answerResult.textContent = 'Richtig! Das Thermometer zeigt ungefähr 37 °C.';
  } else {
    answerResult.textContent = 'Schau noch einmal: Zwischen welchen beiden Teilstrichen endet die rote Flüssigkeit?';
  }
});

draw();
