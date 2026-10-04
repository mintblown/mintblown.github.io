'use strict';
const worksheetPatterns = {
  block: { period: 1, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  blinker: { period: 2, cells: [[0, 0], [1, 0], [2, 0]] },
  toad: { period: 2, cells: [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]] },
  beacon: { period: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1], [2, 2], [3, 2], [2, 3], [3, 3]] },
  glider: { period: 4, cells: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]] },
  // Standard patterns: https://conwaylife.com/patterns/
  lwss: { period: 4, cells: [[1, 0], [4, 0], [0, 1], [0, 2], [4, 2], [0, 3], [1, 3], [2, 3], [3, 3]] },
  gun: { period: 30, cells: [
    [24, 0], [22, 1], [24, 1], [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2],
    [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3],
    [0, 4], [1, 4], [10, 4], [16, 4], [20, 4], [21, 4],
    [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5], [22, 5], [24, 5],
    [10, 6], [16, 6], [24, 6], [11, 7], [15, 7], [12, 8], [13, 8]
  ] }
};
// The worksheet's spaceship points right (mirror of the structures-page LWSS).
worksheetPatterns.lwss.cells = worksheetPatterns.lwss.cells.map(([x, y]) => [4 - x, y]);
worksheetPatterns.pulsar = { period: 3, cells: [] };
for (const fixed of [0, 5, 7, 12]) {
  for (const moving of [2, 3, 4, 8, 9, 10]) {
    worksheetPatterns.pulsar.cells.push([moving, fixed], [fixed, moving]);
  }
}
