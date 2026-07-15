import { IntelligenceSnapshot } from "@/lib/types";
import { Card, Pill } from "@/components/ui";
export function ExecutiveBrief({ s, selectedWeek }: { s: IntelligenceSnapshot; selectedWeek: string }) {
  const week = s.weeks.find((w) => w.weekId === selectedWeek) || s.weeks[s.weeks.length - 1];
  return <Card id="brief"><div className="flex flex-wrap items-start justify-between gap-3"><div><Pill>Executive Brief</Pill><h3 className="mt-3 text-2xl font-bold">{week?.weekLabel}</h3><p className="mt-2 text-parchment/60">{week?.keyNarrative}</p></div><div className="rounded-2xl bg-black/25 p-4 text-right"><p className="text-xs text-parchment/45">Compared to previous week</p><p className="mt-1 font-semibold text-gold">{week?.whatChanged}</p></div></div><div className="mt-5 grid gap-3 md:grid-cols-2">{week?.executiveReadout.map((b) => <div key={b} className="rounded-2xl bg-white/5 p-4 text-sm text-parchment/80">{b}</div>)}</div><div className="mt-5 flex flex-wrap gap-2">{week?.topTopics.map((topic) => <span key={topic} className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs text-gold">{topic}</span>)}</div></Card>;
}
