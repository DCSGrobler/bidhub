import { STORAGE_KEY } from "./constants.js";

export function safeParseJSON(text){
  try { return { ok:true, value: JSON.parse(text) }; }
  catch (e) { return { ok:false, error:e }; }
}

export function loadRawState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = safeParseJSON(raw);
  return parsed.ok ? parsed.value : null;
}

export function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Legacy v1 support (single-file prototype)
export function loadLegacyV1(){
  const raw = localStorage.getItem("bidhub.v1");
  if (!raw) return null;
  const parsed = safeParseJSON(raw);
  return parsed.ok ? parsed.value : null;
}

export function downloadJSON(filename, payload){
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
