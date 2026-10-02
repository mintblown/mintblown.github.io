'use strict';
class LifeEngine {
  constructor(size = 256) {
    this.size = size;
    this.current = new Uint8Array(size * size);
    this.next = new Uint8Array(size * size);
  }
  step() {
  for (let y = 0; y < this.size; y++) {
    const row = y * this.size;
    const above = ((y + this.size - 1) % this.size) * this.size;
    const below = ((y + 1) % this.size) * this.size;
    for (let x = 0; x < this.size; x++) {
      const left = (x + this.size - 1) % this.size;
      const right = (x + 1) % this.size;
      const neighbors = this.current[above + left] + this.current[above + x] + this.current[above + right]
        + this.current[row + left] + this.current[row + right]
        + this.current[below + left] + this.current[below + x] + this.current[below + right];
      this.next[row + x] = neighbors === 3 || (neighbors === 2 && this.current[row + x]) ? 1 : 0;
    }
  }
  [this.current, this.next] = [this.next, this.current];
}

}
