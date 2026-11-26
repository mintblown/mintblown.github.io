const experimentTabs = [...document.querySelectorAll('.experiment-tabs [role="tab"]')];

function selectExperimentTab(activeTab) {
  for (const tab of experimentTabs) {
    const active = tab === activeTab;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
  }
  activeTab.focus();
}

experimentTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectExperimentTab(tab));
  tab.addEventListener('keydown', event => {
    const targetIndex = { ArrowLeft: 1 - index, ArrowRight: 1 - index, Home: 0, End: 1 }[event.key];
    if (targetIndex === undefined) return;
    event.preventDefault();
    selectExperimentTab(experimentTabs[targetIndex]);
  });
});

function setupSchematic() {
  const size = 5;
  const grid = document.querySelector('#schematic-grid');
  const pool = document.querySelector('#schematic-pool');
  const rotate = document.querySelector('#schematic-rotate');
  const putBack = document.querySelector('#schematic-return');
  const power = document.querySelector('#schematic-power');
  const status = document.querySelector('#schematic-status');
  const definitions = {
    source: { label: 'Spannungsquelle', ports: [1, 3], symbol: '<path d="M0 50H43 M57 50H100 M43 25V75 M57 36V64"/>' },
    corner: { label: 'Ecke', ports: [1, 2], symbol: '<path d="M100 50H50V100"/>' },
    straight: { label: 'Gerade', ports: [1, 3], symbol: '<path d="M0 50H100"/>' },
    lamp: { label: 'Glühlampe', ports: [1, 3], symbol: '<path d="M0 50H30 M70 50H100"/><circle cx="50" cy="50" r="20"/><path d="M36 36L64 64 M64 36L36 64"/>' },
  };
  const parts = ['source', 'corner', 'corner', 'corner', 'corner', 'straight', 'straight', 'lamp']
    .map(kind => ({ kind, cell: null, turns: 0 }));
  const board = Array(size * size).fill(null);
  const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  const directionNames = ['oben', 'rechts', 'unten', 'links'];
  let selected = null;
  let powered = false;

  function ports(part) {
    return definitions[part.kind].ports.map(direction => (direction + part.turns) % 4);
  }

  function symbol(part) {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(${part.turns * 90} 50 50)">${definitions[part.kind].symbol}</g></svg>`;
  }

  function circuitState() {
    const source = parts[0];
    if (source.cell === null) return 'open';

    let cell = source.cell;
    let direction = ports(source)[0];
    let passedLamp = false;

    // Every component has exactly two ports. Follow the only possible path.
    while (true) {
      const [rowStep, columnStep] = directions[direction];
      const row = Math.floor(cell / size) + rowStep;
      const column = cell % size + columnStep;
      if (row < 0 || row >= size || column < 0 || column >= size) return 'open';
      cell = row * size + column;
      const part = board[cell];
      const incoming = (direction + 2) % 4;
      if (!part) return 'open';
      const connections = ports(part);
      if (!connections.includes(incoming)) return 'open';
      if (part === source) return passedLamp ? 'lit' : 'short';
      if (part.kind === 'lamp') passedLamp = true;
      direction = connections.find(port => port !== incoming);
    }
  }

  const poolButtons = parts.map((part, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `${definitions[part.kind].label}, Bauteil ${index + 1}`);
    button.addEventListener('click', () => {
      selected = selected === part ? null : part;
      render();
    });
    pool.append(button);
    return button;
  });

  const cells = board.map((_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.addEventListener('click', () => {
      const occupant = board[index];
      if (occupant) {
        selected = selected === occupant ? null : occupant;
      } else if (selected) {
        if (selected.cell !== null) board[selected.cell] = null;
        selected.cell = index;
        board[index] = selected;
        selected = null;
      }
      render();
    });
    grid.append(button);
    return button;
  });

  function render() {
    const state = powered ? circuitState() : 'off';
    poolButtons.forEach((button, index) => {
      const part = parts[index];
      button.hidden = part.cell !== null;
      button.setAttribute('aria-pressed', String(part === selected));
      button.innerHTML = symbol(part) + `<span>${definitions[part.kind].label}</span>`;
    });
    cells.forEach((button, index) => {
      const part = board[index];
      const position = `Zeile ${Math.floor(index / size) + 1}, Spalte ${index % size + 1}`;
      const description = part
        ? `${definitions[part.kind].label}, Anschlüsse ${ports(part).map(port => directionNames[port]).join(' und ')}`
        : 'frei';
      button.setAttribute('aria-label', `${position}: ${description}`);
      button.setAttribute('aria-pressed', String(part !== null && part === selected));
      button.classList.toggle('schematic-lit', part?.kind === 'lamp' && state === 'lit');
      button.innerHTML = part ? symbol(part) : '';
    });
    rotate.disabled = selected === null;
    putBack.disabled = selected?.cell == null;
    power.setAttribute('aria-pressed', String(powered));
    power.textContent = powered ? 'Simulation ausschalten' : 'Simulation einschalten';
    status.dataset.state = state;
    const message = {
      off: 'Simulation ausgeschaltet.',
      open: 'Stromkreis offen. Die Glühlampe bleibt aus.',
      lit: 'Stromkreis geschlossen. Die Glühlampe leuchtet.',
      short: 'Kurzschluss. Die Quelle ist direkt über Leitungen verbunden.',
    }[state];
    if (status.textContent !== message) status.textContent = message;
  }

  rotate.addEventListener('click', () => {
    selected.turns = (selected.turns + 1) % 4;
    render();
  });
  putBack.addEventListener('click', () => {
    const button = poolButtons[parts.indexOf(selected)];
    board[selected.cell] = null;
    selected.cell = null;
    render();
    button.focus();
  });
  power.addEventListener('click', () => {
    powered = !powered;
    render();
  });
  render();
}

setupSchematic();
