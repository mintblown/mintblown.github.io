import { operators } from "./operators-data.js";

const selector = document.querySelector("[data-operator]");
const head = document.querySelector("#table-head");
const body = document.querySelector("#table-body");
const feedback = document.querySelector("#feedback");
const answers = { and: [], or: [], not: [] };
const rowsFor = operator => operator.inputs.length === 1 ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];

function showTable() {
  const operator = operators[selector.value];
  document.querySelector("#context").textContent =
    operator.device + " · " + operator.inputs.map((name, index) => "AB"[index] + " = " + name).join(" · ");
  document.querySelector("#table-caption").textContent = "Wahrheitstabelle für " + operator.formula;
  head.innerHTML = "<tr>" + operator.inputs.map((_, index) => '<th scope="col">' + "AB"[index] + "</th>").join("") +
    '<th scope="col">' + operator.formula + '</th><th scope="col">Prüfung</th></tr>';
  body.innerHTML = rowsFor(operator).map((row, index) =>
    "<tr>" + row.map(value => "<td>" + value + "</td>").join("") +
    '<td><select aria-label="Ausgang für ' + row.map((value, input) => "AB"[input] + " gleich " + value).join(", ") +
    '"><option value="">–</option><option>0</option><option>1</option></select></td><td></td></tr>'
  ).join("");
  Array.from(body.querySelectorAll("select")).forEach((input, index) => {
    input.value = answers[selector.value][index] ?? "";
    input.addEventListener("change", () => {
      answers[selector.value][index] = input.value;
      input.closest("tr").lastElementChild.textContent = "";
      feedback.textContent = "";
    });
  });
  feedback.textContent = "";
}

document.querySelector("#check-table").addEventListener("click", () => {
  const operator = operators[selector.value];
  const rows = rowsFor(operator);
  let correct = 0;
  Array.from(body.rows).forEach((row, index) => {
    const actual = row.querySelector("select").value;
    const expected = String(Number(operator.apply(...rows[index])));
    if (actual === expected) correct += 1;
    row.lastElementChild.textContent = actual === "" ? "Offen" : actual === expected ? "Richtig" : "Erneut prüfen";
  });
  feedback.textContent = correct === rows.length
    ? "Alle Zeilen stimmen. Erklären Sie, woran Sie die 1-Zeilen erkennen."
    : correct + " von " + rows.length + " Zeilen stimmen.";
});

selector.addEventListener("change", showTable);
showTable();
