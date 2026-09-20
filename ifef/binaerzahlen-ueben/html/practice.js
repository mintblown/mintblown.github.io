'use strict';
const $ = id => document.getElementById(id);
const number = (digits, base) => `[${digits}]<sub>${base}</sub>`;
let value, direction, solved, shown, correct = 0, completed = 0;
function newTask() {
  const previous = value;
  // Choose uniformly from the other 255 values to avoid immediate repeats.
  value = previous === undefined ? Math.floor(Math.random() * 256) : Math.floor(Math.random() * 255);
  if (previous !== undefined && value >= previous) value++;
  const selected = $('direction').value;
  direction = selected === 'mixed' ? (Math.random() < .5 ? 'toBinary' : 'toDecimal') : selected;
  solved = false; shown = false;
  const binary = value.toString(2).padStart(8, '0');
  $('task').innerHTML = direction === 'toBinary' ? `${number(value, 10)} → [?]<sub>2</sub>` : `${number(binary, 2)} → [?]<sub>10</sub>`;
  $('answer-label').textContent = direction === 'toBinary' ? 'Ihre Binärzahl' : 'Ihre Dezimalzahl';
  $('answer-hint').textContent = direction === 'toBinary' ? 'Geben Sie genau 8 Bits ein (nur 0 und 1). Ergänzen Sie bei Bedarf führende Nullen.' : 'Geben Sie eine ganze Zahl von 0 bis 255 ein, ohne Basisangabe.';
  $('answer').value = ''; $('answer').disabled = false; $('check').disabled = false;
  $('feedback').textContent = ''; $('solution').hidden = true; $('solution').innerHTML = '';
  $('show-solution').disabled = false; updateScore();
}
function updateScore() { $('score').textContent = `Selbst gelöst: ${correct} · Abgeschlossen oder aufgelöst: ${completed}`; }
$('answer-form').onsubmit = event => {
  event.preventDefault(); if (solved) return;
  const answer = $('answer').value.trim();
  if (direction === 'toBinary' ? !/^[01]{8}$/.test(answer) : !/^\d{1,3}$/.test(answer) || Number(answer) > 255) {
    $('feedback').textContent = direction === 'toBinary' ? 'Bitte geben Sie genau acht Ziffern ein, jeweils 0 oder 1.' : 'Bitte geben Sie eine ganze Dezimalzahl von 0 bis 255 ein.'; return;
  }
  if (parseInt(answer, direction === 'toBinary' ? 2 : 10) !== value) {
    $('feedback').textContent = 'Noch nicht richtig. Prüfen Sie die Stellenwerte mit der Hilfekarte und versuchen Sie es erneut.'; return;
  }
  solved = true;
  if (!shown) { correct++; completed++; }
  $('feedback').textContent = shown ? 'Richtig nachvollzogen. Die Lösung war bereits eingeblendet.' : 'Richtig! Sie haben die Zahl erfolgreich umgewandelt.';
  $('answer').disabled = true; $('check').disabled = true; updateScore();
};
$('show-solution').onclick = () => {
  if (!shown && !solved) completed++;
  shown = true;
  const binary = value.toString(2).padStart(8, '0');
  const terms = [...binary].map((bit, i) => `${bit} × ${2 ** (7-i)}`);
  let explanation = `<p>${number(value, 10)} = ${number(binary, 2)}</p><p>${terms.join(' + ')} = ${value}</p>`;
  if (direction === 'toBinary') {
    let rest = value; const lines = [];
    do { lines.push(`${rest} ÷ 2 = ${Math.floor(rest/2)} Rest ${rest%2}`); rest = Math.floor(rest/2); } while (rest > 0);
    explanation += `<ol>${lines.map(line => `<li>${line}</li>`).join('')}</ol><p>Lesen Sie die Reste von unten nach oben und ergänzen Sie links Nullen auf acht Stellen: <strong>${binary}</strong>.</p>`;
  }
  $('solution').innerHTML = explanation; $('solution').hidden = false;
  $('show-solution').disabled = true;
  $('feedback').textContent = solved ? 'Der Rechenweg ist eingeblendet.' : 'Lösung eingeblendet. Diese Aufgabe zählt nicht mehr als selbst gelöst.';
  updateScore();
};
$('new-task').onclick = () => { newTask(); $('answer').focus(); };
$('direction').onchange = newTask;
newTask();
