'use strict';

const euroValues = [200, 100, 50, 20, 10, 5, 2, 1];
const binaryValues = [256, 128, 64, 32, 16, 8, 4, 2, 1];
const euroState = { target: undefined, counts: euroValues.map(() => 0) };
const binaryState = { target: undefined, counts: binaryValues.map(() => 0) };
const byId = id => document.getElementById(id);
const money = cents => (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
const total = (values, counts) => values.reduce((sum, value, i) => sum + value * counts[i], 0);
const coinCount = counts => counts.reduce((sum, count) => sum + count, 0);

function nextAmount(min, max, previous) {
  if (previous === undefined) return min + Math.floor(Math.random() * (max - min + 1));
  const candidate = min + Math.floor(Math.random() * (max - min));
  return candidate >= previous ? candidate + 1 : candidate;
}

function greedyCoins(amount, values) {
  let rest = amount;
  return values.map(value => {
    const count = Math.floor(rest / value);
    rest -= count * value;
    return count;
  });
}

function feedback(id, message, state = '') {
  const output = byId(`${id}-feedback`);
  output.textContent = message;
  output.dataset.state = state;
}

function hideSolution(id) {
  byId(`${id}-solution`).hidden = true;
  byId(`${id}-solution`).textContent = '';
  feedback(id, '');
}

function coinName(value) {
  return value >= 100 ? `${value / 100} Euro` : `${value} Cent`;
}

function buildEuroCoins() {
  euroValues.forEach((value, i) => {
    const picker = document.createElement('div');
    picker.className = 'coin-picker';
    picker.innerHTML = `<div class="coin-face" aria-hidden="true">${value >= 100 ? value / 100 : value}<small>${value >= 100 ? 'Euro' : 'Cent'}</small></div><label for="euro-count-${i}">Anzahl ${coinName(value)}</label><div class="counter"><button type="button" class="secondary" data-action="minus" aria-label="Eine ${coinName(value)}-Münze zurücklegen">−</button><input id="euro-count-${i}" type="number" min="0" max="1000" step="1" value="0" inputmode="numeric"><button type="button" class="secondary" data-action="plus" aria-label="Eine ${coinName(value)}-Münze nehmen">+</button></div>`;
    byId('euro-coins').append(picker);
    const input = byId(`euro-count-${i}`);
    input.addEventListener('input', () => {
      hideSolution('euro');
      const valid = readEuroCounts();
      if (valid) updateEuroTotal();
    });
    for (const [action, delta] of [['minus', -1], ['plus', 1]]) {
      picker.querySelector(`[data-action="${action}"]`).addEventListener('click', () => {
        const current = /^\d+$/.test(input.value) ? Number(input.value) : 0;
        input.value = String(Math.max(0, Math.min(1000, current + delta)));
        hideSolution('euro');
        if (readEuroCounts()) updateEuroTotal();
      });
    }
  });
}

function readEuroCounts() {
  const counts = euroValues.map((_, i) => {
    const input = byId(`euro-count-${i}`);
    const valid = /^\d+$/.test(input.value) && Number(input.value) <= 1000;
    input.setAttribute('aria-invalid', String(!valid));
    return valid ? Number(input.value) : null;
  });
  if (counts.includes(null)) {
    byId('euro-total').textContent = 'Bitte vervollständige deine Münzanzahlen.';
    feedback('euro', 'Trage bei jeder Münzsorte eine ganze Zahl von 0 bis 1000 ein. Für keine Münze trägst du 0 ein.', 'error');
    return false;
  }
  euroState.counts = counts;
  return true;
}

function walletText(values, counts, target) {
  const sum = total(values, counts);
  const difference = target - sum;
  const count = coinCount(counts);
  return `Gelegt: ${money(sum)} · ${count} ${count === 1 ? 'Münze' : 'Münzen'}. ${difference === 0 ? 'Der Betrag stimmt genau.' : difference > 0 ? `Es fehlen ${money(difference)}.` : `Das sind ${money(-difference)} zu viel.`}`;
}

function updateEuroTotal() {
  byId('euro-total').textContent = walletText(euroValues, euroState.counts, euroState.target);
}

function clearEuro() {
  euroState.counts.fill(0);
  euroValues.forEach((_, i) => {
    byId(`euro-count-${i}`).value = '0';
    byId(`euro-count-${i}`).setAttribute('aria-invalid', 'false');
  });
  hideSolution('euro'); updateEuroTotal();
}

function newEuro() {
  euroState.target = nextAmount(1, 1000, euroState.target);
  byId('euro-target').textContent = money(euroState.target);
  clearEuro();
}

function changeMode() {
  const minimum = byId('euro-mode').value === 'minimum';
  byId('euro-rule').textContent = minimum ? 'Triff den Betrag genau und benutze dafür die kleinste mögliche Anzahl von Münzen.' : 'Jede passende Zusammenstellung zählt. Du darfst Münzsorten mehrfach verwenden.';
  hideSolution('euro');
}

function checkEuro() {
  if (!readEuroCounts()) return;
  updateEuroTotal();
  const sum = total(euroValues, euroState.counts);
  if (sum !== euroState.target) {
    feedback('euro', sum < euroState.target ? `Noch nicht ganz: Es fehlen ${money(euroState.target - sum)}.` : `Du hast ${money(sum - euroState.target)} zu viel gelegt. Lege einige Münzen zurück.`, 'error');
    return;
  }
  const count = coinCount(euroState.counts);
  const minimum = coinCount(greedyCoins(euroState.target, euroValues));
  if (byId('euro-mode').value === 'minimum' && count > minimum) {
    feedback('euro', `Der Betrag stimmt! Du benutzt ${count} Münzen. Es geht noch mit weniger: Tausche kleine Münzen gegen größere aus.`, 'error');
    return;
  }
  feedback('euro', byId('euro-mode').value === 'minimum' ? `Geschafft! ${money(sum)} mit ${count} ${count === 1 ? 'Münze' : 'Münzen'} – weniger geht nicht.` : `Richtig! Deine Münzen ergeben genau ${money(sum)}.`, 'success');
}

function showEuroSolution() {
  const counts = greedyCoins(euroState.target, euroValues);
  const list = counts.map((count, i) => count ? `${count} × ${money(euroValues[i])}` : '').filter(Boolean);
  const count = coinCount(counts);
  byId('euro-solution').textContent = `Eine Lösung mit der kleinsten Münzanzahl: ${list.join(' + ')} = ${money(euroState.target)}. Das ${count === 1 ? 'ist 1 Münze' : `sind ${count} Münzen`}. Nimm jeweils die größte Münze, die in den noch fehlenden Betrag passt.`;
  byId('euro-solution').hidden = false;
  feedback('euro', 'Die Lösung ist eingeblendet. Du kannst sie mit deinen Münzen nachlegen.');
}

function buildBinaryCoins() {
  binaryValues.forEach((value, i) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'binary-coin'; button.id = `binary-coin-${i}`;
    button.innerHTML = `<span class="coin-face" aria-hidden="true">${value}<small>Cent</small></span><span class="coin-caption">${money(value)}</span><span class="coin-state" id="binary-label-${i}">Liegt da</span>`;
    button.setAttribute('aria-label', `Münze im Wert von ${value} Cent`);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      binaryState.counts[i] = 1 - binaryState.counts[i];
      hideSolution('binary'); updateBinary();
    });
    byId('binary-coins').append(button);
  });
}

function updateBinary() {
  binaryValues.forEach((_, i) => {
    byId(`binary-coin-${i}`).setAttribute('aria-pressed', String(Boolean(binaryState.counts[i])));
    byId(`binary-label-${i}`).textContent = binaryState.counts[i] ? '✓ Genommen' : 'Liegt da';
  });
  byId('binary-total').textContent = walletText(binaryValues, binaryState.counts, binaryState.target);
}

function clearBinary() {
  binaryState.counts.fill(0); hideSolution('binary'); updateBinary();
}

function newBinary(amount) {
  binaryState.target = amount === undefined ? nextAmount(0, 511, binaryState.target) : amount;
  byId('binary-target').textContent = money(binaryState.target);
  clearBinary();
}

function checkBinary() {
  const sum = total(binaryValues, binaryState.counts);
  if (sum !== binaryState.target) {
    feedback('binary', sum < binaryState.target ? `Es fehlen noch ${money(binaryState.target - sum)}. Welche Münzen könnten passen?` : `Du hast ${money(sum - binaryState.target)} zu viel gelegt. Welche Münze lässt du lieber liegen?`, 'error');
    return;
  }
  feedback('binary', sum === 0 ? 'Richtig! Für 0,00 € lässt du alle Münzen liegen.' : `Richtig! ${money(sum)} – und jede Münze höchstens einmal. Für diesen Betrag gibt es genau diese eine Auswahl.`, 'success');
}

function showBinarySolution() {
  const counts = greedyCoins(binaryState.target, binaryValues);
  const list = binaryValues.filter((_, i) => counts[i]);
  byId('binary-solution').textContent = list.length ? `Nimm diese Münzen: ${list.map(money).join(' + ')} = ${money(binaryState.target)}. Beginne mit der größten passenden Münze und mache mit dem Rest weiter. Alle anderen Münzen lässt du liegen.` : 'Für 0,00 € nimmst du keine Münze. Alle neun Münzen bleiben liegen.';
  byId('binary-solution').hidden = false;
  feedback('binary', 'Die Lösung ist eingeblendet. Probiere die Auswahl selbst aus.');
}

byId('euro-mode').addEventListener('change', changeMode);
byId('euro-check').addEventListener('click', checkEuro);
byId('euro-new').addEventListener('click', newEuro);
byId('euro-clear').addEventListener('click', clearEuro);
byId('euro-solve').addEventListener('click', showEuroSolution);
byId('minimum-start').addEventListener('click', () => {
  byId('euro-mode').value = 'minimum'; changeMode();
  byId('euro-mode').focus();
});
byId('binary-check').addEventListener('click', checkBinary);
byId('binary-new').addEventListener('click', () => newBinary());
byId('binary-clear').addEventListener('click', clearBinary);
byId('binary-example').addEventListener('click', () => newBinary(42));
byId('binary-solve').addEventListener('click', showBinarySolution);
buildEuroCoins(); buildBinaryCoins(); newEuro(); newBinary();
