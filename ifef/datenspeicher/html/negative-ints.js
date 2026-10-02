'use strict';
const intElement = id => document.getElementById(id);
const byteBits = value => value.toString(2).padStart(8, '0');
function negativeExample(raw) {
  const normalized = raw.trim().replace('−', '-');
  if (!/^-\d+$/.test(normalized)) throw Error('Gib eine negative ganze Zahl von −128 bis −1 ein.');
  const value = Number(normalized);
  if (!Number.isInteger(value) || value < -128 || value > -1) throw Error('Bitte wähle eine ganze Zahl von −128 bis −1.');
  const magnitude = -value, inverted = magnitude ^ 255, encoded = (inverted + 1) & 255;
  return { value, magnitude, inverted, encoded };
}
function updateNegative() {
  try {
    const { value, magnitude, inverted, encoded } = negativeExample(intElement('negative').value);
    const binary = byteBits(encoded);
    intElement('int-result').hidden = false;
    intElement('negative').setAttribute('aria-invalid', 'false');
    intElement('int-status').dataset.error = 'false';
    intElement('int-status').textContent = `−${magnitude} wird als ${binary} gespeichert.`;
    intElement('magnitude-bits').textContent = byteBits(magnitude);
    intElement('magnitude-text').textContent = `Der Betrag von −${magnitude} ist ${magnitude}.`;
    intElement('inverted-bits').textContent = byteBits(inverted);
    intElement('negative-bits').textContent = binary;
    intElement('addition-text').textContent = `${byteBits(inverted)} + 00000001 = ${binary}`;
    const weights = [-128, 64, 32, 16, 8, 4, 2, 1];
    const terms = weights.filter((weight, i) => binary[i] === '1');
    intElement('signed-sum').textContent = `${terms.join(' + ').replace('-', '−')} = −${magnitude}`;
    intElement('minimum-note').hidden = value !== -128;
    intElement('reverse-trick').hidden = value === -128;
    intElement('reverse-trick').textContent = `Der Trick funktioniert auch zurück: ${binary} → invertieren: ${byteBits(encoded ^ 255)} → +1: ${byteBits(magnitude)} = ${magnitude}.`;
  } catch (error) {
    intElement('int-result').hidden = true;
    intElement('negative').setAttribute('aria-invalid', 'true');
    intElement('int-status').dataset.error = 'true';
    intElement('int-status').textContent = error.message;
  }
}
intElement('int-form').addEventListener('submit', event => { event.preventDefault(); updateNegative(); });
intElement('negative').addEventListener('input', updateNegative);
updateNegative();
