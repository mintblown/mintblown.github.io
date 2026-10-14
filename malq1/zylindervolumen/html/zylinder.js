'use strict';
const radiusInput = document.getElementById('radius');
const heightInput = document.getElementById('height');
const sectionInput = document.getElementById('section-view');
const format = value => value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
let radius = 6;
let height = 16;
function render() {
  radiusInput.value = radius;
  heightInput.value = height;
  // Keep full precision in the geometry; slider positions and labels are rounded only for display.
  radiusInput.setAttribute('aria-valuetext', `${format(radius)} Längeneinheiten`);
  heightInput.setAttribute('aria-valuetext', `${format(height)} Längeneinheiten`);
  document.getElementById('radius-value').textContent = `${format(radius)} LE`;
  document.getElementById('height-value').textContent = `${format(height)} LE`;
  const volume = Math.PI * radius * radius * height;
  document.getElementById('volume-value').textContent = `${format(volume)} VE`;
  document.getElementById('share-value').textContent = `${format(volume / (4 / 3 * Math.PI * 1000) * 100)} % des Kugelvolumens · VE = Volumeneinheiten`;
  document.getElementById('degenerate').textContent = radius === 0 || height === 0 ? 'Grenzfall: Der Zylinder hat kein Volumen.' : '';
  const section = sectionInput.checked;
  const x = 270, y = 250, scale = 19;
  const rx = radius * scale;
  const tilt = section ? 0 : 0.32;
  const ry = rx * tilt;
  const half = height / 2 * scale * Math.sqrt(1 - tilt * tilt);
  const top = y - half, bottom = y + half;
  document.getElementById('cylinder').innerHTML = section
    ? `<rect x="${x-rx}" y="${top}" width="${2*rx}" height="${2*half}" fill="#15988a33" stroke="#137d73" stroke-width="2.5"/>`
    : `<path d="M ${x-rx} ${top} A ${rx} ${ry} 0 0 0 ${x+rx} ${top} L ${x+rx} ${bottom} A ${rx} ${ry} 0 0 1 ${x-rx} ${bottom} Z" fill="#15988a40" stroke="#137d73" stroke-width="2"/><ellipse cx="${x}" cy="${bottom}" rx="${rx}" ry="${ry}" fill="#15988a15" stroke="#137d73" stroke-width="2" stroke-dasharray="5 4"/><ellipse cx="${x}" cy="${top}" rx="${rx}" ry="${ry}" fill="#62caba66" stroke="#137d73" stroke-width="2.5"/>`;
  document.getElementById('geometry').innerHTML = section
    ? `<path d="M ${x} ${y} L ${x+rx} ${y} L ${x+rx} ${top} Z" fill="#d48c5018" stroke="#b06c31" stroke-width="2"/><text x="${x+rx/2}" y="${y+23}" text-anchor="middle" fill="#126b64" font-size="17">r</text><text x="${x+rx+12}" y="${y-half/2}" fill="#126b64" font-size="17">h/2</text><text x="${x+rx/2-22}" y="${y-half/2-12}" fill="#9a5733" font-size="17">10</text>`
    : `<path d="M ${x} ${top} L ${x+rx} ${top}" stroke="#126b64" stroke-width="2"/><text x="${x+rx/2}" y="${top-12}" fill="#126b64" font-size="17">r</text><path d="M ${x+rx+20} ${top} V ${bottom}" stroke="#126b64" stroke-width="2"/><text x="${x+rx+28}" y="${y+6}" fill="#126b64" font-size="17">h</text>`;
  document.getElementById('scene-description').textContent = `Kugelradius 10 LE. Zylinderradius ${format(radius)} LE, Höhe ${format(height)} LE. ${section ? 'Axialschnitt mit rechtwinkligem Dreieck.' : 'Räumliche Ansicht.'}`;
}
radiusInput.addEventListener('input', () => {
  radius = Number(radiusInput.value);
  height = 2 * Math.sqrt(Math.max(0, 100 - radius * radius));
  render();
});
heightInput.addEventListener('input', () => {
  height = Number(heightInput.value);
  radius = Math.sqrt(Math.max(0, 100 - height * height / 4));
  render();
});
sectionInput.addEventListener('change', render);
document.getElementById('reset').addEventListener('click', () => { radius = 6; height = 16; render(); });
render();
