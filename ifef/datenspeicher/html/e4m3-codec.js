'use strict';
function floatDecode(byte) {
  const sign = byte & 128 ? -1 : 1, exponent = (byte >> 3) & 15, mantissa = byte & 7;
  if (exponent === 15 && mantissa === 7) return NaN;
  return sign * (exponent === 0 ? 2 ** -6 * mantissa / 8 : 2 ** (exponent - 7) * (1 + mantissa / 8));
}
function floatEncode(value) {
  if (Number.isNaN(value)) return 127;
  if (!Number.isFinite(value) || Math.abs(value) > 448) throw Error('E4M3: Bitte eine Zahl von −448 bis 448 oder NaN eingeben.');
  let best = 0, distance = Infinity;
  for (let b = 0; b < 127; b++) {
    const delta = Math.abs(floatDecode(b) - Math.abs(value));
    if (delta < distance || (delta === distance && b % 2 === 0)) { best = b; distance = delta; }
  }
  return best | (value < 0 || Object.is(value, -0) ? 128 : 0);
}
