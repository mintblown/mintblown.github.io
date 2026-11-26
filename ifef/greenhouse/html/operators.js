import { operators } from "./operators-data.js";

const selector = document.querySelector("[data-operator]");
const switches = document.querySelector("#switches");

function showOperator() {
  const operator = operators[selector.value];
  document.querySelector("#example").textContent = operator.device;
  document.querySelector("#observation").textContent = operator.observation;
  switches.innerHTML = operator.inputs.map((label, index) =>
    '<label class="choice"><input type="checkbox"> <span>' +
    "AB"[index] + " · " + label + '</span><strong>0</strong></label>'
  ).join("");

  function update() {
    const states = Array.from(switches.querySelectorAll("input"), input => {
      input.closest("label").querySelector("strong").textContent = Number(input.checked);
      return input.checked;
    });
    const on = operator.apply(...states);
    const values = states.length === 1 ? "¬" + Number(states[0])
      : states.map(Number).join(selector.value === "and" ? " ∧ " : " ∨ ");
    document.querySelector("#formula").textContent = operator.formula + " = " + values + " = " + Number(on);
    document.querySelector("#device").textContent = operator.device + (on ? " an" : " aus");
  }

  switches.onchange = update;
  update();
}

selector.addEventListener("change", showOperator);
showOperator();
