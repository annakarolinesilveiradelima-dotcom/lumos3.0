"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  BarChart3,
  Bot,
  Download,
  ExternalLink,
  FileWarning,
  Flame,
  Lightbulb,
  Newspaper,
  RefreshCw,
  Search,
  Sparkles,
  Users
} from "lucide-react";
import { TEASER_LAUNCH_DATE } from "@/lib/config";
import { buildSnapshot } from "@/lib/analysis";
import { seedItems } from "@/lib/mock-data";
import type { IntelligenceItem, IntelligenceSnapshot, Sentiment } from "@/lib/types";

type ViewKey = "overview" | "narratives" | "coverage" | "sentiment" | "creators" | "risks" | "opps" | "assistant";
type PeriodKey = "week" | "all";
type CoverageFilter = "all" | Sentiment | "official" | "news" | "youtube" | "reddit" | "x" | "trends";

type NarrativeInsight = {
  id: string;
  title: string;
  summary: string;
  whyItMatters: string;
  sourceNames: string[];
  evidence: IntelligenceItem[];
  sentiment: Sentiment;
  riskScore: number;
  opportunityScore: number;
};

const initialSnapshot = buildSnapshot(seedItems, TEASER_LAUNCH_DATE, new Date().toISOString().slice(0, 10));
const CACHE_KEY = "lumos.v12.safe-page.snapshot";
const COVERAGE_DISPLAY_LIMIT = 35;
const EVIDENCE_DISPLAY_LIMIT = 12;
const NARRATIVE_DISPLAY_LIMIT = 5;

const navItems: { key: ViewKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Visão geral", icon: BarChart3 },
  { key: "narratives", label: "Narrativas", icon: Sparkles },
  { key: "coverage", label: "Cobertura & fontes", icon: Newspaper },
  { key: "sentiment", label: "Sentimento", icon: Flame },
  { key: "creators", label: "Creators", icon: Users },
  { key: "risks", label: "Riscos", icon: FileWarning },
  { key: "opps", label: "Oportunidades", icon: Lightbulb },
  { key: "assistant", label: "Assistant", icon: Bot }
];

function ExternalAnchor({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return React.createElement("a", { href, target: "_blank", rel: "noreferrer", className }, children);
}

function pct(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function average(items: IntelligenceItem[], field: "riskScore" | "opportunityScore" | "reach") {
  return items.length ? Math.round(items.reduce((sum, item) => sum + item[field], 0) / items.length) : 0;
}

function weekNumber(weekId: string) {
  return Number(weekId.replace("W", ""));
}

function sentimentLabel(value: Sentiment) {
  if (value === "positive") return "Positivo";
  if (value === "negative") return "Crítico";
  return "Neutro";
}

function sentimentClass(value: Sentiment) {
  if (value === "positive") return "pos";
  if (value === "negative") return "neg";
  return "neu";
}

function cleanUrl(url: string) {
  if (!url || !/^https?:\/\//i.test(url)) return "#";
  return url;
}

function normalizeText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isSearchBackfill(item: IntelligenceItem) {
  return (
    item.sourceKind === "google" ||
    item.url.includes("news.google.com/search") ||
    item.url.includes("google.com/search") ||
    item.title.toLowerCase().includes("monitoramento semanal") ||
    item.title.toLowerCase().includes("busca aberta")
  );
}

function isHarryPotterRelevant(item: IntelligenceItem) {
  const text = normalizeText(`${item.title} ${item.summary} ${item.tags.join(" ")} ${item.source}`);
  const hasHarryPotter = text.includes("harry") && text.includes("potter");
  const hasWizardingTerm =
    text.includes("hogwarts") ||
    text.includes("wizarding world") ||
    text.includes("mundo bruxo") ||
    text.includes("dumbledore") ||
    text.includes("hermione") ||
    text.includes("ron weasley") ||
    text.includes("voldemort");
  const hasSeriesContext =
    text.includes("hbo") ||
    text.includes("max") ||
    text.includes("serie") ||
    text.includes("série") ||
    text.includes("teaser") ||
    text.includes("elenco") ||
    text.includes("estreia");
  return item.sourceKind === "official" || hasHarryPotter || (hasWizardingTerm && hasSeriesContext);
}

function sourceLabel(item: IntelligenceItem) {
  if (item.sourceKind === "official") return "Fonte oficial";
  if (item.sourceKind === "news") return "Matéria / imprensa";
  if (item.sourceKind === "youtube") return "YouTube";
  if (item.sourceKind === "reddit") return "Reddit";
  if (item.sourceKind === "trends") return "Google Trends";
  if (item.sourceKind === "x") return "X / Social";
  return "Fonte";
}

function actionLabel(item: IntelligenceItem) {
  if (item.sourceKind === "official") return "Abrir fonte oficial";
  if (item.sourceKind === "news") return "Abrir matéria";
  if (item.sourceKind === "youtube") return "Ver vídeos";
  if (item.sourceKind === "reddit") return "Ver discussão";
  if (item.sourceKind === "trends") return "Abrir Trends";
  if (item.sourceKind === "x") return "Ver conversa";
  return "Abrir fonte";
}

function hasTag(item: IntelligenceItem, tags: string[]) {
  const field = normalizeText(`${item.title} ${item.summary} ${item.tags.join(" ")}`);
  return tags.some((tag) => field.includes(normalizeText(tag)));
}

function sourceNames(items: IntelligenceItem[]) {
  return [...new Set(items.map((item) => item.source).filter(Boolean))].slice(0, 4);
}

function chooseSentiment(items: IntelligenceItem[]): Sentiment {
  const negative = items.filter((item) => item.sentiment === "negative").length;
  const positive = items.filter((item) => item.sentiment === "positive").length;
  if (negative > positive) return "negative";
  if (positive > 0) return "positive";
  return "neutral";
}

function makeInsight(id: string, title: string, summary: string, whyItMatters: string, evidence: IntelligenceItem[]): NarrativeInsight | null {
  const validEvidence = evidence
    .filter((item) => !isSearchBackfill(item))
    .filter((item) => isHarryPotterRelevant(item))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 6);

  if (!validEvidence.length) return null;

  return {
    id,
    title,
    summary,
    whyItMatters,
    sourceNames: sourceNames(validEvidence),
    evidence: validEvidence,
    sentiment: chooseSentiment(validEvidence),
    riskScore: average(validEvidence, "riskScore"),
    opportunityScore: average(validEvidence, "opportunityScore")
  };
}

function buildNarrativeInsights(items: IntelligenceItem[]): NarrativeInsight[] {
  const cleanItems = items.filter((item) => !isSearchBackfill(item)).filter((item) => isHarryPotterRelevant(item));
  const groups = [
    makeInsight(
      "nostalgia-official",
      "Nostalgia e fontes oficiais sustentam o interesse",
      "A IA encontrou sinais de que a conversa sobre Harry Potter continua apoiada no teaser, em fontes oficiais e na memória afetiva da franquia.",
      "Esse eixo é seguro para social, CRM e PR porque reforça familiaridade antes do próximo grande asset.",
      cleanItems.filter((item) => hasTag(item, ["teaser", "official", "nostalgia", "hbo", "launch", "release"]))
    ),
    makeInsight(
      "fandom-adaptation",
      "Fandom monitora fidelidade, elenco e adaptação",
      "A IA identificou que conversas sobre elenco, caracterização e fidelidade aos livros aparecem como temas recorrentes de atenção.",
      "Esses temas precisam de mensagens claras porque podem virar dúvidas ou críticas rapidamente se não forem contextualizados.",
      cleanItems.filter((item) => hasTag(item, ["casting", "adaptation", "fandom", "elenco", "livros", "cast"]))
    ),
    makeInsight(
      "film-comparison-risk",
      "Comparação com os filmes segue como principal risco",
      "A IA encontrou sinais de comparação direta entre a nova série e o legado cinematográfico, principalmente em conversas de fandom e social.",
      "A comunicação precisa explicar o valor do formato longo sem competir diretamente com a memória afetiva dos filmes.",
      cleanItems.filter((item) => item.sentiment === "negative" || hasTag(item, ["comparison", "filmes", "risk", "crítica", "x"]))
    ),
    makeInsight(
      "creator-education",
      "Creators podem transformar dúvidas em contexto positivo",
      "A IA identificou oportunidade para creators e vídeos explicadores, especialmente para diferenciar série, livros e filmes.",
      "Esse caminho ajuda a manter buzz entre assets oficiais e reduz ruído em temas sensíveis.",
      cleanItems.filter((item) => item.sourceKind === "youtube" || hasTag(item, ["creators", "youtube", "education", "explicadores"]))
    ),
    makeInsight(
      "br-market-press",
      "Fontes brasileiras ajudam a manter a conversa ativa",
      "A IA encontrou cobertura e sinais em português que indicam espaço para guias, retrospectivas e pauta editorial local.",
      "O mercado brasileiro pode sustentar awareness com conteúdo always-on enquanto não há novo trailer ou anúncio maior.",
      cleanItems.filter((item) => item.region === "BR" || hasTag(item, ["brasil", "press", "editorial", "imprensa", "guias"]))
    )
  ].filter(Boolean) as NarrativeInsight[];

  if (groups.length) return groups;
  const fallback = makeInsight(
    "weekly-readout",
    "A IA consolidou os sinais disponíveis da semana",
    "Não há volume suficiente para clusterizar narrativas, mas os sinais encontrados foram consolidados na leitura executiva.",
    "A recomendação é recarregar o feed e acompanhar fontes oficiais, imprensa e social listening.",
    cleanItems
  );
  return fallback ? [fallback] : [];
}

function EvidenceCard({ item }: { item: IntelligenceItem }) {
  return (
    <ExternalAnchor href={cleanUrl(item.url)} className="card link-card">
      <h4>{item.title}</h4>
      <div className="meta">
        <span className={`pill ${sentimentClass(item.sentiment)}`}>{sentimentLabel(item.sentiment)}</span>
        <span className="pill nos">{item.weekId}</span>
        <span className="pill neu">{sourceLabel(item)}</span>
      </div>
      <p>{item.summary}</p>
      <small>Fonte usada pela IA: {item.source} · {actionLabel(item)} <ExternalLink size={12} /></small>
    </ExternalAnchor>
  );
}

function CoverageRow({ item }: { item: IntelligenceItem }) {
  return (
    <ExternalAnchor href={cleanUrl(item.url)} className="row coverage-row">
      <span className="time">{item.publishedAt.slice(0, 10)}</span>
      <span className="outlet">{item.source}</span>
      <span>
        <b>{item.title}</b>
        <small>{sourceLabel(item)} · Resumo IA: {item.summary}</small>
      </span>
      <span className={`pill ${sentimentClass(item.sentiment)}`}>{sentimentLabel(item.sentiment)}</span>
      <span className="open-label">{actionLabel(item)} <ExternalLink size={14} /></span>
    </ExternalAnchor>
  );
}

function RiskCard({ item }: { item: IntelligenceItem }) {
  return (
    <ExternalAnchor href={cleanUrl(item.url)} className="card link-card">
      <div className="meta">
        <span className="pill neg">Risk {item.riskScore}</span>
        <span className="pill neu">{item.weekId}</span>
      </div>
      <h4>{item.title}</h4>
      <p>{item.sentimentReason}</p>
      <small>Fonte usada pela IA: {item.source} · {actionLabel(item)} <ExternalLink size={12} /></small>
    </ExternalAnchor>
  );
}

function OpportunityCard({ item }: { item: IntelligenceItem }) {
  return (
    <ExternalAnchor href={cleanUrl(item.url)} className="card link-card">
      <div className="meta">
        <span className="pill nos">Opp {item.opportunityScore}</span>
        <span className="pill neu">{item.weekId}</span>
      </div>
      <h4>{item.title}</h4>
      <p>{item.summary}</p>
      <small>Fonte usada pela IA: {item.source} · {actionLabel(item)} <ExternalLink size={12} /></small>
    </ExternalAnchor>
  );
}

export default function Page() {
  const [snapshot, setSnapshot] = useState<IntelligenceSnapshot>(initialSnapshot);
  const [selectedWeek, setSelectedWeek] = useState(initialSnapshot.currentWeekId);
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [period, setPeriod] = useState<PeriodKey>("week");
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>("all");
  const [loading, setLoading] = useState(false);
  const [lastUpdateMessage, setLastUpdateMessage] = useState("Aguardando atualização do feed.");

  useEffect(() => {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as IntelligenceSnapshot;
      setSnapshot(parsed);
      setSelectedWeek(parsed.currentWeekId);
      return;
    }
    void updateIntelligence();
  }, []);

  const currentWeek = useMemo(() => {
    return snapshot.weeks.find((week) => week.weekId === selectedWeek) || snapshot.weeks[snapshot.weeks.length - 1];
  }, [snapshot, selectedWeek]);

  const scopedItems = useMemo(() => {
    const selectedNumber = weekNumber(selectedWeek);
    const cleanItems = snapshot.items.filter((item) => !isSearchBackfill(item)).filter((item) => isHarryPotterRelevant(item));

    if (period === "all") {
      return cleanItems.filter((item) => weekNumber(item.weekId) <= selectedNumber);
    }

    const exactWeekItems = cleanItems.filter((item) => item.weekId === selectedWeek);
    if (exactWeekItems.length > 0) return exactWeekItems;

    return cleanItems
      .filter((item) => weekNumber(item.weekId) <= selectedNumber)
      .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
      .slice(0, 12);
  }, [snapshot.items, selectedWeek, period]);

  const exactWeekItemCount = useMemo(() => {
    return snapshot.items
      .filter((item) => !isSearchBackfill(item))
      .filter((item) => isHarryPotterRelevant(item))
      .filter((item) => item.weekId === selectedWeek).length;
  }, [snapshot.items, selectedWeek]);

  const weeklyFallbackActive = period === "week" && exactWeekItemCount === 0 && scopedItems.length > 0;
  const narrativeInsights = useMemo(() => buildNarrativeInsights(scopedItems), [scopedItems]);

  const weeklyNarrativeSummary = useMemo(() => {
    const positive = scopedItems.filter((item) => item.sentiment === "positive").length;
    const neutral = scopedItems.filter((item) => item.sentiment === "neutral").length;
    const negative = scopedItems.filter((item) => item.sentiment === "negative").length;
    const sources = [...new Set(scopedItems.map((item) => item.source))];
    const topSources = sources
      .map((source) => ({ source, count: scopedItems.filter((item) => item.source === source).length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    const topInsight = narrativeInsights[0];
    const topEvidence = topInsight?.evidence[0] || scopedItems[0];
    const summary = scopedItems.length
      ? `Nesta janela, a IA analisou ${scopedItems.length} fonte(s)/sinal(is) sobre Harry Potter. A leitura principal é: ${topInsight?.summary || topEvidence?.summary || currentWeek?.keyNarrative}`
      : "Nesta semana, a IA ainda não encontrou fontes reais suficientes para gerar um resumo robusto. Clique em Recarregar feed para buscar novas matérias e sinais.";
    return { positive, neutral, negative, sources, topSources, topInsight, topEvidence, summary };
  }, [scopedItems, narrativeInsights, currentWeek]);

  const filteredCoverage = useMemo(() => {
    return scopedItems.filter((item) => {
      if (coverageFilter === "all") return true;
      if (["positive", "neutral", "negative"].includes(coverageFilter)) return item.sentiment === coverageFilter;
      return item.sourceKind === coverageFilter;
    });
  }, [coverageFilter, scopedItems]);

  const displayedCoverage = useMemo(() => {
    return [...filteredCoverage].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, COVERAGE_DISPLAY_LIMIT);
  }, [filteredCoverage]);

  const displayedEvidence = useMemo(() => {
    return [...scopedItems].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, EVIDENCE_DISPLAY_LIMIT);
  }, [scopedItems]);

  const platformData = useMemo(() => {
    const labels = ["official", "news", "trends", "youtube", "reddit", "x"] as const;
    return labels.map((kind) => ({
      name: kind === "official" ? "Oficial" : kind === "news" ? "Imprensa" : kind === "trends" ? "Trends" : kind === "youtube" ? "YouTube" : kind === "reddit" ? "Reddit" : "X",
      volume: scopedItems.filter((item) => item.sourceKind === kind).length
    }));
  }, [scopedItems]);

  const sentimentData = useMemo(() => {
    const positive = scopedItems.filter((item) => item.sentiment === "positive").length;
    const neutral = scopedItems.filter((item) => item.sentiment === "neutral").length;
    const negative = scopedItems.filter((item) => item.sentiment === "negative").length;
    return [
      { name: "Positivo", value: positive, color: "#63c08c" },
      { name: "Neutro", value: neutral, color: "#8a90a6" },
      { name: "Crítico", value: negative, color: "#da6e6e" }
    ];
  }, [scopedItems]);

  const riskItems = useMemo(() => {
    return [...snapshot.items]
      .filter((item) => !isSearchBackfill(item))
      .filter((item) => isHarryPotterRelevant(item))
      .filter((item) => item.sentiment === "negative" || item.riskScore >= 55)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 8);
  }, [snapshot.items]);

  const opportunityItems = useMemo(() => {
    return [...snapshot.items]
      .filter((item) => !isSearchBackfill(item))
      .filter((item) => isHarryPotterRelevant(item))
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 8);
  }, [snapshot.items]);

  async function updateIntelligence() {
    setLoading(true);
    try {
      const previousTotal = snapshot.totalItems;
      const res = await fetch("/api/intelligence/update", { method: "POST" });
      if (!res.ok) throw new Error("Update failed");
      const data = (await res.json()) as IntelligenceSnapshot;
      setSnapshot(data);
      setSelectedWeek(data.currentWeekId);
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      const delta = Math.max(0, data.totalItems - previousTotal);
      const msg = `Feed atualizado: ${data.totalItems} sinais consolidados, ${delta} novos vs cache anterior.`;
      setLastUpdateMessage(msg);
      toast.success(msg);
    } catch {
      toast.error("Não consegui atualizar agora. Mantive o histórico local.");
    } finally {
      setLoading(false);
    }
  }

  async function exportFile(type: "csv" | "pdf" | "ppt") {
    const path = type === "ppt" ? "/api/export/ppt" : `/api/export/${type}`;
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ snapshot })
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumos-intelligence.${type === "ppt" ? "pptx" : type}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-shell">
      <aside className="side">
        <div className="brand"><div className="orb" /><div><b>Lumos</b><span>FANDOM INTELLIGENCE</span></div></div>
        <div className="navlabel">Semana atual</div>
        <nav>
          {navItems.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`navitem ${activeView === key ? "active" : ""}`} onClick={() => setActiveView(key)}>
              <Icon size={17} />{label}{key === "risks" && <span className="badge">{riskItems.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidefoot"><b>Fonte de dados:</b> Lumos API<br />Atualizado: <b>{new Date(snapshot.generatedAt).toLocaleString("pt-BR")}</b><br />Cobertura: <b>BR · pt-BR</b><br /><span>{lastUpdateMessage}</span></div>
      </aside>

      <main className="main">
        <header className="top">
          <div className="title"><h1>Harry Potter — Série HBO Max</h1><span>Weekly Intelligence · mercado brasileiro</span></div>
          <div className="seg"><button className={period === "week" ? "active" : ""} onClick={() => setPeriod("week")}>Semanal</button><button className={period === "all" ? "active" : ""} onClick={() => setPeriod("all")}>Histórico</button></div>
          <select className="select-native" value={selectedWeek} onChange={(event) => setSelectedWeek(event.target.value)}>{snapshot.weeks.map((week) => <option key={week.weekId} value={week.weekId}>{week.weekId} · {week.startDate}</option>)}</select>
          <button className="btn" onClick={updateIntelligence} disabled={loading}><RefreshCw size={15} />{loading ? "Atualizando" : "Recarregar feed"}</button>
          <button className="btn gold" onClick={() => exportFile("pdf")}>Relatório</button>
        </header>

        <div className="content">
          {activeView === "overview" && (
            <section className="view active">
              <div className="head"><div><span className="eyebrow">Resumo executivo</span><h2>Visão geral</h2></div><p>Consolidação semanal com matérias clicáveis, fontes, sentimento, risco e oportunidade.</p></div>
              <div className="executive-readout"><span className="tagline"><span className="dot" />Leitura executiva da semana</span><h3>{weeklyNarrativeSummary.topInsight?.title || "Monitoramento ativo de Harry Potter"}</h3><p>{weeklyNarrativeSummary.summary}</p>{weeklyFallbackActive && <p className="fallback-note">Sem novas fontes exatamente em {selectedWeek}; exibindo os sinais mais recentes anteriores para manter contexto semanal.</p>}<div className="readout-sources">{weeklyNarrativeSummary.topSources.slice(0, 5).map((source) => <span key={source.source}>{source.source} · {source.count}</span>)}</div></div>
              <div className="kpis"><div className="kpi"><small>Matérias / Sinais</small><strong>{scopedItems.length}</strong><span className="smallnote">janela selecionada</span></div><div className="kpi"><small>Sentimento positivo</small><strong>{pct(scopedItems.filter((item) => item.sentiment === "positive").length, scopedItems.length)}%</strong><span className="delta up">+ memória semanal</span></div><div className="kpi"><small>Risco médio</small><strong>{currentWeek?.riskScore || 0}<span>/100</span></strong><span className="smallnote">radar de fandom</span></div><div className="kpi"><small>Buzz score</small><strong>{currentWeek?.buzzScore || 0}<span>/100</span></strong><span className="smallnote">desde o teaser</span></div></div>
              <div className="grid2"><div className="panel"><h3>Radar de plataformas</h3><div className="canvasbox"><ResponsiveContainer width="100%" height="100%"><BarChart data={platformData}><CartesianGrid strokeDasharray="3 3" stroke="#202942" /><XAxis dataKey="name" stroke="#9ba3bb" /><YAxis stroke="#69718e" /><Tooltip contentStyle={{ background: "#141b2e", border: "1px solid #28324f", color: "#efe6d3" }} /><Bar dataKey="volume" fill="#e7a94b" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></div><div className="panel"><h3>Narrativas dominantes</h3><div className="list">{narrativeInsights.length ? narrativeInsights.slice(0, NARRATIVE_DISPLAY_LIMIT).map((insight) => <button className="row row-button" key={insight.id} onClick={() => setActiveView("narratives")}><div><b>{insight.title}</b><small>{insight.evidence.length} evidência(s) · fontes: {insight.sourceNames.join(", ")}</small></div><ExternalLink size={15} /></button>) : <div className="empty">Sem narrativas suficientes nessa janela.</div>}</div></div></div>
              <div className="grid2b"><div className="panel"><h3>Balanço de sentimento</h3><div className="canvasbox"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={3}>{sentimentData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ background: "#141b2e", border: "1px solid #28324f", color: "#efe6d3" }} /></PieChart></ResponsiveContainer></div></div><div className="panel"><h3>Buzz · histórico semanal</h3><div className="canvasbox"><ResponsiveContainer width="100%" height="100%"><AreaChart data={snapshot.weeks}><CartesianGrid strokeDasharray="3 3" stroke="#202942" /><XAxis dataKey="weekId" stroke="#9ba3bb" /><YAxis stroke="#69718e" /><Tooltip contentStyle={{ background: "#141b2e", border: "1px solid #28324f", color: "#efe6d3" }} /><Area type="monotone" dataKey="buzzScore" stroke="#e7a94b" fill="rgba(231,169,75,.18)" /></AreaChart></ResponsiveContainer></div></div></div>
            </section>
          )}

          {activeView === "narratives" && (
            <section className="view active">
              <div className="head"><div><span className="eyebrow">Resumo da semana</span><h2>O que a IA encontrou</h2></div><p>Síntese executiva da semana selecionada, com fontes usadas pela IA e evidências clicáveis.</p></div>
              <div className="narrative-summary"><div><span className="tagline"><span className="dot" />{selectedWeek} · {period === "all" ? "histórico acumulado" : "semana selecionada"}</span><h3>Harry Potter está sendo falado?</h3><p>{weeklyNarrativeSummary.summary}</p>{weeklyFallbackActive && <p className="fallback-note">Sem novas fontes exatamente em {selectedWeek}; exibindo os sinais mais recentes anteriores para manter contexto semanal.</p>}</div><div className="narrative-scorecard"><div><small>Positivo</small><b>{weeklyNarrativeSummary.positive}</b></div><div><small>Neutro</small><b>{weeklyNarrativeSummary.neutral}</b></div><div><small>Crítico</small><b>{weeklyNarrativeSummary.negative}</b></div></div></div>
              <div className="grid2b"><div className="panel"><h3>Leitura da IA</h3><div className="list">{narrativeInsights.length ? narrativeInsights.slice(0, NARRATIVE_DISPLAY_LIMIT).map((insight) => <div className="insight-row" key={insight.id}><div className="meta"><span className={`pill ${sentimentClass(insight.sentiment)}`}>{sentimentLabel(insight.sentiment)}</span><span className="pill nos">Opp {insight.opportunityScore}</span><span className="pill neg">Risk {insight.riskScore}</span></div><b>{insight.title}</b><p>{insight.summary}</p><small>Por que importa: {insight.whyItMatters}</small></div>) : <div className="empty">Sem leitura consolidada nesta semana.</div>}</div></div><div className="panel"><h3>Fontes usadas pela IA</h3><div className="list">{weeklyNarrativeSummary.topSources.length ? weeklyNarrativeSummary.topSources.map((source) => <div className="source-row" key={source.source}><b>{source.source}</b><span>{source.count} sinal(is)</span></div>) : <div className="empty">Sem fontes reais nesta semana.</div>}</div></div></div>
              <div className="section-subhead"><span className="eyebrow">Evidências</span><h3>Top {Math.min(scopedItems.length, EVIDENCE_DISPLAY_LIMIT)} itens que sustentam o resumo</h3><p>Filtramos o excesso e mostramos só os sinais mais relevantes da janela. Total disponível: {scopedItems.length}.</p></div>
              <div className="cards">{displayedEvidence.length ? displayedEvidence.map((item) => <EvidenceCard key={item.id} item={item} />) : <div className="empty" style={{ gridColumn: "1 / -1" }}>Sem evidências suficientes para esta semana.</div>}</div>
            </section>
          )}

          {activeView === "coverage" && (
            <section className="view active"><div className="head"><div><span className="eyebrow">PR Listening</span><h2>Cobertura & fontes</h2></div><p>Matérias, posts e fontes reais. Cada linha abre o link original.</p></div><div className="filters">{(["all", "positive", "neutral", "negative", "official", "news", "youtube", "reddit", "x", "trends"] as CoverageFilter[]).map((filter) => <button key={filter} className={`chip ${coverageFilter === filter ? "on" : ""}`} onClick={() => setCoverageFilter(filter)}>{filter}</button>)}</div><div className="coverage-toolbar"><span>Mostrando top {displayedCoverage.length} de {filteredCoverage.length} fonte(s) filtradas por relevância.</span></div><div className="coverage list">{displayedCoverage.length ? displayedCoverage.map((item) => <CoverageRow key={item.id} item={item} />) : <div className="empty">Sem fontes de Harry Potter nesta semana. O Lumos agora filtra notícias fora do tema e pode mostrar contexto anterior quando a semana estiver vazia.</div>}</div></section>
          )}

          {activeView === "sentiment" && (
            <section className="view active"><div className="head"><div><span className="eyebrow">Sentimento</span><h2>Como a conversa está reagindo</h2></div><p>Percentual positivo/neutro/crítico baseado nos sinais disponíveis.</p></div><div className="kpis three">{sentimentData.map((entry) => <div className="kpi" key={entry.name}><small>{entry.name}</small><strong>{pct(entry.value, scopedItems.length)}%</strong><span className="smallnote">{entry.value} sinais</span></div>)}</div><div className="panel"><h3>Sentimento por semana</h3><div className="canvasbox"><ResponsiveContainer width="100%" height="100%"><BarChart data={snapshot.weeks.slice(-12)}><CartesianGrid strokeDasharray="3 3" stroke="#202942" /><XAxis dataKey="weekId" stroke="#9ba3bb" /><YAxis stroke="#69718e" /><Tooltip contentStyle={{ background: "#141b2e", border: "1px solid #28324f", color: "#efe6d3" }} /><Bar dataKey="positive" stackId="a" fill="#63c08c" /><Bar dataKey="neutral" stackId="a" fill="#8a90a6" /><Bar dataKey="negative" stackId="a" fill="#da6e6e" /></BarChart></ResponsiveContainer></div></div></section>
          )}

          {activeView === "creators" && (
            <section className="view active"><div className="head"><div><span className="eyebrow">Creators</span><h2>Perfis em alta</h2></div><p>Creators inferidos de dados conectados, principalmente YouTube.</p></div><table className="table"><thead><tr><th>Perfil</th><th>Plataforma</th><th>Fit</th><th>Score</th><th>Risco</th></tr></thead><tbody>{snapshot.creators.map((creator) => <tr key={creator.name}><td>{creator.name}</td><td>{creator.platform}</td><td>{creator.fit}</td><td>{creator.score}/100</td><td>{creator.risks.join(" ")}</td></tr>)}</tbody></table></section>
          )}

          {activeView === "risks" && <section className="view active"><div className="head"><div><span className="eyebrow">Radar de riscos</span><h2>Pontos de atenção</h2></div><p>Riscos derivados das conversas e matérias monitoradas.</p></div><div className="riskgrid">{riskItems.map((item) => <RiskCard key={item.id} item={item} />)}</div></section>}
          {activeView === "opps" && <section className="view active"><div className="head"><div><span className="eyebrow">Oportunidades</span><h2>Onde surfar a conversa</h2></div><p>Itens com maior potencial de PR, social, creators e CRM.</p></div><div className="hero"><span className="eyebrow">Insight aplicável</span><h2>{weeklyNarrativeSummary.topInsight?.title || currentWeek?.keyNarrative}</h2><p>{weeklyNarrativeSummary.topInsight?.whyItMatters || currentWeek?.whatChanged}</p><div className="facts"><div><small>Semana</small><b>{currentWeek?.weekId}</b></div><div><small>Opportunity</small><b>{currentWeek?.opportunityScore}/100</b></div><div><small>Buzz</small><b>{currentWeek?.buzzScore}/100</b></div></div></div><div className="oppgrid">{opportunityItems.map((item) => <OpportunityCard key={item.id} item={item} />)}</div></section>}
          {activeView === "assistant" && <section className="view active"><div className="head"><div><span className="eyebrow">AI Assistant</span><h2>Leitura executiva</h2></div><p>Resposta contextual baseada na semana selecionada.</p></div><div className="panel assistant-box"><Search size={20} /><p><b>Leitura Lumos:</b> {weeklyNarrativeSummary.summary} Próximo passo: abrir as evidências da aba Narrativas e priorizar as fontes com maior recorrência para briefing de PR/social.</p></div></section>}
        </div>
      </main>

      <div className="floating-exports"><button onClick={() => exportFile("csv")}><Download size={14} />CSV</button><button onClick={() => exportFile("ppt")}><Download size={14} />PPT</button></div>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
