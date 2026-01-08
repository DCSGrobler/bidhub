import {
  STAGES,
  DELIVERY_STATUSES,
  CLOSED_STAGES,
  SCOPE_OPTIONS,
  DIFFERENTIATOR_OPTIONS,
  DEFAULT_BID,
} from "./constants.js";

import {
  saveState,
  downloadJSON,
  safeParseJSON,
  normaliseKey,
} from "./storage.js";

import {
  loadAnyExistingState,
  migrateToV2,
  initialSeedV2,
} from "./migrations.js";

import {
  workingDaysUntil,
  formatDueWithCountdown,
  todayISO,
} from "./dateUtils.js";

import { createMultiSelectDropdown } from "./MultiSelectDropdown.js";
import { createQualificationController, scoreQualification } from "./QualificationModal.js";

(function(){
  "use strict";

  // --- State bootstrap (including migration) ---
  let state;
  const existing = loadAnyExistingState();
  if (existing){
    const migrated = migrateToV2(existing.state);
    state = migrated || initialSeedV2();
    // After migration, we save under v2 key (storage.js uses current key)
    saveState(state);
  } else {
    state = initialSeedV2();
    saveState(state);
  }

  let route = { name: "list", bidId: "" };
  let activeTab = "overview";

  // --- Elements ---
  const listView = document.getElementById("listView");
  const detailView = document.getElementById("detailView");

  const backBtn = document.getElementById("backBtn");
  const newBtn = document.getElementById("newBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const clearBtn = document.getElementById("clearBtn");

  const qEl = document.getElementById("q");
  const stageEl = document.getElementById("stage");
  const ownerEl = document.getElementById("owner");
  const scopeFilterEl = document.getElementById("scopeFilter");
  const sortEl = document.getElementById("sort");

  const bidRowsEl = document.getElementById("bidRows");
  const showCountEl = document.getElementById("showCount");
  const totalCountEl = document.getElementById("totalCount");

  const kpiInProgress = document.getElementById("kpiInProgress");
  const kpiClosed = document.getElementById("kpiClosed");
  const kpiDueSoon = document.getElementById("kpiDueSoon");

  const deleteBtn = document.getElementById("deleteBtn");

  const detailTitleEl = document.getElementById("detailTitle");
  const detailMetaEl = document.getElementById("detailMeta");
  const detailPillsEl = document.getElementById("detailPills");
  const detailKpiStage = document.getElementById("detailKpiStage");
  const detailKpiDue = document.getElementById("detailKpiDue");
  const detailKpiValue = document.getElementById("detailKpiValue");
  const detailKpiUpdated = document.getElementById("detailKpiUpdated");

  const tabs = Array.from(document.querySelectorAll(".tab"));

  // Fields
  const f = {
    title: document.getElementById("f_title"),
    client: document.getElementById("f_client"),
    opportunityId: document.getElementById("f_opportunityId"),
    owner: document.getElementById("f_owner"),
    stage: document.getElementById("f_stage"),
    deliveryStatus: document.getElementById("f_deliveryStatus"),
    dateReceived: document.getElementById("f_dateReceived"),
    dueDate: document.getElementById("f_dueDate"),
    submittedDate: document.getElementById("f_submittedDate"),
    decisionDate: document.getElementById("f_decisionDate"),
    valueAud: document.getElementById("f_valueAud"),
    probability: document.getElementById("f_probability"),

    scopeSummary: document.getElementById("f_scopeSummary"),
    notes: document.getElementById("f_notes"),

    requirements: document.getElementById("f_requirements"),
    assumptions: document.getElementById("f_assumptions"),
    dependencies: document.getElementById("f_dependencies"),
    risks: document.getElementById("f_risks"),

    commercials: document.getElementById("f_commercials"),
    competitorNotes: document.getElementById("f_competitorNotes"),

    differentiatorsOther: document.getElementById("f_differentiatorsOther"),

    stakeholders: document.getElementById("f_stakeholders"),
    resourcing: document.getElementById("f_resourcing"),
    nextSteps: document.getElementById("f_nextSteps"),
  };

  // Mount points for dropdowns
  const scopeMount = document.getElementById("f_scopeSelect");
  const diffMount = document.getElementById("f_diffSelect");

  // Import modal
  const importModal = document.getElementById("importModal");
  const importClose = document.getElementById("importClose");
  const importCancel = document.getElementById("importCancel");
  const importDo = document.getElementById("importDo");
  const importText = document.getElementById("importText");
  const importError = document.getElementById("importError");

  // New bid modal
  const newBidModal = document.getElementById("newBidModal");
  const newBidClose = document.getElementById("newBidClose");
  const newBidSkip = document.getElementById("newBidSkip");
  const newBidStartQual = document.getElementById("newBidStartQual");

  // Qualification modal controller
  const qual = createQualificationController({
    modalEl: document.getElementById("qualModal"),
    closeBtn: document.getElementById("qualClose"),
    cancelBtn: document.getElementById("qualCancel"),
    saveBtn: document.getElementById("qualSave"),
    resetBtn: document.getElementById("qualReset"),
    mountEl: document.getElementById("qualMount"),
    summaryEl: document.getElementById("qualSummary"),
  });

  // Toast
  const toastEl = document.getElementById("toast");
  function toast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  function clone(obj){ return JSON.parse(JSON.stringify(obj)); }

  function uid(){
    return Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
  }

  function currencyFormatAUD(value){
    if (!value) return "";
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    try {
      return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 0,
      }).format(num);
    } catch {
      return String(value);
    }
  }

  function escapeHtml(s){
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getBids(){ return state.bids || []; }

  function currentBid(){
    return getBids().find(b => b.id === route.bidId) || null;
  }

  function setRoute(next){
    route = next;
    state.ui = state.ui || { lastSelectedBidId: "" };
    if (route.name === "detail") state.ui.lastSelectedBidId = route.bidId;
    saveState(state);
    render();
  }

  function updateBid(nextBid){
    nextBid.updatedAt = new Date().toISOString();
    state.bids = getBids().map(b => b.id === nextBid.id ? nextBid : b);
    saveState(state);
    renderDetailHeader();
  }

  function deliveryMeta(deliveryStatus){
    const m = DELIVERY_STATUSES.find(x => x.value === deliveryStatus);
    return m || DELIVERY_STATUSES[0];
  }

  function isClosedByStage(stage){
    return CLOSED_STAGES.has(stage);
  }

  function isOpenBid(b){
    return !isClosedByStage(b.stage || "");
  }

  function scoreBadge(probability){
    const p = Number(probability);
    if (Number.isNaN(p)) return "";
    if (p >= 70) return "High";
    if (p >= 40) return "Medium";
    return "Low";
  }

  function toArray(v){
    if (Array.isArray(v)) return v;
    if (!v) return [];
    return [v];
  }

  function renderKPIs(){
    const bids = getBids();
    const inProgress = bids.filter(b => isOpenBid(b)).length;
    const closed = bids.filter(b => !isOpenBid(b)).length;
    const dueSoon = bids.filter(b => {
      if (!isOpenBid(b)) return false;
      const wd = workingDaysUntil(b.dueDate);
      return wd !== null && wd >= 0 && wd <= 14;
    }).length;

    kpiInProgress.textContent = String(inProgress);
    kpiClosed.textContent = String(closed);
    kpiDueSoon.textContent = String(dueSoon);
  }

  function setOptions(selectEl, options, { includeAll=false, allLabel="All" } = {}){
    selectEl.innerHTML = "";
    if (includeAll){
      const o = document.createElement("option");
      o.value = "all";
      o.textContent = allLabel;
      selectEl.appendChild(o);
    }
    for (const v of options){
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      selectEl.appendChild(o);
    }
  }

  function renderListFilters(){
    const bids = getBids();

    setOptions(stageEl, STAGES, { includeAll:true, allLabel:"All stages" });
    if (!stageEl.value) stageEl.value = "all";

    const owners = Array.from(new Set(bids.map(b => String(b.owner||"").trim()).filter(Boolean)))
      .sort((a,b) => a.localeCompare(b));
    setOptions(ownerEl, owners, { includeAll:true, allLabel:"All owners" });
    if (!ownerEl.value) ownerEl.value = "all";

    // Scope filter (Any scope)
    scopeFilterEl.innerHTML = "";
    {
      const o = document.createElement("option");
      o.value = "any";
      o.textContent = "Any scope";
      scopeFilterEl.appendChild(o);
    }
    for (const opt of SCOPE_OPTIONS){
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      scopeFilterEl.appendChild(o);
    }
    if (!scopeFilterEl.value) scopeFilterEl.value = "any";

    totalCountEl.textContent = String(bids.length);
  }

  function filteredRows(){
    const bids = getBids();
    const q = String(qEl.value || "").trim().toLowerCase();
    const stage = stageEl.value;
    const owner = ownerEl.value;
    const scopeNeedle = scopeFilterEl.value;
    const sort = sortEl.value;

    let rows = bids.filter(b => {
      const hay = [
        b.bidNumber,
        b.title,
        b.client,
        b.opportunityId,
        b.owner,
        b.stage,
        deliveryMeta(b.deliveryStatus).label,
        (b.scope || []).join(","),
        b.scopeSummary,
        b.requirements,
        b.notes,
      ].filter(Boolean).join(" | ").toLowerCase();

      if (q && !hay.includes(q)) return false;
      if (stage !== "all" && b.stage !== stage) return false;
      if (owner !== "all" && String(b.owner||"").trim() !== owner) return false;

      if (scopeNeedle !== "any"){
        const arr = toArray(b.scope).map(x => String(x).toLowerCase());
        if (!arr.includes(String(scopeNeedle).toLowerCase())) return false;
      }

      return true;
    });

    rows = rows.slice();
    rows.sort((a,b) => {
      if (sort === "updated_desc") return String(b.updatedAt||"").localeCompare(String(a.updatedAt||""));
      if (sort === "updated_asc") return String(a.updatedAt||"").localeCompare(String(b.updatedAt||""));
      if (sort === "due_asc") return String(a.dueDate||"").localeCompare(String(b.dueDate||""));
      if (sort === "value_desc") return Number(b.valueAud||0) - Number(a.valueAud||0);
      return 0;
    });

    return rows;
  }

  function ragCell(deliveryStatus){
    const m = deliveryMeta(deliveryStatus);
    return `<span class="ragpill"><span class="ragdot ${m.rag}"></span>${escapeHtml(m.label)}</span>`;
  }

  function renderListTable(){
    const bids = getBids();
    const rows = filteredRows();

    showCountEl.textContent = String(rows.length);

    if (bids.length === 0){
      bidRowsEl.innerHTML = `<tr><td colspan="6" class="muted" style="padding:26px; text-align:center;">No bids yet. Click New bid to get started.</td></tr>`;
      return;
    }

    if (rows.length === 0){
      bidRowsEl.innerHTML = `<tr><td colspan="6" class="muted" style="padding:26px; text-align:center;">No bids match your filters.</td></tr>`;
      return;
    }

    bidRowsEl.innerHTML = "";

    for (const b of rows){
      const tr = document.createElement("tr");
      tr.className = "rowlink";
      tr.addEventListener("click", () => setRoute({ name:"detail", bidId:b.id }));

      const win = scoreBadge(b.probability);
      const scope = toArray(b.scope).slice(0,3).map(v => {
        const opt = SCOPE_OPTIONS.find(o => o.value === v);
        return opt ? opt.label : String(v);
      });

      const bidCell = document.createElement("td");
      bidCell.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="font-weight:700;">${escapeHtml(b.title || "Untitled bid")}</div>
          <div class="muted" style="font-size:12px;">
            ${b.bidNumber ? `Bid ID: ${escapeHtml(b.bidNumber)}` : ""}
            ${b.bidNumber && b.owner ? " • " : (b.bidNumber ? "" : "")}
            ${b.owner ? `${escapeHtml(b.owner)}` : ""}
          </div>
          <div class="pillbar">
            ${win ? `<span class="badge secondary">Win: ${escapeHtml(win)}</span>` : ""}
            ${scope.map(s => `<span class="badge">${escapeHtml(s)}</span>`).join("")}
            ${toArray(b.scope).length > 3 ? `<span class="badge">+${toArray(b.scope).length - 3}</span>` : ""}
          </div>
        </div>
      `;

      const clientCell = document.createElement("td");
      clientCell.textContent = b.client || "";

      const stageCell = document.createElement("td");
      stageCell.textContent = b.stage || "";

      const statusCell = document.createElement("td");
      statusCell.innerHTML = ragCell(b.deliveryStatus);

      const dueCell = document.createElement("td");
      dueCell.textContent = b.dueDate ? formatDueWithCountdown(b.dueDate) : "–";
      dueCell.className = b.dueDate ? "" : "muted";

      const valueCell = document.createElement("td");
      valueCell.className = "right";
      valueCell.textContent = b.valueAud ? currencyFormatAUD(b.valueAud) : "–";
      if (!b.valueAud) valueCell.classList.add("muted");

      tr.appendChild(bidCell);
      tr.appendChild(clientCell);
      tr.appendChild(stageCell);
      tr.appendChild(statusCell);
      tr.appendChild(dueCell);
      tr.appendChild(valueCell);

      bidRowsEl.appendChild(tr);
    }
  }

  function renderDetailHeader(){
    const b = currentBid();
    if (!b) return;

    detailTitleEl.textContent = b.title || "Untitled bid";

    const parts = [];
    if (b.client) parts.push(b.client);
    if (b.bidNumber) parts.push(b.bidNumber);
    if (b.opportunityId) parts.push(`Ref: ${b.opportunityId}`);
    if (b.owner) parts.push(`Owner: ${b.owner}`);
    detailMetaEl.textContent = parts.join(" • ");

    detailKpiStage.textContent = b.stage || "–";
    detailKpiDue.textContent = b.dueDate ? formatDueWithCountdown(b.dueDate) : "–";
    detailKpiValue.textContent = b.valueAud ? currencyFormatAUD(b.valueAud) : "–";

    if (b.updatedAt){
      const dt = new Date(b.updatedAt);
      detailKpiUpdated.textContent = `Updated ${dt.toLocaleString()}`;
    } else {
      detailKpiUpdated.textContent = "";
    }

    detailPillsEl.innerHTML = "";

    const rag = deliveryMeta(b.deliveryStatus);
    const ragBadge = document.createElement("span");
    ragBadge.className = "badge secondary";
    ragBadge.innerHTML = `<span class="ragdot ${rag.rag}"></span><span>${escapeHtml(rag.label)}</span>`;
    detailPillsEl.appendChild(ragBadge);

    if (b.dateReceived){
      const dr = document.createElement("span");
      dr.className = "badge secondary";
      dr.textContent = `Received: ${b.dateReceived}`;
      detailPillsEl.appendChild(dr);
    }

    const scopeLabels = toArray(b.scope).map(v => {
      const opt = SCOPE_OPTIONS.find(o => o.value === v);
      return opt ? opt.label : String(v);
    });

    for (const s of scopeLabels.slice(0, 6)){
      const el = document.createElement("span");
      el.className = "badge secondary";
      el.textContent = s;
      detailPillsEl.appendChild(el);
    }
    if (scopeLabels.length > 6){
      const el = document.createElement("span");
      el.className = "badge secondary";
      el.textContent = `+${scopeLabels.length - 6}`;
      detailPillsEl.appendChild(el);
    }

    // Qualification summary pill
    if (b.qualification?.recommendation){
      const el = document.createElement("span");
      el.className = "badge";
      el.textContent = `Qualification: ${b.qualification.recommendation}`;
      detailPillsEl.appendChild(el);
    }
  }

  function renderDetailForm(){
    const b = currentBid();
    if (!b) return;

    f.title.value = b.title || "";
    f.client.value = b.client || "";
    f.opportunityId.value = b.opportunityId || "";
    f.owner.value = b.owner || "";
    f.stage.value = b.stage || STAGES[0];
    f.deliveryStatus.value = b.deliveryStatus || "onTrack";
    f.dateReceived.value = b.dateReceived || "";
    f.dueDate.value = b.dueDate || "";
    f.submittedDate.value = b.submittedDate || "";
    f.decisionDate.value = b.decisionDate || "";
    f.valueAud.value = b.valueAud || "";
    f.probability.value = b.probability || "50";

    f.scopeSummary.value = b.scopeSummary || "";
    f.notes.value = b.notes || "";

    f.requirements.value = b.requirements || "";
    f.assumptions.value = b.assumptions || "";
    f.dependencies.value = b.dependencies || "";
    f.risks.value = b.risks || "";

    f.commercials.value = b.commercials || "";
    f.competitorNotes.value = b.competitorNotes || "";

    f.differentiatorsOther.value = b.differentiatorsOther || "";

    f.stakeholders.value = b.stakeholders || "";
    f.resourcing.value = b.resourcing || "";
    f.nextSteps.value = b.nextSteps || "";

    // Update dropdown UIs
    scopeDropdown?.setValue(toArray(b.scope));
    diffDropdown?.setValue(toArray(b.differentiators));
  }

  function setActiveTab(tabName){
    activeTab = tabName;
    for (const t of tabs){
      t.classList.toggle("active", t.dataset.tab === tabName);
    }
    const ids = ["overview", "requirements", "differentiators", "delivery"];
    for (const id of ids){
      const el = document.getElementById(`tab-${id}`);
      if (el) el.classList.toggle("hide", id !== tabName);
    }
  }

  // Dropdown components (initialised in render when in detail)
  let scopeDropdown = null;
  let diffDropdown = null;

  function render(){
    const isDetail = route.name === "detail";

    listView.classList.toggle("hide", isDetail);
    detailView.classList.toggle("hide", !isDetail);
    backBtn.classList.toggle("hide", !isDetail);

    renderKPIs();
    renderListFilters();
    renderListTable();

    if (isDetail){
      setOptions(f.stage, STAGES);

      // Delivery status options
      f.deliveryStatus.innerHTML = "";
      for (const s of DELIVERY_STATUSES){
        const o = document.createElement("option");
        o.value = s.value;
        o.textContent = s.label;
        f.deliveryStatus.appendChild(o);
      }

      setActiveTab(activeTab);

      // Mount / remount dropdowns
      if (!scopeDropdown){
        scopeMount.innerHTML = "";
        scopeDropdown = createMultiSelectDropdown({
          mount: scopeMount,
          label: "Scope",
          options: SCOPE_OPTIONS,
          placeholder: "Select scope items",
          helpText: "Select one or more scope items.",
          value: [],
          onChange: (arr) => {
            const b = currentBid();
            if (!b) return;
            updateBid({ ...b, scope: arr });
          }
        });
      }

      if (!diffDropdown){
        diffMount.innerHTML = "";
        diffDropdown = createMultiSelectDropdown({
          mount: diffMount,
          label: "Differentiators",
          options: DIFFERENTIATOR_OPTIONS,
          placeholder: "Select differentiators",
          helpText: "Use 'Other' and notes for anything unique.",
          value: [],
          onChange: (arr) => {
            const b = currentBid();
            if (!b) return;
            updateBid({ ...b, differentiators: arr });
          }
        });
      }

      renderDetailHeader();
      renderDetailForm();
    } else {
      // reset dropdowns so they rebind to next bid cleanly
      scopeDropdown = null;
      diffDropdown = null;
    }
  }

  // --- Import / merge ---
  function bidKey(b){
    return `${normaliseKey(b.title)}||${normaliseKey(b.client)}`;
  }
  function isPresent(v){
    return v !== undefined && v !== null && String(v) !== "";
  }

  function mergeImport(existingBids, importedBids){
    const now = new Date().toISOString();

    const importedNormalised = (importedBids || []).map(b => {
      const id = b.id || uid();
      return {
        ...clone(DEFAULT_BID),
        ...b,
        id,
        createdAt: b.createdAt || now,
        updatedAt: b.updatedAt || now,
      };
    });

    const existingByKey = new Map();
    for (const b of existingBids) existingByKey.set(bidKey(b), b);

    const mergedExistingById = new Map(existingBids.map(b => [b.id, b]));
    const newOnes = [];

    for (const incoming of importedNormalised){
      const key = bidKey(incoming);
      const match = existingByKey.get(key);

      if (match){
        const merged = { ...match };
        for (const k of Object.keys(DEFAULT_BID)){
          if (k === "id") continue;
          if (k === "createdAt"){
            merged.createdAt = match.createdAt || incoming.createdAt || now;
            continue;
          }
          if (isPresent(incoming[k])) merged[k] = incoming[k];
        }
        merged.id = match.id;
        merged.updatedAt = now;
        mergedExistingById.set(match.id, merged);
      } else {
        newOnes.push({
          ...incoming,
          createdAt: incoming.createdAt || now,
          updatedAt: now,
        });
      }
    }

    return [...newOnes, ...Array.from(mergedExistingById.values())];
  }

  // --- Events ---
  backBtn.addEventListener("click", () => setRoute({ name:"list", bidId:"" }));
  document.getElementById("doneBtn").addEventListener("click", () => setRoute({ name:"list", bidId:"" }));

  function openModal(el){ el.style.display = "flex"; }
  function closeModal(el){ el.style.display = "none"; }

  function openNewBidModal(){
    openModal(newBidModal);
  }

  function createNewBid(){
    const now = new Date().toISOString();

    state.meta = state.meta || { nextBidSeq: 1 };
    const seq = Number(state.meta.nextBidSeq || 1);
    const bidNumber = `BID-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
    state.meta.nextBidSeq = seq + 1;

    const newBid = {
      ...clone(DEFAULT_BID),
      id: uid(),
      bidNumber,
      title: "New bid",
      stage: "RFP Received",
      deliveryStatus: "onTrack",
      probability: "50",
      dateReceived: todayISO(),
      createdAt: now,
      updatedAt: now,
    };

    state.bids = [newBid, ...getBids()];
    saveState(state);
    return newBid;
  }

  newBtn.addEventListener("click", openNewBidModal);

  newBidClose.addEventListener("click", () => closeModal(newBidModal));
  newBidModal.addEventListener("click", (e) => { if (e.target === newBidModal) closeModal(newBidModal); });

  newBidSkip.addEventListener("click", () => {
    closeModal(newBidModal);
    const b = createNewBid();
    toast("Created new bid");
    setRoute({ name:"detail", bidId:b.id });
  });

  newBidStartQual.addEventListener("click", () => {
    closeModal(newBidModal);
    const b = createNewBid();
    setRoute({ name:"detail", bidId:b.id });
    // open qualification and bind to this bid
    const existingAnswers = b.qualification?.answers || null;
    qual.open({ answers: existingAnswers });
  });

  deleteBtn.addEventListener("click", () => {
    const b = currentBid();
    if (!b) return;
    const ok = window.confirm("Delete this bid? This cannot be undone.");
    if (!ok) return;
    state.bids = getBids().filter(x => x.id !== b.id);
    saveState(state);
    toast("Bid deleted");
    setRoute({ name:"list", bidId:"" });
  });

  exportBtn.addEventListener("click", () => {
    downloadJSON(state, `bidhub-export-${new Date().toISOString().slice(0,10)}.json`);
    toast("Exported JSON");
  });

  clearBtn.addEventListener("click", () => {
    const ok = window.confirm("Clear all BidHub data from this browser? Make sure you exported a backup first.");
    if (!ok) return;
    state = initialSeedV2();
    state.bids = [];
    saveState(state);
    toast("Cleared all data");
    setRoute({ name:"list", bidId:"" });
  });

  function openImport(){
    importError.textContent = "";
    importText.value = "";
    openModal(importModal);
    setTimeout(() => importText.focus(), 0);
  }
  function closeImport(){ closeModal(importModal); }

  importBtn.addEventListener("click", openImport);
  importClose.addEventListener("click", closeImport);
  importCancel.addEventListener("click", closeImport);
  importModal.addEventListener("click", (e) => { if (e.target === importModal) closeImport(); });

  importDo.addEventListener("click", () => {
    importError.textContent = "";
    const parsed = safeParseJSON(importText.value);
    if (!parsed.ok){
      importError.textContent = "That does not look like valid JSON.";
      return;
    }
    const data = parsed.value;
    if (!data || typeof data !== "object" || !Array.isArray(data.bids)){
      importError.textContent = "JSON must contain a 'bids' array.";
      return;
    }

    const merged = mergeImport(getBids(), data.bids);
    state.bids = merged;
    saveState(state);
    closeImport();
    toast("Imported and merged");
    setRoute({ name:"list", bidId:"" });
  });

  // Filters
  for (const el of [qEl, stageEl, ownerEl, scopeFilterEl, sortEl]){
    el.addEventListener("input", () => renderListTable());
    el.addEventListener("change", () => renderListTable());
  }

  // Tabs
  for (const t of tabs){
    t.addEventListener("click", () => setActiveTab(t.dataset.tab));
  }

  // Field bindings (text/date/select)
  const fieldMap = [
    ["title", f.title],
    ["client", f.client],
    ["opportunityId", f.opportunityId],
    ["owner", f.owner],
    ["stage", f.stage],
    ["deliveryStatus", f.deliveryStatus],
    ["dateReceived", f.dateReceived],
    ["dueDate", f.dueDate],
    ["submittedDate", f.submittedDate],
    ["decisionDate", f.decisionDate],
    ["valueAud", f.valueAud],
    ["probability", f.probability],
    ["scopeSummary", f.scopeSummary],
    ["notes", f.notes],
    ["requirements", f.requirements],
    ["assumptions", f.assumptions],
    ["dependencies", f.dependencies],
    ["risks", f.risks],
    ["commercials", f.commercials],
    ["competitorNotes", f.competitorNotes],
    ["differentiatorsOther", f.differentiatorsOther],
    ["stakeholders", f.stakeholders],
    ["resourcing", f.resourcing],
    ["nextSteps", f.nextSteps],
  ];

  for (const [key, el] of fieldMap){
    el.addEventListener("input", () => {
      const b = currentBid();
      if (!b) return;
      const next = { ...b, [key]: el.value };
      updateBid(next);
      renderDetailForm();
    });
  }

  // Numeric guarding
  f.valueAud.addEventListener("input", () => {
    f.valueAud.value = String(f.valueAud.value || "").replace(/[^0-9]/g, "");
  });

  f.probability.addEventListener("input", () => {
    const raw = String(f.probability.value || "").replace(/[^0-9]/g, "");
    const n = Math.max(0, Math.min(100, Number(raw || 0)));
    f.probability.value = String(n);
  });

  // Qualification modal save hook
  qual.onSave((answers) => {
    const b = currentBid();
    if (!b) return;
    const scored = scoreQualification(answers);
    updateBid({
      ...b,
      qualification: {
        ...scored,
        answers,
        updatedAt: new Date().toISOString(),
      }
    });
    toast("Saved qualification");
  });

  // Initial view
  render();
})();
