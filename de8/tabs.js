const tabList = document.querySelector("#blog-tabs");
const entries = Array.from(document.querySelectorAll(".blog-entry"));

function selectTab(index) {
  tabs.forEach((tab, position) => {
    const selected = position === index;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    entries[position].hidden = !selected;
  });
}

const tabs = entries.map((entry, index) => {
  const heading = document.getElementById(entry.getAttribute("aria-labelledby"));
  const tab = document.createElement("button");
  tab.type = "button";
  tab.id = "tab-" + entry.id;
  tab.textContent = heading.textContent;
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-controls", entry.id);
  tab.addEventListener("click", () => selectTab(index));
  entry.setAttribute("role", "tabpanel");
  entry.setAttribute("aria-labelledby", tab.id);
  entry.tabIndex = 0;
  tabList.append(tab);
  return tab;
});

tabList.setAttribute("role", "tablist");
tabList.setAttribute("aria-label", "Blogeinträge");
tabList.addEventListener("keydown", event => {
  const index = tabs.indexOf(event.target);
  if (index === -1) return;

  let next;
  switch (event.key) {
    case "ArrowRight": next = (index + 1) % tabs.length; break;
    case "ArrowLeft": next = (index + tabs.length - 1) % tabs.length; break;
    case "Home": next = 0; break;
    case "End": next = tabs.length - 1; break;
    default: return;
  }

  event.preventDefault();
  selectTab(next);
  tabs[next].focus();
});

selectTab(0);
tabList.hidden = false;
