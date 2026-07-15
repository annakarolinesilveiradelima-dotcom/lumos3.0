import { IntelligenceItem, IntelligenceSnapshot, TimelineEvent, WeeklySnapshot } from "@/lib/types";
import { daysBetween, getWeekId, getWeekRange, listWeeksUntil } from "@/lib/dates";
import { clamp } from "@/lib/utils";
const positiveWords = ["teaser","trailer","estreia","confirmado","producao","novidade","sucesso","imagem","hbo","max","nostalgia","elenco","hogwarts","oficial"];
const negativeWords = ["polemica","critica","atraso","boicote","risco","reclamacao","cancelamento","vazamento","controversia","hate","divididos"];
export function classifySentiment(text: string) {
  const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const pos = positiveWords.filter((w) => t.includes(w)).length;
  const neg = negativeWords.filter((w) => t.includes(w)).length;
  if (neg > pos) return { sentiment: "negative" as const, reason: "Sinal com potenciais riscos de percepcao, controversia ou resistencia do fandom." };
  if (pos > 0) return { sentiment: "positive" as const, reason: "Sinal favoravel de interesse, nostalgia, novidade oficial ou expectativa de audiencia." };
  return { sentiment: "neutral" as const, reason: "Sinal informativo sem polaridade forte detectada." };
}
export function dedupe(items: IntelligenceItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 78);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export function enrich(items: IntelligenceItem[]) {
  return dedupe(items).map((item) => {
    const c = classifySentiment(`${item.title} ${item.summary} ${item.tags.join(" ")}`);
    const riskScore = c.sentiment === "negative" ? clamp(item.riskScore + 28, 20, 96) : clamp(item.riskScore - 8, 3, 75);
    const opportunityScore = c.sentiment === "positive" ? clamp(item.opportunityScore + 18, 25, 98) : clamp(item.opportunityScore, 10, 76);
    const weekId = item.weekId || getWeekId(item.publishedAt.slice(0, 10));
    return { ...item, weekId, sentiment: c.sentiment, sentimentReason: c.reason, riskScore, opportunityScore, relevanceScore: clamp(Math.round((item.reach + opportunityScore + (100 - riskScore)) / 3), 1, 100) };
  });
}
export function topicRank(items: IntelligenceItem[]) {
  const count = new Map<string, number>();
  items.flatMap((item) => item.tags).forEach((tag) => count.set(tag, (count.get(tag) || 0) + 1));
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag);
}
export function buildWeeks(items: IntelligenceItem[], to: string): WeeklySnapshot[] {
  const weeks = listWeeksUntil(to);
  let previousBuzz = 0;
  return weeks.map((weekId) => {
    const range = getWeekRange(weekId);
    const weekItems = items.filter((item) => item.weekId === weekId);
    const positive = weekItems.filter((i) => i.sentiment === "positive").length;
    const neutral = weekItems.filter((i) => i.sentiment === "neutral").length;
    const negative = weekItems.filter((i) => i.sentiment === "negative").length;
    const buzzScore = clamp(Math.round(weekItems.reduce((sum, i) => sum + i.reach, 0) / Math.max(1, weekItems.length) + weekItems.length * 3), 0, 100);
    const riskScore = clamp(Math.round(weekItems.reduce((sum, i) => sum + i.riskScore, 0) / Math.max(1, weekItems.length)), 0, 100);
    const opportunityScore = clamp(Math.round(weekItems.reduce((sum, i) => sum + i.opportunityScore, 0) / Math.max(1, weekItems.length)), 0, 100);
    const topics = topicRank(weekItems);
    const top = weekItems.sort((a, b) => b.relevanceScore - a.relevanceScore)[0];
    const delta = buzzScore - previousBuzz;
    previousBuzz = buzzScore;
    return {
      weekId,
      weekLabel: `${range.weekLabel} | ${range.startDate} - ${range.endDate}`,
      startDate: range.startDate,
      endDate: range.endDate,
      totalItems: weekItems.length,
      positive,
      neutral,
      negative,
      buzzScore,
      riskScore,
      opportunityScore,
      topTopics: topics.length ? topics : ["monitoring", "baseline"],
      keyNarrative: top ? top.title : "Semana sem novos sinais relevantes; manter monitoramento passivo.",
      whatChanged: delta > 8 ? `Buzz subiu ${delta} pts vs semana anterior.` : delta < -8 ? `Buzz caiu ${Math.abs(delta)} pts vs semana anterior.` : "Buzz estavel vs semana anterior.",
      executiveReadout: weekItems.length ? [
        `${weekItems.length} sinais consolidados nesta semana.`,
        `${positive} positivos, ${neutral} neutros e ${negative} negativos.`,
        `Tema dominante: ${(topics[0] || "fandom")}.`,
        riskScore > 60 ? "Requer atencao de risco reputacional." : "Sem risco critico concentrado."
      ] : ["Sem novos sinais capturados nesta semana.", "Manter baseline historico ativo.", "Sem mudanca executiva relevante.", "Aguardar novos picos de imprensa/social."],
      items: weekItems
    };
  });
}
export function buildTimeline(items: IntelligenceItem[]): TimelineEvent[] {
  const byDate = new Map<string, IntelligenceItem[]>();
  items.forEach((item) => {
    const date = item.publishedAt.slice(0, 10);
    byDate.set(date, [...(byDate.get(date) || []), item]);
  });
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, list]) => {
    const top = list.sort((a, b) => b.relevanceScore - a.relevanceScore)[0];
    const negative = list.filter((i) => i.sentiment === "negative").length;
    return {
      date,
      weekId: getWeekId(date),
      title: top?.title || "Movimentacao detectada",
      description: `${list.length} sinais no dia, com ${negative} alertas negativos.`,
      intensity: clamp(Math.round(list.reduce((sum, i) => sum + i.reach, 0) / Math.max(1, list.length)), 1, 100),
      sentiment: negative > list.length / 2 ? "negative" : top?.sentiment || "neutral",
      items: list.map((i) => i.id)
    };
  });
}
export function buildSnapshot(items: IntelligenceItem[], from: string, to: string): IntelligenceSnapshot {
  const enriched = enrich(items).sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  const weeks = buildWeeks(enriched, to);
  const currentWeekId = weeks[weeks.length - 1]?.weekId || "W01";
  const positive = enriched.filter((i) => i.sentiment === "positive").length;
  const neutral = enriched.filter((i) => i.sentiment === "neutral").length;
  const negative = enriched.filter((i) => i.sentiment === "negative").length;
  const sources = [...new Set(enriched.map((i) => i.source))].map((source) => ({ source, count: enriched.filter((i) => i.source === source).length })).sort((a, b) => b.count - a.count).slice(0, 10);
  const risks = enriched.filter((i) => i.riskScore >= 50 || i.sentiment === "negative").sort((a, b) => b.riskScore - a.riskScore).slice(0, 6).map((i) => `${i.title} - ${i.sentimentReason}`);
  const opportunities = enriched.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 6).map((i) => `${i.title} - oportunidade para PR, social, creators ou CRM.`);
  const dates = daysBetween(from, to);
  const trends = dates.filter((_, idx) => idx % 7 === 0 || dates.length < 40).map((date, idx) => {
    const weekId = getWeekId(date);
    const week = weeks.find((w) => w.weekId === weekId);
    return { date, value: clamp(Math.round((week?.buzzScore || 15) + Math.sin(idx / 2) * 8), 1, 100), topic: "Harry Potter HBO Max" };
  });
  return {
    project: "Lumos",
    generatedAt: new Date().toISOString(),
    dateFrom: from,
    dateTo: to,
    totalItems: enriched.length,
    currentWeekId,
    weeks,
    items: enriched,
    timeline: buildTimeline(enriched),
    summary: {
      headline: `Desde o teaser, Lumos acumulou ${enriched.length} sinais em ${weeks.length} semanas, com foco em buzz, risco e oportunidade para Harry Potter no Brasil.`,
      bullets: [
        `Historico semanal ativo desde ${from}, com ${weeks.length} semanas monitoradas.`,
        `Sentimento consolidado: ${positive} positivos, ${neutral} neutros e ${negative} negativos.`,
        `Semana atual: ${currentWeekId}, com leitura de buzz e comparativo vs semana anterior.`,
        "A plataforma agora guarda memoria historica local e esta preparada para persistencia em Supabase."
      ],
      risks: risks.length ? risks : ["Nenhum risco critico detectado no periodo analisado."],
      opportunities: opportunities.length ? opportunities : ["Criar calendario editorial de nostalgia, materiais explicadores e aquecimento para trailer oficial."],
      sentiment: { positive, neutral, negative },
      topSources: sources
    },
    trends,
    creators: [
      { name: "Creators geek e cultura pop BR", platform: "YouTube / TikTok / Instagram", score: 92, audience: "Fandom, entretenimento e nostalgia", fit: "Alta afinidade para explicadores, teorias, react e conteudo de contexto.", risks: ["Alinhar claims oficiais e evitar spoilers nao confirmados."] },
      { name: "Portais de entretenimento", platform: "Web / YouTube", score: 86, audience: "Leitores de cultura pop", fit: "Bom para PR angles, listas e cobertura de marcos oficiais.", risks: ["Monitorar manchetes sensacionalistas e comparacoes com os filmes."] }
    ]
  };
}
