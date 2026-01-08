export function todayISO(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseISODate(iso){
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function workingDaysBetween(startDate, endDate){
  // Counts working days from startDate (exclusive) to endDate (inclusive) if endDate after startDate.
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) return null;
  const dir = endDate.getTime() >= startDate.getTime() ? 1 : -1;
  let count = 0;
  const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const target = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  // Move day by day.
  while (d.getTime() !== target.getTime()){
    d.setDate(d.getDate() + dir);
    const day = d.getDay();
    const isWeekend = day === 0 || day === 6;
    if (!isWeekend) count += dir;
  }
  return count;
}

export function workingDaysUntil(isoDueDate){
  const due = parseISODate(isoDueDate);
  if (!due) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return workingDaysBetween(today, due);
}

export function formatDueWithCountdown(isoDueDate){
  if (!isoDueDate) return "–";
  const wd = workingDaysUntil(isoDueDate);
  if (wd === null) return isoDueDate;
  const suffix = wd === 1 ? "working day" : "working days";
  return `${isoDueDate} (${wd} ${suffix})`;
}

export function isDueSoonWorkingDays(isoDueDate, windowDays=14){
  const wd = workingDaysUntil(isoDueDate);
  return wd !== null && wd >= 0 && wd <= windowDays;
}
