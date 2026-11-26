export const operators = {
  and: {
    formula: "A ∧ B", inputs: ["Erde trocken", "Tank gefüllt"], device: "Pumpe",
    apply: (a, b) => a && b,
    observation: "Was passiert, wenn die Erde trocken ist, aber im Tank kein Wasser mehr ist?"
  },
  or: {
    formula: "A ∨ B", inputs: ["Zu heiß", "Zu feucht"], device: "Lüftung",
    apply: (a, b) => a || b,
    observation: "Was passiert, wenn es gleichzeitig zu heiß und zu feucht ist?"
  },
  not: {
    formula: "¬A", inputs: ["Es ist hell"], device: "Testlampe",
    apply: a => !a,
    observation: "Wann hat die Aussage „Es ist hell“ den entgegengesetzten Wert zum Ausgang?"
  }
};
