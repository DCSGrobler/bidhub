import { QUAL_QUESTIONS } from "./constants.js";

function normaliseAnswer(a){
  return String(a || "").trim();
}

export function scoreQualification(answers){
  // Critical: Yes/No
  const critical = QUAL_QUESTIONS.critical.map(q => ({ q, a: normaliseAnswer(answers.critical?.[q]) }));
  const criticalFailed = critical.some(x => x.a === "No" || x.a === "");

  // Evaluation: Yes / Partial / No
  const evalRows = QUAL_QUESTIONS.evaluation.map(q => ({ q, a: normaliseAnswer(answers.evaluation?.[q]) }));
  const evalScore = evalRows.reduce((s, x) => s + (x.a === "Yes" ? 2 : x.a === "Partial" ? 1 : 0), 0);
  const evalMax = evalRows.length * 2;
  const evalPct = evalMax ? Math.round((evalScore / evalMax) * 100) : 0;

  // Enhanced: Yes/No
  const enhancedRows = QUAL_QUESTIONS.enhanced.map(q => ({ q, a: normaliseAnswer(answers.enhanced?.[q]) }));
  const enhScore = enhancedRows.reduce((s, x) => s + (x.a === "Yes" ? 1 : 0), 0);
  const enhMax = enhancedRows.length;
  const enhPct = enhMax ? Math.round((enhScore / enhMax) * 100) : 0;

  let recommendation = "Proceed";
  if (criticalFailed) recommendation = "Do Not Proceed";
  else if (evalPct < 55) recommendation = "Proceed with Caution";

  return {
    criticalFailed,
    evalScore,
    evalMax,
    evalPct,
    enhScore,
    enhMax,
    enhPct,
    recommendation,
  };
}

export function bindQualificationModal({
  modalEl,
  closeBtn,
  cancelBtn,
  saveBtn,
  summaryEl,
  formMount,
  onSave,
}){
  const state = {
    bidId: "",
    answers: { critical: {}, evaluation: {}, enhanced: {} },
  };

  function open({ bidId, initial }){
    state.bidId = bidId;
    state.answers = initial || { critical: {}, evaluation: {}, enhanced: {} };
    renderForm();
    modalEl.style.display = "flex";
    updateSummary();
  }

  function close(){
    modalEl.style.display = "none";
    state.bidId = "";
  }

  function setAnswer(group, question, value){
    state.answers[group] = state.answers[group] || {};
    state.answers[group][question] = value;
    updateSummary();
  }

  function makeSelect(group, question, options){
    const sel = document.createElement("select");
    for (const opt of options){
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      sel.appendChild(o);
    }
    const cur = state.answers[group]?.[question] || "";
    sel.value = options.includes(cur) ? cur : "";
    sel.addEventListener("change", () => setAnswer(group, question, sel.value));
    return sel;
  }

  function renderSection(title, groupKey, questions, options){
    const sec = document.createElement("div");
    sec.className = "q-section";

    const h = document.createElement("div");
    h.className = "q-title";
    h.textContent = title;
    sec.appendChild(h);

    for (const q of questions){
      const row = document.createElement("div");
      row.className = "q-row";

      const qEl = document.createElement("div");
      qEl.className = "q";
      qEl.textContent = q;

      const sel = makeSelect(groupKey, q, options);

      row.appendChild(qEl);
      row.appendChild(sel);
      sec.appendChild(row);
    }

    return sec;
  }

  function updateSummary(){
    const s = scoreQualification(state.answers);
    summaryEl.innerHTML = "";

    const chips = [
      { label: `Evaluation: ${s.evalPct}%`, cls: "badge secondary" },
      { label: `Enhanced: ${s.enhPct}%`, cls: "badge secondary" },
      { label: `Recommendation: ${s.recommendation}`, cls: s.recommendation === "Proceed" ? "badge success" : s.recommendation === "Proceed with Caution" ? "badge warn" : "badge" },
    ];

    for (const c of chips){
      const el = document.createElement("span");
      el.className = c.cls;
      el.textContent = c.label;
      summaryEl.appendChild(el);
    }
  }

  function renderForm(){
    formMount.innerHTML = "";

    const grid = document.createElement("div");
    grid.className = "q-grid";

    grid.appendChild(renderSection("Critical (must-have)", "critical", QUAL_QUESTIONS.critical, ["", "Yes", "No"]));
    grid.appendChild(renderSection("Evaluation", "evaluation", QUAL_QUESTIONS.evaluation, ["", "Yes", "Partial", "No"]));
    grid.appendChild(renderSection("Enhanced opportunity", "enhanced", QUAL_QUESTIONS.enhanced, ["", "Yes", "No"]));

    formMount.appendChild(grid);
  }

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) close();
  });

  closeBtn.addEventListener("click", close);
  cancelBtn.addEventListener("click", close);

  saveBtn.addEventListener("click", () => {
    const score = scoreQualification(state.answers);
    onSave?.({ bidId: state.bidId, answers: state.answers, score });
    close();
  });

  return { open, close };
}
// Compatibility export expected by app.js
export function createQualificationController(args){
  return bindQualificationModal(args);
}
