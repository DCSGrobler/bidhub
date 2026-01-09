import { QUAL_QUESTIONS } from "./constants.js";

function normaliseAnswer(a) {
  return String(a || "").trim();
}

export function scoreQualification(answers) {
  const critical = QUAL_QUESTIONS.critical.map((q) => ({
    q,
    a: normaliseAnswer(answers.critical?.[q]),
  }));
  const criticalFailed = critical.some((x) => x.a === "No" || x.a === "");

  const evalRows = QUAL_QUESTIONS.evaluation.map((q) => ({
    q,
    a: normaliseAnswer(answers.evaluation?.[q]),
  }));
  const evalScore = evalRows.reduce(
    (s, x) => s + (x.a === "Yes" ? 2 : x.a === "Partial" ? 1 : 0),
    0
  );
  const evalMax = evalRows.length * 2;
  const evalPct = evalMax ? Math.round((evalScore / evalMax) * 100) : 0;

  const enhancedRows = QUAL_QUESTIONS.enhanced.map((q) => ({
    q,
    a: normaliseAnswer(answers.enhanced?.[q]),
  }));
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

function elById(id) {
  return id ? document.getElementById(id) : null;
}

function requiredEl(el, name) {
  if (!el) throw new Error(`Qualification modal is missing required element: ${name}`);
  return el;
}

/**
 * Flexible binder:
 * - Works whether app.js passes DOM elements or just ids or nothing.
 * - Falls back to common ids used in index.html.
 */
export function bindQualificationModal(args = {}) {
  const {
    modalEl: modalElIn,
    closeBtn: closeBtnIn,
    cancelBtn: cancelBtnIn,
    saveBtn: saveBtnIn,
    summaryEl: summaryElIn,
    formMount: formMountIn,
    onSave,
  } = args;

  // Support passing ids as strings OR elements OR nothing.
  const modalEl =
    typeof modalElIn === "string" ? elById(modalElIn) : modalElIn || elById("qualificationModal");
  const closeBtn =
    typeof closeBtnIn === "string" ? elById(closeBtnIn) : closeBtnIn || elById("qualCloseBtn");
  const cancelBtn =
    typeof cancelBtnIn === "string" ? elById(cancelBtnIn) : cancelBtnIn || elById("qualCancelBtn");
  const saveBtn =
    typeof saveBtnIn === "string" ? elById(saveBtnIn) : saveBtnIn || elById("qualSaveBtn");
  const summaryEl =
    typeof summaryElIn === "string" ? elById(summaryElIn) : summaryElIn || elById("qualSummary");
  const formMount =
    typeof formMountIn === "string" ? elById(formMountIn) : formMountIn || elById("qualFormMount");

  // Fail fast with a useful message if markup ids differ
  requiredEl(modalEl, "qualificationModal");
  requiredEl(closeBtn, "qualCloseBtn");
  requiredEl(cancelBtn, "qualCancelBtn");
  requiredEl(saveBtn, "qualSaveBtn");
  requiredEl(summaryEl, "qualSummary");
  requiredEl(formMount, "qualFormMount");

  const state = {
    bidId: "",
    answers: { critical: {}, evaluation: {}, enhanced: {} },
  };

  function setAnswer(group, question, value) {
    state.answers[group] = state.answers[group] || {};
    state.answers[group][question] = value;
    updateSummary();
  }

  function makeSelect(group, question, options) {
    const sel = document.createElement("select");

    for (const opt of options) {
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

  function renderSection(title, groupKey, questions, options) {
    const sec = document.createElement("div");
    sec.className = "q-section";

    const h = document.createElement("div");
    h.className = "q-title";
    h.textContent = title;
    sec.appendChild(h);

    for (const q of questions) {
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

  function updateSummary() {
    const s = scoreQualification(state.answers);
    summaryEl.innerHTML = "";

    const chips = [
      { label: `Evaluation: ${s.evalPct}%`, cls: "badge secondary" },
      { label: `Enhanced: ${s.enhPct}%`, cls: "badge secondary" },
      {
        label: `Recommendation: ${s.recommendation}`,
        cls:
          s.recommendation === "Proceed"
            ? "badge success"
            : s.recommendation === "Proceed with Caution"
              ? "badge warn"
              : "badge",
      },
    ];

    for (const c of chips) {
      const el = document.createElement("span");
      el.className = c.cls;
      el.textContent = c.label;
      summaryEl.appendChild(el);
    }
  }

  function renderForm() {
    formMount.innerHTML = "";

    const grid = document.createElement("div");
    grid.className = "q-grid";

    grid.appendChild(
      renderSection("Critical (must-have)", "critical", QUAL_QUESTIONS.critical, ["", "Yes", "No"])
    );
    grid.appendChild(
      renderSection("Evaluation", "evaluation", QUAL_QUESTIONS.evaluation, ["", "Yes", "Partial", "No"])
    );
    grid.appendChild(
      renderSection("Enhanced opportunity", "enhanced", QUAL_QUESTIONS.enhanced, ["", "Yes", "No"])
    );

    formMount.appendChild(grid);
  }

  function open({ bidId, initial } = {}) {
    state.bidId = bidId || "";
    state.answers = initial || { critical: {}, evaluation: {}, enhanced: {} };
    renderForm();
    updateSummary();
    modalEl.style.display = "flex";
  }

  function close() {
    modalEl.style.display = "none";
    state.bidId = "";
  }

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) close();
  });

  closeBtn.addEventListener("click", close);
  cancelBtn.addEventListener("click", close);

  saveBtn.addEventListener("click", () => {
    const score = scoreQualification(state.answers);
    const handler = typeof onSave === "function" ? onSave : () => {};
    handler({ bidId: state.bidId, answers: state.answers, score });
    close();
  });

  return { open, close };
}

export function createQualificationController(args) {
  const controller = bindQualificationModal(args);
  controller.onSave = typeof args?.onSave === "function" ? args.onSave : () => {};
  return controller;
}
