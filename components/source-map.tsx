import { IntelligenceSnapshot } from "@/lib/types";
import { Card, Pill } from "@/components/ui";
export function SourceMap({ s }: { s: IntelligenceSnapshot }) {
  return <Card id="sources"><Pill>Source Reliability Map</Pill><div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{s.summary.topSources.map((source) => <div key={source.source} className="rounded-2xl bg-white/5 p-4"><p className="font-semibold">{source.source}</p><p className="mt-1 text-sm text-parchment/55">{source.count} sinais capturados</p><div className="mt-3 h-2 rounded-full bg-black/30"><div className="h-2 rounded-full bg-gold" style={{ width: `${Math.min(100, source.count * 12)}%` }} /></div></div>)}</div></Card>;
}
