"use client";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { TEASER_LAUNCH_DATE } from "@/lib/config";
import { buildSnapshot } from "@/lib/analysis";
import { seedItems } from "@/lib/mock-data";
import { IntelligenceSnapshot } from "@/lib/types";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { CommandCenter } from "@/components/command-center";
import { WeeklyArchive } from "@/components/weekly-archive";
import { ExecutiveBrief } from "@/components/executive-brief";
import { Charts } from "@/components/charts";
import { ItemsPanel } from "@/components/items-panel";
import { Timeline } from "@/components/timeline";
import { RisksOpportunities } from "@/components/risks-opportunities";
import { SourceMap } from "@/components/source-map";
import { Creators } from "@/components/creators";
import { AiAssistant } from "@/components/ai-assistant";
const initial = buildSnapshot(seedItems, TEASER_LAUNCH_DATE, new Date().toISOString().slice(0, 10));
export default function Page() {
  const [snapshot, setSnapshot] = useState<IntelligenceSnapshot>(initial);
  const [selectedWeek, setSelectedWeek] = useState(initial.currentWeekId);
  const [loading, setLoading] = useState(false);
  useEffect(() => { const saved = localStorage.getItem("lumos.v2.snapshot"); if (saved) { const parsed = JSON.parse(saved); setSnapshot(parsed); setSelectedWeek(parsed.currentWeekId); } }, []);
  async function update() {
    setLoading(true);
    try {
      const lastRun = localStorage.getItem("lumos.v2.lastRun") || undefined;
      const res = await fetch("/api/intelligence/update", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lastRun }) });
      if (!res.ok) throw new Error("Update failed");
      const data = await res.json();
      setSnapshot(data);
      setSelectedWeek(data.currentWeekId);
      localStorage.setItem("lumos.v2.snapshot", JSON.stringify(data));
      localStorage.setItem("lumos.v2.lastRun", new Date().toISOString().slice(0, 10));
      toast.success("Lumos Intelligence atualizado e historico preservado.");
    } catch {
      toast.error("Nao consegui atualizar agora. Mantive o historico local.");
    } finally { setLoading(false); }
  }
  async function exportFile(type: "csv" | "pdf" | "ppt") {
    const path = type === "ppt" ? "/api/export/ppt" : `/api/export/${type}`;
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ snapshot }) });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumos-weekly-intelligence.${type === "ppt" ? "pptx" : type}`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return <main className="flex"><Sidebar/><section className="min-w-0 flex-1"><Header loading={loading} onUpdate={update} onExport={exportFile}/><div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-8"><CommandCenter s={snapshot}/><WeeklyArchive s={snapshot} selectedWeek={selectedWeek} onSelectWeek={setSelectedWeek}/><ExecutiveBrief s={snapshot} selectedWeek={selectedWeek}/><Charts s={snapshot}/><div className="grid gap-5 xl:grid-cols-2"><Timeline s={snapshot} selectedWeek={selectedWeek}/><ItemsPanel s={snapshot} title="Signals da semana" selectedWeek={selectedWeek}/></div><SourceMap s={snapshot}/><div className="grid gap-5 xl:grid-cols-2"><ItemsPanel s={snapshot} title="YouTube Brasil" kind="youtube" selectedWeek={selectedWeek}/><ItemsPanel s={snapshot} title="Reddit" kind="reddit" selectedWeek={selectedWeek}/></div><div className="grid gap-5 xl:grid-cols-2"><ItemsPanel s={snapshot} title="X Signals" kind="x" selectedWeek={selectedWeek}/><ItemsPanel s={snapshot} title="Google Trends" kind="trends" selectedWeek={selectedWeek}/></div><Creators s={snapshot}/><RisksOpportunities s={snapshot}/><AiAssistant s={snapshot} selectedWeek={selectedWeek}/></div></section><Toaster richColors position="bottom-right"/></main>;
}
