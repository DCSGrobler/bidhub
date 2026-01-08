import { STAGES } from "./constants.js";

const OLD_KEYS = ["bidhub.v1", "bidhub.v2"]; // allow seamless upgrade

export function loadAnyExistingState(){
  for (const k of OLD_KEYS){
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try { return { key:k, state: JSON.parse(raw) }; }
    catch { /* ignore */ }
  }
  return null;
}

export function migrateToV2(maybe){
  if (!maybe) return null;
  const { state } = maybe;
  if (!state || typeof state !== "object") return null;

  // If already looks like v2, pass through
  if (state.version === 2 && Array.isArray(state.bids)) return state;

  // Attempt migrate v1 -> v2
  const bids = Array.isArray(state.bids) ? state.bids : [];
  const migratedBids = bids.map((b, idx) => {
    const nb = { ...b };

    // Stage mapping
    const stage = String(nb.stage || "");
    const map = {
      "Solutioning": "In Progress",
      "Pricing": "In Progress",
      "Writing": "In Progress",
    };
    nb.stage = map[stage] || stage || "RFP Received";
    if (!STAGES.includes(nb.stage)) nb.stage = "In Progress";

    // Convert status In progress / Closed into deliveryStatus default
    // Note: stage now represents lifecycle, deliveryStatus is tracking health
    nb.deliveryStatus = nb.deliveryStatus || "onTrack";

    // Bid number (stable, auto)
    nb.bidNumber = nb.bidNumber || "";

    // Date received
    nb.dateReceived = nb.dateReceived || "";

    // Scope
    if (Array.isArray(nb.scope)) {
      // ok
    } else if (typeof nb.tagsCsv === "string" && nb.tagsCsv.trim()) {
      // best-effort: convert tags into scope strings (free text)
      nb.scope = nb.tagsCsv.split(",").map(s => s.trim()).filter(Boolean);
    } else {
      nb.scope = [];
    }

    // Scope notes
    nb.scopeSummary = nb.scopeSummary || nb.scope || "";
    if (typeof nb.scopeSummary !== "string") nb.scopeSummary = String(nb.scopeSummary || "");

    // Differentiators
    if (!Array.isArray(nb.differentiators)) nb.differentiators = [];
    nb.differentiatorsOther = nb.differentiatorsOther || nb.differentiators || "";
    if (typeof nb.differentiatorsOther !== "string") nb.differentiatorsOther = String(nb.differentiatorsOther || "");

    // Value persistence fix: ensure valueAud exists
    nb.valueAud = nb.valueAud ?? "";

    // Remove old tags
    delete nb.tagsCsv;

    // Qualification
    nb.qualification = nb.qualification || { completed:false, critical:{}, evaluation:{}, enhanced:{}, recommendation:"", summary:"" };

    // Default owner and title
    nb.title = nb.title || "Untitled bid";

    // Assign bidNumber later in state-level pass
    return nb;
  });

  const v2 = {
    version: 2,
    meta: {
      nextBidSeq: 1,
    },
    bids: migratedBids,
    ui: state.ui || { lastSelectedBidId: "" },
  };

  // Ensure unique, sequential bid numbers if missing
  let maxSeq = 0;
  for (const b of v2.bids){
    const m = String(b.bidNumber || "").match(/BID-(\d{4})-(\d{4})$/);
    if (m) maxSeq = Math.max(maxSeq, Number(m[2]));
  }
  let seq = maxSeq || 0;
  for (const b of v2.bids){
    if (!b.bidNumber){
      seq += 1;
      const year = new Date().getFullYear();
      b.bidNumber = `BID-${year}-${String(seq).padStart(4, "0")}`;
    }
  }
  v2.meta.nextBidSeq = seq + 1;

  return v2;
}
