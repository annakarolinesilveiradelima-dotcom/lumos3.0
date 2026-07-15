"use client";
import { useMemo, useState } from "react";
import { IntelligenceSnapshot } from "@/lib/types";
import { Button, Card, Pill } from "@/components/ui";
export function AiAssistant({ s, selectedWeek }: { s: IntelligenceSnapshot; selectedWeek: string }) {
  const [q, setQ] = useState("O que mudou nessa semana e quais sao os proximos passos?");
  const week = s.weeks.find((w) => w.weekId === selectedWeek) || s.weeks[s.weeks.length - 1];
  const answer = useMemo(() => `Leitura Lumos para ${week?.weekId}: ${week?.whatChanged} Narrativa principal: ${week?.keyNarrative}. Proximo passo recomendado: transformar o tema ${week?.topTopics[0] || "fandom"} em pauta editorial, monitorar risco ${week?.riskScore}/100 e priorizar oportunidades com score ${week?.opportunityScore}/100.`, [week]);
  return <Card id="ai"><Pill>AI Assistant</Pill><textarea value={q} onChange={(e) => setQ(e.target.value)} className="mt-4 min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-parchment"/><Button className="mt-3">Ask Lumos AI</Button><div className="mt-4 rounded-2xl bg-gold/10 p-4 text-sm text-parchment/80">{answer}</div></Card>;
}
