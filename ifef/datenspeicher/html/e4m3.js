'use strict';
const el = id => document.getElementById(id);
const decimal = value => Object.is(value, -0) ? '−0' : String(value).replace('.', ',').replace('-', '−');
const show = (id, text) => { el(id).textContent = text; };
function explain(raw) {
  const normalized = raw.trim().replace('−', '-').replace(',', '.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) throw Error('Gib eine Dezimalzahl ein, zum Beispiel 5,5 oder −2.');
  const requested = Number(normalized);
  if (!Number.isFinite(requested) || Math.abs(requested) > 448) throw Error('Bitte wähle eine Zahl zwischen −448 und 448.');
  const byte = floatEncode(requested), stored = floatDecode(byte);
  const binary = byte.toString(2).padStart(8, '0');
  const s = byte >> 7, e = (byte >> 3) & 15, m = byte & 7;
  const exponent = e === 0 ? -6 : e - 7;
  const factor = 2 ** exponent, significand = (e === 0 ? 0 : 1) + m / 8;
  return { requested, stored, binary, s, e, m, exponent, factor, significand };
}
function update() {
  try {
    const x = explain(el('number').value);
    const { requested, stored, binary, s, e, m, exponent, factor, significand } = x;
    el('result').hidden = false;
    el('number').setAttribute('aria-invalid', 'false');
    el('input-status').dataset.error = 'false';
    show('input-status', `Die Erklärung zeigt ${decimal(requested)} als ${binary.slice(0, 1)} ${binary.slice(1, 5)} ${binary.slice(5)}.`);
    show('rounding', Object.is(requested, stored)
      ? `${decimal(requested)} ist exakt darstellbar. Alle Rechnungen unten ergeben genau deine Zahl.`
      : `${decimal(requested)} ist nicht exakt darstellbar und wird auf ${decimal(stored)} gerundet. Die Bits und Rechnungen unten beschreiben den gespeicherten Wert ${decimal(stored)}. Abweichung (gespeichert − eingegeben): ${decimal(Number((stored - requested).toPrecision(10)))}.`);
    for (const [key, bitText, value] of [['s', binary[0], s], ['e', binary.slice(1, 5), e], ['m', binary.slice(5), m]]) {
      show(`${key}-bits`, bitText); show(`${key}-decimal`, `${key.toUpperCase()} = ${value} (dezimal)`);
    }
    show('s-explain', s === 1
      ? `Deine Eingabe ${decimal(requested)} hat ein Minuszeichen. Deshalb ist S = 1. Das Vorzeichen bleibt auch erhalten, wenn auf −0 gerundet wird.`
      : `Deine Eingabe ${decimal(requested)} hat kein negatives Vorzeichen. Deshalb ist S = 0. Der Faktor für das Vorzeichen ist +1.`);
    show('s-calc', `(−1)^${s} = ${s ? '−1' : '+1'}`);
    show('e-sum', `${binary.slice(1, 5)}₂ = ${[...binary.slice(1, 5)].map((bit, i) => `${bit}·${2 ** (3 - i)}`).join(' + ')} = ${e}`);
    if (e === 0) {
      show('e-explain', m === 0
        ? 'Alle Exponentenbits sind 0. Zusammen mit M = 0 kennzeichnet das die Null. Für die Rechnung gilt die Sonderregel mit Exponent −6.'
        : 'Alle Exponentenbits sind 0. Für so kleine Zahlen gilt eine Sonderregel: Der tatsächliche Exponent bleibt −6. Die führende 1 fällt weg. Solche Zahlen heißen subnormal.');
      show('e-calc', `E = 0 → Sonderregel: e = 1 − 7 = −6\n2^(−6) = ${decimal(factor)}`);
    } else {
      show('e-explain', `Der Betrag des gespeicherten Wertes ist ${decimal(Math.abs(stored))} = ${decimal(significand)} · 2^(${exponent}). Der tatsächliche Exponent e ist also ${exponent}. Gespeichert wird e + 7: Die Verschiebung um 7 heißt Bias.`);
      show('e-calc', `Speichern: E = ${exponent} + 7 = ${e}\nLesen: e = ${e} − 7 = ${exponent}\nFaktor: 2^(${exponent}) = ${decimal(factor)}`);
    }
    show('m-explain', e === 0
      ? `M speichert die drei Bits hinter dem Binärkomma. Weil E = 0 ist, ergänzen wir vorne eine 0: 0,${binary.slice(5)}₂. Die Nachkommastellen haben die Werte ½, ¼ und ⅛.`
      : `M speichert nur die drei Bits hinter dem Binärkomma. Die führende 1 wird bei normalisierten Zahlen mitgedacht: 1,${binary.slice(5)}₂. So sparen wir ein Bit. Die Nachkommastellen haben die Werte ½, ¼ und ⅛.`);
    show('m-sum', `${binary.slice(5)}₂ = ${[...binary.slice(5)].map((bit, i) => `${bit}·${2 ** (2 - i)}`).join(' + ')} = ${m}`);
    show('m-fraction', `Nachkommaanteil:\n${binary[5]}·½ + ${binary[6]}·¼ + ${binary[7]}·⅛ = ${m}/8 = ${decimal(m / 8)}`);
    show('m-calc', `Mit führender ${e === 0 ? 0 : 1}:\n${e === 0 ? 0 : 1} + ${decimal(m / 8)} = ${decimal(significand)}`);
    const shift = exponent === 0 ? 'Das Komma bleibt an seiner Stelle.' : `Die Multiplikation mit 2^(${exponent}) verschiebt das Binärkomma um ${Math.abs(exponent)} Stellen nach ${exponent > 0 ? 'rechts' : 'links'}.`;
    show('normalization', `${s ? '−' : ''}${e === 0 ? 0 : 1},${binary.slice(5)}₂ · 2^(${exponent}). ${shift}`);
    show('formula', e === 0 ? 'Wert = (−1)^S · 2^(−6) · (M/8)' : 'Wert = (−1)^S · 2^(E−7) · (1 + M/8)');
    show('calculation', `${s ? '(−1)' : '(+1)'} · ${decimal(factor)} · ${decimal(significand)} = ${decimal(stored)}`);
    show('byte', `Zusammen ein Byte: ${binary[0]} ${binary.slice(1, 5)} ${binary.slice(5)} → ${binary}`);
  } catch (error) {
    el('result').hidden = true;
    el('number').setAttribute('aria-invalid', 'true');
    el('input-status').dataset.error = 'true';
    show('input-status', error.message);
  }
}
el('number-form').addEventListener('submit', event => { event.preventDefault(); update(); });
el('number').addEventListener('input', update);
document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => {
  el('number').value = button.dataset.example; update();
}));
update();
