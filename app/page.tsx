"use client";

import { useEffect, useMemo, useState } from "react";
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
  Archive,
  BarChart3,
  Bot,
  CalendarDays,
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

const initialSnapshot = buildSnapshot(
  seedItems,
  TEASER_LAUNCH_DATE,
  new Date().toISOString().slice(0, 10)
);

type ViewKey = "overview" | "narratives" | "coverage" | "sentiment" | "creators" | "risks" | "opps" | "assistant";
type PeriodKey = "week" | "all";
type CoverageFilter = "all" | Sentiment | "official" | "news" | "youtube" | "reddit" | "x" | "trends";

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

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
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

function sourceLabel(item: IntelligenceItem) {
  if (item.sourceKind === "official") return "Oficial";
  if (item.sourceKind === "youtube") return "YouTube";
  if (item.sourceKind === "reddit") return "Reddit";
  if (item.sourceKind === "trends") return "Google Trends";
  if (item.sourceKind === "x") return "X";
  return "Imprensa";
}

export default function Page() {
  const [snapshot, setSnapshot] = useState<IntelligenceSnapshot>(initialSnapshot);
  const [selectedWeek, setSelectedWeek] = useState(initialSnapshot.currentWeekId);
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [period, setPeriod] = useState<PeriodKey>("week");
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lumos.v3.template.snapshot");
    if (saved) {
      const parsed = JSON.parse(saved) as IntelligenceSnapshot;
      setSnapshot(parsed);
      setSelectedWeek(parsed.currentWeekId);
    }
  }, []);

  const currentWeek = useMemo(() => {
    return snapshot.weeks.find((week) => week.weekId === selectedWeek) || snapshot.weeks[snapshot.weeks.length - 1];
  }, [snapshot, selectedWeek]);

  const scopedItems = useMemo(() => {
    const selectedNumber = Number(selectedWeek.replace("W", ""));

    if (period === "all") {
      return snapshot.items.filter((item) => {
        const itemNumber = Number(item.weekId.replace("W", ""));
        return itemNumber <= selectedNumber;
      });
    }

    return snapshot.items.filter((item) => item.weekId === selectedWeek);
  }, [snapshot.items, selectedWeek, period]);

  const filteredCoverage = useMemo(() => {
    return scopedItems.filter((item) => {
      if (coverageFilter === "all") return true;
      if (["positive", "neutral", "negative"].includes(coverageFilter)) return item.sentiment === coverageFilter;
      return item.sourceKind === coverageFilter;
    });
  }, [coverageFilter, scopedItems]);

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

  const topNarratives = useMemo(() => {
    const byTag = new Map<string, IntelligenceItem[]>();
    scopedItems.forEach((item) => {
      item.tags.forEach((tag) => byTag.set(tag, [...(byTag.get(tag) || []), item]));
    });
    return [...byTag.entries()]
      .map(([tag, items]) => ({ tag, items, top: items.sort((a, b) => b.relevanceScore - a.relevanceScore)[0] }))
      .sort((a, b) => b.items.length - a.items.length)
      .slice(0, 6);
  }, [scopedItems]);

  const riskItems = useMemo(() => {
    return [...snapshot.items]
      .filter((item) => item.sentiment === "negative" || item.riskScore >= 55)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 8);
  }, [snapshot.items]);

  const opportunityItems = useMemo(() => {
    return [...snapshot.items]
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 8);
  }, [snapshot.items]);

  async function updateIntelligence() {
    setLoading(true);
    try {
      const lastRun = localStorage.getItem("lumos.v3.template.lastRun") || undefined;
      const res = await fetch("/api/intelligence/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lastRun })
      });
      if (!res.ok) throw new Error("Update failed");
      const data = (await res.json()) as IntelligenceSnapshot;
      setSnapshot(data);
      setSelectedWeek(data.currentWeekId);
      localStorage.setItem("lumos.v3.template.snapshot", JSON.stringify(data));
      localStorage.setItem("lumos.v3.template.lastRun", new Date().toISOString().slice(0, 10));
      toast.success("Feed atualizado e links de matérias preservados.");
    } catch {
      toast.error("Não consegui atualizar agora. Mantive o arquivo local.");
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
        <div className="brand">
          <div className="orb" />
          <div>
            <b>Lumos</b>
            <span>FANDOM INTELLIGENCE</span>
          </div>
        </div>

        <div className="navlabel">Semana atual</div>
        <nav>
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`navitem ${activeView === key ? "active" : ""}`}
              onClick={() => setActiveView(key)}
            >
              <Icon size={17} />
              {label}
              {key === "risks" && <span className="badge">{riskItems.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidefoot">
          <b>Fonte de dados:</b> Lumos API
          <br />
          Atualizado: <b>{new Date(snapshot.generatedAt).toLocaleString("pt-BR")}</b>
          <br />
          Cobertura: <b>BR · pt-BR</b>
        </div>
      </aside>

      <main className="main">
        <header className="top">
          <div className="title">
            <h1>Harry Potter — Série HBO Max</h1>
            <span>Weekly Intelligence · mercado brasileiro</span>
          </div>

          <div className="seg">
            <button className={period === "week" ? "active" : ""} onClick={() => setPeriod("week")}>Semanal</button>
            <button className={period === "all" ? "active" : ""} onClick={() => setPeriod("all")}>Histórico</button>
          </div>

          <select className="select-native" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
            {snapshot.weeks.map((week) => (
              <option key={week.weekId} value={week.weekId}>{week.weekId} · {week.startDate}</option>
            ))}
          </select>

          <button className="btn" onClick={updateIntelligence} disabled={loading}>
            <RefreshCw size={15} /> {loading ? "Atualizando" : "Recarregar feed"}
          </button>
          <button className="btn gold" onClick={() => exportFile("pdf")}>Relatório</button>
        </header>

        <div className="content">
          {activeView === "overview" && (
            <section className="view active">
              <div className="head">
                <div>
                  <span className="eyebrow">Resumo executivo</span>
                  <h2>Visão geral</h2>
                </div>
                <p>Consolidação semanal com matérias clicáveis, fontes, sentimento, risco e oportunidade.</p>
              </div>

              <span className="tagline"><span className="dot" /> Feed interativo · clique nas matérias para abrir a fonte</span>

              <div className="kpis">
                <div className="kpi"><small>Matérias / Sinais</small><strong>{scopedItems.length}</strong><span className="smallnote">janela selecionada</span></div>
                <div className="kpi"><small>Sentimento positivo</small><strong>{pct(scopedItems.filter((i) => i.sentiment === "positive").length, scopedItems.length)}%</strong><span className="delta up">+ memória semanal</span></div>
                <div className="kpi"><small>Risco médio</small><strong>{currentWeek?.riskScore || 0}<span>/100</span></strong><span className="smallnote">radar de fandom</span></div>
                <div className="kpi"><small>Buzz score</small><strong>{currentWeek?.buzzScore || 0}<span>/100</span></strong><span className="smallnote">desde o teaser</span></div>
              </div>

              <div className="grid2">
                <div className="panel">
                  <h3>Radar de plataformas</h3>
                  <div className="canvasbox">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={platformData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#202942" />
                        <XAxis dataKey="name" stroke="#9ba3bb" />
                        <YAxis stroke="#69718e" />
                        <Tooltip contentStyle={{ background: "#141b2e", border: "1px solid #28324f", color: "#efe6d3" }} />
                        <Bar dataKey="volume" fill="#e7a94b" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel">
                  <h3>Narrativas dominantes</h3>
                  <div className="list">
                    {topNarratives.length ? topNarratives.map(({ tag, items, top }) => (
                      <a className="row" key={tag} href={cleanUrl(top.url)} target="_blank" rel="noreferrer">
                        <div>
                          <b>{tag}</b>
                          <small>{items.length} sinais · fonte principal: {top.source}</small>
                        </div>
                        <ExternalLink size={15} />
                      </a>
                    )) : <div className="empty">Sem narrativas nessa janela.</div>}
                  </div>
                </div>
              </div>

              <div className="grid2b">
                <div className="panel">
                  <h3>Balanço de sentimento</h3>
                  <div className="canvasbox">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={3}>
                          {sentimentData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#141b2e", border: "1px solid #28324f", color: "#efe6d3" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel">
                  <h3>Buzz · histórico semanal</h3>
                  <div className="canvasbox">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={snapshot.weeks}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#202942" />
                        <XAxis dataKey="weekId" stroke="#9ba3bb" />
                        <YAxis stroke="#69718e" />
                        <Tooltip contentStyle={{ background: "#141b2e", border: "1px solid #28324f", color: "#efe6d3" }} />
                        <Area type="monotone" dataKey="buzzScore" stroke="#e7a94b" fill="rgba(231,169,75,.18)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeView === "narratives" && (
            <section className="view active">
              <div className="head"><div><span className="eyebrow">Principais conversas</span><h2>Narrativas</h2></div><p>Temas derivados dos sinais da janela selecionada.</p></div>
              <div className="cards">
                {topNarratives.map(({ tag, items, top }) => (
                  <a className="card link-card" key={tag} href={cleanUrl(top.url)} target="_blank" rel="noreferrer">
                    <h4>{tag}</h4>
                    <div className="meta"><span className={`pill ${sentimentClass(top.sentiment)}`}>{sentimentLabel(top.sentiment)}</span><span className="pill nos">{items.length} sinais</span></div>
                    <p>{top.summary}</p>
                    <small>Fonte: {top.source} · abrir matéria <ExternalLink size={12} /></small>
                  </a>
                ))}
              </div>
            </section>
          )}

          {activeView === "coverage" && (
            <section className="view active">
              <div className="head"><div><span className="eyebrow">PR Listening</span><h2>Cobertura & fontes</h2></div><p>Matérias, posts e fontes reais. Cada linha abre o link original.</p></div>
              <div className="filters">
                {(["all", "positive", "neutral", "negative", "official", "news", "youtube", "reddit", "x", "trends"] as CoverageFilter[]).map((filter) => (
                  <button key={filter} className={`chip ${coverageFilter === filter ? "on" : ""}`} onClick={() => setCoverageFilter(filter)}>{filter}</button>
                ))}
              </div>
              <div className="coverage list">
                {filteredCoverage.length ? filteredCoverage.map((item) => (
                  <a className="row coverage-row" key={item.id} href={cleanUrl(item.url)} target="_blank" rel="noreferrer">
                    <span className="time">{item.publishedAt.slice(0, 10)}</span>
                    <span className="outlet">{item.source}</span>
                    <span><b>{item.title}</b><small>{sourceLabel(item)} · {item.summary}</small></span>
                    <span className={`pill ${sentimentClass(item.sentiment)}`}>{sentimentLabel(item.sentiment)}</span>
                    <ExternalLink size={16} />
                  </a>
                )) : <div className="empty">Sem cobertura nessa janela.</div>}
              </div>
            </section>
          )}

          {activeView === "sentiment" && (
            <section className="view active">
              <div className="head"><div><span className="eyebrow">Sentimento</span><h2>Como a conversa está reagindo</h2></div><p>Percentual positivo/neutro/crítico baseado nos sinais disponíveis.</p></div>
              <div className="kpis three">
                {sentimentData.map((entry) => <div className="kpi" key={entry.name}><small>{entry.name}</small><strong>{pct(entry.value, scopedItems.length)}%</strong><span className="smallnote">{entry.value} sinais</span></div>)}
              </div>
              <div className="panel"><h3>Sentimento por semana</h3><div className="canvasbox"><ResponsiveContainer width="100%" height="100%"><BarChart data={snapshot.weeks.slice(-12)}><CartesianGrid strokeDasharray="3 3" stroke="#202942"/><XAxis dataKey="weekId" stroke="#9ba3bb"/><YAxis stroke="#69718e"/><Tooltip contentStyle={{ background: "#141b2e", border: "1px solid #28324f", color: "#efe6d3" }}/><Bar dataKey="positive" stackId="a" fill="#63c08c"/><Bar dataKey="neutral" stackId="a" fill="#8a90a6"/><Bar dataKey="negative" stackId="a" fill="#da6e6e"/></BarChart></ResponsiveContainer></div></div>
            </section>
          )}

          {activeView === "creators" && (
            <section className="view active">
              <div className="head"><div><span className="eyebrow">Creators</span><h2>Perfis em alta</h2></div><p>Creators inferidos de dados conectados, principalmente YouTube.</p></div>
              <table className="table"><thead><tr><th>Perfil</th><th>Plataforma</th><th>Fit</th><th>Score</th><th>Risco</th></tr></thead><tbody>{snapshot.creators.map((creator) => <tr key={creator.name}><td>{creator.name}</td><td>{creator.platform}</td><td>{creator.fit}</td><td>{creator.score}/100</td><td>{creator.risks.join(" ")}</td></tr>)}</tbody></table>
            </section>
          )}

          {activeView === "risks" && (
            <section className="view active">
              <div className="head"><div><span className="eyebrow">Radar de riscos</span><h2>Pontos de atenção</h2></div><p>Riscos derivados das conversas e matérias monitoradas.</p></div>
              <div className="riskgrid">{riskItems.map((item) => <a className="card link-card" key={item.id} href={cleanUrl(item.url)} target="_blank" rel="noreferrer"><div className="meta"><span className="pill neg">Risk {item.riskScore}</span><span className="pill neu">{item.weekId}</span></div><h4>{item.title}</h4><p>{item.sentimentReason}</p><small>Abrir fonte <ExternalLink size={12}/></small></a>)}</div>
            </section>
          )}

          {activeView === "opps" && (
            <section className="view active">
              <div className="head"><div><span className="eyebrow">Oportunidades</span><h2>Onde surfar a conversa</h2></div><p>Itens com maior potencial de PR, social, creators e CRM.</p></div>
              <div className="hero"><span className="eyebrow">Insight aplicável</span><h2>{currentWeek?.keyNarrative}</h2><p>{currentWeek?.whatChanged}</p><div className="facts"><div><small>Semana</small><b>{currentWeek?.weekId}</b></div><div><small>Opportunity</small><b>{currentWeek?.opportunityScore}/100</b></div><div><small>Buzz</small><b>{currentWeek?.buzzScore}/100</b></div></div></div>
              <div className="oppgrid">{opportunityItems.map((item) => <a className="card link-card" key={item.id} href={cleanUrl(item.url)} target="_blank" rel="noreferrer"><div className="meta"><span className="pill nos">Opp {item.opportunityScore}</span><span className="pill neu">{item.weekId}</span></div><h4>{item.title}</h4><p>{item.summary}</p><small>Abrir fonte <ExternalLink size={12}/></small></a>)}</div>
            </section>
          )}

          {activeView === "assistant" && (
            <section className="view active">
              <div className="head"><div><span className="eyebrow">AI Assistant</span><h2>Leitura executiva</h2></div><p>Resposta contextual baseada na semana selecionada.</p></div>
              <div className="panel assistant-box"><Search size={20}/><p><b>Leitura Lumos:</b> {currentWeek?.whatChanged} A narrativa principal é “{currentWeek?.keyNarrative}”. Próximo passo: abrir as fontes da aba Cobertura, validar as matérias de maior relevância e transformar os sinais positivos em pauta editorial.</p></div>
            </section>
          )}
        </div>
      </main>

      <div className="floating-exports">
        <button onClick={() => exportFile("csv")}><Download size={14}/> CSV</button>
        <button onClick={() => exportFile("ppt")}><Download size={14}/> PPT</button>
      </div>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
