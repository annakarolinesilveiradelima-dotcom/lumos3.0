import { IntelligenceSnapshot } from "@/lib/types";
import { Card, Pill } from "@/components/ui";
export function Timeline({ s, selectedWeek }: { s: IntelligenceSnapshot; selectedWeek: string }) {
  const events = s.timeline.filter((e) => e.weekId === selectedWeek).slice(-12).reverse();
  return <Card id="timeline"><Pill>Timeline</Pill><div className="mt-5 space-y-4">{events.length ? events.map((e) => <div key={e.date + e.title} className="border-l border-gold/40 pl-4"><p className="text-xs text-gold">{e.date} • intensity {e.intensity}</p><h4 className="font-semibold">{e.title}</h4><p className="text-sm text-parchment/60">{e.description}</p></div>) : <p className="text-sm text-parchment/55">Sem eventos para esta semana.</p>}</div></Card>;
}
