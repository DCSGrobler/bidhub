import { STORAGE_KEY } from "./constants.js";

/**
 * Safely parse JSON without throwing
 */
export function safeParseJSON(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e };
  }
}

/**
 * Normalise a string for consistent comparisons
 */
export function normaliseKey(v) {
  return String(v || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Load current v2 state
 */
export function loadRawState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = safeParseJSON(raw);
  return parsed.ok ? parsed.value : null;
}

/**
 * Save current state
 */
export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Legacy v1 support (single-file prototype)
 */
export function loadLegacyV1() {
  const raw = localStorage.getItem("bidhub.v1");
  if (!raw) return null;
  const parsed = safeParseJSON(raw);
  return parsed.ok ? parsed.value : null;
}

/**
 * Download state as JSON
 */
export function downloadJSON(payload, filename = "bidhub-export.json") {
  const blob = new Blob(
    [JSON.stringify(payload, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
