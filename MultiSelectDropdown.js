export function createMultiSelectDropdown({
  mount,
  label = "Select",
  options = [],
  value = [],
  onChange,
  placeholder = "Choose...",
  helpText = "",
}){
  if (!mount) throw new Error("mount is required");

  const root = document.createElement("div");
  root.className = "dropdown";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn";
  btn.style.justifyContent = "space-between";
  btn.style.width = "100%";

  const btnLeft = document.createElement("div");
  btnLeft.style.display = "flex";
  btnLeft.style.alignItems = "center";
  btnLeft.style.gap = "10px";

  const btnText = document.createElement("span");
  btnText.style.fontSize = "13px";
  btnText.style.color = "var(--text)";

  const btnCount = document.createElement("span");
  btnCount.className = "badge secondary";

  const caret = document.createElement("span");
  caret.className = "muted";
  caret.textContent = "▾";

  btnLeft.appendChild(btnText);
  btnLeft.appendChild(btnCount);
  btn.appendChild(btnLeft);
  btn.appendChild(caret);

  const panel = document.createElement("div");
  panel.className = "dropdown-panel";

  const items = document.createElement("div");
  panel.appendChild(items);

  if (helpText){
    const help = document.createElement("div");
    help.className = "dropdown-help";
    help.textContent = helpText;
    panel.appendChild(help);
  }

  function normalise(v){
    return Array.isArray(v) ? v.filter(Boolean) : [];
  }

  function render(){
    const current = new Set(normalise(value));
    const selectedLabels = options.filter(o => current.has(o.value)).map(o => o.label);
    btnText.textContent = selectedLabels.length ? selectedLabels.slice(0, 3).join(", ") + (selectedLabels.length > 3 ? "…" : "") : placeholder;
    btnCount.textContent = selectedLabels.length ? `${selectedLabels.length}` : "0";

    items.innerHTML = "";
    for (const opt of options){
      const row = document.createElement("label");
      row.className = "dropdown-item";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = current.has(opt.value);

      const text = document.createElement("div");
      text.className = "lbl";
      text.textContent = opt.label;

      cb.addEventListener("change", () => {
        const next = new Set(normalise(value));
        if (cb.checked) next.add(opt.value);
        else next.delete(opt.value);
        value = Array.from(next);
        render();
        onChange && onChange(value);
      });

      row.appendChild(cb);
      row.appendChild(text);
      items.appendChild(row);
    }
  }

  function open(){
    root.classList.add("open");
  }
  function close(){
    root.classList.remove("open");
  }

  btn.addEventListener("click", () => {
    root.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!root.contains(e.target)) close();
  });

  root.appendChild(btn);
  root.appendChild(panel);

  mount.innerHTML = "";
  mount.appendChild(root);

  render();

  return {
    setValue(next){ value = normalise(next); render(); },
    getValue(){ return normalise(value); },
    open,
    close,
  };
}
