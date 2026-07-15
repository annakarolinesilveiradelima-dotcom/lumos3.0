import { TEASER_LAUNCH_DATE } from "@/lib/config";
import { iso } from "@/lib/utils";
export function parseDate(value: string) { return new Date(value + "T00:00:00.000Z"); }
export function addDays(date: Date, days: number) { const d = new Date(date); d.setUTCDate(d.getUTCDate() + days); return d; }
export function getWeekId(dateValue: string) {
  const launch = parseDate(TEASER_LAUNCH_DATE).getTime();
  const target = parseDate(dateValue.slice(0, 10)).getTime();
  const diff = Math.max(0, Math.floor((target - launch) / 86400000));
  const weekNumber = Math.floor(diff / 7) + 1;
  return `W${String(weekNumber).padStart(2, "0")}`;
}
export function getWeekRange(weekId: string) {
  const n = Number(weekId.replace("W", ""));
  const start = addDays(parseDate(TEASER_LAUNCH_DATE), (n - 1) * 7);
  const end = addDays(start, 6);
  return { startDate: iso(start), endDate: iso(end), weekLabel: `Week ${n}` };
}
export function listWeeksUntil(toDate: string) {
  const launch = parseDate(TEASER_LAUNCH_DATE).getTime();
  const target = parseDate(toDate).getTime();
  const total = Math.floor(Math.max(0, target - launch) / 86400000);
  const count = Math.floor(total / 7) + 1;
  return Array.from({ length: count }, (_, i) => `W${String(i + 1).padStart(2, "0")}`);
}
export function daysBetween(start: string, end: string) {
  const out: string[] = [];
  for (let d = parseDate(start); d <= parseDate(end); d = addDays(d, 1)) out.push(iso(d));
  return out;
}
