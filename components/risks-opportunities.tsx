import { IntelligenceSnapshot } from "@/lib/types";
import { Card, Pill } from "@/components/ui";
export function RisksOpportunities({ s }: { s: IntelligenceSnapshot }) {
  return <section className="grid gap-4 lg:grid-cols-2"><Card id="risks"><Pill>Risk Radar</Pill><ul className="mt-4 space-y-3">{s.summary.risks.map((risk) => <li key={risk} className="rounded-2xl border border-red-400/15 bg-red-500/10 p-4 text-sm text-red-100">{risk}</li>)}</ul></Card><Card id="opportunities"><Pill>Opportunity Pipeline</Pill><ul className="mt-4 space-y-3">{s.summary.opportunities.map((opp) => <li key={opp} className="rounded-2xl border border-gold/20 bg-gold/10 p-4 text-sm text-parchment">{opp}</li>)}</ul></Card></section>;
}
