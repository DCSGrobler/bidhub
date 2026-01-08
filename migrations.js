import { STAGES, DEFAULT_BID } from "./constants.js";

const OLD_KEYS = ["bidhub.v1", "bidhub.v2"]; // allow seamless upgrade

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function loadAnyExistingState() {
  for (const k of OLD_KEYS) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    const parsed = safeJsonParse(raw);
    if (parsed) return { key: k, state: parsed };
  }
  return null;
}

export function migrateToV2(maybe) {
  if (!maybe) return null;
  const { state } = maybe;
  if (!state || typeof state !== "object") return null;

  // If already looks like v2, pass through
  if (state.version === 2 && Array.isArray(state.bids)) return state;

  // Attempt migrate v1 -> v2
  const bids = Array.isArray(state.bids) ? state.bids : [];

  const migratedBids = bids.map((b) => {
    const nb = { ...b };

    // Stage mapping
    const stage = String(nb.stage || "");
    const map = {
      Solutioning: "In Progress",
      Pricing: "In Progress",
      Writing: "In Progress",
    };
    nb.stage = map[stage] || stage || "RFP Received";
    if (!STAGES.includes(nb.stage)) nb.stage = "In Progress";

    // Delivery status (tracking)
    nb.deliveryStatus = nb.deliveryStatus || "onTrack";

    // Bid number (stable, auto)
    nb.bidNumber = nb.bidNumber || "";

    // Date received
    nb.dateReceived = nb.dateReceived || "";

    // Scope: convert tagsCsv if present
    if (Array.isArray(nb.scope)) {
      // ok
    } else if (typeof nb.tagsCsv === "string" && nb.tagsCsv.trim()) {
      nb.scope = nb.tagsCsv.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      nb.scope = [];
    }

    // Scope notes
    nb.scopeSummary = nb.scopeSummary || "";
    if (typeof nb.scopeSummary !== "string") nb.scopeSummary = String(nb.scopeSummary || "");

    // Differentiators
    if (!Array.isArray(nb.differentiators)) nb.differentiators = [];
    nb.differentiatorsOther = nb.differentiatorsOther || "";
    if (typeof nb.differentiatorsOther !== "string") {
      nb.differentiatorsOther = String(nb.differentiatorsOther || "");
    }

    // Value persistence fix: ensure valueAud exists
    nb.valueAud = nb.valueAud ?? "";

    // Remove old tags
    delete nb.tagsCsv;

    // Qualification
    nb.qualification = nb.qualification || null;

    // Basic defaults
    nb.title = nb.title || "Untitled bid";

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

  // Ensure sequential bid numbers if missing
  let maxSeq = 0;
  for (const b of v2.bids) {
    const m = String(b.bidNumber || "").match(/BID-(\d{4})-(\d{4})$/);
    if (m) maxSeq = Math.max(maxSeq, Number(m[2]));
  }

  let seq = maxSeq || 0;
  for (const b of v2.bids) {
    if (!b.bidNumber) {
      seq += 1;
      const year = new Date().getFullYear();
      b.bidNumber = `BID-${year}-${String(seq).padStart(4, "0")}`;
    }
  }
  v2.meta.nextBidSeq = seq + 1;

  return v2;
}

export function initialSeedV2() {
  const now = new Date().toISOString();
  const year = new Date().getFullYear();

  return {
    version: 2,
    meta: { nextBidSeq: 2 },
    bids: [
      {
        ...deepClone(DEFAULT_BID),
        id: uid(),
        bidNumber: `BID-${year}-0001`,
        title: "New bid",
        stage: "RFP Received",
        deliveryStatus: "onTrack",
        probability: "50",
        createdAt: now,
        updatedAt: now,
      },
    ],
    ui: { lastSelectedBidId: "" },
  };
}
