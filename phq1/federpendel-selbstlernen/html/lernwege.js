const pathSections = [...document.querySelectorAll('.learning-path')];
const choiceButtons = [...document.querySelectorAll('.path-choice-button')];

function typeset(element) {
  if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
    window.MathJax.typesetPromise([element]).catch(() => {});
  }
}

function openPath(name) {
  for (const section of pathSections) section.hidden = section.id !== name;
  for (const button of choiceButtons) button.setAttribute('aria-pressed', String(button.dataset.openPath === name));
  const selected = document.getElementById(name);
  typeset(selected);
  selected.scrollIntoView({ block: 'start' });
}

document.querySelectorAll('[data-open-path]').forEach(button => {
  button.addEventListener('click', () => openPath(button.dataset.openPath));
});

document.querySelectorAll('.reveal-answer').forEach(button => {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-expanded') === 'true') return;
    const answer = document.getElementById(button.getAttribute('aria-controls'));
    const next = document.getElementById(button.dataset.next);
    answer.hidden = false;
    next.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    button.lastElementChild.textContent = 'Antwort sichtbar ✓';
    typeset(answer);
    typeset(next);
  });
});
