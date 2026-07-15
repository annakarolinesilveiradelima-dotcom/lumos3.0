import { IntelligenceSnapshot } from "@/lib/types";
import { Card, Pill } from "@/components/ui";
export function Creators({ s }: { s: IntelligenceSnapshot }) {
  return <Card id="creators"><Pill>Creators</Pill><div className="mt-4 grid gap-4 md:grid-cols-2">{s.creators.map((c) => <div key={c.name} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex justify-between"><h4 className="font-semibold">{c.name}</h4><span className="text-gold">{c.score}/100</span></div><p className="mt-1 text-sm text-parchment/60">{c.platform} • {c.audience}</p><p className="mt-3 text-sm">{c.fit}</p><p className="mt-2 text-xs text-red-200">Risk: {c.risks.join(" ")}</p></div>)}</div></Card>;
}
