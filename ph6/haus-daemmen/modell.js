/* Didaktisches Wärmebilanzmodell. Längen in m, Leistung in W, Zeit in s. */
"use strict";

const materials = {
  wolle: { name: "Mineralwolle", conductivity: 0.037, color: "#f5cb76" },
  eps: { name: "Styropor", conductivity: 0.035, color: "#cbd8f7" },
  holzfaser: { name: "Holzfaser", conductivity: 0.045, color: "#dba679" },
  kork: { name: "Kork", conductivity: 0.042, color: "#d39380" },
  holz: { name: "Massivholz", conductivity: 0.13, color: "#a9c38c" },
  aerogel: { name: "Aerogel-Dämmplatte", conductivity: 0.015, color: "#a5dad6" },
  ziegel: { name: "Vollziegel", conductivity: 0.8, color: "#d98f79" }
};

const house = {
  width: 10, depth: 7, height: 5,
  windows: { south: 8, east: 4, west: 4, north: 0 }
};

const stepHours = 0.25;
const stepSeconds = stepHours * 3600;
const bareResistance = 0.13 + 0.20 / 2.1 + 0.04;
const capacity = 24e6;
const surfaces = [
  { side: "south", wall: house.width * house.height, glass: house.windows.south, summer: [7, 19, 500], winter: [8, 16, 340] },
  { side: "east", wall: house.depth * house.height, glass: house.windows.east, summer: [5, 13, 520], winter: [8, 12, 130] },
  { side: "west", wall: house.depth * house.height, glass: house.windows.west, summer: [13, 21, 520], winter: [12, 16, 130] },
  { side: "north", wall: house.width * house.height, glass: house.windows.north, summer: [5, 21, 65], winter: [8, 16, 35] }
];

function insulationResistance(layers) {
  return layers.reduce((sum, layer) => sum + layer.cm / 100 / materials[layer.kind].conductivity, 0);
}

function sunlight(hour, [start, end, peak]) {
  if (hour <= start || hour >= end) return 0;
  return peak * Math.sin(Math.PI * (hour - start) / (end - start));
}

function weather(season, hour) {
  const warm = (1 + Math.cos(2 * Math.PI * (hour - 15) / 24)) / 2;
  return season === "summer" ? 21 + 14 * warm : -15 + 5 * warm;
}

function heatBalance(season, hour, layers, shutters = {}) {
  const outside = weather(season, hour);
  const wallU = 1 / (bareResistance + insulationResistance(layers));
  const roofArea = house.width * house.depth;
  const volume = roofArea * house.height;
  const airConductance = volume * 0.5 * 0.34;
  const roofConductance = roofArea * 0.45;
  const groundConductance = roofArea * 0.45;
  const roofSun = sunlight(hour, season === "summer" ? [5, 21, 750] : [8, 16, 280]);
  let conductance = airConductance + roofConductance + groundConductance;
  let heat = airConductance * outside + roofConductance * (outside + roofSun * 0.6 / 20)
    + groundConductance * (season === "summer" ? 17 : 9);

  for (const face of surfaces) {
    const sun = sunlight(hour, face[season]);
    const wallConductance = (face.wall - face.glass) * wallU;
    const glassConductance = face.glass * 1.5;
    const shadedFraction = face.side === "south"
      ? (Number(Boolean(shutters.southLeft)) + Number(Boolean(shutters.southRight))) / 2
      : Number(Boolean(shutters[face.side]));
    const sunlitGlass = face.glass * (1 - shadedFraction);
    conductance += wallConductance + glassConductance;
    heat += wallConductance * (outside + sun * 0.6 / 20)
      + glassConductance * outside + sunlitGlass * sun * 0.55;
  }
  return { outside, conductance, heat };
}

function simulateDay(season, layers, shutters) {
  const points = [];
  let inside = 22;
  for (let i = 0; i <= 24 / stepHours; i++) {
    const hour = i * stepHours;
    const { outside, conductance, heat } = heatBalance(season, hour, layers, shutters);
    const heating = Math.max(0, 20 * conductance - heat) / 1000;
    points.push({ hour, outside, inside, heating });
    const equilibrium = heat / conductance;
    inside = equilibrium + (inside - equilibrium) * Math.exp(-conductance * stepSeconds / capacity);
  }
  return points;
}

function simulateBox(season, layers, shaded = false) {
  const outside = season === "summer" ? 35 : -15;
  const peakSun = season === "summer" ? 650 : 180;
  const windowArea = 0.5;
  const wallArea = 6 - windowArea;
  const windowConductance = windowArea * 1.5;
  const wallConductance = wallArea / (bareResistance + insulationResistance(layers));
  const conductance = wallConductance + windowConductance;
  // The air and the inner surfaces share a temperature and a heat capacity.
  const boxCapacity = 120000;
  const duration = 8;
  const decay = Math.exp(-conductance * stepSeconds / boxCapacity);
  const points = [];
  let inside = 20;

  for (let i = 0; i <= duration / stepHours; i++) {
    const hour = i * stepHours;
    points.push({ hour, inside });
    const sun = shaded ? 0 : sunlight(hour + stepHours / 2, [0, duration, peakSun]);
    const solarGain = windowArea * sun * 0.55;
    const equilibrium = outside + solarGain / conductance;
    inside = equilibrium + (inside - equilibrium) * decay;
  }
  return points;
}
